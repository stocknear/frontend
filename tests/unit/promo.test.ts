import { describe, expect, it } from "vitest";
import {
  getActivePromotion,
  getPurchaseValue,
  isEligibleUser,
} from "../../src/lib/constants/promo";

// Guards the live sale window. If PROMOTIONS is edited, these assertions are the
// thing that fails first — before a customer sees a price the checkout won't honour.
const DURING = new Date("2026-08-06T12:00:00+02:00");
const AFTER = new Date("2026-08-11T00:00:00+02:00");

describe("summer sale 2026-08", () => {
  it("is 75% off annual while the window is open", () => {
    const promo = getActivePromotion(DURING);
    expect(promo?.percentOff).toBe(75);
    expect(promo?.scope).toEqual(["annual"]);
  });

  it("self-terminates past endsAt", () => {
    expect(getActivePromotion(AFTER)).toBeNull();
  });

  it("discounts annual but leaves monthly alone", () => {
    const promo = getActivePromotion(DURING);
    expect(getPurchaseValue("Pro", "annual", promo)).toBe(45);
    expect(getPurchaseValue("Plus", "annual", promo)).toBe(22.5);
    expect(getPurchaseValue("Pro", "monthly", promo)).toBe(20);
    expect(getPurchaseValue("Plus", "monthly", promo)).toBe(10);
  });

  it("hides the promo from users who already pay", () => {
    expect(isEligibleUser({ tier: "Pro" })).toBe(false);
    expect(isEligibleUser({ tier: "Plus" })).toBe(false);
    expect(isEligibleUser({ tier: "Free", lifetime: true })).toBe(false);
    expect(isEligibleUser({ tier: "Free" })).toBe(true);
  });
});
