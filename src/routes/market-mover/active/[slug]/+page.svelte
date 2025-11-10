<script lang="ts">
    import { page } from "$app/stores";
    import Table from "$lib/components/Table/Table.svelte";
    import { displayTitle, displayDate } from "$lib/store";
    import SEO from "$lib/components/SEO.svelte";

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
    let structuredData = {};

    $: {
        if ($page?.url?.pathname) {
            // Extract last part of the URL path
            const path = $page?.url?.pathname;
            const lastSegment = path.split("/").filter(Boolean).pop(); // e.g., "1M"
            currentSlug = lastSegment;

            // Resolve the time key
            const timeKey = timePeriodMap[lastSegment]; // fallback to "week"
            rawData = data?.getMarketMover[timeKey];

            // Dynamic SEO based on time period
            const periodMap = {
                week: { display: "Weekly", desc: "past week" },
                month: { display: "Monthly", desc: "past month" },
                year: { display: "Yearly", desc: "past year" },
                "3Y": { display: "3-Year", desc: "past 3 years" },
                "5Y": { display: "5-Year", desc: "past 5 years" },
            };

            const period = periodMap[lastSegment] || {
                display: "Weekly",
                desc: "past week",
            };

            seoTitle = `Most Active Stocks ${period.display} - High Volume Trading History`;
            seoDescription = `Discover the most actively traded stocks by volume over the ${period.desc}. Track historical high-volume securities, market activity trends, and trading patterns.`;

            structuredData = {
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                name: `Most Active Stocks - ${period.display}`,
                description: `Historical list of most actively traded stocks by volume over the ${period.desc}`,
                url: `https://stocknear.com/market-mover/active/${lastSegment}`,
                mainEntity: {
                    "@type": "ItemList",
                    name: `Most Active Stocks ${period.display}`,
                    description: `${period.display} most actively traded stocks by volume`,
                },
                about: {
                    "@type": "Thing",
                    name: "Historical Active Stock Trading",
                    description: `Stock market securities with highest trading volume over ${period.desc}`,
                },
            };
        }
    }
</script>

{#key $page?.url?.pathname}
    <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={`most active stocks ${currentSlug}, high volume stocks ${currentSlug}, active trading history, stock volume ${currentSlug}, historical market activity, most traded stocks ${currentSlug}, volume analysis ${currentSlug}`}
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
