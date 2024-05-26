<script lang='ts'>
  import { goto } from '$app/navigation';
  import { screenWidth, userRegion, numberOfUnreadNotification} from '$lib/store';
  import Searchbar from '$lib/components/Searchbar.svelte';
  
  import AddPortfolio from '$lib/components/AddPortfolio.svelte';
  import Markethour from '$lib/components/Markethour.svelte';
  
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  
  export let data;
  export let form;

  let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;


  
  const usRegion = ['cle1','iad1','pdx1','sfo1'];
let fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL; // Set a default FASTIFY URL
userRegion.subscribe(value => {
if (usRegion.includes(value)) {
  fastifyURL = import.meta.env.VITE_USEAST_FASTIFY_URL;
} else {
  fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;
}
});

  let isLoaded = false;
      
  
  
  
  async function getUserPortfolio()
  {
    const postData = {'userId': data?.user?.id};
  
    const response = await fetch(fastifyURL+'/get-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });
  
      portfolio = (await response.json())?.items;
  }
  
  
      const currentDate = new Date();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
  
      const currentMonthIndex = currentDate.getMonth();
      let displayMonth = 'n/a';
  
      if (currentMonthIndex >= 0 && currentMonthIndex < monthNames.length) {
        displayMonth = monthNames[currentMonthIndex];
      }
  
      let portfolio = [];
  
      let lastUpdate = 'n/a';
  
      let holdingsList = [];
      let tradingHistoryList = [];
  
  

  let LoginPopup;

  onMount( async () => {
    
    if(data?.user)
    {
      await getUserPortfolio();
    }
    else {
      LoginPopup = (await import('$lib/components/LoginPopup.svelte')).default;
    }

    if (portfolio?.length !== 0)
      {
        holdingsList =  portfolio?.at(0)['holdings'] || [];
        tradingHistoryList =  portfolio?.at(0)['tradingHistory'] || [];
        tradingHistoryList.sort((a, b) => new Date(b?.date) - new Date(a?.date));
  
        lastUpdate = portfolio[0]?.updated;

      }
  
      isLoaded = true;
  
  })
     
  
      let displayChange = 'Change in %';
      let showTradingHistory = false;
  
  

  function handleChange(state:string)
  {
    displayChange = state;
  }
  
      
  let deg = 0;
  
  async function handleUpdatePortfolio() {
      deg = (deg + 180) % 360;
  
      await getUserPortfolio();
  
      if (portfolio?.length !== 0)
      {
        holdingsList =  portfolio[0]['holdings'] || [];
        tradingHistoryList =  portfolio[0]['tradingHistory'] || [];
        tradingHistoryList.sort((a, b) => new Date(a?.date) - new Date(b?.date));
        lastUpdate = portfolio[0]?.updated;
      }
  
  }
   
  
  let charNumber = 20;

  $: {
    if($screenWidth < 640) {
      charNumber = 20;
    }
    else {
      charNumber = 30
    }
  }
  
  </script>



<svelte:head>
  <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Portfolio · stocknear</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />

  <meta name="description" content="Join our monthly Portfolio Tournament for free to win real prizes.">
  <!-- Other meta tags -->
  <meta property="og:title" content="Portfolio · stocknear"/>
  <meta property="og:description" content="Join our monthly Portfolio Tournament for free to win real prizes.">
  <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="Portfolio · stocknear"/>
  <meta name="twitter:description" content="Join our monthly Portfolio Tournament for free to win real prizes.">
  <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>
	    
          
      
      
    <div class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 mb-40">
      
      
  
    <div class="w-full max-w-4xl m-auto sm:bg-[#202020] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
    
        <!-- Start Column -->
        <div>
          <div class="flex flex-col justify-center items-center">
            <h1 class="text-center text-3xl sm:text-4xl text-white font-bold mb-2">
              Portfolio Tournament
            </h1>
            <h1 class="text-center text-lg sm:text-2xl text-white font-medium mb-5">
              {displayMonth} 2023 🚀
            </h1>
          </div>
  
          <span class="hidden sm:block text-white text-md font-medium text-center flex justify-center items-center ">
            🥇Secure the top position in the tournament to claim your fame and prize 🏆
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
          
          
          <div class="z-1 absolute top-7">
            <img class="w-36 h-fit ml-2" src={cloudFrontUrl+"/assets/portfolio_icon.png"} alt="logo" loading="lazy">
          </div>
        </div>
        <!-- End Column -->
    
      </div>
    </div>
      
      
      {#if isLoaded}
        <div class="flex flex-col sm:flex-row justify-center sm:justify-start items-center mt-5">
        </div>
      
        {#if portfolio.length === 0}
  
          <div class="bg-[#202020] pt-5 pb-5 mt-5 sm:rounded-2xl border-t border-b sm:border border-slate-800">
         
  
            <div class="flex flex-row ">
              <div class="text-slate-300 font-bold text-xl pl-5 w-full flex items-center">
                Portfolio
              </div>
              
              
      
              <div class="w-3/4 flex ml-auto mr-3 flex-row justify-end items-center -mt-2">
                <a href="/leaderboard" class="text-blue-400 hover:text-white font-medium text-lg mr-3 sm:mr-8 hover:underline">
                  Rank: 'n/a'
                </a>
    
              </div>
    
            </div>
  
            <div class="p-5 grid grid-cols-3 gap-10 flex justify-center items-center mb-2">
              <!--Start Column Title-->
              <div class="flex flex-col">
                <div class="flex flex-row items-center">
                  <span class="text-white font-bold text-sm sm:text-lg">
                    Account Value
                  </span>
                  <label for="accountValueInfo" class="cursor-pointer">
                    <svg class="ml-1 w-5 h-5 inline-block" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#2A323C"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#2A323C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#2A323C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#2A323C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g></svg>
                  </label>
                </div>
               
                <span class="text-white text-sm sm:text-[1rem] mt-2">
                  $100,000.00
                </span>
              </div>
              <!--End Column Title-->
        
              <!--Start Column Win Rate-->
              <div class="flex flex-col">
                <div class="flex flex-row items-center">
                  <span class="text-white font-bold text-sm sm:text-lg">
                    Available Cash
                  </span>
                  <label for="availableCashInfo" class="cursor-pointer">
                    <svg class="ml-1 w-5 h-5 inline-block" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#2A323C"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#2A323C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#2A323C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#2A323C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g></svg>
                  </label>
                </div>
                <span class="text-white text-sm sm:text-[1rem] mt-2">
                  $100,000.00
                </span>
              </div>
              <!--End Column Win Rate-->
        
              <!--Start Column Performance-->
              <div class="flex flex-col">
                <div class="flex flex-row items-center">
                  <span class="text-white font-bold text-sm sm:text-lg">
                    Overall Return
                  </span>
                  <label for="overallReturnInfo" class="cursor-pointer">
                    <svg class="ml-1 w-5 h-5 inline-block" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#2A323C"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#2A323C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#2A323C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#2A323C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g></svg>
                  </label>
                </div>
                  <span class="text-white text-sm sm:text-[1rem] mt-2">
                    0.00%
                  </span>
              </div>
  
            </div>
        
          
        </div>
  
        <div class="flex flex-col justify-center items-center text-gray.400 font-bold text-2xl mt-10">
  
          <label for="{data?.user ? 'addPortfolio' : 'userLogin'}" class="btn btn-md w-64 text-black rounded-lg bg-[#fff] cursor-pointer py-2.5 px-4 btn hover:bg-[#fff]">
            Join Tournament
          </label>
          </div>
  
  
        {:else}
          
        <div class="ml-auto w-fit mb-5 mr-4 sm:mr-0">
          <Markethour />
        </div>   

        <div class="bg-[#202020] border-t border-b sm:border border-slate-800 pt-5 pb-5 mt-5 sm:rounded-2xl">
         
          
          <div class="flex flex-row items-center">
            <div class="text-slate-300 font-bold text-xl pl-5 w-full flex items-center">
              Portfolio
              <label on:click={handleUpdatePortfolio} class="sm:cursor-pointer rounded-full w-8 h-8 relative sm:hover:bg-gray-800 inline-block ml-2">
                <svg  class=" {`rotate-${deg}`} transition-transform rounded-full w-5 h-5 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2" fill="#ffffff"  version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 495.099 495.099" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="XMLID_73_"> <g id="XMLID_75_"> <path id="XMLID_76_" d="M203.82,1.475c-1.28,1.472-1.422,3.624-0.328,5.247l28.608,42.45 C129.497,57.098,48.389,142.944,48.389,247.546c0,59.917,26.716,113.6,68.714,150.149c3.524-4.587,7.842-8.597,13.274-11.282 l34.04-16.833c-38.96-26.623-64.605-71.382-64.605-122.034c0-75.819,57.44-138.424,131.083-146.733l-27.394,40.658 c-1.096,1.625-0.962,3.774,0.327,5.249c1.289,1.473,3.405,1.891,5.154,1.028c35.723-17.665,103.131-51.013,135.047-66.803 c5.734-2.837,5.722-11.012-0.013-13.846c-92.208-45.566-75.115-37.037-135.041-66.653C207.225-0.418,205.108,0.001,203.82,1.475z"></path> </g> <path id="XMLID_74_" d="M446.71,247.546c0-59.758-26.582-113.314-68.403-149.856c-3.507,4.494-7.734,8.445-12.957,10.998 l-34.415,17.015c38.817,26.649,64.353,71.309,64.353,121.844c0,75.585-57.089,138.005-130.397,146.634l27.335-40.551 c1.096-1.624,0.954-3.773-0.326-5.248c-1.289-1.473-3.408-1.891-5.156-1.028c-51.816,25.61-17.87,8.829-141.178,69.776 c-1.472,0.727-2.401,2.225-2.401,3.867v0.007c0,1.65,0.929,3.139,2.401,3.858c0,0,95.723,47.322,141.169,69.794 c1.748,0.862,3.867,0.443,5.156-1.028c1.289-1.475,1.423-3.626,0.326-5.249l-28.615-42.475 C365.919,437.667,446.71,351.946,446.71,247.546z"></path> </g> </g></svg>
              </label>
            </div>
    
            <div class="w-3/4 flex ml-auto mr-3 flex-row justify-end items-center -mt-2">
              <a href="/leaderboard" class="text-blue-400 hover:text-white font-medium text-lg mr-3 sm:mr-8 hover:underline">
                Rank: {portfolio[0]?.rank === 0 ? 'n/a' : portfolio[0]?.rank }
              </a>
  
            </div>
  
          </div>

          <div class="p-5 grid grid-cols-3 gap-10 flex justify-center items-center mb-2">
            <!--Start Column Title-->
            <div class="flex flex-col">
              <div class="flex flex-row items-center">
                <span class="text-white font-bold text-sm sm:text-lg">
                  Account Value
                </span>
                <label for="accountValueInfo" class="cursor-pointer">
                 <svg class="ml-1 w-5 h-5 inline-block" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#2A323C"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#2A323C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#2A323C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#2A323C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g></svg>
                </label>
              </div>
             
              <span class="text-white text-sm sm:text-[1rem] mt-2">
                ${new Intl.NumberFormat("en", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
              }).format(portfolio?.at(0)?.accountValue)}
              </span>
            </div>
            <!--End Column Title-->
      
            <!--Start Column Win Rate-->
            <div class="flex flex-col">
              <div class="flex flex-row items-center">
                <span class="text-white font-bold text-sm sm:text-lg">
                  Available Cash
                </span>
                <label for="availableCashInfo" class="cursor-pointer">
                 <svg class="ml-1 w-5 h-5 inline-block" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#2A323C"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#2A323C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#2A323C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#2A323C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g></svg>
                </label>
              </div>
              <span class="text-white text-sm sm:text-[1rem] mt-2">
               
               ${new Intl.NumberFormat("en", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(portfolio?.at(0)?.availableCash)}
              </span>
            </div>
            <!--End Column Win Rate-->
      
            <!--Start Column Performance-->
            <div class="flex flex-col">
              <div class="flex flex-row items-center">
                <span class="text-white font-bold text-sm sm:text-lg">
                  Overall Return
                </span>
                <label for="overallReturnInfo" class="cursor-pointer">
                 <svg class="ml-1 w-5 h-5 inline-block" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#2A323C"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#2A323C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#2A323C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#2A323C" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g></svg>
                </label>
              </div>
              {#if portfolio?.at(0)?.overallReturn > 0}
                <span class="text-[#10DB06] text-sm sm:text-[1rem] mt-2">
                  +{portfolio?.at(0)?.overallReturn?.toFixed(2)}%
                </span>
              {:else if portfolio?.at(0)?.overallReturn < 0}
                <span class="text-[#FF2F1F] text-sm sm:text-[1rem] mt-2">
                  {portfolio?.at(0)?.overallReturn?.toFixed(2)}%
                </span>
              {:else}
                <span class="text-white text-sm sm:text-[1rem] mt-2">
                  {portfolio?.at(0)?.overallReturn?.toFixed(2)}%
                </span>
              {/if}
            </div>
            <!--End Column Performance-->
      
             <!--
             <div class="flex flex-col">
              <div class="flex flex-row">
                <span class="text-white font-bold text-md">
                  Alpha
                </span>
                <label for="alphaInfo" class="cursor-pointer">
                  <svg class="w-5 h-5 inline-block ml-1 mb-1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#202020000"> <g id="SVGRepo_bgCarrier" stroke-width="0"></g> <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g> <g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#3276C3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#3276C3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#3276C3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g> </svg>
                </label>
              </div>
              <span class="text-white text-sm">
                {portfolio?.at(0)?.metrics['alpha']}
              </span>
            </div>
  
            <div class="flex flex-col">
              <div class="flex flex-row">
                <span class="text-white font-bold text-md">
                  Beta
                </span>
                <label for="betaInfo" class="cursor-pointer">
                  <svg class="w-5 h-5 inline-block ml-1 mb-1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#202020000"> <g id="SVGRepo_bgCarrier" stroke-width="0"></g> <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g> <g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#3276C3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#3276C3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#3276C3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g> </svg>
                </label>
              </div>
              <span class="text-white text-sm">
                {portfolio[0]?.metrics['beta']}
              </span>
            </div>
  
            <div class="flex flex-col">
              <div class="flex flex-row">
                <span class="text-white font-bold text-md">
                  Max Drawdown
                </span>
                <label for="maxDrawdownInfo" class="cursor-pointer">
                  <svg class="w-5 h-5 inline-block ml-1 mb-1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#202020000"> <g id="SVGRepo_bgCarrier" stroke-width="0"></g> <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g> <g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#3276C3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#3276C3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#3276C3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g> </svg>
                </label>
              </div>
              {#if portfolio[0]?.metrics['maxDrawdown'] < 0}
              <span class="text-[#FF2F1F] text-sm">
                {portfolio[0]?.metrics['maxDrawdown']} %
              </span>
              {:else}
              <span class="text-white text-sm">
                {portfolio[0]?.metrics['maxDrawdown']} %
              </span>
              {/if}
            </div>
  
            -->
  
          </div>
      
        
      </div>
      {/if}
  
  
  
      {#if portfolio?.length !== 0}


      <div class="bg-[#202020] pt-5 pb-5 mt-10 sm:rounded-2xl">
        <div class="flex flex-row justify-between items-center">
          <div class="text-slate-300 font-bold text-lg pl-5">
            Holdings
          </div>
          <label for="holdingsCategoryInfo" class="cursor-pointer hover:underline text-blue-400 font-medium text-sm mr-3">
            {displayChange}
            <svg class="w-5 h-5 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(180 12 12)"><path fill="#1a56db" d="m12 10.8l-4.6 4.6L6 14l6-6l6 6l-1.4 1.4l-4.6-4.6Z"/></g></svg>
          </label>
        </div>  
        {#if holdingsList?.length === 0}
          <div class="flex justify-center items-center text-white mt-5 sm:mt-0 font-medium text-md">
            No Holdings found
          </div>
  
          <div class="w-full text-start flex flex-col justify-center items-center mt-2 sm:mt-5">
            <Searchbar />
  
              <span class="text-sm text-white m-auto mt-3 w-3/4 sm:w-1/2 text-center">
                Click on the Search Icon to find your favorite stocks and begin growing your portfolio.
              </span>
          </div>
  
  
        {:else}
        <table class="table table-sm table-compact  w-full m-auto mt-4">
  
          <tbody class="">
            {#each holdingsList as item, index}
            <tr on:click={() => goto(`/${item?.assetType === 'etf' ? 'etf' : 'stocks'}/${item?.symbol}`)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] {index % 2 === 0 ? 'bg-opacity-[0.25] bg-[#323239]' : 'bg-[#202020]'} border-b-[#0F0F0F] cursor-pointer">
            <td class="text-white border-b border-[#202020]">
              <div class="flex flex-row">
                <div class="flex flex-col text-sm">
                  <span class="text-blue-400">{item?.symbol}</span>
                  <span class="text-white">{item.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}</span>
                  <div class="flex flex-row items-center mt-0.5">
                    <span class="bg-[#333333] rounded text-white pl-1 pr-1 w-fit">
                      x{item?.numberOfShares}
                    </span>
                    <span class="text-white ml-1">
                      ${new Intl.NumberFormat("en", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }).format(item?.numberOfShares * item?.currentPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </td>
  
            <td class="text-white border-b border-[#202020]">
              <div class="flex flex-row justify-end items-center">
                <div class="flex flex-col mt-3">
                  <span class="text-white text-md ml-auto">${item?.currentPrice?.toFixed(2)}</span>
                  <div class="flex flex-row mt-1">
                    {#if displayChange === "Change in %"}
                      {#if item?.sinceBoughtChange >=0}
                        <svg class="w-5 h-5 -mr-0.5 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                        <span class="text-[#10DB06] text-xs font-medium">+{item?.sinceBoughtChange?.toFixed(2)}%</span>
                      {:else}
                        <svg class="w-5 h-5 -mr-0.5 -mt-0.5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                        <span class="text-[#FF2F1F] text-xs font-medium">{item?.sinceBoughtChange?.toFixed(2)}%</span> 
                      {/if}
                    {:else}
                      {#if item?.sinceBoughtChange >=0}
                        <svg class="w-5 h-5 -mr-0.5 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                        <span class="text-[#10DB06] text-xs font-medium">+${(item?.numberOfShares * item?.currentPrice * item?.sinceBoughtChange/100 )?.toFixed(2)}</span>
                      {:else}
                        <svg class="w-5 h-5 -mr-0.5 -mt-0.5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                        <span class="text-[#FF2F1F] text-xs font-medium">${(item?.numberOfShares * item?.currentPrice * item?.sinceBoughtChange/100 )?.toFixed(2)}</span> 
                      {/if}
                    {/if}
                  </div>
                </div>
            </div>
            </td>
  
           
            {/each}
          </tbody>
        </table>
      
        {/if}  
      </div>
  
      <div class="bg-[#202020] pt-5 pb-5 mt-10 sm:rounded-2xl {!showTradingHistory ? 'shadow-md' : ''}">
        <div on:click={() => showTradingHistory = !showTradingHistory}  class="cursor-pointer flex flex-row items-center justify-between">
          <div class="text-slate-300 font-bold text-lg pl-5 w-full">
            Trading History
          </div>
  
          <div class="pr-5 button text-md mt-1 cursor-pointer text-white font-medium hover:text-[#DF4390] hover:underline">
            <svg class="{showTradingHistory ? 'rotate-180' : 'rotate-0'} transform   transition-transform w-7 h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(180 12 12)"><path fill="#1a56db" d="m12 10.8l-4.6 4.6L6 14l6-6l6 6l-1.4 1.4l-4.6-4.6Z"/></g></svg>
          </div>
  
  
        </div>  
        {#if tradingHistoryList?.length === 0}
          <div class="flex justify-center items-center text-slate-300 font-medium text-md ">
            {#if showTradingHistory}
              <span class="text-slate-200 text-md mt-5">
                No Trading History found
              </span>
            {/if}
          </div>
        {:else}
        {#if showTradingHistory}
        <div transition:fade={{ delay: 0, duration: 80 }} in={showTradingHistory}>
          <table class="table table-sm table-compact w-full m-auto mt-4">
            <tbody class="">
              {#each tradingHistoryList as item, index}
              <tr class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] {index % 2 === 0 ? 'bg-opacity-[0.25] bg-[#323239]' : 'bg-[#202020]'} border-b-[#0F0F0F] cursor-pointer">
              <td class="text-white border-b border-[#202020]">
                <div class="flex flex-row items-center">
                  <div class="flex flex-col">
                    <span class="text-blue-400">{item?.symbol}</span>
                    <span class="text-white text-xs sm:text-sm">{item.name?.length > charNumber ? item?.name.slice(0,charNumber) + "..." : item?.name}</span>
                  </div>
  
                  <div class="ml-auto text-gray-300 mt-1 text-sm">
                    {#if item?.type === 'buy'}
                      <span class="text-[#10DB06]">Bought</span> {item?.numberOfShares} shares at {item?.price?.toLocaleString(undefined, {
                        style: 'currency',
                        currency: 'USD',
                    })}
                    {:else} 
                      <span class="text-[#FF2F1F]">Sold</span> {item?.numberOfShares} shares at {item?.price?.toLocaleString(undefined, {
                        style: 'currency',
                        currency: 'USD',
                    })}
                    {/if}
                  </div>
  
                </div>
              </td>
              {/each}
            </tbody>
          </table>
          </div>
        {/if}
        {/if}  
      </div>
  
      {/if}
  
  
      
  
    {:else}
    <div class="flex justify-center items-center m-auto w-full max-w-6xl">
        <div class="loader">Loading...</div>
    </div>
  
  
    {/if}
  
    
  </div>
      
      
      
<!--Start Login Modal-->
{#if LoginPopup}
<LoginPopup form={form}/> 
{/if}   
<!--End Login Modal-->
  
  <!--Start Account Value Modal-->
  <input type="checkbox" id="accountValueInfo" class="modal-toggle" />
      
  <dialog id="accountValueInfo" class="modal modal-bottom sm:modal-middle ">
  
  
    <label id="accountValueInfo" for="accountValueInfo"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
    
    
    <div class="modal-box w-full bg-[#202020]">
  
  
  
      <div class="text-white mb-5">
        <h3 class="font-bold text-2xl mb-5">
          Account Value
        </h3>
        Account value in a portfolio refers to the total worth of the investments it holds.
      </div>
  
      
  
  
        </div>
    </dialog>
  <!--End Account Value Modal-->
  
  <!--Start Available Cash Modal-->
  <input type="checkbox" id="availableCashInfo" class="modal-toggle" />
      
  <dialog id="availableCashInfo" class="modal modal-bottom sm:modal-middle ">
  
  
    <label id="availableCashInfo" for="availableCashInfo"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
    
    
    <div class="modal-box w-full bg-[#202020]">
  
  
      <div class="text-white mb-5">
        <h3 class="font-bold text-2xl mb-5">
          Available Cash
        </h3>
        Available cash in a portfolio refers to the amount of money that is accessible for new investments, excluding the value of existing holdings.
      </div>
  
      
  
          
        </div>
    </dialog>
  <!--End Available Cash <Modal-->
  
  
  <!--Start Overall Return Modal-->
  <input type="checkbox" id="overallReturnInfo" class="modal-toggle" />
      
  <dialog id="overallReturnInfo" class="modal modal-bottom sm:modal-middle ">
  
  
    <label id="overallReturnInfo" for="overallReturnInfo"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
    
    
    <div class="modal-box w-full bg-[#202020]">
  
  
      <div class="text-white mb-5">
        <h3 class="font-bold text-2xl mb-5">
          Overall Return
        </h3>
        Overall return in a portfolio is the total gain or loss on all investments as a percentage of the initial investment.
      </div>
  
          
        </div>
    </dialog>
  <!--End Overall Return Modal-->
  
  
  
  <!--Start Alpha Modal-->
  <input type="checkbox" id="alphaInfo" class="modal-toggle" />
      
  <dialog id="alphaInfo" class="modal modal-bottom sm:modal-middle ">
  
  
    <label id="alphaInfo" for="alphaInfo"  class="cursor-pointer modal-backdrop"></label>
    
    
    <div class="modal-box w-full bg-[#202020] ">
  
  
  
    <label for="alphaInfo" class="btn btn-sm btn-circle absolute right-2 top-2 bg-red-600 hover:bg-red-800">✕</label>
  
      <div class="text-white">
        <h3 class="font-bold text-2xl mb-5">
          Alpha
        </h3>
        Alpha is a measure of a portfolio's performance relative to the S&P500 benchmark. A positive alpha indicates it outperformed the index, while a negative alpha means it underperformed. 
      </div>
  
      <div class="modal-action">
        <!-- if there is a button in form, it will close the modal -->
        <label for="alphaInfo" class="btn bg-red-600 text-white">Got it</label>
      </div>
  
          
        </div>
    </dialog>
  <!--End Alpha Modal-->
  
  
  
  <!--Start Beta Modal-->
  <input type="checkbox" id="betaInfo" class="modal-toggle" />
      
  <dialog id="betaInfo" class="modal modal-bottom sm:modal-middle ">
  
  
    <label id="betaInfo" for="betaInfo"  class="cursor-pointer modal-backdrop"></label>
    
    
    <div class="modal-box w-full bg-[#202020] ">
  
  
  
    <label for="betaInfo" class="btn btn-sm btn-circle absolute right-2 top-2 bg-red-600 hover:bg-red-800">✕</label>
  
      <div class="text-white">
        <h3 class="font-bold text-2xl mb-5">
          Beta
        </h3>
        Beta measures your portfolio's sensitivity to market movements. 
        <br>
        <br>
        A beta of 1 means it moves in line with the S&P500. A beta less than 1 implies lower volatility, while a beta greater than 1 suggests higher volatility.
      </div>
  
      <div class="modal-action">
        <!-- if there is a button in form, it will close the modal -->
        <label for="betaInfo" class="btn bg-red-600 text-white">Got it</label>
      </div>
  
          
        </div>
    </dialog>
  <!--End Beta Modal-->
  
  
  
  <!--Start Max Drawdown Modal-->
  <input type="checkbox" id="maxDrawdownInfo" class="modal-toggle" />
      
  <dialog id="maxDrawdownInfo" class="modal modal-bottom sm:modal-middle ">
  
  
    <label id="maxDrawdownInfo" for="maxDrawdownInfo"  class="cursor-pointer modal-backdrop bg-[#fff] bg-opacity-[0.08]"></label>
    
    
    <div class="modal-box w-full bg-[#202020] border border-slate-800">
  
  
  
    <label for="maxDrawdownInfo" class="btn btn-sm btn-circle absolute right-2 top-2 bg-red-600 hover:bg-red-800">✕</label>
  
      <div class="text-white">
        <h3 class="font-bold text-2xl mb-5">
          Max Drawdown
        </h3>
        Max Drawdown measures the largest loss from a portfolio peak to its lowest point, showing the worst possible drop in value.
      </div>
  
      <div class="modal-action">
        <!-- if there is a button in form, it will close the modal -->
        <label for="maxDrawdownInfo" class="btn bg-red-600 text-white">Got it</label>
      </div>
  
          
        </div>
    </dialog>
  <!--End Max Drawdown Modal-->
  
  
  
  
  
  <!--Start Holdings Category Modal-->
  
  <input type="checkbox" id="holdingsCategoryInfo" class="modal-toggle" />
        
   <dialog id="holdingsCategoryInfo" class="modal modal-bottom sm:modal-middle ">
   
   
     <label id="holdingsCategoryInfo" for="holdingsCategoryInfo"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
     
     
     <div class="modal-box w-full bg-[#202020] sm:border sm:border-slate-800">
   
   
   
       <div class="text-white">
         <h3 class="font-medium text-lg sm:text-2xl mb-10">
           Performance
         </h3>
   
   
         <div class="flex flex-col items-center w-full max-w-3xl bg-[#202020]">
   
   
           <label for="holdingsCategoryInfo" on:click={() => handleChange('Change in %')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
   
               <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {displayChange === 'Change in %' ? 'ring-2 ring-[#04E000]' : ''}">
                 
                 <span class="ml-1 text-white font-medium mr-auto">
                    Change in %
                 </span>
   
                 <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                   {#if displayChange === 'Change in %'}
                     <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#202020000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                   {/if}
                 </div>
   
               </div>
              
           </label>
   
   
           <label for="holdingsCategoryInfo" on:click={() => handleChange('Change in $')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
   
             <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {displayChange === 'Change in $' ? 'ring-2 ring-[#04E000]' : ''}">
               
               <span class="ml-1 text-white font-medium mr-auto">
                  Change in $
               </span>
   
               <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                 {#if displayChange === 'Change in $'}
                 <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#202020000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                 {/if}
               </div>
   
             </div>
            
           </label>
   
   
         </div>
          
       </div>
   
   
           
         </div>
     </dialog>
  <!--End Holdings Category Modal-->
   
  
  
  
  <!--Start Add Portfolio Modal-->
  <AddPortfolio data={data} />
  <!--End Add Portfolio Modal-->
  
