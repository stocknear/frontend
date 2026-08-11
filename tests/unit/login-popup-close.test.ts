import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("../../src/lib/components/LoginPopup.svelte", import.meta.url),
  "utf8",
);

describe("LoginPopup close control", () => {
  it("uses a native, labelled 48px close target with visible theme and focus states", () => {
    const closeButton = source.match(
      /<button[\s\S]*?on:click=\{closeModal\}[\s\S]*?aria-label=\{common_close\(\)\}[\s\S]*?<\/button>/,
    )?.[0];

    expect(closeButton).toBeDefined();
    expect(closeButton).toContain('type="button"');
    expect(closeButton).toMatch(/\bh-12\b/);
    expect(closeButton).toMatch(/\bw-12\b/);
    expect(closeButton).toContain("bg-surface-page/90");
    expect(closeButton).toContain("dark:hover:bg-zinc-800");
    expect(closeButton).toContain("focus-visible:ring-2");
    expect(closeButton).toContain('aria-hidden="true"');
    expect(source).toContain("common_close,");
  });

  it("preserves dismissal semantics by only clearing the existing modal toggle", () => {
    expect(source).toContain("bind:this={loginToggle}");
    expect(source).toMatch(
      /const closeModal = \(\) => \{\s*if \(loginToggle\) loginToggle\.checked = false;\s*\};/,
    );
    expect(source.match(/id="userLogin"/g)).toHaveLength(1);
    expect(source).toContain('id="userLoginDialog"');
  });
});
