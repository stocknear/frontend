import crypto from "node:crypto";
import { LEMON_SQUEEZY_SECRET_KEY } from "$env/static/private";

type BillingTier = "Free" | "Plus" | "Pro";

export function billingTierWriteHeaders(
  userId: string,
  tier: BillingTier,
): Record<string, string> {
  if (!LEMON_SQUEEZY_SECRET_KEY) {
    throw new Error("Missing Lemon Squeezy secret key.");
  }
  if (
    !/^[a-z0-9]{15}$/.test(userId) ||
    !/^(?:Free|Plus|Pro)$/.test(tier)
  ) {
    throw new Error("Invalid billing tier write");
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const canonical = ["v1", timestamp, userId, tier].join("\n");

  return {
    "X-Stocknear-Billing-Timestamp": timestamp,
    "X-Stocknear-Billing-Signature": crypto
      .createHmac("sha256", LEMON_SQUEEZY_SECRET_KEY)
      .update(canonical, "utf8")
      .digest("hex"),
  };
}
