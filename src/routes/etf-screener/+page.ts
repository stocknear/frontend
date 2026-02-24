import { redirect } from "@sveltejs/kit";

export const load = ({ url }) => {
  throw redirect(301, `/etf/screener${url.search}`);
};
