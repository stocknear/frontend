<script lang="ts">
    import { onMount } from "svelte";
    import { screenWidth } from "$lib/store";
    import SEO from "$lib/components/SEO.svelte";
    import MarketMover from "$lib/components/Dashboard/MarketMover.svelte";
    import UpcomingEarnings from "$lib/components/Dashboard/UpcomingEarnings.svelte";
    import OptionsFlow from "$lib/components/Dashboard/OptionsFlow.svelte";
    import MarketNews from "$lib/components/Dashboard/MarketNews.svelte";
    import AnalystReport from "$lib/components/Dashboard/AnalystReport.svelte";
    import MiniPlot from "$lib/components/Plot/MiniPlot.svelte";
    import PromoBanner from "$lib/components/PromoBanner.svelte";

    import {
        home_hero_subtitle,
        home_hero_title,
        home_seo_description,
        home_seo_keywords,
        home_seo_title,
        home_structured_description,
        home_structured_feature_dark_pool_monitoring,
        home_structured_feature_earnings_volatility,
        home_structured_feature_implied_volatility,
        home_structured_feature_live_options_flow,
        home_structured_feature_market_catalysts,
        home_structured_feature_options_chain,
        home_structured_feature_unusual_options_activity,
        home_structured_name,
    } from "$lib/paraglide/messages.js";

    export let data;
    export let form;

    let gainersList = data?.getDashboard?.gainers || [];
    let losersList = data?.getDashboard?.losers || [];
    let marketStatus = data?.getDashboard?.marketStatus ?? 0;
    let plotData = data?.getDashboard?.plotData || {};

    let wiim = data?.getDashboard?.wiim || [];
    let optionsFlowList = data?.getDashboard?.optionsFlow || [];
    let upcomingEarnings = data?.getDashboard?.upcomingEarnings || [];
    let analystReport = data?.getDashboard?.analystReport || {};

    $: charNumber = $screenWidth < 640 ? 20 : 30;
</script>

<SEO
    title={home_seo_title()}
    description={home_seo_description()}
    keywords={home_seo_keywords()}
    structuredData={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: home_structured_name(),
        description: home_structured_description(),
        url: "https://stocknear.com",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Any",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
        },
        featureList: [
            home_structured_feature_live_options_flow(),
            home_structured_feature_unusual_options_activity(),
            home_structured_feature_dark_pool_monitoring(),
            home_structured_feature_implied_volatility(),
            home_structured_feature_options_chain(),
            home_structured_feature_earnings_volatility(),
            home_structured_feature_market_catalysts(),
        ],
        provider: {
            "@type": "Organization",
            name: home_structured_name(),
            url: "https://stocknear.com",
        },
    }}
/>

<!-- `max-w-8xl` does not exist in Tailwind v4, so this shell had no max width at
     all and ran 2228px wide at 2560px. `page-shell` is the one content frame. -->
<div class="page-shell overflow-hidden min-h-screen mb-16">
    <main id="main">
        <!-- The border-b used to be drawn straight through the index cards: pb-24
             minus the grid's -mt-16 put the rule 64px below the card tops. Both
             magic numbers are gone along with the border. -->
        <div class="pt-8 sm:pt-12 pb-8">
            <PromoBanner user={data?.user} />

            <!--
            <div class="flex justify-center mb-5 whitespace-nowrap">
                <div class=" flex justify-center lg:mb-3">
                    <a href="/stocks/AMD/statistics/earnings"
                        ><div
                            class="flex items-center justify-center font-medium text-fg transition-colors hover:text-accent transition"
                        >
                            <div class="text-lg sm:text-xl font-semibold">
                                Earnings Guidance
                            </div>
                            <div
                                class="-mt-2 ml-1 -rotate-6 rounded-[3px] bg-red-500 px-1 py-0.5 text-xs font-semibold text-white"
                            >
                                New
                            </div>
                        </div></a
                    >
                </div>
            </div>
            -->

            <div class="mx-auto max-w-2xl text-center">
                <h1 class="type-display mb-4 text-fg">
                    {home_hero_title()}
                </h1>
                <p class="type-body text-fg-muted sm:text-base">
                    {home_hero_subtitle()}
                </p>
            </div>
        </div>

        <!-- Full width, so this row shares its left edge with everything below.
             It used to be max-w-[1150px] against the content grid's 1200px,
             which put the cards 5px right of the tables beneath them. -->
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {#each Object.keys(plotData) as symbol}
                <a
                    href="/etf/{symbol}"
                    class="block overflow-hidden rounded-container border border-line bg-surface-card transition-colors hover:border-line-strong"
                >
                    <MiniPlot plotData={plotData[symbol]} {symbol} />
                </a>
            {/each}
        </div>
        <!-- One section rhythm (48px) instead of six different gaps. -->
        <div class="pt-12">
            <MarketMover {gainersList} {losersList} {marketStatus} />

            <div class="flex flex-col pt-12 lg:grid lg:grid-cols-3 lg:gap-8">
                <MarketNews {wiim} />

                <div class="flex flex-col space-y-6 pt-6 lg:space-y-8 lg:pt-0">
                    <AnalystReport {analystReport} />

                    <UpcomingEarnings {upcomingEarnings} />
                    <OptionsFlow {optionsFlowList} />
                </div>
            </div>
        </div>
    </main>
</div>

<style>
    .scrollbar {
        display: grid;
        grid-gap: 90px;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        grid-auto-flow: column;
        overflow-x: auto;
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;
    }

    .scrollbar::-webkit-scrollbar {
        width: 0;
        height: 0;
    }

    .scrollbar::-webkit-scrollbar-thumb {
        background: transparent;
    }

    .stroke-text {
        font-size: 56px;
        font-weight: bold;
        color: transparent;
        -webkit-text-stroke: 1px #cbd5e1;
    }
</style>
