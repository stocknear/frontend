import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const component = readFileSync(
  new URL(
    "../../src/lib/components/Options/GreekByStrike.svelte",
    import.meta.url,
  ),
  "utf8",
);

const customRow = component.slice(
  component.indexOf("<!-- Custom Range Option -->"),
  component.indexOf("{:else}", component.indexOf("<!-- Custom Range Option -->")),
);

describe("GreekByStrike custom DTE layout", () => {
  it("bounds the menu to the viewport and lets both range fields shrink", () => {
    expect(component).toContain("w-[min(20rem,calc(100vw-2rem))]");
    expect(customRow).toContain(
      "grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
    );
    expect(customRow.match(/min-w-0 w-full/g)).toHaveLength(2);
  });

  it("uses theme tokens without the conflicting row hover treatment", () => {
    expect(customRow).toContain("bg-surface-raised/50");
    expect(customRow.match(/bg-surface-card/g)).toHaveLength(2);
    expect(customRow).not.toContain("hover:bg-accent");
    expect(customRow).not.toContain("dark:bg-zinc-800");
  });

  it("keeps the existing input behavior and adds accessible labels", () => {
    expect(customRow.match(/selectCustomIfNeeded\(\)/g)).toHaveLength(2);
    expect(customRow.match(/applyCustomRange\(\)/g)).toHaveLength(2);
    expect(customRow).toContain(
      "aria-label={stock_detail_options_greek_min()}",
    );
    expect(customRow).toContain(
      "aria-label={stock_detail_options_greek_max()}",
    );
  });
});
