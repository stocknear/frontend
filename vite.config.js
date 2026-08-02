import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// import { partytownVite } from '@builder.io/partytown/utils';
// import { visualizer } from "rollup-plugin-visualizer";

const deliveryMessages = fileURLToPath(
  new URL("./src/lib/i18n/delivery/generated/messages.js", import.meta.url),
);
const deliveryServerMessages = fileURLToPath(
  new URL("./src/lib/i18n/delivery/generated/server-messages.js", import.meta.url),
);
const deliveryGeneratedDirectory = fileURLToPath(
  new URL("./src/lib/i18n/delivery/generated", import.meta.url),
);
const messageCatalogs = new Map();
let productionBuild = false;
const englishMessagesDirectory = fileURLToPath(new URL("./messages/en", import.meta.url));
for (const filename of readdirSync(englishMessagesDirectory)?.filter((name) => name.endsWith(".json")) ?? []) {
  const catalog = filename.slice(0, -5);
  const messages = JSON.parse(readFileSync(path.join(englishMessagesDirectory, filename), "utf8"));
  for (const name of Object.keys(messages)?.filter((name) => name !== "$schema")) {
    messageCatalogs.set(name, catalog);
  }
}

const currentLocaleMessages = {
  name: "stocknear-current-locale-messages",
  enforce: "pre",
  configResolved(config) {
    productionBuild = config.command === "build";
  },
  transform(source, id, options) {
    if (!id.includes("/src/") || !source.includes("$lib/paraglide/messages")) return null;
    const environment = options?.ssr ? "server" : "client";
    const useServerCatalogs = options?.ssr && productionBuild;
    let changed = false;
    let code = source.replace(
      /import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s*["']\$lib\/paraglide\/messages(?:\.js)?["'];?/g,
      (_statement, alias) => {
        changed = true;
        if (new RegExp(`\\b${alias}\\s*\\[`).test(source)) {
          throw new Error(`${id} uses computed translation access through ${alias}`);
        }
        const names = [...new Set(
          [...source.matchAll(new RegExp(`\\b${alias}\\.([A-Za-z_$][\\w$]*)`, "g"))].map((match) => match[1]),
        )].sort();
        for (const name of names) {
          if (!messageCatalogs.has(name)) throw new Error(`${id} imports unknown message ${name}`);
        }
        const imports = useServerCatalogs
          ? [...groupNamesByCatalog(names)].map(([catalog, catalogNames]) => {
              const filename = path.join(deliveryGeneratedDirectory, "server", `${catalog}.js`);
              const specifiers = catalogNames.map((name) => `${name} as __stocknear_i18n_${name}`);
              return `import { ${specifiers.join(", ")} } from ${JSON.stringify(filename)};`;
            })
          : [
              `import { ${names.map((name) => `${name} as __stocknear_i18n_${name}`).join(", ")} } from ${JSON.stringify(
                path.join(deliveryGeneratedDirectory, "imports", `${environment}-${importSubsetHash(names)}.js`),
              )};`,
            ];
        const properties = names.map((name) => `${name}: __stocknear_i18n_${name}`);
        return `${imports.join("\n")}\nconst ${alias} = { ${properties.join(", ")} };`;
      },
    );
    code = code.replace(
      /import\s*\{([^}]*)\}\s*from\s*["']\$lib\/paraglide\/messages(?:\.js)?["'];?/g,
      (_statement, clause) => {
        changed = true;
        const uncommentedClause = clause
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/^\s*\/\/.*$/gm, "");
        const specifiers = uncommentedClause.split(",")?.map((value) => value.trim())?.filter(Boolean) ?? [];
        const names = [];
        for (const specifier of specifiers) {
          const importedName = specifier.split(/\s+as\s+/)?.[0].trim();
          if (!messageCatalogs.has(importedName)) throw new Error(`${id} imports unknown message ${importedName}`);
          names.push(importedName);
        }
        if (!useServerCatalogs) {
          const hash = importSubsetHash(names);
          const filename = path.join(deliveryGeneratedDirectory, "imports", `${environment}-${hash}.js`);
          return `import { ${specifiers.join(", ")} } from ${JSON.stringify(filename)};`;
        }
        const specifierByName = new Map(
          specifiers.map((specifier) => [specifier.split(/\s+as\s+/)?.[0].trim(), specifier]),
        );
        return [...groupNamesByCatalog(names)]
          .map(([catalog, catalogNames]) => {
            const filename = path.join(deliveryGeneratedDirectory, "server", `${catalog}.js`);
            return `import { ${catalogNames.map((name) => specifierByName.get(name)).join(", ")} } from ${JSON.stringify(filename)};`;
          })
          .join("\n");
      },
    );
    if (!changed && /from\s*["']\$lib\/paraglide\/messages(?:\.js)?["']/.test(source)) {
      throw new Error(`${id} uses an unsupported non-named translation import`);
    }
    return changed ? { code, map: null } : null;
  },
  resolveId(source, _importer, options) {
    if (
      source === "$lib/paraglide/messages" ||
      source === "$lib/paraglide/messages.js"
    ) {
      return options?.ssr ? deliveryServerMessages : deliveryMessages;
    }
  },
};

function importSubsetHash(names) {
  return createHash("sha256").update([...names].sort().join("\n")).digest("hex").slice(0, 16);
}

function groupNamesByCatalog(names) {
  const result = new Map();
  for (const name of names) {
    const catalog = messageCatalogs.get(name);
    const catalogNames = result.get(catalog) ?? [];
    catalogNames.push(name);
    result.set(catalog, catalogNames);
  }
  return result;
}

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    // visualizer({ open: false, filename: "stats.html" }), // Plugin to visualize the bundle
    currentLocaleMessages,
    tailwindcss(),
    sveltekit(),
    // partytownVite(),
  ],

  server: {
    cors: true,
    proxy: {
      "/ws": {
        target: "ws://127.0.0.1:2000",
        ws: true,
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/ws/, ""),
      },
    },
    watch: {
      usePolling: false, // Use native FS events for better performance
      ignored: ["**/src/lib/paraglide/**"], // Don't watch generated paraglide files
    },
   // allowedHosts: ["rnxuv-78-94-200-246.a.free.pinggy.link"], //dev mode only for testing lemonsqueezy
  },

  optimizeDeps: {
    entries: ["src/lib/paraglide/runtime.js"],
  },

  test: {
    include: ["tests/unit/**/*.{test,spec}.{js,ts}"],
  },

  build: {
    target: "esnext",
    minify: "esbuild",
    sourcemap: false,
    cssCodeSplit: true, // Extract CSS into separate files
    chunkSizeWarningLimit: 500, // Lower this to ensure chunks are appropriately sized
    rollupOptions: {},
    brotliSize: true, // Enable Brotli compression
  },
};

export default config;
