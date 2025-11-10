<script lang="ts">
  import { page } from "$app/stores";

  export let title = "Advanced Stock Analysis & Financial Data Platform";
  export let description =
    "Stocknear gives you realtime market insights for your stock analysis with up-to-date financials, news, and interactive charts.";
  export let keywords: string | null = null;
  export let image: string | null = null;
  export let structuredData: any = null;
  export let type: string = "website";
  export let article: any = null;

  const baseURL = "https://stocknear.com";
  const canonical = baseURL + ($page?.url?.pathname || "");

  const siteName = "Stocknear";
  const twitterHandle = "@stocknear";

  // Default keywords for stock analysis
  const defaultKeywords =
    "stocknear, stock analysis, stock forecast, financial data, options flow, earnings analysis, market insights, AI stock predictions";
  const finalKeywords = keywords || defaultKeywords;
</script>

<svelte:head>
  <!-- Character set & viewport -->
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta
    name="robots"
    content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
  />
  <meta name="googlebot" content="index, follow" />
  <meta name="bingbot" content="index, follow" />

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

  {#if image}
    <meta property="og:image" content={image} />
    <meta property="og:image:width" content="256" />
    <meta property="og:image:height" content="256" />
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
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:site" content={twitterHandle} />
  <meta name="twitter:creator" content={twitterHandle} />
  <meta name="twitter:title" content={`${title} - ${siteName}`} />
  <meta name="twitter:description" content={description} />

  {#if image}
    <meta name="twitter:image" content={image} />
    <meta name="twitter:image:alt" content={`${title} - ${siteName}`} />
  {/if}

  <!-- Apple mobile web-app -->
  <meta name="apple-mobile-web-app-title" content={siteName} />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />

  <!-- Structured Data -->
  {#if structuredData}
    {@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
  {/if}
</svelte:head>
