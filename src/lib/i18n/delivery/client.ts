import { getLocale, type Locale } from "$lib/paraglide/runtime.js";
import {
  assetUrls,
  routeAssetKeys,
} from "$lib/i18n/delivery/generated/manifest.js";

type BrowserMessages = {
  locale: Locale;
  messages: Record<string, (inputs?: Record<string, unknown>) => string>;
  loaded: Record<string, boolean>;
};

declare global {
  var __stocknearI18nMessages: BrowserMessages | undefined;
}

const pendingAssets = new Map<string, Promise<void>>();

export function hasRouteMessages(routeId: string, locale = getLocale()): boolean {
  const state = globalThis.__stocknearI18nMessages;
  if (state?.locale !== locale) return false;

  const loaded = state.loaded;
  return (
    (routeAssetKeys[routeId] ?? routeAssetKeys["/"] ?? [])?.every(
      (assetKey) => loaded?.[assetKey],
    ) ?? true
  );
}

export async function loadRouteMessages(
  routeId: string,
  locale = getLocale(),
): Promise<void> {
  const assetKeys = routeAssetKeys[routeId] ?? routeAssetKeys["/"] ?? [];
  await Promise.all(
    assetKeys
      ?.filter(
        (assetKey) =>
          globalThis.__stocknearI18nMessages?.locale !== locale ||
          !globalThis.__stocknearI18nMessages.loaded?.[assetKey],
      )
      ?.map((assetKey) => {
        const src = assetUrls[locale]?.[assetKey];
        if (!src) {
          throw new Error(
            `Missing translation asset for ${locale}: ${assetKey}`,
          );
        }
        return loadScript(src, locale, assetKey);
      }),
  );
}

function loadScript(src: string, locale: Locale, assetKey: string): Promise<void> {
  const existing = pendingAssets.get(src);
  if (existing) return existing;

  const pending = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      pendingAssets.delete(src);
      const state = globalThis.__stocknearI18nMessages;
      if (state?.locale !== locale || !state.loaded?.[assetKey]) {
        script.remove();
        reject(new Error(`Invalid translation payload: ${src}`));
        return;
      }
      resolve();
    };
    script.onerror = () => {
      pendingAssets.delete(src);
      script.remove();
      reject(new Error(`Unable to load translations: ${src}`));
    };
    document.head.append(script);
  });
  pendingAssets.set(src, pending);
  return pending;
}
