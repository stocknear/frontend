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

test("the footer dropdown switches from German back to durable English", async ({ context, page }) => {
  await page.goto("/de/about/?from=locale-test");
  const selector = page?.locator(
    'footer summary[aria-label="Sprache wechseln"]',
  );
  await expect(selector).toBeVisible();
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
