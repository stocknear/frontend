import { postAPI } from "$lib/server/api";

export const load = async ({ locals, setHeaders }) => {
  setHeaders({ "cache-control": "public, max-age=300" });

  let output = await postAPI(locals, "/list-category", { filterList: "highest-open-interest-by-contract" });

  if (Array.isArray(output)) {
    output = output.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }

  return { getData: output };
};
