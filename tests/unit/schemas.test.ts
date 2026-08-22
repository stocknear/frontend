import { describe, it, expect } from "vitest";
import { registerUserSchema } from "../../src/lib/schemas.js";

describe("registerUserSchema", () => {
  it("accepts a password with the > character", () => {
    const validData = {
      email: "test@example.com",
      password: "Noc7c>Gc17j",
      passwordConfirm: "Noc7c>Gc17j",
    };

    const result = registerUserSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
