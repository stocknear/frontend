<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import * as m from "$lib/paraglide/messages";

  export let blogData = [];

  const columns = [
    m.blog_table_metric(),
    m.blog_table_industry_value(),
    m.blog_table_stock_value(),
    m.blog_table_difference(),
  ];
</script>

<h2 class="text-xl sm:text-3xl font-bold mt-8">
  {m.blog_heading_industry_comparison()}
</h2>
<div
  class="overflow-x-auto flex justify-start items-center w-full m-auto rounded-none sm:rounded mb-8 mt-5"
>
  <table
    class="table table-sm table-compact rounded-none sm:rounded w-full border border-line m-auto"
  >
    <thead>
      <tr
        class="bg-white dark:bg-default border-b border-[#27272A] text-fg"
      >
        {#each columns as column, index}
          <th
            class="  font-semibold text-sm sm:text-[1rem] whitespace-nowrap {index ===
            0
              ? 'text-start'
              : 'text-end'}"
          >
            {column}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody class="">
      {#each blogData?.data as item}
        {#if ["evToFreeCashFlow", "evToEBIT", "evToEBITDA", "priceToEarningsRatio", "priceToFreeCashFlowRatio", "priceToSalesRatio"]?.includes(item?.key)}
          <tr class=" dark:sm:hover:bg-[#245073]/10">
            <td class="text-start text-sm whitespace-nowrap">
              {item?.label}
            </td>
            <td class="text-end text-sm whitespace-nowrap">
              {item?.industryAvg}
            </td>
            <td class="text-end text-sm whitespace-nowrap">
              {item?.value}
            </td>
            <td class="text-end text-sm whitespace-nowrap">
              {item?.upside + "%"}
            </td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</div>

{@html blogData?.textOne}

<div
  class="overflow-x-auto flex justify-start items-center w-full m-auto rounded-none sm:rounded mb-8 mt-5"
>
  <table
    class="table table-sm table-compact rounded-none sm:rounded w-full border border-line m-auto"
  >
    <thead>
      <tr
        class="bg-white dark:bg-default border-b border-[#27272A] text-fg"
      >
        {#each columns as column, index}
          <th
            class="  font-semibold text-sm sm:text-[1rem] whitespace-nowrap {index ===
            0
              ? 'text-start'
              : 'text-end'}"
          >
            {column}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody class="">
      {#each blogData?.data as item}
        {#if ["cagr5YearRevenue", "cagr5YearEPS", "revenuePerShare", "revenuePerEmployee"]?.includes(item?.key)}
          <tr class=" dark:sm:hover:bg-[#245073]/10">
            <td class="text-start text-sm whitespace-nowrap">
              {item?.label}
            </td>
            <td class="text-end text-sm whitespace-nowrap">
              {abbreviateNumber(item?.industryAvg)}
            </td>
            <td class="text-end text-sm whitespace-nowrap">
              {abbreviateNumber(item?.value)}
            </td>
            <td class="text-end text-sm whitespace-nowrap">
              {item?.upside + "%"}
            </td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</div>

{@html blogData?.textTwo}

<div
  class="overflow-x-auto flex justify-start items-center w-full m-auto rounded-none sm:rounded mb-8 mt-5"
>
  <table
    class="table table-sm table-compact rounded-none sm:rounded w-full border border-line m-auto"
  >
    <thead>
      <tr
        class="bg-white dark:bg-default border-b border-[#27272A] text-fg"
      >
        {#each columns as column, index}
          <th
            class="  font-semibold text-sm sm:text-[1rem] whitespace-nowrap {index ===
            0
              ? 'text-start'
              : 'text-end'}"
          >
            {column}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody class="">
      {#each blogData?.data as item}
        {#if ["grossProfitMargin", "netProfitMargin", "operatingProfitMargin", "altmanZScore"]?.includes(item?.key)}
          <tr class=" dark:sm:hover:bg-[#245073]/10">
            <td class="text-start text-sm whitespace-nowrap">
              {item?.label}
            </td>
            <td class="text-end text-sm whitespace-nowrap">
              {abbreviateNumber(item?.industryAvg)}
            </td>
            <td class="text-end text-sm whitespace-nowrap">
              {abbreviateNumber(item?.value)}
            </td>
            <td class="text-end text-sm whitespace-nowrap">
              {item?.upside + "%"}
            </td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</div>

{@html blogData?.textThree}
