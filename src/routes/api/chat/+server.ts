import type { RequestHandler } from "./$types";
import { getCreditFromQuery, agentOptions } from "$lib/utils";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";
import {
  CHAT_ID_REGEX,
  normalizeChatMessagesForModel,
  validateStoredChatMessages,
  recoverChatMessages,
  sanitizeSourcesLenient,
  trimToMaxMessages,
  type ChatMessage,
} from "$lib/server/chatValidation";
import {
  getChatGenerationSnapshot,
  markChatGenerationRunning,
  markChatGenerationCompleted,
  markChatGenerationFailed,
} from "$lib/server/chatGenerationRegistry";

const INSUFFICIENT_CREDITS_ERROR =
  "Insufficient credits. Credits are reset at the start of each month.";

const userCreditLocks = new Map<string, Promise<void>>();

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function withUserCreditLock<T>(userId: string, task: () => Promise<T>): Promise<T> {
  const previous = userCreditLocks.get(userId) ?? Promise.resolve();
  let release: () => void = () => {};
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });

  userCreditLocks.set(userId, previous.then(() => current));

  await previous;
  try {
    return await task();
  } finally {
    release();
    if (userCreditLocks.get(userId) === current) {
      userCreditLocks.delete(userId);
    }
  }
}

async function reserveCredits(
  pb: App.Locals["pb"],
  userId: string,
  costOfCredit: number,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  return withUserCreditLock(userId, async () => {
    try {
      const latestUser = await pb.collection("users").getOne(userId, {
        fields: "id,credits",
      });

      const currentCredits = Number(latestUser?.credits ?? 0);
      if (!Number.isFinite(currentCredits) || currentCredits < costOfCredit) {
        return { ok: false, status: 400, error: INSUFFICIENT_CREDITS_ERROR };
      }

      const updatedUser = await pb.collection("users").update(
        userId,
        {
          "credits-": costOfCredit,
        },
        { fields: "id,credits" },
      );

      const remainingCredits = Number(updatedUser?.credits ?? 0);
      if (Number.isFinite(remainingCredits) && remainingCredits < 0) {
        await pb.collection("users").update(userId, {
          "credits+": costOfCredit,
        });
        return { ok: false, status: 400, error: INSUFFICIENT_CREDITS_ERROR };
      }

      return { ok: true };
    } catch (e) {
      console.error("Credit reservation error:", e);
      return {
        ok: false,
        status: 500,
        error: "Failed to process credits",
      };
    }
  });
}

async function refundCredits(pb: App.Locals["pb"], userId: string, costOfCredit: number) {
  try {
    await pb.collection("users").update(userId, {
      "credits+": costOfCredit,
    });
  } catch (refundError) {
    console.error("Credit refund error:", refundError);
  }
}

function applyGeneratedSystemMessage(
  baseMessages: ChatMessage[],
  query: string,
  systemMessage: ChatMessage,
): ChatMessage[] {
  const messages = [...baseMessages];
  const last = messages[messages.length - 1];
  const secondLast = messages[messages.length - 2];

  if (
    last?.role === "system" &&
    secondLast?.role === "user" &&
    secondLast.content === query
  ) {
    messages[messages.length - 1] = systemMessage;
    return messages;
  }

  if (last?.role === "user" && last.content === query) {
    messages.push(systemMessage);
    return messages;
  }

  messages.push({ content: query, role: "user" }, systemMessage);
  return messages;
}

function extractStreamStateFromLine(
  line: string,
  state: { fullResponse: string; collectedSources: unknown[] },
) {
  if (!line.trim()) return;

  try {
    const parsed = JSON.parse(line);
    if (typeof parsed?.content === "string") {
      state.fullResponse = parsed.content;
    }
    if (parsed?.event === "sources" && Array.isArray(parsed?.sources)) {
      state.collectedSources = parsed.sources;
    }
  } catch {
    // Ignore parse errors for individual lines.
  }
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const { apiURL, apiKey, user, pb, clientIp } = locals;

  const userId = typeof user?.id === "string" ? user.id : "";
  if (!userId) {
    return jsonResponse({ error: "Authentication required" }, 401);
  }

  const rateLimit = checkRateLimit(clientIp, "chatMessage", RATE_LIMITS.chatMessage);
  if (!rateLimit.allowed) {
    return jsonResponse(
      { error: "Too many requests. Please try again later." },
      429,
    );
  }

  let requestData: { query?: unknown; chatId?: unknown; reasoning?: unknown } = {};
  try {
    requestData = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request format" }, 400);
  }

  if (typeof requestData.query !== "string") {
    return jsonResponse({ error: "Input text must be a string" }, 400);
  }

  const query = requestData.query.trim();
  if (query.length < 1) {
    return jsonResponse({ error: "Input text cannot be empty" }, 400);
  }

  if (query.length > 10000) {
    return jsonResponse({ error: "Input text is too long" }, 400);
  }

  if (typeof requestData.chatId !== "string" || !CHAT_ID_REGEX.test(requestData.chatId)) {
    return jsonResponse({ error: "Invalid chat ID" }, 400);
  }

  const chatId = requestData.chatId;
  const existingGeneration = getChatGenerationSnapshot(chatId, userId);
  if (existingGeneration.status === "running") {
    return jsonResponse({ error: "A response is already generating for this chat" }, 409);
  }

  const reasoning = requestData.reasoning === true;
  const multiplier = reasoning ? 2 : 1;
  const costOfCredit = getCreditFromQuery(query, agentOptions) * multiplier;

  let chat;
  try {
    chat = await pb.collection("chat").getOne(chatId);
  } catch (chatError) {
    const status = typeof (chatError as { status?: number })?.status === "number"
      ? (chatError as { status?: number }).status
      : 500;
    if (status === 404) {
      return jsonResponse({ error: "Chat not found" }, 404);
    }

    console.error("Error loading chat:", chatError);
    return jsonResponse({ error: "Failed to load chat" }, 500);
  }

  if (chat?.user !== userId) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  const messagesForModel = normalizeChatMessagesForModel(chat?.messages);

  const storedMessagesValidation = validateStoredChatMessages(chat?.messages);
  const initialStoredMessages = storedMessagesValidation.ok
    ? storedMessagesValidation.messages
    : recoverChatMessages(chat?.messages);

  const creditReservation = await reserveCredits(pb, userId, costOfCredit);
  if (!creditReservation.ok) {
    return jsonResponse({ error: creditReservation.error }, creditReservation.status);
  }

  markChatGenerationRunning(chatId, userId);

  try {
    const upstream = await fetch(`${apiURL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ query, messages: messagesForModel, reasoning }),
    });

    if (!upstream.ok || !upstream.body) {
      await refundCredits(pb, userId, costOfCredit);
      markChatGenerationFailed(chatId, userId, "Failed to connect to AI service");
      console.error("Upstream error:", upstream.status);
      return jsonResponse({ error: "Failed to connect to AI service" }, upstream.status);
    }

    const decoder = new TextDecoder();
    const upstreamReader = upstream.body.getReader();
    const streamState = {
      fullResponse: "",
      collectedSources: [] as unknown[],
    };
    let parseBuffer = "";
    let clientDisconnected = false;
    let controllerClosed = false;
    let finalized = false;

    const stream = new ReadableStream({
      async start(controller) {
        const finalizeGeneration = async () => {
          if (finalized) return;
          finalized = true;

          if (streamState.fullResponse && streamState.fullResponse.trim()) {
            try {
              let latestMessages = initialStoredMessages;
              try {
                const latestChat = await pb.collection("chat").getOne(chatId, {
                  fields: "messages,user",
                });
                if (latestChat?.user === userId) {
                  const latestValidation = validateStoredChatMessages(latestChat.messages);
                  if (latestValidation.ok) {
                    latestMessages = latestValidation.messages;
                  } else {
                    // Strict validation failed (e.g. invalid sources from a previous save).
                    // Recover role+content so we don't lose chat history.
                    const recovered = recoverChatMessages(latestChat.messages);
                    if (recovered.length > 0) {
                      latestMessages = recovered;
                    }
                  }
                }
              } catch (latestChatError) {
                console.error("Failed to load latest chat before save:", latestChatError);
              }

              const systemMessage: ChatMessage = {
                content: streamState.fullResponse,
                role: "system",
              };

              // Sanitize sources leniently — convert non-string values instead of failing
              const sanitizedSources = sanitizeSourcesLenient(streamState.collectedSources);
              if (sanitizedSources) {
                systemMessage.sources = sanitizedSources;
              }

              const updatedMessages = applyGeneratedSystemMessage(
                latestMessages,
                query,
                systemMessage,
              );

              // Trim to max stored messages, then validate before writing
              const trimmedMessages = trimToMaxMessages(updatedMessages);
              const finalValidation = validateStoredChatMessages(trimmedMessages);
              const messagesToSave = finalValidation.ok
                ? finalValidation.messages
                : recoverChatMessages(trimmedMessages);

              await pb.collection("chat").update(chatId, {
                messages: JSON.stringify(messagesToSave),
              });

              markChatGenerationCompleted(chatId, userId);
            } catch (saveErr) {
              console.error("Server-side save error:", saveErr);
              markChatGenerationFailed(chatId, userId, "Failed to save generated response");
            }
          } else {
            await refundCredits(pb, userId, costOfCredit);
            markChatGenerationFailed(chatId, userId, "No content was generated");
          }
        };

        try {
          while (true) {
            const { done, value } = await upstreamReader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            parseBuffer += chunk;

            const lines = parseBuffer.split("\n");
            parseBuffer = lines.pop() ?? "";

            for (const line of lines) {
              extractStreamStateFromLine(line, streamState);
            }

            if (!clientDisconnected && !controllerClosed) {
              try {
                controller.enqueue(chunk);
              } catch {
                clientDisconnected = true;
              }
            }
          }

          const flushChunk = decoder.decode();
          if (flushChunk) {
            parseBuffer += flushChunk;

            if (!clientDisconnected && !controllerClosed) {
              try {
                controller.enqueue(flushChunk);
              } catch {
                clientDisconnected = true;
              }
            }
          }

          if (parseBuffer.trim()) {
            extractStreamStateFromLine(parseBuffer, streamState);
            parseBuffer = "";
          }
        } catch (err) {
          console.error("Stream error:", err);
          markChatGenerationFailed(chatId, userId, "Streaming failed");
          if (!clientDisconnected && !controllerClosed) {
            controllerClosed = true;
            try {
              controller.error(err);
            } catch {
              // Response was already canceled by the client.
            }
          }
        } finally {
          if (!clientDisconnected && !controllerClosed) {
            controllerClosed = true;
            try {
              controller.close();
            } catch {
              // Response was already canceled by the client.
            }
          }

          await finalizeGeneration();

          try {
            await upstreamReader.cancel();
          } catch {
            // Upstream may already be closed.
          }
        }
      },
      cancel() {
        // Keep upstream generation running server-side and only stop client streaming.
        clientDisconnected = true;
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    await refundCredits(pb, userId, costOfCredit);
    markChatGenerationFailed(chatId, userId, "Request handler failed");
    console.error("Handler error:", err);
    return jsonResponse({ error: "An error occurred. Please try again." }, 500);
  }
};
