import { describe, expect, it } from "vitest";
import { formatDate, formatInteger, formatMarketTime, formatPercent, formatUsd } from "$lib/i18n/format";

describe("localized finance formatting", () => {
  it("uses locale-specific grouping", () => {
    expect(formatInteger(1234567, "en")).toBe("1,234,567");
    expect(formatInteger(1234567, "de")).toBe("1.234.567");
    expect(formatInteger(1234567, "fr")).toContain("1 234 567");
  });

  it("keeps USD while localizing its presentation", () => {
    expect(formatUsd(1234.5, {}, "en")).toContain("$1,234.50");
    expect(formatUsd(1234.5, {}, "de")).toContain("1.234,50");
    expect(formatUsd(1234.5, {}, "zh-TW")).toContain("1,234.50");
  });

  it("formats percentages and dates with the requested locale", () => {
    expect(formatPercent(0.125, {}, "es")).toBe("12,5 %");
    expect(formatDate(new Date("2026-08-02T12:00:00Z"), { timeZone: "UTC", dateStyle: "medium" }, "fr"))
      .toContain("2 août 2026");
  });

  it("formats market timestamps in New York across DST", () => {
    expect(formatMarketTime(new Date("2026-08-02T14:30:00Z"), "HH:mm", "en")).toBe("10:30");
    expect(formatMarketTime(new Date("2026-01-02T14:30:00Z"), "HH:mm", "en")).toBe("09:30");
  });
});
