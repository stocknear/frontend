<script lang="ts">
    import { onMount } from "svelte";

    import { screenWidth } from "$lib/store";
    import { isPWAInstalled } from "$lib/utils";
    import { closedPWA } from "$lib/store";
    import SEO from "$lib/components/SEO.svelte";
    import MarketMover from "$lib/components/Dashboard/MarketMover.svelte";
    import UpcomingEarnings from "$lib/components/Dashboard/UpcomingEarnings.svelte";
    import OptionsFlow from "$lib/components/Dashboard/OptionsFlow.svelte";
    import MarketNews from "$lib/components/Dashboard/MarketNews.svelte";
    import AnalystReport from "$lib/components/Dashboard/AnalystReport.svelte";
    import MiniPlot from "$lib/components/Plot/MiniPlot.svelte";
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
    let pwaInstalled = false;
    let AppInstalled = null;

    function getClosedPWA() {
        //if user closed the banner
        const item = localStorage.getItem("closePWA");
        if (!item) return null;

        const { value, expires } = JSON.parse(item);
        if (new Date() > new Date(expires)) {
            localStorage.removeItem("closePWA"); // Remove expired item
            return null;
        }
        return value;
    }

    onMount(async () => {
        pwaInstalled = isPWAInstalled();

        if (!pwaInstalled) {
            try {
                $closedPWA = getClosedPWA();

                if (!$closedPWA) {
                    // Dynamically import the AppInstalled component
                    AppInstalled = (
                        await import("$lib/components/AppInstalled.svelte")
                    ).default;
                }
            } catch (e) {
                console.error("Error loading AppInstalled component:", e);
            }
        }
    });

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

<div class="w-full max-w-8xl overflow-hidden m-auto min-h-screen mb-16">
    {#if AppInstalled && !$closedPWA}
        <svelte:component this={AppInstalled} />
    {/if}

    <main id="main">
        <div
            class="border-b border-gray-100/80 dark:border-zinc-700 px-4 pt-8 sm:pt-12 pb-24"
        >
            <!--
            <div class="flex justify-center mb-5 whitespace-nowrap">
                <div class=" flex justify-center lg:mb-3">
                    <a href="/cash-secured-put-screener"
                        ><div
                            class="flex items-center justify-center sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                        >
                            <div class="text-lg sm:text-xl font-semibold">
                                Cash Secured Put Screener
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
            <div class="mx-auto max-w-3xl text-center">
                <h1
                    class="mb-3 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:mb-5 sm:text-4xl lg:mb-6 lg:text-[42px]"
                >
                    {home_hero_title()}
                </h1>
                <p
                    class="text-sm text-gray-800 dark:text-zinc-300 sm:text-base md:text-lg lg:text-xl lg:leading-8"
                >
                    {home_hero_subtitle()}
                </p>
            </div>
        </div>

        <div>
            <div class="mb-4 flex justify-center px-2 sm:px-4">
                <div
                    class="-mt-16 grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4 w-full max-w-[400px] sm:max-w-[600px] md:max-w-[700px] lg:max-w-[1150px]"
                >
                    {#each Object.keys(plotData) as symbol}
                        <a
                            href="/etf/{symbol}"
                            class="block shadow-sm rounded overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-[#121214] border border-gray-300 shadow dark:border-gray-700"
                        >
                            <MiniPlot plotData={plotData[symbol]} {symbol} />
                        </a>
                    {/each}
                </div>
            </div>
        </div>
        <div class="mb-8 pb-3 pt-6 md:pt-8 lg:pt-10">
            <MarketMover
                {gainersList}
                {losersList}
                {marketStatus}
                {charNumber}
            />

            <div
                class="mx-auto flex flex-col px-3 pt-6 xs:px-4 sm:px-5 md:pt-8 lg:grid lg:max-w-[1200px] lg:grid-cols-3 lg:justify-evenly lg:gap-8 lg:pt-10"
            >
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
