import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals }) => {
  const { fastifyURL, user } = locals;

  if (user?.tier !== "Pro") {
    return new Response(JSON.stringify({ error: "Pro tier required" }), {
      status: 403,
    });
  }

  const response = await fetch(fastifyURL + "/generate-ws-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user?.id, tier: user?.tier }),
  });

  const output = await response.json();
  return new Response(JSON.stringify(output));
};
