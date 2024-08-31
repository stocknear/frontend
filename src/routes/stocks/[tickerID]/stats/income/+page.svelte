<script lang="ts">
import {numberOfUnreadNotification,displayCompanyName, stockTicker} from '$lib/store';
import { abbreviateNumber } from '$lib/utils';
//import * as XLSX from 'xlsx';
import { Chart } from 'svelte-echarts'

import { init, use } from 'echarts/core'
  import { LineChart, BarChart } from 'echarts/charts'
  import { GridComponent, TooltipComponent } from 'echarts/components'
  import { CanvasRenderer } from 'echarts/renderers'
  import { onMount } from 'svelte';
  use([LineChart, BarChart, GridComponent,TooltipComponent, CanvasRenderer])


    export let data;
    
    let isLoaded = false;
    let optionsData;
    let tableList = [];

    let income = [];
    let fullStatement = [];
    let filterRule = 'annual';
    let displayStatement = 'revenue';
        
        
    let mode = true;
    let timeFrame = '10Y';
    
    onMount(async () => {
        isLoaded = true;
    })


    const statementConfig = [
        {
            propertyName: 'revenue',
            growthPropertyName: 'growthRevenue',
            label: 'Revenue',
            text: "Revenue, also called sales, is the amount of money a company receives from its business activities, such as sales of products or services. Revenue does not take any expenses into account and is therefore different from profits.",
        },
        {
            propertyName: 'costOfRevenue',
            growthPropertyName: 'growthCostOfRevenue',
            label: 'Cost of Revenue',
            text: "Cost of revenue is also called cost of goods sold (COGS). It is the variable cost related to the company's production of products and services.",
        },
        {
            propertyName: 'grossProfit',
            growthPropertyName: 'growthGrossProfit',
            label: 'Gross Profit',
            text: "Gross profit is a company’s profit after subtracting the costs directly linked to making and delivering its products and services.",
        },
        {
            propertyName: 'sellingGeneralAndAdministrativeExpenses',
            growthPropertyName: 'growthSellingGeneralAndAdministrativeExpenses',
            label: 'Selling & General & Admin',
            text: "Selling, general and administrative (SG&A) is an operating expense. It involves various company expenses that are not related to production.",
        },
        {
            propertyName: 'researchAndDevelopmentExpenses',
            growthPropertyName: 'growthResearchAndDevelopmentExpenses',
            label: 'Research & Development',
            text: "Research and development (R&D) is an operating expense. It is the amount of money a company spends on researching and developing new products and services, or improving existing ones.",
        },
        {
            propertyName: 'otherExpenses',
            growthPropertyName: 'growthOtherExpenses',
            label: 'Other Expenses',
            text: "Other expenses typically refer to costs that are not directly related to the primary operations of the business. These can include a wide variety of things, such as interest expense, taxes, depreciation and amortization, losses from investments, legal fees and restructuring costs."
        },
        {
            propertyName: 'operatingExpenses',
            growthPropertyName: 'growthOperatingExpenses',
            label: 'Operating Expenses',
            text: "Operating expenses are a company's fixed costs that a company incurs during its ongoing business operations. It can include SG&A, R&D and other expenses."
        },
        {
            propertyName: 'interestExpense',
            growthPropertyName: 'growthInterestExpense',
            label: 'Interest Expense',
            text: "Interest expense is the amount that the company paid or received in interest. A positive number indicates a net expense, while a negative number implies that the company had more interest income from its cash reserves than it paid for interest on debt.",
        },
        {
            propertyName: 'incomeBeforeTax',
            growthPropertyName: 'growthIncomeBeforeTax',
            label: 'Pretax Income',
            text: "Pretax income is a company's profits before accounting for income taxes.",
        },
        {
            propertyName: 'incomeTaxExpense',
            growthPropertyName: 'growthIncomeTaxExpense',
            label: 'Income Tax',
            text: "Income tax is the amount of corporate income tax that the company has incurred during the fiscal period.",
        },
        {
            propertyName: 'netIncome',
            growthPropertyName: 'growthNetIncome',
            label: 'Net Income',
            text: `Net income is a company's accounting profits after subtracting all costs and expenses from the revenue. It is also called earnings, profits or "the bottom line."`,
        },
        {
            propertyName: 'weightedAverageShsOut',
            growthPropertyName: 'growthWeightedAverageShsOut',
            label: 'Shares Outstanding (Basic)',
            text: "Basic shares outstanding is the total amount of common stock held by all of a company's shareholders.",
        },
        {
            propertyName: 'weightedAverageShsOutDil',
            growthPropertyName: 'growthWeightedAverageShsOutDil',
            label: 'Shares Outstanding (Diluted)',
            text: "Diluted shares outstanding is the total amount of common stock that will be outstanding if all stock options, warrants and convertible securities are exercised.",
        },
        {
            propertyName: 'eps',
            growthPropertyName: 'growthEPS',
            label: 'EPS (Basic)',
            text: "Earnings per share is the portion of a company's profit that is allocated to each individual stock. EPS is calculated by dividing net income by shares outstanding.",
        },
        {
            propertyName: 'epsdiluted',
            growthPropertyName: 'growthEPSDiluted',
            label: 'EPS (Diluted)',
            text: `Earnings per share is the portion of a company's profit that is allocated to each individual stock. Diluted EPS is calculated by dividing net income by "diluted" shares outstanding.`,
        },
        {
            propertyName: 'ebitda',
            growthPropertyName: 'growthEBITDA',
            label: 'EBITDA',
            text: `EBITDA stands for "Earnings Before Interest, Taxes, Depreciation and Amortization." It is a commonly used measure of profitability.`,
        },
        {
            propertyName: 'depreciationAndAmortization',
            growthPropertyName: 'growthDepreciationAndAmortization',
            label: 'Depreciation & Amortization',
            text: "Depreciation and amortization are accounting methods for calculating how the value of a business's assets change over time. Depreciation refers to physical assets, while amortization refers to intangible assets.",
        }
        
    ];
    
    
        
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
    
    for (let i = income?.length - 1; i >= 0; i--) {
            const statement = income[i];
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



    labelName = statementConfig[index]?.label;
    
    
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
    let rows = data?.map(item => properties?.map(property => item[property?.key] || 0));
    
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
        a.download = $stockTicker.toLowerCase() + "-income-statement.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else if (format.toLowerCase() === 'excel') {
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Income Statement");
        XLSX.writeFile(workbook, `${$stockTicker.toLowerCase()}-income-statement.xlsx`);
    }
};
*/
    
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


fullStatement = data?.getIncomeStatement;
timeFrame = '10Y';
displayStatement = 'revenue';


$: {
    if (timeFrame || displayStatement || filterRule)
    {   
        if (filterRule === 'annual') {
            fullStatement = data?.getIncomeStatement?.annual
        }
        else {
            fullStatement = data?.getIncomeStatement?.quarter
        }
        income = filterStatement(fullStatement, timeFrame);
    
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
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {$displayCompanyName} ({$stockTicker}) Financials - Income Statement · stocknear
</title>
<meta name="description" content={`Detailed annual and timeFramely income statement for ${$displayCompanyName} (${$stockTicker}). See many years of revenue, expenses and profits or losses.`} />
<meta property="og:title" content={`${$displayCompanyName} (${$stockTicker}) Financials - Income Statement · stocknear`}/>
<meta property="og:description" content={`Detailed annual and timeFramely income statement for ${$displayCompanyName} (${$stockTicker}). See many years of revenue, expenses and profits or losses.`} />
<meta property="og:type" content="website"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`${$displayCompanyName} (${$stockTicker}) Financials - Income Statement · stocknear`}/>
<meta name="twitter:description" content={`Detailed annual and timeFramely income statement for ${$displayCompanyName} (${$stockTicker}). See many years of revenue, expenses and profits or losses.`} />
</svelte:head>

    
    <section class="bg-[#09090B] w-full  overflow-hidden text-white h-full pb-40 sm:mb-0">
        <div class="w-full flex justify-center w-full sm-auto h-full overflow-hidden">
            <div class="w-full relative flex justify-center items-center overflow-hidden">

                {#if isLoaded}
                <main class="w-full">
                    <div class="sm:p-7 m-auto mt-2 sm:mt-0">
                        <div class="mb-3">
                            <h1 class="text-2xl text-gray-200 font-bold">
                                {#if mode}
                                    {statementConfig?.find((item) => item?.propertyName === displayStatement)?.label}
                                {:else}
                                    Income Statement {filterRule === 'annual' ? '(Annual)' : '(Quarter)'}
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
                            <div class="w-full">
                                <div class="relative">
                                <select class="select select-bordered select-sm p-0 pl-5 overflow-y-auto bg-[#2A303C]" on:change={changeStatement}>
                                    <option disabled>Choose an Cash Flow Variable</option>
                                    <option value="revenue" selected>Revenue</option>
                                    <option value="costOfRevenue">Cost of Revenue</option>
                                    <option value="grossProfit">Gross Profit</option>
                                    <option value="sellingGeneralAndAdministrativeExpenses">Selling, General & Admin</option>
                                    <option value="researchAndDevelopmentExpenses">Research & Development</option>
                                    <option value="otherExpenses">Other Expenses</option>
                                    <option value="operatingExpenses">Operating Expenses</option>
                                    <option value="interestExpense">Interest Expense</option>
                                    <option value="incomeBeforeTax">Pretax Income</option>
                                    <option value="incomeTaxExpense">Income Tax</option>
                                    <option value="netIncome">Net Income</option>
                                    <option value="weightedAverageShsOut">Shares Outstanding (Basic)</option>
                                    <option value="weightedAverageShsOutDil">Shares Outstanding (Diluted)</option>
                                    <option value="eps">EPS (Basic)</option>
                                    <option value="epsdiluted">EPS (Diluted)</option>
                                    <option value="ebitda">EBITDA</option>
                                    <option value="depreciationAndAmortization">Depreciation & Amortization</option>                                      
                                </select>
                                </div>
                            </div>
                
                            <div class="app w-full ">
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
                                                <td class="text-start border-r border-[#191E24] bg-[#09090B] text-white text-sm font-semibold pr-10">Year</td>
                                                {#each income as cash}
                                                {#if filterRule === 'annual'}
                                                    <td class="bg-[#09090B] font-semibold pr-5 sm:pr-14 text-sm">
                                                        {'FY'+cash?.calendarYear?.slice(-2)}
                                                    </td>
                                                {:else}
                                                   <td class="bg-[#09090B] font-semibold pr-5 sm:pr-14 text-sm">
                                                    {'FY'+cash?.calendarYear?.slice(-2)+' '+cash?.period}
                                                </td>
                                                {/if}
                                                {/each}
                                            </tr>
                                            </thead>
                                        <tbody>
                                
                                            
                                            <!-- row -->
                                            <tr class="text-white odd:bg-[#27272A]">
                                                <td class="text-start border-r border-[#191E24] text-white  text-xs sm:text-sm">Revenue</td>
                                                {#each income as cash}
                                                <td class=" text-xs sm:text-sm"> {abbreviateNumber(cash?.revenue,true)}</td>
                                                {/each}
                                            </tr>
                                            <tr class="text-white odd:bg-[#27272A]">
                                                <td class="text-start border-r border-[#191E24] text-white  text-xs sm:text-sm">Cost of Revenue</td>
                                                {#each income as cash}
                                                <td class=" text-xs sm:text-sm"> {abbreviateNumber(cash?.costOfRevenue,true)}</td>
                                                {/each}
                                            </tr>
                                                <!-- row -->
                                                <tr class="text-white odd:bg-[#27272A]">
                                                <td class="text-start border-r border-[#191E24] text-white  text-xs sm:text-sm">Gross Profit</td>
                                                {#each income as cash}
                                                <td class=" text-xs sm:text-sm"> {abbreviateNumber(cash?.grossProfit,true)}</td>
                                                {/each}
                                            </tr>
                                            <tr class="text-white odd:bg-[#27272A]">
                                                <td class="text-start border-r border-[#191E24] text-white  text-xs sm:text-sm">Selling, General & Admin</td>
                                                {#each income as cash}
                                                <td class=" text-xs sm:text-sm"> {abbreviateNumber(cash?.sellingGeneralAndAdministrativeExpenses,true)}</td>
                                                {/each}
                                            </tr>
                                            <tr class="text-white odd:bg-[#27272A]">
                                                <td class="text-start border-r border-[#191E24] text-white  text-xs sm:text-sm">Research & Development</td>
                                                {#each income as cash}
                                                <td class=" text-xs sm:text-sm"> {abbreviateNumber(cash?.researchAndDevelopmentExpenses,true)}</td>
                                                {/each}
                                            </tr>
                                            <tr class="text-white odd:bg-[#27272A]">
                                                <td class="text-start border-r border-[#191E24] text-white  text-xs sm:text-sm">Other Expenses</td>
                                                {#each income as cash}
                                                <td class=" text-xs sm:text-sm"> {abbreviateNumber(cash?.otherExpenses,true)}</td>
                                                {/each}
                                            </tr>
                                            <tr class="text-white odd:bg-[#27272A]">
                                                <td class="text-start border-r border-[#191E24] text-white  text-xs sm:text-sm">Operating Expenses</td>
                                                {#each income as cash}
                                                <td class=" text-xs sm:text-sm"> {abbreviateNumber(cash?.operatingExpenses,true)}</td>
                                                {/each}
                                            </tr>
                                            <tr class="text-white odd:bg-[#27272A]">
                                                <td class="text-start border-r border-[#191E24] text-white  text-xs sm:text-sm">Interest Expense</td>
                                                {#each income as cash}
                                                <td class=" text-xs sm:text-sm"> {abbreviateNumber(cash?.interestExpense,true)}</td>
                                                {/each}
                                            </tr>
                                                <!-- row -->
                                            <tr class="text-white odd:bg-[#27272A]">
                                                <td class="text-start border-r border-[#191E24] text-white  text-xs sm:text-sm">Pretax Income</td>
                                                {#each income as cash}
                                                <td class=" text-xs sm:text-sm"> {abbreviateNumber(cash?.incomeBeforeTax,true)}</td>
                                                {/each}
                                            </tr>
                                                <!-- row -->
                                            <tr class="text-white odd:bg-[#27272A]">
                                                <td class="text-start border-r border-[#191E24] text-white  text-xs sm:text-sm">Income Tax</td>
                                                {#each income as cash}
                                                <td class=" text-xs sm:text-sm"> {abbreviateNumber(cash?.incomeTaxExpense,true)}</td>
                                                {/each}
                                            </tr>
                                            <tr class="text-white odd:bg-[#27272A]">
                                                <td class="text-start border-r border-[#191E24] text-white  text-xs sm:text-sm">Net Income</td>
                                                {#each income as cash}
                                                <td class=" text-xs sm:text-sm"> {abbreviateNumber(cash?.netIncome,true)}</td>
                                                {/each}
                                            </tr>
                                            <tr class="text-white odd:bg-[#27272A]">
                                                <td class="text-start border-r border-[#191E24] text-white  text-xs sm:text-sm">Shares Outstanding (Basic)</td>
                                                {#each income as cash}
                                                <td class=" text-xs sm:text-sm"> {abbreviateNumber(cash?.weightedAverageShsOut)}</td>
                                                {/each}
                                            </tr>
                                                <!-- row -->
                                            <tr class="text-white odd:bg-[#27272A]">
                                                <td class="text-start border-r border-[#191E24] text-white  text-xs sm:text-sm">Shares Outstanding (Diluted)</td>
                                                {#each income as cash}
                                                <td class=" text-xs sm:text-sm"> {abbreviateNumber(cash?.weightedAverageShsOutDil)}</td>
                                                {/each}
                                            </tr>
                                            <tr class="text-white odd:bg-[#27272A]">
                                                <td class="text-start border-r border-[#191E24] text-white  text-xs sm:text-sm">EPS (Basic)</td>
                                                {#each income as cash}
                                                <td class=" text-xs sm:text-sm"> {cash?.eps?.toFixed(2)}</td>
                                                {/each}
                                            </tr>
                                            <tr class="text-white odd:bg-[#27272A]">
                                                <td class="text-start border-r border-[#191E24] text-white  text-xs sm:text-sm">EPS (Diluted)</td>
                                                {#each income as cash}
                                                <td class=" text-xs sm:text-sm"> {cash?.epsdiluted?.toFixed(2)}</td>
                                                {/each}
                                            </tr>
                                            <tr class="text-white odd:bg-[#27272A]">
                                                <td class="text-start border-r border-[#191E24] text-white  text-xs sm:text-sm">EBITDA</td>
                                                {#each income as cash}
                                                <td class=" text-xs sm:text-sm"> {abbreviateNumber(cash?.ebitda,true)}</td>
                                                {/each}
                                            </tr>
                                            <tr class="text-white odd:bg-[#27272A]">
                                                <td class="text-start border-r border-[#191E24] text-white  text-xs sm:text-sm">Depreciation & Amortization</td>
                                                {#each income as cash}
                                                <td class=" text-xs sm:text-sm"> {abbreviateNumber(cash?.depreciationAndAmortization,true)}</td>
                                                {/each}
                                            </tr>

                                            </tbody>
                                    </table>
                                </div>
                            {/if}
    
                        </div>
    
                    </div>
                </main>
                {:else}
                <div class="w-full flex justify-center items-center h-80">
                    <div class="relative">
                    <label class="bg-[#09090B] rounded-xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <span class="loading loading-spinner loading-md"></span>
                    </label>
                    </div>
                </div>
                {/if}
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