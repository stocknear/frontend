import { expect, test } from "@playwright/test";

test("rendering an OAuth session does not start or disable revoke", async ({
  page,
}) => {
  await page.goto("/oauth/authorize?request=invalid");
  await expect(page.locator(".navbar")).toHaveCount(0);
  await expect(
    page.locator(
      'script[src*="googletagmanager"], iframe[src*="googletagmanager"]',
    ),
  ).toHaveCount(0);
  await page.evaluate(async () => {
    const target = document.createElement("div");
    target.id = "mcp-access-test-root";
    document.body.append(target);
    const { mountMcpAccessHarness } =
      await import("/src/test-fixtures/mcp-access-harness.ts");
    mountMcpAccessHarness(target);
  });

  await expect(page.getByTestId("mcp-session-revoke")).toBeVisible();
  await expect(page.getByTestId("mcp-session-revoke")).toBeEnabled();
  await expect(page.getByTestId("mcp-session-revoke")).toHaveText("Disconnect");
});

test("rendered password and social login forms retain the OAuth continuation", async ({
  page,
}) => {
  const returnUrl = "/oauth/authorize?request=oauth_request_1234567890";
  const encodedReturnUrl = encodeURIComponent(returnUrl);
  await page.goto(`/login?returnUrl=${encodedReturnUrl}`);

  const passwordForm = page.locator('form:has(input[type="password"])');
  await expect(passwordForm).toHaveAttribute(
    "action",
    `?/login&returnUrl=${encodedReturnUrl}`,
  );

  const socialForms = page.locator('form:has(input[name="provider"])');
  await expect(socialForms).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    await expect(socialForms.nth(index)).toHaveAttribute(
      "action",
      `?/oauth2&returnUrl=${encodedReturnUrl}`,
    );
  }
});
