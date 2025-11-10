import type { RequestHandler } from "./$types";

export const POST = (async ({ request, locals }) => {
  const {  pb } = locals;
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
    console.error("Failed to parse request data:", e);
    return new Response(JSON.stringify({ error: "Invalid request format" }), { status: 400 });
  }

  // Validate required data
  if (!data?.chatId || !data?.messages) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  try {
    output = await pb.collection("chat").update(data.chatId, {
      'messages': JSON.stringify(data.messages)
    });
  } catch(e) {
    console.error("Database update error:", e);
    output = { error: "Failed to update chat" };
  }

  return new Response(JSON.stringify(output));
}) satisfies RequestHandler;

