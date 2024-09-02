
<script lang="ts">

  import { format, startOfWeek, addDays, addWeeks, subWeeks, differenceInWeeks } from 'date-fns'
  import { screenWidth,  numberOfUnreadNotification } from '$lib/store';
  import dividendsLogo from '$lib/images/dividends_calendar_logo.png';
  import { goto } from '$app/navigation';
  import { abbreviateNumber } from '$lib/utils';
  import ArrowLogo from "lucide-svelte/icons/move-up-right";

  export let data;
  let currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  let dividendCalendar = data?.getDividendCalendar;
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


  dividendCalendar = daysOfWeek.map((day) => {
    return {
      name: day.name,
      data: data?.getDividendCalendar?.filter(
        (item) => item.date === day.date
      ),
    };
  });


  if (dividendCalendar?.length) {
      // Loop through each day of the week
      for (let i = 0; i < dividendCalendar.length; i++) {
        const dayData = dividendCalendar[i].data;

        // Filter out entries with company name "---"

        // Sort and map the filtered data
        weekday[i] = dayData
          .sort((a, b) => b.marketCap - a.marketCap)
      }

  }


}
    
$: {
  if( dividendCalendar)
  {
    dividendCalendar = daysOfWeek.map((day) => {
        return {
          name: day.name,
          data: data?.getDividendCalendar?.filter(
            (item) => item.date === day.date
          ),
        };
      });

      if (dividendCalendar?.length) {
          // Loop through each day of the week
          for (let i = 0; i < dividendCalendar.length; i++) {
            const dayData = dividendCalendar[i].data;
    
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
  {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Dividends Calendar · stocknear
</title>
<meta name="description" content={`A list of upcoming dividends on the US stock market, with dates, times and estimated revenue and dividends growth.`} />

<!-- Other meta tags -->
<meta property="og:title" content={`Dividends Calendar · stocknear`}/>
<meta property="og:description" content={`A list of upcoming dividends on the US stock market, with dates, times and estimated revenue and dividends growth.`} />
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`Dividends Calendar · stocknear`}/>
<meta name="twitter:description" content={`A list of upcoming dividends on the US stock market, with dates, times and estimated revenue and dividends growth.`} />
<!-- Add more Twitter meta tags as needed -->

</svelte:head>
    
    
    
<section class="w-full max-w-3xl sm:max-w-screen-2xl overflow-hidden min-h-screen pt-5 pb-40">
     
  
      <div class="text-sm sm:text-[1rem] breadcrumbs ml-4">
        <ul>
          <li><a href="/" class="text-gray-300">Home</a></li> 
          <li class="text-gray-300">Dividends Calendar</li>
        </ul>
      </div>
    

      <div class="w-full overflow-hidden m-auto mt-5">
        
        <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden ">
            <div class="relative flex justify-center items-start overflow-hidden w-full">
                
              
              <main class="w-full lg:w-3/4 lg:pr-5">
  
      <div class="w-full m-auto sm:bg-[#27272A] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">

        
            <!-- Start Column -->
            <div>
              <div class="flex flex-row justify-center items-center">
                <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
                  Dividends Calendar
                </h1>
              </div>
    
              <span class="hidden sm:block text-white text-md font-medium text-center flex justify-center items-center ">
                Stay updated on upcoming Dividends in the stock market.
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
              
              
              <div class="z-1 absolute top-2 right-7">
                <img class="w-24" src={dividendsLogo} alt="logo" loading="lazy">
              </div>
            </div>
            <!-- End Column -->
          </div>
    
         
    
    
        </div>
        
          <!-- Page wrapper -->
          <div class="flex justify-center w-full m-auto h-full overflow-hidden">
      
              
            
    
              <!-- Content area -->
              <div class="w-full overflow-x-scroll">
    
                    
               <!-- Cards -->
              <div class=" w-full flex flex-row justify-center m-auto items-center pl-2 pr-2 sm:pl-0 sm:pr-0">
                <!-- Start Columns -->
                <label on:click={() => changeWeek('previous')} class="{previousMax ? 'opacity-80' : ''} hidden sm:flex h-16 w-48 cursor-pointer border m-auto flex bg-[#27272A] border border-gray-600 mb-3">
                  <svg class="w-6 h-6 m-auto rotate-180 " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M8.025 22L6.25 20.225L14.475 12L6.25 3.775L8.025 2l10 10l-10 10Z"/></svg>
                </label>
                {#each weekday as day,index}
                
                <div class="w-full {index === selectedWeekday ? '' : 'hidden sm:block'}">
                        <label on:click={() => toggleDate(index)} class="w-11/12 m-auto sm:w-full cursor-pointer h-16 {index === selectedWeekday ? 'bg-purple-600 sm:hover:bg-purple-700' : ''} rounded-lg sm:rounded-none flex bg-[#09090B] sm:hover:bg-purple-600 transition duration-50 border border-gray-600 mb-3">
                          <div class=" flex flex-row justify-center items-center w-full ">
                            <label on:click={() => clickWeekday('previous', index) } class="{previousMax === true && index === 0? 'opacity-20' : ''} sm:hidden ml-auto">
                              <svg class="w-8 h-8 inline-block rotate-180 " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M8.025 22L6.25 20.225L14.475 12L6.25 3.775L8.025 2l10 10l-10 10Z"/></svg>
                            </label>
                            <div class="flex flex-col items-center text-white truncate m-auto p-1">
                              <span class="font-medium text-[1rem]">{formattedWeekday[index]}</span>
                              <span class="text-[1rem] sm:text-sm m-auto pt-1 pb-1"> {day?.length} Earnings</span>
                            </div>
                            <label on:click={() => clickWeekday('next', index) } class="{nextMax === true && index === 4? 'opacity-20' : ''} sm:hidden mr-auto">
                              <svg class="w-8 h-8 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M8.025 22L6.25 20.225L14.475 12L6.25 3.775L8.025 2l10 10l-10 10Z"/></svg>
                            </label>
                          </div>
                        </label>
                    </div>
                {/each}
                <label on:click={() => changeWeek('next')} class="{nextMax ? 'opacity-80' : ''} hidden sm:flex h-16 w-48 cursor-pointer border m-auto flex bg-[#27272A] border border-gray-600 mb-3">
                  <svg class="w-6 h-6 m-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M8.025 22L6.25 20.225L14.475 12L6.25 3.775L8.025 2l10 10l-10 10Z"/></svg>
                </label>
            </div>
    
              
              {#each weekday as day,index}
                {#if index === selectedWeekday}
                  {#if day?.length !== 0}
                  <div class="w-full overflow-x-scroll no-scrollbar">  
                    <table class="table table-sm table-compact rounded-none sm:rounded-md w-full border-[#09090B] m-auto mt-4 ">
                        <thead>
                          <tr class="whitespace-nowrap">
                            <th class="text-white font-semibold text-sm">Symbol</th>
                            <th class="text-white font-semibold text-sm">Company Name</th>
                            <th class="text-white font-semibold text-sm">Market Cap</th>
                            <th class="text-white font-semibold text-sm">Revenue</th>
                            <th class="text-white font-semibold text-sm">Ex. Dividend Date</th>
                            <th class="text-white font-semibold text-sm">Cash Amount</th>
                            <th class="text-white font-semibold text-sm text-end">Payment Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {#each day as item, index}
                          <!-- row -->
                          <tr on:click={() => goto("/stocks/"+item?.symbol)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B] cursor-pointer">
                            
                            <td class="text-blue-400 border-b-[#09090B] text-sm sm:text-[1rem]">
                              {item?.symbol}
                            </td>

                            <td class="text-white border-b-[#09090B] whitespace-nowrap text-sm sm:text-[1rem]">
                              {item?.name.length > 20 ? item?.name.slice(0,20) + "..." : item?.name}
                            </td>
  
        
                              <td class="text-white border-b-[#09090B] text-sm sm:text-[1rem]">
                                {item?.marketCap !== null ? abbreviateNumber(item?.marketCap,true) : '-'}
                              </td>

                              <td class="text-white border-b-[#09090B] text-sm sm:text-[1rem]">
                                {item?.revenue !== null ? abbreviateNumber(item?.revenue,true) : '-'}
                              </td>
              
                              <td class="text-center text-white border-b-[#09090B] whitespace-nowrap text-sm sm:text-[1rem]">
                                {item?.date !== null ? new Date(item?.date)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' }) : '-'}
                              </td>

                              <td class="text-white border-b-[#09090B] text-center text-sm sm:text-[1rem]">
                                  {item?.adjDividend !== null ? '$'+item?.adjDividend?.toFixed(2) : 'n/a'}
                              </td>
              
                              <td class="text-white text-end border-b-[#09090B] text-sm sm:text-[1rem]">
                                {item?.paymentDate !== null ? new Date(item?.paymentDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' }) : '-'}
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                    </table>
                  </div>

  
                      {:else}
                       <div class="text-white p-5 mt-5 w-fit m-auto rounded-lg sm:flex sm:flex-row sm:items-center border border-slate-800 text-[1rem]">
                          <svg class="w-6 h-6 flex-shrink-0 inline-block sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                          No Dividends available for the day.
                      </div>
                    {/if}
                  {/if}
                {/each}
              
                
              
          </main>

          <aside class="hidden lg:block relative fixed w-1/4 ml-4">        
              
            {#if data?.user?.tier !== 'Pro' || data?.user?.freeTrial}
            <div on:click={() => goto('/pricing')} class="w-full bg-[#141417] duration-100 ease-out sm:hover:text-white text-gray-400 sm:hover:border-gray-700 border border-gray-800 rounded-lg h-fit pb-4 mt-4 cursor-pointer">
                <div class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0">
                    <div class="w-full flex justify-between items-center p-3 mt-3">
                    <h2 class="text-start text-xl font-semibold text-white ml-3">
                    Pro Subscription
                    </h2>
                    <ArrowLogo class="w-8 h-8 mr-3 flex-shrink-0"/>
                    </div>
                    <span class="text-white p-3 ml-3 mr-3">
                        Upgrade now for unlimited access to all data and tools.
                    </span>
                </div>
            </div>
            {/if}

            <div on:click={() => goto('/analysts')} class="w-full bg-[#141417] duration-100 ease-out sm:hover:text-white text-gray-400 sm:hover:border-gray-700 border border-gray-800 rounded-lg h-fit pb-4 mt-4 cursor-pointer">
                <div class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0">
                    <div class="w-full flex justify-between items-center p-3 mt-3">
                    <h2 class="text-start text-xl font-semibold text-white ml-3">
                    Wallstreet Analyst
                    </h2>
                    <ArrowLogo class="w-8 h-8 mr-3 flex-shrink-0"/>
                    </div>
                    <span class="text-white p-3 ml-3 mr-3">
                        Get the latest top Wall Street analyst ratings.
                    </span>
                </div>
            </div>

            <div on:click={() => goto('/politicians')} class="w-full bg-[#141417] duration-100 ease-out sm:hover:text-white text-gray-400 sm:hover:border-gray-700 border border-gray-800 rounded-lg h-fit pb-4 mt-4 cursor-pointer">
                <div class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0">
                    <div class="w-full flex justify-between items-center p-3 mt-3">
                    <h2 class="text-start text-xl font-semibold text-white ml-3">
                    Congress Trading
                    </h2>
                    <ArrowLogo class="w-8 h-8 mr-3 flex-shrink-0"/>
                    </div>
                    <span class="text-white p-3 ml-3 mr-3">
                        Get the latest top Congress trading insights.
                    </span>
                </div>
            </div>

          </aside>
          
          </div>
        </div>
      </div>
  </section>
      
      
    
    
  