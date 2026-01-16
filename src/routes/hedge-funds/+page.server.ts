// Helper function to filter premium fields from hedge fund items
function filterPremiumFields(items: any[]): any[] {
  return items?.map((item) => ({
    ...item,
    winRate: null,
    performancePercentage3Year: null,
  })) ?? [];
}

export const load = async ({ locals, url }) => {
  const { apiURL, apiKey, user } = locals;
  const isPremium = ["Plus", "Pro"].includes(user?.tier);

  const page = Number(url?.searchParams?.get("page")) || 1;
  const pageSize = Number(url?.searchParams?.get("pageSize")) || 20;
  const sortKey = url?.searchParams?.get("sortKey") || "rank";
  const sortOrder = url?.searchParams?.get("sortOrder") || "asc";
  const search = url?.searchParams?.get("search") || "";

  const getData = async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortKey,
      sortOrder,
    });

    if (search) {
      params.set("search", search);
    }

    const response = await fetch(`${apiURL}/hedge-funds?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    if (!response.ok) {
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        sort: { key: sortKey, order: sortOrder },
        search,
      };
    }

    const output = await response.json();

    // Filter premium data for non-Plus/Pro users
    if (!isPremium && output?.items) {
      output.items = filterPremiumFields(output.items);
    }

    return output;
  };

  return {
    getData: await getData(),
  };
};
