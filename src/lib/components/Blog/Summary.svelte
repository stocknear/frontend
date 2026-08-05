<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";
  import { getLocale } from "$lib/paraglide/runtime.js";
  import { hrefForLocale } from "$lib/i18n/navigation";
  import * as m from "$lib/paraglide/messages";

  export let blogData;

  $: pricingHref = hrefForLocale("/pricing", getLocale());
</script>

<h2 class="text-xl sm:text-3xl font-bold mt-8 mb-5">
  {m.blog_heading_summary()}
</h2>

<h3 class="type-h2 text-fg mt-3 mb-5">
  {$stockTicker} - {$displayCompanyName}
</h3>

{@html blogData}

<div class="bg-blue-100 dark:bg-[#2A2E39] p-6 rounded-control mt-8 text-center mb-8">
  <h2 class="type-h2 text-fg mb-4">{m.blog_summary_ready()}</h2>
  <p class="mb-4">{m.blog_summary_description()}</p>
  <a
    class="bg-blue-600 text-white px-4 py-2 rounded-control sm:hover:bg-blue-700 inline-block text-sm sm:text-[1rem] font-semibold"
    href={pricingHref}>{m.blog_summary_cta()}</a
  >
</div>
