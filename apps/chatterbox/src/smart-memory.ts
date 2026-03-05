import { SmartMemorySchema, type SmartMemory } from './types.js';

const memories: SmartMemory[] = [];
// Index: convoId → memoryId → SmartMemory
const convoMemories = new Map<string, Map<string, SmartMemory>>();

// ── Write ─────────────────────────────────────────────────────────────────────

export function indexSmartMemory(raw: unknown): SmartMemory {
  const parsed = SmartMemorySchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid SmartMemory: ${parsed.error.message}`);
  }

  const memory = parsed.data;

  memories.push(memory);

  let convoMap = convoMemories.get(memory.convoId);
  if (!convoMap) {
    convoMap = new Map();
    convoMemories.set(memory.convoId, convoMap);
  }
  convoMap.set(memory.memoryId, memory);

  return memory;
}

// ── Read ──────────────────────────────────────────────────────────────────────

export function readMemoryById(memoryId: string): SmartMemory | null {
  return memories.find((m) => m.memoryId === memoryId) ?? null;
}

export function readMemoriesByConvoId(convoId: string): SmartMemory[] {
  const convoMap = convoMemories.get(convoId);
  if (!convoMap) return [];
  // return chronologically (since they are pushed to the map sequentially, or we can sort by createdAt)
  return Array.from(convoMap.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function getLatestMemoryByConvoId(convoId: string): SmartMemory | null {
  const all = readMemoriesByConvoId(convoId);
  return all.length > 0 ? all[all.length - 1] : null;
}
