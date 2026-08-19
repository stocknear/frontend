import type { RequestHandler } from "./$types";
import { postAPI } from "$lib/server/api";
import { validPeriod } from "$lib/heatmap";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();

  try {
    // This route carries the site API key and no session, so anything it forwards is
    // effectively anonymous input at the backend's file-path boundary.
    const output = await postAPI(locals, "/etf-heatmap", {
      params: validPeriod(data?.params),
    });
    return new Response(JSON.stringify(output), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
};
