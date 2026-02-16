import type { RequestHandler } from "./$types";
import { getAPI } from "$lib/server/api";

export const GET: RequestHandler = async ({ url, locals }) => {
  const query = url.searchParams.get("query") || "";
  const output = await getAPI(locals, `/searchbar?query=${encodeURIComponent(query)}`);
  return new Response(JSON.stringify(output));
};
