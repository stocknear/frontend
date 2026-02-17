export type ChatRole = "user" | "system";

export interface ChatSource {
  name?: string;
  description?: string;
  function?: string;
  ticker?: string;
  timestamp?: string;
  type?: string;
  url?: string;
}

export interface ChatMessage {
  role: ChatRole;
  content: string;
  sources?: ChatSource[];
  relatedQuestions?: string[];
}

export interface ChatModelMessage {
  role: ChatRole;
  content: string;
}

export const CHAT_ID_REGEX = /^[a-z0-9]{15}$/;

const STORED_MAX_MESSAGES = 150;
const STORED_MAX_CONTENT_CHARS = 20_000;
const STORED_MAX_TOTAL_CHARS = 350_000;
const STORED_MAX_SOURCES_PER_MESSAGE = 40;
const STORED_MAX_RELATED_QUESTIONS = 12;
const STORED_MAX_RELATED_QUESTION_CHARS = 300;

const MODEL_MAX_MESSAGES = 20;
const MODEL_MAX_TOTAL_CHARS = 50_000;
const MODEL_MAX_CONTENT_CHARS = 8_000;
const MODEL_SCAN_TAIL_MESSAGES = 200;

const SOURCE_FIELD_LIMITS = {
  name: 200,
  description: 700,
  function: 100,
  ticker: 20,
  timestamp: 80,
  type: 40,
  url: 2048,
} as const;

type ValidateResult =
  | { ok: true; messages: ChatMessage[] }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coerceRawMessages(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
}

function ensureBoundedString(
  value: unknown,
  maxLength: number,
  fieldName: string,
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string") {
    return { ok: false, error: `${fieldName} must be a string` };
  }

  if (value.length > maxLength) {
    return { ok: false, error: `${fieldName} is too long` };
  }

  return { ok: true, value };
}

function sanitizeSources(rawSources: unknown): ValidateResult | { ok: true; sources?: ChatSource[] } {
  if (rawSources === undefined) {
    return { ok: true };
  }

  if (!Array.isArray(rawSources)) {
    return { ok: false, error: "sources must be an array" };
  }

  if (rawSources.length > STORED_MAX_SOURCES_PER_MESSAGE) {
    return { ok: false, error: "Too many sources in a single message" };
  }

  const sources: ChatSource[] = [];

  for (const source of rawSources) {
    if (!isRecord(source)) continue;

    const sanitized: ChatSource = {};

    for (const [field, maxLength] of Object.entries(SOURCE_FIELD_LIMITS)) {
      if (source[field] === undefined) continue;

      const validated = ensureBoundedString(source[field], maxLength, `sources.${field}`);
      if (!validated.ok) return validated;

      sanitized[field as keyof ChatSource] = validated.value;
    }

    if (Object.keys(sanitized).length > 0) {
      sources.push(sanitized);
    }
  }

  return { ok: true, sources: sources.length > 0 ? sources : undefined };
}

function sanitizeRelatedQuestions(
  rawQuestions: unknown,
): ValidateResult | { ok: true; relatedQuestions?: string[] } {
  if (rawQuestions === undefined) {
    return { ok: true };
  }

  if (!Array.isArray(rawQuestions)) {
    return { ok: false, error: "relatedQuestions must be an array" };
  }

  if (rawQuestions.length > STORED_MAX_RELATED_QUESTIONS) {
    return { ok: false, error: "Too many related questions" };
  }

  const relatedQuestions: string[] = [];

  for (const question of rawQuestions) {
    if (typeof question !== "string") {
      return { ok: false, error: "Each related question must be a string" };
    }

    if (question.length === 0 || question.length > STORED_MAX_RELATED_QUESTION_CHARS) {
      return {
        ok: false,
        error: "Related question length is invalid",
      };
    }

    relatedQuestions.push(question);
  }

  return {
    ok: true,
    relatedQuestions: relatedQuestions.length > 0 ? relatedQuestions : undefined,
  };
}

export function validateStoredChatMessages(raw: unknown): ValidateResult {
  const rawMessages = coerceRawMessages(raw);

  if (!rawMessages) {
    return { ok: false, error: "messages must be an array" };
  }

  if (rawMessages.length > STORED_MAX_MESSAGES) {
    return { ok: false, error: "Too many messages in thread" };
  }

  const messages: ChatMessage[] = [];
  let totalChars = 0;

  for (const rawMessage of rawMessages) {
    if (!isRecord(rawMessage)) {
      return { ok: false, error: "Invalid message format" };
    }

    const role = rawMessage.role;
    if (role !== "user" && role !== "system") {
      return { ok: false, error: "Invalid message role" };
    }

    const contentValidation = ensureBoundedString(
      rawMessage.content,
      STORED_MAX_CONTENT_CHARS,
      "content",
    );
    if (!contentValidation.ok) return contentValidation;

    const content = contentValidation.value;
    if (role === "user" && content.length === 0) {
      return { ok: false, error: "User messages cannot be empty" };
    }

    totalChars += content.length;
    if (totalChars > STORED_MAX_TOTAL_CHARS) {
      return { ok: false, error: "Message payload is too large" };
    }

    const sourcesResult = sanitizeSources(rawMessage.sources);
    if (!sourcesResult.ok) return sourcesResult;

    const relatedResult = sanitizeRelatedQuestions(rawMessage.relatedQuestions);
    if (!relatedResult.ok) return relatedResult;

    const sanitizedMessage: ChatMessage = {
      role,
      content,
    };

    if (sourcesResult.sources) {
      sanitizedMessage.sources = sourcesResult.sources;
    }

    if (relatedResult.relatedQuestions) {
      sanitizedMessage.relatedQuestions = relatedResult.relatedQuestions;
    }

    messages.push(sanitizedMessage);
  }

  return { ok: true, messages };
}

export function normalizeChatMessagesForModel(raw: unknown): ChatModelMessage[] {
  const rawMessages = coerceRawMessages(raw);
  if (!rawMessages) return [];

  const tail = rawMessages.slice(-MODEL_SCAN_TAIL_MESSAGES);
  const normalized: ChatModelMessage[] = [];

  for (const rawMessage of tail) {
    if (!isRecord(rawMessage)) continue;

    const role = rawMessage.role;
    const content = rawMessage.content;

    if ((role !== "user" && role !== "system") || typeof content !== "string") {
      continue;
    }

    if (content.length === 0) continue;

    normalized.push({
      role,
      content:
        content.length > MODEL_MAX_CONTENT_CHARS
          ? content.slice(-MODEL_MAX_CONTENT_CHARS)
          : content,
    });
  }

  const bounded: ChatModelMessage[] = [];
  let totalChars = 0;

  for (let i = normalized.length - 1; i >= 0; i--) {
    if (bounded.length >= MODEL_MAX_MESSAGES) break;

    const current = normalized[i];
    if (totalChars + current.content.length > MODEL_MAX_TOTAL_CHARS) {
      if (bounded.length === 0) {
        bounded.unshift({
          role: current.role,
          content: current.content.slice(-MODEL_MAX_TOTAL_CHARS),
        });
      }
      break;
    }

    bounded.unshift(current);
    totalChars += current.content.length;
  }

  return bounded;
}
