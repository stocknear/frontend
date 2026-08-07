import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkoutVariantEnvKey,
  checkoutVariantId,
  offersFreeTrial,
} from "../../src/lib/constants/freeTrial";

// Guards which product a user is sent to pay for. If the flag or the prefix logic is edited,
// these assertions fail before a customer is handed a checkout we didn't mean to offer.

const FRESH = { freeTrial: false }; // never used a trial
const CONSUMED = { freeTrial: true }; // already burned it

describe("offersFreeTrial", () => {
  it("offers only when the flag is on and the user has one left", () => {
    expect(offersFreeTrial(FRESH, true)).toBe(true);
    expect(offersFreeTrial(CONSUMED, true)).toBe(false);
    expect(offersFreeTrial(FRESH, false)).toBe(false);
    expect(offersFreeTrial(CONSUMED, false)).toBe(false);
  });

  it("treats a logged-out visitor as trial-eligible so the CTA matches the flag", () => {
    expect(offersFreeTrial(undefined, true)).toBe(true);
    expect(offersFreeTrial(null, false)).toBe(false);
  });
});

describe("checkoutVariantEnvKey", () => {
  it("covers every tier x period with the flag on", () => {
    expect(checkoutVariantEnvKey(FRESH, "pro", false, true)).toBe(
      "VITE_LEMON_SQUEEZY_FREE_TRIAL_MONTHLY_ID_PRO",
    );
    expect(checkoutVariantEnvKey(FRESH, "pro", true, true)).toBe(
      "VITE_LEMON_SQUEEZY_FREE_TRIAL_ANNUAL_ID_PRO",
    );
    expect(checkoutVariantEnvKey(FRESH, "plus", false, true)).toBe(
      "VITE_LEMON_SQUEEZY_FREE_TRIAL_MONTHLY_ID_PLUS",
    );
    expect(checkoutVariantEnvKey(FRESH, "plus", true, true)).toBe(
      "VITE_LEMON_SQUEEZY_FREE_TRIAL_ANNUAL_ID_PLUS",
    );
  });

  it("never returns a FREE_TRIAL key when the flag is off", () => {
    for (const tier of ["pro", "plus"] as const) {
      for (const annual of [true, false]) {
        for (const user of [FRESH, CONSUMED, undefined]) {
          expect(checkoutVariantEnvKey(user, tier, annual, false)).not.toContain(
            "FREE_TRIAL",
          );
        }
      }
    }
  });

  it("never returns a FREE_TRIAL key for a user who already used the trial", () => {
    for (const tier of ["pro", "plus"] as const) {
      for (const annual of [true, false]) {
        expect(checkoutVariantEnvKey(CONSUMED, tier, annual, true)).not.toContain(
          "FREE_TRIAL",
        );
      }
    }
  });

  it("matches the exact key names the old inline code built", () => {
    expect(checkoutVariantEnvKey(CONSUMED, "pro", true, true)).toBe(
      "VITE_LEMON_SQUEEZY_ANNUAL_ID_PRO",
    );
    expect(checkoutVariantEnvKey(CONSUMED, "plus", false, true)).toBe(
      "VITE_LEMON_SQUEEZY_MONTHLY_ID_PLUS",
    );
  });
});

describe("checkoutVariantId", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reads the id the key points at", () => {
    vi.stubEnv("VITE_LEMON_SQUEEZY_MONTHLY_ID_PRO", " plain-id ");
    vi.stubEnv("VITE_LEMON_SQUEEZY_FREE_TRIAL_MONTHLY_ID_PRO", "trial-id");

    expect(checkoutVariantId(FRESH, "pro", false, false)).toBe("plain-id");
    expect(checkoutVariantId(FRESH, "pro", false, true)).toBe("trial-id");
  });

  it("returns empty rather than 'undefined' when the var is absent", () => {
    // stubbed explicitly: relying on the var merely being absent from the test env
    // would silently start failing the day a root .env is added.
    vi.stubEnv("VITE_LEMON_SQUEEZY_ANNUAL_ID_PLUS", "");
    expect(checkoutVariantId(FRESH, "plus", true, false)).toBe("");
  });
});
