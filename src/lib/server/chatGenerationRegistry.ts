type ChatGenerationStatus = "running" | "completed" | "failed";

interface ChatGenerationRecord {
  chatId: string;
  userId: string;
  status: ChatGenerationStatus;
  startedAt: number;
  updatedAt: number;
  error?: string;
}

export interface ChatGenerationSnapshot {
  status: "idle" | ChatGenerationStatus;
  startedAt?: number;
  updatedAt?: number;
  error?: string;
}

const COMPLETED_TTL_MS = 5 * 60 * 1000;
const generationRegistry = new Map<string, ChatGenerationRecord>();

function getKey(chatId: string, userId: string): string {
  return `${userId}:${chatId}`;
}

function cleanupRegistry(now = Date.now()) {
  for (const [key, record] of generationRegistry.entries()) {
    if (record.status === "running") continue;
    if (now - record.updatedAt > COMPLETED_TTL_MS) {
      generationRegistry.delete(key);
    }
  }
}

export function markChatGenerationRunning(chatId: string, userId: string) {
  const now = Date.now();
  cleanupRegistry(now);

  generationRegistry.set(getKey(chatId, userId), {
    chatId,
    userId,
    status: "running",
    startedAt: now,
    updatedAt: now,
  });
}

export function markChatGenerationCompleted(chatId: string, userId: string) {
  const key = getKey(chatId, userId);
  const now = Date.now();
  const existing = generationRegistry.get(key);

  generationRegistry.set(key, {
    chatId,
    userId,
    status: "completed",
    startedAt: existing?.startedAt ?? now,
    updatedAt: now,
  });

  cleanupRegistry(now);
}

export function markChatGenerationFailed(chatId: string, userId: string, error?: string) {
  const key = getKey(chatId, userId);
  const now = Date.now();
  const existing = generationRegistry.get(key);

  generationRegistry.set(key, {
    chatId,
    userId,
    status: "failed",
    startedAt: existing?.startedAt ?? now,
    updatedAt: now,
    error,
  });

  cleanupRegistry(now);
}

export function clearChatGenerationState(chatId: string, userId: string) {
  generationRegistry.delete(getKey(chatId, userId));
}

export function getChatGenerationSnapshot(
  chatId: string,
  userId: string,
): ChatGenerationSnapshot {
  cleanupRegistry();
  const record = generationRegistry.get(getKey(chatId, userId));

  if (!record) {
    return { status: "idle" };
  }

  return {
    status: record.status,
    startedAt: record.startedAt,
    updatedAt: record.updatedAt,
    error: record.error,
  };
}
