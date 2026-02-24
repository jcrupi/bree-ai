import type { NatsConnection } from "nats";

/**
 * AgentX Storage Client
 * Provides a simple interface for agents to use centralized storage
 */
export class AgentXStorageClient {
  constructor(
    private nc: NatsConnection,
    private jc: any,
    private agentName: string
  ) {}

  /**
   * Store data
   */
  async set(path: string, content: string | Buffer): Promise<void> {
    const response = await this.nc.request(
      "agentx.storage.set",
      this.jc.encode({
        agent: this.agentName,
        path,
        content: typeof content === "string" ? content : content.toString("base64"),
      }),
      { timeout: 5000 }
    );

    const result = this.jc.decode(response.data);
    if (!result.success) {
      throw new Error(result.error || "Failed to store data");
    }
  }

  /**
   * Retrieve data
   */
  async get(path: string): Promise<string | null> {
    const response = await this.nc.request(
      "agentx.storage.get",
      this.jc.encode({
        agent: this.agentName,
        path,
      }),
      { timeout: 5000 }
    );

    const result = this.jc.decode(response.data);
    if (!result.success) {
      if (result.error === "Not found") {
        return null;
      }
      throw new Error(result.error || "Failed to retrieve data");
    }

    return result.data;
  }

  /**
   * Retrieve binary data
   */
  async getBinary(path: string): Promise<Buffer | null> {
    const response = await this.nc.request(
      "agentx.storage.getBinary",
      this.jc.encode({
        agent: this.agentName,
        path,
      }),
      { timeout: 5000 }
    );

    const result = this.jc.decode(response.data);
    if (!result.success) {
      if (result.error === "Not found") {
        return null;
      }
      throw new Error(result.error || "Failed to retrieve binary data");
    }

    return Buffer.from(result.data, "base64");
  }

  /**
   * List files
   */
  async list(pattern?: string): Promise<string[]> {
    const response = await this.nc.request(
      "agentx.storage.list",
      this.jc.encode({
        agent: this.agentName,
        pattern,
      }),
      { timeout: 5000 }
    );

    const result = this.jc.decode(response.data);
    if (!result.success) {
      throw new Error(result.error || "Failed to list files");
    }

    return result.data;
  }

  /**
   * Delete data
   */
  async delete(path: string): Promise<boolean> {
    const response = await this.nc.request(
      "agentx.storage.delete",
      this.jc.encode({
        agent: this.agentName,
        path,
      }),
      { timeout: 5000 }
    );

    const result = this.jc.decode(response.data);
    if (!result.success) {
      throw new Error(result.error || "Failed to delete data");
    }

    return result.data.deleted;
  }

  /**
   * Check if path exists
   */
  async exists(path: string): Promise<boolean> {
    const response = await this.nc.request(
      "agentx.storage.exists",
      this.jc.encode({
        agent: this.agentName,
        path,
      }),
      { timeout: 5000 }
    );

    const result = this.jc.decode(response.data);
    if (!result.success) {
      throw new Error(result.error || "Failed to check existence");
    }

    return result.data.exists;
  }

  /**
   * Get file metadata
   */
  async metadata(path: string): Promise<any | null> {
    const response = await this.nc.request(
      "agentx.storage.metadata",
      this.jc.encode({
        agent: this.agentName,
        path,
      }),
      { timeout: 5000 }
    );

    const result = this.jc.decode(response.data);
    if (!result.success) {
      if (result.error === "Not found") {
        return null;
      }
      throw new Error(result.error || "Failed to get metadata");
    }

    return result.data;
  }

  /**
   * Get storage stats
   */
  async stats(): Promise<{ files: number; size: number }> {
    const response = await this.nc.request(
      "agentx.storage.stats",
      this.jc.encode({
        agent: this.agentName,
      }),
      { timeout: 5000 }
    );

    const result = this.jc.decode(response.data);
    if (!result.success) {
      throw new Error(result.error || "Failed to get stats");
    }

    return result.data;
  }
}
