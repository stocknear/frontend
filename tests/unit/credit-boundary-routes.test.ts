import { describe, expect, it, vi } from "vitest";

vi.mock("$env/static/private", () => ({
  LEMON_SQUEEZY_SECRET_KEY: "credit-route-test-secret-0123456789",
}));

import { _reserveCredits } from "../../src/routes/api/chat/+server";

describe("chat credit helper", () => {
  it("keeps PocketBase write failures on the existing generic error path", async () => {
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
    await expect(
      _reserveCredits(pb as any, "a".repeat(15), 2),
    ).resolves.toEqual({
      ok: false,
      status: 500,
      error: "Failed to process credits",
    });
  });
});
