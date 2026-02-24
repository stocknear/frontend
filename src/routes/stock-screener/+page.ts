import { redirect } from "@sveltejs/kit";

export const load = ({ url }) => {
  throw redirect(301, `/stocks/screener${url.search}`);
};
