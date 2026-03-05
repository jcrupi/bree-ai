// ── Data model mirroring chatterbox backend types ─────────────────────────────

export interface ConvoTurn {
  turnId:          string;
  convoId:         string;
  contextId:       string;
  parentContextId?: string;
  appId:           string;
  orgId:           string;
  userId:          string;
  claims:          Record<string, unknown>;
  questionEhash:   string;
  answerEhash:     string;
  resourceIds:     string[];
  metadata:        Record<string, unknown>;
  ts:              string;
}

export interface Convo {
  convoId:            string;
  appId:              string;
  orgId:              string;
  userId:             string;
  currentContextId:   string;
  contextHistory:     string[];
  turns?:             ConvoTurn[];
  smartMemoryEnabled: boolean;
  memoryThreshold:    number;
  turnsSinceLastMemory: number;
  latestMemoryId?:    string;
  turnCount:          number;
  createdAt:          string;
  updatedAt:          string;
}

export interface SmartMemory {
  memoryId:       string;
  convoId:        string;
  contextId:      string;
  summary:        string;
  turnsIncluded:  number;
  turnRangeStart: string;
  turnRangeEnd:   string;
  createdAt:      string;
}

export interface QueryResult {
  turns:      ConvoTurn[];
  nextCursor: string | null;
  total:      number;
}

export interface ConvoResult {
  convos:     Convo[];
  nextCursor: string | null;
  total:      number;
}

export type QueryAxis = 'all' | 'app' | 'org' | 'user' | 'ehash' | 'turn' | 'convo';

export interface TurnStats {
  total:   number;
  byApp:   Record<string, number>;
  byOrg:   Record<string, number>;
  byUser:  Record<string, number>;
  byConvo: Record<string, number>;
}
