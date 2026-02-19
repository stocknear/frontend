import type { RequestHandler } from "./$types";
import { getCreditFromQuery, agentOptions } from "$lib/utils";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { user, pb, clientIp } = locals;

  // Early return if user is not logged in
  if (!user?.id) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401 }
    );
  }
  const rateLimit = checkRateLimit(clientIp, "chatCreate", RATE_LIMITS.chatCreate);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429 }
    );
  }

  let data: { query?: unknown } = {};
  try {
    data = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request format" }),
      { status: 400 }
    );
  }

  if (typeof data?.query !== "string") {
    return new Response(
      JSON.stringify({ error: "Query must be a string" }),
      { status: 400 }
    );
  }

  const query = data.query.trim();

  if (query.length < 1) {
    return new Response(
      JSON.stringify({ error: "Input text cannot be empty" }),
      { status: 400 }
    );
  }

  if (query.length > 10000) {
    return new Response(
      JSON.stringify({ error: "Input text is too long" }),
      { status: 400 }
    );
  }

  const costOfCredit = getCreditFromQuery(query, agentOptions);

  if (user?.credits < costOfCredit) {
    return new Response(
      JSON.stringify({ error: "Insufficient credits. Credits are reset at the start of each month." }),
      { status: 400 }
    );
  }
  
  
 
  // Extract messages from the request
  try {
    const newChat = await pb.collection("chat").create({
      user: user.id,
      messages: JSON?.stringify([{ content: query, role: "user" }])
    });

    
     return new Response(
      JSON.stringify(newChat),
    );

  } catch (err) {
    // If it's already a Response (like the redirect), just throw it through
    if (err instanceof Response) throw err;
  
    
    return new Response(
      JSON.stringify({ error: "Error creating chat message" }),
      { status: 500 }
    );
  }
};
