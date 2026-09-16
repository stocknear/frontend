import { describe, expect, it } from "vitest";
import { applyOrder, moveByKey } from "../../src/lib/reorder";

const keyOf = (item: { id: string }) => item.id;
const rows = (...ids: string[]) => ids.map((id) => ({ id }));
const ids = (items: { id: string }[]) => items.map((item) => item.id);

describe("moveByKey", () => {
  const list = rows("a", "b", "c", "d", "e");

  it("drops a row below the target when dragging down", () => {
    // The regression: the row used to land one position off the preview.
    expect(ids(moveByKey(list, "a", "c", keyOf))).toEqual([
      "b",
      "c",
      "a",
      "d",
      "e",
    ]);
  });

  it("drops a row above the target when dragging up", () => {
    expect(ids(moveByKey(list, "e", "b", keyOf))).toEqual([
      "a",
      "e",
      "b",
      "c",
      "d",
    ]);
  });

  it("swaps neighbours in both directions", () => {
    expect(ids(moveByKey(list, "a", "b", keyOf))).toEqual([
      "b",
      "a",
      "c",
      "d",
      "e",
    ]);
    expect(ids(moveByKey(list, "b", "a", keyOf))).toEqual([
      "b",
      "a",
      "c",
      "d",
      "e",
    ]);
  });

  it("returns the original array for a no-op or unknown key", () => {
    expect(moveByKey(list, "a", "a", keyOf)).toBe(list);
    expect(moveByKey(list, "zz", "b", keyOf)).toBe(list);
    expect(moveByKey(list, "a", "zz", keyOf)).toBe(list);
    expect(moveByKey(undefined, "a", "b", keyOf)).toEqual([]);
  });

  it("does not mutate the input", () => {
    const original = [...list];
    moveByKey(list, "a", "d", keyOf);
    expect(list).toEqual(original);
  });
});

describe("applyOrder", () => {
  const stored = [
    { id: "a", note: "keep me", shares: 3 },
    { id: "b", note: "", shares: 1 },
    { id: "c", note: "and me", shares: 7 },
  ];

  it("permutes stored rows and preserves their metadata", () => {
    const next = applyOrder(stored, ["c", "a", "b"], keyOf);
    expect(next).toEqual([
      { id: "c", note: "and me", shares: 7 },
      { id: "a", note: "keep me", shares: 3 },
      { id: "b", note: "", shares: 1 },
    ]);
  });

  it("keeps ids the payload did not mention, in stored order, at the end", () => {
    expect(ids(applyOrder(stored, ["c"], keyOf))).toEqual(["c", "a", "b"]);
    expect(ids(applyOrder(stored, [], keyOf))).toEqual(["a", "b", "c"]);
  });

  it("ignores ids that are not stored", () => {
    expect(ids(applyOrder(stored, ["zz", "b", "a", "c"], keyOf))).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("does not mutate the stored array", () => {
    const original = [...stored];
    applyOrder(stored, ["c", "b", "a"], keyOf);
    expect(stored).toEqual(original);
    expect(applyOrder(undefined, ["a"], keyOf)).toEqual([]);
  });
});
