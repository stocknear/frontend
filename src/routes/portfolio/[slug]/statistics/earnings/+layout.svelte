<script lang="ts">
    import { stockTicker } from "$lib/store";
    import { page } from "$app/stores";
    import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";

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
                        class="mb-5 sm:mb-0 sm:ml-4 pt-1 text-sm sm:text-[1rem] whitespace-nowrap overflow-x-auto whitespace-nowrap"
                    >
                        <ul class="flex flex-row items-center w-full">
                            <a
                                href={`/stocks/${$stockTicker}/statistics/earnings`}
                                on:click={() => changeSubSection("surprise")}
                                class="p-2 px-5 cursor-pointer {displaySubSection ===
                                'surprise'
                                    ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                                    : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                            >
                                Surprise
                            </a>

                            <a
                                href={`/stocks/${$stockTicker}/statistics/earnings/price-reaction`}
                                on:click={() =>
                                    changeSubSection("price-reaction")}
                                class="p-2 px-5 cursor-pointer {displaySubSection ===
                                'price-reaction'
                                    ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                                    : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                            >
                                Price Reaction
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
                                class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
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
                                            Pro Subscription
                                        </h2>
                                    </div>
                                    <span class=" p-3 sm:ml-3 sm:mr-3 -mt-4">
                                        Upgrade now for unlimited access to all
                                        data, tools and no ads.
                                    </span>
                                </a>
                            </div>
                        {/if}

                        <div
                            class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4"
                        >
                            <h3 class="p-2 pt-4 text-xl font-semibold">
                                Earnings Surprise
                            </h3>
                            <div class="p-2">
                                Earnings Surprise occurs when a company’s
                                reported earnings per share (EPS) differ from
                                analysts’ expectations. A positive surprise
                                (better than expected) often drives the stock
                                price higher, while a negative surprise (worse
                                than expected) can lead to declines.
                            </div>

                            <div class="px-2">
                                <a
                                    href="/learning-center/article/leverage-earnings-releases-to-your-advantage"
                                    class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-3 text-[1rem] text-center font-semibold text-white dark:text-black m-auto sm:hover:bg-muted dark:sm:hover:bg-gray-300 bg-black dark:bg-[#fff] transition duration-100"
                                >
                                    More Information
                                </a>
                            </div>
                        </div>

                        {#if similarStocks?.length > 0}
                            <div
                                class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4"
                            >
                                <h3 class="p-2 pt-4 text-xl font-semibold">
                                    Related Stocks
                                </h3>
                                <table
                                    class="table table-sm table-compact w-full"
                                >
                                    <thead class="text-muted dark:text-white"
                                        ><tr
                                            ><th
                                                class="whitespace-nowrap border-b border-gray-300 dark:border-gray-600 font-semibold text-[1rem] text-left px-2"
                                                >Company</th
                                            >
                                            <th
                                                class="whitespace-nowrap border-b border-gray-300 dark:border-gray-600 font-semibold text-[1rem] text-right px-2"
                                                >EPS Est Growth YoY</th
                                            ></tr
                                        ></thead
                                    >
                                    <tbody>
                                        {#each similarStocks?.slice(0, 8) as item, index}
                                            {#if item?.name}
                                                <tr
                                                    class="border-gray-300 dark:border-gray-600 text-[1rem] {index !==
                                                    similarStocks?.slice(0, 8)
                                                        ?.length -
                                                        1
                                                        ? 'border-b'
                                                        : ''}"
                                                    ><td
                                                        class="text-left text-[1rem] px-2"
                                                        ><a
                                                            href={`/stocks/${item?.symbol}/statistics/short-interest`}
                                                            class="text-blue-800 sm:hover:text-muted dark:sm:hover:text-white dark:text-blue-400"
                                                            >{removeCompanyStrings(
                                                                item?.name,
                                                            )}</a
                                                        ></td
                                                    >
                                                    <td
                                                        class="text-right cursor-normal text-[1rem] px-2 {item?.earningsEPSGrowthEst >
                                                        0
                                                            ? "before:content-['+'] text-green-800 dark:text-green-400"
                                                            : item?.earningsEPSGrowthEst <
                                                                0
                                                              ? 'text-red-800 dark:text-red-400'
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
