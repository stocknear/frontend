<script lang="ts">
    import Infobox from "$lib/components/Infobox.svelte";
    import { formatDate } from "$lib/utils";
    import {
        dashboard_news_flow_empty,
        dashboard_news_flow_title,
        dashboard_time_ago,
    } from "$lib/paraglide/messages.js";

    export let wiim = [];
</script>

<section class="mx-auto lg:col-span-2 w-full text-gray-700 dark:text-zinc-200">
    <a
        href="/news-flow/"
        class="inline-flex items-center gap-1 text-left w-full text-gray-900 dark:text-white group"
        ><h2
            class="mb-2 text-lg sm:text-xl font-semibold tracking-tight sm:group-hover:underline sm:group-hover:underline-offset-4"
        >
            {dashboard_news_flow_title()}
        </h2>
        <svg
            class="h-5 w-5 text-gray-800 dark:text-zinc-300 transition group-hover:text-gray-700 dark:group-hover:text-zinc-200"
            viewBox="0 0 20 20"
            fill="currentColor"
            style="max-width:40px"
            aria-hidden="true"
            ><path
                fill-rule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clip-rule="evenodd"
            ></path></svg
        ></a
    >

    {#if wiim?.length > 0}
        <table
            class="w-full border-t border-gray-300 dark:border-zinc-700 text-sm sm:text-[0.95rem]"
        >
            <tbody>
                {#each wiim as item}
                    <tr class="border-b border-gray-300 dark:border-zinc-700"
                        ><td
                            class="hidden sm:inline-block pr-2 pt-4 align-top text-xs whitespace-nowrap font-semibold uppercase tracking-wide text-gray-800 dark:text-zinc-300"
                            >{formatDate(item?.date, true)}
                        </td>
                        <td
                            class="py-3 sm:pl-2 leading-6 text-gray-700 dark:text-zinc-200"
                        >
                            <span
                            class="sm:hidden text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300 font-semibold"
                                >{dashboard_time_ago({
                                    time: formatDate(item?.date, true),
                                })} -
                            </span>
                            {item?.text}

                            {#if item?.symbolList && item?.symbolList?.length > 0}
                                {#each item?.symbolList as symbol}
                                    <a
                                        href={`/${item?.assetType}/${symbol}`}
                                        class="inline-flex items-center rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 px-2 py-0.5 text-xs font-semibold text-violet-800 dark:text-violet-400 transition sm:hover:text-muted dark:sm:hover:text-white ml-1.5 mb-1"
                                        >{symbol}</a
                                    >
                                {/each}
                            {:else if item?.symbol}
                                <a
                                    href={`/${item?.assetType}/${item?.symbol}`}
                                    class="inline-flex items-center rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 px-2 py-0.5 text-xs font-semibold text-violet-800 dark:text-violet-400 transition sm:hover:text-muted dark:sm:hover:text-white ml-1.5"
                                    >{item?.symbol}</a
                                >
                            {/if}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {:else}
        <Infobox text={dashboard_news_flow_empty()} />
    {/if}
</section>
