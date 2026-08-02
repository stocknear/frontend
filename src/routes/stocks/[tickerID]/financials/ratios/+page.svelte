<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import FinancialSection from "$lib/components/Financial/FinancialSection.svelte";

  export let data;

  const formatCopy = (
    template: string,
    values: Record<"company" | "ticker", string>,
  ) =>
    template
      .replaceAll("{company}", values.company)
      .replaceAll("{ticker}", values.ticker);

  $: ticker = data?.financialRatiosTicker ?? "";
  $: company = data?.companyName ?? ticker;
  $: copyValues = { company, ticker };
  $: ratiosI18n = data?.financialRatiosI18n;
  $: seo = ratiosI18n?.seo;
</script>

{#if seo}
  <SEO
    title={formatCopy(seo.title, copyValues)}
    description={formatCopy(seo.description, copyValues)}
    keywords={formatCopy(seo.keywords, copyValues)}
    structuredData={{
      "@context": "https://schema.org",
      "@type": ["FinancialProduct", "WebPage", "AnalysisNewsArticle"],
      inLanguage: data?.financialRatiosLanguage,
      name: formatCopy(seo.name, copyValues),
      headline: formatCopy(seo.headline, copyValues),
      description: formatCopy(seo.structuredDescription, copyValues),
      url: data?.financialRatiosUrls?.ratios,
      author: {
        "@type": "Organization",
        name: "Stocknear",
        url: "https://stocknear.com",
      },
      publisher: {
        "@type": "Organization",
        name: "Stocknear",
        url: "https://stocknear.com",
        logo: {
          "@type": "ImageObject",
          url: "https://stocknear.com/favicon.png",
        },
      },
      mainEntity: {
        "@type": "Corporation",
        name: company,
        tickerSymbol: ticker,
      },
      about: {
        "@type": "Thing",
        name: seo.aboutName,
        description: seo.aboutDescription,
      },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: seo.home,
            item: data?.financialRatiosUrls?.home,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: seo.stocks,
            item: data?.financialRatiosUrls?.stocks,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${company} (${ticker})`,
            item: data?.financialRatiosUrls?.stock,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: seo.financialStatements,
            item: data?.financialRatiosUrls?.financials,
          },
          {
            "@type": "ListItem",
            position: 5,
            name: seo.financialRatios,
            item: data?.financialRatiosUrls?.ratios,
          },
        ],
      },
    }}
  />
{/if}

<FinancialSection
  {data}
  title={ratiosI18n?.sectionTitle ?? ""}
  statementType="ratios"
  statementConfig={ratiosI18n?.statementConfig ?? []}
  enableFavorites
  favoriteStorageKey="financial_ratios"
/>
