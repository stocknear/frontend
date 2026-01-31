<script lang="ts">
    import { stockTicker } from "$lib/store";
    import { page } from "$app/stores";
    import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
    import {
        stock_detail_company,
        stock_detail_stats_earnings_surprise,
        stock_detail_stats_earnings_surprise_desc,
        stock_detail_stats_more_information,
        stock_detail_stats_price_reaction,
        stock_detail_stats_pro_subscription,
        stock_detail_stats_related_stocks,
        stock_detail_stats_surprise,
        stock_detail_stats_upgrade_desc,
    } from "$lib/paraglide/messages";

    export let data;
    const similarStocks = data?.getSimilarStocks;

    let displaySubSection = "surprise";

    function changeSubSection(state) {
        const subSectionMap = {
            strike: "/statistics/earnings",
            expiry: "/statistics/earnings/price-reaction",
        };

        if (state !== "surprise" && subSectionMap[state]) {
            displaySubSection = state;
            //goto(`/stocks/${$stockTicker}${subSectionMap[state]}`);
        } else {
            displaySubSection = state;
            //goto(`/stocks/${$stockTicker}/statistics`);
        }
    }

    $: {
        if ($page?.url?.pathname) {
            const parts = $page?.url?.pathname.split("/");
            const sectionMap = {
                surprise: "surprise",
                "price-reaction": "price-reaction",
            };

            const foundSection = parts?.find((part) =>
                Object?.values(sectionMap)?.includes(part),
            );

            displaySubSection =
                Object?.keys(sectionMap)?.find(
                    (key) => sectionMap[key] === foundSection,
                ) || "surprise";
        }
    }
</script>

<section class="w-full overflow-hidden">
    <div class="w-full overflow-hidden m-auto">
        <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
            <div
                class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
            >
                <main
                    class="w-full {displaySubSection !== 'price-reaction'
                        ? 'lg:w-3/4 lg:pr-10'
                        : ''}"
                >
                    <nav
                        class="mb-5 sm:mb-0 sm:ml-4 sm:pt-2 text-sm whitespace-nowrap overflow-x-auto border-b border-gray-300 dark:border-zinc-700"
                    >
                        <ul
                            class="flex flex-row items-center w-full gap-1 pb-2 text-sm sm:text-base"
                        >
                            <a
                                href={`/stocks/${$stockTicker}/statistics/earnings`}
                                on:click={() => changeSubSection("surprise")}
                                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                                'surprise'
                                    ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                                    : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                            >
                                {stock_detail_stats_surprise()}
                            </a>

                            <a
                                href={`/stocks/${$stockTicker}/statistics/earnings/price-reaction`}
                                on:click={() =>
                                    changeSubSection("price-reaction")}
                                class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                                'price-reaction'
                                    ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                                    : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                            >
                                {stock_detail_stats_price_reaction()}
                            </a>
                        </ul>
                    </nav>
                    <div class="mt-2 sm:mt-0">
                        <slot />
                    </div>
                </main>
                {#if displaySubSection !== "price-reaction"}
                    <aside class="inline-block relative w-full lg:w-1/4 mt-3">
                        {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
                            <div
                                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
                            >
                                <a
                                    href="/pricing"
                                    class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
                                >
                                    <div
                                        class="w-full flex justify-between items-center p-3 mt-3"
                                    >
                                        <h2
                                            class="text-start text-xl font-semibold sm:ml-3"
                                        >
                                            {stock_detail_stats_pro_subscription()}
                                        </h2>
                                    </div>
                                    <span class=" p-3 sm:ml-3 sm:mr-3 -mt-4">
                                        {stock_detail_stats_upgrade_desc()}
                                    </span>
                                </a>
                            </div>
                        {/if}

                        <div
                            class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
                        >
                            <h3 class="p-2 pt-4 text-xl font-semibold">
                                {stock_detail_stats_earnings_surprise()}
                            </h3>
                            <div class="p-2">
                                {stock_detail_stats_earnings_surprise_desc()}
                            </div>

                            <div class="px-2">
                                <a
                                    href="/learning-center/article/leverage-earnings-releases-to-your-advantage"
                                    class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-3 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
                                >
                                    {stock_detail_stats_more_information()}
                                </a>
                            </div>
                        </div>

                        {#if similarStocks?.length > 0}
                            <div
                                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4"
                            >
                                <h3 class="p-2 pt-4 text-xl font-semibold">
                                    {stock_detail_stats_related_stocks()}
                                </h3>
                                <table
                                    class="table table-sm table-compact w-full text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
                                >
                                    <thead
                                        class="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                                        ><tr
                                            ><th
                                                class="whitespace-nowrap border-b border-gray-300 dark:border-zinc-700 text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400 font-semibold text-left px-2"
                                                >{stock_detail_company()}</th
                                            >
                                            <th
                                                class="whitespace-nowrap border-b border-gray-300 dark:border-zinc-700 text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400 font-semibold text-right px-2"
                                                >EPS Est Growth YoY</th
                                            ></tr
                                        ></thead
                                    >
                                    <tbody>
                                        {#each similarStocks?.slice(0, 8) as item, index}
                                            {#if item?.name}
                                                <tr
                                                    class="border-gray-300 dark:border-zinc-700 text-sm {index !==
                                                    similarStocks?.slice(0, 8)
                                                        ?.length -
                                                        1
                                                        ? 'border-b'
                                                        : ''}"
                                                    ><td
                                                        class="text-left text-sm px-2"
                                                        ><a
                                                            href={`/stocks/${item?.symbol}/statistics/short-interest`}
                                                            class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                                                            >{removeCompanyStrings(
                                                                item?.name,
                                                            )}</a
                                                        ></td
                                                    >
                                                    <td
                                                        class="text-right cursor-normal text-sm px-2 {item?.earningsEPSGrowthEst >
                                                        0
                                                            ? "before:content-['+'] text-emerald-800 dark:text-emerald-400"
                                                            : item?.earningsEPSGrowthEst <
                                                                0
                                                              ? 'text-rose-800 dark:text-rose-400'
                                                              : ''}"
                                                        >{item?.earningsEPSGrowthEst
                                                            ? item?.earningsEPSGrowthEst?.toFixed(
                                                                  2,
                                                              ) + "%"
                                                            : "n/a"}</td
                                                    >
                                                </tr>
                                            {/if}
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        {/if}
                    </aside>
                {/if}
            </div>
        </div>
    </div>
</section>
