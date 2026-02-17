import type { RequestHandler } from "./$types";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";
import {
  CHAT_ID_REGEX,
  validateStoredChatMessages,
} from "$lib/server/chatValidation";
import { getChatGenerationSnapshot } from "$lib/server/chatGenerationRegistry";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: RequestHandler = async ({ url, locals }) => {
  const { pb, user, clientIp } = locals;

  const userId = typeof user?.id === "string" ? user.id : "";
  if (!userId) {
    return jsonResponse({ error: "Authentication required" }, 401);
  }

  const rateLimit = checkRateLimit(clientIp, "chatStatus", RATE_LIMITS.chatStatus);
  if (!rateLimit.allowed) {
    return jsonResponse({ error: "Too many requests. Please try again later." }, 429);
  }

  const chatId = url.searchParams.get("chatId");
  if (!chatId || !CHAT_ID_REGEX.test(chatId)) {
    return jsonResponse({ error: "Invalid chat ID" }, 400);
  }

  const generation = getChatGenerationSnapshot(chatId, userId);
  if (generation.status === "running") {
    return jsonResponse({
      status: "running",
      startedAt: generation.startedAt,
      updatedAt: generation.updatedAt,
    });
  }

  try {
    const chat = await pb.collection("chat").getOne(chatId, {
      fields: "id,user,messages,updated",
    });

    if (chat?.user !== userId) {
      // Do not leak chat existence across users.
      return jsonResponse({ error: "Not found" }, 404);
    }

    const validatedMessages = validateStoredChatMessages(chat.messages);
    if (!validatedMessages.ok) {
      console.error("Invalid stored chat messages:", validatedMessages.error);
      return jsonResponse({ error: "Chat data is invalid" }, 500);
    }

    return jsonResponse({
      status: generation.status === "failed" ? "failed" : "idle",
      error: generation.status === "failed" ? generation.error : undefined,
      chat: {
        id: chat.id,
        updated: chat.updated,
        messages: validatedMessages.messages,
      },
    });
  } catch (chatError) {
    const status = typeof (chatError as { status?: number })?.status === "number"
      ? (chatError as { status?: number }).status
      : 500;

    if (status === 404) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    console.error("Failed to load chat status:", chatError);
    return jsonResponse({ error: "Failed to load chat status" }, 500);
  }
};
