import type { RequestHandler } from "./$types";
import { postAPI } from "$lib/server/api";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const output = await postAPI(locals, "/stock-screener-data", { ruleOfList: data?.ruleOfList });
  return new Response(JSON.stringify(output));
};
