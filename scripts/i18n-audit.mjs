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
const forbiddenTranslations = {
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
    /AI 代理人/,
    /專業代理商/,
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
