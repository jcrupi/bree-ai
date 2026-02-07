import { connect, NatsConnection, StringCodec, Subscription } from 'nats';

// Message interfaces
export interface AgentMessage {
  agentId: string;
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AgentStatus {
  agentId: string;
  status: 'online' | 'offline' | 'busy';
  lastSeen: string;
  metadata?: Record<string, any>;
}

export interface AgentInfo {
  agentId: string;
  name?: string;
  type?: string;
  capabilities?: string[];
  status: AgentStatus;
}

/**
 * NATS Service Layer for AI Agent (Grapes) Communication
 * 
 * Provides connection management, pub/sub utilities, and agent discovery
 * for communicating with AI agents via NATS messaging.
 */
class NatsService {
  private connection: NatsConnection | null = null;
  private codec = StringCodec();
  private subscriptions: Map<string, Subscription> = new Map();
  private reconnecting = false;

  /**
   * Connect to NATS server
   */
  async connect(url?: string): Promise<void> {
    const natsUrl = url || process.env.NATS_URL || 'nats://localhost:4222';
    
    try {
      console.log(`📡 Connecting to NATS server at ${natsUrl}...`);
      
      this.connection = await connect({
        servers: natsUrl,
        user: process.env.NATS_USER,
        pass: process.env.NATS_PASSWORD,
        token: process.env.NATS_TOKEN,
        reconnect: true,
        maxReconnectAttempts: -1, // Infinite reconnects
        reconnectTimeWait: 2000,
      });

      console.log('✅ Connected to NATS server');

      // Handle connection events
      (async () => {
        if (!this.connection) return;
        
        for await (const status of this.connection.status()) {
          console.log(`📡 NATS Status: ${status.type}`);
          
          if (status.type === 'disconnect' || status.type === 'reconnecting') {
            this.reconnecting = true;
          } else if (status.type === 'reconnect') {
            this.reconnecting = false;
            console.log('✅ Reconnected to NATS server');
          }
        }
      })();

    } catch (error) {
      console.error('❌ Failed to connect to NATS:', error);
      throw error;
    }
  }

  /**
   * Disconnect from NATS server
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.drain();
      this.connection = null;
      this.subscriptions.clear();
      console.log('🔌 Disconnected from NATS');
    }
  }

  /**
   * Ensure connection exists
   */
  private ensureConnection(): NatsConnection {
    if (!this.connection) {
      throw new Error('NATS connection not established. Call connect() first.');
    }
    return this.connection;
  }

  /**
   * Publish a message to a subject
   */
  async publish(subject: string, data: any): Promise<void> {
    const nc = this.ensureConnection();
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    nc.publish(subject, this.codec.encode(payload));
  }

  /**
   * Request-reply pattern: send a request and wait for a response
   */
  async request(subject: string, data: any, timeout = 5000): Promise<any> {
    const nc = this.ensureConnection();
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    
    try {
      const response = await nc.request(
        subject,
        this.codec.encode(payload),
        { timeout }
      );
      
      const decoded = this.codec.decode(response.data);
      return JSON.parse(decoded);
    } catch (error: any) {
      if (error.code === 'TIMEOUT' || error.code === '503') {
        throw new Error(`Request timeout: No response from ${subject}`);
      }
      throw error;
    }
  }

  /**
   * Get JetStream context
   */
  jetstream() {
    return this.ensureConnection().jetstream();
  }

  /**
   * Subscribe to a subject (Core NATS)
   */
  async subscribe(
    subject: string,
    callback: (data: any) => void | Promise<void>
  ): Promise<() => void> {
    const nc = this.ensureConnection();
    const sub = nc.subscribe(subject);

    // Create unsubscribe function
    const unsubscribe = () => {
      sub.unsubscribe();
      this.subscriptions.delete(subject);
    };

    this.subscriptions.set(subject, sub);

    // Process messages asynchronously
    (async () => {
      for await (const msg of sub) {
        try {
          const decoded = this.codec.decode(msg.data);
          const data = JSON.parse(decoded);
          await callback(data);
        } catch (error) {
          console.error(`Error processing message from ${subject}:`, error);
        }
      }
    })();

    return unsubscribe;
  }

  /**
   * Discover all connected agents
   * 
   * This sends a discovery request to all agents listening on the
   * 'agents.discovery' subject and collects their responses.
   */
  async discoverAgents(timeout = 2000): Promise<AgentInfo[]> {
    const nc = this.ensureConnection();
    const agents: AgentInfo[] = [];
    
    try {
      // Request agent info from all agents
      const subject = 'agents.discovery';
      const msg = await nc.request(
        subject,
        this.codec.encode(JSON.stringify({ action: 'discover' })),
        { timeout }
      );

      const decoded = this.codec.decode(msg.data);
      const response = JSON.parse(decoded);
      
      // Response could be a single agent or array of agents
      if (Array.isArray(response)) {
        agents.push(...response);
      } else if (response.agentId) {
        agents.push(response);
      }
    } catch (error: any) {
      // If no agents respond, just return empty array
      if (error.code !== 'TIMEOUT' && error.code !== '503') {
        console.error('Error discovering agents:', error);
      }
    }

    return agents;
  }

  /**
   * Get status of a specific agent
   */
  async getAgentStatus(agentId: string): Promise<AgentStatus | null> {
    try {
      const response = await this.request(`agents.${agentId}.status`, {
        action: 'status'
      }, 2000);
      
      return response as AgentStatus;
    } catch (error) {
      console.error(`Failed to get status for agent ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Send a message to a specific agent
   */
  async sendMessageToAgent(agentId: string, message: AgentMessage): Promise<void> {
    await this.publish(`agents.${agentId}.messages`, message);
  }

  /**
   * Subscribe to agent events/updates
   */
  async subscribeToAgent(
    agentId: string,
    callback: (data: any) => void | Promise<void>
  ): Promise<() => void> {
    return this.subscribe(`agents.${agentId}.events`, callback);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection !== null && !this.reconnecting;
  }
}

// Singleton instance
let natsService: NatsService | null = null;

/**
 * Get the NATS service instance (singleton)
 */
export async function getNatsService(): Promise<NatsService> {
  if (!natsService) {
    natsService = new NatsService();
    await natsService.connect();
  }
  return natsService;
}

/**
 * Disconnect and cleanup NATS service
 */
export async function closeNatsService(): Promise<void> {
  if (natsService) {
    await natsService.disconnect();
    natsService = null;
  }
}
