import { connect, type NatsConnection, JSONCodec, type Msg, type JetStreamClient, type JetStreamManager, type PubAck } from "nats";
import type {
  AgentMetadata,
  AgentRequest,
  AgentResponse,
  LifecycleEvent,
  AgentType,
  AgentStatus,
  AgentManifest,
} from "./types";
import { SUBJECTS, STREAMS } from "./types";

export interface CollectiveAgentConfig {
  agentId: string;
  agentType: AgentType;
  capabilities?: string[];
  natsUrl?: string;
  version?: string;
  description?: string;
  manifest?: AgentManifest;
  metadata?: Record<string, any>;
}

export class CollectiveAgent {
  private nc: NatsConnection | null = null;
  private jc = JSONCodec();
  private config: CollectiveAgentConfig;
  private handlers = new Map<string, (msg: Msg) => Promise<void>>();
  private js: JetStreamClient | null = null;
  private jsm: JetStreamManager | null = null;

  constructor(config: CollectiveAgentConfig) {
    this.config = {
      natsUrl: "localhost:4222",
      version: "0.1.0",
      ...config,
    };
  }

  /**
   * Connect to NATS and announce presence
   */
  async connect(): Promise<void> {
    try {
      this.nc = await connect({ 
        servers: this.config.natsUrl!,
        name: this.config.agentId,
        reconnect: true,
        maxReconnectAttempts: -1, // Infinite reconnect
        waitOnFirstConnect: true
      });
      console.log(`[${this.config.agentId}] Connected to NATS`);

      // Initialize JetStream
      this.js = this.nc.jetstream();
      this.jsm = await this.nc.jetstreamManager();

      // Ensure Core Streams exist
      await this.ensureCoreStreams();

      // Register standard handlers
      await this.registerStandardHandlers();

      // Announce UP status
      await this.publishLifecycle("UP");

      // Listen for discovery requests
      await this.subscribeToDiscovery();

      // Handle graceful shutdown
      this.setupShutdownHandlers();
    } catch (err) {
      console.error(`[${this.config.agentId}] Failed to connect to NATS:`, err);
      throw err;
    }
  }

  /**
   * Register standard handlers (ping, manifest)
   */
  private async registerStandardHandlers(): Promise<void> {
    // PING handler
    await this.handle(`agent.${this.config.agentId}.ping`, async () => {
      return {
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };
    });

    // MANIFEST handler
    await this.handle(`agent.${this.config.agentId}.manifest`, async () => {
      return this.getFullManifest();
    });
  }

  /**
   * Get full manifest with metadata
   */
  getFullManifest(): any {
    return {
      name: this.config.agentId,
      version: this.config.version,
      description: this.config.description,
      capabilities: this.config.capabilities || [],
      ...this.config.manifest,
      endpoints: this.config.manifest?.endpoints.map(ep => ({
        ...ep,
        natsSubject: `${this.config.manifest?.natsPrefix}.${ep.action}`
      })) || []
    };
  }

  /**
   * Publish lifecycle event
   */
  async publishLifecycle(status: AgentStatus, metadata?: Record<string, any>): Promise<PubAck | void> {
    if (!this.nc || !this.js) throw new Error("Not connected to NATS");

    const event: LifecycleEvent = {
      status,
      type: this.config.agentType,
      capabilities: this.config.capabilities,
      version: this.config.version,
      description: this.config.description,
      manifest: this.config.manifest,
      timestamp: new Date().toISOString(),
      metadata: {
        ...(this.config.metadata || {}),
        ...(metadata || {})
      }
    };

    const subject = SUBJECTS.LIFECYCLE(this.config.agentId);
    console.log(`[${this.config.agentId}] Published lifecycle: ${status}`);
    
    // JS Publish for persistence
    return this.js.publish(subject, this.jc.encode(event));
  }

  /**
   * Subscribe to discovery requests
   */
  private async subscribeToDiscovery(): Promise<void> {
    if (!this.nc) return;

    const sub = this.nc.subscribe(SUBJECTS.DISCOVERY);
    (async () => {
      for await (const _ of sub) {
        console.log(`[${this.config.agentId}] Responding to discovery request`);
        await this.publishLifecycle("UP");
      }
    })();
  }

  /**
   * Register a request handler
   */
  async handle<TReq = any, TRes = any>(
    subject: string,
    handler: (payload: TReq) => Promise<TRes>
  ): Promise<void> {
    if (!this.nc) throw new Error("Not connected to NATS");

    const sub = this.nc.subscribe(subject);
    
    const messageHandler = async (m: Msg) => {
      try {
        const request = this.jc.decode(m.data) as AgentRequest<TReq>;
        console.log(`[${this.config.agentId}] Handling ${subject}`);

        const result = await handler(request.payload || request as any);
        
        const response: AgentResponse<TRes> = {
          success: true,
          data: result,
          requestId: request.requestId,
          timestamp: new Date().toISOString(),
        };

        m.respond(this.jc.encode(response));
      } catch (err) {
        const response: AgentResponse = {
          success: false,
          error: err instanceof Error ? err.message : String(err),
          timestamp: new Date().toISOString(),
        };
        m.respond(this.jc.encode(response));
      }
    };

    this.handlers.set(subject, messageHandler);

    (async () => {
      for await (const m of sub) {
        await messageHandler(m);
      }
    })();

    console.log(`[${this.config.agentId}] Registered handler for ${subject}`);
  }

  /**
   * Register a persistent task handler using JetStream Pull Subscriptions
   * This ensures "at-least-once" delivery and durability.
   */
  async task<TReq = any>(
    subject: string,
    durable: string,
    handler: (payload: TReq, msg: Msg) => Promise<void>
  ): Promise<void> {
    if (!this.js) throw new Error("JetStream not initialized");

    console.log(`[${this.config.agentId}] Registering persistent task: ${subject} (${durable})`);

    const sub = await this.js.pullSubscribe(subject, { durable });

    (async () => {
      for await (const m of sub) {
        try {
          const request = this.jc.decode(m.data) as any;
          // Extract payload if it follows AgentRequest format, otherwise use as-is
          const payload = request.payload || request;
          
          await handler(payload, m);
          m.ack();
        } catch (err) {
          console.error(`[${this.config.agentId}] Task error on ${subject}:`, err);
          // No ack -> JetStream will redeliver based on AckWait
        }
      }
    })();
  }

  /**
   * Send a request to another agent
   */
  async request<TReq = any, TRes = any>(
    subject: string,
    payload: TReq,
    timeoutMs = 5000
  ): Promise<TRes> {
    if (!this.nc) throw new Error("Not connected to NATS");

    const request: AgentRequest<TReq> = {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      payload,
    };

    const msg = await this.nc.request(subject, this.jc.encode(request), { timeout: timeoutMs });
    const response = this.jc.decode(msg.data) as AgentResponse<TRes>;

    if (!response.success) {
      throw new Error(response.error || "Request failed");
    }

    return response.data!;
  }

  /**
   * Publish a message to a subject
   */
  publish(subject: string, payload: any): void {
    if (!this.nc) throw new Error("Not connected to NATS");
    this.nc.publish(subject, this.jc.encode(payload));
  }

  /**
   * Publish a log message
   */
  async publishLog(level: string, message: string, metadata?: Record<string, any>): Promise<PubAck | void> {
    if (!this.nc || !this.js) return;

    const subject = SUBJECTS.LOGS(this.config.agentId);
    return this.js.publish(
      subject,
      this.jc.encode({
        level,
        message,
        timestamp: new Date().toISOString(),
        ...metadata,
      })
    );
  }

  /**
   * Setup graceful shutdown
   */
  private setupShutdownHandlers(): void {
    const shutdown = async () => {
      console.log(`\n[${this.config.agentId}] Shutting down...`);
      await this.publishLifecycle("DOWN");
      await this.nc?.flush();
      await this.nc?.close();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }

  /**
   * Publish a message via JetStream
   */
  async publishJS(subject: string, payload: any): Promise<void> {
    const js = this.jetstream();
    await js.publish(subject, this.jc.encode(payload));
  }

  /**
   * Ensure a JetStream stream exists
   */
  async ensureStream(name: string, subjects: string[]): Promise<void> {
    const jsm = await this.jetstreamManager();
    try {
        await jsm.streams.info(name);
        console.log(`[${this.config.agentId}] JetStream stream ${name} already exists.`);
    } catch (err) {
        await jsm.streams.add({ name, subjects });
        console.log(`[${this.config.agentId}] Created JetStream stream ${name} for subjects: ${subjects.join(', ')}`);
    }
  }

  /**
   * Get the JetStream client
   */
  jetstream(): JetStreamClient {
    if (!this.js) throw new Error("JetStream not initialized. Call connect() first.");
    return this.js;
  }

  /**
   * Get the JetStream manager
   */
  async jetstreamManager(): Promise<JetStreamManager> {
    if (!this.jsm) {
        if (!this.nc) throw new Error("Not connected to NATS");
        this.jsm = await this.nc.jetstreamManager();
    }
    return this.jsm;
  }

  /**
   * Get the NATS connection (for advanced usage)
   */
  getConnection(): NatsConnection | null {
    return this.nc;
  }

  /**
   * Publish an event via JetStream
   */
  async publishEvent(topic: string, payload: any): Promise<PubAck> {
    const subject = `events.${this.config.agentId}.${topic}`;
    return this.publishJS(subject, payload);
  }

  /**
   * Internal: Ensure Core Streams
   */
  private async ensureCoreStreams(): Promise<void> {
    // AGENTS stream for lifecycle and discovery
    await this.ensureStream(STREAMS.AGENTS, ["agent.lifecycle.>", "agent.discovery"]);
    
    // LOGS stream
    await this.ensureStream(STREAMS.LOGS, ["logs.agent.>"]);
    
    // EVENTS stream
    await this.ensureStream(STREAMS.EVENTS, ["events.>"]);

    // TASKS stream
    await this.ensureStream(STREAMS.TASKS, ["agent.tasks"]);
  }
}
