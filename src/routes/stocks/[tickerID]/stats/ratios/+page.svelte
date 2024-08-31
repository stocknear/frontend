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




let ratios = [];
let fullStatement = []
let tableList = [];

let filterRule = 'annual';
let optionsData;


let displayStatement = 'priceEarningsRatio';
    

let mode = true;
let timeFrame = '10Y';



const statementConfig = [
    {
        propertyName: 'priceEarningsRatio',
        label: 'PE Ratio',
        text: "The price-to-earnings (P/E) ratio is a valuation metric that shows how expensive a stock is relative to earnings.",
    },
    {
        propertyName: 'priceToSalesRatio',
        label: 'PS Ratio',
        text: "The price-to-sales (P/S) ratio is a commonly used valuation metric. It shows how expensive a stock is compared to revenue.",
    },
    {
        propertyName: 'priceToBookRatio',
        label: 'PB Ratio',
        text: "The price-to-book (P/B) ratio measures a stock's price relative to book value. Book value is also called Shareholders' equity.",
    },
    {   propertyName: 'priceToFreeCashFlowsRatio',
        label: 'P/FCF Ratio',
        text: "The price to free cash flow (P/FCF) ratio is similar to the P/E ratio, except it uses free cash flow instead of accounting earnings.",
    },
    {
        propertyName: 'priceToOperatingCashFlowsRatio',
        label: 'P/OCF Ratio',
        text: "The price to operating cash flow (P/OCF) ratio measures the price of a stock relative to operating cash flow.",
    },
    {
        propertyName: 'operatingCashFlowSalesRatio',
        label: 'OCF/S Ratio',
        text: "The operating cash flow to sales (OCF/S) Ratio assesses how well sales convert to cash. It's the operating cash flow divided by net sales, indicating cash efficiency.",
    },
    {
        propertyName: 'debtEquityRatio',
        label: 'Debt / Equity Ratio',
        text: "The debt-to-equity ratio measures a company's debt levels relative to its shareholders' equity or book value. A high ratio implies that a company has a lot of debt.",
    },
    {
        propertyName: 'quickRatio',
        label: 'Quick Ratio',
        text: "The quick ratio measure a company's short-term liquidity. A low number indicates that the company may have trouble paying its upcoming financial obligations.",
    },
    {
        propertyName: 'currentRatio',
        label: 'Current Ratio',
        text: "The current ratio is used to measure a company's short-term liquidity. A low number can indicate that a company will have trouble paying its upcoming liabilities."
    },
    {
        propertyName: 'assetTurnover',
        label: 'Asset Turnover',
        text: "The asset turnover ratio measures the amount of sales relative to a company's assets. It indicates how efficiently the company uses its assets to generate revenue.",
    },
    {
        propertyName: 'interestCoverage',
        label: 'Interest Coverage',
        text: "The interest coverage ratio is a measure of the ability of a company to pay its interest expenses. It is calculated by dividing the company's Earnings Before Interest and Taxes (EBIT) by its interest expenses."
    },
    {
        propertyName: 'returnOnEquity',
        label: 'Return on Equity (ROE)',
        text: `Return on equity (ROE) is a profitability metric that shows how efficient a company is at using its equity (or "net" assets) to generate profits. It is calculated by dividing the company's net income by the average shareholders' equity during the past 12 months.`
    },
    {
        propertyName: 'returnOnAssets',
        label: 'Return on Assets (ROA)',
        text: `Return on assets (ROA) is a metric that measures how much profit a company is able to generate using its assets. It is calculated by dividing net income by the average total assets for the past 12 months.`,
    },
    {
        propertyName: 'returnOnCapitalEmployed',
        label: 'Return on Capital (ROIC)',
        text: `Return on invested capital (ROIC) measures how effective a company is at investing its capital in order to increase profits. It is calculated by dividing the NOPAT (Net Operating Profit After Tax) by the invested capital.`,
    },
    {
        propertyName: 'dividendYield',
        label: 'Dividend Yield',
        text: "The dividend yield is how much a stock pays in dividends each year, as a percentage of the stock price.",
    },
    {
        propertyName: 'payoutRatio',
        label: 'Payout Ratio',
        text: "The dividend payout ratio is the percentage of a company's profits that are paid out as dividends. A high ratio implies that the dividend payments may not be sustainable.",
    },
    {
        propertyName: 'grossProfitMargin',
        label: 'Gross Profit Margin',
        text: "Gross Profit Margin is the percentage of revenue left as gross profits, after subtracting cost of goods sold from the revenue.",
    },
    {
        propertyName: 'netProfitMargin',
        label: 'Net Profit Margin',
        text: "Net Profit Margin is the percentage of revenue left as net income, or profits, after subtracting all costs and expenses from the revenue.",
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



function plotData()
    {
    
        let labelName = '-';
        let xList = [];
        let valueList = [];
        tableList = [];
        
        const index = statementConfig?.findIndex((item) => item?.propertyName === displayStatement);
    
        for (let i = ratios?.length - 1; i >= 0; i--) {
            const statement = ratios[i];
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
    const headers = properties.map(prop => prop.label);
    rows.unshift(headers);


    // Check the format to export
    if (format.toLowerCase() === 'csv') {
        const csvContent = rows.map(row => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "data:text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = $stockTicker.toLowerCase() + "-ratios-statement.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else if (format.toLowerCase() === 'excel') {
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ratios Statement");
        XLSX.writeFile(workbook, `${$stockTicker.toLowerCase()}-ratios-statement.xlsx`);
    }
};

*/


fullStatement = data?.getRatiosStatement;
timeFrame = '10Y';
displayStatement = 'priceEarningsRatio';

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
            fullStatement = data?.getRatiosStatement?.annual
        }
        else {
            fullStatement = data?.getRatiosStatement?.quarter;
        }
        
        ratios = filterStatement(fullStatement, timeFrame);
    
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
  {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {$displayCompanyName} ({$stockTicker}) Financial Ratios and Metrics · stocknear
</title>
<meta name="description" content={`Financial ratios and metrics for ${$displayCompanyName} (${$stockTicker}). Includes annual, quarterly and trailing numbers with full history and charts.`} />

<!-- Other meta tags -->
<meta property="og:title" content={`${$displayCompanyName} (${$stockTicker}) Financial Ratios and Metrics · stocknear`}/>
<meta property="og:description" content={`Financial ratios and metrics for ${$displayCompanyName} (${$stockTicker}). Includes annual, quarterly and trailing numbers with full history and charts.`} />
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`${$displayCompanyName} (${$stockTicker}) Financial Ratios and Metrics · stocknear`}/>
<meta name="twitter:description" content={`Financial ratios and metrics for ${$displayCompanyName} (${$stockTicker}). Includes annual, quarterly and trailing numbers with full history and charts.`} />
<!-- Add more Twitter meta tags as needed -->

</svelte:head>

                
<section class="bg-[#09090B] overflow-hidden text-white h-full pb-40 sm:mb-0">
    <div class="flex justify-center w-full m-auto h-full overflow-hidden">
        <div class="w-full relative flex justify-center items-center overflow-hidden">
            <main class="w-full">
                <div class="sm:p-7 m-auto mt-2 sm:mt-0 w-full">
                    <div class="mb-3">
                        <h1 class="text-2xl text-gray-200 font-bold">
                            {#if mode}
                            {statementConfig?.find((item) => item?.propertyName === displayStatement)?.label}
                            {:else}
                                Ratios {filterRule === 'annual' ? '(Annual)' : '(Quarter)'}
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
                            Get detailed income statement breakdowns, uncovering revenue, expenses, and much more.
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
                                        <option value="priceEarningsRatio" selected>PE Ratio</option>
                                        <option value="priceToSalesRatio">PS Ratio</option>
                                        <option value="priceToBookRatio">PB Ratio</option>
                                        <option value="priceToFreeCashFlowsRatio">P/FCF Ratio</option>
                                        <option value="priceToOperatingCashFlowsRatio">P/OCF Ratio</option>
                                        <option value="operatingCashFlowSalesRatio">OCF/S Ratio</option>
                                        <option value="debtEquityRatio">Debt / Equity Ratio</option>
                                        <option value="quickRatio">Quick Ratio</option>
                                        <option value="currentRatio">Current Ratio</option>
                                        <option value="assetTurnover">Asset Turnover</option>
                                        <option value="interestCoverage">Interest Coverage</option>
                                        <option value="returnOnEquity">Return on Equity (ROE)</option>
                                        <option value="returnOnAssets">Return on Assets (ROA)</option>
                                        <option value="returnOnCapitalEmployed">Return on Capital (ROIC)</option>
                                        <option value="dividendYield">Dividend Yield</option>
                                        <option value="payoutRatio">Payout Ratio</option>
                                        <option value="grossProfitMargin">Gross Profit Margin</option>
                                        <option value="netProfitMargin">Net Profit Margin</option>
                                    </select>
                                    </div>
                                </div>
                    
                                <div class="app w-full">
                                    <Chart {init} options={optionsData} class="chart" />
                                </div>

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
                                                    <td class="text-start border-r border-[#191E24] text-sm sm:text-[1rem] font-bold pr-10">Year</td>
                                                    {#each ratios as item}
                                                    {#if filterRule === 'annual'}
                                                        <td class="bg-[#09090B] font-semibold pr-5 sm:pr-14 text-sm">
                                                            {'FY'+item?.calendarYear?.slice(-2)}
                                                        </td>
                                                    {:else}
                                                        <td class="bg-[#09090B] font-semibold pr-5 sm:pr-14 text-sm">
                                                            {'FY'+item?.calendarYear?.slice(-2)+' '+item?.period}
                                                        </td>
                                                    {/if}
                                                    {/each}
                                                </tr>
                                                </thead>
                                            <tbody>
                                    
                                                
                                                <!-- row -->
                                                <tr class="text-white odd:bg-[#27272A] whitespace-nowrap">
                                                    <td class="text-start border-r border-[#191E24] text-xs sm:text-sm">PE Ratio</td>
                                                    {#each ratios as item}
                                                    <td class="text-xs sm:text-sm">
                                                        {filterRule === 'annual' ? (item?.priceEarningsRatio/4)?.toFixed(2): item?.priceEarningsRatio?.toFixed(2)}
                                                    </td>
                                                    {/each}
                                                </tr>
                                                <tr class="text-white odd:bg-[#27272A]">
                                                    <td class="text-start border-r border-[#191E24]  text-xs sm:text-sm">PS Ratio</td>
                                                    {#each ratios as item}
                                                    <td class="text-xs sm:text-sm">
                                                        {filterRule === 'annual' ? (item?.priceToSalesRatio/4)?.toFixed(2): item?.priceToSalesRatio?.toFixed(2)}
                                                    </td>
                                                    {/each}
                                                </tr>
                                                    <!-- row -->
                                                    <tr class="text-white odd:bg-[#27272A]">
                                                    <td class="text-start border-r border-[#191E24]  text-xs sm:text-sm">PB Ratio</td>
                                                    {#each ratios as item}
                                                    <td class="text-xs sm:text-sm">
                                                        {filterRule === 'annual' ? (item?.priceToBookRatio/4)?.toFixed(2): item?.priceToBookRatio?.toFixed(2)}
                                                    </td>
                                                    {/each}
                                                </tr>
                                                <tr class="text-white odd:bg-[#27272A] whitespace-nowrap">
                                                    <td class="text-start border-r border-[#191E24]  text-xs sm:text-sm">P/FCF Ratio</td>
                                                    {#each ratios as item}
                                                    <td class="text-xs sm:text-sm">
                                                        {filterRule === 'annual' ? (item?.priceToFreeCashFlowsRatio/4)?.toFixed(2): item?.priceToFreeCashFlowsRatio?.toFixed(2)}
                                                    </td>
                                                    {/each}
                                                </tr>
                                                <tr class="text-white odd:bg-[#27272A]">
                                                    <td class="text-start border-r border-[#191E24]  text-xs sm:text-sm">P/OCF Ratio</td>
                                                    {#each ratios as item}
                                                    <td class="text-xs sm:text-sm">
                                                        {filterRule === 'annual' ? (item?.priceToOperatingCashFlowsRatio/4)?.toFixed(2): item?.priceToOperatingCashFlowsRatio?.toFixed(2)}
                                                    </td>
                                                    {/each}
                                                </tr>
                                                <tr class="text-white odd:bg-[#27272A]">
                                                    <td class="text-start border-r border-[#191E24]  text-xs sm:text-sm">OCF/S Ratio</td>
                                                    {#each ratios as item}
                                                    <td class="text-xs sm:text-sm">
                                                        {filterRule === 'annual' ? (item?.operatingCashFlowSalesRatio/4)?.toFixed(2): item?.operatingCashFlowSalesRatio?.toFixed(2)}
                                                    </td>
                                                    {/each}
                                                </tr>
                                                <tr class="text-white odd:bg-[#27272A]">
                                                    <td class="text-start border-r border-[#191E24]  text-xs sm:text-sm">Debt / Equity Ratio</td>
                                                    {#each ratios as item}
                                                    <td class="text-xs sm:text-sm">
                                                        {filterRule === 'annual' ? (item?.debtEquityRatio/4)?.toFixed(2): item?.debtEquityRatio?.toFixed(2)}
                                                    </td>
                                                    {/each}
                                                </tr>
                                                    <!-- row -->
                                                <tr class="text-white odd:bg-[#27272A]">
                                                    <td class="text-start border-r border-[#191E24]  text-xs sm:text-sm">Quick Ratio</td>
                                                    {#each ratios as item}
                                                    <td class="text-xs sm:text-sm">
                                                        {filterRule === 'annual' ? (item?.quickRatio/4)?.toFixed(2): item?.quickRatio?.toFixed(2)}
                                                    </td>
                                                    {/each}
                                                </tr>
                                                    <!-- row -->
                                                <tr class="text-white odd:bg-[#27272A]">
                                                    <td class="text-start border-r border-[#191E24]  text-xs sm:text-sm">Current Ratio</td>
                                                    {#each ratios as item}
                                                    <td class="text-xs sm:text-sm">
                                                        {filterRule === 'annual' ? (item?.currentRatio/4)?.toFixed(2): item?.currentRatio?.toFixed(2)}
                                                    </td>
                                                    {/each}
                                                </tr>
                                                <tr class="text-white odd:bg-[#27272A]">
                                                    <td class="text-start border-r border-[#191E24]  text-xs sm:text-sm whitespace-nowrap">Asset Turnover</td>
                                                    {#each ratios as item}
                                                    <td class="text-xs sm:text-sm">
                                                        {item?.assetTurnover?.toFixed(2)}
                                                    </td>
                                                    {/each}
                                                </tr>
                                                <tr class="text-white odd:bg-[#27272A]">
                                                    <td class="text-start border-r border-[#191E24]  text-xs sm:text-sm">Interest Coverage</td>
                                                    {#each ratios as item}
                                                    <td class="text-xs sm:text-sm">
                                                        {filterRule === 'annual' ? (item?.interestCoverage/4)?.toFixed(2): item?.interestCoverage?.toFixed(2)}
                                                    </td>
                                                    {/each}
                                                </tr>
                                                    <!-- row -->
                                                <tr class="text-white odd:bg-[#27272A]">
                                                    <td class="text-start border-r border-[#191E24]  text-xs sm:text-sm">Return on Equity (ROE)</td>
                                                    {#each ratios as item}
                                                    <td class="text-xs sm:text-sm">
                                                        {(item?.returnOnEquity*100)?.toFixed(2)}%
                                                    </td>
                                                    {/each}
                                                </tr>
                                                <tr class="text-white odd:bg-[#27272A]">
                                                    <td class="text-start border-r border-[#191E24]  text-xs sm:text-sm">Return on Assets (ROA)</td>
                                                    {#each ratios as item}
                                                    <td class="text-xs sm:text-sm">{(item?.returnOnAssets*100)?.toFixed(2)}%</td>
                                                    {/each}
                                                </tr>
                                                <tr class="text-white odd:bg-[#27272A]">
                                                    <td class="text-start border-r border-[#191E24]  text-xs sm:text-sm">Return on Capital (ROIC)</td>
                                                    {#each ratios as item}
                                                    <td class="text-xs sm:text-sm"> {(item?.returnOnCapitalEmployed*100)?.toFixed(2)}%</td>
                                                    {/each}
                                                </tr>
                                                <tr class="text-white odd:bg-[#27272A]">
                                                    <td class="text-start border-r border-[#191E24]  text-xs sm:text-sm">Dividend Yield</td>
                                                    {#each ratios as item}
                                                    <td class="text-xs sm:text-sm"> {(item?.dividendYield*100)?.toFixed(2)}%</td>
                                                    {/each}
                                                </tr>
                                                <tr class="text-white odd:bg-[#27272A]">
                                                    <td class="text-start border-r border-[#191E24]  text-xs sm:text-sm">Payout Ratio</td>
                                                    {#each ratios as item}
                                                    <td class="text-xs sm:text-sm">
                                                        {filterRule === 'annual' ? (item?.payoutRatio/4*100)?.toFixed(2): (item?.payoutRatio*100)?.toFixed(2)}%
                                                    </td>
                                                    {/each}
                                                </tr>
                                                <tr class="text-white odd:bg-[#27272A]">
                                                    <td class="text-start border-r border-[#191E24]  text-xs sm:text-sm">Gross Profit Margin</td>
                                                    {#each ratios as item}
                                                    <td class="text-xs sm:text-sm">
                                                        {filterRule === 'annual' ? (item?.grossProfitMargin/4*100)?.toFixed(2): (item?.grossProfitMargin*100)?.toFixed(2)}%
                                                    </td>
                                                    {/each}
                                                </tr>
                                                <tr class="text-white odd:bg-[#27272A]">
                                                    <td class="text-start border-r border-[#191E24]  text-xs sm:text-sm">Net Profit Margin</td>
                                                    {#each ratios as item}
                                                    <td class="text-xs sm:text-sm">
                                                        {filterRule === 'annual' ? (item?.netProfitMargin/4*100)?.toFixed(2): (item?.netProfitMargin*100)?.toFixed(2)}%
                                                    </td>
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