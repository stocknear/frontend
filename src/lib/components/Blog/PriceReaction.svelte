<script lang="ts">
  export let blogData;
</script>

<h2 class="text-xl sm:text-3xl font-bold mt-8 mb-5">
  Earnings Impact on Stock Price
</h2>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <div
    class="eps-beats-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
  >
    <div class=" text-sm mb-2 flex items-center">
      <span>EPS Beats Estimate</span>
    </div>
    <div class="flex items-baseline">
      <span class="text-xl font-bold"
        >{blogData?.data?.positiveEpsPercent}%</span
      >
      <div class="flex flex-col ml-2">
        <span class="text-sm"
          >{`${blogData?.data?.positiveEpsSurprises}/${blogData?.data?.totalReports}`}
          quarters</span
        >
        <span class="text-xs text-violet-700 dark:text-violet-400">
          {blogData?.data?.positiveEpsSurprises >
          blogData?.data?.totalReports / 2
            ? "Above Average"
            : "Below Average"}
        </span>
      </div>
    </div>
  </div>

  <div
    class="revenue-beats-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
  >
    <div class=" text-sm mb-2 flex items-center">
      <span>Revenue Beats Estimate</span>
    </div>
    <div class="flex items-baseline">
      <span class="text-xl font-bold"
        >{blogData?.data?.positiveRevenuePercent}%</span
      >
      <div class="flex flex-col ml-2">
        <span class="text-sm"
          >{`${blogData?.data?.positiveRevenueSurprises}/${blogData?.data?.totalReports}`}
          quarters</span
        >
        <span class="text-xs text-red-800 dark:text-red-400">
          {blogData?.data?.positiveRevenueSurprises >
          blogData?.data?.totalReports / 2
            ? "Above Average"
            : "Below Average"}
        </span>
      </div>
    </div>
  </div>

  <div
    class="avg-price-impact-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
  >
    <div class=" text-sm mb-2 flex items-center">
      <span>Avg. Price Impact</span>
    </div>
    <div class="flex items-baseline">
      <span class="text-xl font-bold"
        >{blogData?.data?.avgPriceImpact >= 0 ? "+" : ""}{blogData?.data
          ?.avgPriceImpact}%</span
      >
      <div class="flex flex-col ml-2">
        <span class="text-sm">Next Day</span>
        <span
          class="text-xs text-{blogData?.data?.avgPriceImpact >= 0
            ? 'green'
            : 'red'}-400"
        >
          {blogData?.data?.avgPriceImpact >= 0 ? "Positive" : "Negative"} Trend
        </span>
      </div>
    </div>
  </div>

  <div
    class="volatility-impact-driver shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
  >
    <div class=" text-sm mb-2 flex items-center">
      <span>Volatility Impact</span>
    </div>
    <div class="flex items-baseline">
      <span class="text-xl font-bold">±{blogData?.data?.volatilityImpact}%</span
      >
      <div class="flex flex-col ml-2">
        <span class="text-sm">Range</span>
        <span class="text-xs text-yellow-700 dark:text-yellow-400">
          {Number(blogData?.data?.volatilityImpact) > 3 ? "High" : "Normal"}
          Impact
        </span>
      </div>
    </div>
  </div>
</div>

{@html blogData?.text}
