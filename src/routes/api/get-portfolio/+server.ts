import type { RequestHandler } from "./$types";
import { postAPI } from "$lib/server/api";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const { user } = locals;

  // Security: Check authentication
  if (!user?.id) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401 }
    );
  }

  const output = await postAPI(locals, "/get-portfolio", { listId: data?.portfolioId, ruleOfList: data?.ruleOfList });
  return new Response(JSON.stringify(output));
};
