export const load = async ({ locals, url }) => {
  const page = Number(url?.searchParams?.get("page")) || 1;
  const pageSize = Number(url?.searchParams?.get("pageSize")) || 20;
  const sortKey = url?.searchParams?.get("sortKey") || "rank";
  const sortOrder = url?.searchParams?.get("sortOrder") || "asc";
  const search = url?.searchParams?.get("search") || "";

  const getData = async () => {
    const { apiURL, apiKey } = locals;

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

    return output;
  };

  return {
    getData: await getData(),
  };
};
