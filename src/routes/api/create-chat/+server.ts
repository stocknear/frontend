import type { RequestHandler } from "./$types";
import { getCreditFromQuery, agentOptions } from "$lib/utils";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { user, pb } = locals;
  const data = await request.json();

  // Early return if user is not logged in
 /*
  if (!user?.id) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401 }
    );
  }
    */
  const costOfCredit = getCreditFromQuery(data?.query, agentOptions);

  if (user?.credits < costOfCredit) {
    return new Response(
      JSON.stringify({ error: `Insufficient credits. Your current balance is ${user?.credits}.` }),
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
      JSON.stringify({ error: "Error creating chat message", details: err.message }),
      { status: 500 }
    );
  }
};