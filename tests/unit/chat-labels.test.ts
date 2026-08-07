import { describe, expect, it } from "vitest";
import { agentCategoryLabel, dateGroupLabel } from "../../src/lib/chat/labels";
import { agentCategory } from "../../src/lib/utils";

// Both helpers are static switches with a default: arm, so a value added to the data side
// without a matching message key would silently render as "Others" / "Older". These are the
// assertions that catch that.

const DATE_GROUPS = [
  "Today",
  "Yesterday",
  "Previous 7 Days",
  "Previous 30 Days",
  "Older",
];

describe("agentCategoryLabel", () => {
  it("gives every agentCategory value its own label", () => {
    const labels = agentCategory.map((c) => agentCategoryLabel(c));
    expect(new Set(labels).size).toBe(agentCategory.length);
    for (const label of labels) expect(label.trim()).not.toBe("");
  });

  it("does not silently fall back for any known category", () => {
    const fallback = agentCategoryLabel("__not_a_category__");
    for (const category of agentCategory.filter((c) => c !== "Others")) {
      expect(agentCategoryLabel(category)).not.toBe(fallback);
    }
  });

  it("falls back for an unknown group rather than throwing", () => {
    expect(agentCategoryLabel("")).toBe(agentCategoryLabel("nope"));
  });
});

describe("dateGroupLabel", () => {
  // Mirrors getDateGroup()/groupOrder in src/routes/chat/+layout.svelte.
  it("gives every date group its own label", () => {
    const labels = DATE_GROUPS.map((g) => dateGroupLabel(g));
    expect(new Set(labels).size).toBe(DATE_GROUPS.length);
    for (const label of labels) expect(label.trim()).not.toBe("");
  });

  it("does not silently fall back for any known group", () => {
    const fallback = dateGroupLabel("__not_a_group__");
    for (const group of DATE_GROUPS.filter((g) => g !== "Older")) {
      expect(dateGroupLabel(group)).not.toBe(fallback);
    }
  });
});
