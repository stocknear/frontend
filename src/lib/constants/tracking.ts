// Cookie names (server-side — httpOnly where possible)
export const SIGNUP_COOKIE = "gtm_signup";
export const PURCHASE_COOKIE = "purchase_intent";

// GTM custom event names (must match GTM trigger configuration)
export const GTM_EVENT_SIGNUP = "signup_conversion";
export const GTM_EVENT_PURCHASE = "purchase_conversion";

// Pricing values for purchase tracking (USD)
export const PURCHASE_VALUES = {
  plus_monthly: 15,
  plus_annual: 10,
  pro_monthly: 45,
  pro_annual: 360,
} as const;
