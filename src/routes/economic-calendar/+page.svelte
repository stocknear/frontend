
<script lang="ts">

    import { format, startOfWeek, addDays, addWeeks, subWeeks, differenceInWeeks } from 'date-fns'
    import { screenWidth,  numberOfUnreadNotification } from '$lib/store';
    import logo from '$lib/images/transcripts_logo.png';
	  import ScrollToTop from '$lib/components/ScrollToTop.svelte';
    import { listOfCountries } from '$lib/utils';
    
    export let data;
    let rawData;
    let filterList = [];
    let weekdayFiltered = [];

  async function handleFilter(e,newFilter) {
    //e.preventDefault(); Weird bug but if you click on input box the blue checkmark does not appear when this line is included
    //changeRuleFilter = true;
    const filterSet = new Set(filterList);
  
    // Check if the new filter already exists in the list
    if (filterSet?.has(newFilter)) {
      // If it exists, remove it from the list
      filterSet?.delete(newFilter);
    } else {
      // If it doesn't exist, add it to the list
      filterSet?.add(newFilter);
  
    }
    filterList = Array?.from(filterSet);
    
    if (filterList?.length !== 0) {
      await loadWorker()
    }
    else {
      weekday = rawData;
    }
    
  
  }

let syncWorker: Worker | undefined = undefined;

// Handling messages from the worker
const handleMessage = async (event) => {
    const finalData = event.data?.finalData
    weekdayFiltered = finalData?.output ?? [];
};

const loadWorker = async () => {
  const SyncWorker = await import('./workers/filterWorker?worker');
  syncWorker = new SyncWorker.default();
  syncWorker.postMessage({ rawData: rawData, filterList: filterList});
  syncWorker.onmessage = handleMessage;

};






    let currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    let economicCalendar = data?.getEconomicCalendar;
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
  
    economicCalendar = daysOfWeek.map((day) => {
      return {
        name: day?.name,
        data: data?.getEconomicCalendar?.filter(
          (item) => item.date === day.date
        ),
      };
    });
  

    if (economicCalendar?.length) {
        // Loop through each day of the week
        for (let i = 0; i < economicCalendar?.length; i++) {
          const dayData = economicCalendar[i].data;
  
          // Filter out entries with company name "---"
  
          // Sort and map the filtered data
          weekday[i] = dayData
        }
  
    }
  
  
  }
      
  $: {
    if(economicCalendar && typeof window !== 'undefined')
    {
      economicCalendar = daysOfWeek?.map((day) => {
          return {
            name: day.name,
            data: data?.getEconomicCalendar?.filter(
              (item) => item.date === day.date
            ),
          };
        });
  
        if (economicCalendar?.length) {
            // Loop through each day of the week
            for (let i = 0; i < economicCalendar?.length; i++) {
              const dayData = economicCalendar[i].data;
              //Sort by earliest time
              weekday[i] = dayData?.sort((a, b) => new Date(`1970-01-01T${a.time}`) - new Date(`1970-01-01T${b.time}`));

            }

            rawData = weekday;
      
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
    

  $: {
    if(filterList) {
      console.log(filterList)
    }
  }
</script>
        
      
  <svelte:head>
  
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Worldwide Economic Calendar · stocknear
  </title>
  <meta name="description" content={`A list of upcoming economic events on the US stock market, with dates, times and estimation.`} />
  
  <!-- Other meta tags -->
  <meta property="og:title" content={`Worldwide Economic Calendar · stocknear`}/>
  <meta property="og:description" content={`A list of upcoming economic events on the US stock market, with dates, times and estimation.`} />
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->
  
  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content={`Worldwide Economic Calendar · stocknear`}/>
  <meta name="twitter:description" content={`A list of upcoming economic events on the US stock market, with dates, times and estimation.`} />
  <!-- Add more Twitter meta tags as needed -->
  
  </svelte:head>
      
      
      
<section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-40">
        
      

          <div class="w-full max-w-4xl m-auto sm:bg-[#27272A] sm:rounded-xl h-auto sm:p-10 mt-10 sm:mt-3 mb-8">
            <div class="grid grid-cols-1 sm:grid-cols-2">
          
              <!-- Start Column -->
              <div>
                <div class="flex flex-row justify-center items-center">
                  <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
                    Economic Calendar
                  </h1>
                </div>
      
                <span class="hidden sm:block text-white text-md font-medium text-center flex justify-center items-center ">
                  Stay updated on upcoming Economic Events worldwide.
                </span>
    
      
              </div>
              <!-- End Column -->
          
              <!-- Start Column -->
              <div class="hidden sm:block relative m-auto mt-7 sm:mb-0 sm:mt-0">
                <svg class="w-32 sm:w-36 -my-5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
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
                
                
                <div class="z-1 absolute top-2">
                  <img class="w-24 ml-6" src={logo} alt="logo" loading="lazy">
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
                    {#each (filterList?.length === 0 ? weekday : weekdayFiltered) as day,index}
                    
                    <div class="w-full {index === selectedWeekday ? '' : 'hidden sm:block'}">
                            <label on:click={() => toggleDate(index)} class="w-11/12 m-auto sm:w-full cursor-pointer h-16 {index === selectedWeekday ? 'bg-purple-600 bg-opacity-[0.6] sm:bg-[#A24D51] sm:gradient-effect' : ''} rounded-lg sm:rounded-none flex bg-[#3C40F0] border border-blue-600 mb-3">
                              <div class=" flex flex-row justify-center items-center w-full">
                                <label on:click={() => clickWeekday('previous', index) } class="sm:hidden ml-auto">
                                  <svg class="w-8 h-8 inline-block rotate-180 " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M8.025 22L6.25 20.225L14.475 12L6.25 3.775L8.025 2l10 10l-10 10Z"/></svg>
                                </label>
                                <div class="flex flex-col text-white truncate m-auto p-1">
                                  <span class="font-medium text-md">{formattedWeekday[index]}</span>
                                  <span class="text-sm m-auto pt-1 pb-1"> {day.length} Events</span>
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




<div class="flex flex-row items-center w-fit ml-auto mt-6 mb-2 mr-3 sm:mr-0">
{#if filterList?.length !== 0}
<label on:click={() => filterList = [] } class="mr-3 text-sm cursor-pointer bg-[#27272A] sm:hover:bg-[#27272A] duratiion-100 transition ease-in-out px-4 py-2 rounded-lg shadow-lg ml-auto">
  <svg xmlns="http://www.w3.org/2000/svg" class="inline-block w-4 h-4" viewBox="0 0 21 21"><g fill="none" fill-rule="evenodd" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3.578 6.487A8 8 0 1 1 2.5 10.5"/><path d="M7.5 6.5h-4v-4"/></g></svg>
      Reset All
</label>
{/if}

<div class="dropdown dropdown-end z-30">
  <button tabindex="0" role="button" class="text-sm cursor-pointer text-white bg-[#27272A] sm:hover:bg-[#27272A] duration-100 transition ease-in-out px-4 py-2 rounded-lg shadow-lg ml-auto">
    Filter
    <svg class="inline-block w-2.5 h-2.5 ml-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
    </svg>
  </button>
  
  <!-- Dropdown menu -->
  
  <ul tabindex="0" class="z-30 dropdown-content p-2 shadow bg-base-100 rounded w-60 h-72 oveflow-hidden overflow-y-scroll">
    <!--
    <div class="p-3">
      <label for="input-group-search" class="sr-only">Search</label>
      <div class="relative">
        <div class="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
          <svg class="w-4 h-4 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
          </svg>
        </div>
        <input type="text" id="input-group-search" class="block w-full p-2 ps-10 text-sm placeholder-white text-white border border-gray-300 rounded-lg bg-[#202327] focus:ring-blue-500 focus:border-blue-500 " placeholder="Search Country">
      </div>
    </div>
    -->
    <div class="mb-3 mt-1 ml-1">
      <span class="text-white text-sm mb-2">
        Popular
      </span>
      <hr class="mt-2 mb-2 border-gray-500"/>
      {#each ['United States','Russia','China','UK','EU'] as item}
    <li>
      <label on:click|stopPropagation={(event) => handleFilter(event, item)} class="flex items-center ps-2 rounded">
        <input checked={filterList?.includes(item)} type="checkbox" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2">
        <label class="w-full py-2 ms-2 text-sm font-medium text-white rounded cursor-pointer">
          {item}
        </label>
      </label>
    </li>
    {/each}
    </div>
    <div>
      <span class="text-white text-sm mb-2 ml-1">
       All Countries
      </span>
      <hr class="mt-2 mb-2 border-gray-500"/>
    </div>
    {#each listOfCountries as item}
    <li>
      <div on:click|stopPropagation={(event) => handleFilter(event, item)} class="flex items-center ps-2 rounded">
        <input type="checkbox" checked={filterList?.includes(item)} class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2">
        <label class="w-full py-2 ms-2 text-sm font-medium text-white rounded cursor-pointer">
          {item}
        </label>
      </div>
    </li>
    {/each}
  </ul>
</div>
  
</div>


  <body class="z-0 mb-40">
        {#each (filterList?.length === 0 ? weekday : weekdayFiltered) as day,index}
                  {#if index === selectedWeekday}
                    {#if day?.length !== 0}
                    <div class="w-full overflow-x-scroll no-scrollbar">  
                      <table class="hidden sm:inline-table table-sm table-compact rounded-none sm:rounded-md w-full border-bg-[#09090B] m-auto mt-4 ">
                          <thead>
                            <tr>
                              <th class="text-start text-white font-semibold text-sm"></th>

                              <th class="text-start text-white font-semibold text-sm"></th>
                              <th class="text-start text-white font-semibold text-sm">Event</th>
                              <th class="text-end text-white font-semibold text-sm">Previous</th>
                              <th class="text-end text-white font-semibold text-sm">Estimated</th>
                              <th class="text-end text-white font-semibold text-sm">Actual</th>
                              <th class="text-white font-semibold text-sm text-end">Impact</th>
                            </tr>
                          </thead>
                          <tbody>
                            {#each day as item}
                            <!-- row -->
                            <tr class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A]">
                              
                            <td class="text-white text-sm border-b-[#09090B]">
                                <label class="p-1.5 rounded-lg">
                                  {item?.time}
                                </label>
                            </td>
        
                            <td class="flex flex-row items-center">
                              {#if item?.country === 'EU'}
                              <svg style="clip-path: circle(50%);" class="w-4 h-4 sm:w-6 sm:h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><mask id="circleFlagsEu0"><circle cx="256" cy="256" r="256" fill="#fff"/></mask><g mask="url(#circleFlagsEu0)"><path fill="#0052b4" d="M0 0h512v512H0z"/><path fill="#ffda44" d="m256 100.2l8.3 25.5H291l-21.7 15.7l8.3 25.6l-21.7-15.8l-21.7 15.8l8.3-25.6l-21.7-15.7h26.8zm-110.2 45.6l24 12.2l18.9-19l-4.2 26.5l23.9 12.2l-26.5 4.2l-4.2 26.5l-12.2-24l-26.5 4.3l19-19zM100.2 256l25.5-8.3V221l15.7 21.7l25.6-8.3l-15.8 21.7l15.8 21.7l-25.6-8.3l-15.7 21.7v-26.8zm45.6 110.2l12.2-24l-19-18.9l26.5 4.2l12.2-23.9l4.2 26.5l26.5 4.2l-24 12.2l4.3 26.5l-19-19zM256 411.8l-8.3-25.5H221l21.7-15.7l-8.3-25.6l21.7 15.8l21.7-15.8l-8.3 25.6l21.7 15.7h-26.8zm110.2-45.6l-24-12.2l-18.9 19l4.2-26.5l-23.9-12.2l26.5-4.2l4.2-26.5l12.2 24l26.5-4.3l-19 19zM411.8 256l-25.5 8.3V291l-15.7-21.7l-25.6 8.3l15.8-21.7l-15.8-21.7l25.6 8.3l15.7-21.7v26.8zm-45.6-110.2l-12.2 24l19 18.9l-26.5-4.2l-12.2 23.9l-4.2-26.5l-26.5-4.2l24-12.2l-4.3-26.5l19 19z"/></g></svg>
                              {:else if item?.country === 'UK'}
                              <svg style="clip-path: circle(50%);" class="w-4 h-4 sm:w-6 sm:h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><mask id="circleFlagsUk0"><circle cx="256" cy="256" r="256" fill="#fff"/></mask><g mask="url(#circleFlagsUk0)"><path fill="#eee" d="m0 0l8 22l-8 23v23l32 54l-32 54v32l32 48l-32 48v32l32 54l-32 54v68l22-8l23 8h23l54-32l54 32h32l48-32l48 32h32l54-32l54 32h68l-8-22l8-23v-23l-32-54l32-54v-32l-32-48l32-48v-32l-32-54l32-54V0l-22 8l-23-8h-23l-54 32l-54-32h-32l-48 32l-48-32h-32l-54 32L68 0z"/><path fill="#0052b4" d="M336 0v108L444 0Zm176 68L404 176h108zM0 176h108L0 68ZM68 0l108 108V0Zm108 512V404L68 512ZM0 444l108-108H0Zm512-108H404l108 108Zm-68 176L336 404v108z"/><path fill="#d80027" d="M0 0v45l131 131h45zm208 0v208H0v96h208v208h96V304h208v-96H304V0zm259 0L336 131v45L512 0zM176 336L0 512h45l131-131zm160 0l176 176v-45L381 336z"/></g></svg>
                              {:else}
                                <img style="clip-path: circle(50%);" class="w-4 h-4 sm:w-6 sm:h-6" src={`https://hatscripts.github.io/circle-flags/flags/${item?.countryCode}.svg`} />
                              {/if}
                              <span class="text-white ml-2 text-sm">
                                {item?.country}
                              </span>
                            </td>

                            <td class="text-start text-white border-b-[#09090B]">
                              <span class="text-white font-medium ">{item?.event?.length > 15 ? item?.event?.slice(0,15) + '...' : item?.event}</span>
                            </td>
    
                          <td class="text-white font-medium border-b-[#09090B] text-end">
                            {item?.previous !== null ? item?.previous : '-'}
                          </td>
          
                          <td class="text-white font-medium border-b-[#09090B] text-end">
                            {item?.estimate !== null ? item?.estimate : '-'}
                          </td>

                          <td class="text-end text-white font-medium text-center border-b-[#09090B] text-end">
                            {item?.actual !== null ? item?.actual : '-'}
                          </td>
          
                          <td class="{item?.impact === 'Low' ? 'text-[#00FC50]' : item?.impact === 'Medium' ? 'text-[#3DDBFE]' : item?.impact === 'High' ? 'text-[#FC2120]' : 'text-white'} text-sm text-end mr-1 border-b-[#09090B]">
                            {item?.impact}
                          </td>
  
                        </tr>
                            
                          
        
                            {/each}
                          </tbody>
                      </table>
                    </div>


                        <div class="relative p-2 sm:hidden pt-5 ">
                          {#each day as item}
                            <div class="bg-[#09090B] rounded-lg border border-slate-800 h-auto pl-2 pr-2 pt-4 pb-3 mb-7">
                                <div class="flex flex-row items-center">
                                  <div class="hidden rounded-full w-10 h-10 relative bg-[#101112] flex items-center justify-center">
                                    {#if item?.country === 'EU'}
                                    <svg style="clip-path: circle(50%);" class="w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><mask id="circleFlagsEu0"><circle cx="256" cy="256" r="256" fill="#fff"/></mask><g mask="url(#circleFlagsEu0)"><path fill="#0052b4" d="M0 0h512v512H0z"/><path fill="#ffda44" d="m256 100.2l8.3 25.5H291l-21.7 15.7l8.3 25.6l-21.7-15.8l-21.7 15.8l8.3-25.6l-21.7-15.7h26.8zm-110.2 45.6l24 12.2l18.9-19l-4.2 26.5l23.9 12.2l-26.5 4.2l-4.2 26.5l-12.2-24l-26.5 4.3l19-19zM100.2 256l25.5-8.3V221l15.7 21.7l25.6-8.3l-15.8 21.7l15.8 21.7l-25.6-8.3l-15.7 21.7v-26.8zm45.6 110.2l12.2-24l-19-18.9l26.5 4.2l12.2-23.9l4.2 26.5l26.5 4.2l-24 12.2l4.3 26.5l-19-19zM256 411.8l-8.3-25.5H221l21.7-15.7l-8.3-25.6l21.7 15.8l21.7-15.8l-8.3 25.6l21.7 15.7h-26.8zm110.2-45.6l-24-12.2l-18.9 19l4.2-26.5l-23.9-12.2l26.5-4.2l4.2-26.5l12.2 24l26.5-4.3l-19 19zM411.8 256l-25.5 8.3V291l-15.7-21.7l-25.6 8.3l15.8-21.7l-15.8-21.7l25.6 8.3l15.7-21.7v26.8zm-45.6-110.2l-12.2 24l19 18.9l-26.5-4.2l-12.2 23.9l-4.2-26.5l-26.5-4.2l24-12.2l-4.3-26.5l19 19z"/></g></svg>
                                    {:else if item?.country === 'UK'}
                                    <svg style="clip-path: circle(50%);" class="w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><mask id="circleFlagsUk0"><circle cx="256" cy="256" r="256" fill="#fff"/></mask><g mask="url(#circleFlagsUk0)"><path fill="#eee" d="m0 0l8 22l-8 23v23l32 54l-32 54v32l32 48l-32 48v32l32 54l-32 54v68l22-8l23 8h23l54-32l54 32h32l48-32l48 32h32l54-32l54 32h68l-8-22l8-23v-23l-32-54l32-54v-32l-32-48l32-48v-32l-32-54l32-54V0l-22 8l-23-8h-23l-54 32l-54-32h-32l-48 32l-48-32h-32l-54 32L68 0z"/><path fill="#0052b4" d="M336 0v108L444 0Zm176 68L404 176h108zM0 176h108L0 68ZM68 0l108 108V0Zm108 512V404L68 512ZM0 444l108-108H0Zm512-108H404l108 108Zm-68 176L336 404v108z"/><path fill="#d80027" d="M0 0v45l131 131h45zm208 0v208H0v96h208v208h96V304h208v-96H304V0zm259 0L336 131v45L512 0zM176 336L0 512h45l131-131zm160 0l176 176v-45L381 336z"/></g></svg>
                                    {:else}
                                      <img style="clip-path: circle(50%);" class="w-7 h-7" src={`https://hatscripts.github.io/circle-flags/flags/${item?.countryCode}.svg`} />
                                    {/if}
                                  </div>
                                  <label class="cursor-pointer flex flex-col ml-3 w-40">
                                    <span class="text-white rounded-lg w-fit text-sm">
                                      {item?.time}
                                    </span>
                                    <span class="text-slate-300 text-sm">{item?.country}</span>
                                  </label>
    
                                  <div class="flex flex-col justify-end items-end ml-auto">
                                    <span class="font-medium text-slate-300 text-end">Event</span>
                                    <span class="text-white text-sm text-end">
                                      {item?.event}
                                    </span>
                                  </div>
                                </div>
                                <div class="border-1 border-b border-slate-800 w-full mt-5 mb-5" />
    
                                <div class="flex flex-row items-center">
                                  <div class="flex flex-col ml-3 w-40">
                                    <span class="font-medium text-slate-300">Previous</span>
                                    <span class="text-slate-300 text-sm">
                                      {item?.previous !== null ? item?.previous : '-'}
                                    </span>
                                  </div>
    
                                  <div class="flex flex-col justify-end items-end ml-auto">
                                    <span class="font-medium text-slate-300 text-ends">Impact</span>
                                    <span class="{item?.impact === 'Low' ? 'text-[#00FC50]' : item?.impact === 'Medium' ? 'text-[#3DDBFE]' : item?.impact === 'High' ? 'text-[#FC2120]' : 'text-white'} text-end">
                                      {item?.impact !== null ? item?.impact : '-'}
                                    </span>
                                  </div>
                                </div>
    
                                <div class="border-1 border-b border-slate-800 w-full mt-5 mb-5" />
    
  
                                <div class="flex flex-row items-center">
                                  <div class="flex flex-col ml-3 w-40">
                                    <span class="font-medium text-slate-300">Estimated</span>
                                    <span class="text-slate-300 text-sm">
                                      {item?.estimate !== null ? item?.estimate : '-'}
                                    </span>
                                  </div>
    
                                  <div class="flex flex-col justify-end items-end ml-auto">
                                    <span class="font-medium text-slate-300 text-ends">Actual</span>
                                    <span class="text-white text-sm text-end">
                                      {item?.actual !== null ? item?.actual : '-'}
                                    </span>
                                  </div>
                                </div>    
                              </div>
                            {/each}

                            <ScrollToTop />
                          </div>
                    
    
                        {:else}
                        <h2 class="m-auto mt-20 flex justify-center items-center text-3xl font-bold text-slate-700 mb-5 m-auto">
                          No data available
                        </h2>
                      {/if}
                    {/if}
        {/each}
        
  </body>

</section>
        
      
      
      
<style>


.gradient-effect {
background: linear-gradient(100deg, #B46266, #A24D51);
color: #fff;
position: relative;
overflow: hidden;
}

</style>
