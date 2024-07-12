<script lang="ts">

  import {numberOfUnreadNotification, displayCompanyName, stockTicker} from '$lib/store';
  import { Chart } from 'svelte-echarts'
  
  import { abbreviateNumber } from '$lib/utils';

  export let data;

  let employeeHistory = data?.getHistoryEmployee ?? [];
  let historyList = sortByDate(employeeHistory);

  let employees = 'n/a';
  let changeRate = 'n/a';
  let growthRate = 'n/a';
  
  let optionsTotal;
  let optionsChange;
  let optionsGrowth;
  let dateDistance = false;
  
  let sortBy = 'Total';


function sortByDate(liste) {
  //Slice copies the list otherwise employeesHistory will reverse too
  return liste?.slice()?.sort(function(a, b) {
	  return new Date(b?.filingDate) - new Date(a?.filingDate);
	});
}


function selectSortingMethod(state:string) {
  sortBy = state;
}

  
  function plotTotal() {
      
    let dateList = [];
    let employeeList = [];
    let growthList = [];

  
    for (let i = 0; i < employeeHistory?.length; i++) {
        const current = employeeHistory[i]?.employeeCount;
        //const previousDividend = i === 0 ? 0 : employeeHistory[i - 1]?.dividend;
  
        dateList?.push(employeeHistory[i]?.filingDate);
        employeeList?.push(current);
  
        //const growthRate = ( (currentDividend - previousDividend) / previousDividend ) ;
  
        //growthList.push(growthRate?.toFixed(2))
        
    }
  
      
    const options = {
      grid: {
          left: '0%',
          right: '2%',
          top: '10%',
          bottom: '20%',
          containLabel: true,
          },
    xAxis: {
      data: dateList,
      type: 'category',
    },
    yAxis: [
        {
            type: 'value',
            axisLabel: {
            formatter: '{value}',
            },
            splitLine: {
            show: false, // Disable x-axis grid lines
            },
        },
        ],
      
    
    series: [

      {
        name: 'Total Employees',
        data: employeeList,
        type: 'bar',
        barWidth: '80%',
        smooth: true,
        itemStyle: {
                  // Define colors based on positive/negative values
                  color: function(params) {
                      return '#F8901E';
                  }
              },
      },
      
    ],
    tooltip: {
      trigger: 'axis',
    },
  };
  
  
      return options;
  }
  

  function plotChange() {
      
      let dateList = [];
      let changeList = [];
    
      for (let i = 0; i < employeeHistory?.length; i++) {
          const current = employeeHistory[i]?.employeeCount;
          const previous = i === 0 ? 0 : employeeHistory[i - 1]?.employeeCount;
          
          const change =  (current - previous)  ;
          dateList?.push(employeeHistory[i]?.filingDate);
          changeList?.push(change);
    
         
          
      }
    
        
      const options = {
        grid: {
          left: '0%',
          right: '0%',
          top: '10%',
          bottom: '20%',
          containLabel: true,
          },
      xAxis: {
        data: dateList,
        type: 'category',
      },
      yAxis: [
        {
            type: 'value',
            axisLabel: {
            formatter: '{value}',
            },
            splitLine: {
            show: false, // Disable x-axis grid lines
            },
        },
        ],
      
      
      series: [

        {
          name: 'Change of Numbers',
          data: changeList,
          type: 'bar',
          barWidth: '80%',
          smooth: true,
          itemStyle: {
                  // Define colors based on positive/negative values
                  color: function(params) {
                      return params.data >= 0 ? '#10DB06' : '#FF2F1F';
                  }
              },
        },
        
      ],
      tooltip: {
        trigger: 'axis',
      },
    };
    
    
        return options;
    }




function plotGrowth() {
      
      let dateList = [];
      let growthList = [];

    
      for (let i = 0; i < employeeHistory?.length; i++) {
          const current = employeeHistory[i]?.employeeCount;
          const previous = i === 0 ? 0 : employeeHistory[i - 1]?.employeeCount;

          if (current !== null && previous !== null && previous !== 0) {
              const growth = (((current - previous) / previous) * 100 )?.toFixed(2);
              growthList?.push(growth);
          } else {
              growthList?.push(0); // Pushing null if the growth calculation is not possible
          }

          dateList?.push(employeeHistory[i]?.filingDate);
      }


    
        
      const options = {
        grid: {
          left: '0%',
          right: '0%',
          top: '10%',
          bottom: '20%',
          containLabel: true,
          },
      xAxis: {
        data: dateList,
        type: 'category',
      },
      yAxis: [
        {
            type: 'value',
            axisLabel: {
            formatter: '{value} %',
            },
            splitLine: {
            show: false, // Disable x-axis grid lines
            },
        },
        ],
      
      series: [
          {
              name: 'Growth (%)',
              data: growthList,
              type: 'bar',
              barWidth: '80%',
              smooth: true,
              itemStyle: {
                  // Define colors based on positive/negative values
                  color: function(params) {
                      return params.data >= 0 ? '#10DB06' : '#FF2F1F';
                  }
              },
          },
      ],
      tooltip: {
          trigger: 'axis',
        
      },
    };
    
    
        return options;
    }
  
    

if(employeeHistory?.length !== 0)
{
employees = employeeHistory?.at(-1)?.employeeCount;

changeRate = employees - employeeHistory?.at(-2)?.employeeCount;

dateDistance = new Date(employeeHistory[employeeHistory?.length -1]['filingDate']) < new Date(new Date().setFullYear(new Date().getFullYear() - 1)) ? true : false;


growthRate = ((employeeHistory[employeeHistory?.length -1]?.employeeCount/ employeeHistory[employeeHistory?.length -2]?.employeeCount -1 ) *100 )?.toFixed(2);
optionsTotal = plotTotal();
optionsChange = plotChange();
optionsGrowth = plotGrowth();
}

</script>



<svelte:head>

<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>
{$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {$displayCompanyName} ({$stockTicker}) Number of Employees · stocknear
</title>
<meta name="description" content={`Detailed historical employees number for ${$displayCompanyName} (${$stockTicker}). See many years of change, growth and the impact.`} />

<!-- Other meta tags -->
<meta property="og:title" content={`${$displayCompanyName} (${$stockTicker}) Number of Employees · stocknear`}/>
<meta property="og:description" content={`Detailed historical employees number for ${$displayCompanyName} (${$stockTicker}). See many years of change, growth and the impact.`} />
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`${$displayCompanyName} (${$stockTicker}) Number of Employees · stocknear`}/>
<meta name="twitter:description" content={`Detailed historical employees number for ${$displayCompanyName} (${$stockTicker}). See many years of change, growth and the impact.`} />
<!-- Add more Twitter meta tags as needed -->

</svelte:head>


            
  <section class="bg-[#0F0F0F] overflow-hidden text-white h-full mb-40 sm:mb-0">
      <div class="flex justify-center m-auto h-full overflow-hidden">
          <div class="relative flex justify-center items-center overflow-hidden">
                <div class="sm:p-7 w-full sm:max-w-3xl m-auto mt-2 sm:mt-0">
                      <div class="mb-6">
                          <h2 class="text-2xl sm:text-3xl text-gray-200 font-bold mb-4">
                              Employees
                          </h2>
  
                          <div class="text-white p-3 sm:p-5 mb-5 rounded-lg sm:flex sm:flex-row sm:items-center border border-slate-800 text-sm sm:text-[1rem]">
                            <svg class="w-6 h-6 flex-shrink-0 inline-block sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                            
                            {#if employeeHistory?.length !== 0 && !dateDistance}
                            <div>
                            {$displayCompanyName}
                                had
                                    {abbreviateNumber(employees)}
                                employees on 
                                {new Date(employeeHistory[employeeHistory?.length -1]['filingDate'])?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}.
                                The number of employees {changeRate >=0 ? 'increased' : 'decreased'} by
                                    {abbreviateNumber(changeRate)}
                                or
                                <span class="{changeRate >=0 ? 'text-[#10DB06]' : 'text-[#FF2F1F]'}">
                                    {growthRate}%
                                </span>
                                compared to the previous year.
                            </div>
                          {:else if employeeHistory?.length !== 0 && dateDistance}
                            {$displayCompanyName} had {abbreviateNumber(employees)} employees on 
                                {new Date(employeeHistory[employeeHistory?.length -1]['filingDate'])?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}.
                                Since then, the company has not submitted any additional employee data for more than a year.
                          {:else}
                          No employee history for {$displayCompanyName}. Probably, no records of past employees.
                          {/if}
                        </div>
  
                      </div>

                      
                      <div class="grid grid-cols-2 sm:grid-cols-3 gap-10 sm:gap-5 bg-[#202020] shadow-md rounded-xl p-5 flex justify-center items-center mb-2">
                        <!--Start Column Title-->
                        <div class="flex flex-col">
                          <div class="flex flex-row items-center">
                            <span class="text-gray-300 font-medium text-[1rem]">
                              Total Employees
                            </span>
                          </div>
                        
                          <span class="text-white text-[1rem] font-semibold">
                            {abbreviateNumber(employees)}
                          </span>
                        </div>
                        <!--End Column Title-->
                  
                        <!--Start Column Win Rate-->
                        <div class="flex flex-col">
                          <div class="flex flex-row items-center">
                            <span class="text-gray-300 font-medium text-[1rem] ">
                                Change (1Y)
                            </span>
                          </div>
                          <span class="text-white text-[1rem] font-semibold">
                            {#if dateDistance}
                            n/a
                            {:else}
                              {abbreviateNumber(changeRate)}
                            {/if}
                          </span>
                        </div>
                        <!--End Column Win Rate-->
                  
                        <!--Start Column Performance-->
                        <div class="flex flex-col">
                            <div class="flex flex-row items-center">
                              <span class="text-gray-300 font-medium text-[1rem]">
                              Growth (1Y)
                              </span>
                            </div>
                            <span class="text-white  text-[1rem] font-semibold">
                              {#if growthRate >= 0}
                              <span class="text-white text-md font-medium">
                                <svg class="w-5 h-5 inline-block -mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                                  <span class="text-[#10DB06] text-[1rem]">+{growthRate}%</span>
                              </span>
                              {:else if growthRate < 0}
                              <div class="text-white text-md font-medium">
                                  <svg class="w-5 h-5 rotate-180 inline-block -mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                                  <span class="text-[#FF2F1F] text-[1rem]">{growthRate}%</span>
                              </div>
                              {:else}
                                <span class="text-white m-auto">
                                  n/a
                                </span>
                              {/if}
                            </span>
                          </div>
                    <!--End Column-->
                    </div>

                         
      
                      
      
                      <div class="flex flex-row items-center w-full mt-10 mb-8">
      
                          <h1 class="text-xl text-white font-semibold ">
                          Employees History
                          </h1>
      
      
                          <div class="{employeeHistory?.length === 0 ? 'hidden' : ''} flex justify-end ml-auto items-center mr-2">

                                  <label for="sortByModal" class="cursor-pointer bg-[#202020] sm:hover:bg-[#313131] duration-100 transition ease-in-out px-4 py-1.5 rounded-lg shadow-md">
                                      <div class="flex flex-row">
                                          <span class="text-sm  m-auto font-medium text-white">
                                          {sortBy}
                                          </span>
                                          <svg class="inline-block w-4 h-4 ml-1 mt-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                                              <g transform="rotate(180 512 512)">
                                                  <path fill="#fff" d="m488.832 344.32l-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872l319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z"/>
                                              </g>
                                          </svg>
                                      </div>
                                  </label>
                                  
                          
                              </div>
                      </div>
                      
      
                      
                              
                          {#if historyList?.length !== 0}


                          {#if sortBy === 'Total'}
                          <div class="app w-full">
                              <Chart options={optionsTotal} class="chart" />
                          </div>
                          {:else if sortBy === 'Change'}
                          <div class="app w-full">
                              <Chart options={optionsChange} class="chart" />
                          </div>
                          {:else if sortBy === 'Growth'}
                          <div class="app w-full">
                              <Chart options={optionsGrowth} class="chart" />
                          </div>
                          {/if}
                          
                          <div class="flex justify-start items-center w-full m-auto pr-1 pl-1 p-3">
                              <table class="table table-sm table-compact flex justify-start items-center w-full px-3 m-auto">
                              <thead>
                                  <tr>
                                  <th class="text-start border-b border-[#0F0F0F] bg-[#0F0F0F] text-white text-sm font-semibiold">
                                      Date
                                  </th>
                                  <th class="text-end border-b border-[#0F0F0F] bg-[#0F0F0F] text-white text-sm font-semibiold">
                                      Employees
                                  </th>
                                  <th class="text-end border-b border-[#0F0F0F] bg-[#0F0F0F] hidden sm:table-cell text-white text-sm font-semibiold">
                                      Change
                                  </th>
                                  <th class="text-end border-b border-[#0F0F0F] bg-[#0F0F0F] text-white text-sm font-semibiold">
                                      Growth
                                  </th>
                                </tr>
                              </thead>
                              <tbody class="">
                                {#each historyList as item, index}
                                <tr class="text-gray-200 odd:bg-[#202020]">
                                  <td class="text-start border-b border-[#0F0F0F] text-xs sm:text-sm text-white">
                                    {new Date(item?.filingDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                  </td>
                                  <td class="text-end border-b border-[#0F0F0F] text-xs sm:text-sm text-white">
                                    {new Intl.NumberFormat("en").format(item?.employeeCount)}
                                  </td>
                                  <td class="text-end border-b border-[#0F0F0F] text-xs sm:text-sm hidden sm:table-cell text-white">
                                    {abbreviateNumber(item?.employeeCount-historyList[index+1]?.employeeCount)}
                                  </td>
                                  <td class="text-end border-b border-[#0F0F0F] text-xs sm:text-sm text-white text-end">
                                    {#if index+1-historyList?.length == 0}
                                    0.00%
                                    {:else}
                                    {#if (item?.employeeCount- historyList[index+1]?.employeeCount) > 0}
                                    <svg class="w-5 h-5 -mr-1 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                                    <span class="text-[#10DB06]">
                                      +{(((item?.employeeCount-historyList[index+1]?.employeeCount) / item?.employeeCount) * 100 )?.toFixed(2)}%
                                    </span>
                                    {:else if (item?.employeeCount - historyList[index+1]?.employeeCount ) < 0}
                                    <span class="text-[#FF2F1F]">
                                      <svg class="w-5 h-5 rotate-180 inline-block -mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                                      {(((historyList[index+1]?.employeeCount - item?.employeeCount) / item?.employeeCount) * 100 )?.toFixed(2)}%
                                    </span>
                                    {:else}
                                    0.00%
                                    {/if}
                                    {/if}
                                  </td>
                                </tr>
                                {/each}
                              </tbody>
                              
                              </table>
                          </div>
                          
      
                      {:else}
                      <h1 class="text-xl m-auto flex justify-center text-gray-200 font-medium mb-4 mt-10">
                          No history found
                      </h1>
                      {/if}
      
                


                </div>

                
          </div>
      </div>
  
      
  </section>
  
  
  


<!--Start Sort By Modal-->
<input type="checkbox" id="sortByModal" class="modal-toggle" />
    
<dialog id="sortByModal" class="modal modal-bottom sm:modal-middle ">


  <label id="sortByModal" for="sortByModal"  class="cursor-pointer modal-backdrop bg-[#0F0F0F] bg-opacity-[0.5]"></label>
  
  
  <div class="modal-box w-full bg-[#202020] sm:border sm:border-slate-800">



  <label for="sortByModal" class="cursor-pointer absolute right-5 top-2 bg-[#202020] text-[1.8rem] text-white">
    ✕
  </label>

    <div class="text-white">
      
      <h3 class="font-medium text-lg sm:text-xl mb-10">
        Sort By
      </h3>
        

      <div class="flex flex-col items-center w-full max-w-3xl bg-[#202020]">
        


        <label for="sortByModal" on:click={() => selectSortingMethod('Total')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">

          <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'Total' ? 'ring-2 ring-[#04E000]' : ''}">
            
            <span class="ml-1 text-white font-medium mr-auto">
              Total
            </span>

            <div class="rounded-full w-8 h-8 relative border border-[#737373]">
              {#if sortBy === 'Total'}
              <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
              {/if}
            </div>

          </div>
         
        </label>


        <label for="sortByModal" on:click={() => selectSortingMethod('Change')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">

            <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'Change' ? 'ring-2 ring-[#04E000]' : ''}">
              
              <span class="ml-1 text-white font-medium mr-auto">
                Change
              </span>

              <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                {#if sortBy === 'Change'}
                  <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                {/if}
              </div>

            </div>
           
        </label>





        <label for="sortByModal" on:click={() => selectSortingMethod('Growth')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
          <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {sortBy === 'Growth' ? 'ring-2 ring-[#04E000]' : ''}">
            <span class="ml-1 text-white font-medium mr-auto">
              Growth
            </span>
            <div class="rounded-full w-8 h-8 relative border border-[#737373]">
              {#if sortBy === 'Growth'}
                <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
              {/if}
            </div>
          </div>
        </label>



      </div>
       
    </div>


        
      </div>
  </dialog>
<!--End Sort By Modal-->

      
  <style>
    .app {
        height: 450px;
        max-width: 1500px;
    }
    
    @media (max-width: 560px) {
        .app {
            max-width: 520px;
            height: 450px;
        }
    }
  
    .chart {
        width: 100%;
    }
  </style>