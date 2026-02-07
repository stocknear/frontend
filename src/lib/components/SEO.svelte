<script lang="ts">
  import { page } from "$app/stores";

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

  const baseURL = "https://stocknear.com";
  const pathname = $page?.url?.pathname || "";
  const canonical = baseURL + pathname;

  const siteName = "Stocknear";
  const twitterHandle = "@stocknear";
  const defaultImage = baseURL + "/pwa-512x512.png";

  // Global Organization + WebSite schema (rendered once on every page)
  const globalSchemas = [
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
        url: "https://stocknear.com/contact",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Stocknear",
      url: "https://stocknear.com",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://stocknear.com/stocks/{search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];

  // Default keywords for stock analysis
  const defaultKeywords =
    "stocknear, options flow, unusual options activity, sweep orders, block trades, dark pool, implied volatility, IV skew, open interest, options chain, short-term trade setups";
  const finalKeywords = keywords || defaultKeywords;
  const finalImage = image || defaultImage;
</script>

<svelte:head>
  <!-- Character set & viewport -->
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta
    name="robots"
    content="{noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'}"
  />
  {#if !noindex}
    <meta name="googlebot" content="index, follow" />
    <meta name="bingbot" content="index, follow" />
  {/if}

  <!-- Canonical URL -->
  <link rel="canonical" href={canonical} />

  <!-- Title & description -->
  <title>{title} - {siteName}</title>
  <meta name="description" content={description} />
  <meta name="keywords" content={finalKeywords} />
  <meta name="author" content={siteName} />

  <!-- Language and geo tags -->
  <meta name="language" content="English" />
  <meta name="geo.region" content="US" />

  <!-- Favicons & theme -->
  <link rel="icon" href="/favicon.ico" />
  <link
    rel="apple-touch-icon"
    sizes="64x64"
    href={baseURL + "/apple-touch-icon.png"}
  />
  <meta name="theme-color" content="#1f2937" />
  <meta name="msapplication-navbutton-color" content="#1f2937" />
  <meta
    name="apple-mobile-web-app-status-bar-style"
    content="black-translucent"
  />

  <!-- Open Graph -->
  <meta property="og:locale" content="en_US" />
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
  <link rel="alternate" hreflang="en" href={`${baseURL}${pathname}`} />
  <link rel="alternate" hreflang="de" href={`${baseURL}/de${pathname}`} />
  <link rel="alternate" hreflang="x-default" href={`${baseURL}${pathname}`} />

  <!-- Global Organization + WebSite Schema -->
  {#each globalSchemas as gs}
    {@html `<script type="application/ld+json">${JSON.stringify(gs)}</script>`}
  {/each}

  <!-- Page-Specific Structured Data -->
  {#if structuredData}
    {#if Array.isArray(structuredData)}
      {#each structuredData as sd}
        {#if sd}
          {@html `<script type="application/ld+json">${JSON.stringify(sd)}</script>`}
        {/if}
      {/each}
    {:else}
      {@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
    {/if}
  {/if}
</svelte:head>
