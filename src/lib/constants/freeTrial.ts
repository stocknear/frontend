// Single source of truth for the free-trial workflow.
// ponytail: build-time flag — Vite inlines VITE_ vars, so flipping needs a rebuild (deploy.sh).
// Defaults OFF: a missing or misspelled var must never accidentally offer unpaid trials.
export const FREE_TRIAL_ENABLED =
  import.meta.env.VITE_FREE_TRIAL_ENABLED === "true";

type TrialUser = { freeTrial?: boolean } | null | undefined;

// PocketBase `user.freeTrial === true` means the trial was already used — semantics unchanged.
// `enabled` is injectable so both flag states are testable, same as getActivePromotion(now).
export function offersFreeTrial(
  user: TrialUser,
  enabled: boolean = FREE_TRIAL_ENABLED,
): boolean {
  return enabled && !user?.freeTrial;
}

// The env var holding this plan's checkout id. Pure — this is the part worth testing.
export function checkoutVariantEnvKey(
  user: TrialUser,
  tier: "pro" | "plus",
  annual: boolean,
  enabled: boolean = FREE_TRIAL_ENABLED,
): string {
  const plan = `${annual ? "ANNUAL" : "MONTHLY"}_ID_${tier.toUpperCase()}`;
  const prefix = offersFreeTrial(user, enabled)
    ? "VITE_LEMON_SQUEEZY_FREE_TRIAL_"
    : "VITE_LEMON_SQUEEZY_";
  return `${prefix}${plan}`;
}

// Checkout variant for a plan. Was duplicated verbatim in pricing and register.
export function checkoutVariantId(
  user: TrialUser,
  tier: "pro" | "plus",
  annual: boolean,
  enabled: boolean = FREE_TRIAL_ENABLED,
): string {
  const key = checkoutVariantEnvKey(user, tier, annual, enabled);
  const id = String(import.meta.env[key] ?? "").trim();
  if (!id && import.meta.env.DEV) {
    // Both callers silently return on "", so without this the button just does nothing.
    console.warn(`[freeTrial] no checkout id for ${key} — button will no-op`);
  }
  return id;
}
