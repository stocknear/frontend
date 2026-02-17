import type { RequestHandler } from "./$types";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";

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
  if (!data?.chatId || !data?.messages) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  try {
    // Verify ownership before updating
    const chat = await pb.collection("chat").getOne(data.chatId);
    if (chat?.user !== user?.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    output = await pb.collection("chat").update(data.chatId, {
      'messages': JSON.stringify(data.messages)
    });
  } catch(e) {
    console.error("Database update error:", e);
    output = { error: "Failed to update chat" };
  }

  return new Response(JSON.stringify(output));
}) satisfies RequestHandler;

