<script lang="ts">
  import * as m from "$lib/paraglide/messages";

  export let blogData;
</script>

<h2 class="text-xl sm:text-3xl font-bold mt-8 mb-5">
  {m.blog_heading_earnings_impact()}
</h2>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <div
    class="eps-beats-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
  >
    <div class=" text-sm mb-2 flex items-center">
      <span>{m.blog_price_eps_beats()}</span>
    </div>
    <div class="flex items-baseline">
      <span class="text-xl font-bold"
        >{blogData?.data?.positiveEpsPercent}%</span
      >
      <div class="flex flex-col ml-2">
        <span class="text-sm">
          {m.blog_price_quarters({
            positive: blogData?.data?.positiveEpsSurprises,
            total: blogData?.data?.totalReports,
          })}
        </span>
        <span class="text-xs text-violet-700 dark:text-violet-400">
          {blogData?.data?.positiveEpsSurprises >
          blogData?.data?.totalReports / 2
            ? m.blog_price_above_average()
            : m.blog_price_below_average()}
        </span>
      </div>
    </div>
  </div>

  <div
    class="revenue-beats-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
  >
    <div class=" text-sm mb-2 flex items-center">
      <span>{m.blog_price_revenue_beats()}</span>
    </div>
    <div class="flex items-baseline">
      <span class="text-xl font-bold"
        >{blogData?.data?.positiveRevenuePercent}%</span
      >
      <div class="flex flex-col ml-2">
        <span class="text-sm">
          {m.blog_price_quarters({
            positive: blogData?.data?.positiveRevenueSurprises,
            total: blogData?.data?.totalReports,
          })}
        </span>
        <span class="text-xs text-down">
          {blogData?.data?.positiveRevenueSurprises >
          blogData?.data?.totalReports / 2
            ? m.blog_price_above_average()
            : m.blog_price_below_average()}
        </span>
      </div>
    </div>
  </div>

  <div
    class="avg-price-impact-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
  >
    <div class=" text-sm mb-2 flex items-center">
      <span>{m.blog_price_avg_impact()}</span>
    </div>
    <div class="flex items-baseline">
      <span class="text-xl font-bold"
        >{blogData?.data?.avgPriceImpact >= 0 ? "+" : ""}{blogData?.data
          ?.avgPriceImpact}%</span
      >
      <div class="flex flex-col ml-2">
        <span class="text-sm">{m.blog_price_next_day()}</span>
        <span
          class="text-xs text-{blogData?.data?.avgPriceImpact >= 0
            ? 'green'
            : 'red'}-400"
        >
          {blogData?.data?.avgPriceImpact >= 0
            ? m.blog_price_positive_trend()
            : m.blog_price_negative_trend()}
        </span>
      </div>
    </div>
  </div>

  <div
    class="volatility-impact-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
  >
    <div class=" text-sm mb-2 flex items-center">
      <span>{m.blog_price_volatility_impact()}</span>
    </div>
    <div class="flex items-baseline">
      <span class="text-xl font-bold">±{blogData?.data?.volatilityImpact}%</span
      >
      <div class="flex flex-col ml-2">
        <span class="text-sm">{m.blog_price_range()}</span>
        <span class="text-xs text-yellow-700 dark:text-yellow-400">
          {Number(blogData?.data?.volatilityImpact) > 3
            ? m.blog_price_high_impact()
            : m.blog_price_normal_impact()}
        </span>
      </div>
    </div>
  </div>
</div>

{@html blogData?.text}
