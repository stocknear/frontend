import type { RequestHandler } from "./$types";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";
import { CHAT_ID_REGEX } from "$lib/server/chatValidation";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { pb, user, clientIp } = locals;

  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 });
  }

  const rateLimit = checkRateLimit(clientIp, "chatDelete", RATE_LIMITS.chatDelete);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), { status: 429 });
  }

  let data: { threadId?: unknown } = {};
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request format" }), { status: 400 });
  }

  if (typeof data?.threadId !== "string" || !CHAT_ID_REGEX.test(data.threadId)) {
    return new Response(JSON.stringify({ error: "Invalid thread ID" }), { status: 400 });
  }

  const threadId = data.threadId;

  try {
    const chat = await pb.collection("chat").getOne(threadId);

    // Avoid revealing whether the chat exists for other users.
    if (chat?.user !== user?.id) {
      return new Response(JSON.stringify("success"));
    }

    await pb.collection("chat").delete(threadId);
    return new Response(JSON.stringify("success"));
  } catch (e) {
    const status = typeof (e as { status?: number })?.status === "number"
      ? (e as { status?: number }).status
      : 500;

    // Keep "not found" indistinguishable from "forbidden" to prevent id probing.
    if (status === 404) {
      return new Response(JSON.stringify("success"));
    }

    console.error("Error deleting chat:", e);
    return new Response(JSON.stringify({ error: "Failed to delete chat" }), { status: 500 });
  }
};
