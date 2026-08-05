<script lang="ts">
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import { formatDate } from "$lib/i18n/format";
  import * as m from "$lib/paraglide/messages";

  export let blogData = [
    {
      label: m.blog_dividends_forward_yield_below(),
      value: -34.71,
      sentiment: "Very Bad",
    },
    {
      label: m.blog_dividends_dps_increasing(),
      value: 4.17,
      sentiment: "Average",
    },
    {
      label: m.blog_dividends_five_year_dps_growth(),
      value: 14.87,
      sentiment: "Very Good",
    },
    {
      label: m.blog_dividends_payout_ratio(),
      value: 14.87,
      sentiment: "Very Good",
    },
    {
      label: m.blog_dividends_fcf_payout_ratio(),
      value: 14.65,
      sentiment: "Very Good",
    },
  ];

  let dividendList = [
    {
      symbol: "A",
      date: "2025-07-01",
      recordDate: "2025-07-01",
      paymentDate: "2025-07-23",
      declarationDate: "2025-05-21",
      adjDividend: 0.248,
      dividend: 0.248,
      yield: 0.8604794099569759,
      frequency: "Quarterly",
    },
    {
      symbol: "A",
      date: "2025-04-01",
      recordDate: "2025-04-01",
      paymentDate: "2025-04-23",
      declarationDate: "2025-02-19",
      adjDividend: 0.248,
      dividend: 0.248,
      yield: 0.8487505480052608,
      frequency: "Quarterly",
    },
  ];
  let originalData = dividendList;
  let columns = [
    { key: "date", label: m.blog_dividends_ex_date(), align: "left" },
    { key: "adjDividend", label: m.blog_dividends_cash_amount(), align: "right" },
    {
      key: "declarationDate",
      label: m.blog_dividends_declaration_date(),
      align: "right",
    },
    { key: "recordDate", label: m.blog_dividends_record_date(), align: "right" },
    { key: "paymentDate", label: m.blog_dividends_pay_date(), align: "right" },
  ];

  let sortOrders = {
    date: { order: "none", type: "date" },
    adjDividend: { order: "none", type: "number" },
    declarationDate: { order: "none", type: "date" },
    recordDate: { order: "none", type: "date" },
    paymentDate: { order: "none", type: "date" },
  };

  const sortData = (key) => {
    // Reset all other keys to 'none' except the current key
    for (const k in sortOrders) {
      if (k !== key) {
        sortOrders[k].order = "none";
      }
    }

    // Cycle through 'none', 'asc', 'desc' for the clicked key
    const orderCycle = ["none", "asc", "desc"];

    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle.length];
    const sortOrder = sortOrders[key].order;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      dividendList = [...originalData]?.slice(0, 50); // Reset to original data (spread to avoid mutation)
      return;
    }

    // Define a generic comparison function
    const compareValues = (a, b) => {
      const { type } = sortOrders[key];
      let valueA, valueB;

      switch (type) {
        case "date":
          valueA = new Date(a[key]);
          valueB = new Date(b[key]);
          break;
        case "string":
          valueA = a[key].toUpperCase();
          valueB = b[key].toUpperCase();
          return sortOrder === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "number":
        default:
          valueA = parseFloat(a[key]);
          valueB = parseFloat(b[key]);
          break;
      }

      if (sortOrder === "asc") {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    };

    // Sort using the generic comparison function
    dividendList = [...originalData].sort(compareValues)?.slice(0, 50);
  };

  function sentimentLabel(sentiment) {
    if (sentiment === "Very Good") return m.blog_sentiment_very_good();
    if (sentiment === "Good") return m.blog_sentiment_good();
    if (sentiment === "Average") return m.blog_sentiment_average();
    if (sentiment === "Bad") return m.blog_sentiment_bad();
    if (sentiment === "Very Bad") return m.blog_sentiment_very_bad();
    return sentiment;
  }

  function formatBlogDate(value) {
    if (!value) return m.blog_not_available();
    return formatDate(new Date(`${value}T00:00:00Z`), {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  }
</script>

<h2 class="text-xl sm:text-3xl font-bold mt-8">{m.blog_heading_dividends()}</h2>
<div
  class="overflow-x-auto flex justify-start items-center w-full m-auto rounded-none sm:rounded mb-8 mt-5"
>
  <table
    class="table table-sm table-compact rounded-none sm:rounded w-full border border-line m-auto"
  >
    <tbody class="">
      {#each blogData as item}
        <tr class=" dark:sm:hover:bg-[#245073]/10">
          <td class="text-start text-sm whitespace-nowrap">
            {item?.label}
          </td>
          <td class="text-end text-sm whitespace-nowrap">
            {item?.value + "%"}
          </td>

          <td class=" text-sm sm:text-[1rem] whitespace-nowrap text-end">
            <label
              class="badge badge-lg w-24 rounded-[3px] {[
                'Very Good',
                'Good',
              ]?.includes(item?.sentiment)
                ? 'bg-green-800 dark:bg-green-600'
                : item?.sentiment === 'Average'
                  ? 'bg-orange-800 dark:bg-orange-600'
                  : 'bg-red-800 dark:bg-red-600'}"
              >{sentimentLabel(item?.sentiment)}</label
            >
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<p class="mt-8 mb-4">
  {m.blog_dividends_paragraph_one()}
</p>

<p class="mb-4">
  {m.blog_dividends_paragraph_two()}
</p>

<p class="mb-4">
  {m.blog_dividends_paragraph_three()}
</p>

<div
  class="overflow-x-auto flex justify-start items-center w-full m-auto rounded-none sm:rounded mb-2"
>
  <table
    class="table table-sm table-compact rounded-none sm:rounded w-full border border-line m-auto"
  >
    <thead>
      <TableHeader {columns} {sortOrders} {sortData} />
    </thead>
    <tbody class="">
      {#each dividendList as item}
        <tr class=" dark:sm:hover:bg-[#245073]/10">
          <td class="text-start text-sm whitespace-nowrap">
            {formatBlogDate(item?.date)}
          </td>
          <td class="text-end text-sm whitespace-nowrap">
            ${item?.adjDividend?.toFixed(3)}
          </td>
          <td class="text-end text-sm whitespace-nowrap">
            {formatBlogDate(item?.declarationDate)}
          </td>
          <td class="text-end text-sm whitespace-nowrap">
            {formatBlogDate(item?.recordDate)}
          </td>
          <td class="text-end text-sm whitespace-nowrap">
            {formatBlogDate(item?.paymentDate)}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<span class="text-gray-200 text-sm italic">
  {m.blog_dividends_footnote()}
</span>
