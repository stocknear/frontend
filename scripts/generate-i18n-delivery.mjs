import { createHash } from "node:crypto";
import { cp, mkdtemp, mkdir, readFile, readdir, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const messagesDirectory = path.join(root, "messages");
const routesDirectory = path.join(root, "src", "routes");
const generatedSource = path.join(root, "src", "lib", "i18n", "delivery", "generated");
const generatedStatic = path.join(root, "static", "i18n");
const settings = JSON.parse(await readFile(path.join(root, "project.inlang", "settings.json"), "utf8"));
const locales = settings.locales;
const baseLocale = settings.baseLocale;
const sourceAnalysisCache = new Map();
await validateTrackedRuntime();
const inputHash = await createInputHash();

if (await generatedOutputIsCurrent(inputHash)) {
  console.log("Translation delivery output is current.");
  process.exit(0);
}

await mkdir(path.join(root, ".svelte-kit"), { recursive: true });
const lockPath = path.join(root, ".svelte-kit", "i18n-delivery.lock");
const lock = await acquireLock(lockPath, inputHash);
if (!lock) process.exit(0);
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "stocknear-i18n-"));
const generatedSourceParent = path.dirname(generatedSource);
await mkdir(generatedSourceParent, { recursive: true });
const stagedSource = await mkdtemp(path.join(generatedSourceParent, ".generated-next-"));
const stagedStatic = path.join(temporaryDirectory, "static-i18n");

try {
  const namespaceMessages = await readNamespaceMessages();
  const namespaceForMessage = new Map();
  for (const [namespace, names] of namespaceMessages) {
    for (const name of names) {
      if (namespaceForMessage.has(name)) throw new Error(`Duplicate message id: ${name}`);
      namespaceForMessage.set(name, namespace);
    }
  }

  const localeBlocks = new Map();
  const localeMessages = new Map();
  for (const locale of locales) {
    const messages = await readLocaleMessages(locale, namespaceMessages);
    localeMessages.set(locale, messages);
    localeBlocks.set(
      locale,
      new Map([...messages].map(([name, value]) => [name, compileSimpleMessage(name, value, locale)])),
    );
  }
  for (const name of namespaceForMessage.keys()) {
    if (!localeBlocks.get(baseLocale).has(name)) throw new Error(`Paraglide did not compile ${name}`);
  }

  const { shellMessages, routeMessages } = await createRouteMessageMap(namespaceForMessage);
  const importSubsets = await createImportSubsets(namespaceForMessage);

  await mkdir(path.join(stagedSource, "messages"), { recursive: true });
  await mkdir(path.join(stagedSource, "server"), { recursive: true });
  await mkdir(path.join(stagedSource, "imports"), { recursive: true });
  await mkdir(stagedStatic, { recursive: true });

  const assetDefinitions = new Map();
  const shellAssetKey = registerAsset("shell", shellMessages, assetDefinitions);
  const shellMessageSet = new Set(shellMessages);
  const routeAssetKeys = new Map();
  for (const [routeId, names] of routeMessages) {
    const routeOnlyNames = names?.filter((name) => !shellMessageSet.has(name));
    const routeAssetKey = registerAsset("route", routeOnlyNames, assetDefinitions);
    routeAssetKeys.set(routeId, [shellAssetKey, routeAssetKey]?.filter(Boolean) ?? []);
  }

  const assetUrls = Object.fromEntries(locales.map((locale) => [locale, {}]));
  const assetWriteJobs = [];
  for (const [assetKey, { names }] of assetDefinitions) {
    for (const locale of locales) {
      const baseBlocks = localeBlocks.get(baseLocale);
      const blocks = names.map((name) => localeBlocks.get(locale).get(name) ?? baseBlocks.get(name));
      const source = createClassicNamespaceScript(locale, assetKey, names, blocks);
      const hash = createHash("sha256").update(source).digest("hex").slice(0, 16);
      const directory = path.join(stagedStatic, hash);
      assetWriteJobs.push(async () => {
        await mkdir(directory, { recursive: true });
        await writeFile(path.join(directory, `${locale}-${assetKey}.js`), source);
      });
      assetUrls[locale][assetKey] = `/i18n/${hash}/${locale}-${assetKey}.js`;
    }
  }
  await runWithConcurrency(assetWriteJobs, 32);

  const catalogModules = [];
  for (const [catalog, names] of namespaceMessages) {
    const sortedNames = [...names].sort();
    await writeFile(path.join(stagedSource, "messages", `${catalog}.js`), createClientCatalogModule(sortedNames, localeMessages));
    await writeFile(
      path.join(stagedSource, "server", `${catalog}.js`),
      createServerCatalogModule(sortedNames, localeMessages),
    );
    catalogModules.push({ catalog, names: sortedNames });
  }
  await writeFile(path.join(stagedSource, "messages.js"), createMessageIndexModule(catalogModules));
  await writeFile(path.join(stagedSource, "server-messages.js"), createServerMessageIndexModule(catalogModules));
  for (const [hash, names] of importSubsets) {
    await writeFile(path.join(stagedSource, "imports", `client-${hash}.js`), createClientCatalogModule(names, localeMessages));
    await writeFile(
      path.join(stagedSource, "imports", `server-${hash}.js`),
      createServerCatalogModule(names, localeMessages),
    );
  }
  await writeFile(
    path.join(stagedSource, "manifest.js"),
    createManifestModule(routeAssetKeys, assetUrls),
  );
  const staticFiles = Object.values(assetUrls).flatMap((urls) => Object.values(urls));
  await writeFile(
    path.join(stagedStatic, "inventory.json"),
    JSON.stringify({ version: 1, files: staticFiles, routeAssetKeys, assetUrls }, mapReplacer),
  );
  await writeFile(
    path.join(stagedSource, "cache.json"),
    JSON.stringify({
      inputHash,
      sourceFiles: [
        "messages.js",
        "server-messages.js",
        "manifest.js",
        ...catalogModules.flatMap(({ catalog }) => [`messages/${catalog}.js`, `server/${catalog}.js`]),
        ...[...importSubsets.keys()].flatMap((hash) => [`imports/client-${hash}.js`, `imports/server-${hash}.js`]),
      ],
      staticFiles: [...staticFiles, "/i18n/inventory.json"],
    }),
  );

  // Publish immutable assets first. Existing assets remain available until the
  // source manifest has been swapped, so an interrupted generation cannot leave
  // the previous build pointing at missing translation files.
  await mkdir(generatedStatic, { recursive: true });
  await cp(stagedStatic, generatedStatic, { recursive: true, force: true });
  await publishGeneratedSource(stagedSource);
  await pruneStaticAssets(new Set(Object.values(assetUrls).flatMap((urls) => Object.values(urls))));

  console.log(
    `Generated ${namespaceForMessage.size} messages in ${assetDefinitions.size} exact route shards for ${routeMessages.size} routes and ${locales.length} locales.`,
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
  await rm(stagedSource, { recursive: true, force: true });
  await lock.close();
  await unlink(lockPath).catch(() => undefined);
}

process.exit(0);

async function readNamespaceMessages() {
  const result = new Map();
  const filenames = (await readdir(path.join(messagesDirectory, baseLocale)))
    ?.filter((filename) => filename.endsWith(".json"))
    .sort();
  for (const filename of filenames) {
    const catalog = JSON.parse(await readFile(path.join(messagesDirectory, baseLocale, filename), "utf8"));
    result.set(filename.slice(0, -5), Object.keys(catalog)?.filter((key) => key !== "$schema"));
  }
  return result;
}

async function validateTrackedRuntime() {
  const runtimeFilename = path.join(root, "src", "lib", "paraglide", "runtime.js");
  const runtime = await readFile(runtimeFilename, "utf8");
  const runtimeBaseLocale = runtime.match(/export const baseLocale\s*=\s*(["'][^"']+["'])/)?.[1];
  const runtimeLocalesSource = runtime.match(/export const locales\s*=\s*[\s\S]*?\((\[[^;]+\])\)/)?.[1];
  let runtimeLocales;
  try {
    runtimeLocales = JSON.parse(runtimeLocalesSource);
  } catch {
    runtimeLocales = null;
  }
  if (
    JSON.parse(runtimeBaseLocale ?? "null") !== baseLocale ||
    JSON.stringify(runtimeLocales) !== JSON.stringify(locales)
  ) {
    throw new Error(
      "src/lib/paraglide/runtime.js does not match project.inlang/settings.json. Regenerate the tracked Paraglide runtime explicitly before running i18n:delivery.",
    );
  }
}

async function readLocaleMessages(locale, namespaceMessages) {
  const messages = new Map();
  for (const [namespace, names] of namespaceMessages) {
    const localeFilename = path.join(messagesDirectory, locale, `${namespace}.json`);
    const baseFilename = path.join(messagesDirectory, baseLocale, `${namespace}.json`);
    const localeCatalog = (await isFile(localeFilename))
      ? JSON.parse(await readFile(localeFilename, "utf8"))
      : {};
    const baseCatalog = JSON.parse(await readFile(baseFilename, "utf8"));
    for (const name of names) {
      const value = localeCatalog[name] ?? baseCatalog[name];
      // Validate here even though the browser compiler runs later, so unsupported
      // syntax fails consistently for both browser and server delivery.
      compileSimpleMessage(name, value, locale);
      messages.set(name, value);
    }
  }
  return messages;
}

// Just the arrow, for inlining as a client-side fallback. compileSimpleMessage
// keeps its `const NAME = …;` shape because an existing caller depends on it.
function compileMessageArrow(name, value, locale) {
  return compileSimpleMessage(name, value, locale).replace(/^const\s+\S+\s*=\s*/, "").replace(/;$/, "");
}

function compileSimpleMessage(name, value, locale) {
  if (typeof value !== "string") {
    throw new Error(`${locale}:${name} must be a simple string message`);
  }
  const placeholderPattern = /\{([A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*)\}/g;
  const unsupportedSyntax = value.replace(placeholderPattern, "");
  if (/[{}]/.test(unsupportedSyntax)) {
    throw new Error(`${locale}:${name} uses unsupported message syntax: ${value}`);
  }
  let cursor = 0;
  let template = "";
  for (const match of value.matchAll(placeholderPattern)) {
    template += escapeTemplateLiteral(value.slice(cursor, match.index));
    const access = match[1].split(".").map((segment) => `?.${segment}`).join("");
    template += `\${i${access}}`;
    cursor = match.index + match[0].length;
  }
  template += escapeTemplateLiteral(value.slice(cursor));
  return `const ${name} = (i) => \`${template}\`;`;
}

function escapeTemplateLiteral(value) {
  return value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

async function createRouteMessageMap(namespaceForMessage) {
  const pageFiles = await findFiles(routesDirectory, (filename) => path.basename(filename) === "+page.svelte");
  const errorFiles = await findFiles(routesDirectory, (filename) => path.basename(filename) === "+error.svelte");
  const shellMessages = new Set();
  const shellVisited = new Set();
  const rootLayout = path.join(routesDirectory, "+layout.svelte");
  if (await isFile(rootLayout)) {
    await collectImportedMessages(rootLayout, shellMessages, shellVisited);
  }
  for (const errorFile of errorFiles) {
    await collectImportedMessages(errorFile, shellMessages, shellVisited);
  }
  const result = new Map();
  for (const pageFile of pageFiles.sort()) {
    const entrypoints = [pageFile];
    let directory = path.dirname(pageFile);
    while (directory.startsWith(routesDirectory)) {
      const layout = path.join(directory, "+layout.svelte");
      if (directory !== routesDirectory && (await isFile(layout))) entrypoints.push(layout);
      if (directory === routesDirectory) break;
      directory = path.dirname(directory);
    }
    const messages = new Set();
    const visited = new Set();
    for (const entrypoint of entrypoints) {
      await collectImportedMessages(entrypoint, messages, visited);
    }
    for (const name of messages) {
      if (!namespaceForMessage.has(name)) throw new Error(`${pageFile} imports unknown message ${name}`);
    }
    const relativeDirectory = path.relative(routesDirectory, path.dirname(pageFile));
    const routeId = relativeDirectory ? `/${relativeDirectory.split(path.sep).join("/")}` : "/";
    result.set(routeId, [...messages].sort());
  }
  for (const name of shellMessages) {
    if (!namespaceForMessage.has(name)) throw new Error(`Shell imports unknown message ${name}`);
  }
  return { shellMessages: [...shellMessages].sort(), routeMessages: result };
}

async function createImportSubsets(namespaceForMessage) {
  const subsets = new Map();
  const sourceFiles = await findInputFiles(path.join(root, "src"));
  for (const filename of sourceFiles) {
    if (filename.startsWith(generatedSource) || filename.includes(`${path.sep}paraglide${path.sep}`)) continue;
    for (const importedNames of await readDirectMessageImports(filename)) {
      const names = [...importedNames].sort();
      for (const name of names) {
        if (!namespaceForMessage.has(name)) throw new Error(`${filename} imports unknown message ${name}`);
      }
      if (names.length === 0) continue;
      subsets.set(importSubsetHash(names), names);
    }
  }
  return subsets;
}

async function readDirectMessageImports(filename) {
  const source = await readFile(filename, "utf8");
  const scanSource = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  const result = [];
  for (const match of scanSource.matchAll(/import\s*\{([^}]*)\}\s*from\s+["']\$lib\/paraglide\/messages(?:\.js)?["']/g)) {
    const names = new Set();
    for (const item of match[1].split(",")?.map((value) => value.trim())?.filter(Boolean) ?? []) {
      names.add(item.split(/\s+as\s+/)?.[0].trim());
    }
    result.push(names);
  }
  for (const match of scanSource.matchAll(/import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+["']\$lib\/paraglide\/messages(?:\.js)?["']/g)) {
    const namespaceAlias = match[1];
    const names = new Set();
    const usagePattern = new RegExp(`\\b${namespaceAlias}\\.([A-Za-z_$][\\w$]*)`, "g");
    for (const usage of scanSource.matchAll(usagePattern)) names.add(usage[1]);
    if (new RegExp(`\\b${namespaceAlias}\\s*\\[`).test(scanSource)) {
      throw new Error(`${filename} uses computed message access through ${namespaceAlias}`);
    }
    result.push(names);
  }
  return result;
}

function importSubsetHash(names) {
  return createHash("sha256").update(names.join("\n")).digest("hex").slice(0, 16);
}

function registerAsset(kind, messageNames, assetDefinitions) {
  const names = [...messageNames].sort();
  if (names.length === 0) return null;
  const subsetHash = createHash("sha256").update(names.join("\n")).digest("hex").slice(0, 16);
  const assetKey = `${kind}-${subsetHash}`;
  if (!assetDefinitions.has(assetKey)) assetDefinitions.set(assetKey, { names });
  return assetKey;
}

async function collectImportedMessages(filename, messages, visited) {
  const normalized = path.normalize(filename);
  if (visited.has(normalized)) return;
  visited.add(normalized);
  const analysis = await analyzeSourceFile(normalized);
  for (const name of analysis.messages) messages.add(name);
  for (const dependency of analysis.dependencies) {
    await collectImportedMessages(dependency, messages, visited);
  }
}

function analyzeSourceFile(filename) {
  if (!sourceAnalysisCache.has(filename)) {
    sourceAnalysisCache.set(filename, analyzeSourceFileUncached(filename));
  }
  return sourceAnalysisCache.get(filename);
}

async function analyzeSourceFileUncached(normalized) {
  const source = await readFile(normalized, "utf8");
  const scanSource = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  const messages = new Set();
  const messageImports = [];
  const dependencies = new Set();
  const importPattern = /import\s+([\s\S]*?)\s+from\s+["']([^"']+)["']/g;
  for (const match of scanSource.matchAll(importPattern)) {
    const clause = match[1];
    const specifier = match[2];
    if (specifier === "$lib/paraglide/messages" || specifier === "$lib/paraglide/messages.js") {
      const importedMessages = new Set();
      const named = clause.match(/\{([\s\S]*?)\}/)?.[1] ?? "";
      for (const item of named.split(",")?.map((value) => value.trim())?.filter(Boolean) ?? []) {
        importedMessages.add(item.split(/\s+as\s+/)?.[0].trim());
      }
      const namespaceAlias = clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/)?.[1];
      if (namespaceAlias) {
        const usagePattern = new RegExp(`\\b${namespaceAlias}\\.([A-Za-z_$][\\w$]*)`, "g");
        for (const usage of scanSource.matchAll(usagePattern)) importedMessages.add(usage[1]);
        if (new RegExp(`\\b${namespaceAlias}\\s*\\[`).test(scanSource)) {
          throw new Error(`${filename} uses computed message access through ${namespaceAlias}`);
        }
      }
      for (const name of importedMessages) messages.add(name);
      messageImports.push(importedMessages);
      continue;
    }
    const dependency = await resolveSourceImport(normalized, specifier);
    if (dependency) dependencies.add(dependency);
  }
  for (const match of scanSource.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) {
    const dependency = await resolveSourceImport(normalized, match[1]);
    if (dependency) dependencies.add(dependency);
  }
  for (const match of scanSource.matchAll(/export\s+(?:\*|\{[\s\S]*?\})\s+from\s+["']([^"']+)["']/g)) {
    const dependency = await resolveSourceImport(normalized, match[1]);
    if (dependency) dependencies.add(dependency);
  }
  return { messages, messageImports, dependencies };
}

async function resolveSourceImport(importer, specifier) {
  specifier = specifier?.split("?")?.[0];
  let base;
  if (specifier?.startsWith("$lib/")) base = path.join(root, "src", "lib", specifier.slice(5));
  else if (specifier?.startsWith(".")) base = path.resolve(path.dirname(importer), specifier);
  else return null;
  // Generated delivery modules are outputs of this script. Route analysis must
  // not require them to exist before a clean checkout can generate them.
  if (base === generatedSource || base?.startsWith(`${generatedSource}${path.sep}`)) return null;
  const candidates = (await isDirectory(base))
    ? [path.join(base, "index.ts"), path.join(base, "index.js")]
    : [
        base,
        base.endsWith(".js") ? `${base.slice(0, -3)}.ts` : base,
        `${base}.svelte`,
        `${base}.ts`,
        `${base}.js`,
      ];
  for (const candidate of candidates) if (await isFile(candidate)) return candidate;
  throw new Error(`Cannot resolve ${specifier} imported by ${importer}`);
}

async function findFiles(directory, predicate) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await findFiles(filename, predicate)));
    else if (entry.isFile() && predicate(filename)) result.push(filename);
  }
  return result;
}

async function isFile(filename) {
  try { return (await stat(filename)).isFile(); } catch { return false; }
}

async function isDirectory(filename) {
  try { return (await stat(filename)).isDirectory(); } catch { return false; }
}

async function createInputHash() {
  const hash = createHash("sha256");
  const inputs = [
    fileURLToPath(import.meta.url),
    path.join(root, "package-lock.json"),
    path.join(root, "project.inlang", "settings.json"),
    ...(await findInputFiles(messagesDirectory)),
    ...(await findInputFiles(path.join(root, "src", "routes"))),
    ...(await findInputFiles(path.join(root, "src", "lib"))),
  ];
  for (const filename of [...new Set(inputs)].sort()) {
    if (filename.startsWith(generatedSource) || filename.includes(`${path.sep}src${path.sep}lib${path.sep}paraglide${path.sep}`)) continue;
    hash.update(path.relative(root, filename));
    const isSource = filename.startsWith(path.join(root, "src"));
    const source = await readFile(filename, "utf8");
    hash.update(isSource ? deliverySignature(source) : source);
  }
  return hash.digest("hex");
}

function deliverySignature(source) {
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  const signatures = [];
  for (const pattern of [
    /import\s+[\s\S]*?\s+from\s+["'][^"']+["']/g,
    /import\(\s*["'][^"']+["']\s*\)/g,
    /export\s+(?:\*|\{[\s\S]*?\})\s+from\s+["'][^"']+["']/g,
  ]) {
    signatures.push(...withoutComments.match(pattern) ?? []);
  }
  const messageAliases = [];
  for (const match of withoutComments.matchAll(/import\s+([\s\S]*?)\s+from\s+["']\$lib\/paraglide\/messages(?:\.js)?["']/g)) {
    const alias = match[1].match(/\*\s+as\s+([A-Za-z_$][\w$]*)/)?.[1];
    if (alias) messageAliases.push(alias);
  }
  for (const alias of messageAliases) {
    const usagePattern = new RegExp(`\\b${alias}\\.([A-Za-z_$][\\w$]*)`, "g");
    signatures.push(...[...withoutComments.matchAll(usagePattern)].map((match) => `${alias}.${match[1]}`));
  }
  return signatures.sort().join("\n");
}

async function findInputFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await findInputFiles(filename)));
    else if (entry.isFile() && /\.(?:json|svelte|ts|js)$/.test(entry.name)) files.push(filename);
  }
  return files;
}

async function generatedOutputIsCurrent(expectedHash) {
  try {
    const cache = JSON.parse(await readFile(path.join(generatedSource, "cache.json"), "utf8"));
    if (cache.inputHash !== expectedHash || !Array.isArray(cache.sourceFiles) || !Array.isArray(cache.staticFiles)) return false;
    const sourceFiles = cache.sourceFiles.map((filename) => path.join(generatedSource, filename));
    const staticFiles = cache.staticFiles.map((url) => path.join(root, "static", url.replace(/^\//, "")));
    return await allFilesExist([...sourceFiles, ...staticFiles]);
  } catch {
    return false;
  }
}

async function acquireLock(filename, expectedHash) {
  const deadline = Date.now() + 120_000;
  for (;;) {
    try {
      await writeFile(filename, JSON.stringify({ pid: process.pid, createdAt: Date.now() }), { flag: "wx" });
      return { close: async () => undefined };
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      if (await generatedOutputIsCurrent(expectedHash)) {
        console.log("Translation delivery output was generated by another process.");
        return null;
      }
      if (!(await lockOwnerIsAlive(filename))) {
        await unlink(filename).catch(() => undefined);
        continue;
      }
      if (Date.now() >= deadline) throw new Error(`Timed out waiting for translation delivery lock: ${filename}`);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

async function lockOwnerIsAlive(filename) {
  try {
    const { pid, createdAt } = JSON.parse(await readFile(filename, "utf8"));
    if (!Number.isInteger(pid) || !Number.isFinite(createdAt)) return false;
    if (Date.now() - createdAt > 15 * 60_000) return false;
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

function createClassicNamespaceScript(locale, assetKey, names, blocks) {
  const body = blocks.join("\n\n").replace(/^export const /gm, "const ");
  return [
    `/* stocknear-i18n:${assetKey}:${locale} */`,
    "(() => {",
    body,
    `const root = globalThis.__stocknearI18nMessages ??= { locale: ${JSON.stringify(locale)}, messages: {}, loaded: {} };`,
    `if (root.locale !== ${JSON.stringify(locale)}) throw new Error("Mixed locale translation payload");`,
    `Object.assign(root.messages, { ${names.join(", ")} });`,
    `root.loaded[${JSON.stringify(assetKey)}] = true;`,
    "})();",
    "",
  ].join("\n");
}

function createClientCatalogModule(names, localeMessages) {
  // A missing message used to throw, which white-screened the whole page — one
  // absent string took down /chart/SPCX in production. The base-locale text is
  // inlined here so delivery gaps degrade to English and warn instead.
  const baseCatalog = localeMessages?.get(baseLocale);
  const fallbackEntries = names
    ?.filter((name) => typeof baseCatalog?.get(name) === "string")
    ?.map((name) => `  ${JSON.stringify(name)}: ${compileMessageArrow(name, baseCatalog.get(name), baseLocale)},`);
  return [
    'import { getLocale, trackMessageCall } from "$lib/paraglide/runtime.js";',
    'import { reportI18nGap } from "$lib/i18n/delivery/gap";',
    "const fallback = {",
    ...(fallbackEntries ?? []),
    "};",
    "function callMessage(name, inputs, options) {",
    "  const locale = options.locale ?? getLocale();",
    "  trackMessageCall(name, locale);",
    "  const loaded = globalThis.__stocknearI18nMessages;",
    // These are two different failures. A missing message affects one string; a
    // locale mismatch means the whole page is about to render in the wrong
    // language, which is far worse and must not be reported as the former.
    "  if (loaded && loaded.locale === locale) {",
    "    const message = loaded.messages[name];",
    "    if (message) return message(inputs);",
    '    reportI18nGap("missing-message", name, locale, loaded.locale);',
    "  } else {",
    '    reportI18nGap("locale-mismatch", name, locale, loaded ? loaded.locale : null);',
    "  }",
    "  const base = fallback[name];",
    "  return base ? base(inputs) : name;",
    "}",
    ...names.map((name) => `export const ${name} = (inputs = {}, options = {}) => callMessage(${JSON.stringify(name)}, inputs, options);`),
    "",
  ].join("\n");
}

function createMessageIndexModule(catalogModules) {
  return `${catalogModules.map(({ catalog, names }) => `export { ${names.join(", ")} } from "./messages/${catalog}.js";`).join("\n")}\n`;
}

function createServerMessageIndexModule(catalogModules) {
  return `${catalogModules.map(({ catalog, names }) => `export { ${names.join(", ")} } from "./server/${catalog}.js";`).join("\n")}\n`;
}

function createServerCatalogModule(names, localeMessages) {
  const messagesByLocale = Object.fromEntries(
    locales.map((locale) => [
      locale,
      Object.fromEntries(names.map((name) => [name, localeMessages.get(locale).get(name)])),
    ]),
  );
  const lines = [
    'import { getLocale, trackMessageCall } from "$lib/paraglide/runtime.js";',
    `const messagesByLocale = ${JSON.stringify(messagesByLocale)};`,
    `const baseLocale = ${JSON.stringify(baseLocale)};`,
    "function callMessage(name, inputs, options) {",
    "  const locale = options.locale ?? getLocale();",
    "  trackMessageCall(name, locale);",
    "  const template = messagesByLocale[locale]?.[name] ?? messagesByLocale[baseLocale][name];",
    "  return template.replace(/\\{([A-Za-z_][\\w]*(?:\\.[A-Za-z_][\\w]*)*)\\}/g, (_match, path) =>",
    "    path.split('.').reduce((value, segment) => value?.[segment], inputs),",
    "  );",
    "}",
  ];
  for (const name of names) {
    lines.push(`export const ${name} = (inputs = {}, options = {}) => callMessage(${JSON.stringify(name)}, inputs, options);`);
  }
  return `${lines.join("\n")}\n`;
}

async function publishGeneratedSource(stagedDirectory) {
  const backup = `${generatedSource}.previous-${process.pid}`;
  await rm(backup, { recursive: true, force: true });
  const hadPrevious = await isDirectory(generatedSource);
  if (hadPrevious) await rename(generatedSource, backup);
  try {
    await rename(stagedDirectory, generatedSource);
  } catch (error) {
    if (hadPrevious) await rename(backup, generatedSource);
    throw error;
  }
  await rm(backup, { recursive: true, force: true });
}

async function pruneStaticAssets(activeUrls) {
  const activeDirectories = new Set(
    [...activeUrls].map((url) => url.split("/")?.[2])?.filter(Boolean) ?? [],
  );
  for (const entry of await readdir(generatedStatic, { withFileTypes: true })) {
    if (entry.isDirectory() && !activeDirectories.has(entry.name)) {
      await rm(path.join(generatedStatic, entry.name), { recursive: true, force: true });
    }
  }
}

function mapReplacer(_key, value) {
  return value instanceof Map ? Object.fromEntries(value) : value;
}

async function allFilesExist(filenames) {
  let allExist = true;
  await runWithConcurrency(
    filenames.map((filename) => async () => {
      if (!(await isFile(filename))) allExist = false;
    }),
    64,
  );
  return allExist;
}

async function runWithConcurrency(jobs, limit) {
  let nextIndex = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, jobs.length) }, async () => {
      while (nextIndex < jobs.length) {
        const job = jobs[nextIndex++];
        await job();
      }
    }),
  );
}

function createManifestModule(routeAssetKeys, assetUrls) {
  return [
    `export const routeAssetKeys = ${JSON.stringify(Object.fromEntries(routeAssetKeys), null, 2)};`,
    `export const assetUrls = ${JSON.stringify(assetUrls, null, 2)};`,
    "export function getRouteLocaleAssets(routeId, locale) {",
    "  return (routeAssetKeys[routeId] ?? routeAssetKeys['/'] ?? []).map((assetKey) => assetUrls[locale]?.[assetKey])?.filter(Boolean) ?? [];",
    "}",
    "",
  ].join("\n");
}
