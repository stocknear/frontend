<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import AnalystInfo from "$lib/components/AnalystInfo.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import * as m from "$lib/paraglide/messages";

  export let data;

  const rawData = data?.getTopAnalystStocks;
  const excludedRules = new Set([
    "topAnalystUpside",
    "topAnalystPriceTarget",
    "topAnalystCounter",
    "marketCap",
    "topAnalystRating",
  ]);

  const defaultList = [
    { name: "Top Analyst Count", rule: "topAnalystCounter" },
    { name: "Top Analyst PT Upside", rule: "topAnalystUpside" },
    { name: "Top Analyst Price Target", rule: "topAnalystPriceTarget" },
    { name: "Top Analyst Rating", rule: "topAnalystRating" },
    { name: "Market Cap", rule: "marketCap" },
  ];
  const hideLastRow = true;
</script>

<SEO
  title={m.analysts_top_stocks_seo_title()}
  description={m.analysts_top_stocks_seo_description()}
  keywords={m.analysts_top_stocks_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Top Analyst Strong Buy Stocks",
    description:
      "Strong Buy stock recommendations from top-performing Wall Street analysts",
    url: "https://stocknear.com/analysts/top-stocks",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Analysts",
          item: "https://stocknear.com/analysts",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Top Analyst Stocks",
          item: "https://stocknear.com/analysts/top-stocks",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Top Analyst Strong Buy Stock List",
      description:
        "List of Strong Buy stocks recommended by top-performing Wall Street analysts",
      numberOfItems: rawData?.length || 0,
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3"
>
  <BreadCrumb containerClass="text-sm sm:text-[1rem] breadcrumbs">
    <li>
      <a
        href="/"
        class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >{m.analysts_breadcrumb_home()}</a
      >
    </li>
    <li class="text-muted dark:text-gray-300">{m.analysts_top_stocks_breadcrumb()}</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:pr-5">
          <div class="mb-6 border-[#2C6288] dark:border-white border-b-[2px]">
            <h1 class="mb-3 text-2xl sm:text-3xl font-bold">
              {m.analysts_top_stocks_title()}
            </h1>
          </div>

          <Infobox
            text={m.analysts_top_stocks_infobox()}
          />

          <div class="w-full m-auto">
            <Table
              {data}
              {rawData}
              {defaultList}
              {excludedRules}
              {hideLastRow}
              title={m.analysts_top_stocks_count({ count: rawData?.length })}
            />
          </div>
          <UpgradeToPro {data} />
          <AnalystInfo />
        </main>
      </div>
    </div>
  </div>
</section>
