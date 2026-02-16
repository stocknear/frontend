import type { RequestHandler } from "./$types";
import { postAPI } from "$lib/server/api";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const output = await postAPI(locals, "/historical-price", { ticker: data?.ticker, timePeriod: data?.timePeriod });
  return new Response(JSON.stringify(output));
};
