import { PLAN_PRICING } from "./promo";

// Cookie names (server-side — httpOnly where possible)
export const SIGNUP_COOKIE = "gtm_signup";
export const PURCHASE_COOKIE = "purchase_intent";

// GTM custom event names (must match GTM trigger configuration)
export const GTM_EVENT_SIGNUP = "signup_conversion";
export const GTM_EVENT_PURCHASE = "purchase_conversion";

// Pricing values for purchase tracking (USD) — derived from PLAN_PRICING
export const PURCHASE_VALUES = {
  plus_monthly: PLAN_PRICING.Plus.monthly,
  plus_annual: PLAN_PRICING.Plus.annualTotal,
  pro_monthly: PLAN_PRICING.Pro.monthly,
  pro_annual: PLAN_PRICING.Pro.annualTotal,
  pro_lifetime: 449,
} as const;
