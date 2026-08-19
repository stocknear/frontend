import { describe, expect, it } from "vitest";
import {
  getActivePromotion,
  getPurchaseValue,
  isEligibleUser,
} from "../../src/lib/constants/promo";

// Guards the live sale window. If PROMOTIONS is edited, these assertions are the
// thing that fails first — before a customer sees a price the checkout won't honour.
const LAUNCH = new Date("2026-08-19T16:00:00+02:00");
const DURING = new Date("2026-08-25T12:00:00+02:00");
const AFTER = new Date("2026-09-03T00:00:00+02:00");

describe("summer sale 2026-08b", () => {
  it("is 50% off annual while the window is open", () => {
    const promo = getActivePromotion(DURING);
    expect(promo?.percentOff).toBe(50);
    expect(promo?.scope).toEqual(["annual"]);
  });

  it("is live immediately, with no scheduled start", () => {
    expect(getActivePromotion(LAUNCH)).not.toBeNull();
    expect(getActivePromotion(LAUNCH)?.startsAt).toBeUndefined();
  });

  it("self-terminates past endsAt", () => {
    expect(getActivePromotion(AFTER)).toBeNull();
  });

  it("runs for the advertised 14 days from launch", () => {
    const endsAt = new Date(getActivePromotion(LAUNCH)?.endsAt ?? "").getTime();
    // The countdown floors to whole days, so this is the number its Days cell
    // shows at launch — the "14 days" promise, pinned.
    expect(Math.floor((endsAt - LAUNCH.getTime()) / 86_400_000)).toBe(14);
  });

  it("discounts annual but leaves monthly alone", () => {
    const promo = getActivePromotion(DURING);
    expect(getPurchaseValue("Pro", "annual", promo)).toBe(90);
    expect(getPurchaseValue("Plus", "annual", promo)).toBe(45);
    expect(getPurchaseValue("Pro", "monthly", promo)).toBe(20);
    expect(getPurchaseValue("Plus", "monthly", promo)).toBe(10);
  });

  it("charges full price once the sale is over", () => {
    const promo = getActivePromotion(AFTER);
    expect(getPurchaseValue("Pro", "annual", promo)).toBe(180);
    expect(getPurchaseValue("Plus", "annual", promo)).toBe(90);
  });

  it("hides the promo from users who already pay", () => {
    expect(isEligibleUser({ tier: "Pro" })).toBe(false);
    expect(isEligibleUser({ tier: "Plus" })).toBe(false);
    expect(isEligibleUser({ tier: "Free", lifetime: true })).toBe(false);
    expect(isEligibleUser({ tier: "Free" })).toBe(true);
  });
});
