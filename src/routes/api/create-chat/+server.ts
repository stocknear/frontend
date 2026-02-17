import type { RequestHandler } from "./$types";
import { getCreditFromQuery, agentOptions } from "$lib/utils";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { user, pb, clientIp } = locals;
  const data = await request.json();

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

  const costOfCredit = getCreditFromQuery(data?.query, agentOptions);

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
      messages: JSON?.stringify([{ content: data?.query, role: "user" }])
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