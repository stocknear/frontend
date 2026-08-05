#!/usr/bin/env node
/**
 * SSR/hydration divergence ratchet.
 *
 * Every route in this app is server-rendered, so any value that differs between the
 * server pass and the hydration pass produces wrong HTML, a visible flash, or — when the
 * difference is structural — a DOM rebuild that orphans anything bound in `onMount`.
 * That is what once left the chat editor dead on /de/chat.
 *
 * This mirrors `scripts/color-audit.mjs`: every count may fall, never rise. Lower a number
 * in `scripts/hydration-baseline.json` after a migration lands, with `--write` doing it
 * for you.
 *
 * dateRoundTrip's baseline of 2 is intentional: checkMarketHourSSR/checkPreMarketHourSSR in
 * src/lib/utils.ts use the idiom correctly (they read wall-clock fields with local accessors,
 * never .getTime()) and are called only from +layout.server.ts, so they cannot diverge.
 * Everything else must stay at zero.
 *
 * Only *render scope* is counted — top-level statements and `$:` blocks, i.e. code that
 * actually runs during SSR. Bodies of functions, arrow functions and lifecycle callbacks
 * are stripped first, because the same call inside `onMount` is perfectly safe and
 * counting it would bury the real hits (`browser` alone has 100+ safe occurrences).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = path.join(root, "src");
const baselinePath = path.join(root, "scripts/hydration-baseline.json");
const write = process.argv?.includes("--write");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Generated i18n shards mirror source and would double every count.
      if (entry.name === "generated" || entry.name === "paraglide") continue;
      out.push(...walk(full));
    } else if (/\.(svelte|ts|js)$/.test(entry.name)) {
      // .ts/.js too: the worst instance of the round-trip bug lived in src/lib/utils.ts,
      // not in a component.
      out.push(full);
    }
  }
  return out;
}

/** Instance `<script>` body, excluding `<script context="module">`. */
function instanceScript(source) {
  const match = /<script(?![^>]*context=["']module["'])[^>]*>([\s\S]*?)<\/script>/.exec(source);
  return match ? match[1] : "";
}

/** Everything outside any `<script>`/`<style>` — i.e. the markup. */
function markup(source) {
  return source
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "");
}

/**
 * Remove the body of anything that only runs when called. What remains is the code that
 * executes on both the server pass and the hydration pass.
 */
function stripCallableBodies(code) {
  const opener = /\bfunction\b[^{;]*\{|=>\s*\{|\b(?:onMount|onDestroy|afterUpdate|beforeUpdate|setTimeout|setInterval|addEventListener)\s*\(\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)?\s*(?:=>)?\s*\{/g;
  let out = code;
  for (let guard = 0; guard < 500; guard += 1) {
    opener.lastIndex = 0;
    const hit = opener.exec(out);
    if (!hit) break;
    const braceStart = out.indexOf("{", hit.index + hit[0].length - 1);
    if (braceStart === -1) break;
    let depth = 0;
    let end = -1;
    for (let i = braceStart; i < out.length; i += 1) {
      const ch = out[i];
      if (ch === "{") depth += 1;
      else if (ch === "}") {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) break;
    out = out.slice(0, hit.index) + " ".repeat(end - hit.index + 1) + out.slice(end + 1);
  }
  return out;
}

function countMatches(text, pattern) {
  return (text.match(pattern) ?? []).length;
}

/**
 * `new Date(<something>.toLocaleString(...))` — formatting an instant to a zone-less string
 * and re-parsing it, which shifts it by the host's own offset.
 *
 * This has to paren-match rather than pattern-match: the wanted call is *inside* the
 * `new Date(...)` argument list, whereas the ordinary and perfectly correct
 * `new Date(x).toLocaleString(...)` merely follows it. A regex confuses the two.
 */
function countDateRoundTrip(text) {
  let found = 0;
  let from = 0;
  for (;;) {
    const start = text.indexOf("new Date(", from);
    if (start === -1) break;
    const open = start + "new Date(".length - 1;
    let depth = 0;
    let end = -1;
    for (let i = open; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === "(") depth += 1;
      else if (ch === ")") {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) break;
    if (text.slice(open + 1, end).includes(".toLocaleString(")) found += 1;
    from = open + 1;
  }
  return found;
}

/** `toLocale*` / `Intl.DateTimeFormat` calls whose argument list never mentions timeZone. */
function countMissingTimeZone(text) {
  const calls =
    text.match(/(?:toLocaleDateString|toLocaleTimeString|toLocaleString|DateTimeFormat)\s*\(/g) ?? [];
  let missing = 0;
  let cursor = 0;
  for (const call of calls) {
    const start = text.indexOf(call, cursor);
    cursor = start + call.length;
    let depth = 0;
    let end = start + call.length - 1;
    for (let i = end; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === "(") depth += 1;
      else if (ch === ")") {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    const args = text.slice(start, end + 1);
    if (/timeZone/.test(args)) continue;

    // toLocaleDateString / toLocaleTimeString / DateTimeFormat are always date-or-time
    // formatting, so a missing timeZone always drifts.
    if (/DateTimeFormat|toLocaleDateString|toLocaleTimeString/.test(call)) {
      missing += 1;
      continue;
    }

    // toLocaleString is ambiguous: on a Number it is timezone-independent, on a Date it
    // drifts. The distinguishing token is the RECEIVER, which sits before the call — an
    // earlier version tested the argument list instead and therefore never counted a
    // single date toLocaleString, i.e. the most common form of this bug in this codebase.
    // Cut the lookback at the nearest statement/line boundary, or a neighbouring line that
    // happens to mention a date would make every numeric toLocaleString a false positive.
    const lookback = text.slice(Math.max(0, start - 160), start);
    const boundary = Math.max(
      lookback.lastIndexOf(";"),
      lookback.lastIndexOf("\n"),
      lookback.lastIndexOf("{"),
    );
    const receiver = lookback.slice(boundary + 1);
    if (/new Date\s*\(|[Dd]ate\b|expiry/.test(receiver)) {
      missing += 1;
    }
  }
  return missing;
}

const files = walk(srcRoot);
const counts = {
  dateRoundTrip: 0,
  missingTimeZone: 0,
  browserInMarkup: 0,
  nowInRender: 0,
};
const offenders = { dateRoundTrip: [], missingTimeZone: [], browserInMarkup: [], nowInRender: [] };

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const isComponent = file.endsWith(".svelte");
  // Plain modules have no markup/script split, and no render scope of their own - their
  // exports run wherever they are called - so only the always-wrong patterns are counted.
  const rendered = isComponent
    ? stripCallableBodies(instanceScript(source)) + "\n" + markup(source)
    : "";
  const flat = source.replace(/\s+/g, " ");
  const rel = path.relative(root, file);

  // Formatting a Date to a zone-less string and re-parsing it yields an instant shifted by
  // the host's own offset. There is no correct use of this anywhere.
  const roundTrip = countDateRoundTrip(flat);
  // Components: only render scope can diverge. Plain modules have no render scope of their
  // own, but their exported formatters are called from components, so audit the whole file —
  // the worst instance of this bug lived in src/lib/utils.ts, not in a component.
  const missingTz = countMissingTimeZone(isComponent ? rendered : source);
  // Only markup: `$: if (browser) { ... }` in the script is the correct idiom for
  // client-only side effects and changes nothing that is rendered. Counting those would
  // bury the real hits — `browser` reaching an attribute or a text expression.
  const browserish = isComponent
    ? countMatches(markup(source), /\bbrowser\b|typeof window|typeof document/g)
    : 0;
  const nowish = countMatches(rendered, /new Date\(\s*\)|Date\.now\s*\(|Math\.random\s*\(/g);

  counts.dateRoundTrip += roundTrip;
  counts.missingTimeZone += missingTz;
  counts.browserInMarkup += browserish;
  counts.nowInRender += nowish;
  if (roundTrip) offenders.dateRoundTrip.push(`${rel} (${roundTrip})`);
  if (missingTz) offenders.missingTimeZone.push(`${rel} (${missingTz})`);
  if (browserish) offenders.browserInMarkup.push(`${rel} (${browserish})`);
  if (nowish) offenders.nowInRender.push(`${rel} (${nowish})`);
}

if (write) {
  fs.writeFileSync(baselinePath, `${JSON.stringify(counts, null, 2)}\n`);
  console.log(`Hydration baseline written to ${path.relative(root, baselinePath)}:`);
  for (const [name, count] of Object.entries(counts)) console.log(`- ${name}: ${count}`);
  process.exit(0);
}

if (!fs.existsSync(baselinePath)) {
  console.error(`Missing ${path.relative(root, baselinePath)}. Run with --write to create it.`);
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const failures = [];
for (const [name, count] of Object.entries(counts)) {
  if (count > (baseline[name] ?? 0)) {
    failures.push(`hydration baseline ${name} increased from ${baseline[name] ?? 0} to ${count}`);
    for (const offender of offenders[name].slice(0, 5)) failures.push(`    ${offender}`);
  }
}

if (failures?.length) {
  console.error("Hydration audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(
    "\nSSR and hydration must render the same HTML.\n" +
      "- never re-parse a formatted date: use Date.now() / getTime(), or getMarketToday() from $lib/utils\n" +
      "- pass timeZone (usually \"UTC\") when formatting a backend date\n" +
      "- read browser/localStorage/window in onMount, not at render scope\n" +
      "- take 'today' from getMarketToday(), not new Date()",
  );
  process.exit(1);
}

console.log("Hydration audit passed.");
for (const [name, count] of Object.entries(counts)) {
  const delta = (baseline[name] ?? 0) - count;
  console.log(`- ${name}: ${count}${delta > 0 ? ` (${delta} below baseline)` : ""}`);
}
