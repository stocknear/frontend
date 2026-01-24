<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import {
    common_home,
    list_category_dividend_aristocrats,
    list_category_dividend_kings,
    list_category_large_cap_stocks,
    list_category_mega_cap_stocks,
    list_category_micro_cap_stocks,
    list_category_mid_cap_stocks,
    list_category_nano_cap_stocks,
    list_category_small_cap_stocks,
    list_category_stock_lists,
    list_category_stocks_pay_monthly_dividends,
    list_category_top_rated_dividend_stocks,
    list_index_all_reits,
    list_index_all_spacs,
    list_index_biggest_buybacks,
    list_index_bitcoin_etfs,
    list_index_category_ai,
    list_index_category_augmented_reality,
    list_index_category_car_companies,
    list_index_category_clean_energy,
    list_index_category_electric_vehicles,
    list_index_category_esports,
    list_index_category_gaming,
    list_index_category_metaverse,
    list_index_category_mobile_games,
    list_index_category_online_dating,
    list_index_category_online_gambling,
    list_index_category_pharmaceuticals,
    list_index_category_social_media,
    list_index_category_sports_betting,
    list_index_category_virtual_reality,
    list_index_companies_highest_call_volume,
    list_index_companies_highest_iv_rank,
    list_index_companies_highest_oi,
    list_index_companies_highest_oi_change,
    list_index_companies_highest_premium,
    list_index_companies_highest_put_volume,
    list_index_country_canada,
    list_index_country_china,
    list_index_country_germany,
    list_index_country_india,
    list_index_country_israel,
    list_index_country_japan,
    list_index_country_uk,
    list_index_crypto_etfs,
    list_index_etf_providers,
    list_index_faang,
    list_index_listed_on_amex,
    list_index_listed_on_dow_jones,
    list_index_listed_on_nasdaq,
    list_index_listed_on_nasdaq_100,
    list_index_listed_on_nyse,
    list_index_listed_on_sp500,
    list_index_magnificent_seven,
    list_index_most_active_options_by_contract,
    list_index_most_shorted_stocks,
    list_index_new_launches,
    list_index_option_contracts_highest_oi,
    list_index_overbought_stocks,
    list_index_oversold_stocks,
    list_index_penny_stocks,
    list_index_us_companies_highest_taxes,
    list_index_us_companies_most_employees,
    list_index_us_companies_most_ftd,
    list_index_us_companies_most_revenue,
    list_index_ethereum_etfs,
    list_index_covered_call_etfs,
    list_index_monthly_dividend_etfs,
    list_section_category_ranked_by_market_cap,
    list_section_dividend_lists,
    list_section_etf_lists,
    list_section_exchange_groups,
    list_section_index_groups,
    list_section_non_us_listed,
    list_section_options_lists,
    list_section_other_lists,
    list_section_market_cap_groups,
    list_section_popular_lists,
    list_section_sector_groups,
    list_index_sector_financials,
    list_index_sector_healthcare,
    list_index_sector_technology,
    list_index_sector_industrials,
    list_index_sector_energy,
    list_index_sector_utilities,
    list_index_sector_consumer_cyclical,
    list_index_sector_real_estate,
    list_index_sector_basic_materials,
    list_index_sector_communication_services,
    list_index_sector_consumer_defensive,
    list_seo_description,
    list_seo_keywords,
    list_seo_title,
    list_structured_description,
    list_structured_main_description,
    list_structured_main_name,
    list_structured_name,
  } from "$lib/paraglide/messages.js";
</script>

<SEO
  title={list_seo_title()}
  description={list_seo_description()}
  keywords={list_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: list_structured_name(),
    description:
      list_structured_description(),
    url: "https://stocknear.com/list",
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
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: list_structured_main_name(),
      description: list_structured_main_description(),
      numberOfItems: 50,
    },
  }}
/>

<!--Start Market Cap Group-->

<section class="w-full overflow-hidden m-auto text-gray-700 dark:text-zinc-200">
  <div class="mt-5">
    <h2
      class="mb-2 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white"
    >
      {list_section_popular_lists()}
    </h2>
    <ul
      class="list-outside list-disc space-y-2 pl-5 text-sm sm:text-[0.95rem] text-gray-800 dark:text-zinc-300 md:columns-2 md:gap-x-10"
    >
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/highest-revenue">{list_index_us_companies_most_revenue()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/highest-income-tax"
          >{list_index_us_companies_highest_taxes()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/most-employees">{list_index_us_companies_most_employees()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/most-ftd-shares"
          >{list_index_us_companies_most_ftd()}</a
        >
      </li>
    </ul>
  </div>

  <div>
    <h2
      class="mb-2 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white pt-10"
    >
      {list_section_market_cap_groups()}
    </h2>
    <ul
      class="list-outside list-disc space-y-2 pl-5 text-sm sm:text-[0.95rem] text-gray-800 dark:text-zinc-300 md:columns-2 md:gap-x-10"
    >
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/market-cap/mega-cap-stocks">{list_category_mega_cap_stocks()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/market-cap/large-cap-stocks">{list_category_large_cap_stocks()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/market-cap/mid-cap-stocks">{list_category_mid_cap_stocks()}</a
        >
      </li>
      <li class="">
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/market-cap/small-cap-stocks">{list_category_small_cap_stocks()}</a
        >
      </li>
      <li class="">
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/market-cap/micro-cap-stocks">{list_category_micro_cap_stocks()}</a
        >
      </li>
      <li class="">
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/market-cap/nano-cap-stocks">{list_category_nano_cap_stocks()}</a
        >
      </li>
    </ul>
  </div>

  <div>
    <h2
      class="mb-2 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white pt-10"
    >
      {list_section_dividend_lists()}
    </h2>
    <ul
      class="list-outside list-disc space-y-2 pl-5 text-sm sm:text-[0.95rem] text-gray-800 dark:text-zinc-300 md:columns-2 md:gap-x-10"
    >
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/top-rated-dividend-stocks">{list_category_top_rated_dividend_stocks()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/monthly-dividend-stocks"
          >{list_category_stocks_pay_monthly_dividends()}</a
        >
      </li>

      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/dividend/dividend-kings">{list_category_dividend_kings()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/dividend/dividend-aristocrats">{list_category_dividend_aristocrats()}</a
        >
      </li>
    </ul>
  </div>
  <!--End Market Cap Group-->

  <div>
    <h2
      class="mb-2 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white pt-10"
    >
      {list_section_exchange_groups()}
    </h2>
    <ul
      class="list-outside list-disc space-y-2 pl-5 text-sm sm:text-[0.95rem] text-gray-800 dark:text-zinc-300 md:columns-2 md:gap-x-10"
    >
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/exchange/nasdaq">{list_index_listed_on_nasdaq()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/exchange/nyse">{list_index_listed_on_nyse()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/exchange/amex">{list_index_listed_on_amex()}</a
        >
      </li>
    </ul>
  </div>

  <!--Start Index Group-->

  <div>
    <h2
      class="mb-2 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white pt-10"
    >
      {list_section_index_groups()}
    </h2>
    <ul
      class="list-outside list-disc space-y-2 pl-5 text-sm sm:text-[0.95rem] text-gray-800 dark:text-zinc-300 md:columns-2 md:gap-x-10"
    >
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/index/dowjones">{list_index_listed_on_dow_jones()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/index/nasdaq100">{list_index_listed_on_nasdaq_100()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/index/sp500">{list_index_listed_on_sp500()}</a
        >
      </li>
    </ul>
  </div>

  <!--End Index Group-->

  <div>
    <h2
      class="mb-2 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white pt-10"
    >
      {list_section_options_lists()}
    </h2>
    <ul
      class="list-outside list-disc space-y-2 pl-5 text-sm sm:text-[0.95rem] text-gray-800 dark:text-zinc-300 md:columns-2 md:gap-x-10"
    >
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/highest-open-interest">{list_index_companies_highest_oi()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/highest-open-interest-change"
          >{list_index_companies_highest_oi_change()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/highest-option-iv-rank">{list_index_companies_highest_iv_rank()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/highest-option-premium">{list_index_companies_highest_premium()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/highest-call-volume">{list_index_companies_highest_call_volume()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/highest-put-volume">{list_index_companies_highest_put_volume()}</a
        >
      </li>

      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/highest-open-interest-by-contract"
          >{list_index_option_contracts_highest_oi()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/highest-volume-by-contract"
          >{list_index_most_active_options_by_contract()}</a
        >
      </li>
    </ul>
  </div>

  <!--Start Other Lists-->
  <div>
    <h2
      class="mb-2 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white pt-10"
    >
      {list_section_other_lists()}
    </h2>
    <ul
      class="list-outside list-disc space-y-2 pl-5 text-sm sm:text-[0.95rem] text-gray-800 dark:text-zinc-300 md:columns-2 md:gap-x-10"
    >
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/faang">{list_index_faang()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/magnificent-seven">{list_index_magnificent_seven()}</a
        >
      </li>

      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/penny-stocks">{list_index_penny_stocks()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/most-shorted-stocks">{list_index_most_shorted_stocks()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/oversold-stocks/">{list_index_oversold_stocks()}</a
        >
      </li>

      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/overbought-stocks/">{list_index_overbought_stocks()}</a
        >
      </li>

      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/most-buybacks/">{list_index_biggest_buybacks()}</a
        >
      </li>

      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/reit-stocks">{list_index_all_reits()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/spacs-stocks">{list_index_all_spacs()}</a
        >
      </li>
    </ul>
  </div>

  <!--Start ETF Lists-->

  <div>
    <h2
      class="mb-2 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white pt-10"
    >
      {list_section_etf_lists()}
    </h2>
    <ul
      class="list-outside list-disc space-y-2 pl-5 text-sm sm:text-[0.95rem] text-gray-800 dark:text-zinc-300 md:columns-2 md:gap-x-10"
    >
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/etf/new-launches">{list_index_new_launches()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/etf/etf-providers">{list_index_etf_providers()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/bitcoin-etfs">{list_index_bitcoin_etfs()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/ethereum-etfs">{list_index_ethereum_etfs()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/crypto-etfs">{list_index_crypto_etfs()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/covered-call-etfs">{list_index_covered_call_etfs()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/monthly-dividend-etfs">{list_index_monthly_dividend_etfs()}</a
        >
      </li>
    </ul>
  </div>

  <div>
    <h2
      class="mb-2 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white pt-10"
    >
      {list_section_category_ranked_by_market_cap()}
    </h2>
    <ul
      class="list-outside list-disc space-y-2 pl-5 text-sm sm:text-[0.95rem] text-gray-800 dark:text-zinc-300 md:columns-2 md:gap-x-10"
    >
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/mobile-games/">{list_index_category_mobile_games()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/social-media-stocks/">{list_index_category_social_media()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/clean-energy/">{list_index_category_clean_energy()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/esports/">{list_index_category_esports()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/car-company-stocks/">{list_index_category_car_companies()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/ai-stocks/">{list_index_category_ai()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/electric-vehicles/">{list_index_category_electric_vehicles()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/online-gambling/">{list_index_category_online_gambling()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/augmented-reality/">{list_index_category_augmented_reality()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/gaming-stocks/">{list_index_category_gaming()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/pharmaceutical-stocks/">{list_index_category_pharmaceuticals()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/online-dating/">{list_index_category_online_dating()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/virtual-reality/">{list_index_category_virtual_reality()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/sports-betting/">{list_index_category_sports_betting()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/metaverse/">{list_index_category_metaverse()}</a
        >
      </li>
    </ul>
  </div>

  <!--Start Non-US Stocks Listed on US Exchanges-->
  <div>
    <h2
      class="mb-2 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white pt-10"
    >
      {list_section_non_us_listed()}
    </h2>
    <ul
      class="list-outside list-disc space-y-2 pl-5 text-sm sm:text-[0.95rem] text-gray-800 dark:text-zinc-300 md:columns-2 md:gap-x-10"
    >
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/country/ca">{list_index_country_canada()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/country/cn">{list_index_country_china()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/country/in">{list_index_country_india()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/country/jp">{list_index_country_japan()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/country/de">{list_index_country_germany()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/country/il">{list_index_country_israel()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/country/gb">{list_index_country_uk()}</a
        >
      </li>
    </ul>
  </div>

  <!--End Non-US Stocks Listed on US Exchanges-->

  <!--Start Sector Group-->
  <div>
    <h2
      class="mb-2 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white pt-10"
    >
      {list_section_sector_groups()}
    </h2>
    <ul
      class="list-outside list-disc space-y-2 pl-5 text-sm sm:text-[0.95rem] text-gray-800 dark:text-zinc-300 md:columns-2 md:gap-x-10"
    >
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/sector/financial">{list_index_sector_financials()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/sector/healthcare">{list_index_sector_healthcare()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/sector/technology">{list_index_sector_technology()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/sector/industrials">{list_index_sector_industrials()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/sector/energy">{list_index_sector_energy()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/sector/utilities">{list_index_sector_utilities()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/sector/consumer-cyclical">{list_index_sector_consumer_cyclical()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/sector/real-estate">{list_index_sector_real_estate()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/sector/basic-materials">{list_index_sector_basic_materials()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/sector/communication-services">{list_index_sector_communication_services()}</a
        >
      </li>
      <li>
        <a
          class="text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          href="/list/sector/consumer-defensive">{list_index_sector_consumer_defensive()}</a
        >
      </li>
    </ul>
  </div>

  <!--End Sector Group-->
</section>
