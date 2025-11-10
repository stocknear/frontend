<script lang="ts">
  import Infobox from "$lib/components/Infobox.svelte";
  import { abbreviateNumber } from "$lib/utils";

  export let optionsFlowList;
</script>

<section>
  <a href="/options-flow" class="inline-flex items-center"
    ><h2
      class="mb-2 text-xl font-bold leading-tight bp:text-2xl bp:leading-tight sm:hover:underline sm:hover:underline-offset-4"
    >
      Unusual Options Orders
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
  {#if optionsFlowList?.length > 0}
    <table class="w-full text-sm sm:text-[1rem]">
      <thead
        ><tr
          ><th
            class="border border-gray-300 dark:border-gray-800 px-2 py-1.5 text-left"
            >Symbol</th
          >
          <th
            class="border border-gray-300 dark:border-gray-800 px-2 py-1.5 text-left"
            >Type</th
          >
          <th
            class="border border-gray-300 dark:border-gray-800 px-2 py-1.5 text-left"
            >Prem</th
          >
          <th
            class="border border-gray-300 dark:border-gray-800 px-2 py-1.5 text-left"
            >Strike</th
          ></tr
        ></thead
      >
      <tbody>
        {#each optionsFlowList as item}
          <tr
            ><td
              class="whitespace-nowrap border border-gray-300 dark:border-gray-800 px-2 py-1.5 text-left"
              ><a
                href={`/${item?.underlying_type === "stock" ? "stocks" : "etf"}/${item?.ticker}/options/unusual-activity`}
                class="text-blue-800 dark:text-blue-400 dark:sm:hover:text-white sm:hover:text-muted cursor-pointer"
                >{item?.ticker}</a
              ></td
            >
            <td
              class="border border-gray-300 dark:border-gray-800 px-2 py-1.5 text-left"
            >
              {#if item?.put_call === "Calls"}
                <span class="text-green-800 dark:text-[#00FC50]"
                  >{item?.put_call}</span
                >
              {:else}
                <span class="text-red-800 dark:text-[#FF2F1F]"
                  >{item?.put_call}
                </span>
              {/if}
            </td>
            <td
              class="border border-gray-300 dark:border-gray-800 px-2 py-1.5 text-left"
            >
              ${abbreviateNumber(item?.cost_basis)}</td
            >
            <td
              class="border border-gray-300 dark:border-gray-800 px-2 py-1.5 text-left"
              >${item?.strike_price}</td
            >
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <Infobox text="Currently, no unusual options flow data available." />
  {/if}
</section>
