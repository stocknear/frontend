import type { Locale } from "$lib/i18n/locales";
import {
  FINANCIAL_RATIO_KEYS,
  type FinancialRatiosPageCatalog,
  type FinancialRatiosSourceCatalog,
} from "./types";

const catalogLoaders: Record<
  Locale,
  () => Promise<{ default: FinancialRatiosSourceCatalog }>
> = {
  en: () => import("./catalogs/en"),
  de: () => import("./catalogs/de"),
  es: () => import("./catalogs/es"),
  fr: () => import("./catalogs/fr"),
  "zh-CN": () => import("./catalogs/zh-CN"),
  "zh-TW": () => import("./catalogs/zh-TW"),
  ja: () => import("./catalogs/ja"),
  ko: () => import("./catalogs/ko"),
  ru: () => import("./catalogs/ru"),
  uk: () => import("./catalogs/uk"),
};

/** Load and serialize only the catalog needed by the current request locale. */
export async function getFinancialRatiosCatalog(
  locale: Locale,
): Promise<FinancialRatiosPageCatalog> {
  const { default: catalog } = await catalogLoaders[locale]();

  return {
    sectionTitle: catalog.sectionTitle,
    statementConfig: FINANCIAL_RATIO_KEYS.map((propertyName) => {
      const [label, text] = catalog.metrics[propertyName];
      return { propertyName, label, text };
    }),
    seo: catalog.seo,
  };
}
