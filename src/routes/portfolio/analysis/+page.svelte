<script lang="ts">
    import Fundamentals from "$lib/components/Portfolio/Fundamentals.svelte";
    import BullvsBear from "$lib/components/Portfolio/BullvsBear.svelte";
    import Diversification from "$lib/components/Portfolio/Diversification.svelte";
    import SEO from "$lib/components/SEO.svelte";

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
    title="Portfolio Analysis - AI Insights, Fundamentals & Diversification"
    description="Get AI-powered bull/bear analysis, valuation metrics, growth insights, and diversification breakdown for your stock portfolio. Compare your holdings against market benchmarks."
    keywords="portfolio analysis, AI portfolio insights, bull bear analysis, portfolio valuation, growth metrics, portfolio diversification, investment analysis, portfolio fundamentals, stock analysis, market benchmarks"
    canonical="https://stocknear.com/portfolio/analysis"
    openGraph={{
        type: "website",
        url: "https://stocknear.com/portfolio/analysis",
        title: "Portfolio Analysis - AI Insights & Fundamentals",
        description:
            "AI-powered portfolio analysis with bull/bear insights, valuation, growth, efficiency, margins, and diversification breakdown.",
    }}
    twitter={{
        card: "summary",
        title: "Portfolio Analysis - AI Insights & Fundamentals",
        description:
            "AI-powered portfolio analysis with bull/bear insights, valuation, growth, efficiency, margins, and diversification breakdown.",
    }}
    structuredData={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Portfolio Analysis",
        alternateName: "Stock Portfolio Analysis Tool",
        description:
            "Comprehensive portfolio analysis tool with AI-powered bull/bear insights, valuation metrics, growth analysis, efficiency ratios, and diversification breakdown.",
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
                    name: "Home",
                    item: "https://stocknear.com",
                },
                {
                    "@type": "ListItem",
                    position: 2,
                    name: "Portfolio",
                    item: "https://stocknear.com/portfolio",
                },
                {
                    "@type": "ListItem",
                    position: 3,
                    name: "Analysis",
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

<section
    class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pt-5 pb-40 text-gray-700 dark:text-zinc-200"
>
    <div class="mx-auto w-full space-y-8">
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
                Portfolio vs US Market
            </h2>
            <p class="mb-4 text-sm text-gray-800 dark:text-zinc-300 max-w-3xl">
                Shows your portfolio's weighted-average Valuation, Growth,
                Efficiency and Margins compared to US market benchmarks -
                revealing if your holdings are expensive/cheap,
                growing/shrinking, efficient and profitable vs the broader
                market.
            </p>

            <Fundamentals title="Valuation" data={valuationData} />
            <Fundamentals title="Growth" data={growthData} />
            <Fundamentals title="Efficiency" data={efficiencyData} />
            <Fundamentals title="Margins" data={marginsData} />
        </div>

        <!-- Diversification Section -->
        <Diversification data={diversificationData} />
    </div>
</section>
