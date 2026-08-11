import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("$env/static/private", () => ({
  LEMON_SQUEEZY_SECRET_KEY: "protected-write-test-secret-0123456789",
}));

import { createBillingAccountProof } from "$lib/server/billingAccountProof";
import { protectedUserWriteHeaders } from "$lib/server/pocketbaseUserWrite";

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(target) : [target];
  });
}

describe("protected PocketBase user writes", () => {
  afterEach(() => vi.restoreAllMocks());

  it("signs a canonical modifier-only operation bound to the user", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_786_480_200_000);
    const headers = protectedUserWriteHeaders("a".repeat(15), {
      "downloadCredits+": 1,
      "credits-": 3,
    });
    const operation = '{"credits-":3,"downloadCredits+":1}';
    const bodyHash = crypto.createHash("sha256").update(operation).digest("hex");
    const canonical = [
      "v3",
      "1786480200",
      headers["X-Stocknear-User-Write-Nonce"],
      "a".repeat(15),
      bodyHash,
    ].join("\n");
    expect(headers["X-Stocknear-User-Write-Operation"]).toBe(operation);
    expect(headers["X-Stocknear-User-Write-Body-SHA256"]).toBe(bodyHash);
    expect(headers["X-Stocknear-User-Write-Signature"]).toBe(
      crypto
        .createHmac("sha256", "protected-write-test-secret-0123456789")
        .update(canonical)
        .digest("hex"),
    );
  });

  it("rejects empty, absolute, fractional, negative, and excessive operations", () => {
    for (const body of [
      {},
      { credits: 1 },
      { "credits+": 0.5 },
      { "credits-": -1 },
      { "downloadCredits+": 10_001 },
    ]) {
      expect(() => protectedUserWriteHeaders("a".repeat(15), body)).toThrow(
        "Invalid protected user write body",
      );
    }
  });

  it("binds checkout identity to the current Stocknear email", () => {
    const binding = createBillingAccountProof({
      id: "a".repeat(15),
      email: " User@Example.com ",
    });
    const canonical = `checkout-v1\n${"a".repeat(15)}\nuser@example.com`;
    expect(binding).toEqual({
      accountEmail: "user@example.com",
      accountProof: crypto
        .createHmac("sha256", "protected-write-test-secret-0123456789")
        .update(canonical)
        .digest("hex"),
    });
  });

  it("keeps every server-side credit writer behind the shared proof helper", () => {
    const files = sourceFiles(path.resolve("src/routes"))
      .filter((file) => /\.(?:ts|js)$/.test(file));
    const unsigned: string[] = [];
    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      const updateCount = (
        source.match(/collection\(["']users["']\)\??\.update/g) ?? []
      ).length;
      if (!updateCount || !/\b(?:credits|downloadCredits)\b/.test(source)) continue;
      const proofCount = (
        source.match(/headers:\s*(?:protectedUserWriteHeaders|legacyBillingProofHeaders)\(/g) ?? []
      ).length;
      if (proofCount !== updateCount) unsigned.push(path.relative(process.cwd(), file));
    }
    expect(unsigned).toEqual([]);
  });
});
