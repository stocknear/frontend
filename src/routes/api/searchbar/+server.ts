import type { RequestHandler } from "./$types";
import { getAPI } from "$lib/server/api";

export const GET: RequestHandler = async ({ url, locals }) => {
  const query = url.searchParams.get("query") || "";
  const rawLimit = Number(url.searchParams.get("limit") ?? "5");
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.floor(rawLimit), 20)
      : 5;

  const rawAssetType = (
    url.searchParams.get("assetType") || url.searchParams.get("type") || ""
  )
    .trim()
    .toLowerCase();
  const assetType = ["stock", "stocks", "etf", "index", "indices"].includes(
    rawAssetType,
  )
    ? rawAssetType
    : "";

  const params = new URLSearchParams({
    query,
    limit: String(limit),
  });
  if (assetType) {
    params.set("assetType", assetType);
  }

  const output = await getAPI(locals, `/searchbar?${params.toString()}`);
  return new Response(JSON.stringify(output));
};
