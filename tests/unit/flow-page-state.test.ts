import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import {
  OPTIONS_FLOW_LIVE_STORAGE_KEY,
  OPTIONS_FLOW_CATEGORICAL_RULES,
  OPTIONS_FLOW_NUMERIC_RULES,
  UNUSUAL_ORDER_FLOW_LIVE_STORAGE_KEY,
  calendarDayDifference,
  compareFlowDte,
  isActiveFlowFilterValue,
  isLiveFlowDate,
  isValidFlowNumericFilterValue,
  normalizeFlowRules,
  parseFlowNumber,
  parseStoredBoolean,
  readStoredBoolean,
  writeStoredBoolean,
} from "../../src/lib/flow-page-state";
import { getLocalTimeZone, today } from "@internationalized/date";

describe("flow page state", () => {
  it.each([0, "0", -1, [0, ""], ["", 5], ["Calls", "Puts"]])(
    "treats %j as an active filter",
    (value) => expect(isActiveFlowFilterValue(value)).toBe(true),
  );

  it.each([
    null,
    undefined,
    "",
    "  ",
    "any",
    "ANY",
    [],
    [""],
    ["Any"],
    ["any", "Calls"],
    true,
    false,
    {},
    [{}],
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])("treats %j as an inactive filter", (value) =>
    expect(isActiveFlowFilterValue(value)).toBe(false),
  );

  it("strictly parses decorated flow numbers", () => {
    expect(parseFlowNumber(0)).toBe(0);
    expect(parseFlowNumber("0")).toBe(0);
    expect(parseFlowNumber("$1.5M")).toBe(1_500_000);
    expect(parseFlowNumber("10%")).toBe(10);
    expect(parseFlowNumber("-1")).toBe(-1);
    expect(parseFlowNumber("1garbage")).toBeNull();
    expect(parseFlowNumber("NaN")).toBeNull();
    expect(parseFlowNumber({})).toBeNull();
  });

  it("validates numeric filters without dropping zero or one-sided ranges", () => {
    expect(isValidFlowNumericFilterValue(0, "exactly")).toBe(true);
    expect(isValidFlowNumericFilterValue([0, ""], "between")).toBe(true);
    expect(isValidFlowNumericFilterValue(["", "5M"], "between")).toBe(true);
    expect(isValidFlowNumericFilterValue("1garbage", "exactly")).toBe(false);
    expect(isValidFlowNumericFilterValue([0, "bad"], "between")).toBe(false);
    expect(isValidFlowNumericFilterValue([], "between")).toBe(false);
    expect(isValidFlowNumericFilterValue(0, "invalid")).toBe(false);
  });

  it("normalizes REST and WebSocket rules to the same safe data shape", () => {
    expect(
      normalizeFlowRules(
        [
          { name: "size", condition: "exactly", value: "$1.5M" },
          { name: "volume", condition: "exactly", value: "1,000" },
          { name: "date_expiration", condition: "exactly", value: 0 },
          { name: "cost_basis", condition: "between", value: ["", "5M"] },
          { name: "put_call", value: ["Calls", 5] },
          { name: "sentiment", value: ["Bullish"] },
          { name: "size", condition: "exactly", value: "1garbage" },
          null,
        ],
        OPTIONS_FLOW_NUMERIC_RULES,
        OPTIONS_FLOW_CATEGORICAL_RULES,
      ),
    ).toEqual([
      { name: "size", condition: "exactly", value: 1_500_000 },
      { name: "volume", condition: "exactly", value: 1_000 },
      { name: "date_expiration", condition: "exactly", value: 0 },
      { name: "cost_basis", condition: "between", value: [null, 5_000_000] },
      { name: "sentiment", value: ["Bullish"] },
    ]);
  });

  it("keeps real picks when a stale \"any\" sentinel rides along", () => {
    expect(
      normalizeFlowRules(
        [
          { name: "sentiment", value: ["any", "Bullish"] },
          { name: "put_call", value: ["any", "Calls", "Puts"] },
          { name: "moneyness", value: ["any"] },
          { name: "execution_estimate", value: "any" },
          { name: "underlying_type", value: ["Any"] },
          { name: "flowType", value: [] },
          { name: "option_activity_type", value: ["any", 5] },
        ],
        OPTIONS_FLOW_NUMERIC_RULES,
        OPTIONS_FLOW_CATEGORICAL_RULES,
      ),
    ).toEqual([
      { name: "sentiment", value: ["Bullish"] },
      { name: "put_call", value: ["Calls", "Puts"] },
    ]);
  });

  it("treats today and later as live, earlier dates as historical", () => {
    const now = today(getLocalTimeZone());
    expect(isLiveFlowDate(now)).toBe(true);
    expect(isLiveFlowDate(now.add({ days: 1 }))).toBe(true);
    expect(isLiveFlowDate(now.subtract({ days: 1 }))).toBe(false);
    expect(isLiveFlowDate(now.subtract({ days: 365 }))).toBe(false);
  });

  it("parses only explicit stored booleans", () => {
    expect(parseStoredBoolean("true", false)).toBe(true);
    expect(parseStoredBoolean("false", true)).toBe(false);
    expect(parseStoredBoolean("1", false)).toBe(false);
    expect(parseStoredBoolean(null, true)).toBe(true);
  });

  it("handles unavailable browser storage without breaking the toggle", () => {
    expect(
      readStoredBoolean(
        {
          getItem: () => {
            throw new Error("blocked");
          },
        },
        OPTIONS_FLOW_LIVE_STORAGE_KEY,
        true,
      ),
    ).toBe(true);

    expect(() =>
      writeStoredBoolean(
        {
          setItem: () => {
            throw new Error("blocked");
          },
        },
        OPTIONS_FLOW_LIVE_STORAGE_KEY,
        false,
      ),
    ).not.toThrow();

    const setItem = vi.fn();
    writeStoredBoolean({ setItem }, UNUSUAL_ORDER_FLOW_LIVE_STORAGE_KEY, false);
    expect(setItem).toHaveBeenCalledWith(
      UNUSUAL_ORDER_FLOW_LIVE_STORAGE_KEY,
      "false",
    );
  });

  it("computes DTE from calendar dates without timezone or DST drift", () => {
    expect(calendarDayDifference("2026-08-12", "2026-08-12")).toBe(0);
    expect(calendarDayDifference("2026-08-13", "2026-08-12")).toBe(1);
    expect(calendarDayDifference("2026-03-09", "2026-03-08")).toBe(1);
    expect(calendarDayDifference("2026-11-02", "2026-11-01")).toBe(1);
    expect(calendarDayDifference("2028-03-01", "2028-02-28")).toBe(2);
  });

  it.each([
    ["2026-02-30", "2026-02-28"],
    ["2026-08-12T13:00:00Z", "2026-08-12"],
    ["", "2026-08-12"],
    [null, "2026-08-12"],
  ])("returns null for invalid calendar dates", (later, earlier) => {
    expect(calendarDayDifference(later, earlier)).toBeNull();
  });

  it("sorts computed DTE rather than absolute expiration dates", () => {
    const twoDte = calendarDayDifference("2026-08-14", "2026-08-12");
    const threeDte = calendarDayDifference("2026-08-13", "2026-08-10");

    expect(compareFlowDte(twoDte, threeDte, "asc")).toBeLessThan(0);
    expect(compareFlowDte(twoDte, threeDte, "desc")).toBeGreaterThan(0);
    expect(compareFlowDte(null, threeDte, "asc")).toBeGreaterThan(0);
    expect(compareFlowDte(null, threeDte, "desc")).toBeGreaterThan(0);
  });

  it("wires persisted live state and the initial unusual-flow filters", () => {
    const optionsPage = readFileSync(
      "src/routes/options-flow/+page.svelte",
      "utf8",
    );
    const unusualPage = readFileSync(
      "src/routes/unusual-order-flow/+page.svelte",
      "utf8",
    );
    const unusualLoad = readFileSync(
      "src/routes/unusual-order-flow/+page.server.ts",
      "utf8",
    );

    for (const page of [optionsPage, unusualPage]) {
      expect(page).toContain("livePreferenceLoaded");
      expect(page).toContain("readStoredBoolean(");
      expect(page).toContain("writeStoredBoolean(");
      expect(page).toContain("normalizeFlowRules(");
    }
    expect(unusualLoad).toContain('url.searchParams.get("query")');
    expect(unusualLoad).toContain('params.set("rules", JSON.stringify(rules))');
  });

  it("renders invalid DTE values as an em dash", () => {
    const table = readFileSync(
      "src/lib/components/Table/OptionsFlowTable.svelte",
      "utf8",
    );
    expect(table).toContain(
      'typeof value === "number" && Number.isFinite(value)',
    );
    expect(table).toContain("{formatDte(item?.dte)}");
    expect(
      table.match(/compareFlowDte\(a\.dte, b\.dte, sortOrder\)/g),
    ).toHaveLength(2);
  });
});
