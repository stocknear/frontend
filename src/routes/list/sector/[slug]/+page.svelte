<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
    common_home,
    list_category_stock_lists,
    list_count_stocks,
    list_label_total_market_cap,
    list_label_total_revenue,
    list_label_total_stocks,
    list_sector_breadcrumb_label,
    list_sector_infobox,
    list_sector_main_description,
    list_sector_main_name,
    list_sector_seo_description,
    list_sector_seo_keywords,
    list_sector_seo_title,
    list_sector_structured_description,
    list_sector_structured_name,
  } from "$lib/paraglide/messages.js";

  export let data;

  let rawData = data?.getSectorCategory;

  let totalMarketCap = rawData?.reduce(
    (total, stock) => total + stock?.marketCap,
    0,
  );
  let totalRevenue = rawData?.reduce(
    (total, stock) => total + stock?.revenue,
    0,
  );

  $: sectorName = data?.getParams ?? "";
  $: formattedSector = sectorName
    ?.split(" ")
    ?.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    ?.join(" ");
  $: sectorSlug = sectorName?.toLowerCase()?.replace(/\s+/g, "-");
</script>

<SEO
  title={list_sector_seo_title({ sector: formattedSector })}
  description={list_sector_seo_description({
    sector: sectorName,
    count: rawData?.length?.toLocaleString("en-US") ?? "0",
    marketCap: abbreviateNumber(totalMarketCap),
    revenue: abbreviateNumber(totalRevenue),
  })}
  keywords={list_sector_seo_keywords({ sector: sectorName?.toLowerCase() })}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: list_sector_structured_name({ sector: sectorName }),
    description: list_sector_structured_description({ sector: sectorName }),
    url: `https://stocknear.com/list/sector/${sectorSlug}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: common_home(),
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: list_category_stock_lists(),
          item: "https://stocknear.com/list",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: list_sector_breadcrumb_label(),
          item: "https://stocknear.com/list/sector",
        },
        {
          "@type": "ListItem",
          position: 4,
          name: sectorName,
          item: `https://stocknear.com/list/sector/${sectorSlug}`,
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: list_sector_main_name({ sector: sectorName }),
      description: list_sector_main_description({ sector: sectorName }),
      numberOfItems: rawData?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text={list_sector_infobox({
      sector: sectorName,
      count: rawData?.length?.toLocaleString("en-US") ?? "0",
      marketCap: abbreviateNumber(totalMarketCap),
      revenue: abbreviateNumber(totalRevenue),
    })}
  />

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
    rawData={data?.getSectorCategory}
    title={list_count_stocks({
      count: data?.getSectorCategory?.length?.toLocaleString("en-US") ?? "0",
    })}
  />
</section>
