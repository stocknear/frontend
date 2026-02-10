import { convertToSlug, checkPreMarketHourSSR } from "$lib/utils";

export const load = async ({ locals }) => {
  const { user, wsURL, themeMode, cookieConsent, locale, pb } = locals;

  const isPreMarket = checkPreMarketHourSSR();

  let hasDailyBriefing = false;
  let dailyBriefingSlug: string | null = null;

  try {
    const now = new Date();
    const todayStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} 00:00:00`;

    const daily = await pb.collection("tutorials").getList(1, 1, {
      filter: `category = "Daily" && updated >= "${todayStart}"`,
      sort: "-updated",
      fields: "id,title",
      requestKey: "layout-daily",
    });

    if (daily?.items?.length > 0) {
      hasDailyBriefing = false;
      dailyBriefingSlug = convertToSlug(daily?.items[0]?.title);
    }
  } catch {
    // PB unavailable — silently skip
  }

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
