import { error } from "@sveltejs/kit";

export const load = async ({ params }) => {
  // The slug is compared against ipoDate years downstream. Left as a raw
  // string it only worked through JS coercion, and a non-year slug such as
  // /ipos/abc produced NaN comparisons and a silently empty table.
  if (!/^\d{4}$/.test(params.slug)) {
    error(404, `No IPO year at /ipos/${params.slug}`);
  }

  return {
    getYear: Number(params.slug),
  };
};
