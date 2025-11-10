<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  export let blogData;
</script>

<h2 class="text-xl sm:text-3xl font-bold mt-8 mb-5">Summary</h2>

<h3 class="text-xl sm:text-2xl font-bold mt-3 mb-5">
  {$stockTicker} - {$displayCompanyName}
</h3>

{@html blogData}

<div class="bg-blue-100 dark:bg-[#2A2E39] p-6 rounded mt-8 text-center mb-8">
  <h2 class="text-xl sm:text-2xl font-bold mb-4">Ready to Analyze Stocks?</h2>
  <p class="mb-4">
    Explore detailed financial data, analyst ratings, and technicals for
    thousands of stocks.
  </p>
  <a
    class="bg-blue-600 text-white px-4 py-2 rounded sm:hover:bg-blue-700 inline-block text-sm sm:text-[1rem] font-semibold"
    href="/pricing">Analyze Stocks Now</a
  >
</div>
