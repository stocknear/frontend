import { beforeEach, describe, expect, it, vi } from "vitest";

const cache = new Map<string, unknown>();
let locale = "en";

vi.mock("$lib/store", () => ({
  getCache: (key: string) => cache.get(key),
  setCache: (key: string, value: unknown) => cache.set(key, value),
}));

vi.mock("$lib/paraglide/runtime.js", () => ({
  getLocale: () => locale,
}));

import {
  escapeInfoTextHtml,
  fetchInfoText,
  infoTextCacheKey,
} from "$lib/i18n/info-text";

describe("localized info text", () => {
  beforeEach(() => {
    cache.clear();
    locale = "en";
    vi.restoreAllMocks();
  });

  it("isolates cache entries by locale", () => {
    expect(infoTextCacheKey("marketCap", "en")).toBe("en:marketCap");
    expect(infoTextCacheKey("marketCap", "es")).toBe("es:marketCap");
  });

  it("escapes backend copy before placing it in an HTML tooltip", () => {
    expect(escapeInfoTextHtml('Micro (<$100M) & "small"')).toBe(
      "Micro (&lt;$100M) &amp; &quot;small&quot;",
    );
  });

  it("sends the active locale and reuses only that locale's cache", async () => {
    const request = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ text: "Capitalización bursátil" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    locale = "es";

    await expect(fetchInfoText("marketCap")).resolves.toEqual({
      text: "Capitalización bursátil",
    });
    await fetchInfoText("marketCap");

    expect(request).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(request.mock.calls[0]?.[1]?.body))).toEqual({
      parameter: "marketCap",
      locale: "es",
    });
  });

  it("does not reuse a tooltip after the language changes", async () => {
    const request = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ text: "Market cap" })))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ text: "Capitalisation boursière" })),
      );

    await fetchInfoText("marketCap");
    locale = "fr";
    await expect(fetchInfoText("marketCap")).resolves.toEqual({
      text: "Capitalisation boursière",
    });

    expect(request).toHaveBeenCalledTimes(2);
  });
});
