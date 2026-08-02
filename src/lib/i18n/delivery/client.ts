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

export function hasRouteMessages(routeId: string): boolean {
  const loaded = globalThis.__stocknearI18nMessages?.loaded;
  return (routeAssetKeys[routeId] ?? routeAssetKeys["/"] ?? []).every(
    (assetKey) => loaded?.[assetKey],
  );
}

export async function loadRouteMessages(routeId: string): Promise<void> {
  const locale = getLocale();
  const assetKeys = routeAssetKeys[routeId] ?? routeAssetKeys["/"] ?? [];
  await Promise.all(
    assetKeys
      ?.filter((assetKey) => !globalThis.__stocknearI18nMessages?.loaded?.[assetKey])
      .map((assetKey) => loadScript(assetUrls[locale][assetKey])),
  );
}

function loadScript(src: string): Promise<void> {
  const existing = pendingAssets.get(src);
  if (existing) return existing;

  const pending = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Unable to load translations: ${src}`));
    document.head.append(script);
  });
  pendingAssets.set(src, pending);
  return pending;
}
