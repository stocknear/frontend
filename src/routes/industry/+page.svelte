<script lang="ts">
  import { screenWidth } from "$lib/store";
  import IndustryTable from "$lib/components/IndustryTable.svelte";
  import { industryList, sectorList, sectorNavigation } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import {
    common_home,
    industry_infobox_text,
    industry_sector_label,
    industry_seo_description,
    industry_seo_keywords,
    industry_seo_title,
    industry_structured_breadcrumb_label,
    industry_structured_description,
    industry_structured_main_entity_description,
    industry_structured_main_entity_name,
    industry_structured_name,
  } from "$lib/paraglide/messages.js";

  export let data;
  let rawData = data?.getSectorIndustryOverview;

  $: charNumber = $screenWidth < 640 ? 20 : 30;
</script>

<SEO
  title={industry_seo_title()}
  description={industry_seo_description({
    sectorCount: sectorList?.length ?? 0,
    industryCount: industryList?.length ?? 0,
  })}
  keywords={industry_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: industry_structured_name(),
    description: industry_structured_description(),
    url: "https://stocknear.com/industry",
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
          name: industry_structured_breadcrumb_label(),
          item: "https://stocknear.com/industry",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: industry_structured_main_entity_name(),
      description: industry_structured_main_entity_description(),
      numberOfItems: sectorList?.length + industryList?.length,
    },
  }}
/>

<section class="w-full overflow-hidden m-auto">
  <Infobox
    text={industry_infobox_text({
      sectorCount: sectorList?.length ?? 0,
      industryCount: industryList?.length ?? 0,
    })}
  />

  <!-- Page wrapper -->
  <div class="flex justify-center w-full m-auto h-full overflow-hidden">
    <!-- Content area -->
    <div class="w-full">
      {#each sectorList as sector}
        <div class="mt-4">
          <a
            href={sectorNavigation?.find((item) => item?.title === sector)
              ?.link}
            class="cursor-pointer font-semibold tracking-tight text-base sm:text-lg text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition"
          >
            {industry_sector_label({ sector })}
            <svg
              class="inline-block h-6 w-6 -mt-1"
              viewBox="0 0 20 20"
              fill="currentColor"
              style="max-width:40px"
              ><path
                fill-rule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clip-rule="evenodd"
              ></path></svg>

          </a>
        </div>

        <div class="border-t border-gray-300 dark:border-zinc-700 mt-5" />

        <IndustryTable {charNumber} industryList={rawData[sector]} />
        <div class="border-t border-gray-300 dark:border-zinc-700 mt-5" />
      {/each}
    </div>
  </div>
</section>
