<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  export let data;

  let rawData = {};
  let epsRatio = 0;
  let revenueRatio = 0;
  function latestInfoDate(inputDate) {
    // Convert the input date string to milliseconds since epoch
    const inputDateMs = Date?.parse(inputDate);

    // Get today's date in milliseconds since epoch
    const todayMs = Date?.now();

    // Calculate the difference in milliseconds
    const differenceInMs = todayMs - inputDateMs;

    // Convert milliseconds to days
    const differenceInDays = Math?.floor(
      differenceInMs / (1000 * 60 * 60 * 24),
    );

    // Return the difference in days
    return differenceInDays <= 1;
  }

  $: {
    if ($stockTicker) {
      rawData = data?.getEarningsSurprise;
      epsRatio =
        rawData?.epsPrior === 0
          ? null
          : (
              ((rawData?.eps - rawData?.epsPrior) /
                Math.abs(rawData?.epsPrior)) *
              100
            )?.toFixed(2);
      revenueRatio = (
        (rawData?.revenue / rawData?.revenuePrior - 1) *
        100
      )?.toFixed(2);
    }
  }
</script>

<div class="space-y-3 overflow-hidden text-muted dark:text-white">
  <!--Start Content-->
  <div class="w-auto lg:w-full p-1 flex flex-col m-auto">
    <div class="flex flex-col items-center w-full mb-3">
      <div class="flex flex-row justify-start mr-auto items-center">
        <!--<img class="h-10 inline-block mr-2" src={copilotIcon} />-->

        <div class="flex flex-row items-center">
          <h3 class="mr-1 flex flex-row items-center text-2xl font-bold">
            Earnings Surprise
          </h3>
          <label
            class="{latestInfoDate(rawData?.date)
              ? 'border border-gray-300'
              : 'hidden'} bg-black text-white dark:text-black dark:bg-[#fff] ml-2 font-semibold not-italic text-xs rounded px-2 py-0.5"
            >New</label
          >
        </div>
      </div>
    </div>

    <div
      class="text-[1rem] {latestInfoDate(rawData?.date)
        ? 'bg-gray-200 dark:bg-[#F9AB00]/10 p-3 rounded shadow'
        : ' pl-1'} "
    >
      <div class="mt-1">
        {removeCompanyStrings($displayCompanyName)} has released their quartely earnings
        on {new Date(rawData?.date)?.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          daySuffix: "2-digit",
          timeZone: "UTC",
        })}:
      </div>

      <li
        class="ml-[20px] sm:ml-[30px]"
        style="line-height: 22px; margin-top:10px; margin-bottom: 10px; list-style-type: disc;"
      >
        Revenue of <span class=""
          >{abbreviateNumber(rawData?.revenue, true)}</span
        >
        {rawData?.revenueSurprise > 0 ? "exceeds" : "misses"} estimates by {abbreviateNumber(
          Math.abs(rawData?.revenueSurprise),
          true,
        )}, with
        <span
          class=" {revenueRatio > 0
            ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
            : 'text-red-800 dark:text-[#FF2F1F]'}">{revenueRatio}%</span
        >
        YoY {revenueRatio < 0 ? "decline" : "growth"}.
      </li>
      <li
        class="ml-[20px] sm:ml-[30px]"
        style="line-height: 22px; margin-top: 0px; margin-bottom: 0px; list-style-type: disc;"
      >
        EPS of <span class="">{rawData?.eps}</span>
        {rawData?.epsSurprise > 0 ? "exceeds" : "misses"} estimates by {rawData?.epsSurprise?.toFixed(
          2,
        )}, with
        <span
          class=" {epsRatio === null
            ? ''
            : epsRatio > 0
              ? 'text-green-800 dark:text-[#00FC50]'
              : 'text-red-800 dark:text-[#FF2F1F]'}"
        >
          {epsRatio === null ? "n/a" : `${epsRatio}%`}
        </span>
        YoY {epsRatio === null ? "" : epsRatio < 0 ? "decline" : "growth"}.
      </li>
    </div>
  </div>
</div>
