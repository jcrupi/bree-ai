import { ulid } from 'ulid';
import { getConvo } from './memory-store.js';
import { indexSmartMemory, getLatestMemoryByConvoId, readMemoriesByConvoId, readMemoryById } from './smart-memory.js';
import { createSummary, type TurnText } from './summarizer.js';
import { getNatsConnection } from './store.js';

export async function generateAndStoreMemory(opts: {
  convoId: string;
  turns:   TurnText[];  // The plaintext passed in by the caller
  model?:  string;
}) {
  const convo = getConvo(opts.convoId);
  if (!convo) {
    throw new Error('Convo not found');
  }

  const latestMemory = getLatestMemoryByConvoId(opts.convoId);
  const previousSummary = latestMemory ? latestMemory.summary : null;

  // Call AI summarizer
  const summary = await createSummary(previousSummary, opts.turns, opts.model);

  // Note: we don't have true turn ranges since the caller just passes the text.
  // We can track the count that went into this memory.
  const memoryId = ulid();

  const newMemory = indexSmartMemory({
    memoryId,
    convoId:        opts.convoId,
    contextId:      convo.currentContextId,
    parentMemoryId: latestMemory?.memoryId,
    summary,
    turnsIncluded:  opts.turns.length,
    turnRangeStart: 'unknown',
    turnRangeEnd:   'unknown',
    model:          opts.model ?? 'claude-3-5-haiku-20241022',
  });

  // Reset convo counters and link latest memory
  convo.turnCount = (convo.turnCount || 0); // ensure it exists
  convo.turnsSinceLastMemory = 0;
  convo.latestMemoryId = memoryId;
  convo.updatedAt = new Date().toISOString();

  // Publish memory created event
  const nc = getNatsConnection();
  if (nc) {
    nc.publish(
      `chatterbox.memory.created.${opts.convoId}`,
      JSON.stringify(newMemory)
    );
  }

  return newMemory;
}

export function getMemories(convoId: string) {
  return readMemoriesByConvoId(convoId);
}

export function getMemory(memoryId: string) {
  return readMemoryById(memoryId);
}

export function getLatestMemory(convoId: string) {
  return getLatestMemoryByConvoId(convoId);
}
