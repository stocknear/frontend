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

            seoTitle = `Top Stock Losers ${period.display} - Worst Performing Stocks`;
            seoDescription = `Track the top stock losers with highest percentage declines over the ${period.desc}. Monitor historical declining stocks, worst performers, and negative market trends.`;

            structuredData = {
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                name: `Top Stock Losers - ${period.display}`,
                description: `Historical list of worst performing stocks with highest percentage losses over the ${period.desc}`,
                url: `https://stocknear.com/market-mover/losers/${lastSegment}`,
                mainEntity: {
                    "@type": "ItemList",
                    name: `Top Stock Losers ${period.display}`,
                    description: `${period.display} worst performing stocks by percentage decrease`,
                },
                about: {
                    "@type": "Thing",
                    name: "Historical Stock Losers",
                    description: `Stocks with highest percentage price decreases over ${period.desc}`,
                },
            };
        }
    }
</script>

{#key $page?.url?.pathname}
    <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={`stock losers ${currentSlug}, top losers ${currentSlug}, worst performing stocks ${currentSlug}, declining stocks ${currentSlug}, stock declines ${currentSlug}, percentage losses ${currentSlug}, historical stock performance`}
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
