
<script lang="ts">

  import { format, startOfWeek, addDays, addWeeks, subWeeks, differenceInWeeks } from 'date-fns'
  import { screenWidth,  numberOfUnreadNotification } from '$lib/store';
  import logo from '$lib/images/earnings_calender_logo.png';
  import ScrollToTop from '$lib/components/ScrollToTop.svelte';
  import { goto } from '$app/navigation';
  import { abbreviateNumber } from '$lib/utils';
  
  export let data;

  let currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  let earningsCalendar = data?.getEarningsCalendar;
  const maxWeeksChange = 4; // Maximum allowed week change
  let previousMax = false;
  let nextMax = false;
  const today = new Date();

  let formattedMonday = startOfWeek(currentWeek, { weekStartsOn: 1 });
  let formattedTuesday = format( addDays(formattedMonday, 1), "EEE, MMM d");
  let formattedWednesday = format( addDays(formattedMonday, 2), "EEE, MMM d");
  let formattedThursday = format( addDays(formattedMonday, 3), "EEE, MMM d");
  let formattedFriday = format( addDays(formattedMonday, 4), "EEE, MMM d");
  formattedMonday = format( formattedMonday, "EEE, MMM d");

  let formattedWeekday = [formattedMonday, formattedTuesday,formattedWednesday, formattedThursday, formattedFriday];
  let weekday = [];


  let startDate = startOfWeek(currentWeek, { weekStartsOn: 1 });
  let endDate = addDays(startDate, 4);
  let formattedStartDate = format(startDate, "yyyy-MM-dd");
  let formattedEndDate = format(endDate, "yyyy-MM-dd");
  let daysOfWeek = [
      {
        name: "Monday",
        date: formattedStartDate,
      },
      {
        name: "Tuesday",
        date: format(addDays(startDate, 1), "yyyy-MM-dd"),
      },
      {
        name: "Wednesday",
        date: format(addDays(startDate, 2), "yyyy-MM-dd"),
      },
      {
        name: "Thursday",
        date: format(addDays(startDate, 3), "yyyy-MM-dd"),
      },
      {
        name: "Friday",
        date: formattedEndDate,
      },
    ];

  

  let currentDate = new Date();
  let currentWeekday = Math.min((currentDate.getDay() + 6) % 7, 4);
  let selectedWeekday = currentWeekday;
  

  function toggleDate(index)
  {
    if($screenWidth > 640) {
      selectedWeekday = index
    }
  }

function clickWeekday (state, index)  {

    if (state==='next' && selectedWeekday+1 <=4)
    {
      selectedWeekday = selectedWeekday +1;
    }
    else if( state === 'previous' && selectedWeekday-1 >=0)
    {
      selectedWeekday --;
    }

    else if (state=== 'previous' && index === 0 && differenceInWeeks(currentWeek, today) > -maxWeeksChange)
    {
      changeWeek(state)
      selectedWeekday = 4;
    }
    else if (state=== 'next' && index === 4 && differenceInWeeks(currentWeek, today) < maxWeeksChange)
    {
      changeWeek(state)
      selectedWeekday = 0;
    }
  
  }

async function changeWeek(state) {

  //Limit the user to go back max 4 weeks and look forward 4 weeks
  if (state === 'previous' && differenceInWeeks(currentWeek, today) > -maxWeeksChange) {
    currentWeek = subWeeks(currentWeek, 1);
  } else if (state === 'next' && differenceInWeeks(currentWeek, today) < maxWeeksChange) {
    currentWeek = addWeeks(currentWeek, 1);
  }


  formattedMonday = startOfWeek(currentWeek, { weekStartsOn: 1 });
  formattedTuesday = format( addDays(formattedMonday, 1), "EEE, MMM d");
  formattedWednesday = format( addDays(formattedMonday, 2), "EEE, MMM d");
  formattedThursday = format( addDays(formattedMonday, 3), "EEE, MMM d");
  formattedFriday = format( addDays(formattedMonday, 4), "EEE, MMM d");
  formattedMonday = format( formattedMonday, "EEE, MMM d");

  formattedWeekday = [formattedMonday, formattedTuesday,formattedWednesday, formattedThursday, formattedFriday];
  weekday = [];

  startDate = startOfWeek(currentWeek, { weekStartsOn: 1 });
  endDate = addDays(startDate, 4);
  formattedStartDate = format(startDate, "yyyy-MM-dd");
  formattedEndDate = format(endDate, "yyyy-MM-dd");
  daysOfWeek = [
      {
        name: "Monday",
        date: formattedStartDate,
      },
      {
        name: "Tuesday",
        date: format(addDays(startDate, 1), "yyyy-MM-dd"),
      },
      {
        name: "Wednesday",
        date: format(addDays(startDate, 2), "yyyy-MM-dd"),
      },
      {
        name: "Thursday",
        date: format(addDays(startDate, 3), "yyyy-MM-dd"),
      },
      {
        name: "Friday",
        date: formattedEndDate,
      },
    ];


  earningsCalendar = daysOfWeek?.map((day) => {
    return {
      name: day.name,
      data: data?.getEarningsCalendar?.filter(
        (item) => item?.date === day?.date
      ),
    };
  });


  if (earningsCalendar?.length) {
      // Loop through each day of the week
      for (let i = 0; i < earningsCalendar.length; i++) {
        const dayData = earningsCalendar[i].data;

        // Filter out entries with company name "---"

        // Sort and map the filtered data
        weekday[i] = dayData
          .sort((a, b) => b.marketCap - a.marketCap)
      }

  }


}


$: {
  if( earningsCalendar)
  {
    earningsCalendar = daysOfWeek?.map((day) => {
        return {
          name: day.name,
          data: data?.getEarningsCalendar?.filter(
            (item) => item?.date === day?.date
          ),
        };
      });

      if (earningsCalendar?.length) {
          // Loop through each day of the week
          for (let i = 0; i < earningsCalendar.length; i++) {
            const dayData = earningsCalendar[i].data;
    
            // Filter out entries with company name "---"
    
            // Sort and map the filtered data
            weekday[i] = dayData
              .sort((a, b) => b.marketCap - a.marketCap)
          }
    
      }

  }
}

$: {
  if (currentWeek)
  {
    if (differenceInWeeks(currentWeek, today) > -maxWeeksChange)
    {
      previousMax = false;
    }
    else {
      previousMax = true;
    }
  }
}

$: {
  if (currentWeek)
  {
    if (differenceInWeeks(currentWeek, today) < maxWeeksChange)
    {
      nextMax = false;
    }
    else {
      nextMax = true;
    }
  }
}
  
</script>
  

<svelte:head>

<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>
  {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Earnings Calendar · stocknear
</title>
<meta name="description" content={`A list of upcoming earnings on the US stock market, with dates, times and estimated revenue and earnings growth.`} />

<!-- Other meta tags -->
<meta property="og:title" content={`Earnings Calendar · stocknear`}/>
<meta property="og:description" content={`A list of upcoming earnings on the US stock market, with dates, times and estimated revenue and earnings growth.`} />
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`Earnings Calendar · stocknear`}/>
<meta name="twitter:description" content={`A list of upcoming earnings on the US stock market, with dates, times and estimated revenue and earnings growth.`} />
<!-- Add more Twitter meta tags as needed -->

</svelte:head>


  <section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-4 pb-40">
  
    <!--
    <div class="text-sm breadcrumbs ml-4">
      <ul>
        <li><a href="/" class="text-gray-300">Home</a></li> 
        <li class="text-gray-300">Earnings Calendar</li>
      </ul>
    </div>
    -->

    <div class="w-full max-w-4xl m-auto sm:bg-[#27272A] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
    
        <!-- Start Column -->
        <div>
          <div class="flex flex-row justify-center items-center">
            <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
              Earnings Calendar
            </h1>
          </div>

          <span class="hidden sm:block text-white text-md font-medium text-center flex justify-center items-center ">
            Stay updated on upcoming Earnings Calls in the stock market.
          </span>


        </div>
        <!-- End Column -->
    
        <!-- Start Column -->
        <div class="hidden sm:block relative m-auto mb-5 mt-5 sm:mb-0 sm:mt-0">
          <svg class="w-36 -my-5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="5" result="glow"/>
                <feMerge>
                  <feMergeNode in="glow"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path fill="#1E40AF" d="M57.6,-58.7C72.7,-42.6,81.5,-21.3,82,0.5C82.5,22.3,74.7,44.6,59.7,60.1C44.6,75.6,22.3,84.3,0,84.3C-22.3,84.2,-44.6,75.5,-61.1,60.1C-77.6,44.6,-88.3,22.3,-87.6,0.7C-86.9,-20.8,-74.7,-41.6,-58.2,-57.7C-41.6,-73.8,-20.8,-85.2,0.2,-85.4C21.3,-85.6,42.6,-74.7,57.6,-58.7Z" transform="translate(100 100)" filter="url(#glow)" />
          </svg>
          
          
          <div class="z-1 absolute top-0">
            <img class="w-20 ml-5" src={logo} alt="logo" loading="lazy">
          </div>
        </div>
        <!-- End Column -->
      </div>

  
    </div>
    
      <!-- Page wrapper -->
      <div class="flex justify-center w-full max-w-5xl m-auto h-full overflow-hidden">
      
              
            
    
        <!-- Content area -->
        <div class="relative flex flex-col flex-1 overflow-hidden">

              
        <!-- Cards -->
        <div class=" w-full flex flex-row justify-center m-auto items-center pl-2 pr-2 sm:pl-0 sm:pr-0">
            <!-- Start Columns -->
            <label on:click={() => changeWeek('previous')} class="{previousMax ? 'opacity-80' : ''} hidden sm:flex h-16 w-48 cursor-pointer border m-auto flex bg-[#3C40F0] hover:bg-purple-600 border border-blue-600 mb-3">
              <svg class="w-6 h-6 m-auto rotate-180 " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M8.025 22L6.25 20.225L14.475 12L6.25 3.775L8.025 2l10 10l-10 10Z"/></svg>
            </label>
            {#each weekday as day,index}
            
            <div class="w-full {index === selectedWeekday ? '' : 'hidden sm:block'}">
                    <label on:click={() => toggleDate(index)} class="w-11/12 m-auto sm:w-full cursor-pointer h-16 {index === selectedWeekday ? 'bg-purple-600 bg-opacity-[0.6] sm:bg-[#A24D51] sm:gradient-effect' : ''} rounded-lg sm:rounded-none flex bg-[#3C40F0] border border-blue-600 mb-3">
                      <div class=" flex flex-row justify-center items-center w-full ">
                        <label on:click={() => clickWeekday('previous', index) } class="{previousMax === true && index === 0? 'opacity-20' : ''} sm:hidden ml-auto">
                          <svg class="w-8 h-8 inline-block rotate-180 " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M8.025 22L6.25 20.225L14.475 12L6.25 3.775L8.025 2l10 10l-10 10Z"/></svg>
                        </label>
                        <div class="flex flex-col text-white truncate m-auto p-1">
                          <span class="font-medium text-md">{formattedWeekday[index]}</span>
                          <span class="text-sm m-auto pt-1 pb-1"> {day.length} Earnings</span>
                        </div>
                        <label on:click={() => clickWeekday('next', index) } class="{nextMax === true && index === 4? 'opacity-20' : ''} sm:hidden mr-auto">
                          <svg class="w-8 h-8 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M8.025 22L6.25 20.225L14.475 12L6.25 3.775L8.025 2l10 10l-10 10Z"/></svg>
                        </label>
                      </div>
                    </label>
                </div>
            {/each}
            <label on:click={() => changeWeek('next')} class="{nextMax ? 'opacity-80' : ''} hidden sm:flex h-16 w-48 cursor-pointer border m-auto flex bg-[#3C40F0] hover:bg-purple-600 border border-blue-600 mb-3">
              <svg class="w-6 h-6 m-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M8.025 22L6.25 20.225L14.475 12L6.25 3.775L8.025 2l10 10l-10 10Z"/></svg>
            </label>
        </div>


          
          {#each weekday as day,index}
            {#if index === selectedWeekday}
              {#if day?.length !== 0}
                <table class="hidden sm:inline-table table-sm table-compact rounded-none sm:rounded-md w-full bg-[#09090B] border-bg-[#09090B] m-auto mt-4 ">
                    <thead>
                      <tr>
                        <th class="text-start text-slate-200 font-bold text-sm">Symbol</th>
                        <th class="text-start text-slate-200 font-bold text-sm">Company Name</th>
                        <th class="text-slate-200 font-bold text-sm">Market Cap</th>
                        <th class="text-slate-200 font-bold hidden sm:table-cell text-sm">Revenue Estimate</th>
                        <th class="text-slate-200 font-bold hidden sm:table-cell text-sm">EPS Estimate</th>
                        <th class="text-slate-200 font-bold text-sm text-end">Earnings Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each day as item, index}
                      <!-- row -->
                      <tr on:click={() => goto("/stocks/"+item?.symbol)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B] cursor-pointer">
                        
                        <td class="text-blue-400 border-b-[#09090B] text-start">
                          {item?.symbol}
                        </td>

                        <td class="text-gray-200 border-b-[#09090B]">
                          {item?.name.length > 20 ? item?.name?.slice(0,20) + "..." : item?.name}
                        </td>

                    <td class="text-white border-b-[#09090B] text-center">
                      {item?.marketCap !== null ? '$' + abbreviateNumber(item?.marketCap) : '-'}
                    </td>

                    <td class="text-white hidden sm:table-cell text-center border-b-[#09090B]">
                      {item?.revenueEstimated !== null ? '$' + abbreviateNumber(item?.revenueEstimated) : '-'}
                    </td>

                    <td class="text-white hidden sm:table-cell text-center  border-b-[#09090B]">
                      {item?.epsEstimated !== null ? item?.epsEstimated : '-'}
                    </td>


                    <td class="text-white border-b-[#09090B] text-end">
                      {#if item?.time === 'amc'}
                      <svg class="w-4 h-4 inline-block mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#70A1EF" d="M232.13 143.64a6 6 0 0 0-6-1.49a90.07 90.07 0 0 1-112.27-112.3a6 6 0 0 0-7.49-7.48a102.88 102.88 0 0 0-51.89 36.31a102 102 0 0 0 142.84 142.84a102.88 102.88 0 0 0 36.31-51.89a6 6 0 0 0-1.5-5.99m-42 48.29a90 90 0 0 1-126-126a90.9 90.9 0 0 1 35.52-28.27a102.06 102.06 0 0 0 118.69 118.69a90.9 90.9 0 0 1-28.24 35.58Z"/></svg>
                      <span class="text-sm">After Close</span>
                      {:else}
                      <svg class="w-4 h-4 inline-block mr-1"  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g fill="#FEC001"><path d="M184 128a56 56 0 1 1-56-56a56 56 0 0 1 56 56Z" opacity=".2"/><path d="M120 40V16a8 8 0 0 1 16 0v24a8 8 0 0 1-16 0Zm72 88a64 64 0 1 1-64-64a64.07 64.07 0 0 1 64 64Zm-16 0a48 48 0 1 0-48 48a48.05 48.05 0 0 0 48-48ZM58.34 69.66a8 8 0 0 0 11.32-11.32l-16-16a8 8 0 0 0-11.32 11.32Zm0 116.68l-16 16a8 8 0 0 0 11.32 11.32l16-16a8 8 0 0 0-11.32-11.32ZM192 72a8 8 0 0 0 5.66-2.34l16-16a8 8 0 0 0-11.32-11.32l-16 16A8 8 0 0 0 192 72Zm5.66 114.34a8 8 0 0 0-11.32 11.32l16 16a8 8 0 0 0 11.32-11.32ZM48 128a8 8 0 0 0-8-8H16a8 8 0 0 0 0 16h24a8 8 0 0 0 8-8Zm80 80a8 8 0 0 0-8 8v24a8 8 0 0 0 16 0v-24a8 8 0 0 0-8-8Zm112-88h-24a8 8 0 0 0 0 16h24a8 8 0 0 0 0-16Z"/></g></svg>
                      <span class="text-sm">Before Open</span>
                      {/if}
                  </td>
        
        
                      </tr>
                      
                    
        
        
                      {/each}
                    </tbody>
                  </table>



                  <div class="relative p-2 sm:hidden pt-5">
                    {#each day as item}
                    <div class="bg-[#09090B] rounded-lg border border-slate-800 shadow-lg h-auto pb-5 pl-2 pr-2 pt-4 mb-7">
                          <div class="flex flex-row items-center">
                            <!--
                            <div class="rounded-full w-10 h-10 relative bg-[#101112] flex items-center justify-center">
                              <img style="clip-path: circle(50%);" class="w-6 h-6" src={`https://financialmodelingprep.com/image-stock/${item?.symbol}.png`} loading="lazy"/>
                            </div>
                            -->
                            <label on:click={() => goto("/stocks/"+item?.symbol)} class="cursor-pointer flex flex-col ml-3 w-40">
                              <span class="text-blue-400 text-sm">{item?.symbol}</span>
                              <span class="text-white text-sm">{item?.name}</span>
                            </label>

                            <div class="flex flex-col justify-end items-end ml-auto">
                              <span class="font-medium text-slate-300 text-end">Earnings Time</span>
                              <span class="text-white text-opacity-[0.8] text-sm text-end">
                                {#if item?.time === 'amc'}
                                  <svg class="w-5 h-5 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#70A1EF" d="M232.13 143.64a6 6 0 0 0-6-1.49a90.07 90.07 0 0 1-112.27-112.3a6 6 0 0 0-7.49-7.48a102.88 102.88 0 0 0-51.89 36.31a102 102 0 0 0 142.84 142.84a102.88 102.88 0 0 0 36.31-51.89a6 6 0 0 0-1.5-5.99m-42 48.29a90 90 0 0 1-126-126a90.9 90.9 0 0 1 35.52-28.27a102.06 102.06 0 0 0 118.69 118.69a90.9 90.9 0 0 1-28.24 35.58Z"/></svg>
                                  <span class="font-medium text-sm">After Close</span>
                                  {:else}
                                  <svg class="w-5 h-5 inline-block"  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g fill="#FEC001"><path d="M184 128a56 56 0 1 1-56-56a56 56 0 0 1 56 56Z" opacity=".2"/><path d="M120 40V16a8 8 0 0 1 16 0v24a8 8 0 0 1-16 0Zm72 88a64 64 0 1 1-64-64a64.07 64.07 0 0 1 64 64Zm-16 0a48 48 0 1 0-48 48a48.05 48.05 0 0 0 48-48ZM58.34 69.66a8 8 0 0 0 11.32-11.32l-16-16a8 8 0 0 0-11.32 11.32Zm0 116.68l-16 16a8 8 0 0 0 11.32 11.32l16-16a8 8 0 0 0-11.32-11.32ZM192 72a8 8 0 0 0 5.66-2.34l16-16a8 8 0 0 0-11.32-11.32l-16 16A8 8 0 0 0 192 72Zm5.66 114.34a8 8 0 0 0-11.32 11.32l16 16a8 8 0 0 0 11.32-11.32ZM48 128a8 8 0 0 0-8-8H16a8 8 0 0 0 0 16h24a8 8 0 0 0 8-8Zm80 80a8 8 0 0 0-8 8v24a8 8 0 0 0 16 0v-24a8 8 0 0 0-8-8Zm112-88h-24a8 8 0 0 0 0 16h24a8 8 0 0 0 0-16Z"/></g></svg>
                                  <span class="font-medium text-sm">Before Open</span>
                                {/if}
                              </span>
                            </div>
                          </div>
                          <div class="border-1 border-b border-slate-800 w-full mt-5 mb-5" />

                          <div class="flex flex-row items-center">
                            <div class="flex flex-col ml-3 w-40">
                              <span class="font-medium text-slate-300">Market Cap</span>
                              <span class="text-white text-md">
                                {item?.marketCap !== null ? abbreviateNumber(item?.marketCap,true) : '-'}
                              </span>
                            </div>

                            <div class="flex flex-col justify-end items-end ml-auto">
                              <span class="font-medium text-slate-300 text-end">Forecasted EPS</span>
                              <span class="text-white text-md text-end">
                                {item?.epsEstimated !== null ? item?.epsEstimated : '-'}
                              </span>
                            </div>
                          </div>

                          <div class="border-1 border-b border-slate-800 w-full mt-5 mb-5" />

                          <div class="flex flex-row items-center">
                            <div class="flex flex-col ml-3 w-40">
                              <span class="font-medium text-slate-300">Current Revenue</span>
                              <span class="text-white text-md">
                                {item?.revenue !== null ? abbreviateNumber(item?.revenue,true) : '-'}
                              </span>
                            </div>

                            <div class="flex flex-col justify-end items-end ml-auto">
                              <span class="font-medium text-slate-300 text-end">Forecasted Revenue</span>
                              <span class="text-white text-md text-end">
                                {item?.revenueEstimated !== null ? '$' + abbreviateNumber(item?.revenueEstimated) : '-'}
                              </span>
                            </div>
                          </div>


                      </div>
                    {/each}

                    <ScrollToTop />

                  </div>
                

                {:else}
                  <h2 class=" mt-20 justify-center items-center text-3xl font-bold text-slate-700 mb-5 m-auto">
                    No data available
                  </h2>
                {/if}
              {/if}
            {/each}
  
      </div>
  
  </section>
  





<style>
  .gradient-effect {
    background: linear-gradient(100deg, #B46266, #A24D51);
    color: #fff;
    position: relative;
    overflow: hidden;
  }

</style>
  