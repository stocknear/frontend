const PAGE_SIZES = [15, 20, 30];
const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];

export const load = async ({ locals, url }) => {
  const { pb } = locals;

  const VALID_CATEGORIES = ["all", "Features", "Fundamentals", "Terms"];
  const VALID_TAGS = ["all", "Stocks", "ETF", "Options", "Sentiment"];
  const MAX_SEARCH_LENGTH = 100;

  const rawCategory = url.searchParams.get("category") || "all";
  const rawTag = url.searchParams.get("tag") || "all";
  const rawSearch = (url.searchParams.get("search") || "").trim();

  // Whitelist category and tag to prevent filter injection
  const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : "all";
  const tag = VALID_TAGS.includes(rawTag) ? rawTag : "all";

  // Sanitize search: strip dangerous chars, limit length
  const search = rawSearch
    .slice(0, MAX_SEARCH_LENGTH)
    .replace(/["\\\(\)=~&|!><]/g, "");

  const pageParam = Number(url.searchParams.get("page") ?? "1");
  const perPageParam = Number(url.searchParams.get("perPage") ?? DEFAULT_PAGE_SIZE);

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const perPage = PAGE_SIZES.includes(perPageParam) ? perPageParam : DEFAULT_PAGE_SIZE;

  const fields = "id,collectionId,title,abstract,category,tags,cover,created,updated,time";

  // Build tag filter fragment
  const tagFilter = tag !== "all" ? `tags ~ "${tag}"` : "";

  // Build search filter fragment
  const searchFilter = search
    ? `(title ~ "${search}" || abstract ~ "${search}")`
    : "";

  if (category === "all") {
    // "All" view: fetch limited preview items per category in parallel
    const buildFilter = (cat: string) => {
      const parts = [`category = "${cat}"`];
      if (tagFilter) parts.push(tagFilter);
      if (searchFilter) parts.push(searchFilter);
      return parts.join(" && ");
    };

    const [features, fundamentals, terms] = await Promise.all([
      pb.collection("tutorials").getList(1, 3, {
        filter: buildFilter("Features"),
        sort: "-created",
        fields,
        requestKey: "features",
      }),
      pb.collection("tutorials").getList(1, 3, {
        filter: buildFilter("Fundamentals"),
        sort: "-created",
        fields,
        requestKey: "fundamentals",
      }),
      pb.collection("tutorials").getList(1, 6, {
        filter: buildFilter("Terms"),
        sort: "title",
        fields,
        requestKey: "terms",
      }),
    ]);

    const totalCount =
      features.totalItems + fundamentals.totalItems + terms.totalItems;

    return {
      view: "all" as const,
      categoryFilter: category,
      tagFilter: tag,
      searchFilter: search,
      totalCount,
      categorySections: {
        Features: { items: features.items, totalItems: features.totalItems },
        Fundamentals: {
          items: fundamentals.items,
          totalItems: fundamentals.totalItems,
        },
        Terms: { items: terms.items, totalItems: terms.totalItems },
      },
    };
  } else {
    // Category view: single paginated query
    const filterParts = [`category = "${category}"`];
    if (tagFilter) filterParts.push(tagFilter);
    if (searchFilter) filterParts.push(searchFilter);
    const filter = filterParts.join(" && ");
    const sort = category === "Terms" ? "title" : "-created";

    const result = await pb.collection("tutorials").getList(page, perPage, {
      filter,
      sort,
      fields,
    });

    return {
      view: "category" as const,
      categoryFilter: category,
      tagFilter: tag,
      searchFilter: search,
      tutorials: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      currentPage: result.page,
      perPage,
    };
  }
};
