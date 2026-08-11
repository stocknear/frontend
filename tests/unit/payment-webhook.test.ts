import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("$env/static/private", () => ({
  LEMON_SQUEEZY_SECRET_KEY: "webhook-test-secret",
}));

import { POST } from "../../src/routes/payment/+server";

const state = vi.hoisted(() => ({
  updateUser: vi.fn(),
  findUsers: vi.fn(),
  createPayment: vi.fn(),
}));

const NOW_SECONDS = 1_786_480_200;

function expectedProof(recordId: string, tier: string, lifetime: boolean) {
  const canonical = `v1\n${NOW_SECONDS}\n${recordId}\n${tier}\n${
    lifetime ? "true" : "false"
  }`;
  return {
    "X-Stocknear-Billing-Timestamp": String(NOW_SECONDS),
    "X-Stocknear-Billing-Signature": crypto
      .createHmac("sha256", "webhook-test-secret")
      .update(canonical, "utf8")
      .digest("hex"),
  };
}

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

function locals() {
  return {
    pb: {
      collection: vi.fn((name: string) => {
        if (name === "users") {
          return { update: state.updateUser, getList: state.findUsers };
        }
        if (name === "payments") return { create: state.createPayment };
        throw new Error(`Unexpected collection: ${name}`);
      }),
    },
  };
}

describe("direct PocketBase payment webhook", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(NOW_SECONDS * 1000);
    state.updateUser.mockReset().mockResolvedValue(undefined);
    state.findUsers.mockReset().mockResolvedValue({ items: [] });
    state.createPayment.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it("updates the user and payment collections directly for a paid order", async () => {
    const payload = {
      meta: {
        event_name: "order_created",
        custom_data: { userId: "a".repeat(15) },
      },
      data: {
        attributes: {
          status: "paid",
          refunded: false,
          user_email: "user@example.com",
          first_order_item: { product_name: "Pro Subscription (Monthly)" },
        },
      },
    };

    const response = await POST({
      request: signedRequest(payload),
      locals: locals(),
    } as any);

    expect(response.status).toBe(200);
    expect(state.updateUser).toHaveBeenCalledWith(
      "a".repeat(15),
      {
        tier: "Pro",
        freeTrial: true,
        credits: 1000,
        lifetime: false,
      },
      { headers: expectedProof("a".repeat(15), "Pro", false) },
    );
    expect(state.createPayment).toHaveBeenCalledWith({
      user: "a".repeat(15),
      data: payload,
    });
  });

  it("rejects invalid signatures before touching PocketBase", async () => {
    const response = await POST({
      request: signedRequest({}, false),
      locals: locals(),
    } as any);

    expect(response.status).toBe(403);
    expect(state.updateUser).not.toHaveBeenCalled();
    expect(state.createPayment).not.toHaveBeenCalled();
  });

  it("downgrades an expired subscription through direct collections", async () => {
    const payload = {
      meta: {
        event_name: "subscription_expired",
        custom_data: { userId: "a".repeat(15) },
      },
      data: { attributes: { status: "expired", refunded: false } },
    };

    const response = await POST({
      request: signedRequest(payload),
      locals: locals(),
    } as any);

    expect(response.status).toBe(200);
    expect(state.updateUser).toHaveBeenCalledWith(
      "a".repeat(15),
      {
        tier: "Free",
        lifetime: false,
        freeTrial: true,
        credits: 10,
      },
      { headers: expectedProof("a".repeat(15), "Free", false) },
    );
    expect(state.createPayment).toHaveBeenCalledWith({
      user: "a".repeat(15),
      data: payload,
    });
  });

  it("binds the proof to the resulting billing state", async () => {
    const basePayload = {
      meta: {
        event_name: "order_created",
        custom_data: { userId: "a".repeat(15) },
      },
      data: {
        attributes: {
          status: "paid",
          refunded: false,
          user_email: "user@example.com",
          first_order_item: { product_name: "Pro Subscription (Monthly)" },
        },
      },
    };

    await POST({
      request: signedRequest(basePayload),
      locals: locals(),
    } as any);
    await POST({
      request: signedRequest({
        ...basePayload,
        data: {
          attributes: {
            ...basePayload.data.attributes,
            first_order_item: { product_name: "Pro Life Time" },
          },
        },
      }),
      locals: locals(),
    } as any);

    const firstHeaders = state.updateUser.mock.calls[0][2].headers;
    const secondHeaders = state.updateUser.mock.calls[1][2].headers;
    expect(firstHeaders).toEqual(expectedProof("a".repeat(15), "Pro", false));
    expect(secondHeaders).toEqual(expectedProof("a".repeat(15), "Pro", true));
    expect(secondHeaders["X-Stocknear-Billing-Signature"]).not.toBe(
      firstHeaders["X-Stocknear-Billing-Signature"],
    );
  });
});
