<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import { page } from "$app/stores";
  import {
    list_count_stocks,
    list_label_total_market_cap,
    list_label_total_revenue,
    list_label_total_stocks,
    list_slug_ai_info,
    list_slug_ai_title,
    list_slug_augmented_reality_title,
    list_slug_faang_description,
    list_slug_faang_info,
    list_slug_faang_title,
    list_slug_gaming_info,
    list_slug_gaming_title,
    list_slug_magnificent_seven_description,
    list_slug_magnificent_seven_info,
    list_slug_magnificent_seven_title,
    list_slug_metaverse_description,
    list_slug_metaverse_info,
    list_slug_metaverse_title,
    list_slug_online_dating_title,
    list_slug_online_gambling_title,
    list_slug_pharmaceutical_description,
    list_slug_pharmaceutical_title,
    list_slug_sports_betting_title,
    list_slug_virtual_reality_title,
  } from "$lib/paraglide/messages.js";

  export let data;
  let rawData = data?.getData;

  let totalMarketCap =
    rawData?.reduce((total, stock) => total + stock?.marketCap, 0) ?? 0;
  let totalRevenue =
    rawData?.reduce((total, stock) => total + stock?.revenue, 0) ?? 0;

  const navigation = [
    {
      title: list_slug_faang_title,
      description: list_slug_faang_description,
      info: list_slug_faang_info,
      link: "/list/faang",
    },
    {
      title: list_slug_magnificent_seven_title,
      description: list_slug_magnificent_seven_description,
      info: list_slug_magnificent_seven_info,
      link: "/list/magnificent-seven",
    },
    {
      title: list_slug_ai_title,
      description: () => "",
      info: list_slug_ai_info,
      link: "/list/ai-stocks",
    },
    {
      title: list_slug_augmented_reality_title,
      description: () => "",
      info: () => "",
      link: "/list/augmented-reality",
    },
    {
      title: list_slug_augmented_reality_title,
      description: () => "",
      info: () => "",
      link: "/list/augmented-reality",
    },
    {
      title: list_slug_gaming_title,
      description: () => "",
      info: list_slug_gaming_info,
      link: "/list/gaming-stocks",
    },
    {
      title: list_slug_pharmaceutical_title,
      description: list_slug_pharmaceutical_description,
      info: () => "",
      link: "/list/pharmaceutical-stocks",
    },
    {
      title: list_slug_online_dating_title,
      description: () => "",
      info: () => "",
      link: "/list/online-dating",
    },
    {
      title: list_slug_virtual_reality_title,
      description: () => "",
      info: () => "",
      link: "/list/virtual-reality",
    },
    {
      title: list_slug_online_gambling_title,
      description: () => "",
      info: () => "",
      link: "/list/online-gambling",
    },
    {
      title: list_slug_sports_betting_title,
      description: () => "",
      info: () => "",
      link: "/list/sports-betting",
    },
    {
      title: list_slug_metaverse_title,
      description: list_slug_metaverse_description,
      info: list_slug_metaverse_info,
      link: "/list/metaverse",
    },
  ];

  // Using the reactive statement to update currentNavigation based on the current page URL
  $: currentNavigation = navigation?.find(
    (cat) => $page.url.pathname === cat?.link,
  );
  $: currentTitle = currentNavigation?.title ? currentNavigation.title() : "";
  $: currentDescription = currentNavigation?.description
    ? currentNavigation.description()
    : "";
  $: currentInfo = currentNavigation?.info ? currentNavigation.info() : "";
</script>

<SEO
  title={currentTitle}
  description={currentDescription}
/>

<section class="w-full overflow-hidden m-auto">
  {#if currentInfo}
    <Infobox text={currentInfo} />
  {/if}

  <div
    class="mt-6 mb-4 grid grid-cols-1 sm:grid-cols-3 overflow-hidden rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/60 dark:bg-zinc-950/40 divide-y divide-gray-200/70 dark:divide-zinc-800/80 sm:divide-x sm:divide-y-0"
  >
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div
          class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
        >
          {list_label_total_stocks()}
        </div>
        <div
          class="mt-1 break-words text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
        >
          {new Intl.NumberFormat("en")?.format(rawData?.length)}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div
          class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
        >
          {list_label_total_market_cap()}
        </div>
        <div
          class="mt-1 break-words text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
        >
          {abbreviateNumber(totalMarketCap)}
        </div>
      </div>
    </div>
    <div class="px-4 py-3 sm:px-2 sm:py-5 md:px-3 lg:p-6">
      <div class="flex items-center justify-between sm:block">
        <div
          class="text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
        >
          {list_label_total_revenue()}
        </div>
        <div
          class="mt-1 break-words text-lg sm:text-xl font-semibold text-gray-900 dark:text-white tabular-nums"
        >
          {abbreviateNumber(totalRevenue)}
        </div>
      </div>
    </div>
  </div>

  <Table
    {data}
    rawData={data?.getData}
    title={list_count_stocks({
      count: data?.getData?.length?.toLocaleString("en-US") ?? "0",
    })}
  />
</section>
