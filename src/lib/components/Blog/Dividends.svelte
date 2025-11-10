<script lang="ts">
  import TableHeader from "$lib/components/Table/TableHeader.svelte";

  export let blogData = [
    {
      label: "Forward dividend yield is below fasdf fasdfak",
      value: -34.71,
      sentiment: "Very Bad",
    },
    {
      label: "Dividends Per Share Increasing",
      value: 4.17,
      sentiment: "Average",
    },
    {
      label: "5-Year Dividends Per Share increasing (CAGR)",
      value: 14.87,
      sentiment: "Very Good",
    },
    {
      label: "Payout Ratio",
      value: 14.87,
      sentiment: "Very Good",
    },
    {
      label: "Free Cash Flow Payout Ratio",
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
    { key: "date", label: "Ex-Dividend Date", align: "left" },
    { key: "adjDividend", label: "Cash Amount", align: "right" },
    { key: "declarationDate", label: "Declaration Date", align: "right" },
    { key: "recordDate", label: "Record Date", align: "right" },
    { key: "paymentDate", label: "Pay Date", align: "right" },
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
</script>

<h2 class="text-xl sm:text-3xl font-bold mt-8">Dividends</h2>
<div
  class="overflow-x-auto flex justify-start items-center w-full m-auto rounded-none sm:rounded mb-8 mt-5"
>
  <table
    class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
  >
    <tbody class="">
      {#each blogData as item}
        <tr
          class=" dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
        >
          <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap">
            {item?.label}
          </td>
          <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
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
                  : 'bg-red-800 dark:bg-red-600'}">{item?.sentiment}</label
            >
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<p class="mt-8 mb-4">
  Apple's forward dividend yield currently stands at 0.47%, which is a decrease
  from its 5-year average of 0.72%. This represents a significant drop of
  approximately 34.71% from the historical norm, indicating that investors may
  be receiving a lower income return on their investment compared to previous
  years. Despite this, Apple has managed to maintain an upward trajectory in its
  Dividends Per Share, with an increase of about 4.17% recently.
</p>

<p class="mb-4">
  Looking at the longer-term trend, Apple's Dividends Per Share have grown at a
  Compound Annual Growth Rate (CAGR) of approximately 5.37% over the past five
  years, demonstrating consistent growth in dividend payouts over time.
  Additionally, Apple's Payout Ratio and Free Cash Flow Payout Ratio are both
  favorable at around 14.87% and 14.65%, respectively. These ratios suggest that
  Apple is using only a small portion of its earnings and free cash flow for
  dividends, which implies potential for future dividend increases or other
  shareholder-friendly activities without straining its financial resources.
</p>

<p class="mb-4">
  In summary, while Apple's current dividend yield is lower than its five-year
  average, the company exhibits solid fundamentals in terms of increasing
  dividends per share and sustainable payout ratios. With an overall average
  Dividend score given by Stock Unlock at around 3.6/5 based on these metrics,
  it suggests that Apple maintains a prudent approach towards growing and
  managing its dividends for shareholders.
</p>

<div
  class="overflow-x-auto flex justify-start items-center w-full m-auto rounded-none sm:rounded mb-2"
>
  <table
    class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
  >
    <thead>
      <TableHeader {columns} {sortOrders} {sortData} />
    </thead>
    <tbody class="">
      {#each dividendList as item}
        <tr
          class=" dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
        >
          <td class="text-start text-sm sm:text-[1rem] whitespace-nowrap">
            {new Date(item?.date)?.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              daySuffix: "2-digit",
            })}
          </td>
          <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
            ${item?.adjDividend?.toFixed(3)}
          </td>
          <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
            {item?.declarationDate?.length !== 0
              ? new Date(item?.declarationDate)?.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  daySuffix: "2-digit",
                })
              : "n/a"}
          </td>
          <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
            {item?.recordDate?.length !== 0
              ? new Date(item?.recordDate)?.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  daySuffix: "2-digit",
                })
              : "n/a"}
          </td>
          <td class="text-end text-sm sm:text-[1rem] whitespace-nowrap">
            {item?.paymentDate?.length !== 0
              ? new Date(item?.paymentDate)?.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  daySuffix: "2-digit",
                })
              : "n/a"}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<span class="text-gray-200 text-sm italic">
  * Dividend amounts are adjusted for stock splits when applicable.
</span>
