// Single source of truth for plan prices and time-limited promotions.
//
// To run a new sale: append a Promotion to PROMOTIONS (new id => dismissed
// banners re-show automatically). Past endsAt every promo surface disappears
// on its own — no redeploy needed to end a sale.
//
// IMPORTANT: never evaluate getActivePromotion() at module top level — the
// node server is long-lived and that would freeze "now" at boot. Call it
// inside component init or functions so it runs per request/mount.

export type BillingPeriod = "monthly" | "annual";
export type PlanTier = "Plus" | "Pro";

export interface Promotion {
  id: string; // keys banner dismissal in localStorage
  percentOff: number;
  scope: BillingPeriod[]; // billing periods the discount applies to
  startsAt?: string; // optional ISO timestamp to schedule a future sale
  endsAt: string; // ISO timestamp with explicit UTC offset
}

export const PLAN_PRICING: Record<
  PlanTier,
  { monthly: number; annualPerMonth: number; annualTotal: number }
> = {
  Plus: { monthly: 10, annualPerMonth: 7.5, annualTotal: 90 },
  Pro: { monthly: 20, annualPerMonth: 15, annualTotal: 180 },
};

const PROMOTIONS: Promotion[] = [
  {
    id: "summer-sale-2026",
    percentOff: 40,
    scope: ["annual"],
    endsAt: "2026-06-22T23:59:59+02:00",
  },
];

export function getActivePromotion(now: Date = new Date()): Promotion | null {
  for (const promo of PROMOTIONS) {
    const started = !promo.startsAt || now >= new Date(promo.startsAt);
    if (started && now < new Date(promo.endsAt)) {
      return promo;
    }
  }
  return null;
}

export function isEligibleUser(user?: {
  tier?: string;
  lifetime?: boolean;
}): boolean {
  return !["Pro", "Plus"].includes(user?.tier ?? "") && !user?.lifetime;
}

export function promoAppliesTo(
  promo: Promotion,
  period: BillingPeriod,
): boolean {
  return promo.scope.includes(period);
}

export function discounted(price: number, promo: Promotion): number {
  return Math.round(price * (1 - promo.percentOff / 100) * 100) / 100;
}

export function getPurchaseValue(
  tier: PlanTier,
  period: BillingPeriod,
  promo: Promotion | null = null,
): number {
  const base =
    period === "annual"
      ? PLAN_PRICING[tier].annualTotal
      : PLAN_PRICING[tier].monthly;
  return promo && promoAppliesTo(promo, period)
    ? discounted(base, promo)
    : base;
}

export function formatPrice(value: number): string {
  return `$${parseFloat(value.toFixed(2))}`;
}
