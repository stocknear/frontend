<script lang="ts">
import { Chart } from 'svelte-echarts'
import {numberOfUnreadNotification, displayCompanyName, stockTicker} from '$lib/store';
import { abbreviateNumber } from '$lib/utils';
//import * as XLSX from 'xlsx';

import { init, use } from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
use([LineChart, BarChart, GridComponent, TooltipComponent, CanvasRenderer])


    export let data;
    
    
    
    let balanceSheet = [];
    let fullStatement = [];
    let tableList = [];
    let filterRule = 'annual';
    let optionsData;
    
    
    let displayStatement = 'cashAndCashEquivalents';
        
    
    let mode = true;
    let timeFrame = '10Y';
        
    
    const statementConfig = [
        {
            propertyName: 'cashAndCashEquivalents',
            growthPropertyName: 'growthCashAndCashEquivalents',
            label: 'Cash & Equivalents',
            text: "Cash and equivalents is the amount of money on the company's accounts held as straight cash, or very liquid assets that can be sold for cash at a very short notice.",
        },
        {
            propertyName: 'shortTermInvestments',
            growthPropertyName: 'growthShortTermInvestments',
            label: 'Short-Term Investments',
            text: "Short-term investments are liquid assets like treasury bills, short-term bonds, money-market funds, marketable securities and other investments that can be sold for cash at a short notice.",
        },
        {
                propertyName: 'longTermInvestments',
                growthPropertyName: 'growthLongTermInvestments',
                label: 'Long-Term Investments',
                text: "Long-term investments are investments that the company plans to hold for more than one year. It can include stocks, bonds, real estate and others.",
        },
        {       propertyName: 'otherNonCurrentAssets',
                growthPropertyName: 'growthOtherNonCurrentAssets',
                label: 'Other Long-Term Assets',
                text: "Other long-term assets include all long-term assets that do not fit into any of the categories mentioned so far.",
        },
        {
                propertyName: 'netReceivables',
                growthPropertyName: 'growthNetReceivables',
                label: 'Receivables',
                text: "Receivables are the money owed to the company for products or services that have been delivered but not yet paid for. If a customer buys something on credit, it is listed under receivables (as a current asset) on the balance sheet.",
        },
        {
                propertyName: 'inventory',
                growthPropertyName: 'growthInventory',
                label: 'Inventory',
                text: "Inventory is the value of product that is available for sale, as well as the value of purchased raw materials for making goods that will be sold. It also includes goods that are currently being produced from raw materials.",
        },
        {
                propertyName: 'otherCurrentAssets',
                growthPropertyName: 'growthOtherCurrentAssets',
                label: 'Other Current Assets',
                text: "Other current assets includes all current assets that do not fit into any of the categories mentioned so far.",
        },
        {
                propertyName: 'totalCurrentAssets',
                growthPropertyName: 'growthTotalCurrentAssets',
                label: 'Total Current Assets',
                text: "Total current assets includes all current assets, including cash and equivalents, short-term investments, receivables, inventory and others. Current assets are things that easily be sold for cash or will be used within one year.",
        },
        {
                propertyName: 'propertyPlantEquipmentNet',
                growthPropertyName: 'growthPropertyPlantEquipmentNet',
                label: 'Property-Plant & Equipment',
                text: "Property, Plant & Equipment are all long-term tangible or physical assets that are needed for business operations. It includes buildings, factories, machinery, furniture and others."
        },
        {
                propertyName: 'goodwillAndIntangibleAssets',
                growthPropertyName: 'growthGoodwillAndIntangibleAssets',
                label: 'Goodwill & Intangibles',
                text: "Includes goodwill and other assets that are intangible. Intangible assets are assets that provide some benefit for the company, but they are not physical assets that can be measured or counted. Examples include patents, intellectual property and copyrights.",
        },
        {
                propertyName: 'totalNonCurrentAssets',
                growthPropertyName: 'growthTotalNonCurrentAssets',
                label: 'Total Long-Term Assets',
                text: "Total long-term assets includes all long-term assets, including Property-Plant & Equipment, goodwill, intangibles and others. Long-term (non-current) assets are things that can not be sold for cash easily or are considered to last for more than one year."
        },
        {
                propertyName: 'totalAssets',
                growthPropertyName: 'growthTotalAssets',
                label: 'Total Assets',
                text: "Total assets is the sum of all current and non-current assets on the balance sheet. Assets are everything that the company owns.",
        },
        {
                propertyName: 'accountPayables',
                growthPropertyName: 'growthAccountPayables',
                label: 'Account Payables',
                text: "Accounts payable is the amount that the company owes to vendors and suppliers. The company has purchased products or services on credit, but has not paid for them yet.",
        },
        {
                propertyName: 'deferredRevenue',
                growthPropertyName: 'growthDeferredRevenue',
                label: 'Deferred Revenue',
                text: "Deferred revenue includes payments that have been received in advance for products and services that have not yet been delivered. These revenues are listed as a liability on the company's balance sheet.",
        },
        {
                propertyName: 'shortTermDebt',
                growthPropertyName: 'growthShortTermDebt',
                label: 'Short-Term Debt',
                text: "Current debt is company debt that needs to be paid within one year. It also includes the portion of long-term debt that is due within a year.",
        },
        {
                propertyName: 'otherCurrentLiabilities',
                growthPropertyName: 'growthOtherCurrentLiabilities',
                label: 'Other Current Liabilities',
                text: "Other current liabilities are all current liabilities that do not fit into the categories above.",
        },
        {
                propertyName: 'totalCurrentLiabilities',
                growthPropertyName: 'growthTotalCurrentLiabilities',
                label: 'Total Current Liabilities',
                text: "Total current liabilities are all financial obligations that the company owes and are due within one year. This includes accounts payable, deferred revenue, current debt and others.",
        },
        {
                propertyName: 'longTermDebt',
                growthPropertyName: 'growthLongTermDebt',
                label: 'Long-Term Debt',
                text: "Long-term debt is debt that the company does not need to pay until after one year or more. It includes bank loans and bonds issued by the company.",
        },
        {
                propertyName: 'otherNonCurrentLiabilities',
                growthPropertyName: 'growthOtherNonCurrentLiabilities',
                label: 'Other Long-Term Liabilities',
                text: "Other long-term liabilities are all long-term (non-current) liabilities that are not categorized as long-term debt.",
        },
        {
                propertyName: 'totalNonCurrentLiabilities',
                growthPropertyName: 'growthTotalNonCurrentLiabilities',
                label: 'Total Long-Term Liabilities',
                text: "Total long-term liabilities are all long-term (non-current) financial obligations of the company, including long-term debt and others.",
        },
        {
                propertyName: 'totalLiabilities',
                growthPropertyName: 'growthTotalLiabilities',
                label: 'Total Liabilities',
                text: "Total liabilities are all financial obligations of the company, including both current and long-term (non-current) liabilities. Liabilities are everything that the company owes.",
        },
        {
                propertyName: 'totalDebt',
                growthPropertyName: 'growthTotalDebt',
                label: 'Total Debt',
                text: "Total debt is the total amount of liabilities categorized as debt on the balance sheet. It includes both current and long-term (non-current) debt.",
        },
        {
                propertyName: 'commonStock',
                growthPropertyName: 'growthCommonStock',
                label: 'Common Stock',
                text: "Common stock is the par value of the company's outstanding common stock, multiplied by the par value. This information is not very useful as the par value is usually set as an arbitrary amount of one cent.",
        },
        {
                propertyName: 'retainedEarnings',
                growthPropertyName: 'growthRetainedEarnings',
                label: 'Retained Earnings',
                text: "Retained earnings are net income previously earned that has not been paid out to shareholders as dividends. If retained earnings are negative, they can be listed as Accumulated Deficit instead.",
        },
        {
                propertyName: 'accumulatedOtherComprehensiveIncomeLoss',
                growthPropertyName: 'growthAccumulatedOtherComprehensiveIncomeLoss',
                label: 'Comprehensive Income',
                text: "Comprehensive income includes unrealized gains and losses that do not fall under retained earnings.",
        },
        {
                propertyName: 'totalStockholdersEquity',
                growthPropertyName: 'growthTotalStockholdersEquity',
                label: 'Shareholders Equity',
                text: "Shareholders’ equity is also called book value or net worth. It can be seen as the amount of money held by investors inside the company. It is calculated by subtracting all liabilities from all assets.",
        },
        {
                propertyName: 'totalInvestments',
                growthPropertyName: 'growthTotalInvestments',
                label: 'Total Investments',
                text: "Total Investments encompass all a company's financial assets, such as stocks, bonds, and real estate, reflecting its financial health and growth potential. Calculated by summing up these asset values, it's a key indicator of a company's financial strength.",
        }
    ];
    
let namingList = statementConfig?.map(config => config?.propertyName) || [];

        
    function toggleMode()
    {
        mode = !mode;
    }
        
        
                
                    
                    
    function changeStatement(event)
    
    {
    
        displayStatement = event.target.value;
    
    }
    
function normalizer(value) {
  if (Math?.abs(value) >= 1e18) {
    return { unit: 'Q', denominator: 1e18 };
  } else if (Math?.abs(value) >= 1e12) {
    return { unit: 'T', denominator: 1e12 };
  } else if (Math?.abs(value) >= 1e9) {
    return { unit: 'B', denominator: 1e9 };
  } else if (Math?.abs(value) >= 1e6) {
    return { unit: 'M', denominator: 1e6 };
  } else if (Math?.abs(value) >= 1e5) {
    return { unit: 'K', denominator: 1e5 };
  } else {
    return { unit: '', denominator: 1 };
  }
}  
     
    function plotData()
    {
    
        let labelName = '-';
        let xList = [];
        let valueList = [];
        tableList = [];
        
        const index = statementConfig?.findIndex((item) => item?.propertyName === displayStatement);
    
        for (let i = balanceSheet?.length - 1; i >= 0; i--) {
            const statement = balanceSheet[i];
            const year = statement?.calendarYear?.slice(-2);
            const quarter = statement?.period;

            // Determine the label based on filterRule
            if (filterRule === 'annual') {
                xList.push('FY' + year);
            } else {
                xList.push('FY' + year + ' ' + quarter);
            }

            // Calculate the value and growth
            const value = (Number(statement[statementConfig[index]?.propertyName]))?.toFixed(2);

            valueList.push(value);

            // Add the entry to tableList
            tableList.push({
                'date': statement?.date,
                'value': value,
            });
        }

    //sort tableList by date
    tableList?.sort((a, b) => new Date(b?.date) - new Date(a?.date));
    
        labelName =statementConfig[index]?.label;
    
    
        const {unit, denominator } = normalizer(Math.max(...valueList) ?? 0)
    
    
        const options = {
        animation: false,
        grid: {
        left: '0%',
        right: '0%',
        bottom: '2%',
        top: '10%',
        containLabel: true
        },
        xAxis: {
        axisLabel: {
            color: '#fff',
        },
        data: xList,
        type: 'category',
        },
        yAxis: [
        {
            type: 'value',
            splitLine: {
            show: false, // Disable x-axis grid lines
            },
            axisLabel: {
            color: '#fff', // Change label color to white
            formatter: function (value) {
                return '$'+(value / denominator)?.toFixed(1) + unit; // Format value in millions
                },
            },
        },
        {
            type: 'value',
            splitLine: {
            show: false, // Disable x-axis grid lines
            },
        },
        ],
        series: [
        {
            name: labelName,
            data: valueList,
            type: 'bar',
            smooth: true,
        },
        ],
        tooltip: {
            trigger: 'axis',
            hideDelay: 100,
        },
    };
    
        return options;
    }

/*
const exportData = (format = 'csv') => {
    const data = fullStatement;
    if (!data || data.length === 0) {
        return;
    }

    let properties = [
        { key: "calendarYear", label: "Year" },
    ];

    for (let i = 0; i < statementConfig?.length; i++) {
        properties.push({ key: statementConfig[i]?.propertyName, label: statementConfig[i]?.label })
    }

    // Helper function to handle special cases


    // Create rows for CSV/Excel
    let rows = data.map(item => properties?.map(property => item[property?.key] || 0));
    
    // Include headers
    const headers = properties?.map(prop => prop?.label);
    rows?.unshift(headers);


    // Check the format to export
    if (format?.toLowerCase() === 'csv') {
        const csvContent = rows?.map(row => row.join(","))?.join("\n");
        const blob = new Blob([csvContent], { type: "data:text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = $stockTicker?.toLowerCase() + "-balance-sheet-statement.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else if (format?.toLowerCase() === 'excel') {
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Balance Sheet Statement");
        XLSX.writeFile(workbook, `${$stockTicker.toLowerCase()}-balance-sheet-statement.xlsx`);
    }
};
*/

    
    

    
    fullStatement = data?.getBalanceSheetStatement;
    timeFrame = '10Y';
    displayStatement = 'cashAndCashEquivalents';
    
    const getCurrentYear = () => new Date()?.getFullYear();

const filterStatement = (fullStatement, timeFrame) => {
  const currentYear = getCurrentYear();
  
  switch(timeFrame) {
    case '5Y':
      return fullStatement?.filter(item => currentYear - parseInt(item?.calendarYear) < 5);
    case '10Y':
      return fullStatement?.filter(item => currentYear - parseInt(item?.calendarYear) < 10);
    default:
      return fullStatement;
  }
};

$: {
    if (timeFrame || displayStatement || filterRule)
    {   
        if (filterRule === 'annual') {
            
            fullStatement = data?.getBalanceSheetStatement?.annual
        }
        else {
            fullStatement = data?.getBalanceSheetStatement?.quarter
        }
        
        balanceSheet = filterStatement(fullStatement, timeFrame);
    
        if (mode === true)
        {
            optionsData= plotData()
        }
        
    }

}


            
</script>


<svelte:head>

<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {$displayCompanyName} ({$stockTicker}) Balance Sheet &#183 stocknear
</title>
<meta name="description" content={`Detailed balance sheet for ${$displayCompanyName} (${$stockTicker}), including cash, debt, assets, liabilities, and book value.`} />

<!-- Other meta tags -->
<meta property="og:title" content={`${$displayCompanyName} (${$stockTicker}) Balance Sheet &#183 stocknear`}/>
<meta property="og:description" content={`Detailed balance sheet for ${$displayCompanyName} (${$stockTicker}), including cash, debt, assets, liabilities, and book value.`} />
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`${$displayCompanyName} (${$stockTicker}) Balance Sheet &#183 stocknear`}/>
<meta name="twitter:description" content={`Detailed balance sheet for ${$displayCompanyName} (${$stockTicker}), including cash, debt, assets, liabilities, and book value.`} />
<!-- Add more Twitter meta tags as needed -->

</svelte:head>
    
                    
    <section class="bg-[#09090B] overflow-hidden text-white h-full pb-40 sm:mb-0">
        <div class="flex justify-center w-full m-auto h-full overflow-hidden">
            <div class="relative flex justify-center items-center overflow-hidden">
                <main class="w-full">
                    <div class="sm:p-7 m-auto mt-2 sm:mt-0">
                        <div class="mb-3">
                            <h1 class="text-2xl text-gray-200 font-bold">
                                {#if mode}
                                {statementConfig?.find((item) => item?.propertyName === displayStatement)?.label}
                                {:else}
                                    Balance Sheet {filterRule === 'annual' ? '(Annual)' : '(Quarter)'}
                                {/if}
                            </h1>
                        </div>
    
    
                        <div class="grid grid-cols-1 gap-2">
                            <div class="text-white p-3 sm:p-5 mb-10 rounded-lg sm:flex sm:flex-row sm:items-center border border-slate-800 text-sm sm:text-[1rem]">
                            
                                <svg class="w-6 h-6 flex-shrink-0 inline-block sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                                
                                {#if mode}
                                    {statementConfig?.find((item) => item?.propertyName === displayStatement)?.text}                                
                                    <!--<Katex formula={true} math={"\\textrm{Revenue}=\\textrm{Revenue} - \\textrm{All Expenses}"}/>-->
                                {:else}
                                    Get detailed breakdowns of the balance-sheet with total debts, total investments, and much more.
                                {/if}
                            </div>
    
    

                            <div class="mb-2 flex flex-row items-center w-full justify-end sm:justify-center">
    
                    
                            <label class="inline-flex mt-2 sm:mt-0 cursor-pointer relative mr-auto">
                                <input on:click={toggleMode} type="checkbox" checked={mode} value={mode} class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-400 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1563F9]"></div>
                                {#if mode}
                                <span class="ml-2 text-sm font-medium text-white">
                                    Cool Mode
                                </span>
                                {:else}
                                <span class="ml-2 text-sm font-medium text-white">
                                    Boring Mode
                                </span>
                                {/if}
                            </label>
        
        
                            <label for="timeFrameModal" class="cursor-pointer bg-[#27272A] sm:hover:bg-[#313131] duration-100 transition ease-in-out px-4 py-1.5 rounded-lg shadow-md">
                                <div class="flex flex-row items-center">
                                    <span class="m-auto mr-0.5 text-white text-sm">{timeFrame}</span>
                                    <svg class="inline-block w-4 h-4 ml-1 mt-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><g transform="rotate(180 512 512)">                                        <path fill="#fff" d="m488.832 344.32l-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872l319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z"/></g></svg>
                                </div>
                            </label>


                            <!--
                            <label for="exportDataModal" class="ml-3 mr-2 sm:mr-0 cursor-pointer bg-[#09090B] sm:hover:bg-[#313131] duration-100 transition ease-in-out px-4 py-1.5 rounded-lg shadow-md">
                                <div class="flex flex-row items-center">
                                    <span class="m-auto mr-0.5 text-white text-sm">Export</span>
                                    <svg class="inline-block w-4 h-4 ml-1 mt-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><g transform="rotate(180 512 512)">                                        <path fill="#fff" d="m488.832 344.32l-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872l319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z"/></g></svg>
                                </div>
                            </label>
                            -->

                        </div>

                        <ul class="text-[0.8rem] font-medium text-center w-56 pt-3 sm:w-56 mb-5 flex justify-center sm:justify-end items-center ml-auto">
                            <li class="w-full">
                                <label on:click={() => filterRule = 'annual'} class="cursor-pointer rounded-l-lg inline-block w-full py-2.5 text-white {filterRule === 'annual' ? 'bg-purple-600' : 'bg-[#2A303C]'} font-semibold border-r border-gray-600" aria-current="page">
                                  Annual
                                </label>
                            </li>
                            <li class="w-full">
                              {#if data?.user?.tier === 'Pro'}
                                <label on:click={() => filterRule = 'quartely'} class="cursor-pointer inline-block w-full py-2.5 {filterRule === 'quartely' ? 'bg-purple-600' : 'bg-[#2A303C]'} font-semibold text-white rounded-r-lg">
                                  Quartely
                                </label>
                              {:else}
                              <a href="/pricing" class="flex flex-row items-center m-auto justify-center cursor-pointer inline-block w-full py-2.5 bg-[#2A303C] font-semibold text-white rounded-r-lg">
                                <span class="">Quarterly</span>
                                <svg class="ml-1 -mt-0.5 w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#A3A3A3" d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"/></svg>
                              </a>
                              {/if}

                            </li>
                          </ul>
    
                                {#if mode}
                                    <div class="w-full max-w-3xl">
                                        <div class="relative">
                                        <select class="select select-bordered select-sm p-0 pl-5 overflow-y-auto bg-[#2A303C]" on:change={changeStatement}>
                                            <option disabled>Choose an Income Variable</option>
                                            <option value="cashAndCashEquivalents" selected>Cash & Equivalents</option>
                                            <option value="shortTermInvestments">Short-Term Investments</option>
                                            <option value="longTermInvestments">Long-Term Investments</option>
                                            <option value="otherNonCurrentAssets">Other Long-Term Assets</option>
                                            <option value="netReceivables">Receivables</option>
                                            <option value="inventory">Inventory</option>
                                            <option value="otherCurrentAssets">Other Current Assets</option>
                                            <option value="totalCurrentAssets">Total Current Assets</option>
                                            <option value="propertyPlantEquipmentNet">Property, Plant & Equipment</option>
                                            <option value="goodwillAndIntangibleAssets">Goodwill & Intangibles</option>
                                            <option value="totalNonCurrentAssets">Total Long-Term Assets</option>
                                            <option value="totalAssets">Total Assets</option>
                                            <option value="accountPayables">Account Payables</option>
                                            <option value="deferredRevenue">Deferred Revenue</option>
                                            <option value="shortTermDebt">Short-Term Debt</option>
                                            <option value="otherCurrentLiabilities">Other Current Liabilities</option>
                                            <option value="totalCurrentLiabilities">Total Current Liabilities</option>
                                            <option value="longTermDebt">Long-Term Debt</option>
                                            <option value="otherNonCurrentLiabilities">Other Long-Term Liabilities</option>
                                            <option value="totalNonCurrentLiabilities">Total Long-Term Liabilities</option>
                                            <option value="totalLiabilities">Total Liabilities</option>
                                            <option value="totalDebt">Total Debt</option>
                                            <option value="commonStock">Common Stock</option>
                                            <option value="retainedEarnings">Retained Earnigns</option>
                                            <option value="accumulatedOtherComprehensiveIncomeLoss">Comprehensive Income</option>
                                            <option value="totalStockholdersEquity">Shareholders' Equity</option>
                                            <option value="totalInvestments">Total Investments</option>
                                            
                                        </select>
                                        </div>
                                    </div>
                        
                                    <div class="app w-full">
                                        <Chart {init} options={optionsData} class="chart" />
                                    </div>
                                    
                                    <h2 class="mt-5 text-2xl text-gray-200 font-semibold">
                                        {statementConfig?.find((item) => item?.propertyName === displayStatement)?.label} History
                                    </h2>
        
        
                                    <div class="w-full overflow-x-scroll">         
                                        <table class="table table-sm table-compact rounded-none sm:rounded-md w-full border-bg-[#09090B] m-auto mt-4 ">
                                            <thead>
                                              <tr class="border border-slate-800">
                                                <th class="text-white font-semibold text-start text-sm sm:text-[1rem]">{filterRule === 'annual' ? 'Fiscal Year End' : 'Quarter Ends'}</th>
                                                <th class="text-white font-semibold text-end text-sm sm:text-[1rem]">{statementConfig?.find((item) => item?.propertyName === displayStatement)?.label}</th>
                                                <th class="text-white font-semibold text-end text-sm sm:text-[1rem]">Change</th>
                                                <th class="text-white font-semibold text-end text-sm sm:text-[1rem]">Growth</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {#each tableList as item, index}
                                                  <!-- row -->
                                                  <tr class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B] shake-ticker cursor-pointer">
                                                  
                                                      <td class="text-white font-medium text-sm sm:text-[1rem] whitespace-nowrap border-b-[#09090B]">
                                                      {item?.date}
                                                      </td>
          
                                                      <td class="text-white text-sm sm:text-[1rem] text-right whitespace-nowrap border-b-[#09090B]">
                                                      {abbreviateNumber(item?.value)}
                                                      </td>
          
                                                      <td class="text-white text-sm sm:text-[1rem] whitespace-nowrap font-medium text-end border-b-[#09090B]">
                                                          {item?.value-tableList[index+1]?.value !== 0 ? abbreviateNumber((item?.value-tableList[index+1]?.value)?.toFixed(2)) : '-'}
                                                      </td>
          
                                                      <td class="text-white text-sm sm:text-[1rem] whitespace-nowrap font-medium text-end border-b-[#09090B]">
                                                        {#if index + 1 - tableList?.length === 0}
                                                            -
                                                        {:else}
                                                            {#if (item?.value === 0 && tableList[index+1]?.value < 0)}
                                                                <span class="text-[#FF2F1F]">-100.00%</span>
                                                            {:else if (item?.value === 0 && tableList[index+1]?.value > 0)}
                                                                <span class="text-[#10DB06]">100.00%</span>
                                                            {:else if ((item?.value - tableList[index+1]?.value) > 0)}
                                                                <span class="text-[#10DB06]">
                                                                    {(((item?.value - tableList[index+1]?.value) / Math.abs(item?.value)) * 100)?.toFixed(2)}%
                                                                </span>
                                                            {:else if ((item?.value - tableList[index+1]?.value) < 0)}
                                                                <span class="text-[#FF2F1F]">
                                                                    -{(Math?.abs((tableList[index+1]?.value - item?.value) / Math.abs(item?.value)) * 100)?.toFixed(2)}%
                                                                </span>
                                                            {:else}
                                                                -
                                                            {/if}
                                                        {/if}
                                                    </td>
          
                                                  </tr>
                                                  {/each}
          
                                            </tbody>
                                          </table>
                            
                                            
                                    </div>

                                    {:else}
                                    
                                
                                        <div class="w-full rounded-none sm:rounded-lg m-auto overflow-x-auto">
                                            <table class="table w-full">
                                                <thead>
                                                    <tr class="text-white ">
                                                        <td class="text-start border-r border-[#191E24] bg-[#09090B] text-white text-sm sm:text-[1rem] font-bold pr-10">Year</td>
                                                        {#each balanceSheet as balance}
                                                        {#if filterRule === 'annual'}
                                                            <td class="bg-[#09090B] font-semibold pr-5 sm:pr-14 text-sm">
                                                                {'FY'+balance?.calendarYear?.slice(-2)}
                                                            </td>
                                                        {:else}
                                                            <td class="bg-[#09090B] font-semibold pr-5 sm:pr-14 text-sm">
                                                                {'FY'+balance?.calendarYear?.slice(-2)+' '+balance?.period}
                                                            </td>
                                                        {/if}
                                                        {/each}
                                                    </tr>
                                                    </thead>
                                                <tbody>
                                        
                                                    
                                                    <!-- row -->
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Cash & Equivalents</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.cashAndCashEquivalents,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Short-Term Investments</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.shortTermInvestments,true)}</td>
                                                        {/each}
                                                    </tr>
                                                        <!-- row -->
                                                        <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Long-Term Investments</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.longTermInvestments,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Other Long-Term Assets</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.otherNonCurrentAssets,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Receivables</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.netReceivables,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Inventory</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.inventory,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Other Current Assets</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.otherCurrentAssets,true)}</td>
                                                        {/each}
                                                    </tr>
                                                        <!-- row -->
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Total Current Assets</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.totalCurrentAssets,true)}</td>
                                                        {/each}
                                                    </tr>
                                                        <!-- row -->
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Property, Plant & Equipment</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.propertyPlantEquipmentNet,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Goodwill & Intangibles</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.goodwillAndIntangibleAssets,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Total Long-Term Assets</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.totalNonCurrentAssets,true)}</td>
                                                        {/each}
                                                    </tr>
                                                        <!-- row -->
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Total Assets</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.totalAssets,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Account Payables</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.accountPayables,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Deferred Revenue</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.deferredRevenue,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Short-Term Debt</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.shortTermDebt,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Other Current Liabilities</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.otherCurrentLiabilities,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Total Current Liabilities</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.totalCurrentLiabilities,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Long-Term Debt</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.longTermDebt,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Other Long-Term Liabilities</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.otherNonCurrentLiabilities,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Total Long-Term Liabilities</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.totalNonCurrentLiabilities,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Total Liabilities</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.totalLiabilities,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Total Debt</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.totalDebt,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Common Stock</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.commonStock,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Retained Earnings</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.retainedEarnings,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Comprehensive Income</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.accumulatedOtherComprehensiveIncomeLoss,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Shareholders' Equity</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.totalStockholdersEquity,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                        <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">Total Investments</td>
                                                        {#each balanceSheet as balance}
                                                        <td class=" text-xs sm:text-sm"> {abbreviateNumber(balance?.totalInvestments,true)}</td>
                                                        {/each}
                                                    </tr>
                                                    
                                                    </tbody>
                                            </table>
                                        </div>
                                    {/if}
    
                        </div>
    
                    </div>
                </main>
            </div>
        </div>
    </section>
        
            
           
    

    


  <!--Start TimeFrame-->
  <input type="checkbox" id="timeFrameModal" class="modal-toggle" />
      
  <dialog id="timeFrameModal" class="modal modal-bottom sm:modal-middle ">
  
  
    <label id="timeFrameModal" for="timeFrameModal"  class="cursor-pointer modal-backdrop bg-[#09090B] bg-opacity-[0.5]"></label>
    
    
    <div class="modal-box w-full bg-[#09090B] sm:border sm:border-slate-800">
  
  
  
    <label for="timeFrameModal" class="cursor-pointer absolute right-5 top-2 bg-[#09090B] text-[1.8rem] text-white">
      ✕
    </label>
  
      <div class="text-white">
        
        <h3 class="font-medium text-lg sm:text-xl mb-10">
          Time Frame
        </h3>
          
  
        <div class="flex flex-col items-center w-full Max-w-3xl bg-[#09090B]">
  
  
          <label for="timeFrameModal" on:click={() => timeFrame= '5Y'} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
  
              <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {timeFrame === '5Y' ? 'ring-2 ring-[#04E000]' : ''}">
                
                <span class="ml-1 text-white font-medium mr-auto">
                  5 years
                </span>
  
                <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                  {#if timeFrame === '5Y'}
                    <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#09090B000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                  {/if}
                </div>
  
              </div>
             
          </label>
  
  
          <label for="timeFrameModal" on:click={() => timeFrame='10Y'} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
  
            <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {timeFrame === '10Y' ? 'ring-2 ring-[#04E000]' : ''}">
              
              <span class="ml-1 text-white font-medium mr-auto">
                10 years
              </span>

              <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                {#if timeFrame === '10Y'}
                  <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#09090B000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                {/if}
              </div>

            </div>
           
        </label>

        <label for="timeFrameModal" on:click={() => timeFrame='Max'} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
  
            <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {timeFrame === 'Max' ? 'ring-2 ring-[#04E000]' : ''}">
              
              <span class="ml-1 text-white font-medium mr-auto">
                Max
              </span>

              <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                {#if timeFrame === 'Max'}
                  <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#09090B000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                {/if}
              </div>

            </div>
           
        </label>

    
  
        </div>
         
      </div>
  
  
          
        </div>
    </dialog>
  <!--End TimeFrame-->





  <!--Start Export -->
  <!--
  <input type="checkbox" id="exportDataModal" class="modal-toggle" />
      
  <dialog id="exportDataModal" class="modal modal-bottom sm:modal-middle ">
  
  
    <label id="exportDataModal" for="exportDataModal"  class="cursor-pointer modal-backdrop bg-[#09090B] bg-opacity-[0.5]"></label>
    
    
    <div class="modal-box w-full bg-[#09090B] sm:border sm:border-slate-800">
  
  
  
    <label for="exportDataModal" class="cursor-pointer absolute right-5 top-2 bg-[#09090B] text-[1.8rem] text-white">
      ✕
    </label>
  
      <div class="text-white">
        
        <h3 class="font-medium text-lg sm:text-xl mb-10">
          Export
        </h3>
          
  
        <div class="flex flex-col items-center w-full Max-w-3xl bg-[#09090B]">
  
  
          <label for="exportDataModal" on:click={() => exportData('excel')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
  
              <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg">
                
                <span class="ml-1 text-white font-medium mr-auto">
                  Export to Excel
                </span>
  
              </div>
             
          </label>
  
  
          <label for="exportDataModal" on:click={() => exportData('csv')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
  
            <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg">
              
              <span class="ml-1 text-white font-medium mr-auto">
                Export to CSV
              </span>

            </div>
           
        </label>

  
        </div>
         
      </div>
  
  
          
        </div>
    </dialog>
    -->
  <!--End Export-->




                
  <style>
    .app {
        height: 400px;
        width: 100%;
    }
    
    @media (max-width: 560px) {
        .app {
            width: 100%;
            height: 300px;
        }
    }

    .chart {
        width: 100%;
    }
</style>