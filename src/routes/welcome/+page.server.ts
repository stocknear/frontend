import { PURCHASE_COOKIE, PURCHASE_VALUES } from "$lib/constants/tracking";

export function load({ locals, cookies, url }) {
  const tier = url.searchParams.get("tier") || "";
  const userTier = locals.user?.tier;

  // Only fire purchase conversion if user is authenticated AND has a paid tier
  if (!locals.pb?.authStore?.isValid || !["Plus", "Pro"].includes(userTier)) {
    return {};
  }

  // Read purchase value: cookie (exact) > URL param > tier fallback
  let purchaseValue: number | null = null;
  const cookieValue = cookies.get(PURCHASE_COOKIE);

  if (cookieValue) {
    purchaseValue = parseFloat(cookieValue) || null;
    cookies.delete(PURCHASE_COOKIE, { path: "/" });
  } else {
    const urlValue = url.searchParams.get("value");
    if (urlValue) {
      purchaseValue = parseFloat(urlValue) || null;
    }
  }

  // Fallback to tier + billing-cycle mapping when no explicit value exists.
  const billingCycle = (url.searchParams.get("billing") || "").toLowerCase();
  const isAnnual = billingCycle === "annual";
  if (!purchaseValue) {
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
