<script lang="ts">
  import { Button } from "$lib/components/shadcn/button/index.js";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import {
    stock_detail_financials_popular,
    stock_detail_financials_popular_profitability,
    stock_detail_financials_popular_cash_flow,
    stock_detail_financials_popular_valuation,
    stock_detail_financials_popular_debt_liquidity,
    stock_detail_financials_popular_shareholder_returns,
    stock_detail_financials_popular_balance_sheet,
    stock_detail_financials_popular_efficiency,
  } from "$lib/paraglide/messages";

  export let onApply: (presetKeys: string[], indicatorIds: string[]) => void = () => {};

  interface PopularPreset {
    label: string;
    presetKeys: string[];
    indicatorIds: string[];
  }

  const POPULAR_PRESETS: PopularPreset[] = [
    {
      label: stock_detail_financials_popular_profitability(),
      presetKeys: ["stockPrice", "revenueToProfit", "margins", "expenses"],
      indicatorIds: ["eps"],
    },
    {
      label: stock_detail_financials_popular_cash_flow(),
      presetKeys: ["cashFlowBreakdown", "cashGeneration", "capitalAllocation"],
      indicatorIds: [],
    },
    {
      label: stock_detail_financials_popular_valuation(),
      presetKeys: ["stockPrice"],
      indicatorIds: [
        "pe_ratio",
        "ratio_priceToSalesRatio",
        "ratio_priceToBookRatio",
        "ev_ebitda",
        "ratio_priceToFreeCashFlowRatio",
        "ratio_freeCashFlowYield",
      ],
    },
    {
      label: stock_detail_financials_popular_debt_liquidity(),
      presetKeys: ["cashAndDebt", "debtStructure", "workingCapital"],
      indicatorIds: [
        "ratio_currentRatio",
        "ratio_debtToEquityRatio",
        "ratio_interestCoverageRatio",
      ],
    },
    {
      label: stock_detail_financials_popular_shareholder_returns(),
      presetKeys: ["shareDilution"],
      indicatorIds: [
        "cashflow_commonStockRepurchased",
        "cashflow_commonDividendsPaid",
        "ratio_dividendYieldPercentage",
        "ratio_dividendPayoutRatio",
      ],
    },
    {
      label: stock_detail_financials_popular_balance_sheet(),
      presetKeys: ["assetsVsLiabilities", "workingCapital", "cashAndDebt"],
      indicatorIds: [
        "balance_totalDebt",
        "balance_netDebt",
        "balance_retainedEarnings",
      ],
    },
    {
      label: stock_detail_financials_popular_efficiency(),
      presetKeys: [],
      indicatorIds: [
        "ratio_returnOnEquity",
        "ratio_returnOnAssets",
        "ratio_returnOnInvestedCapital",
        "ratio_assetTurnover",
        "ratio_receivablesTurnover",
        "ratio_inventoryTurnover",
      ],
    },
  ];
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild let:builder>
    <Button
      builders={[builder]}
      class="cursor-pointer min-w-fit transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row items-center px-2 sm:px-3 py-2 rounded-full disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <span class="text-[0.85rem] sm:text-sm">{stock_detail_financials_popular()}</span>
      <svg
        class="ml-0.5 mt-0.5 h-5 w-5 inline-block shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
        style="max-width:40px"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </Button>
  </DropdownMenu.Trigger>

  <DropdownMenu.Content
    side="bottom"
    align="end"
    sideOffset={10}
    alignOffset={0}
    class="w-56 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
  >
    {#each POPULAR_PRESETS as preset}
      <DropdownMenu.Item
        class="hover:bg-gray-100 dark:hover:bg-zinc-800/80 rounded-lg cursor-pointer"
        on:click={() => onApply(preset.presetKeys, preset.indicatorIds)}
      >
        <span class="text-sm">{preset.label}</span>
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
