import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("$env/static/private", () => ({
  LEMON_SQUEEZY_SECRET_KEY: "webhook-test-secret-0123456789abcdef",
}));

import { POST } from "../../src/routes/payment/+server";

const NOW_SECONDS = 1_786_480_200;
const USER_ID = "a".repeat(15);
const SECRET = "webhook-test-secret-0123456789abcdef";

const signedRequest = (payload: Record<string, unknown>) => {
  const body = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(body)
    .digest("hex");
  return new Request("https://stocknear.com/payment", {
    method: "POST",
    headers: { "x-signature": signature },
    body,
  });
};

const expectedBillingHeaders = (tier: string) => {
  const canonical = ["v1", String(NOW_SECONDS), USER_ID, tier].join("\n");
  return {
    "X-Stocknear-Billing-Timestamp": String(NOW_SECONDS),
    "X-Stocknear-Billing-Signature": crypto
      .createHmac("sha256", SECRET)
      .update(canonical)
      .digest("hex"),
  };
};

describe("legacy-compatible payment webhook", () => {
  const update = vi.fn();
  const create = vi.fn();
  const collection = vi.fn((name: string) =>
    name === "users" ? { update } : { create },
  );

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(NOW_SECONDS * 1000);
    update.mockReset().mockResolvedValue({});
    create.mockReset().mockResolvedValue({});
    collection.mockClear();
  });

  it("accepts the production order_created shape and signs only the tier write", async () => {
    const payload = {
      meta: {
        event_name: "order_created",
        custom_data: { userId: USER_ID },
      },
      data: {
        attributes: {
          status: "paid",
          refunded: false,
          first_order_item: { product_name: "Pro Subscription (Monthly)" },
        },
      },
    };

    const response = await POST({
      request: signedRequest(payload),
      locals: { pb: { collection } },
    } as any);

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      USER_ID,
      { tier: "Pro", freeTrial: true, credits: 1000, lifetime: false },
      { headers: expectedBillingHeaders("Pro") },
    );
    expect(create).toHaveBeenCalledWith({ user: USER_ID, data: payload });
  });

  it("signs expiry with Free without changing baseline lifetime behavior", async () => {
    const payload = {
      meta: {
        event_name: "subscription_expired",
        custom_data: { userId: USER_ID },
      },
      data: { attributes: { status: "expired" } },
    };

    const response = await POST({
      request: signedRequest(payload),
      locals: { pb: { collection } },
    } as any);

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      USER_ID,
      { tier: "Free", freeTrial: true, credits: 10 },
      { headers: expectedBillingHeaders("Free") },
    );
  });

  it("rejects an invalid Lemon signature", async () => {
    const response = await POST({
      request: new Request("https://stocknear.com/payment", {
        method: "POST",
        headers: { "x-signature": "0".repeat(64) },
        body: "{}",
      }),
      locals: { pb: { collection } },
    } as any);

    expect(response.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});
