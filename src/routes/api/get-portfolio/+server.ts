import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const { apiURL, apiKey, user } = locals;

  // Security: Check authentication
  if (!user?.id) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401 }
    );
  }

  const postData = { listId: data?.portfolioId, ruleOfList: data?.ruleOfList };
  const response = await fetch(apiURL + "/get-portfolio", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(postData),
  });

  const output = await response.json();

  return new Response(JSON.stringify(output));
};
