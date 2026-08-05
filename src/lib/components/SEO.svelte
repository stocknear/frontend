<script lang="ts">
  import { page } from "$app/stores";
  import {
    baseLocale,
    deLocalizeUrl,
    extractLocaleFromUrl,
    type Locale,
  } from "$lib/paraglide/runtime.js";
  import { hrefForLocale } from "$lib/i18n/navigation";
  import { getLocaleDefinition, supportedLocales } from "$lib/i18n/locales";
  import { jsonLdScript } from "$lib/seo/json-ld";
  import type { SeoEligibility } from "$lib/seo/eligibility";

  export let title = "Real-Time Options Flow & Unusual Activity";
  export let description =
    "Track live options flow, sweeps, blocks, and unusual activity to spot short-term trade setups faster.";
  export let keywords: string | null = null;
  export let image: string | null = null;
  export let structuredData: any = null;
  export let type: string = "website";
  export let article: any = null;
  export let twitterCard: string = "summary";
  export let noindex: boolean = false;
  export let contentLocales: readonly Locale[] | null = null;
  export let seoEligibility: SeoEligibility | null = null;
  export let canonicalPath: string | null = null;

  const baseURL = "https://stocknear.com";
  // The URL is the canonical locale source for both SSR and hydration. Reading
  // the browser runtime here can expose a stale cookie locale before startup
  // finishes and change the serialized JSON-LD between server and client.
  $: currentLocale = extractLocaleFromUrl($page.url) ?? baseLocale;
  $: localeDefinition = getLocaleDefinition(currentLocale);
  $: pathname = $page?.url?.pathname || "";
  $: inheritedEligibility = ($page?.data as { seoEligibility?: SeoEligibility })
    ?.seoEligibility;
  $: effectiveEligibility = seoEligibility ?? inheritedEligibility ?? null;
  $: requestedCanonicalUrl = resolveCanonicalUrl(
    canonicalPath ?? effectiveEligibility?.canonicalPath ?? pathname,
  );
  $: delocalizedCanonicalUrl = deLocalizeUrl(requestedCanonicalUrl);
  $: alternateLocales = normalizeAlternateLocales(
    contentLocales ?? effectiveEligibility?.availableLocales ?? supportedLocales,
  );
  $: canonicalLocale = alternateLocales?.includes(currentLocale)
    ? currentLocale
    : alternateLocales?.includes(baseLocale)
      ? baseLocale
      : alternateLocales?.at(0) ?? baseLocale;
  $: canonical = alternateHref(canonicalLocale);
  $: shouldNoIndex =
    noindex ||
    effectiveEligibility?.indexable === false ||
    !alternateLocales?.includes(currentLocale);

  const siteName = "Stocknear";
  const twitterHandle = "@stocknear";
  const defaultImage = baseURL + "/pwa-512x512.png";

  const PAGE_URL_PROPERTIES = new Set(["url", "item", "@id"]);
  const GLOBAL_IDENTITY_TYPES = new Set(["Organization", "ImageObject"]);

  function localizeStructuredUrl(value: string, locale: Locale): string {
    try {
      const url = new URL(value, baseURL);
      if (url.origin !== baseURL) return value;

      const path = deLocalizeUrl(url).pathname;
      return `${baseURL}${hrefForLocale(path, locale)}${url.search}${url.hash}`;
    } catch {
      return value;
    }
  }

  function localizeStructuredDataUrls(
    value: unknown,
    locale: Locale,
  ): unknown {
    if (Array.isArray(value)) {
      return value?.map((item) => localizeStructuredDataUrls(item, locale));
    }
    if (!value || typeof value !== "object") return value;

    const record = value as Record<string, unknown>;
    const schemaTypes = Array.isArray(record["@type"])
      ? record["@type"]
      : [record["@type"]];
    const isGlobalIdentity = schemaTypes?.every(
      (schemaType) =>
        typeof schemaType === "string" &&
        GLOBAL_IDENTITY_TYPES.has(schemaType),
    );

    return Object.fromEntries(
      Object.entries(record)?.map(([key, item]) => {
        if (
          typeof item === "string" &&
          PAGE_URL_PROPERTIES.has(key) &&
          !isGlobalIdentity
        ) {
          return [key, localizeStructuredUrl(item, locale)];
        }
        return [key, localizeStructuredDataUrls(item, locale)];
      }),
    );
  }

  function prepareStructuredData(value: unknown): unknown {
    return localizeStructuredDataUrls(value, currentLocale);
  }

  $: pageSchemas = (Array.isArray(structuredData)
    ? structuredData
    : [structuredData]
  )
    ?.filter(Boolean)
    ?.map((schema) => prepareStructuredData(schema));

  // Global Organization + WebSite schema (rendered once on every page)
  $: globalSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
      logo: "https://stocknear.com/pwa-512x512.png",
      sameAs: [
        "https://twitter.com/stocknear",
        "https://www.reddit.com/r/stocknear/",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        url: `${baseURL}${hrefForLocale("/contact", currentLocale)}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Stocknear",
      url: `${baseURL}${hrefForLocale("/", currentLocale)}`,
      inLanguage: localeDefinition.intlTag,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseURL}${hrefForLocale("/stocks", currentLocale)}/{search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];

  const finalImage = image || defaultImage;

  function resolveCanonicalUrl(value: string): URL {
    try {
      const resolved = new URL(value, baseURL);
      if (resolved.origin !== baseURL) return new URL(pathname || "/", baseURL);
      resolved.hash = "";
      return resolved;
    } catch {
      return new URL(pathname || "/", baseURL);
    }
  }

  function normalizeAlternateLocales(locales: readonly Locale[]): Locale[] {
    return [...new Set(locales?.filter((locale) => supportedLocales?.includes(locale)) ?? [])];
  }

  function alternateHref(locale: Locale): string {
    return `${baseURL}${hrefForLocale(delocalizedCanonicalUrl.pathname, locale)}${delocalizedCanonicalUrl.search}`;
  }
</script>

<svelte:head>
  <!-- Character set & viewport -->
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta
    name="robots"
    content="{shouldNoIndex ? 'noindex, follow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'}"
  />
  {#if !shouldNoIndex}
    <meta name="googlebot" content="index, follow" />
    <meta name="bingbot" content="index, follow" />
  {/if}

  <!-- Canonical URL -->
  <link rel="canonical" href={canonical} />

  <!-- Title & description -->
  <title>{title} - {siteName}</title>
  <meta name="description" content={description} />
  <meta name="author" content={siteName} />

  <!-- Language and geo tags -->
  <meta name="language" content={localeDefinition.name} />
  <meta name="geo.region" content="US" />

  <!-- Favicons & theme -->
  <link rel="icon" href="/favicon.ico" />
  <link
    rel="apple-touch-icon"
    sizes="64x64"
    href={baseURL + "/apple-touch-icon.png"}
  />
  <!-- theme-color / navbutton-color are set in app.html per request so they
       follow the active theme; duplicating them here would override that. -->
  <meta
    name="apple-mobile-web-app-status-bar-style"
    content="black-translucent"
  />

  <!-- Open Graph -->
  <meta property="og:locale" content={localeDefinition.ogLocale} />
  {#each alternateLocales?.filter((locale) => locale !== currentLocale) ?? [] as locale}
    <meta property="og:locale:alternate" content={getLocaleDefinition(locale).ogLocale} />
  {/each}
  <meta property="og:site_name" content={siteName} />
  <meta property="og:type" content={type} />
  <meta property="og:url" content={canonical} />
  <meta property="og:title" content={`${title} - ${siteName}`} />
  <meta property="og:description" content={description} />

  {#if finalImage}
    <meta property="og:image" content={finalImage} />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:alt" content={`${title} - ${siteName}`} />
  {/if}

  {#if article}
    <meta property="article:author" content={siteName} />
    <meta property="article:publisher" content={baseURL} />
    {#if article.publishedTime}
      <meta property="article:published_time" content={article.publishedTime} />
    {/if}
    {#if article.modifiedTime}
      <meta property="article:modified_time" content={article.modifiedTime} />
    {/if}
    {#if article.section}
      <meta property="article:section" content={article.section} />
    {/if}
    {#if article.tags}
      {#each article.tags as tag}
        <meta property="article:tag" content={tag} />
      {/each}
    {/if}
  {/if}

  <!-- Twitter Card -->
  <meta name="twitter:card" content={twitterCard} />
  <meta name="twitter:site" content={twitterHandle} />
  <meta name="twitter:creator" content={twitterHandle} />
  <meta name="twitter:title" content={`${title} - ${siteName}`} />
  <meta name="twitter:description" content={description} />

  {#if finalImage}
    <meta name="twitter:image" content={finalImage} />
    <meta name="twitter:image:alt" content={`${title} - ${siteName}`} />
  {/if}

  <!-- Mobile web-app -->
  <meta name="apple-mobile-web-app-title" content={siteName} />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />

  <!-- Hreflang for multilingual SEO -->
  {#if !shouldNoIndex}
    {#each alternateLocales as locale}
      <link rel="alternate" hreflang={locale} href={alternateHref(locale)} />
    {/each}
    {#if alternateLocales?.includes("en")}
      <link rel="alternate" hreflang="x-default" href={alternateHref("en")} />
    {/if}
  {/if}

  {#if !shouldNoIndex}
    <!-- Global Organization + WebSite Schema -->
    {#each globalSchemas as gs}
      {@html jsonLdScript(gs)}
    {/each}

    <!-- Page-Specific Structured Data -->
    {#each pageSchemas as schema}
      {@html jsonLdScript(schema)}
    {/each}
  {/if}
</svelte:head>
