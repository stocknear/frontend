import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const affectedPages = [
  "src/routes/stocks/screener/+page.svelte",
  "src/routes/etf/screener/+page.svelte",
  "src/routes/options-screener/+page.svelte",
  "src/routes/covered-call-screener/+page.svelte",
  "src/routes/cash-secured-put-screener/+page.svelte",
  "src/routes/options-flow/+page.svelte",
  "src/routes/unusual-order-flow/+page.svelte",
];

const source = (path: string) => readFileSync(path, "utf8");

describe("screener filter menus", () => {
  it.each(affectedPages)("uses the shared menu shell in %s", (path) => {
    const page = source(path);

    expect(page).toContain("<ScreenerFilterMenuContent");
    expect(page).not.toContain("absolute mt-2 h-11");
    expect(page).not.toContain("fixed sticky");
  });

  it("keeps the controls outside the scrolling option viewport", () => {
    const shell = source(
      "src/lib/components/ScreenerFilterMenuContent.svelte",
    );
    const header = shell.indexOf("data-screener-filter-header");
    const options = shell.indexOf("data-screener-filter-options");

    expect(header).toBeGreaterThan(-1);
    expect(options).toBeGreaterThan(header);
    expect(shell).toContain("overflow-hidden p-0");
    expect(shell).toContain("overflow-y-auto overscroll-contain");
  });

  it("uses semantic surfaces in the shared dropdown primitives", () => {
    for (const path of [
      "src/lib/components/shadcn/dropdown-menu/dropdown-menu-content.svelte",
      "src/lib/components/shadcn/dropdown-menu/dropdown-menu-sub-content.svelte",
    ]) {
      const primitive = source(path);
      expect(primitive).toContain("bg-popover");
      expect(primitive).toContain("border-line");
      expect(primitive).not.toContain("dark:bg-default");
    }
  });

  it("keeps dropdown interaction states neutral", () => {
    for (const path of [
      "src/lib/components/shadcn/dropdown-menu/dropdown-menu-item.svelte",
      "src/lib/components/shadcn/dropdown-menu/dropdown-menu-checkbox-item.svelte",
      "src/lib/components/shadcn/dropdown-menu/dropdown-menu-radio-item.svelte",
      "src/lib/components/shadcn/dropdown-menu/dropdown-menu-sub-trigger.svelte",
    ]) {
      const primitive = source(path);
      expect(primitive).toContain("bg-surface-raised");
      expect(primitive).toContain("text-fg");
      expect(primitive).not.toMatch(/data[^ ]*:bg-accent/);
      expect(primitive).not.toMatch(/data[^ ]*:text-accent-foreground/);
    }
  });

  it("uses neutral states in related overlay controls", () => {
    const selectItem = source(
      "src/lib/components/shadcn/select/select-item.svelte",
    );
    const commandItem = source(
      "src/lib/components/shadcn/command/command-item.svelte",
    );
    const button = source("src/lib/components/shadcn/button/index.ts");
    const dialog = source(
      "src/lib/components/shadcn/dialog/dialog-content.svelte",
    );

    expect(selectItem).toContain("data-highlighted:bg-surface-raised");
    expect(selectItem).not.toContain("data-highlighted:bg-primary");
    expect(commandItem).toContain("aria-selected:bg-surface-raised");
    expect(commandItem).not.toContain("aria-selected:bg-primary");
    expect(button).toContain("hover:bg-surface-raised hover:text-fg");
    expect(button).not.toContain("hover:bg-accent");
    expect(dialog).toContain("data-[state=open]:bg-surface-raised");
    expect(dialog).not.toContain("data-[state=open]:bg-accent");
  });

  it.each(affectedPages)("keeps filter headers neutral in %s", (path) => {
    const page = source(path);

    expect(page).toContain("hover:bg-surface-raised hover:text-fg");
    expect(page).not.toContain("hover:bg-accent hover:text-fg");
  });
});
