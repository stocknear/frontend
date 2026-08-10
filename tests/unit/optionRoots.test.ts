import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { WEEKLY_ROOT_UNDERLYING, resolveContractPath } from "$lib/utils";

/**
 * Index options can trade under more than one OCC root. SPX third-Friday contracts are
 * AM-settled under root `SPX` and live in `json/all-options-contracts/^SPX/^SPX…json`;
 * every weekly and daily expiration — all 0DTE — is PM-settled under root `SPXW` and
 * lives in its own caret-free `SPXW/SPXW…json`.
 *
 * Getting the folder or the caret wrong does not throw. It reads a file that is not
 * there, the API returns an empty history, and the chart renders blank. That is exactly
 * how every index row in the options flow came to show `open_interest: 0` unnoticed —
 * the lookup was hitting `SPX/SPX…` while the files were in `^SPX/^SPX…`.
 *
 * `root` here is the contract's OWN root, which is what the flow feed puts in `ticker`
 * (verified against live data: `ticker: "SPXW"`, `option_symbol: "SPXW260810P07765000"`).
 */
describe("option root path resolution", () => {
  it("keeps a weekly root in its own caret-free folder, priced off its index", () => {
    expect(resolveContractPath("SPXW", "SPXW260810P07765000", true)).toEqual({
      folder: "SPXW",
      contract: "SPXW260810P07765000",
      quoteTicker: "^SPX",
    });
    expect(resolveContractPath("NDXP", "NDXP260821C20000000", true).quoteTicker).toBe("^NDX");
    expect(resolveContractPath("RUTW", "RUTW260821C03000000", true).quoteTicker).toBe("^RUT");
  });

  it("carets an index root in both the folder and the filename", () => {
    expect(resolveContractPath("SPX", "SPX261218P07200000", true)).toEqual({
      folder: "^SPX",
      contract: "^SPX261218P07200000",
      quoteTicker: "^SPX",
    });
  });

  it("leaves stocks and ETFs completely alone", () => {
    expect(resolveContractPath("AAPL", "AAPL260821C00200000", false)).toEqual({
      folder: "AAPL",
      contract: "AAPL260821C00200000",
      quoteTicker: "AAPL",
    });
    expect(resolveContractPath("SPY", "SPY260810C00600000", false).folder).toBe("SPY");
  });

  it("is idempotent on an already-caretted root", () => {
    expect(resolveContractPath("^SPX", "^SPX261218P07200000", true)).toEqual({
      folder: "^SPX",
      contract: "^SPX261218P07200000",
      quoteTicker: "^SPX",
    });
  });

  it("passes empty input straight through instead of inventing a caret", () => {
    expect(resolveContractPath("", "", true)).toEqual({
      folder: "",
      contract: "",
      quoteTicker: "",
    });
    expect(resolveContractPath("SPXW", "", true).contract).toBe("");
  });
});

/**
 * The same map exists in backend/app/utils/option_roots.py. Nothing but this test stops
 * the two from drifting, and a root added on one side only reproduces precisely the
 * silent breakage the map was introduced to fix.
 */
describe("weekly root map parity with the backend", () => {
  it("matches backend/app/utils/option_roots.py", () => {
    const source = readFileSync(
      path.resolve(
        process.cwd(),
        "../backend/app/utils/option_roots.py",
      ),
      "utf8",
    );

    const block = source.match(/WEEKLY_ROOTS\s*=\s*\{([^}]*)\}/);
    expect(block, "WEEKLY_ROOTS not found in option_roots.py").toBeTruthy();

    // "^SPX": ("SPXW",)  ->  SPXW: "^SPX"
    const fromPython: Record<string, string> = {};
    for (const [, underlying, roots] of block![1].matchAll(
      /"([^"]+)"\s*:\s*\(([^)]*)\)/g,
    )) {
      for (const [, root] of roots.matchAll(/"([^"]+)"/g)) {
        fromPython[root] = underlying;
      }
    }

    expect(Object.keys(fromPython).length).toBeGreaterThan(0);
    expect(fromPython).toEqual(WEEKLY_ROOT_UNDERLYING);
  });
});
