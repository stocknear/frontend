<script lang='ts'>
  import { goto} from '$app/navigation';
  import { userRegion, numberOfUnreadNotification } from '$lib/store';
  import { onMount } from 'svelte';
  import {getImageURL} from '$lib/utils';
	import TopInvestors from '$lib/components/TopInvestors.svelte';

  export let data;
  let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;


let leaderboard = data?.getLeaderboard ?? [];
let isLoaded = true;
  

const usRegion = ['cle1','iad1','pdx1','sfo1'];

let fastifyURL;

userRegion.subscribe(value => {
  if (usRegion.includes(value)) {
    fastifyURL  = import.meta.env.VITE_USEAST_FASTIFY_URL;
  } else {
    fastifyURL  = import.meta.env.VITE_EU_FASTIFY_URL;
  }
});


let currentDate = new Date();

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentMonthIndex = currentDate.getMonth();
let displayMonth = 'n/a';

if (currentMonthIndex >= 0 && currentMonthIndex < monthNames.length) {
  displayMonth = monthNames[currentMonthIndex];
}

const year = currentDate.getFullYear();
const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based
let nextMonth = currentDate.getMonth() + 1; // Increment the month by 1

let nextYear = year;
if (nextMonth === 12) {
  nextMonth = 0; // Reset to January (zero-based index)
  nextYear++; // Increment the year if the current month is December
}

nextMonth = String(nextMonth + 1).padStart(2, '0'); // Month is zero-based
const day = '01';
let startDate = `${year}-${month}-${day}`; // Output: "yyyy-mm-01"
let endDate = `${nextYear}-${nextMonth}-${day}`;

let targetDate = new Date(endDate);


  let days = '-';
  let hours = '-';
  let minutes = '-';
  let seconds = '-';

  const updateTime = () => {
    // Get the current time in the Berlin timezone
    const berlinTimeZone = 'Europe/Berlin';
    const berlinCurrentTime = new Date().toLocaleString('en-US', { timeZone: berlinTimeZone });
    const currentTime = new Date(berlinCurrentTime);

    // Calculate the time difference between the current time and the target date
    const timeDiff = targetDate - currentTime;

    // Calculate the remaining days, hours, minutes, and seconds
    const totalSeconds = Math.floor(timeDiff / 1000);
    seconds = totalSeconds % 60;
    minutes = Math.floor((totalSeconds % 3600) / 60);
    hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    days = Math.floor(totalSeconds / (3600 * 24));
  };



async function changeLeaderboard(event)
  {
    isLoaded = false;
    const valueDate = event.target.value;
    if (valueDate === 'aug2023')
    {
      startDate = '2023-08-01';
      endDate = '2023-09-01'
    }
    else if (valueDate === 'sep2023')
    {
      startDate = '2023-09-01';
      endDate = '2023-10-01'
    }

    else if (valueDate === 'oct2023')
    {
      startDate = '2023-10-01';
      endDate = '2023-11-01'
    }
    else if (valueDate === 'nov2023')
    {
      startDate = '2023-11-01';
      endDate = '2023-12-01'
    }
    else if (valueDate === 'dec2023')
    {
      startDate = '2023-12-01';
      endDate = '2023-12-31'
    }
    else if (valueDate === 'jan2024')
    {
      startDate = '2024-01-01';
      endDate = '2024-01-31'
    }
    else if (valueDate === 'feb2024')
    {
      startDate = '2024-02-01';
      endDate = '2024-02-29'
    }
    else if (valueDate === 'march2024')
    {
      startDate = '2024-03-01';
      endDate = '2024-03-31'
    }
    else if (valueDate === 'april2024')
    {
      startDate = '2024-04-01';
      endDate = '2024-04-30'
    }
    else if (valueDate === 'may2024')
    {
      startDate = '2024-05-01';
      endDate = '2024-05-31'
    }
    else if (valueDate === 'june2024')
    {
      startDate = '2024-06-01';
      endDate = '2024-06-30'
    }

    await getLeaderboard();
    isLoaded = true;

  }


onMount(async () => {

  const interval = setInterval(updateTime, 1000);

  return () => {
    clearInterval(interval);
  };


});

async function getLeaderboard() {
  const postData = {
    'startDate': startDate,
    'endDate': endDate,
  };

  const response = await fetch(fastifyURL+'/leaderboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  });

  const output = (await response.json())?.items;

  leaderboard = output
    ?.filter(item => item.rank !== 0)
    ?.sort((a, b) => a.rank - b.rank)
}


  

</script>
    

<svelte:head>
  <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Leaderboard Stocks · stocknear</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />

  <meta name="description" content="Detailed information of the current leaderboard of our free monthly portfolio tournament.">
  <!-- Other meta tags -->
  <meta property="og:title" content="Leaderboard · stocknear"/>
  <meta property="og:description" content="Detailed information of the current leaderboard of our free monthly portfolio tournament.">
  <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="Leaderboard · stocknear"/>
  <meta name="twitter:description" content="Detailed information of the current leaderboard of our free monthly portfolio tournament.">
  <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>
    
      
      
        
    
    <div class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 mb-40 ">
    <!--
      <div class="text-sm breadcrumbs ml-4">
        <ul>
          <li><a href="/" class="text-gray-300">Home</a></li> 
          <li class="text-gray-300">Leaderboard</li>
        </ul>
      </div>
    -->

      <div class="w-full max-w-4xl m-auto sm:bg-[#202020]  sm:rounded-xl h-auto p-10 mt-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
      
          <!-- Start Column -->
          <div>
            <div class="flex flex-col justify-center items-center">
              <h1 class="text-5xl text-white font-bold mb-4">
                Leaderboard
              </h1>
              <h2 class="text-center text-2xl text-white font-medium mb-5">
                {displayMonth} 2024 🚀
              </h2>
            </div>

            <div class="rounded-lg text-white p-2 flex flex-col font-medium text-center">
              <span class="text-white font-medium text-xl mb-3">
                Tournament ends in
              </span>
      
              <div class="grid grid-flow-col gap-5 text-center m-auto auto-cols-max">
                <div class="flex flex-col text-xs">
                  <span class="countdown font-mono text-xl">
                    <span style="--value:{days};"></span>
                  </span>
                  days
                </div> 
                <div class="flex flex-col text-xs">
                  <span class="countdown font-mono text-xl">
                    <span style="--value:{hours};"></span>
                  </span>
                  hours
                </div> 
                <div class="flex flex-col text-xs">
                  <span class="countdown font-mono text-xl">
                    <span style="--value:{minutes};"></span>
                  </span>
                  min
                </div> 
                <div class="flex flex-col text-xs">
                  <span class="countdown font-mono text-xl">
                    <span style="--value:{seconds};"></span>
                  </span>
                  sec
                </div>
              </div>
            </div>

          </div>
          <!-- End Column -->
      
          <!-- Start Column -->
          <div class="hidden sm:block relative m-auto mb-10 mb-10 sm:mb-0 sm:mt-0">
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
            
            
            <div class="absolute top-4">
              <img class="w-24 h-fit ml-6" src={cloudFrontUrl+'/assets/dab_icon.png'} alt="logo" loading="lazy">
            </div>

          </div>
          <!-- End Column -->
      
        </div>
      </div>


      <div class="flex-col jusitfy-end items-center mt-10 ml-2 mb-10">
        <div class="text-white text-md font-medium mr-2">
          View all Leaderboard's
        </div>
        <div class="relative mt-4">
          <select class="select text-white select-bordered select-sm w-48 p-0 pl-5 overflow-y-auto bg-[#2A303C]" on:change={changeLeaderboard}>
              <option disabled>View the past months of winners</option>
              <option value="june2024" selected>{displayMonth} 2024</option>
              <option value="may2024">May 2024</option>
              <option value="april2024">April 2024</option>
              <option value="march2024">March 2024</option>
              <option value="feb2024">February 2024</option>
              <option value="jan2024">January 2024</option>
              <option value="dec2023">December 2023</option>
              <option value="nov2023">November 2023</option>
              <option value="oct2023">October 2023</option>
              <option value="sep2023">September 2023</option>
              <option value="aug2023">August 2023</option>
          </select>
        </div>
    </div>

     
    {#if leaderboard?.length > 3 && isLoaded}
    <h3 class="text-white font-bold text-4xl sm:text-5xl flex justify-center items-center mt-10">
      Top 3 Investors
    </h3>
    <div class="flex flex-row justify-center items-center mt-10 text-white mb-10">
      <!--Start Rank 2-->
      <TopInvestors data={leaderboard[1]} rank={2} />
      <!--End Rank 2-->
      
      <!--Start Rank 1-->
      <TopInvestors data={leaderboard[0]} rank={1}/>
      <!--End Rank 1-->

      <!--Start Rank 3-->
        <TopInvestors data={leaderboard[2]} rank={3} />
      <!--End Rank 3-->
    </div>
   
    {/if}

    {#if isLoaded}
      <!--Start if leaderboad is empty-->
      {#if leaderboard?.length ===0}
        <h3 class="text-gray-300 text-center pt-5 w-72 sm:w-full max-w-xl flex justify-center m-auto text-lg sm:text-xl font-medium pb-9">
          No Participation in the Tournament yet. Be the first and start the game 🔥
        </h3>

        <a href={data?.user ? '/portfolio' : '/login'} rel="noopener noreferrer" class="w-64 flex mb-5 justify-center items-center m-auto btn text-white bg-blue-700 hover:bg-blue-600 transition duration-150 ease-in-out group">
          Get Started 
          <span class="tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out">
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(90 12 12)"><g fill="none"><path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"/><path fill="white" d="M13.06 3.283a1.5 1.5 0 0 0-2.12 0L5.281 8.939a1.5 1.5 0 0 0 2.122 2.122L10.5 7.965V19.5a1.5 1.5 0 0 0 3 0V7.965l3.096 3.096a1.5 1.5 0 1 0 2.122-2.122L13.06 3.283Z"/></g></g></svg>
          </span>
        </a>

      {:else}
      {#each (leaderboard?.length >=3 ? leaderboard?.slice(3,-1) : leaderboard)  as item,index }
        <div class="p-2 sm:hidden">
        <div class="shadow-lg bg-[#202020] w-full rounded-lg p-4 sm:p-3 flex flex-row items-center ">

          <div class="flex flex-row items-center">   
            <span class="text-white text-sm mr-3">
              {item?.rank}
            </span>

            <div class="flex-shrink-0 mr-3 rounded-full w-12 h-12 relative bg-[#0F0F0F]">
              <img style="clip-path: circle(50%);"
              class="rounded-full w-10 h-10 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2" 
              src={item?.expand?.user?.avatar
                  ? getImageURL(item?.expand?.user?.collectionId, item?.expand?.user?.id, item?.expand?.user?.avatar)
                  : `https://api.dicebear.com/7.x/thumbs/svg?seed=${item?.expand?.user?.username}`} 
              alt="User avatar" />
            </div>

          </div>

            <div class="flex flex-col sm:-mt-5 w-full">
                <div class="flex flex-row items-center w-full">
                    <span class="text-white text-sm sm:text-md font-medium text-start mb-2 mr-auto mt-3">
                      {item?.expand?.user?.username > 7 ? item?.expand?.user?.username?.slice(0,7) + "..." : item?.expand?.user?.username}
                    </span>
                    
                    <div class="flex flex-col items-end text-white text-sm">
                      ${new Intl.NumberFormat("en", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }).format(item?.accountValue)}
  
                      <div class="flex flex-row items-end">
  
                        {#if item?.overallReturn > 0}
                        <svg class="w-5 h-5 -mr-0.5 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
  
                          <span class="text-[#10DB06] text-md">
                            +{item?.overallReturn?.toFixed(2)}%
                          </span>
                        {:else if item?.overallReturn < 0}
                          <svg class="w-5 h-5 -mr-0.5 mt-0.5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                          <span class="text-[#FF2F1F] text-md">
                            {item?.overallReturn?.toFixed(2)}%
                          </span>
                        {:else}
                          <svg class="w-2.5 h-2.5 inline-block mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path fill="#fff" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></g></svg>
                          <span class="text-white text-md">
                            {item?.overallReturn?.toFixed(2)}%
                          </span>
                        {/if}
  
                      </div>
  
                    </div>

                </div>

              </div>

        </div>
      </div>
      {/each}

      <!--Desktop-->

      <table class="hidden sm:table table-sm table-compact shadow-md rounded-none sm:rounded-md w-full bg-[#0F0F0F] border-bg-[#0F0F0F] m-auto mt-4 mb-10">
        <thead>
            <tr class="">
              <th class="text-white sm:font-medium text-sm shadow-md">Rank</th>
              <th class="text-white sm:font-medium text-sm hidden sm:block text-center shadow-md">Portfolio Holds </th>
              <th class="text-white sm:font-medium text-sm text-end shadow-md ">Account Value</th>
            </tr>
          </thead>
        <tbody class="shadow-md">
          
            {#each (leaderboard?.length >=3 ? leaderboard?.slice(3,-1) : leaderboard) as item,index}
            <tr class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] {index % 2 === 0 ? 'bg-opacity-[0.25] bg-[#323239]' : 'bg-[#0F0F0F]'} cursor-pointer">
              <td on:click={() => goto("/community/user/"+item?.user)} class="cursor-pointer">
                <div class="flex flex-row items-center">
                  <span class="text-white text-sm mr-3">
                      {item?.rank}
                  </span>
                  <div class="rounded-full w-9 h-9 relative bg-gray-800 hover:ring-[2px] hover:ring-blue-700 ease-in-out duration-300">
                      <img style="clip-path: circle(50%);"
                      class="rounded-full w-8 h-8 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2" 
                      src={item?.expand?.user?.avatar
                          ? getImageURL(item?.expand?.user?.collectionId, item?.expand?.user?.id, item?.expand?.user?.avatar)
                          : `https://api.dicebear.com/7.x/thumbs/svg?seed=${item?.expand?.user?.username}`} 
                      alt="User avatar" />

                  </div>
                  <span class="ml-2 text-white text-xs sm:text-md">
                    {item?.expand?.user?.username > 7 ? item?.expand?.user?.username?.slice(0,7) + "..." : item?.expand?.user?.username}
                  </span>
                </div>
              </td>


              <td  class="font-medium hidden sm:block text-center text-white">
                  {item?.holdings?.length}
              </td>


              <td class="text-white text-md ">
                <div class="flex flex-col items-end">
                  ${new Intl.NumberFormat("en", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(item?.accountValue)}

                  <div class="flex flex-row items-end mt-1">

                    {#if item?.overallReturn > 0}
                    <svg class="w-5 h-5 -mr-0.5 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>

                      <span class="text-[#10DB06] text-md">
                        +{item?.overallReturn?.toFixed(2)}%
                      </span>
                    {:else if item?.overallReturn < 0}
                      <svg class="w-5 h-5 -mr-0.5 mt-0.5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                      <span class="text-[#FF2F1F] text-md">
                        {item?.overallReturn?.toFixed(2)}%
                      </span>
                    {:else}
                      <svg class="w-2.5 h-2.5 inline-block mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path fill="#fff" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"/></g></svg>
                      <span class="text-white text-md">
                        {item?.overallReturn?.toFixed(2)}%
                      </span>
                    {/if}

                  </div>

                </div>


              </td>

              

            </tr>
            {/each}
        </tbody>
      </table>

      {/if}
      <!--End if leaderboad is empty-->



      {:else}
      <div class="w-full">
        <div class="loader">Loading...</div>
      </div>
      {/if}
    
      
  
</div>
    
    
