import { convertToSlug, checkPreMarketHourSSR } from "$lib/utils";

let cachedDaily: { hasDailyBriefing: boolean; dailyBriefingSlug: string | null; cachedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getDailyBriefing(pb: any) {
  const now = Date.now();

  if (cachedDaily && now - cachedDaily.cachedAt < CACHE_TTL) {
    return cachedDaily;
  }

  let hasDailyBriefing = false;
  let dailyBriefingSlug: string | null = null;

  try {
    const date = new Date();
    const todayStart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} 00:00:00`;

    const daily = await pb.collection("tutorials").getList(1, 1, {
      filter: `category = "Daily" && updated >= "${todayStart}"`,
      sort: "-updated",
      fields: "id,title",
      requestKey: "layout-daily",
    });

    if (daily?.items?.length > 0) {
      hasDailyBriefing = true;
      dailyBriefingSlug = convertToSlug(daily?.items[0]?.title);
    }
  } catch {
    // PB unavailable — silently skip
  }

  cachedDaily = { hasDailyBriefing, dailyBriefingSlug, cachedAt: now };
  return cachedDaily;
}

export const load = async ({ locals }) => {
  const { user, wsURL, themeMode, cookieConsent, locale, pb } = locals;

  const isPreMarket = checkPreMarketHourSSR();
  const { hasDailyBriefing, dailyBriefingSlug } = await getDailyBriefing(pb);

  return {
    user: user || undefined,
    cookieConsent,
    wsURL,
    themeMode,
    locale,
    isPreMarket,
    hasDailyBriefing,
    dailyBriefingSlug,
  };
};
