import { expect, test } from "@playwright/test";

const localePaths = [
  ["en", "/about/"],
  ["de", "/de/about/"],
  ["zh-CN", "/zh-cn/about/"],
  ["zh-TW", "/zh-tw/about/"],
  ["es", "/es/about/"],
  ["fr", "/fr/about/"],
  ["ja", "/ja/about/"],
  ["ko", "/ko/about/"],
  ["ru", "/ru/about/"],
  ["uk", "/uk/about/"],
] as const;

for (const [locale, pathname] of localePaths) {
  test(`${locale} renders at its canonical URL`, async ({ page }) => {
    await page.goto(pathname);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    const finalPathname = new URL(page.url()).pathname;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://stocknear.com${finalPathname}`,
    );
  });
}

test("legacy Chinese and prefixed English URLs redirect permanently", async ({ request }) => {
  const chinese = await request.get("/zh/about/?tab=company", { maxRedirects: 0 });
  expect(chinese.status()).toBe(308);
  expect(chinese.headers().location).toBe("/zh-cn/about/?tab=company");

  const english = await request.get("/en/about/", { maxRedirects: 0 });
  expect(english.status()).toBe(308);
  expect(english.headers().location).toBe("/about/");
});

test("the footer dropdown switches from German back to durable English", async ({
  context,
  page,
}) => {
  await page.goto("/de/about/?from=locale-test");
  const disclosure = page.locator("footer details");
  const selector = disclosure.locator("summary");
  await expect(selector).toBeVisible();
  await selector.click();
  await expect(disclosure).toHaveAttribute("open", "");

  // Selecting the active locale does not navigate, so this directly verifies
  // that the disclosure itself closes instead of relying on a page reload.
  await page.getByRole("menuitem", { name: "Deutsch" }).click();
  await expect(disclosure).not.toHaveAttribute("open", "");

  await selector.click();
  await page.getByRole("menuitem", { name: "English" }).click();

  await expect(page).toHaveURL(/\/about\/?\?from=locale-test$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(
    (await context.cookies())?.find(
      (cookie) => cookie.name === "PARAGLIDE_LOCALE",
    )?.value,
  ).toBe("en");

  await page.reload();
  await expect(page).toHaveURL(/\/about\/?\?from=locale-test$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("a remembered locale wins on a later unprefixed entry URL", async ({ context, page }) => {
  await context.addCookies([{
    name: "PARAGLIDE_LOCALE",
    value: "fr",
    url: "http://127.0.0.1:4173",
  }]);
  await page.goto("/about/");
  await expect(page).toHaveURL(/\/fr\/about\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});

test("Cloudflare country bootstraps once and the fallback is English", async ({ playwright }) => {
  const frenchContext = await playwright?.request?.newContext({
    baseURL: "http://127.0.0.1:4173",
    extraHTTPHeaders: { "CF-IPCountry": "FR" },
  });
  const fallbackContext = await playwright?.request?.newContext({
    baseURL: "http://127.0.0.1:4173",
    extraHTTPHeaders: { "CF-IPCountry": "NL" },
  });

  try {
    const french = await frenchContext?.get("/about?from=geo", {
      maxRedirects: 0,
    });
    expect(french?.status()).toBe(307);
    expect(french?.headers()?.location).toBe("/fr/about?from=geo");
    expect(french?.headers()?.["set-cookie"]).toContain(
      "PARAGLIDE_LOCALE=fr",
    );

    const fallback = await fallbackContext?.get("/about?from=geo", {
      maxRedirects: 0,
    });
    expect(fallback?.status()).toBe(200);
    expect(fallback?.headers()?.["set-cookie"]).toContain(
      "PARAGLIDE_LOCALE=en",
    );
  } finally {
    await frenchContext?.dispose();
    await fallbackContext?.dispose();
  }
});

test("browser language does not override Cloudflare's English fallback", async ({ browser }) => {
  const context = await browser.newContext({ locale: "es-MX" });
  const page = await context.newPage();

  try {
    await page.goto("/about/");
    await expect(page).toHaveURL(/\/about\/?$/);
    await expect(page.getByText("Stocknear is available in Español.")).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  } finally {
    await context.close();
  }
});

// A client-side navigation that loses its `invalidateAll` (beforeNavigate cancels and re-issues
// one in +layout.svelte) must still refresh auth state. Two invariants hold that together, and
// both fail silently — every page still returns 200, only the logged-in state is wrong.

test("the root layout load stays URL-tracked", async ({ request }) => {
  // Guards `void url.pathname` in +layout.server.ts. Without it `uses` is `{}` and SvelteKit
  // serves the pre-login layout data for the rest of the SPA session.
  const response = await request.get("/de/__data.json?x-sveltekit-invalidated=11");
  expect(response.status()).toBe(200);
  expect((await response.json())?.nodes?.[0]?.uses).toEqual({ url: 1 });
});

test("a non-redirect action response passes through untouched", async ({ request }) => {
  // use:enhance posts get a 200 JSON body instead of a Location header, and the hook rewrites
  // the redirect ones. Everything else — including the devalue-encoded `data` and the auth
  // cookie the hook appends — has to survive that path unchanged.
  const enhanced = await request.post("/de/login?/login", {
    headers: { "x-sveltekit-action": "true", accept: "application/json" },
    form: { email: "nobody@example.com", password: "definitely-wrong" },
  });
  expect(enhanced.status()).toBe(200);
  expect(await enhanced.json()).toMatchObject({ type: "failure" });
  expect(enhanced.headers()["set-cookie"]).toContain("pb_auth=");
});

test("a forged x-sveltekit-action header cannot change a page response", async ({ request }) => {
  // The header is client-supplied. Without a method/content-type gate it would make the server
  // buffer a whole SSR document (~600KB here) just to fail a JSON parse.
  const [plain, forged] = await Promise.all([
    request.get("/de/about"),
    request.get("/de/about", { headers: { "x-sveltekit-action": "true" } }),
  ]);
  expect(forged.status()).toBe(plain.status());
  // Byte length, not body equality — melt-ui emits fresh element ids on every render.
  expect((await forged.body()).length).toBe((await plain.body()).length);
});
