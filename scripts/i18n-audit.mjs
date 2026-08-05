import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const settings = JSON.parse(
  fs.readFileSync(path.join(root, "project.inlang/settings.json"), "utf8"),
);
const [baseLocale, ...targetLocales] = settings.locales;
const messagesRoot = path.join(root, "messages");
const failures = [];
const warnings = [];
const sourceStatePath = path.join(root, "scripts/i18n-source-state.json");
const writeSourceState = process.argv.includes("--write-source-state");
const hardcodedBaseline = JSON.parse(
  fs.readFileSync(
    path.join(root, "scripts/i18n-hardcoded-baseline.json"),
    "utf8",
  ),
);
const robotsText = fs.readFileSync(path.join(root, "static/robots.txt"), "utf8");
const robotsRules = new Set(
  robotsText.match(/^Disallow:\s+\S+/gm)?.map((rule) => rule.trim()) ?? [],
);
// Only paths that actually resolve to a route belong here — robots.txt rules for
// routes that do not exist are dead weight. /settings and /admin were removed.
const localizedPrivatePaths = ["profile*", "auth/*"];
for (const locale of targetLocales) {
  const localeSlug = locale.toLowerCase();
  for (const privatePath of localizedPrivatePaths) {
    const expectedRule = `Disallow: /${localeSlug}/${privatePath}`;
    if (!robotsRules.has(expectedRule)) {
      failures.push(
        `static/robots.txt: missing private-path rule for ${locale}: ${expectedRule}`,
      );
    }
  }
}
const forbiddenTranslations = {
  de: [/bullisch Tendenz/i, /bärisch Überzeugung/i],
  es: [
    /Mejores artistas/i,
    /Sobreventa ETFs/i,
    /Las beneficio/i,
    /Mes anterior corto/i,
    /% corto flotante/i,
  ],
  "zh-TW": [
    /邊距/,
    /財政季度/,
    /下一頁財報發布/,
    /前一個月較短/,
    /短期浮動百分比/,
    /體積/,
    /普雷姆/,
    /發送。/,
    /尺寸/,
    /^型$/,
    /不尋常的選擇/,
    /<span>balanced<\/span>/i,
    /希臘貨幣/,
    /篩選器篩選器/,
    /篩網/,
    /股票代理/,
    /AI 代理/,
    /專業代理商/,
    /填寫你最喜歡的股票/,
    /選擇權費/,
    /符號/,
    /效能/,
    /財報買權/,
    /買權會議/,
  ],
};

const jsonFiles = (locale) =>
  (fs
    .readdirSync(path.join(messagesRoot, locale))
    ?.filter((file) => file.endsWith(".json")) ?? [])
    .sort();

const duplicateKeys = (rawCatalog) => {
  const seen = new Set();
  const duplicates = new Set();
  for (const match of rawCatalog.matchAll(
    /^\s*"((?:\\.|[^"\\])*)"\s*:/gm,
  )) {
    const key = JSON.parse(`"${match[1]}"`);
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return [...duplicates];
};

for (const locale of settings.locales) {
  const localePath = path.join(messagesRoot, locale);
  if (!fs.existsSync(localePath)) continue;
  for (const file of jsonFiles(locale)) {
    const rawCatalog = fs.readFileSync(path.join(localePath, file), "utf8");
    for (const key of duplicateKeys(rawCatalog)) {
      failures.push(`${locale}/${file}:${key}: duplicate key`);
    }
  }
}

const readCatalog = (locale, file) =>
  JSON.parse(fs.readFileSync(path.join(messagesRoot, locale, file), "utf8"));

const placeholders = (message) =>
  new Set(
    [...String(message).matchAll(/\{([A-Za-z_][\w.]*)\}/g)].map(
      (match) => match[1],
    ),
  );

const htmlTokens = (message) =>
  [...String(message).matchAll(/<\/?([a-z][\w-]*)\b[^>]*>/gi)]
    .map((match) =>
      match[0].startsWith("</")
        ? `/${match[1].toLowerCase()}`
        : match[1].toLowerCase(),
    )
    .sort();

const sameSet = (left, right) =>
  left.size === right.size && [...left].every((value) => right.has(value));
const baseFiles = jsonFiles(baseLocale);

const sourceFiles = [];
for (const directory of [path.join(root, "src")]) {
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      else if (/\.(svelte|ts)$/.test(entry.name)) sourceFiles.push(fullPath);
    }
  };
  visit(directory);
}
const sourceText = sourceFiles
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
const svelteText = sourceFiles
  ?.filter((file) => file.endsWith(".svelte"))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n") ?? "";
const hardcodedCounts = {
  explicitEnUs: (sourceText.match(/"en-US"/g) ?? []).length,
  relativeInternalHrefs: (svelteText.match(/href="\//g) ?? []).length,
  rawSvelteTextNodes: (svelteText.match(/>[ \t]*[A-Za-z][^<{\n]*</g) ?? [])
    .length,
};
for (const [name, count] of Object.entries(hardcodedCounts)) {
  if (count > hardcodedBaseline[name]) {
    failures.push(
      `hardcoded UI baseline ${name} increased from ${hardcodedBaseline[name]} to ${count}`,
    );
  }
}

// Reading a fixed index out of a split pathname silently breaks on every
// locale-prefixed route: /de/chat/<id> made `split("/")[1]` return "chat", so
// the chat lookup threw and 302'd. Use the route param, or de-localize first.
// Files that legitimately inspect the prefix (the locale detector, the SSR
// hooks, the SEO canonicaliser) opt out by naming a locale helper nearby.
for (const file of sourceFiles) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    const splitsPathname = /pathname[^;]*\.split\(/.test(line);
    if (!splitsPathname) return;
    const window = lines.slice(index, index + 12).join("\n");
    // Files whose job IS the prefix opt out by naming a locale helper nearby.
    if (/canonicalizeLocale|deLocalize|hasLocalePrefix/.test(window)) return;

    // Two shapes to catch: indexing the split result inline on this line, and
    // assigning it to a variable that is indexed within the next few lines.
    const inline = /\.split\([^)]*\)[^;]*?\[\s*\d+\s*\]/.test(line);
    const declaration = line.match(/(?:const|let)\s+(\w+)\s*=/);
    const viaVariable =
      declaration && new RegExp(`\\b${declaration[1]}\\s*\\??\\.?\\[\\s*\\d+\\s*\\]`).test(window);

    if (inline || viaVariable) {
      failures.push(
        `${path.relative(root, file)}:${index + 1}: positional index into a split pathname is locale-fragile (a /de/ prefix shifts every segment) — use the route param or deLocalizeHref()`,
      );
    }
  });
}
const sourceState = Object.fromEntries(
  baseFiles.map((file) => [
    file,
    crypto
      .createHash("sha256")
      .update(fs.readFileSync(path.join(messagesRoot, baseLocale, file)))
      .digest("hex"),
  ]),
);

if (writeSourceState) {
  // Written only after every catalog check passes below.
} else if (!fs.existsSync(sourceStatePath)) {
  failures.push(
    "source translation state is missing; run npm run i18n:accept-source after reviewing every target locale",
  );
} else {
  const acceptedSourceState = JSON.parse(
    fs.readFileSync(sourceStatePath, "utf8"),
  );
  for (const file of baseFiles) {
    if (acceptedSourceState[file] !== sourceState[file]) {
      failures.push(
        `en/${file}: source changed without translation review (run npm run i18n:accept-source after updating all locales)`,
      );
    }
  }
}

for (const locale of targetLocales) {
  const localePath = path.join(messagesRoot, locale);
  if (!fs.existsSync(localePath)) {
    failures.push(`${locale}: catalog directory is missing`);
    continue;
  }

  const files = jsonFiles(locale);
  for (const file of baseFiles?.filter((name) => !files.includes(name)) ?? [])
    failures.push(`${locale}/${file}: file is missing`);
  for (const file of files?.filter((name) => !baseFiles.includes(name)) ?? [])
    failures.push(`${locale}/${file}: target-only file`);

  let exactEnglish = 0;
  for (const file of baseFiles?.filter((name) => files.includes(name)) ?? []) {
    const source = readCatalog(baseLocale, file);
    const target = readCatalog(locale, file);
    const sourceKeys =
      Object.keys(source)?.filter((key) => key !== "$schema") ?? [];
    const targetKeys =
      Object.keys(target)?.filter((key) => key !== "$schema") ?? [];

    for (const key of sourceKeys?.filter((name) => !(name in target)) ?? [])
      failures.push(`${locale}/${file}:${key}: key is missing`);
    for (const key of targetKeys?.filter((name) => !(name in source)) ?? [])
      failures.push(`${locale}/${file}:${key}: target-only key`);

    for (const key of sourceKeys?.filter((name) => name in target) ?? []) {
      const sourceMessage = source[key];
      const targetMessage = target[key];
      if (typeof targetMessage !== "string" || targetMessage.trim() === "") {
        failures.push(`${locale}/${file}:${key}: blank or non-string message`);
        continue;
      }
      if (!sameSet(placeholders(sourceMessage), placeholders(targetMessage))) {
        failures.push(`${locale}/${file}:${key}: placeholder names differ`);
      }
      if (
        htmlTokens(sourceMessage).join("|") !==
        htmlTokens(targetMessage).join("|")
      ) {
        failures.push(`${locale}/${file}:${key}: HTML tag structure differs`);
      }
      if (/<script\b|\son\w+\s*=|javascript:/i.test(targetMessage)) {
        failures.push(`${locale}/${file}:${key}: unsafe HTML content`);
      }
      for (const pattern of forbiddenTranslations[locale] ?? []) {
        if (pattern.test(targetMessage)) {
          failures.push(
            `${locale}/${file}:${key}: contains known finance mistranslation ${pattern}`,
          );
        }
      }
      if (targetMessage === sourceMessage) exactEnglish += 1;
    }
  }
  warnings.push(
    `${locale}: ${exactEnglish} messages are byte-identical to English (review proper nouns/acronyms in translation QA)`,
  );
}

if (failures.length) {
  console.error(`Localization audit failed with ${failures.length} issue(s):`);
  for (const failure of failures.slice(0, 200)) console.error(`- ${failure}`);
  if (failures.length > 200)
    console.error(`- …and ${failures.length - 200} more`);
  process.exit(1);
}

if (writeSourceState) {
  fs.writeFileSync(
    sourceStatePath,
    `${JSON.stringify(sourceState, null, 2)}\n`,
  );
}

console.log(
  `Localization audit passed: ${settings.locales.length} locales, ${baseFiles.length} catalogs.${writeSourceState ? " Source state accepted." : ""}`,
);
for (const warning of warnings) console.log(`- ${warning}`);
