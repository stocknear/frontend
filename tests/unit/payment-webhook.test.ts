import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("$env/static/private", () => ({
  LEMON_SQUEEZY_SECRET_KEY: "webhook-test-secret",
}));

import { POST } from "../../src/routes/payment/+server";

const state = vi.hoisted(() => ({ send: vi.fn() }));
const NOW_SECONDS = 1_786_480_200;
const OCCURRED_AT = "2026-08-11T20:00:00.000Z";

const raw = (payload: Record<string, unknown>) => JSON.stringify(payload);
const eventId = (payloadRaw: string) =>
  crypto.createHash("sha256").update(payloadRaw).digest("hex");

function expectedProof(event: Record<string, unknown>) {
  const canonical = [
    "v2",
    String(NOW_SECONDS),
    event.eventId,
    event.occurredAt,
    String(event.precedence),
    event.userId,
    event.userEmail,
    event.tier,
    event.lifetime ? "true" : "false",
    event.freeTrial ? "true" : "false",
    String(event.credits),
  ].join("\n");
  return {
    "X-Stocknear-Billing-Timestamp": String(NOW_SECONDS),
    "X-Stocknear-Billing-Signature": crypto
      .createHmac("sha256", "webhook-test-secret")
      .update(canonical, "utf8")
      .digest("hex"),
  };
}

const signedRequest = (payload: Record<string, unknown>, valid = true) => {
  const payloadRaw = raw(payload);
  const signature = crypto
    .createHmac("sha256", "webhook-test-secret")
    .update(payloadRaw)
    .digest("hex");
  return new Request("https://stocknear.com/payment", {
    method: "POST",
    headers: { "x-signature": valid ? signature : "0".repeat(64) },
    body: payloadRaw,
  });
};

const locals = () => ({ pb: { send: state.send } });

const paidPayload = () => ({
  meta: {
    event_name: "order_created",
    custom_data: {
      userId: "a".repeat(15),
      accountEmail: "user@example.com",
      accountProof: crypto
        .createHmac("sha256", "webhook-test-secret")
        .update(`checkout-v1\n${"a".repeat(15)}\nuser@example.com`)
        .digest("hex"),
    },
  },
  data: {
    id: "42",
    attributes: {
      status: "paid",
      refunded: false,
      updated_at: OCCURRED_AT,
      user_email: "User@Example.com",
      first_order_item: { product_name: "Pro Subscription (Monthly)" },
    },
  },
});

describe("atomic PocketBase payment webhook", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(NOW_SECONDS * 1000);
    state.send.mockReset().mockResolvedValue({ applied: true, duplicate: false });
  });

  afterEach(() => vi.restoreAllMocks());

  it("submits one complete, signed billing event instead of separate writes", async () => {
    const payload = paidPayload();
    const payloadRaw = raw(payload);
    const event = {
      eventId: eventId(payloadRaw),
      occurredAt: OCCURRED_AT,
      precedence: 10,
      userId: "a".repeat(15),
      userEmail: "user@example.com",
      tier: "Pro",
      lifetime: false,
      freeTrial: true,
      credits: 1000,
    };

    const response = await POST({ request: signedRequest(payload), locals: locals() } as any);

    expect(response.status).toBe(200);
    expect(state.send).toHaveBeenCalledWith("/api/stocknear/billing/event", {
      method: "POST",
      headers: expectedProof(event),
      body: { ...event, payloadRaw },
    });
  });

  it("rejects invalid Lemon signatures before touching PocketBase", async () => {
    const response = await POST({ request: signedRequest({}, false), locals: locals() } as any);
    expect(response.status).toBe(403);
    expect(state.send).not.toHaveBeenCalled();
  });

  it("rejects oversized bodies before signature or PocketBase work", async () => {
    const request = new Request("https://stocknear.com/payment", {
      method: "POST",
      headers: { "content-length": "900001" },
      body: "{}",
    });
    const response = await POST({ request, locals: locals() } as any);
    expect(response.status).toBe(413);
    expect(state.send).not.toHaveBeenCalled();
  });

  it("sends a complete Free state for an expired subscription", async () => {
    const payload = paidPayload();
    payload.meta.event_name = "subscription_expired";
    payload.data.attributes.status = "expired";
    const response = await POST({ request: signedRequest(payload), locals: locals() } as any);
    expect(response.status).toBe(200);
    expect(state.send.mock.calls[0][1].body).toMatchObject({
      userId: "",
      userEmail: "user@example.com",
      tier: "Free",
      precedence: 40,
      lifetime: false,
      freeTrial: true,
      credits: 10,
    });
  });

  it("rejects an unbound checkout even when it names a real account email", async () => {
    const payload = paidPayload();
    payload.meta.custom_data = { userId: "a".repeat(15) } as any;
    const response = await POST({ request: signedRequest(payload), locals: locals() } as any);
    expect(response.status).toBe(400);
    expect(state.send).not.toHaveBeenCalled();
  });

  it("preserves credits on lifecycle events", async () => {
    const payload = paidPayload();
    payload.meta.event_name = "subscription_updated";

    const response = await POST({ request: signedRequest(payload), locals: locals() } as any);

    expect(response.status).toBe(200);
    expect(state.send.mock.calls[0][1].body).toMatchObject({
      tier: "Pro",
      precedence: 20,
      credits: null,
    });
  });

  it.each(["subscription_payment_success", "subscription_payment_recovered"])(
    "grants the tier allowance on %s",
    async (eventName) => {
      const payload = paidPayload();
      payload.meta.event_name = eventName;

      const response = await POST({ request: signedRequest(payload), locals: locals() } as any);

      expect(response.status).toBe(200);
      expect(state.send.mock.calls[0][1].body).toMatchObject({
        tier: "Pro",
        precedence: 10,
        credits: 1000,
      });
    },
  );

  it("ignores unsupported events and unknown products without granting access", async () => {
    const unsupported = paidPayload();
    unsupported.meta.event_name = "subscription_payment_failed";
    expect((await POST({ request: signedRequest(unsupported), locals: locals() } as any)).status)
      .toBe(200);

    const unknownProduct = paidPayload();
    unknownProduct.data.attributes.first_order_item.product_name = "Mystery Product";
    expect((await POST({ request: signedRequest(unknownProduct), locals: locals() } as any)).status)
      .toBe(200);

    expect(state.send).not.toHaveBeenCalled();
  });

  it("preserves cancellation grace and downgrades refunded subscriptions", async () => {
    const cancelled = paidPayload();
    cancelled.meta.event_name = "subscription_cancelled";
    cancelled.data.attributes.status = "cancelled";
    await POST({ request: signedRequest(cancelled), locals: locals() } as any);
    expect(state.send.mock.calls[0][1].body).toMatchObject({
      tier: "Pro",
      precedence: 20,
      credits: null,
    });

    const refunded = paidPayload();
    refunded.meta.event_name = "subscription_payment_refunded";
    await POST({ request: signedRequest(refunded), locals: locals() } as any);
    expect(state.send.mock.calls[1][1].body).toMatchObject({
      tier: "Free",
      precedence: 40,
      credits: 10,
    });
  });

  it("binds proof to balances and rejects unordered payloads before PocketBase", async () => {
    const pro = paidPayload();
    const plus = paidPayload();
    plus.data.attributes.first_order_item.product_name = "Plus Subscription";
    await POST({ request: signedRequest(pro), locals: locals() } as any);
    await POST({ request: signedRequest(plus), locals: locals() } as any);
    expect(state.send.mock.calls[0][1].headers["X-Stocknear-Billing-Signature"])
      .not.toBe(state.send.mock.calls[1][1].headers["X-Stocknear-Billing-Signature"]);
    expect(state.send.mock.calls[1][1].body).toMatchObject({ tier: "Plus", credits: 150 });

    const invalid = paidPayload();
    delete (invalid.data.attributes as any).updated_at;
    const response = await POST({ request: signedRequest(invalid), locals: locals() } as any);
    expect(response.status).toBe(400);
    expect(state.send).toHaveBeenCalledTimes(2);
  });

  it("orders lifecycle events by the resource updated_at timestamp", async () => {
    const payload = paidPayload();
    payload.data.attributes.created_at = "2026-01-01T00:00:00.000Z";
    (payload.meta as any).event_created_at = "2026-08-11T21:00:00.000Z";
    const response = await POST({ request: signedRequest(payload), locals: locals() } as any);
    expect(response.status).toBe(200);
    expect(state.send.mock.calls[0][1].body.occurredAt).toBe(OCCURRED_AT);
  });

  it("uses the signed v1 flow only when an old PocketBase has no v2 route", async () => {
    state.send.mockRejectedValue({ status: 404, response: {} });
    const update = vi.fn().mockResolvedValue({});
    const create = vi.fn().mockResolvedValue({});
    const getOne = vi.fn().mockResolvedValue({
      id: "a".repeat(15),
      email: "user@example.com",
    });
    const pb = {
      send: state.send,
      collection: vi.fn((name: string) => name === "users"
        ? { getOne, update }
        : { create }),
    };
    const response = await POST({
      request: signedRequest(paidPayload()),
      locals: { pb },
    } as any);
    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      "a".repeat(15),
      { tier: "Pro", lifetime: false, freeTrial: true, credits: 1000 },
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Stocknear-Billing-Timestamp": String(NOW_SECONDS),
          "X-Stocknear-Billing-Signature": expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      }),
    );
    expect(create).toHaveBeenCalledTimes(1);
  });

  it.each([
    { status: 403, response: {} },
    { status: 500, response: {} },
    { status: 404, response: { code: "billing_user_not_found" } },
  ])("never falls back for authenticated v2 failures: $status/$response.code", async (error) => {
    state.send.mockRejectedValue(error);
    const collection = vi.fn();
    const response = await POST({
      request: signedRequest(paidPayload()),
      locals: { pb: { send: state.send, collection } },
    } as any);
    expect(response.status).toBe(500);
    expect(collection).not.toHaveBeenCalled();
  });
});
