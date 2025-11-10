<script lang="ts">
    import Infobox from "$lib/components/Infobox.svelte";
    import { formatDate } from "$lib/utils";

    export let wiim = [];
</script>

<section class="mx-auto lg:col-span-2 w-full">
    <a href="/news-flow/" class="inline-flex items-center text-left w-full"
        ><h2
            class="mb-2 text-xl font-bold leading-tight bp:text-2xl bp:leading-tight sm:hover:underline sm:hover:underline-offset-4"
        >
            News Flow
        </h2>
        <svg
            class="h-5 w-5"
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
            class="border-t border-gray-300 dark:border-gray-800 text-sm sm:text-[1rem]"
        >
            <tbody>
                {#each wiim as item}
                    <tr class="border-b border-gray-300 dark:border-gray-800"
                        ><td
                            class="hidden sm:inline-block pr-1 pt-2 align-top text-sm whitespace-nowrap font-bold"
                            >{formatDate(item?.date, true)}
                        </td>
                        <td class="py-2 pl-2">
                            <span class="sm:hidden font-semibold"
                                >{formatDate(item?.date, true)} ago -
                            </span>
                            {item?.text}

                            {#if item?.symbolList && item?.symbolList?.length > 0}
                                {#each item?.symbolList as symbol}
                                    <a
                                        href={`/${item?.assetType}/${symbol}`}
                                        class="inline-block rounded badge border border-gray-300 dark:border-gray-800 shadow duration-0 bg-blue-100 dark:bg-primary font-semibold dark:font-normal rounded-sm ml-1 mb-1 px-2 m-auto text-blue-800 dark:text-blue-400 dark:sm:hover:text-white sm:hover:text-muted"
                                        >{symbol}</a
                                    >
                                {/each}
                            {:else if item?.symbol}
                                <a
                                    href={`/${item?.assetType}/${item?.symbol}`}
                                    class="inline-block rounded badge border border-gray-300 dark:border-gray-800 shadow duration-0 bg-blue-100 dark:bg-primary font-semibold dark:font-normal rounded-sm ml-1 px-2 m-auto text-blue-800 dark:text-blue-400 dark:sm:hover:text-white sm:hover:text-muted"
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
