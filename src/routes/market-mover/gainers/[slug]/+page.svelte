<script lang="ts">
    import { page } from "$app/stores";
    import Table from "$lib/components/Table/Table.svelte";
    import { displayTitle, displayDate } from "$lib/store";
    import SEO from "$lib/components/SEO.svelte";
    import {
        market_mover_gainers_period_seo_description,
        market_mover_gainers_period_seo_keywords,
        market_mover_gainers_period_seo_title,
        market_mover_gainers_period_structured_about_description,
        market_mover_gainers_period_structured_about_name,
        market_mover_gainers_period_structured_description,
        market_mover_gainers_period_structured_main_description,
        market_mover_gainers_period_structured_main_name,
        market_mover_gainers_period_structured_name,
        market_mover_period_desc_3y,
        market_mover_period_desc_5y,
        market_mover_period_desc_month,
        market_mover_period_desc_week,
        market_mover_period_desc_year,
        market_mover_period_label_3y,
        market_mover_period_label_5y,
        market_mover_period_label_month,
        market_mover_period_label_week,
        market_mover_period_label_year,
    } from "$lib/paraglide/messages.js";

    export let data;

    let rawData = [];
    // Define mapping of slug to internal key
    const timePeriodMap = {
        week: "1W",
        month: "1M",
        year: "1Y",
        "3Y": "3Y",
        "5Y": "5Y",
    };

    // Table display options
    let excludedRules = new Set([
        "volume",
        "price",
        "changesPercentage",
        "eps",
        "marketCap",
    ]);

    let defaultList = [
        { name: "Market Cap", rule: "marketCap" },
        { name: "Price", rule: "price" },
        { name: "% Change", rule: "changesPercentage" },
        { name: "Volume", rule: "volume" },
    ];
    let currentSlug = "";
    let seoTitle = "";
    let seoDescription = "";
    let seoKeywords = "";
    let structuredData = {};

    $: periodLabelMap = {
        week: market_mover_period_label_week(),
        month: market_mover_period_label_month(),
        year: market_mover_period_label_year(),
        "3Y": market_mover_period_label_3y(),
        "5Y": market_mover_period_label_5y(),
    };

    $: periodDescMap = {
        week: market_mover_period_desc_week(),
        month: market_mover_period_desc_month(),
        year: market_mover_period_desc_year(),
        "3Y": market_mover_period_desc_3y(),
        "5Y": market_mover_period_desc_5y(),
    };

    $: {
        if ($page?.url?.pathname) {
            // Extract last part of the URL path
            const path = $page?.url?.pathname;
            const lastSegment = path.split("/").filter(Boolean).pop(); // e.g., "1M"
            currentSlug = lastSegment;

            // Resolve the time key
            const timeKey = timePeriodMap[lastSegment]; // fallback to "week"
            rawData = data?.getMarketMover[timeKey];

            const periodLabel = periodLabelMap[lastSegment] ?? market_mover_period_label_week();
            const periodDesc = periodDescMap[lastSegment] ?? market_mover_period_desc_week();

            seoTitle = market_mover_gainers_period_seo_title({ period: periodLabel });
            seoDescription = market_mover_gainers_period_seo_description({ period: periodDesc });
            seoKeywords = market_mover_gainers_period_seo_keywords({ period: periodLabel });

            structuredData = {
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                name: market_mover_gainers_period_structured_name({ period: periodLabel }),
                description: market_mover_gainers_period_structured_description({ period: periodDesc }),
                url: `https://stocknear.com/market-mover/gainers/${lastSegment}`,
                mainEntity: {
                    "@type": "ItemList",
                    name: market_mover_gainers_period_structured_main_name({ period: periodLabel }),
                    description: market_mover_gainers_period_structured_main_description({ period: periodLabel }),
                },
                about: {
                    "@type": "Thing",
                    name: market_mover_gainers_period_structured_about_name(),
                    description: market_mover_gainers_period_structured_about_description({ period: periodDesc }),
                },
            };
        }
    }
</script>

{#key $page?.url?.pathname}
    <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        {structuredData}
    />
    <div class="w-full">
        <Table
            {data}
            {rawData}
            {excludedRules}
            {defaultList}
            title={$displayTitle}
            date={$displayDate}
        />
    </div>
{/key}
