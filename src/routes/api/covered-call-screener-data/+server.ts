import type { RequestHandler } from "./$types";
import { postAPI } from "$lib/server/api";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const { user } = locals;

  const output = await postAPI(locals, "/covered-call-screener-data", {
    ruleOfList: data?.ruleOfList,
    subscriber: user?.tier ?? "Free",
    optionContracts: data?.optionContracts || [],
  });
  return new Response(JSON.stringify(output));
};
