import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("mobile header control surfaces", () => {
  it("keeps the menu transparent and aligns the other header control surfaces", () => {
    const layout = source("src/routes/+layout.svelte");
    const search = source("src/lib/components/Searchbar.svelte");
    const notifications = source("src/lib/components/NotificationBell.svelte");

    expect(layout).toContain(
      "rounded-full border-none bg-transparent text-fg-muted transition hover:bg-surface-raised dark:bg-transparent",
    );
    expect(layout).toContain(
      "rounded-full border border-line bg-surface-raised/60 transition hover:bg-surface-raised dark:bg-surface-raised/60",
    );
    expect(search).toContain(
      "h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-surface-raised/60",
    );
    expect(notifications).toContain(
      "h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-line bg-surface-raised/60",
    );
  });
});
