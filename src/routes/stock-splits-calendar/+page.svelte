
<script lang="ts">

  import { format, startOfWeek, addDays, addWeeks, subWeeks, differenceInWeeks } from 'date-fns'
  import { screenWidth,  numberOfUnreadNotification } from '$lib/store';
  import logo from '$lib/images/split_logo.png';
  import ScrollToTop from '$lib/components/ScrollToTop.svelte';
  import { goto } from '$app/navigation';
  import { abbreviateNumber } from '$lib/utils';
    
    export let data;
    let currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    let stockSplitsCalendar = data?.getStockSplitsCalendar;
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
  
  
    stockSplitsCalendar = daysOfWeek.map((day) => {
      return {
        name: day.name,
        data: data?.getStockSplitsCalendar?.filter(
          (item) => item.date === day.date
        ),
      };
    });
  
  
    if (stockSplitsCalendar?.length) {
        // Loop through each day of the week
        for (let i = 0; i < stockSplitsCalendar.length; i++) {
          const dayData = stockSplitsCalendar[i].data;
  
          // Filter out entries with company name "---"
  
          // Sort and map the filtered data
          weekday[i] = dayData
            .sort((a, b) => b.marketCap - a.marketCap)
        }
  
    }
  
  
  }
      
  $: {
    if( stockSplitsCalendar)
    {
      stockSplitsCalendar = daysOfWeek.map((day) => {
          return {
            name: day.name,
            data: data?.getStockSplitsCalendar?.filter(
              (item) => item.date === day.date
            ),
          };
        });
  
        if (stockSplitsCalendar?.length) {
            // Loop through each day of the week
            for (let i = 0; i < stockSplitsCalendar.length; i++) {
              const dayData = stockSplitsCalendar[i].data;
      
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

  let charNumber = 20;
    
  $: {
    if ($screenWidth < 640)
    {
      charNumber = 10;
    }
    else {
      charNumber = 20;
    }
  }
  
    
  </script>
        
      
<svelte:head>

<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>
  {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Stock Splits Calendar · stocknear
</title>
<meta name="description" content={`A list of upcoming stock splits on the US stock market, with dates, times and market cap.`} />

<!-- Other meta tags -->
<meta property="og:title" content={`Stock Splits Calendar · stocknear`}/>
<meta property="og:description" content={`A list of upcoming stock splits on the US stock market, with dates, times and market cap.`} />
<meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`Stock Splits Calendar · stocknear`}/>
<meta name="twitter:description" content={`A list of upcoming stock splits on the US stock market, with dates, times and market cap.`} />
<meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
<!-- Add more Twitter meta tags as needed -->

</svelte:head>
            
      
      
      
<section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-4 pb-40">
  <!--
  <div class="text-sm breadcrumbs ml-4">
    <ul>
      <li><a href="/" class="text-gray-300">Home</a></li> 
      <li class="text-gray-300">Stock Splits Calendar</li>
    </ul>
  </div>
  -->

      
          <div class="w-full max-w-4xl m-auto sm:bg-[#202020] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pt-10 sm:pb-10 sm:mt-3 mb-8">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
          
              <!-- Start Column -->
              <div>
                <div class="flex flex-row justify-center items-center">
                  <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
                    Stock Splits Calendar
                  </h1>
                </div>
      
                <span class="hidden sm:block text-white text-md font-medium text-center flex justify-center items-center ">
                  Stay updated on upcoming Splits in the stock market.
                </span>
    
      
              </div>
              <!-- End Column -->
          
              <!-- Start Column -->
              <div class="hidden sm:block relative m-auto mb-5 mt-5 sm:mb-0 sm:mt-0">
                <svg class="w-40 -my-5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
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
                
                
                <div class="z-1 absolute top-1">
                  <img class="w-36 ml-7" src={logo} alt="logo" loading="lazy">
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
                <div class="w-full flex flex-row justify-center m-auto items-center pl-2 pr-2 sm:pl-0 sm:pr-0">
                    <!-- Start Columns -->
                    <label on:click={() => changeWeek('previous')} class="{previousMax ? 'opacity-80' : ''} hidden sm:flex h-16 w-48 cursor-pointer border m-auto flex bg-[#3C40F0] hover:bg-purple-600 border border-blue-600 mb-3">
                      <svg class="w-6 h-6 m-auto rotate-180 " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M8.025 22L6.25 20.225L14.475 12L6.25 3.775L8.025 2l10 10l-10 10Z"/></svg>
                    </label>
                    {#each weekday as day,index}
                    
                    <div class="w-full {index === selectedWeekday ? '' : 'hidden sm:block'}">
                            <label on:click={() => toggleDate(index)} class="w-11/12 sm:w-full m-auto  cursor-pointer h-16 {index === selectedWeekday ? 'bg-purple-600 bg-opacity-[0.6] sm:bg-[#A24D51] sm:gradient-effect' : ''} rounded-lg sm:rounded-none flex bg-[#3C40F0] border border-blue-600 mb-3">
                              <div class=" flex flex-row justify-center items-center w-full">
                                <label on:click={() => clickWeekday('previous', index) } class="sm:hidden ml-auto">
                                  <svg class="w-8 h-8 inline-block rotate-180 " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M8.025 22L6.25 20.225L14.475 12L6.25 3.775L8.025 2l10 10l-10 10Z"/></svg>
                                </label>
                                <div class="flex flex-col text-white truncate m-auto p-1">
                                  <span class="font-medium text-md">{formattedWeekday[index]}</span>
                                  <span class="text-sm m-auto pt-1 pb-1"> {day.length} Earnings</span>
                                </div>
                                <label on:click={() => clickWeekday('next', index) } class="sm:hidden mr-auto">
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
                      <table class="hidden sm:inline-table table-sm table-compact rounded-none sm:rounded-md w-full border-bg-[#0F0F0F] m-auto mt-4 ">
                          <thead>
                            <tr>
                              <th class="text-slate-200 font-medium text-sm text-start">Symbol</th>
                              <th class="text-slate-200 font-medium text-sm text-start">Company Name</th>
                              <th class="text-slate-200 font-medium hidden sm:table-cell text-sm text-start">Earnings per Share</th>
                              <th class="text-slate-200 font-medium text-sm text-start">Market Cap</th>
                              <th class="text-slate-200 font-medium text-sm text-end">Split</th>
                            </tr>
                          </thead>
                          <tbody>
                            {#each day as item}
                            <!-- row -->
                            <tr on:click={() => goto("/stocks/"+item?.symbol)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] bg-[#0F0F0F] border-b-[#0F0F0F] shake-ticker cursor-pointer">
                              
                              <td class="text-blue-400 border-b-[#0F0F0F]">
                                {item?.symbol}
                              </td>

                              <td class="text-white border-b-[#0F0F0F]">
                                  {item?.name?.length > 40 ? item?.name?.slice(0,40) + "..." : item?.name}
                              </td>
          
                            <td class="text-white font-medium hidden sm:table-cell border-b-[#0F0F0F]">
                                {item?.eps !== null ? item?.eps : '-'}
                            </td>

                            <td class="text-white font-medium border-b-[#0F0F0F]">
                                {item?.marketCap !== null ? '$' + abbreviateNumber(item?.marketCap) : '-'}
                            </td>

                            <td class="text-white font-medium text-sm text-end mr-1 border-b-[#0F0F0F]">
                                <span class="">From {item?.denominator} to {item?.numerator}</span>
                            </td>
              
              
                            </tr>
                            
                          
              
              
                            {/each}
                          </tbody>
                        </table>


                        <div class="relative p-2 sm:hidden pt-5">
                          {#each day as item}
                            <div class="bg-[#202020] rounded-lg border border-slate-800 h-auto pb-3 pl-2 pr-2 pt-4 mb-7">
                                <div class="flex flex-row items-center">
                                  <div class="rounded-full w-10 h-10 relative bg-[#101112] flex items-center justify-center">
                                    <img style="clip-path: circle(50%);" class="w-6 h-6" src={`https://financialmodelingprep.com/image-stock/${item?.symbol}.png`} loading="lazy"/>
                                  </div>
                                  <label on:click={() => goto("/stocks/"+item?.symbol)} class="cursor-pointer flex flex-col ml-3 w-40">
                                    <span class="text-blue-400 text-sm">{item?.symbol}</span>
                                    <span class="text-white text-sm">{item?.name}</span>
                                  </label>
    
                                  <div class="flex flex-col justify-end items-end ml-auto">
                                    <span class="font-medium text-slate-300 text-ends">Split</span>
                                    <span class="text-white text-md text-end">
                                      From {item?.denominator} to {item?.numerator}
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
                                    <span class="font-medium text-slate-300 text-end">EPS</span>
                                    <span class="text-white text-md text-end">
                                      {item?.eps !== null ? item?.eps : '-'}
                                    </span>
                                  </div>
                                </div>
    
                                <div class="border-1 border-b border-slate-800 w-full mt-5 mb-5" />
    
    
                                <div class="flex flex-row items-center">
                                  <div class="flex flex-col ml-3 w-40">
                                    <span class="font-medium text-slate-300">Revenue</span>
                                    <span class="text-white text-md">
                                      {item?.revenue !== null ? abbreviateNumber(item?.revenue,true) : '-'}
                                    </span>
                                  </div>
    
                                  <div class="flex flex-col justify-end items-end ml-auto">
                                    <span class="font-medium text-slate-300 text-ends">Profit</span>
                                    <span class="text-white text-md text-end">
                                      {item?.netIncome !== null ? abbreviateNumber(item?.netIncome,true) : '-'}
                                    </span>
                                  </div>
                                </div>
    
    
                            </div>
                          {/each}
                          <ScrollToTop />
                        </div>
                    
    
                        {:else}
                        <h2 class="mt-20 flex justify-center items-center text-xl sm:text-2xl font-bold text-slate-700 mb-5 m-auto">
                          No Splits on this date
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
        