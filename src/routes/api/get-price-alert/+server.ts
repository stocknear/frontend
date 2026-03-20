import type { RequestHandler } from "./$types";
import { postAPI } from "$lib/server/api";

export const GET: RequestHandler = async ({ locals }) => {
  const { user } = locals;

  if (!user?.id) {
    return new Response(
      JSON.stringify({ data: [], news: [], earnings: [] }),
    );
  }

  const output = await postAPI(locals, "/get-price-alert", { userId: user?.id });

  return new Response(JSON.stringify(output));
};
