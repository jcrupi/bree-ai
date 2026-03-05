import { getNatsService } from './nats';
import { ehash } from './chatterbox-hash';

export interface ChatterboxTurn {
  turnId?: string;
  convoId: string;
  appId: string;
  orgId: string;
  userId: string;
  questionEhash: string;
  answerEhash: string;
  resourceIds?: string[];
  metadata?: Record<string, any>;
}

export class ChatterboxClient {
  /**
   * Start a new convo or get existing envelope
   */
  static async startConvo(opts: {
    appId: string;
    orgId: string;
    userId: string;
    resourceIds?: string[];
  }) {
    const nats = await getNatsService();
    return await nats.request('chatterbox.convo.start', opts);
  }

  /**
   * Persist a turn to the store
   */
  static async storeTurn(turn: ChatterboxTurn) {
    const nats = await getNatsService();
    await nats.publish('chatterbox.convos.store', turn);
  }

  /**
   * Get assembled context (memory + recent turns ehashes)
   */
  static async getContext(convoId: string) {
    const nats = await getNatsService();
    return await nats.request(`chatterbox.context.${convoId}`, {});
  }

  /**
   * Create an ehash for a given user/org/content
   */
  static createEhash(orgId: string, userId: string, content: string): string {
    return ehash(orgId, userId, content);
  }
}
