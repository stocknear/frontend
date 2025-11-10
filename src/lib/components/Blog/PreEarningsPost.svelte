<script lang="ts">
  import Introduction from "$lib/components/Blog/Introduction.svelte";
  import Overview from "$lib/components/Blog/Overview.svelte";
  import Valuation from "$lib/components/Blog/Valuation.svelte";
  import Average from "$lib/components/Blog/Average.svelte";
  import PriceReaction from "$lib/components/Blog/PriceReaction.svelte";
  import Summary from "$lib/components/Blog/Summary.svelte";
  import FinancialHealth from "$lib/components/Blog/FinancialHealth.svelte";
  import Management from "$lib/components/Blog/Management.svelte";
  import Growth from "$lib/components/Blog/Growth.svelte";
  import { stockTicker, displayCompanyName } from "$lib/store";
  import { onMount } from "svelte";
  export let rawData = {};

  onMount(() => {
    if (rawData?.symbol) $stockTicker = rawData?.symbol;
    if (rawData?.name) $displayCompanyName = rawData?.name;
  });
</script>

<Introduction blogData={rawData?.nextEarningsData} />

<Overview blogData={rawData?.overview} />

<FinancialHealth blogData={rawData?.financialHealth} />
<Growth blogData={rawData?.growth} />

<!--<Dividends />-->

<Valuation blogData={rawData?.valuation} />

<Average blogData={rawData?.industry} />

<PriceReaction blogData={rawData?.priceReaction} />

<Management blogData={rawData?.management} />
<Summary blogData={rawData?.summary} />
