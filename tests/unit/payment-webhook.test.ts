import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const applyBilling = vi.hoisted(() => vi.fn());
vi.mock("$env/static/private", () => ({
  LEMON_SQUEEZY_SECRET_KEY: "webhook-test-secret",
}));
vi.mock("$lib/server/pocketbasePrivate", () => ({
  applyPocketBaseBilling: applyBilling,
}));

import { POST } from "../../src/routes/payment/+server";

const signedRequest = (payload: Record<string, unknown>, signature = true) => {
  const body = JSON.stringify(payload);
  const digest = crypto
    .createHmac("sha256", "webhook-test-secret")
    .update(body)
    .digest("hex");
  return new Request("https://stocknear.com/payment", {
    method: "POST",
    headers: { "x-signature": signature ? digest : "0".repeat(64) },
    body,
  });
};

describe("payment webhook projection", () => {
  beforeEach(() => applyBilling.mockReset().mockResolvedValue(undefined));

  it("does not grant Pro for an unknown paid product", async () => {
    const request = signedRequest({
      meta: {
        event_name: "subscription_updated",
        custom_data: { userId: "a".repeat(15) },
      },
      data: {
        attributes: {
          status: "active",
          refunded: false,
          product_name: "Unknown Product",
          user_email: "user@example.com",
        },
      },
    });

    const response = await POST({ request } as any);
    expect(response.status).toBe(200);
    expect(applyBilling).toHaveBeenCalledWith(
      expect.objectContaining({ tier: "Free", lifetime: false, credits: 10 }),
    );
  });

  it("preserves credits for ordinary paid lifecycle updates", async () => {
    const request = signedRequest({
      meta: {
        event_name: "subscription_updated",
        custom_data: { userId: "a".repeat(15) },
      },
      data: {
        attributes: {
          status: "active",
          refunded: false,
          product_name: "Pro Subscription (Monthly)",
          user_email: "user@example.com",
        },
      },
    });

    expect((await POST({ request } as any)).status).toBe(200);
    expect(applyBilling).toHaveBeenCalledWith(
      expect.objectContaining({ tier: "Pro", lifetime: false, credits: null }),
    );
  });

  it("rejects invalid signatures before calling PocketBase", async () => {
    const request = signedRequest({}, false);
    expect((await POST({ request } as any)).status).toBe(403);
    expect(applyBilling).not.toHaveBeenCalled();
  });

  it("acknowledges unrelated signed events without changing billing", async () => {
    const request = signedRequest({
      meta: {
        event_name: "customer_updated",
        custom_data: { userId: "a".repeat(15) },
      },
      data: {
        attributes: {
          status: "active",
          product_name: "Pro Subscription (Monthly)",
        },
      },
    });

    const response = await POST({ request } as any);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Webhook ignored" });
    expect(applyBilling).not.toHaveBeenCalled();
  });
});
