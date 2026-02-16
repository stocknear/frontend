import { PURCHASE_COOKIE } from "$lib/constants/tracking";

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
    purchaseValue = parseInt(cookieValue, 10) || null;
    cookies.delete(PURCHASE_COOKIE, { path: "/" });
  } else {
    const urlValue = url.searchParams.get("value");
    if (urlValue) {
      purchaseValue = parseFloat(urlValue) || null;
    }
  }

  // Fallback to tier-based minimum (monthly price)
  if (!purchaseValue) {
    purchaseValue = userTier === "Pro" ? 45 : 15;
  }

  return {
    purchaseConversion: {
      value: purchaseValue,
      tier: tier || userTier,
      transactionId: locals.user?.id || "",
    },
  };
}
