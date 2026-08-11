import { describe, expect, it, vi } from "vitest";

vi.mock("$env/static/private", () => ({
  LEMON_SQUEEZY_SECRET_KEY: "credit-route-test-secret-0123456789",
}));

import { reserveCredits } from "../../src/routes/api/chat/+server";
import { POST as historicalExport } from "../../src/routes/api/historical-price-interval-export/+server";

describe("credit boundary routes", () => {
  it("maps PocketBase's atomic insufficient-credit rejection to the normal 400", async () => {
    const update = vi.fn().mockRejectedValue({
      status: 400,
      message: "Insufficient credits.",
    });
    const pb = {
      collection: vi.fn(() => ({
        getOne: vi.fn().mockResolvedValue({ id: "a".repeat(15), credits: 2 }),
        update,
      })),
    };
    await expect(reserveCredits(pb as any, "a".repeat(15), 2)).resolves.toEqual({
      ok: false,
      status: 400,
      error: "Insufficient credits. Credits are reset at the start of each month.",
    });
  });

  it("serves no export bytes at the exact 500-download cap", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const update = vi.fn();
    const response = await historicalExport({
      request: new Request("http://localhost/api/historical-price-interval-export", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      locals: {
        apiURL: "http://backend.invalid",
        apiKey: "test",
        clientIp: "127.0.0.1",
        user: {
          id: "a".repeat(15),
          tier: "Pro",
          credits: 1000,
          downloadCredits: 500,
        },
        pb: { collection: vi.fn(() => ({ update })) },
      },
    } as any);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: expect.any(String) });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
