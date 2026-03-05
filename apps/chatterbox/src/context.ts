import { getConvo, readByConvoId } from './memory-store.js';
import { getLatestMemoryByConvoId } from './smart-memory.js';
import { type AssembledContext, QueryRequestSchema } from './types.js';

export function assembleContext(convoId: string): AssembledContext | null {
  const convo = getConvo(convoId);
  if (!convo) return null;

  const latestMemory = getLatestMemoryByConvoId(convoId) ?? undefined;
  
  // We need to fetch the turns that happened AFTER the latest memory.
  // The easiest way via memory-store is get all turns and slice,
  // or we can just read all turns and find the index.
  const allTurns = readByConvoId(
    convoId,
    QueryRequestSchema.parse({ limit: 500 }) // Assuming <= 500 turns total per convo
  ).turns;
  
  let recentTurns = allTurns;
  
  if (latestMemory) {
    // Find the turn where this memory ended
    const idx = allTurns.findIndex(t => t.turnId === latestMemory.turnRangeEnd);
    if (idx !== -1) {
      recentTurns = allTurns.slice(idx + 1);
    }
  }

  return {
    convoId,
    contextId:            convo.currentContextId,
    smartMemoryEnabled:   convo.smartMemoryEnabled,
    latestMemory,
    recentTurns,
    recentTurnCount:      recentTurns.length,
    turnsUntilNextMemory: convo.memoryThreshold - convo.turnsSinceLastMemory,
  };
}
