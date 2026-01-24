<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
    common_home,
    list_category_stock_lists,
    list_highest_iv_rank_infobox,
    list_highest_iv_rank_main_description,
    list_highest_iv_rank_main_name,
    list_highest_iv_rank_seo_description,
    list_highest_iv_rank_seo_keywords,
    list_highest_iv_rank_seo_title,
    list_highest_iv_rank_structured_description,
    list_highest_iv_rank_structured_name,
  } from "$lib/paraglide/messages.js";

  export let data;

  const defaultList = [
    { name: "Total OI", rule: "totalOI" },
    { name: "Change OI", rule: "changeOI" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "IV Rank", rule: "ivRank" },
    { name: "Total Prem", rule: "totalPrem" },
  ];

  const excludedRules = new Set([
    "volume",
    "price",
    "changesPercentage",
    "revenue",
    "eps",
    "changeOI",
    "totalOI",
    "totalPrem",
    "ivRank",
  ]);
</script>

<SEO
  title={list_highest_iv_rank_seo_title()}
  description={list_highest_iv_rank_seo_description()}
  keywords={list_highest_iv_rank_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: list_highest_iv_rank_structured_name(),
    description: list_highest_iv_rank_structured_description(),
    url: "https://stocknear.com/list/highest-option-iv-rank",
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
          name: list_highest_iv_rank_structured_name(),
          item: "https://stocknear.com/list/highest-option-iv-rank",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: list_highest_iv_rank_main_name(),
      description: list_highest_iv_rank_main_description(),
      numberOfItems: data?.getData?.length || 0,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox text={list_highest_iv_rank_infobox()} />

  <!-- Page wrapper -->
  <Table {data} rawData={data?.getData} {excludedRules} {defaultList} />
</section>
