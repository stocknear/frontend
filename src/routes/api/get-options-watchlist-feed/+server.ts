import type { RequestHandler } from "./$types";
import { postAPI } from "$lib/server/api";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { user } = locals;

  if (!user?.id) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400 },
    );
  }

  const tickers = body?.tickers;

  if (!Array.isArray(tickers) || tickers.length === 0) {
    return new Response(JSON.stringify({ news: [], earnings: [] }));
  }

  try {
    const output = await postAPI(locals, "/get-ticker-feed", { tickers });
    return new Response(JSON.stringify(output));
  } catch (e) {
    return new Response(
      JSON.stringify({ news: [], earnings: [] }),
    );
  }
};
