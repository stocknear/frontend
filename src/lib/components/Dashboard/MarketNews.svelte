<script lang="ts">
    import Infobox from "$lib/components/Infobox.svelte";
    import { formatDate } from "$lib/utils";

    export let wiim = [];
</script>

<section class="mx-auto lg:col-span-2 w-full text-gray-700 dark:text-zinc-200">
    <a
        href="/news-flow/"
        class="inline-flex items-center gap-1 text-left w-full text-gray-900 dark:text-white group"
        ><h2
            class="mb-2 text-lg sm:text-xl font-semibold tracking-tight sm:group-hover:underline sm:group-hover:underline-offset-4"
        >
            News Flow
        </h2>
        <svg
            class="h-5 w-5 text-gray-400 dark:text-zinc-500 transition group-hover:text-gray-700 dark:group-hover:text-zinc-200"
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
            class="w-full border-t border-gray-200/70 dark:border-zinc-800/80 text-sm sm:text-[0.95rem]"
        >
            <tbody>
                {#each wiim as item}
                    <tr class="border-b border-gray-200/70 dark:border-zinc-800/80"
                        ><td
                            class="hidden sm:inline-block pr-2 pt-3 align-top text-xs whitespace-nowrap font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500"
                            >{formatDate(item?.date, true)}
                        </td>
                        <td class="py-3 sm:pl-2 leading-6 text-gray-700 dark:text-zinc-200">
                            <span class="sm:hidden text-xs uppercase tracking-wide text-gray-400 dark:text-zinc-500 font-semibold"
                                >{formatDate(item?.date, true)} ago -
                            </span>
                            {item?.text}

                            {#if item?.symbolList && item?.symbolList?.length > 0}
                                {#each item?.symbolList as symbol}
                                    <a
                                        href={`/${item?.assetType}/${symbol}`}
                                        class="inline-flex items-center rounded-full border border-blue-200/80 dark:border-blue-500/40 bg-blue-50/80 dark:bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 transition hover:text-blue-800 dark:hover:text-blue-200 ml-1.5 mb-1"
                                        >{symbol}</a
                                    >
                                {/each}
                            {:else if item?.symbol}
                                <a
                                    href={`/${item?.assetType}/${item?.symbol}`}
                                    class="inline-flex items-center rounded-full border border-blue-200/80 dark:border-blue-500/40 bg-blue-50/80 dark:bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 transition hover:text-blue-800 dark:hover:text-blue-200 ml-1.5"
                                    >{item?.symbol}</a
                                >
                            {/if}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {:else}
        <Infobox text="There are no major stock market news available yet." />
    {/if}
</section>
