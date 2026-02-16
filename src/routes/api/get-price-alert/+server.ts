import type { RequestHandler } from "./$types";
import { postAPI } from "$lib/server/api";

export const GET: RequestHandler = async ({ locals }) => {
  const { user } = locals;

  if (!user?.id) {
    return new Response(
      JSON.stringify({ data: [], news: [], earnings: [] }),
    );
  }

  let output = await postAPI(locals, "/get-price-alert", { userId: user?.id });

  output.data = (output?.data || [])
    ?.map((item) => ({
      ...item,
      hasNote: Boolean(item?.note && String(item.note)?.trim()?.length > 0),
    }))
    ?.sort((a, b) => a?.symbol?.localeCompare(b?.symbol));

  return new Response(JSON.stringify(output));
};
