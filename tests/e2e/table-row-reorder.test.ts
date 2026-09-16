import { expect, test, type Page } from "@playwright/test";

const ROOT = "#table-reorder-test-root";

async function mountTable(page: Page) {
  await page.goto("/oauth/authorize?request=invalid");
  await page.evaluate(async () => {
    const target = document.createElement("div");
    target.id = "table-reorder-test-root";
    document.body.append(target);
    const { mountTableReorderHarness } =
      await import("/src/test-fixtures/table-reorder-harness.ts");
    mountTableReorderHarness(target);
  });
  await expect(page.locator(`${ROOT} tbody tr`)).toHaveCount(3);
}

const symbols = async (page: Page) =>
  (await page.locator(`${ROOT} tbody tr td:first-child`).allInnerTexts()).map(
    (t) => t.trim(),
  );

const grip = (page: Page, nth: number) =>
  page.locator(`${ROOT} tbody [title="Drag to reorder"]`).nth(nth);

const reorders = (page: Page) =>
  page.evaluate(() => (window as any).__reorders);

const dragGripToRow = (page: Page, fromNth: number, toNth: number) =>
  grip(page, fromNth).dragTo(page.locator(`${ROOT} tbody tr`).nth(toNth));

test("dragging a row down by its grip lands where the preview showed it", async ({
  page,
}) => {
  await mountTable(page);
  expect(await symbols(page)).toEqual(["AAPL", "AMD", "NVDA"]);

  // Downward: the regression that a purely upward test could not see.
  await dragGripToRow(page, 0, 2);

  expect(await symbols(page)).toEqual(["AMD", "NVDA", "AAPL"]);
  expect(await reorders(page)).toEqual([["AMD", "NVDA", "AAPL"]]);
});

test("dragging a row up by its grip reorders and reports the new order", async ({
  page,
}) => {
  await mountTable(page);

  await dragGripToRow(page, 2, 0);

  expect(await symbols(page)).toEqual(["NVDA", "AAPL", "AMD"]);
  expect(await reorders(page)).toEqual([["NVDA", "AAPL", "AMD"]]);
});

test("the row body is not a drag source", async ({ page }) => {
  await mountTable(page);

  const rows = page.locator(`${ROOT} tbody tr`);
  await expect(rows.first()).not.toHaveAttribute("draggable", "true");

  await rows.nth(2).dragTo(rows.first());
  expect(await symbols(page)).toEqual(["AAPL", "AMD", "NVDA"]);
  expect(await reorders(page)).toEqual([]);
});
