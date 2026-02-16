import type { RequestHandler } from "./$types";
import { postAPI } from "$lib/server/api";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const output = await postAPI(locals, "/heatmap", { params: data?.params, etf: data?.etf || "SPY" });
  return new Response(JSON.stringify(output), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
