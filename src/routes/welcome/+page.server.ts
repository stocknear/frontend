import { PURCHASE_COOKIE, PURCHASE_VALUES } from "$lib/constants/tracking";

function parsePositiveConversionValue(
  raw: string | null | undefined,
): number | null {
  if (!raw) return null;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return parsed;
}

export function load({ locals, cookies, url }) {
  const tier = url.searchParams.get("tier") || "";
  const userTier = locals.user?.tier;

  // Only fire purchase conversion if user is authenticated AND has a paid tier
  if (!locals.pb?.authStore?.isValid || !["Plus", "Pro"].includes(userTier)) {
    return {};
  }

  // Read purchase value: URL param (LemonSqueezy redirect) > cookie > tier fallback
  let purchaseValue: number | null = null;
  const rawCookieValue = cookies.get(PURCHASE_COOKIE);
  const urlValue = parsePositiveConversionValue(url.searchParams.get("value"));
  const cookieValue = parsePositiveConversionValue(rawCookieValue);

  if (rawCookieValue) {
    cookies.delete(PURCHASE_COOKIE, { path: "/" });
  }

  if (urlValue !== null) {
    purchaseValue = urlValue;
  } else if (cookieValue !== null) {
    purchaseValue = cookieValue;
  }

  // Fallback to tier + billing-cycle mapping when no explicit value exists.
  const billingCycle = (url.searchParams.get("billing") || "").toLowerCase();
  const isAnnual = billingCycle === "annual";
  if (purchaseValue === null) {
    if (userTier === "Pro") {
      purchaseValue = isAnnual
        ? PURCHASE_VALUES.pro_annual
        : PURCHASE_VALUES.pro_monthly;
    } else {
      purchaseValue = isAnnual
        ? PURCHASE_VALUES.plus_annual
        : PURCHASE_VALUES.plus_monthly;
    }
  }

  return {
    purchaseConversion: {
      value: purchaseValue,
      tier: tier || userTier,
      transactionId: locals.user?.id || "",
    },
  };
}
