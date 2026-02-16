import { convertToSlug, checkPreMarketHourSSR } from "$lib/utils";

let cachedDaily: { hasDailyBriefing: boolean; dailyBriefingSlug: string | null; cachedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const DAILY_BRIEFING_TIMEOUT_MS = 1800;

const fallbackDaily = {
  hasDailyBriefing: false,
  dailyBriefingSlug: null as string | null,
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

async function getDailyBriefing(pb: any) {
  const now = Date.now();

  if (cachedDaily && now - cachedDaily.cachedAt < CACHE_TTL) {
    return cachedDaily;
  }

  if (!pb || typeof pb.collection !== "function") {
    cachedDaily = { ...fallbackDaily, cachedAt: now };
    return cachedDaily;
  }

  let hasDailyBriefing = false;
  let dailyBriefingSlug: string | null = null;

  try {
    const date = new Date();
    const todayStart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} 00:00:00`;

    const daily = await withTimeout(
      pb.collection("tutorials").getList(1, 1, {
        filter: `category = "Daily" && updated >= "${todayStart}"`,
        sort: "-updated",
        fields: "id,title",
        requestKey: "layout-daily",
      }),
      DAILY_BRIEFING_TIMEOUT_MS,
      { items: [] as Array<{ title?: string }> },
    );

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
  try {
    const { user, wsURL, themeMode, cookieConsent, locale, pb } = locals ?? {};

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
  } catch {
    return {
      user: undefined,
      cookieConsent: null,
      wsURL: undefined,
      themeMode: "dark",
      locale: "en",
      isPreMarket: false,
      hasDailyBriefing: false,
      dailyBriefingSlug: null,
    };
  }
};
