import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const privateEnv = vi.hoisted(() => ({
  POCKETBASE_FRONTEND_KEY: "",
  POCKETBASE_INTERNAL_URL: "",
}));
vi.mock("$env/dynamic/private", () => ({ env: privateEnv }));

import {
  PocketBasePrivateError,
  adjustPocketBaseCredits,
  applyPocketBaseBilling,
  registerPocketBaseUser,
} from "../../src/lib/server/pocketbasePrivate";

const key = "k".repeat(48);

describe("private PocketBase route client", () => {
  beforeEach(() => {
    privateEnv.POCKETBASE_FRONTEND_KEY = key;
    privateEnv.POCKETBASE_INTERNAL_URL = "http://127.0.0.1:8090";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the loopback route and server-only bearer for an atomic credit delta", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          userId: "a".repeat(15),
          credits: 8,
          downloadCredits: 2,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    await expect(
      adjustPocketBaseCredits({
        userId: "a".repeat(15),
        creditsDelta: -2,
        downloadCreditsDelta: 1,
      }),
    ).resolves.toEqual({
      userId: "a".repeat(15),
      credits: 8,
      downloadCredits: 2,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "http://127.0.0.1:8090/api/stocknear/account/credits/adjust",
    );
    expect((init?.headers as Record<string, string>).authorization).toBe(
      `Bearer ${key}`,
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      userId: "a".repeat(15),
      creditsDelta: -2,
      downloadCreditsDelta: 1,
    });
    expect(init?.redirect).toBe("error");
  });

  it("never sends the private bearer to a non-loopback URL", async () => {
    privateEnv.POCKETBASE_INTERNAL_URL = "https://useast-pb.stocknear.com";
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(
      adjustPocketBaseCredits({ userId: "a".repeat(15), creditsDelta: -1 }),
    ).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when the server-only key or exact response is invalid", async () => {
    privateEnv.POCKETBASE_FRONTEND_KEY = "short";
    await expect(
      adjustPocketBaseCredits({ userId: "a".repeat(15), creditsDelta: -1 }),
    ).rejects.toBeInstanceOf(PocketBasePrivateError);

    privateEnv.POCKETBASE_FRONTEND_KEY = key;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          userId: "a".repeat(15),
          credits: 8,
          downloadCredits: 2,
          leaked: true,
        }),
        { status: 200 },
      ),
    );
    await expect(
      adjustPocketBaseCredits({ userId: "a".repeat(15), creditsDelta: -1 }),
    ).rejects.toMatchObject({ status: 502 });
  });

  it("uses exact registration and nullable-credit billing contracts", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ id: "a".repeat(15), email: "pro@example.com" }),
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            userId: "a".repeat(15),
            paymentId: "b".repeat(15),
            tier: "Pro",
            lifetime: false,
            credits: 73,
            freeTrial: true,
          }),
          { status: 200 },
        ),
      );

    await expect(
      registerPocketBaseUser({
        email: "pro@example.com",
        password: "correct horse battery staple",
        passwordConfirm: "correct horse battery staple",
      }),
    ).resolves.toEqual({ id: "a".repeat(15), email: "pro@example.com" });

    await expect(
      applyPocketBaseBilling({
        userId: "a".repeat(15),
        tier: "Pro",
        lifetime: false,
        credits: null,
        freeTrial: true,
        paymentData: { data: { id: "subscription" } },
      }),
    ).resolves.toBeUndefined();
    expect(
      JSON.parse(String(fetchMock.mock.calls[1][1]?.body)).credits,
    ).toBeNull();
  });

  it("accepts an authoritative stale-event no-op response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          userId: "a".repeat(15),
          paymentId: "b".repeat(15),
          tier: "Free",
          lifetime: false,
          credits: 10,
          freeTrial: false,
        }),
        { status: 200 },
      ),
    );

    await expect(
      applyPocketBaseBilling({
        userId: "a".repeat(15),
        tier: "Pro",
        lifetime: false,
        credits: null,
        freeTrial: false,
        paymentData: { data: { id: "stale-subscription" } },
      }),
    ).resolves.toBeUndefined();
  });
});
