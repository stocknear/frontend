<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import PopupInfo from "$lib/components/PopupInfo.svelte";

  export let data;
  let rawData = data?.getStatistics ?? {};

  let companyName = removeCompanyStrings($displayCompanyName);

  function checkValue(val, category) {
    if (val !== null && val !== undefined) {
      if (category === "percent") {
        return `${val}%`;
      } else if (category === "int") {
        return abbreviateNumber(val);
      } else {
        return val;
      }
    } else {
      return "n/a";
    }
  }
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Statistics & Valuation Metrics`}
  description={`Detailed statistics for ${$displayCompanyName} (${$stockTicker}) stock, including valuation, metrics, financial numbers, share information and more.`}
/>

<section class=" w-full">
  <div class="sm:pb-7 sm:pt-7 sm:pl-7 m-auto mt-7 sm:mt-0">
    <div class="mb-6">
      {#if Object?.keys(rawData)?.length > 0}
        <div
          class="space-y-5 xs:space-y-6 lg:grid lg:grid-cols-3 lg:space-x-16 sm:gap-x-5 lg:space-y-0"
        >
          <div
            class="flex flex-col space-y-5 xs:space-y-6 lg:space-y-8 w-full max-w-96"
          >
            <div class="flex items-start justify-between">
              <h1 class="text-xl sm:text-2xl font-bold">
                {companyName} Statistics
              </h1>
            </div>

            <div>
              <h2 class="mb-2 px-0.5 text-xl font-bold">Share Statistics</h2>
              <p class="mb-4 px-0.5 xs:text-[1.05rem] lg:leading-normal">
                {companyName} has {abbreviateNumber(
                  rawData?.sharesOutStanding,
                  false,
                )}
                shares outstanding. The number of shares has increased by {rawData?.sharesYoY}%
                in one year.
              </p>
              <table class="w-full border border-gray-300 dark:border-gray-800">
                <tbody>
                  <PopupInfo
                    label="Shares Outstanding"
                    parameter="sharesOutStanding"
                    value={rawData?.sharesOutStanding
                      ? abbreviateNumber(rawData?.sharesOutStanding)
                      : "n/a"}
                  />
                  <PopupInfo
                    label="Shares Change (YoY)"
                    parameter="sharesYoY"
                    value={checkValue(rawData?.sharesYoY, "percent")}
                  />
                  <PopupInfo
                    label="Shares Change (QoQ)"
                    parameter="sharesQoQ"
                    value={checkValue(rawData?.sharesQoQ, "percent")}
                  />
                  <PopupInfo
                    label="Owned by Institutions (%)"
                    parameter="institutionalOwnership"
                    value={checkValue(
                      rawData?.institutionalOwnership,
                      "percent",
                    )}
                  />
                  <PopupInfo
                    label="Shares Floating"
                    parameter="floatShare"
                    value={rawData?.floatShares
                      ? abbreviateNumber(rawData?.floatShares)
                      : "n/a"}
                  />
                  <PopupInfo
                    label="Failed to Deliver (FTD) Shares"
                    parameter="failToDeliver"
                    value={rawData?.failToDeliver
                      ? rawData?.failToDeliver?.toLocaleString("en-US")
                      : "n/a"}
                  />
                  <PopupInfo
                    label="FTD / Avg. Volume"
                    parameter="relativeFTD"
                    value={rawData?.relativeFTD
                      ? rawData?.relativeFTD < 0.01
                        ? "< 0.01%"
                        : checkValue(
                            abbreviateNumber(rawData?.relativeFTD),
                            "percent",
                          )
                      : "n/a"}
                  />
                </tbody>
              </table>
            </div>
            <div>
              <h2 class="mb-2 px-0.5 text-xl font-bold">
                Short Selling Information
              </h2>
              {#if rawData?.sharesShort}
                <p class="mb-4 px-0.5 xs:text-[1.05rem] lg:leading-normal">
                  The latest short interest is {abbreviateNumber(
                    rawData?.sharesShort,
                    false,
                  )}, so {rawData?.shortOutstandingPercent}% of the outstanding
                  shares have been sold short.
                </p>
              {/if}
              <table class="w-full border border-gray-300 dark:border-gray-800">
                <tbody>
                  <PopupInfo
                    label="Short Interest"
                    parameter="sharesShort"
                    value={rawData?.sharesShort
                      ? abbreviateNumber(rawData?.sharesShort)
                      : "n/a"}
                  />
                  <PopupInfo
                    label="Short % of Shares Out"
                    parameter="shortOutstandingPercent"
                    value={rawData?.shortOutstandingPercent
                      ? rawData?.shortOutstandingPercent + "%"
                      : "n/a"}
                  />
                  <PopupInfo
                    label="Short % of Float"
                    parameter="shortFloatPercent"
                    value={rawData?.shortFloatPercent
                      ? rawData?.shortFloatPercent + "%"
                      : "n/a"}
                  />
                  <PopupInfo
                    label="Short Ratio (days to cover)"
                    parameter="shortRatio"
                    value={rawData?.shortRatio ? rawData?.shortRatio : "n/a"}
                  />
                </tbody>
              </table>
            </div>
            <div>
              <h2 class="mb-2 px-0.5 text-xl font-bold">Valuation Ratios</h2>
              {#if rawData?.priceToEarningsRatio}
                <p class="mb-4 px-0.5 xs:text-[1.05rem] lg:leading-normal">
                  The PE ratio is {rawData?.priceToEarningsRatio} and the forward
                  PE ratio is {rawData?.forwardPE}.
                  {rawData?.priceToEarningsGrowthRatio !== null
                    ? `${companyName}'s PEG ratio is
                ${rawData?.priceToEarningsGrowthRatio}.`
                    : ""}
                </p>
              {/if}

              <table class="w-full border border-gray-300 dark:border-gray-800">
                <tbody>
                  <PopupInfo
                    label="PE Ratio"
                    parameter="priceToEarningsRatio"
                    value={rawData?.priceToEarningsRatio ?? "n/a"}
                  />
                  <PopupInfo
                    label="Forward PE"
                    parameter="forwardPE"
                    value={rawData?.forwardPE ?? "n/a"}
                  />
                  <PopupInfo
                    label="PS Ratio"
                    parameter="priceToSalesRatio"
                    value={rawData?.priceToSalesRatio ?? "n/a"}
                  />
                  <PopupInfo
                    label="Forward PS"
                    parameter="forwardPS"
                    value={rawData?.forwardPS ?? "n/a"}
                  />
                  <PopupInfo
                    label="PB Ratio"
                    parameter="priceToBookRatio"
                    value={rawData?.priceToBookRatio ?? "n/a"}
                  />
                  <PopupInfo
                    label="P/FCF Ratio"
                    parameter="priceToFreeCashFlowRatio"
                    value={rawData?.priceToFreeCashFlowRatio ?? "n/a"}
                  />
                  <PopupInfo
                    label="PEG Ratio"
                    parameter="priceToEarningsGrowthRatio"
                    value={rawData?.priceToEarningsGrowthRatio !== null
                      ? rawData?.priceToEarningsGrowthRatio
                      : "n/a"}
                  />
                </tbody>
              </table>
              <a
                href={`/stocks/${$stockTicker}/financials/ratios`}
                class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-3 text-[1rem] text-center font-semibold text-white dark:text-black m-auto dark:sm:hover:bg-gray-300 bg-black sm:hover:bg-muted dark:bg-[#fff] transition duration-100"
              >
                Financial Ratio History
              </a>
            </div>
            <div>
              <h2 class="mb-2 px-0.5 text-xl font-bold">
                Enterprise Valuation
              </h2>
              <p class="mb-4 px-0.5 xs:text-[1.05rem] lg:leading-normal">
                {#if rawData?.enterpriseValue !== null}
                  {companyName} has an Enterprise Value (EV) of {abbreviateNumber(
                    rawData?.enterpriseValue,
                    false,
                  )}.
                {:else}
                  Currently the Enterprise Value (EV) is not available for {companyName}.
                {/if}
              </p>
              <table class="w-full border border-gray-300 dark:border-gray-800">
                <tbody>
                  <PopupInfo
                    label="EV / Sales"
                    parameter="evToSales"
                    value={rawData?.evToSales ?? "n/a"}
                  />
                  <PopupInfo
                    label="EV / EBITDA"
                    parameter="evToEBITDA"
                    value={rawData?.evToEBITDA ?? "n/a"}
                  />
                  <PopupInfo
                    label="EV / EBIT"
                    parameter="evToOperatingCashFlow"
                    value={rawData?.evToOperatingCashFlow ?? "n/a"}
                  />
                  <PopupInfo
                    label="EV / FCF"
                    parameter="evToFreeCashFlow"
                    value={rawData?.evToFreeCashFlow ?? "n/a"}
                  />
                </tbody>
              </table>
            </div>
            <div>
              <h2 class="mb-2 px-0.5 text-xl font-bold">Financial Position</h2>
              {#if rawData?.currentRatio}
                <p class="mb-4 px-0.5 xs:text-[1.05rem] lg:leading-normal">
                  The company has a current ratio of {rawData?.currentRatio},
                  with a Debt / Equity ratio of {rawData?.debtToEquityRatio}.
                </p>
              {/if}
              <table class="w-full border border-gray-300 dark:border-gray-800">
                <tbody>
                  <PopupInfo
                    label="Current Ratio"
                    parameter="currentRatio"
                    value={rawData?.currentRatio ?? "n/a"}
                  />
                  <PopupInfo
                    label="Quick Ratio"
                    parameter="quickRatio"
                    value={rawData?.quickRatio ?? "n/a"}
                  />
                  <PopupInfo
                    parameter="debtToEquityRatio"
                    label="Debt / Equity"
                    value={rawData?.debtToEquityRatio ?? "n/a"}
                  />
                  <PopupInfo
                    parameter="debtToEBITDARatio"
                    label="Debt / EBITDA"
                    value={rawData?.debtToEBITDARatio
                      ? abbreviateNumber(rawData?.debtToEBITDARatio)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="debtToFreeCashFlowRatio"
                    label="Debt / FCF"
                    value={rawData?.debtToFreeCashFlowRatio
                      ? abbreviateNumber(rawData?.debtToFreeCashFlowRatio)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="interestCoverageRatio"
                    label="Interest Coverage"
                    value={rawData?.interestCoverageRatio}
                  />
                </tbody>
              </table>
            </div>
            <div>
              <h2 class="mb-2 px-0.5 text-xl font-bold">
                Financial Efficiency
              </h2>
              <p class="mb-4 px-0.5 xs:text-[1.05rem] lg:leading-normal">
                Return on Equity is {checkValue(
                  rawData?.returnOnEquity,
                  "percent",
                )} and Return on Invested Capital is {checkValue(
                  rawData?.returnOnInvestedCapital,
                  "percent",
                )}.
              </p>
              <table class="w-full border border-gray-300 dark:border-gray-800">
                <tbody>
                  <PopupInfo
                    parameter="returnOnEquity"
                    label="Return on Equity"
                    value={checkValue(rawData?.returnOnEquity, "percent")}
                  />
                  <PopupInfo
                    parameter="returnOnAssets"
                    label="Return on Assets"
                    value={checkValue(rawData?.returnOnAssets, "percent")}
                  />
                  <PopupInfo
                    parameter="returnOnInvestedCapital"
                    label="Return on Invested Capital"
                    value={checkValue(
                      rawData?.returnOnInvestedCapital,
                      "percent",
                    )}
                  />
                  <PopupInfo
                    parameter="revenuePerEmployee"
                    label="Revenue Per Employee"
                    value={rawData?.revenuePerEmployee
                      ? "$" + abbreviateNumber(rawData?.revenuePerEmployee)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="profitPerEmployee"
                    label="Profits Per Employee"
                    value={rawData?.profitPerEmployee
                      ? "$" + abbreviateNumber(rawData?.profitPerEmployee)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="employees"
                    label="Employee Count"
                    value={rawData?.employees?.toLocaleString("en-US")}
                  />
                  <PopupInfo
                    parameter="assetTurnover"
                    label="Asset Turnover"
                    value={rawData?.assetTurnover ?? "n/a"}
                  />
                  <PopupInfo
                    parameter="inventoryTurnover"
                    label="Inventory Turnover"
                    value={rawData?.inventoryTurnover
                      ? abbreviateNumber(rawData?.inventoryTurnover, false)
                      : "n/a"}
                  />
                </tbody>
              </table>
            </div>
            <div>
              <h2 class="mb-2 px-0.5 text-xl font-bold">Taxes</h2>
              <table class="w-full border border-gray-300 dark:border-gray-800">
                <tbody>
                  <PopupInfo
                    parameter="incomeTaxExpense"
                    label="Income Tax"
                    value={rawData?.incomeTaxExpense
                      ? abbreviateNumber(rawData?.incomeTaxExpense)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="effectiveTaxRate"
                    label="Effective Tax Rate"
                    value={checkValue(rawData?.effectiveTaxRate, "percent")}
                  />
                </tbody>
              </table>
            </div>
          </div>
          <div
            class="flex flex-col space-y-5 xs:space-y-6 lg:space-y-8 w-full max-w-96"
          >
            <div class="mt-0 sm:mt-9 2xl:mt-0">
              <h2 class="mb-2 px-0.5 text-xl font-bold">
                Stock Price Statistics
              </h2>
              <p class="mb-4 px-0.5 xs:text-[1.05rem] lg:leading-normal">
                The stock price has increased by {rawData?.change1Y}% in the
                last 52 weeks. The beta is {rawData?.beta}, so {companyName}'s
                price volatility has been {rawData?.beta > 0
                  ? "higher"
                  : "lower"} than the market average.
              </p>
              <table class="w-full border border-gray-300 dark:border-gray-800">
                <tbody>
                  <PopupInfo
                    parameter="beta"
                    label="Beta"
                    value={rawData?.beta}
                  />
                  <PopupInfo
                    parameter="change1Y"
                    label="52-Week Price Change"
                    value={rawData?.change1Y ? rawData?.change1Y + "%" : "n/a"}
                  />
                  <PopupInfo
                    parameter="sma50"
                    label="50-Day Moving Average"
                    value={rawData?.sma50 ?? "n/a"}
                  />
                  <PopupInfo
                    parameter="sma200"
                    label="200-Day Moving Average"
                    value={rawData?.sma200 ?? "n/a"}
                  />
                  <PopupInfo
                    parameter="rsi"
                    label="Relative Strength Index (RSI)"
                    value={rawData?.rsi ?? "n/a"}
                  />
                  <PopupInfo
                    parameter="avgVolume"
                    label="Average Volume (20 Days)"
                    value={rawData?.avgVolume
                      ? rawData?.avgVolume?.toLocaleString("en-US")
                      : "n/a"}
                  />
                </tbody>
              </table>
            </div>

            <div>
              <h2 class="mb-2 px-0.5 text-xl font-bold">Income Statement</h2>
              <p class="mb-4 px-0.5 xs:text-[1.05rem] lg:leading-normal">
                {#if rawData?.revenue !== null && rawData?.revenue !== 0}
                  In the last 12 months, {companyName} had revenue of {abbreviateNumber(
                    rawData?.revenue,
                    false,
                  )}
                  and earned {abbreviateNumber(rawData?.netIncome, false)}
                  in profits. Earnings per share was {rawData?.eps}.
                {/if}
              </p>
              <table class="w-full border border-gray-300 dark:border-gray-800">
                <tbody>
                  <PopupInfo
                    parameter="revenue"
                    label="Revenue"
                    value={rawData?.revenue !== 0 && rawData?.revenue !== null
                      ? abbreviateNumber(rawData?.revenue, false)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="grossProfit"
                    label="Gross Profit"
                    value={rawData?.grossProfit
                      ? abbreviateNumber(rawData?.grossProfit)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="operatingIncome"
                    label="Operating Income"
                    value={rawData?.operatingIncome
                      ? abbreviateNumber(rawData?.operatingIncome)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="netIncome"
                    label="Net Income"
                    value={rawData?.netIncome
                      ? abbreviateNumber(rawData?.netIncome)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="ebitda"
                    label="EBITDA"
                    value={rawData?.ebitda
                      ? abbreviateNumber(rawData?.ebitda)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="ebit"
                    label="EBIT"
                    value={rawData?.ebit !== 0 && rawData?.ebit !== null
                      ? abbreviateNumber(rawData?.ebit, false)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="eps"
                    label="Earnings Per Share (EPS)"
                    value={rawData?.eps ?? "n/a"}
                  />
                </tbody>
              </table>
              <a
                href={`/stocks/${$stockTicker}/financials`}
                class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-3 text-[1rem] text-center font-semibold text-white dark:text-black m-auto dark:sm:hover:bg-gray-300 bg-black sm:hover:bg-muted dark:bg-[#fff] transition duration-100"
              >
                Full Income Statement
              </a>
            </div>
            <div>
              <h2 class="mb-2 px-0.5 text-xl font-bold">Balance Sheet</h2>
              {#if rawData?.cashAndCashEquivalents}
                <p class="mb-4 px-0.5 xs:text-[1.05rem] lg:leading-normal">
                  The company has {abbreviateNumber(
                    rawData?.cashAndCashEquivalents,
                    false,
                  )} in cash and {abbreviateNumber(rawData?.totalDebt, false)} in
                  debt, giving a net cash position of {abbreviateNumber(
                    rawData?.cashAndCashEquivalents - rawData?.totalDebt,
                    false,
                  )}.
                </p>
              {/if}
              <table class="w-full border border-gray-300 dark:border-gray-800">
                <tbody>
                  <PopupInfo
                    parameter="cashAndCashEquivalents"
                    label="Cash &amp; Cash Equivalents"
                    value={rawData?.cashAndCashEquivalents
                      ? abbreviateNumber(rawData?.cashAndCashEquivalents)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="totalDebt"
                    label="Total Debt"
                    value={rawData?.totalDebt
                      ? abbreviateNumber(rawData?.totalDebt)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="netCash"
                    label="Net Cash"
                    value={rawData?.cashAndCashEquivalents && rawData?.totalDebt
                      ? abbreviateNumber(
                          rawData?.cashAndCashEquivalents - rawData?.totalDebt,
                        )
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="retainedEarnings"
                    label="Retained Earnings"
                    value={rawData?.retainedEarnings
                      ? abbreviateNumber(rawData?.retainedEarnings)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="totalAssets"
                    label="Total Assets"
                    value={rawData?.totalAssets
                      ? abbreviateNumber(rawData?.totalAssets)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="workingCapital"
                    label="Working Capital"
                    value={rawData?.workingCapital
                      ? abbreviateNumber(rawData?.workingCapital)
                      : "n/a"}
                  />
                </tbody>
              </table>
              <a
                href={`/stocks/${$stockTicker}/financials/balance-sheet`}
                class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-3 text-[1rem] text-center font-semibold text-white dark:text-black m-auto dark:sm:hover:bg-gray-300 bg-black sm:hover:bg-muted dark:bg-[#fff] transition duration-100"
              >
                Full Balance Sheet
              </a>
            </div>
            <div>
              <h2 class="mb-2 px-0.5 text-xl font-bold">Cash Flow</h2>
              {#if rawData?.operatingCashFlow}
                <p class="mb-4 px-0.5 xs:text-[1.05rem] lg:leading-normal">
                  In the last 12 months, operating cash flow was {abbreviateNumber(
                    rawData?.operatingCashFlow,
                    false,
                  )}
                  and capital expenditures {abbreviateNumber(
                    rawData?.capitalExpenditure,
                    false,
                  )}, giving a free cash flow of {abbreviateNumber(
                    rawData?.freeCashFlow,
                    false,
                  )}.
                </p>
              {/if}
              <table class="w-full border border-gray-300 dark:border-gray-800">
                <tbody>
                  <PopupInfo
                    parameter="operatingCashFlow"
                    label="Operating Cash Flow"
                    value={rawData?.operatingCashFlow
                      ? abbreviateNumber(rawData?.operatingCashFlow)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="capitalExpenditure"
                    label="Capital Expenditures"
                    value={rawData?.capitalExpenditure
                      ? abbreviateNumber(rawData?.capitalExpenditure)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="freeCashFlow"
                    label="Free Cash Flow"
                    value={rawData?.freeCashFlow
                      ? abbreviateNumber(rawData?.freeCashFlow)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="freeCashFlowPerShare"
                    label="FCF Per Share"
                    value={rawData?.freeCashFlowPerShare ?? "n/a"}
                  />
                </tbody>
              </table>
              <a
                href={`/stocks/${$stockTicker}/financials/cash-flow`}
                class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-3 text-[1rem] text-center font-semibold text-white dark:text-black m-auto dark:sm:hover:bg-gray-300 bg-black sm:hover:bg-muted dark:bg-[#fff] transition duration-100"
              >
                Full Cash Flow Statement
              </a>
            </div>
            <div>
              <h2 class="mb-2 px-0.5 text-xl font-bold">Margins</h2>
              <p class="mb-4 px-0.5 xs:text-[1.05rem] lg:leading-normal">
                {#if rawData?.grossProfitMargin !== 0 && rawData?.grossProfitMargin !== null}
                  Gross margin is {checkValue(
                    rawData?.grossProfitMargin,
                    "percent",
                  )}, with operating and profit margins of {checkValue(
                    rawData?.operatingProfitMargin,
                    "percent",
                  )} and {checkValue(rawData?.netProfitMargin, "percent")}.
                {/if}
              </p>
              <table class="w-full border border-gray-300 dark:border-gray-800">
                <tbody>
                  <PopupInfo
                    parameter="grossProfitMargin"
                    label="Gross Margin"
                    value={rawData?.grossProfitMargin !== 0 &&
                    rawData?.grossProfitMargin !== null
                      ? checkValue(rawData?.grossProfitMargin, "percent")
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="operatingProfitMargin"
                    label="Operating Margin"
                    value={rawData?.operatingProfitMargin !== 0 &&
                    rawData?.operatingProfitMargin !== null
                      ? checkValue(rawData?.operatingProfitMargin, "percent")
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="pretaxProfitMargin"
                    label="Pretax Margin"
                    value={rawData?.pretaxProfitMargin !== 0 &&
                    rawData?.pretaxProfitMargin !== null
                      ? checkValue(rawData?.pretaxProfitMargin, "percent")
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="netProfitMargin"
                    label="Profit Margin"
                    value={rawData?.netProfitMargin !== 0 &&
                    rawData?.netProfitMargin !== null
                      ? checkValue(rawData?.netProfitMargin, "percent")
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="ebitdaMargin"
                    label="EBITDA Margin"
                    value={rawData?.ebitdaMargin !== 0 &&
                    rawData?.ebitdaMargin !== null
                      ? checkValue(rawData?.ebitdaMargin, "percent")
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="ebitMargin"
                    label="EBIT Margin"
                    value={rawData?.ebitMargin !== 0 &&
                    rawData?.ebitMargin !== null
                      ? checkValue(rawData?.ebitMargin, "percent")
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="freeCashFlowMargin"
                    label="FCF Margin"
                    value={rawData?.freeCashFlowMargin !== 0 &&
                    rawData?.freeCashFlowMargin !== null
                      ? checkValue(rawData?.freeCashFlowMargin, "percent")
                      : "n/a"}
                  />
                </tbody>
              </table>
            </div>
          </div>

          <div
            class="flex flex-col space-y-5 xs:space-y-6 lg:space-y-8 w-full max-w-96"
          >
            <div class="mt-0 sm:mt-9 2xl:mt-0">
              <h2 class="mb-2 px-0.5 text-xl font-bold">
                Dividends &amp; Yields
              </h2>
              <p
                class="mb-4 px-0.5 leading-relaxed xs:text-[1.05rem] lg:leading-normal"
              >
                {#if rawData?.annualDividend !== null && rawData?.dividendYield !== null}
                  {$stockTicker} pays an annual dividend of ${rawData?.annualDividend},
                  which amounts to a dividend yield of {rawData?.dividendYield}%.
                {:else}
                  {$stockTicker} does not appear to pay any dividends at this time.
                {/if}
              </p>
              <table class="w-full border border-gray-300 dark:border-gray-800">
                <tbody>
                  <PopupInfo
                    parameter="annualDividend"
                    label="Dividend Per Share"
                    value={rawData?.annualDividend !== null
                      ? "$" + rawData?.annualDividend?.toFixed(2)
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="dividendYield"
                    label="Dividend Yield"
                    value={rawData?.dividendYield !== null
                      ? rawData?.dividendYield + "%"
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="dividendGrowth"
                    label="Dividend Growth (YoY)"
                    value={rawData?.dividendGrowth !== null
                      ? rawData?.dividendGrowth + "%"
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="payoutRatio"
                    label="Payout Ratio"
                    value={rawData?.payoutRatio !== null
                      ? rawData?.payoutRatio + "%"
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="earningsYield"
                    label="Earnings Yield"
                    value={rawData?.earningsYield !== null
                      ? checkValue(rawData?.earningsYield, "percent")
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="freeCashFlowYield"
                    label="FCF Yield"
                    value={rawData?.freeCashFlowYield !== null
                      ? checkValue(rawData?.freeCashFlowYield, "percent")
                      : "n/a"}
                  />
                </tbody>
              </table>
              <a
                href={`/stocks/${$stockTicker}/dividends`}
                class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-3 text-[1rem] text-center font-semibold text-white dark:text-black m-auto dark:sm:hover:bg-gray-300 bg-black sm:hover:bg-muted dark:bg-[#fff] transition duration-100"
              >
                Dividend Details
              </a>
            </div>
            <div>
              <h2 class="mb-2 px-0.5 text-xl font-bold">Analyst Forecast</h2>
              <p
                class="mb-4 px-0.5 leading-relaxed xs:text-[1.05rem] lg:leading-normal"
                data-test="statistics-text"
              >
                {#if rawData?.priceTarget && rawData?.upside && rawData?.analystRating}
                  The average price target for {$stockTicker} is ${rawData?.priceTarget},
                  which is {rawData?.upside}% {rawData?.upside > 0
                    ? "higher"
                    : "lower"} than the current price. The consensus rating is "{rawData?.analystRating}".
                {:else}
                  Currently there are no analyst rating for {$stockTicker}.
                {/if}
              </p>
              <table class="w-full border border-gray-300 dark:border-gray-800">
                <tbody>
                  <PopupInfo
                    parameter="priceTarget"
                    label="Price Target"
                    value={rawData?.priceTarget !== null
                      ? "$" + rawData?.priceTarget
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="upside"
                    label="Price Target Difference"
                    value={rawData?.upside !== null
                      ? rawData?.upside + "%"
                      : "n/a"}
                  />
                  <PopupInfo
                    parameter="analystRating"
                    label="Analyst Consensus"
                    value={rawData?.analystRating ?? "n/a"}
                  />
                  <PopupInfo
                    parameter="analystCounter"
                    label="Analyst Count"
                    value={rawData?.analystCounter ?? "n/a"}
                  />
                </tbody>
              </table>
              <a
                href={`/stocks/${$stockTicker}/forecast/analyst`}
                class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-3 text-[1rem] text-center font-semibold text-white dark:text-black m-auto dark:sm:hover:bg-gray-300 bg-black sm:hover:bg-muted dark:bg-[#fff] transition duration-100"
              >
                Stock Forecasts
              </a>
            </div>
            <div>
              <h2 class="mb-2 px-0.5 text-xl font-bold">Fair Value</h2>
              <p
                class="mb-4 px-0.5 leading-relaxed xs:text-[1.05rem] lg:leading-normal"
              >
                There are several formulas that can be used to estimate the
                intrinsic value of a stock.
              </p>
              <table class="w-full border border-gray-300 dark:border-gray-800">
                <tbody>
                  <PopupInfo
                    label="Lynch Fair Value"
                    parameter="lynchFairValue"
                    value={rawData?.lynchFairValue
                      ? "$" + rawData?.lynchFairValue
                      : "n/a"}
                  />
                  <PopupInfo
                    label="Lynch Upside"
                    parameter="lynchUpside"
                    value={rawData?.lynchUpside
                      ? rawData?.lynchUpside + "%"
                      : "n/a"}
                  />
                  <PopupInfo
                    label="Graham Number"
                    parameter="grahamNumber"
                    value={rawData?.grahamNumber ?? "n/a"}
                  />
                  <PopupInfo
                    label="Graham Upside"
                    parameter="grahamUpside"
                    value={rawData?.grahamUpside
                      ? rawData?.grahamUpside + "%"
                      : "n/a"}
                  />
                </tbody>
              </table>
            </div>
            {#if rawData?.lastStockSplit && rawData?.splitType && rawData?.splitRatio}
              <div>
                <h2 class="mb-2 px-0.5 text-xl font-bold">Stock Splits</h2>
                <p
                  class="mb-4 px-0.5 leading-relaxed xs:text-[1.05rem] lg:leading-normal"
                  data-test="statistics-text"
                >
                  The last stock split was on {new Date(
                    rawData?.lastStockSplit,
                  ).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "Europe/Berlin",
                  })}. It was a
                  {rawData?.splitType}
                  split with a ratio of {rawData?.splitRatio}.
                </p>
                <table
                  class="w-full border border-gray-300 dark:border-gray-800"
                >
                  <tbody>
                    <PopupInfo
                      label="Last Split Date"
                      parameter="lastStockSplit"
                      value={new Date(rawData?.lastStockSplit).toLocaleString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "Europe/Berlin",
                        },
                      )}
                    />
                    <PopupInfo
                      label="Split Type"
                      value={rawData?.splitType}
                      parameter="splitType"
                    />
                    <PopupInfo
                      label="Split Ratio"
                      parameter="splitRatio"
                      value={rawData?.splitRatio}
                    />
                  </tbody>
                </table>
              </div>
            {/if}
            <div>
              <h2 class="mb-2 px-0.5 text-xl font-bold">Scores</h2>
              <table class="w-full border border-gray-300 dark:border-gray-800">
                <tbody>
                  <PopupInfo
                    label="Altman Z-Score"
                    parameter="altmanZScore"
                    value={rawData?.altmanZScore ?? "n/a"}
                  />
                  <PopupInfo
                    label="Piotroski F-Score"
                    parameter="piotroskiScore"
                    value={rawData?.piotroskiScore ?? "n/a"}
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      {:else}
        <Infobox text="No statistical data availabe right now." />
      {/if}
    </div>
  </div>
</section>
