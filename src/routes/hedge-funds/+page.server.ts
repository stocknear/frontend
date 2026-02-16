import { getAPI } from "$lib/server/api";

// Helper function to filter premium fields from hedge fund items
function filterPremiumFields(items: any[]): any[] {
  return items?.map((item) => ({
    ...item,
    winRate: null,
    performancePercentage3Year: null,
  })) ?? [];
}

export const load = async ({ locals, url }) => {
  const isPremium = ["Plus", "Pro"].includes(locals.user?.tier);

  const page = Number(url?.searchParams?.get("page")) || 1;
  const pageSize = Number(url?.searchParams?.get("pageSize")) || 20;
  const sortKey = url?.searchParams?.get("sortKey") || "rank";
  const sortOrder = url?.searchParams?.get("sortOrder") || "asc";
  const search = url?.searchParams?.get("search") || "";

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sortKey,
    sortOrder,
  });

  if (search) {
    params.set("search", search);
  }

  let output;
  try {
    output = await getAPI(locals, `/hedge-funds?${params.toString()}`);
  } catch {
    output = {
      items: [],
      total: 0,
      page,
      pageSize,
      sort: { key: sortKey, order: sortOrder },
      search,
    };
  }

  // Filter premium data for non-Plus/Pro users
  if (!isPremium && output?.items) {
    output.items = filterPremiumFields(output.items);
  }

  return { getData: output };
};
