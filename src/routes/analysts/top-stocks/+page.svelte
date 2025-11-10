<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import AnalystInfo from "$lib/components/AnalystInfo.svelte";

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
  title="Top Analyst Strong Buy Stocks - Best Stock Picks from 5-Star Analysts"
  description="Discover the top Strong Buy stocks recommended by the best-performing Wall Street analysts with 4+ star ratings. Find high-conviction stock picks with strong upside potential and exceptional analyst accuracy."
  keywords="top analyst strong buy stocks, best analyst stock picks, strong buy recommendations, 5 star analyst stocks, top-rated analyst picks, high conviction stock picks, Wall Street best buys, analyst strong buy list"
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
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
      <li class="text-muted dark:text-gray-300">Top Analyst Stocks</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:pr-5">
          <div class="mb-6 border-[#2C6288] dark:border-white border-b-[2px]">
            <h1 class="mb-3 text-2xl sm:text-3xl font-bold">
              Top Strong Buy Stocks
            </h1>
          </div>

          <Infobox
            text={"Strong Buy stocks by top-rated analysts with a star rating of 4 or above, known for their exceptional accuracy and returns. Stocks are ranked based on the volume of analyst ratings."}
          />

          <div class="w-full m-auto">
            <Table
              {data}
              {rawData}
              {defaultList}
              {excludedRules}
              {hideLastRow}
              title={`Top ${rawData?.length} Stocks`}
            />
          </div>
          <UpgradeToPro {data} />
          <AnalystInfo />
        </main>
      </div>
    </div>
  </div>
</section>
