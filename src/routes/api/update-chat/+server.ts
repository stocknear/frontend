import type { RequestHandler } from "./$types";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";
import {
  CHAT_ID_REGEX,
  validateStoredChatMessages,
  recoverChatMessages,
  trimToMaxMessages,
} from "$lib/server/chatValidation";

export const POST = (async ({ request, locals }) => {
  const { pb, user, clientIp } = locals;

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const rateLimit = checkRateLimit(clientIp, "chatUpdate", RATE_LIMITS.chatUpdate);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 });
  }

  let data;
  let output;

  try {
    // Handle both regular requests and sendBeacon (Blob) requests
    const contentType = request.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      data = await request.json();
    } else {
      // Handle sendBeacon blob requests
      const text = await request.text();
      data = JSON.parse(text);
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid request format" }), { status: 400 });
  }

  // Validate required data
  if (!data?.chatId || data?.messages === undefined) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  if (typeof data.chatId !== "string" || !CHAT_ID_REGEX.test(data.chatId)) {
    return new Response(JSON.stringify({ error: "Invalid chat ID" }), { status: 400 });
  }

  // Trim to max stored messages before validation (keeps latest)
  const rawMessages = Array.isArray(data.messages) ? data.messages : [];
  const trimmedInput = trimToMaxMessages(rawMessages);

  const messagesValidation = validateStoredChatMessages(trimmedInput);
  let messagesToSave;
  if (messagesValidation.ok) {
    messagesToSave = messagesValidation.messages;
  } else {
    // Strict validation failed (e.g. raw sources from stream).
    // Recover role+content instead of rejecting the save entirely.
    const recovered = recoverChatMessages(trimmedInput);
    if (recovered.length === 0) {
      return new Response(JSON.stringify({ error: messagesValidation.error }), { status: 400 });
    }
    messagesToSave = recovered;
  }

  try {
    // Verify ownership before updating
    const chat = await pb.collection("chat").getOne(data.chatId);
    if (chat?.user !== user?.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    output = await pb.collection("chat").update(data.chatId, {
      'messages': JSON.stringify(messagesToSave)
    });
  } catch(e) {
    console.error("Database update error:", e);
    return new Response(JSON.stringify({ error: "Failed to update chat" }), { status: 500 });
  }

  return new Response(JSON.stringify(output));
}) satisfies RequestHandler;

