import { describe, expect, it } from "vitest";
import {
  getActivePromotion,
  getPurchaseValue,
  isEligibleUser,
} from "../../src/lib/constants/promo";

// Guards the live sale window. If PROMOTIONS is edited, these assertions are the
// thing that fails first — before a customer sees a price the checkout won't honour.
const BEFORE = new Date("2026-08-22T12:00:00+02:00");
const DURING = new Date("2026-08-30T12:00:00+02:00");
const AFTER = new Date("2026-09-07T00:00:00+02:00");

describe("summer sale 2026-08b", () => {
  it("is 50% off annual while the window is open", () => {
    const promo = getActivePromotion(DURING);
    expect(promo?.percentOff).toBe(50);
    expect(promo?.scope).toEqual(["annual"]);
  });

  it("stays dark until startsAt, so the code can ship before the sale", () => {
    expect(getActivePromotion(BEFORE)).toBeNull();
  });

  it("self-terminates past endsAt", () => {
    expect(getActivePromotion(AFTER)).toBeNull();
  });

  it("runs for the advertised 14 days", () => {
    const promo = getActivePromotion(DURING);
    const startsAt = new Date(promo?.startsAt ?? "").getTime();
    const endsAt = new Date(promo?.endsAt ?? "").getTime();
    // The countdown floors to whole days, so this is the number its Days cell
    // shows at launch — the "ends in 14 days" promise, pinned.
    expect(Math.floor((endsAt - startsAt) / 86_400_000)).toBe(14);
  });

  it("discounts annual but leaves monthly alone", () => {
    const promo = getActivePromotion(DURING);
    expect(getPurchaseValue("Pro", "annual", promo)).toBe(90);
    expect(getPurchaseValue("Plus", "annual", promo)).toBe(45);
    expect(getPurchaseValue("Pro", "monthly", promo)).toBe(20);
    expect(getPurchaseValue("Plus", "monthly", promo)).toBe(10);
  });

  it("charges full price before the sale opens", () => {
    const promo = getActivePromotion(BEFORE);
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
