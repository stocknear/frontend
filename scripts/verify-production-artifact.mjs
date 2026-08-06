import { brotliCompressSync, constants as zlibConstants } from "node:zlib";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const artifactDirectory = path.resolve(process.argv[2] ?? "build");
const MAX_I18N_SHARD_BROTLI_BYTES = Number(
  process.env.MAX_I18N_SHARD_BROTLI_BYTES ?? 32 * 1024,
);
const MAX_I18N_ROUTE_BROTLI_BYTES = Number(
  process.env.MAX_I18N_ROUTE_BROTLI_BYTES ?? 32 * 1024,
);
const MAX_I18N_ROUTE_ASSETS = Number(process.env.MAX_I18N_ROUTE_ASSETS ?? 2);
const BROTLI_QUALITY = Number(process.env.PRODUCTION_VERIFY_BROTLI_QUALITY ?? 6);
const MAX_CLIENT_JAVASCRIPT_BROTLI_BYTES = Number(
  process.env.MAX_CLIENT_JAVASCRIPT_BROTLI_BYTES ?? 500 * 1024,
);
const forbiddenDirectories = new Set([
  "test",
  "tests",
  "__tests__",
  "test-results",
  "playwright-report",
  "blob-report",
  "coverage",
]);
const forbiddenFilePatterns = [
  /\.(?:test|spec)\.[^.]+$/i,
  /\.map$/i,
  /(?:claude|codex)/i,
  /^agents\.md$/i,
  /todo/i,
];

// Read the locale set rather than hardcoding it. A hardcoded alternation silently stops
// matching a newly added locale's shards, so the multi-locale guard and the shard budget
// below just skip it — passing green while the new locale is unverified.
// Resolved relative to this script's own location, not process.cwd(): this file is only
// ever invoked correctly today because deploy.sh runs it via `npm run` from the package
// root, and a cwd-relative resolve() breaks silently the moment that stops being true.
const settingsPath = fileURLToPath(
  new URL("../project.inlang/settings.json", import.meta.url),
);
const settings = JSON.parse(await readFile(settingsPath, "utf8"));
const i18nMarkerPattern = new RegExp(
  `stocknear-i18n:([a-z0-9_-]+):(${settings.locales
    // Longest first: regex alternation takes the first branch that matches, so with
    // "pt" listed before "pt-BR" a pt-BR marker reads back as "pt" and the
    // one-locale-per-shard guard below compares the wrong values.
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((locale) => locale.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})`,
  "g",
);

if (!(await existsAsDirectory(artifactDirectory))) {
  fail(`Production artifact does not exist: ${artifactDirectory}`);
}

const files = await walk(artifactDirectory);
const violations = [];
const i18nShards = [];
const brotliBytesByFile = new Map();

for (const filename of files) {
  const relativeFilename = path.relative(artifactDirectory, filename);
  const pathSegments = relativeFilename.split(path.sep);
  if (pathSegments.some((segment) => forbiddenDirectories.has(segment.toLowerCase()))) {
    violations.push(`${relativeFilename}: forbidden test/report directory`);
  }
  if (
    pathSegments.some((segment) =>
      forbiddenFilePatterns.some((pattern) => pattern.test(segment)),
    )
  ) {
    violations.push(`${relativeFilename}: forbidden production path`);
  }
  if (!filename.endsWith(".js")) continue;

  const source = await readFile(filename);
  const brotliBytes = brotliCompressSync(source, {
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY,
    },
  }).byteLength;
  brotliBytesByFile.set(relativeFilename, brotliBytes);

  const isClientJavaScript = pathSegments[0] === "client";
  if (isClientJavaScript && brotliBytes > MAX_CLIENT_JAVASCRIPT_BROTLI_BYTES) {
    violations.push(
      `${relativeFilename}: ${formatBytes(brotliBytes)} Brotli exceeds the ${formatBytes(MAX_CLIENT_JAVASCRIPT_BROTLI_BYTES)} client JavaScript budget`,
    );
  }

  const sourceText = source.toString("utf8");
  const markers = [
    ...new Set(
      [...sourceText.matchAll(i18nMarkerPattern)].map((match) => match[0]),
    ),
  ];
  if (markers.length === 0) continue;

  const markerLocales = new Set(markers.map((marker) => marker.split(":").at(-1)));
  if (markerLocales.size !== 1) {
    violations.push(
      `${relativeFilename}: contains translation data for multiple locales (${[...markerLocales].join(", ")})`,
    );
  }
  if (brotliBytes > MAX_I18N_SHARD_BROTLI_BYTES) {
    violations.push(
      `${relativeFilename}: ${formatBytes(brotliBytes)} Brotli exceeds the ${formatBytes(MAX_I18N_SHARD_BROTLI_BYTES)} translation-shard budget`,
    );
  }
  i18nShards.push({ relativeFilename, markers, brotliBytes });
}

if (i18nShards.length === 0) {
  violations.push("No generated locale shards were found in the production artifact.");
}

await verifyI18nInventory();

if (violations.length > 0) {
  console.error("Production artifact verification failed:\n");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

const totalShardBytes = i18nShards.reduce((total, shard) => total + shard.brotliBytes, 0);
console.log(
  `Verified ${files.length} production files. Found ${i18nShards.length} budgeted single-locale translation shards (${formatBytes(totalShardBytes)} Brotli total).`,
);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(filename)));
    else if (entry.isFile()) files.push(filename);
  }
  return files;
}

async function existsAsDirectory(filename) {
  try {
    return (await stat(filename)).isDirectory();
  } catch {
    return false;
  }
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function verifyI18nInventory() {
  const inventoryFilename = path.join(artifactDirectory, "client", "i18n", "inventory.json");
  let inventory;
  try {
    inventory = JSON.parse(await readFile(inventoryFilename, "utf8"));
  } catch (error) {
    violations.push(`client/i18n/inventory.json: missing or invalid translation inventory (${error.message})`);
    return;
  }
  if (inventory.version !== 1 || !Array.isArray(inventory.files) || !inventory.routeAssetKeys || !inventory.assetUrls) {
    violations.push("client/i18n/inventory.json: unsupported or incomplete translation inventory");
    return;
  }

  const expectedFiles = new Set(
    inventory.files.map((url) => path.posix.join("client", String(url).replace(/^\//, ""))),
  );
  const actualFiles = new Set(
    i18nShards.map(({ relativeFilename }) => relativeFilename.split(path.sep).join(path.posix.sep)),
  );
  for (const filename of expectedFiles) {
    if (!actualFiles.has(filename)) violations.push(`${filename}: manifest-referenced translation payload is missing`);
  }
  for (const filename of actualFiles) {
    if (!expectedFiles.has(filename)) violations.push(`${filename}: stale translation payload is not in the active inventory`);
  }

  for (const [routeId, assetKeys] of Object.entries(inventory.routeAssetKeys)) {
    if (!Array.isArray(assetKeys)) {
      violations.push(`${routeId}: translation inventory route entry is not an array`);
      continue;
    }
    if (assetKeys.length > MAX_I18N_ROUTE_ASSETS) {
      violations.push(`${routeId}: ${assetKeys.length} translation requests exceeds the ${MAX_I18N_ROUTE_ASSETS}-asset route budget`);
    }
    for (const [locale, urls] of Object.entries(inventory.assetUrls)) {
      let routeBytes = 0;
      for (const assetKey of assetKeys) {
        const url = urls?.[assetKey];
        if (!url) {
          violations.push(`${routeId} (${locale}): missing URL for translation asset ${assetKey}`);
          continue;
        }
        const relativeFilename = path.posix.join("client", url.replace(/^\//, ""));
        routeBytes += brotliBytesByFile.get(relativeFilename.split(path.posix.sep).join(path.sep)) ?? 0;
      }
      if (routeBytes > MAX_I18N_ROUTE_BROTLI_BYTES) {
        violations.push(
          `${routeId} (${locale}): ${formatBytes(routeBytes)} Brotli exceeds the ${formatBytes(MAX_I18N_ROUTE_BROTLI_BYTES)} aggregate route translation budget`,
        );
      }
    }
  }
}
