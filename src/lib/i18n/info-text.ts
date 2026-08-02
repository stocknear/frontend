import { getCache, setCache } from "$lib/store";
import { getLocale, type Locale } from "$lib/paraglide/runtime.js";

export type InfoText = {
  text?: string;
  equation?: string;
};

export function infoTextCacheKey(
  parameter: string,
  locale: Locale = getLocale(),
): string {
  return `${locale}:${parameter}`;
}

export function escapeInfoTextHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function fetchInfoText(parameter: string): Promise<InfoText> {
  const locale = getLocale();
  const cacheKey = infoTextCacheKey(parameter, locale);
  const cachedData = getCache(cacheKey, "getInfoText") as InfoText | undefined;
  if (cachedData) return cachedData;

  const response = await fetch("/api/info-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parameter, locale }),
  });

  if (!response.ok) {
    throw new Error(`Unable to load info text (${response.status})`);
  }

  const result = (await response.json()) as InfoText;
  setCache(cacheKey, result, "getInfoText");
  return result;
}
