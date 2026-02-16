import type { RequestHandler } from "./$types";
import { postAPI } from "$lib/server/api";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const output = await postAPI(locals, "/earnings-call-transcripts", {
    ticker: data?.ticker,
    quarter: data?.quarter,
    year: data?.year,
  });
  return new Response(JSON.stringify(output));
};
