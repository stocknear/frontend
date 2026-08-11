import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("$env/static/private", () => ({
  LEMON_SQUEEZY_API_KEY: "lemon-test-key",
}));

import {
  actions,
  _subscriptionIdFromPayment,
} from "../../src/routes/profile/+page.server";

describe("profile subscription ownership", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("extracts only numeric provider subscription identifiers", () => {
    expect(
      _subscriptionIdFromPayment({
        data: { data: { type: "subscriptions", id: "12345", attributes: {} } },
      }),
    ).toBe("12345");
    expect(
      _subscriptionIdFromPayment({
        data: {
          data: {
            type: "orders",
            attributes: {
              first_subscription_item: { subscription_id: "67890" },
            },
          },
        },
      }),
    ).toBe("67890");
    expect(
      _subscriptionIdFromPayment({
        data: { data: { type: "subscriptions", id: "../admin" } },
      }),
    ).toBeNull();
  });

  it("ignores a browser-supplied subscription ID and uses the authenticated owner's payment", async () => {
    const providerFetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    const getList = vi.fn().mockResolvedValue({
      items: [
        {
          data: {
            data: { type: "subscriptions", id: "12345", attributes: {} },
          },
        },
      ],
    });
    const locals = {
      user: { id: "a".repeat(15) },
      pb: {
        authStore: { isValid: true },
        collection: vi.fn(() => ({ getList })),
      },
    };
    const request = new Request(
      "https://stocknear.com/profile?/cancelSubscription",
      {
        method: "POST",
        body: new URLSearchParams({ subscriptionId: "99999" }),
      },
    );

    await expect(
      actions.cancelSubscription({ locals, request } as any),
    ).rejects.toMatchObject({ status: 302, location: "/profile" });
    expect(getList).toHaveBeenCalledWith(1, 20, {
      filter: `user="${locals.user.id}"`,
      sort: "-created",
    });
    expect(String(providerFetch.mock.calls[0][0])).toBe(
      "https://api.lemonsqueezy.com/v1/subscriptions/12345",
    );
    expect(String(providerFetch.mock.calls[0][0])).not.toContain("99999");
  });
});
