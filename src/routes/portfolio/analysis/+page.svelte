<script lang="ts">
    import Fundamentals from "$lib/components/Portfolio/Fundamentals.svelte";
    import BullvsBear from "$lib/components/Portfolio/BullvsBear.svelte";
    import Diversification from "$lib/components/Portfolio/Diversification.svelte";
    import SEO from "$lib/components/SEO.svelte";
    import {
  portfolio_analysis_seo_description,
  portfolio_analysis_seo_keywords,
  portfolio_analysis_seo_title,
  portfolio_analysis_structured_description,
  portfolio_analysis_structured_name,
  portfolio_analysis_vs_market_description,
  portfolio_analysis_vs_market_title,
  portfolio_breadcrumb_analysis,
  portfolio_breadcrumb_home,
  portfolio_breadcrumb_portfolio,
} from "$lib/paraglide/messages";

    export let data;

    $: analysisData = data?.analysisData;
    $: portfolioData = data?.portfolioData || [];
    $: displayPortfolio = data?.displayPortfolio;
    $: portfolioId = displayPortfolio?.id || "";

    // Bull and Bear case data
    $: bullBearData = analysisData?.bullBear || null;

    // Fundamentals data by category
    $: valuationData = analysisData?.valuation || null;
    $: growthData = analysisData?.growth || null;
    $: efficiencyData = analysisData?.efficiency || null;
    $: marginsData = analysisData?.margins || null;

    // Diversification data (with sector and industry from backend)
    $: diversificationData = analysisData?.diversification || [];
</script>

<SEO
    title={portfolio_analysis_seo_title()}
    description={portfolio_analysis_seo_description()}
    keywords={portfolio_analysis_seo_keywords()}
    canonical="https://stocknear.com/portfolio/analysis"
    openGraph={{
        type: "website",
        url: "https://stocknear.com/portfolio/analysis",
        title: portfolio_analysis_seo_title(),
        description: portfolio_analysis_seo_description(),
    }}
    twitter={{
        card: "summary",
        title: portfolio_analysis_seo_title(),
        description: portfolio_analysis_seo_description(),
    }}
    structuredData={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: portfolio_analysis_structured_name(),
        alternateName: portfolio_analysis_structured_name(),
        description: portfolio_analysis_structured_description(),
        url: "https://stocknear.com/portfolio/analysis",
        isAccessibleForFree: true,
        inLanguage: "en",
        operatingSystem: "Web",
        applicationCategory: "FinanceApplication",
        brand: {
            "@type": "Brand",
            name: "Stocknear",
            url: "https://stocknear.com",
        },
        publisher: {
            "@type": "Organization",
            name: "Stocknear",
            url: "https://stocknear.com",
        },
        featureList: [
            "AI-powered bull and bear analysis",
            "Portfolio valuation metrics",
            "Growth analysis",
            "Efficiency ratios",
            "Profit margin analysis",
            "Sector and industry diversification",
            "Market benchmark comparison",
        ],
        breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
                {
                    "@type": "ListItem",
                    position: 1,
                    name: portfolio_breadcrumb_home(),
                    item: "https://stocknear.com",
                },
                {
                    "@type": "ListItem",
                    position: 2,
                    name: portfolio_breadcrumb_portfolio(),
                    item: "https://stocknear.com/portfolio",
                },
                {
                    "@type": "ListItem",
                    position: 3,
                    name: portfolio_breadcrumb_analysis(),
                    item: "https://stocknear.com/portfolio/analysis",
                },
            ],
        },
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
        },
        mainEntityOfPage: "https://stocknear.com/portfolio/analysis",
    }}
/>

<div class="mx-auto w-full space-y-8 mt-5">
    <!-- Portfolio AI Summary Section -->
    <BullvsBear
        data={{ user: data?.user, bullBear: bullBearData }}
        tickers={portfolioData}
        {portfolioId}
        showAnalyzeButton={true}
    />

    <!--Fundamentals section-->
    <div class="w-full m-auto mt-10">
        <h2
            class="mb-2 text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white w-fit"
        >
            {portfolio_analysis_vs_market_title()}
        </h2>
        <p class="mb-4 text-sm text-gray-800 dark:text-zinc-300 max-w-3xl">
            {portfolio_analysis_vs_market_description()}
        </p>

        <Fundamentals title="Valuation" data={valuationData} />
        <Fundamentals title="Growth" data={growthData} />
        <Fundamentals title="Efficiency" data={efficiencyData} />
        <Fundamentals title="Margins" data={marginsData} />
    </div>

    <!-- Diversification Section -->
    <Diversification data={diversificationData} />
</div>
