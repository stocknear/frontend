import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params }) => {
  let output = await postAPI(locals, "/fail-to-deliver", { ticker: params.tickerID });
  if (Array.isArray(output)) {
    output.sort((a, b) => new Date(a?.date) - new Date(b?.date));
  }

  return { getData: output };
};
