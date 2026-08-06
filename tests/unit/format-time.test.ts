import { describe, expect, it } from "vitest";
import { formatTime } from "$lib/utils";

/**
 * formatTime() moved from hand-rolled string concatenation to Intl.DateTimeFormat so
 * every locale gets its own clock convention instead of hardcoded English AM/PM.
 *
 * The trap: Intl.DateTimeFormat.format() raises `RangeError: Invalid time value` on an
 * Invalid Date, whereas the old concat quietly produced "12:NaN AM". A throw inside a
 * Svelte template blanks the component, so malformed API data went from a cosmetic
 * glitch to a broken page. These cases are what that regression needed and did not have.
 */
describe("formatTime", () => {
  it("formats a normal time without throwing", () => {
    // Locale is `en` under test, so this is the 12-hour form.
    expect(formatTime("14:30:00")).toBe("02:30 PM");
    expect(formatTime("09:05:00")).toBe("09:05 AM");
  });

  it("accepts a time with no seconds component", () => {
    expect(formatTime("14:30")).toBe("02:30 PM");
  });

  it("survives malformed input instead of throwing", () => {
    for (const bad of ["--:--", "invalid", "", ":", "aa:bb:cc"]) {
      expect(() => formatTime(bad)).not.toThrow();
      expect(typeof formatTime(bad)).toBe("string");
    }
  });

  it("survives non-string input, which is what most call sites actually pass", () => {
    // 11 of 12 call sites in the app pass `item?.time` with no `?? ""` fallback, so
    // undefined/null reach this function routinely (a row missing its time field) —
    // not just malformed strings. `.split` on a non-string throws TypeError before the
    // NaN guard above ever runs; this is the gap that guard alone did not close.
    for (const bad of [undefined, null] as unknown[]) {
      expect(() => formatTime(bad)).not.toThrow();
      expect(typeof formatTime(bad)).toBe("string");
    }
  });

  it("is midnight-safe", () => {
    expect(() => formatTime("00:00:00")).not.toThrow();
    expect(formatTime("00:00:00")).toBe("12:00 AM");
  });
});
