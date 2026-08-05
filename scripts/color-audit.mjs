#!/usr/bin/env node
/**
 * Colour-sprawl ratchet.
 *
 * The colour system lives in `src/app.css` as semantic tokens. Nothing enforces
 * that components use it, so without a budget the raw hexes and hand-paired
 * `dark:` variants grow back. This mirrors the hardcoded-UI baselines in
 * `scripts/i18n-audit.mjs`: every count may fall, never rise.
 *
 * Lower a number in `scripts/color-baseline.json` after a migration lands, with
 * `--write` doing it for you.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = path.join(root, "src");
const baselinePath = path.join(root, "scripts/color-baseline.json");
const write = process.argv?.includes("--write");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Generated i18n shards mirror source and would double every count.
      if (entry.name === "generated" || entry.name === "paraglide") continue;
      out.push(...walk(full));
    } else if (/\.(svelte|ts|js|css)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(srcRoot);
const read = new Map(files?.map((file) => [file, fs.readFileSync(file, "utf8")]));
const svelte = files?.filter((file) => file.endsWith(".svelte")) ?? [];
const all = [...read.values()].join("\n");

const distinct = (text, re) =>
  new Set((text?.match(re) ?? [])?.map((value) => value?.toLowerCase())).size;

// A file that paints colour but never mentions `dark:` is a guaranteed
// broken-in-one-theme component.
const colourNoDark = svelte?.filter((file) => {
  const text = read.get(file) ?? "";
  return (
    /\b(bg|text|border)-(\[#|gray-|zinc-|slate-|neutral-|white\b|black\b)/.test(text) &&
    !text.includes("dark:")
  );
});

const counts = {
  distinctHexLiterals: distinct(all, /#[0-9a-fA-F]{6}\b/g),
  arbitraryColorClasses: distinct(
    all,
    /\b(?:bg|text|border|from|via|to|fill|stroke|ring|divide|outline|shadow)(?:-[a-z]+)?-\[#[0-9a-fA-F]{3,8}\]/g,
  ),
  darkVariants: (all?.match(/dark:/g) ?? []).length,
  filesWithColorAndNoDark: colourNoDark?.length ?? 0,
};

if (write) {
  fs.writeFileSync(baselinePath, JSON.stringify(counts, null, 2) + "\n");
  console.log("Colour baseline written:");
  for (const [name, count] of Object.entries(counts)) console.log(`- ${name}: ${count}`);
  process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const failures = [];
for (const [name, count] of Object.entries(counts)) {
  if (count > baseline[name]) {
    failures.push(`colour baseline ${name} increased from ${baseline[name]} to ${count}`);
  }
}

if (failures?.length) {
  console.error("Colour audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(
    "\nUse a token from src/app.css (bg-surface-card, text-fg-muted, border-line, text-up/text-down)\n" +
      "instead of a raw hex or a hand-paired dark: variant.",
  );
  process.exit(1);
}

console.log("Colour audit passed.");
for (const [name, count] of Object.entries(counts)) {
  const delta = baseline[name] - count;
  console.log(`- ${name}: ${count}${delta > 0 ? ` (${delta} below baseline)` : ""}`);
}
if (colourNoDark?.length) {
  console.log(
    `\n${colourNoDark.length} components paint colour with no dark: styling, e.g.\n` +
      colourNoDark
        ?.slice(0, 5)
        ?.map((file) => `  ${path.relative(root, file)}`)
        ?.join("\n"),
  );
}
