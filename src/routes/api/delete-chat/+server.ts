import type { RequestHandler } from "./$types";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { pb, user, clientIp } = locals;
  const data = await request.json();

  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 });
  }

  const rateLimit = checkRateLimit(clientIp, "chatDelete", RATE_LIMITS.chatDelete);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), { status: 429 });
  }

  let output;

  try {
    const chat = await pb.collection("chat").getOne(data?.threadId);

    if (chat?.user !== user?.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    await pb.collection("chat").delete(data?.threadId);
    output = "success";
  } catch (e) {
    console.log(e);
    output = "failure";
  }

  return new Response(JSON.stringify(output));
};
