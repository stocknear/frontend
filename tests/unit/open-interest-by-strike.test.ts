import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { compile } from "svelte/compiler";

const path = new URL(
  "../../src/lib/components/Options/OpenInterestByStrike.svelte",
  import.meta.url,
);
const component = readFileSync(path, "utf8");

describe("OpenInterestByStrike", () => {
  it("indexes the series by the same array it uses for xAxis categories", () => {
    // `allStrikes` carries currentPrice as an extra slot so the plot line can be
    // positioned by category index. Mapping the series over `processedData`
    // instead left every strike above the price showing the next strike's OI.
    expect(component).toContain("categories: allStrikes");
    expect(component).toContain("const callValues = allStrikes?.map((s) => {");
    expect(component).toContain("const putValues = allStrikes?.map((s) => {");
    expect(component).not.toMatch(/const (call|put)Values = processedData/);
  });

  it("keeps a missing or zero quote off the strike axis", () => {
    // NaN/0 used to be injected as a phantom category with a $NaN plot line.
    expect(component).toContain(
      "const hasPrice = Number.isFinite(currentPrice) && currentPrice > 0;",
    );
    expect(component).toContain(
      "new Set(hasPrice ? [...strikes, currentPrice] : strikes),",
    );
    expect(component).toContain("plotLines: priceLine,");
    // The injected null slot must not split the line chart in two.
    expect(component).toContain("connectNulls: true");
    // Scatter sets no shared `points`.
    expect(component).toContain("(this.points ?? [this])?.forEach");
  });

  it("keeps the expiry dropdown label reactive", () => {
    // A zero-argument call to a local function compiles to untrack(), which froze
    // the label on "All Expirations" while the chart showed one expiry.
    const { js } = compile(component, { generate: "client" });
    expect(js.code).not.toContain("$.untrack(getSelectedDatesText)");
    expect(js.code).toContain(
      "$.untrack(() => getSelectedDatesText($.get(selectedDates)))",
    );
  });
});
