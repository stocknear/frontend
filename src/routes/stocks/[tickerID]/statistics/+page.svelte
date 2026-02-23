<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import PopupInfo from "$lib/components/PopupInfo.svelte";
  import {
    stock_detail_stats_analyst_forecast,
    stock_detail_stats_analyst_text,
    stock_detail_stats_balance_sheet,
    stock_detail_stats_balance_sheet_text,
    stock_detail_stats_cash_flow,
    stock_detail_stats_cash_flow_text,
    stock_detail_stats_dividend_details,
    stock_detail_stats_dividend_text,
    stock_detail_stats_dividends_yields,
    stock_detail_stats_enterprise_valuation,
    stock_detail_stats_enterprise_value_text,
    stock_detail_stats_fair_value,
    stock_detail_stats_fair_value_text,
    stock_detail_stats_fair_value_text_fallback,
    stock_detail_stats_financial_efficiency,
    stock_detail_stats_financial_position,
    stock_detail_stats_financial_position_text,
    stock_detail_stats_financial_ratio_history,
    stock_detail_stats_full_balance_sheet,
    stock_detail_stats_full_cash_flow,
    stock_detail_stats_full_income_statement,
    stock_detail_stats_in_last_12_months,
    stock_detail_stats_income_statement,
    stock_detail_stats_margins,
    stock_detail_stats_margins_text,
    stock_detail_stats_no_data,
    stock_detail_stats_overview_seo_description,
    stock_detail_stats_overview_seo_title,
    stock_detail_stats_pe_ratio,
    stock_detail_stats_roe_text,
    stock_detail_stats_scores,
    stock_detail_stats_share_statistics,
    stock_detail_stats_shares_outstanding,
    stock_detail_stats_short_selling,
    stock_detail_stats_short_selling_info,
    stock_detail_stats_stock_price_statistics,
    stock_detail_stats_stock_price_text,
    stock_detail_stats_stock_split_text,
    stock_detail_stats_stock_splits,
    stock_detail_stats_taxes,
    stock_detail_stats_title,
    stock_detail_stats_valuation_ratios,
    stock_detail_stock_forecasts,
  } from "$lib/paraglide/messages";

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
  title={stock_detail_stats_overview_seo_title({
    company: $displayCompanyName,
    ticker: $stockTicker,
  })}
  description={stock_detail_stats_overview_seo_description({
    company: $displayCompanyName,
    ticker: $stockTicker,
  })}
/>

<section class="w-full text-gray-700 dark:text-zinc-200">
  <div class="sm:pb-7 sm:pt-7 sm:pl-7 m-auto mt-7 sm:mt-0">
    <div class="mb-6">
      {#if Object?.keys(rawData)?.length > 0}
        <div
          class="space-y-5 xs:space-y-6 md:grid md:grid-cols-3 md:space-x-16 sm:gap-x-5 md:space-y-0"
        >
          <div
            class="flex flex-col space-y-5 xs:space-y-6 md:space-y-8 w-full max-w-96"
          >
            <div class="flex items-start justify-between">
              <h1
                class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                {stock_detail_stats_title()}
              </h1>
            </div>

            <div>
              <h2
                class="mb-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-muted dark:text-white"
              >
                {stock_detail_stats_share_statistics()}
              </h2>
              <p
                class="mb-4 px-0.5 text-sm text-gray-600 dark:text-zinc-300 leading-relaxed"
              >
                {stock_detail_stats_shares_outstanding({
                  company: companyName,
                  shares: abbreviateNumber(rawData?.sharesOutStanding, false),
                  marketCap: abbreviateNumber(rawData?.marketCap, false),
                })}
              </p>
              <table
                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
              >
                <tbody>
                  <PopupInfo
                    class="text-sm"
                    label="Shares Outstanding"
                    parameter="sharesOutStanding"
                    value={rawData?.sharesOutStanding
                      ? abbreviateNumber(rawData?.sharesOutStanding)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="Shares Change (YoY)"
                    parameter="sharesYoY"
                    value={checkValue(rawData?.sharesYoY, "percent")}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="Shares Change (QoQ)"
                    parameter="sharesQoQ"
                    value={checkValue(rawData?.sharesQoQ, "percent")}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="Owned by Institutions (%)"
                    parameter="institutionalOwnership"
                    value={checkValue(
                      rawData?.institutionalOwnership,
                      "percent",
                    )}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="Shares Floating"
                    parameter="floatShare"
                    value={rawData?.floatShares
                      ? abbreviateNumber(rawData?.floatShares)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="Failed to Deliver (FTD) Shares"
                    parameter="failToDeliver"
                    value={rawData?.failToDeliver
                      ? rawData?.failToDeliver?.toLocaleString("en-US")
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
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
              <h2
                class="mb-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-muted dark:text-white"
              >
                {stock_detail_stats_short_selling_info()}
              </h2>
              {#if rawData?.sharesShort}
                <p
                  class="mb-4 px-0.5 text-sm text-gray-600 dark:text-zinc-300 leading-relaxed"
                >
                  {stock_detail_stats_short_selling({
                    company: companyName,
                    shortInterest: rawData?.shortOutstandingPercent,
                    sharesShort: abbreviateNumber(rawData?.sharesShort, false),
                    shortRatio: rawData?.shortRatio,
                  })}
                </p>
              {/if}
              <table
                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
              >
                <tbody>
                  <PopupInfo
                    class="text-sm"
                    label="Short Interest"
                    parameter="sharesShort"
                    value={rawData?.sharesShort
                      ? abbreviateNumber(rawData?.sharesShort)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="Short % of Shares Out"
                    parameter="shortOutstandingPercent"
                    value={rawData?.shortOutstandingPercent
                      ? rawData?.shortOutstandingPercent + "%"
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="Short % of Float"
                    parameter="shortFloatPercent"
                    value={rawData?.shortFloatPercent
                      ? rawData?.shortFloatPercent + "%"
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="Short Ratio (days to cover)"
                    parameter="shortRatio"
                    value={rawData?.shortRatio ? rawData?.shortRatio : "n/a"}
                  />
                </tbody>
              </table>
            </div>
            <div>
              <h2
                class="mb-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-muted dark:text-white"
              >
                {stock_detail_stats_valuation_ratios()}
              </h2>
              {#if rawData?.priceToEarningsRatio}
                <p
                  class="mb-4 px-0.5 text-sm text-gray-600 dark:text-zinc-300 leading-relaxed"
                >
                  {stock_detail_stats_pe_ratio({
                    peRatio: rawData?.priceToEarningsRatio,
                  })}
                </p>
              {/if}

              <table
                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
              >
                <tbody>
                  <PopupInfo
                    class="text-sm"
                    label="PE Ratio"
                    parameter="priceToEarningsRatio"
                    value={rawData?.priceToEarningsRatio ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="Forward PE"
                    parameter="forwardPE"
                    value={rawData?.forwardPE ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="PS Ratio"
                    parameter="priceToSalesRatio"
                    value={rawData?.priceToSalesRatio ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="Forward PS"
                    parameter="forwardPS"
                    value={rawData?.forwardPS ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="PB Ratio"
                    parameter="priceToBookRatio"
                    value={rawData?.priceToBookRatio ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="P/FCF Ratio"
                    parameter="priceToFreeCashFlowRatio"
                    value={rawData?.priceToFreeCashFlowRatio ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
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
                class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-3 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
              >
                {stock_detail_stats_financial_ratio_history()}
              </a>
            </div>
            <div>
              <h2
                class="mb-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-muted dark:text-white"
              >
                {stock_detail_stats_enterprise_valuation()}
              </h2>
              <p
                class="mb-4 px-0.5 text-sm text-gray-600 dark:text-zinc-300 leading-relaxed"
              >
                {#if rawData?.enterpriseValue !== null}
                  {stock_detail_stats_enterprise_value_text({
                    enterpriseValue: abbreviateNumber(
                      rawData?.enterpriseValue,
                      false,
                    ),
                  })}
                {/if}
              </p>
              <table
                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
              >
                <tbody>
                  <PopupInfo
                    class="text-sm"
                    label="EV / Sales"
                    parameter="evToSales"
                    value={rawData?.evToSales ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="EV / EBITDA"
                    parameter="evToEBITDA"
                    value={rawData?.evToEBITDA ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="EV / EBIT"
                    parameter="evToOperatingCashFlow"
                    value={rawData?.evToOperatingCashFlow ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="EV / FCF"
                    parameter="evToFreeCashFlow"
                    value={rawData?.evToFreeCashFlow ?? "n/a"}
                  />
                </tbody>
              </table>
            </div>
            <div>
              <h2
                class="mb-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-muted dark:text-white"
              >
                {stock_detail_stats_financial_position()}
              </h2>
              {#if rawData?.currentRatio}
                <p
                  class="mb-4 px-0.5 text-sm text-gray-600 dark:text-zinc-300 leading-relaxed"
                >
                  {stock_detail_stats_financial_position_text({
                    company: companyName,
                    currentRatio: rawData?.currentRatio,
                  })}
                </p>
              {/if}
              <table
                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
              >
                <tbody>
                  <PopupInfo
                    class="text-sm"
                    label="Current Ratio"
                    parameter="currentRatio"
                    value={rawData?.currentRatio ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="Quick Ratio"
                    parameter="quickRatio"
                    value={rawData?.quickRatio ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="debtToEquityRatio"
                    label="Debt / Equity"
                    value={rawData?.debtToEquityRatio ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="debtToEBITDARatio"
                    label="Debt / EBITDA"
                    value={rawData?.debtToEBITDARatio
                      ? abbreviateNumber(rawData?.debtToEBITDARatio)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="debtToFreeCashFlowRatio"
                    label="Debt / FCF"
                    value={rawData?.debtToFreeCashFlowRatio
                      ? abbreviateNumber(rawData?.debtToFreeCashFlowRatio)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="interestCoverageRatio"
                    label="Interest Coverage"
                    value={rawData?.interestCoverageRatio}
                  />
                </tbody>
              </table>
            </div>
            <div>
              <h2
                class="mb-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-muted dark:text-white"
              >
                {stock_detail_stats_financial_efficiency()}
              </h2>
              <p
                class="mb-4 px-0.5 text-sm text-gray-600 dark:text-zinc-300 leading-relaxed"
              >
                {stock_detail_stats_roe_text({
                  roe: rawData?.returnOnEquity ?? 0,
                  roic: rawData?.returnOnInvestedCapital ?? 0,
                })}
              </p>
              <table
                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
              >
                <tbody>
                  <PopupInfo
                    class="text-sm"
                    parameter="returnOnEquity"
                    label="Return on Equity"
                    value={checkValue(rawData?.returnOnEquity, "percent")}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="returnOnAssets"
                    label="Return on Assets"
                    value={checkValue(rawData?.returnOnAssets, "percent")}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="returnOnInvestedCapital"
                    label="Return on Invested Capital"
                    value={checkValue(
                      rawData?.returnOnInvestedCapital,
                      "percent",
                    )}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="revenuePerEmployee"
                    label="Revenue Per Employee"
                    value={rawData?.revenuePerEmployee
                      ? "$" + abbreviateNumber(rawData?.revenuePerEmployee)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="profitPerEmployee"
                    label="Profits Per Employee"
                    value={rawData?.profitPerEmployee
                      ? "$" + abbreviateNumber(rawData?.profitPerEmployee)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="employees"
                    label="Employee Count"
                    value={rawData?.employees?.toLocaleString("en-US")}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="assetTurnover"
                    label="Asset Turnover"
                    value={rawData?.assetTurnover ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
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
              <h2
                class="mb-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-muted dark:text-white"
              >
                {stock_detail_stats_taxes()}
              </h2>
              <table
                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
              >
                <tbody>
                  <PopupInfo
                    class="text-sm"
                    parameter="incomeTaxExpense"
                    label="Income Tax"
                    value={rawData?.incomeTaxExpense
                      ? abbreviateNumber(rawData?.incomeTaxExpense)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="effectiveTaxRate"
                    label="Effective Tax Rate"
                    value={checkValue(rawData?.effectiveTaxRate, "percent")}
                  />
                </tbody>
              </table>
            </div>
          </div>
          <div
            class="flex flex-col space-y-5 xs:space-y-6 md:space-y-8 w-full max-w-96"
          >
            <div class="mt-0 sm:mt-9 2xl:mt-0">
              <h2
                class="mb-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-muted dark:text-white"
              >
                {stock_detail_stats_stock_price_statistics()}
              </h2>
              <p
                class="mb-4 px-0.5 text-sm text-gray-600 dark:text-zinc-300 leading-relaxed"
              >
                {stock_detail_stats_stock_price_text({
                  changePercent: rawData?.change1Y,
                })}
              </p>
              <table
                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
              >
                <tbody>
                  <PopupInfo
                    class="text-sm"
                    parameter="beta"
                    label="Beta"
                    value={rawData?.beta}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="change1Y"
                    label="52-Week Price Change"
                    value={rawData?.change1Y ? rawData?.change1Y + "%" : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="sma50"
                    label="50-Day Moving Average"
                    value={rawData?.sma50 ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="sma200"
                    label="200-Day Moving Average"
                    value={rawData?.sma200 ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="rsi"
                    label="Relative Strength Index (RSI)"
                    value={rawData?.rsi ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
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
              <h2
                class="mb-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-muted dark:text-white"
              >
                {stock_detail_stats_income_statement()}
              </h2>
              <p
                class="mb-4 px-0.5 text-sm text-gray-600 dark:text-zinc-300 leading-relaxed"
              >
                {#if rawData?.revenue !== null && rawData?.revenue !== 0}
                  {stock_detail_stats_in_last_12_months({
                    company: companyName,
                    revenue: abbreviateNumber(rawData?.revenue, false),
                    earnings: abbreviateNumber(rawData?.netIncome, false),
                    eps: rawData?.eps,
                  })}
                {/if}
              </p>
              <table
                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
              >
                <tbody>
                  <PopupInfo
                    class="text-sm"
                    parameter="revenue"
                    label="Revenue"
                    value={rawData?.revenue !== 0 && rawData?.revenue !== null
                      ? abbreviateNumber(rawData?.revenue, false)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="grossProfit"
                    label="Gross Profit"
                    value={rawData?.grossProfit
                      ? abbreviateNumber(rawData?.grossProfit)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="operatingIncome"
                    label="Operating Income"
                    value={rawData?.operatingIncome
                      ? abbreviateNumber(rawData?.operatingIncome)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="netIncome"
                    label="Net Income"
                    value={rawData?.netIncome
                      ? abbreviateNumber(rawData?.netIncome)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="ebitda"
                    label="EBITDA"
                    value={rawData?.ebitda
                      ? abbreviateNumber(rawData?.ebitda)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="ebit"
                    label="EBIT"
                    value={rawData?.ebit !== 0 && rawData?.ebit !== null
                      ? abbreviateNumber(rawData?.ebit, false)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="eps"
                    label="Earnings Per Share (EPS)"
                    value={rawData?.eps ?? "n/a"}
                  />
                </tbody>
              </table>
              <a
                href={`/stocks/${$stockTicker}/financials`}
                class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-3 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
              >
                {stock_detail_stats_full_income_statement()}
              </a>
            </div>
            <div>
              <h2
                class="mb-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-muted dark:text-white"
              >
                {stock_detail_stats_balance_sheet()}
              </h2>
              {#if rawData?.cashAndCashEquivalents}
                <p
                  class="mb-4 px-0.5 text-sm text-gray-600 dark:text-zinc-300 leading-relaxed"
                >
                  {stock_detail_stats_balance_sheet_text({
                    company: companyName,
                    cash: abbreviateNumber(
                      rawData?.cashAndCashEquivalents,
                      false,
                    ),
                    totalAssets: abbreviateNumber(rawData?.totalAssets, false),
                    totalLiabilities: abbreviateNumber(
                      rawData?.totalDebt,
                      false,
                    ),
                  })}
                </p>
              {/if}
              <table
                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
              >
                <tbody>
                  <PopupInfo
                    class="text-sm"
                    parameter="cashAndCashEquivalents"
                    label="Cash &amp; Cash Equivalents"
                    value={rawData?.cashAndCashEquivalents
                      ? abbreviateNumber(rawData?.cashAndCashEquivalents)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="totalDebt"
                    label="Total Debt"
                    value={rawData?.totalDebt
                      ? abbreviateNumber(rawData?.totalDebt)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="netCash"
                    label="Net Cash"
                    value={rawData?.cashAndCashEquivalents && rawData?.totalDebt
                      ? abbreviateNumber(
                          rawData?.cashAndCashEquivalents - rawData?.totalDebt,
                        )
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="retainedEarnings"
                    label="Retained Earnings"
                    value={rawData?.retainedEarnings
                      ? abbreviateNumber(rawData?.retainedEarnings)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="totalAssets"
                    label="Total Assets"
                    value={rawData?.totalAssets
                      ? abbreviateNumber(rawData?.totalAssets)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
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
                class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-3 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
              >
                {stock_detail_stats_full_balance_sheet()}
              </a>
            </div>
            <div>
              <h2
                class="mb-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-muted dark:text-white"
              >
                {stock_detail_stats_cash_flow()}
              </h2>
              {#if rawData?.operatingCashFlow}
                <p
                  class="mb-4 px-0.5 text-sm text-gray-600 dark:text-zinc-300 leading-relaxed"
                >
                  {stock_detail_stats_cash_flow_text({
                    company: companyName,
                    operatingCashFlow: abbreviateNumber(
                      rawData?.operatingCashFlow,
                      false,
                    ),
                  })}
                </p>
              {/if}
              <table
                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
              >
                <tbody>
                  <PopupInfo
                    class="text-sm"
                    parameter="operatingCashFlow"
                    label="Operating Cash Flow"
                    value={rawData?.operatingCashFlow
                      ? abbreviateNumber(rawData?.operatingCashFlow)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="capitalExpenditure"
                    label="Capital Expenditures"
                    value={rawData?.capitalExpenditure
                      ? abbreviateNumber(rawData?.capitalExpenditure)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="freeCashFlow"
                    label="Free Cash Flow"
                    value={rawData?.freeCashFlow
                      ? abbreviateNumber(rawData?.freeCashFlow)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="freeCashFlowPerShare"
                    label="FCF Per Share"
                    value={rawData?.freeCashFlowPerShare ?? "n/a"}
                  />
                </tbody>
              </table>
              <a
                href={`/stocks/${$stockTicker}/financials/cash-flow`}
                class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-3 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
              >
                {stock_detail_stats_full_cash_flow()}
              </a>
            </div>
            <div>
              <h2
                class="mb-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-muted dark:text-white"
              >
                {stock_detail_stats_margins()}
              </h2>
              <p
                class="mb-4 px-0.5 text-sm text-gray-600 dark:text-zinc-300 leading-relaxed"
              >
                {#if rawData?.grossProfitMargin !== 0 && rawData?.grossProfitMargin !== null}
                  {stock_detail_stats_margins_text({
                    company: companyName,
                    grossMargin: rawData?.grossProfitMargin,
                    operatingMargin: rawData?.operatingProfitMargin,
                    netMargin: rawData?.netProfitMargin,
                  })}
                {/if}
              </p>
              <table
                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
              >
                <tbody>
                  <PopupInfo
                    class="text-sm"
                    parameter="grossProfitMargin"
                    label="Gross Margin"
                    value={rawData?.grossProfitMargin !== 0 &&
                    rawData?.grossProfitMargin !== null
                      ? checkValue(rawData?.grossProfitMargin, "percent")
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="operatingProfitMargin"
                    label="Operating Margin"
                    value={rawData?.operatingProfitMargin !== 0 &&
                    rawData?.operatingProfitMargin !== null
                      ? checkValue(rawData?.operatingProfitMargin, "percent")
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="pretaxProfitMargin"
                    label="Pretax Margin"
                    value={rawData?.pretaxProfitMargin !== 0 &&
                    rawData?.pretaxProfitMargin !== null
                      ? checkValue(rawData?.pretaxProfitMargin, "percent")
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="netProfitMargin"
                    label="Profit Margin"
                    value={rawData?.netProfitMargin !== 0 &&
                    rawData?.netProfitMargin !== null
                      ? checkValue(rawData?.netProfitMargin, "percent")
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="ebitdaMargin"
                    label="EBITDA Margin"
                    value={rawData?.ebitdaMargin !== 0 &&
                    rawData?.ebitdaMargin !== null
                      ? checkValue(rawData?.ebitdaMargin, "percent")
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="ebitMargin"
                    label="EBIT Margin"
                    value={rawData?.ebitMargin !== 0 &&
                    rawData?.ebitMargin !== null
                      ? checkValue(rawData?.ebitMargin, "percent")
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
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
            class="flex flex-col space-y-5 xs:space-y-6 md:space-y-8 w-full max-w-96"
          >
            <div class="mt-0 sm:mt-9 2xl:mt-0">
              <h2
                class="mb-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-muted dark:text-white"
              >
                {stock_detail_stats_dividends_yields()}
              </h2>
              <p
                class="mb-4 px-0.5 text-sm text-gray-600 dark:text-zinc-300 leading-relaxed"
              >
                {#if rawData?.annualDividend !== null && rawData?.dividendYield !== null}
                  {stock_detail_stats_dividend_text({
                    company: companyName,
                    annualDividend: rawData?.annualDividend,
                    dividendYield: rawData?.dividendYield,
                  })}
                {/if}
              </p>
              <table
                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
              >
                <tbody>
                  <PopupInfo
                    class="text-sm"
                    parameter="annualDividend"
                    label="Dividend Per Share"
                    value={rawData?.annualDividend !== null
                      ? "$" + rawData?.annualDividend?.toFixed(2)
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="dividendYield"
                    label="Dividend Yield"
                    value={rawData?.dividendYield !== null
                      ? rawData?.dividendYield + "%"
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="dividendGrowth"
                    label="Dividend Growth (YoY)"
                    value={rawData?.dividendGrowth !== null
                      ? rawData?.dividendGrowth + "%"
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="payoutRatio"
                    label="Payout Ratio"
                    value={rawData?.payoutRatio !== null
                      ? rawData?.payoutRatio + "%"
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="earningsYield"
                    label="Earnings Yield"
                    value={rawData?.earningsYield !== null
                      ? checkValue(rawData?.earningsYield, "percent")
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
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
                class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-3 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
              >
                {stock_detail_stats_dividend_details()}
              </a>
            </div>
            <div>
              <h2
                class="mb-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-muted dark:text-white"
              >
                {stock_detail_stats_analyst_forecast()}
              </h2>
              <p
                class="mb-4 px-0.5 text-sm text-gray-600 dark:text-zinc-300 leading-relaxed"
                data-test="statistics-text"
              >
                {#if rawData?.priceTarget && rawData?.upside && rawData?.analystRating}
                  {stock_detail_stats_analyst_text({
                    numAnalysts: rawData?.analystCounter,
                    company: companyName,
                    priceTarget: rawData?.priceTarget,
                    rating: rawData?.analystRating,
                  })}
                {/if}
              </p>
              <table
                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
              >
                <tbody>
                  <PopupInfo
                    class="text-sm"
                    parameter="priceTarget"
                    label="Price Target"
                    value={rawData?.priceTarget !== null
                      ? "$" + rawData?.priceTarget
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="upside"
                    label="Price Target Difference"
                    value={rawData?.upside !== null
                      ? rawData?.upside + "%"
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="analystRating"
                    label="Analyst Consensus"
                    value={rawData?.analystRating ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    parameter="analystCounter"
                    label="Analyst Count"
                    value={rawData?.analystCounter ?? "n/a"}
                  />
                </tbody>
              </table>
              <a
                href={`/stocks/${$stockTicker}/forecast/analyst`}
                class="flex justify-center items-center rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-pointer w-full py-2.5 mt-3 text-sm text-center font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/40"
              >
                {stock_detail_stock_forecasts()}
              </a>
            </div>
            <div>
              <h2
                class="mb-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-muted dark:text-white"
              >
                {stock_detail_stats_fair_value()}
              </h2>
              <p
                class="mb-4 px-0.5 text-sm text-gray-600 dark:text-zinc-300 leading-relaxed"
              >
                {#if rawData?.grahamNumber && rawData?.grahamUpside !== null && rawData?.grahamUpside !== undefined}
                  {stock_detail_stats_fair_value_text({
                    grahamNumber: `$${rawData?.grahamNumber}`,
                    grahamUpside: `${rawData?.grahamUpside}%`,
                  })}
                {:else}
                  {stock_detail_stats_fair_value_text_fallback()}
                {/if}
              </p>
              <table
                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
              >
                <tbody>
                  <PopupInfo
                    class="text-sm"
                    label="Lynch Fair Value"
                    parameter="lynchFairValue"
                    value={rawData?.lynchFairValue
                      ? "$" + rawData?.lynchFairValue
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="Lynch Upside"
                    parameter="lynchUpside"
                    value={rawData?.lynchUpside
                      ? rawData?.lynchUpside + "%"
                      : "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
                    label="Graham Number"
                    parameter="grahamNumber"
                    value={rawData?.grahamNumber ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
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
                <h2
                  class="mb-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-muted dark:text-white"
                >
                  {stock_detail_stats_stock_splits()}
                </h2>
                <p
                  class="mb-4 px-0.5 text-sm text-gray-600 dark:text-zinc-300 leading-relaxed"
                  data-test="statistics-text"
                >
                  {stock_detail_stats_stock_split_text({
                    splitType: rawData?.splitType,
                    splitRatio: rawData?.splitRatio,
                    splitDate: new Date(rawData?.lastStockSplit).toLocaleString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        timeZone: "Europe/Berlin",
                      },
                    ),
                  })}
                </p>
                <table
                  class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
                >
                  <tbody>
                    <PopupInfo
                      class="text-sm"
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
                      class="text-sm"
                      label="Split Type"
                      value={rawData?.splitType}
                      parameter="splitType"
                    />
                    <PopupInfo
                      class="text-sm"
                      label="Split Ratio"
                      parameter="splitRatio"
                      value={rawData?.splitRatio}
                    />
                  </tbody>
                </table>
              </div>
            {/if}
            <div>
              <h2
                class="mb-2 px-0.5 text-sm font-semibold uppercase tracking-wide text-muted dark:text-white"
              >
                {stock_detail_stats_scores()}
              </h2>
              <table
                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 overflow-hidden text-sm text-gray-700 dark:text-zinc-200 tabular-nums"
              >
                <tbody>
                  <PopupInfo
                    class="text-sm"
                    label="Altman Z-Score"
                    parameter="altmanZScore"
                    value={rawData?.altmanZScore ?? "n/a"}
                  />
                  <PopupInfo
                    class="text-sm"
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
        <Infobox text={stock_detail_stats_no_data()} />
      {/if}
    </div>
  </div>
</section>
