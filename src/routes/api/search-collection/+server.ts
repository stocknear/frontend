import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const VALID_CATEGORIES = ["all", "Features", "Fundamentals", "Terms"];
const VALID_TAGS = ["all", "Stocks", "ETF", "Options", "Sentiment"];
const PAGE_SIZES = [15, 20, 30];
const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];
const MAX_SEARCH_LENGTH = 100;
const FIELDS =
  "id,collectionId,title,abstract,category,tags,cover,created,updated,time";

function sanitizeSearch(raw: string): string {
  return raw.slice(0, MAX_SEARCH_LENGTH).replace(/["\\\(\)=~&|!><]/g, "");
}

export const GET: RequestHandler = async ({ locals, url }) => {
  const { pb } = locals;

  const rawCategory = url.searchParams.get("category") || "all";
  const rawTag = url.searchParams.get("tag") || "all";
  const rawSearch = (url.searchParams.get("search") || "").trim();
  const rawPage = Number(url.searchParams.get("page") ?? "1");
  const rawPerPage = Number(url.searchParams.get("perPage") ?? DEFAULT_PAGE_SIZE);

  const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : "all";
  const tag = VALID_TAGS.includes(rawTag) ? rawTag : "all";
  const search = sanitizeSearch(rawSearch);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const perPage = PAGE_SIZES.includes(rawPerPage) ? rawPerPage : DEFAULT_PAGE_SIZE;

  if (!search) {
    return json({ error: "Search query required" }, { status: 400 });
  }

  try {
    const filterParts = [`category = "${category}"`];
    if (tag !== "all") filterParts.push(`tags ~ "${tag}"`);
    filterParts.push(`(title ~ "${search}" || abstract ~ "${search}")`);

    const sort = category === "Terms" ? "title" : "-created";

    const result = await pb
      .collection("tutorials")
      .getList(page, perPage, {
        filter: filterParts.join(" && "),
        sort,
        fields: FIELDS,
      });

    return json({
      tutorials: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      currentPage: result.page,
      perPage,
      category,
      tag,
      search,
    });
  } catch (err) {
    console.error("search-collection error:", err);
    return json({ error: "Search failed" }, { status: 500 });
  }
};
