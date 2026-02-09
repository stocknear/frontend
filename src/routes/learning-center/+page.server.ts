import { checkMarketHourSSR} from "$lib/utils";

const PAGE_SIZES = [15, 20, 30];
const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];

export const load = async ({ locals, url }) => {
  const { pb } = locals;

  const category = url.searchParams.get("category") || "all";
  const tag = url.searchParams.get("tag") || "all";
  const pageParam = Number(url.searchParams.get("page") ?? "1");
  const perPageParam = Number(url.searchParams.get("perPage") ?? DEFAULT_PAGE_SIZE);

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const perPage = PAGE_SIZES.includes(perPageParam) ? perPageParam : DEFAULT_PAGE_SIZE;

  const isMarketOpen = checkMarketHourSSR();

  const fields = "id,collectionId,title,abstract,category,tags,cover,created,updated,time";

  // Build tag filter fragment
  const tagFilter = tag !== "all" ? `tags ~ "${tag}"` : "";

  if (category === "all") {
    // "All" view: fetch limited preview items per category in parallel
    const buildFilter = (cat: string) => {
      const parts = [`category = "${cat}"`];
      if (tagFilter) parts.push(tagFilter);
      return parts.join(" && ");
    };

    // Only fetch Daily if updated today
    const now = new Date();
    const todayStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} 00:00:00`;
    const dailyFilter = [
      `category = "Daily"`,
      `updated >= "${todayStart}"`,
      ...(tagFilter ? [tagFilter] : []),
    ].join(" && ");

    const [daily, features, fundamentals, terms] = await Promise.all([
      pb.collection("tutorials").getList(1, 1, {
        filter: dailyFilter,
        sort: "-updated",
        fields,
        requestKey: "daily",
      }),
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
      isMarketOpen,
      categoryFilter: category,
      tagFilter: tag,
      totalCount,
      categorySections: {
        Daily: { items: daily.items, totalItems: daily.totalItems },
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
    const filter = filterParts.join(" && ");
    const sort = category === "Terms" ? "title" : "-created";

    const result = await pb.collection("tutorials").getList(page, perPage, {
      filter,
      sort,
      fields,
    });

    return {
      view: "category" as const,
      isMarketOpen,
      categoryFilter: category,
      tagFilter: tag,
      tutorials: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      currentPage: result.page,
      perPage,
    };
  }
};
