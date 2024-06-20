<script lang='ts'>

import { Chart } from 'svelte-echarts'
import { shareholderComponent, screenWidth, stockTicker, userRegion, getCache, setCache} from '$lib/store';
import { formatString } from '$lib/utils';
import { goto } from '$app/navigation';
import { abbreviateNumber } from '$lib/utils';
import InfoModal from '$lib/components/InfoModal.svelte';
import Lazy from 'svelte-lazy';

let isLoaded = false;
const usRegion = ['cle1','iad1','pdx1','sfo1'];

export let data;

let apiURL;

userRegion.subscribe(value => {

if (usRegion.includes(value)) {
    apiURL = import.meta.env.VITE_USEAST_API_URL;
} else {
    apiURL = import.meta.env.VITE_EU_API_URL;
}
});

let shareholderList = []
let optionsPieChart;
let institutionalOwner = 0;
let otherOwner = 0;
let topHolders = 0;
let showFullStats = false;




const plotPieChart = () => {

    shareholderList = shareholderList?.filter(item => item?.ownership <= 100);
    topHolders = 0;
    otherOwner = 0;
    institutionalOwner = 0;
    institutionalOwner = shareholderList?.reduce((total, shareholder) => total + shareholder.ownership, 0);

    otherOwner = institutionalOwner === 0 ? 0 : (100-institutionalOwner);
    topHolders = shareholderList?.slice(0,10)?.reduce((total, shareholder) => total + shareholder.ownership, 0);


    const options = {
        animation: $screenWidth < 640 ? false: true,
        grid: {
        left: '0%',
        right: '0%',
        top: '0%',
        bottom: '10%',
        containLabel: true,
    },
    series: [
        {
        name: 'Shareholders',
        type: 'pie',
        radius: ['40%', '50%'],
        padAngle: 5,
      itemStyle: {
        borderRadius: 3
      },
        label: {
            show: false,
            position: 'center',
        },
        silent: true, // Disable interactivity
        data: [
            { value: institutionalOwner, name: 'Institutions', itemStyle: { color: '#5470C6' } }, // Set color for 'Institutions'
            { value: otherOwner, name: 'Others', itemStyle: {color: '#F8901E'} },
        ]
        }
    ],

    };



    return options;
}

const getShareholders = async (ticker) => {
    // Get cached data for the specific tickerID
    const cachedData = getCache(ticker, 'getShareholders');
    if (cachedData) {
      shareholderList = cachedData;
    } else {

      const postData = {'ticker': ticker};
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/shareholders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });

      shareholderList = await response.json();

      // Cache the data for this specific tickerID with a specific name 'getShareholders'
      setCache(ticker, shareholderList, 'getShareholders');
    }

    if(shareholderList?.length !== 0) {
        $shareholderComponent = true
    }
    else {
        $shareholderComponent = false;
    }
};


$: {
    if($stockTicker && typeof window !== 'undefined') 
    {   

        isLoaded = false;
        showFullStats = false;

        const asyncFunctions = [
        getShareholders($stockTicker)
        ];
        Promise.all(asyncFunctions)
            .then((results) => {
             optionsPieChart = plotPieChart()
            })
            .catch((error) => {
                console.error('An error occurred:', error);
            });
        isLoaded = true;
    }

}


let charNumber = 20;

$: {
  if($screenWidth < 640)
  {
    charNumber = 20;
  }
  else {
    charNumber =20;
  }
}
    

</script>



<section class="overflow-hidden text-white h-full pb-8">
    <main class="overflow-hidden ">

        <div class="flex flex-row items-center">
            <label for="shareholdersInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                Shareholder Breakdown
            </label>
            <InfoModal
                title={"Shareholder Breakdown"}
                content={"Institutional shareholders are large investment entities like mutual funds and pension funds that invest significant amounts in publicly traded companies. They play a big role in influencing company decisions and stock market trends."}
                id={"shareholdersInfo"}
            />
        </div>

            {#if data?.user?.tier === 'Pro'}
                {#if isLoaded}
                {#if shareholderList?.length !== 0}
                <div class="p-3 sm:p-0 mt-2 pb-8 sm:pb-2 rounded-lg bg-[#202020] sm:bg-[#0F0F0F]">
                    <div class="text-white text-md mt-3">
                        Who owns the most stocks of the company?
                        We can break it down into two categories.
                    </div>


              

                    <div class="flex flex-row items-center sm:-mt-5">
                        
                        <Lazy height={300} fadeOption={{delay: 100, duration: 500}} keep={true}>
                            <div class="app w-56">
                                <Chart options={optionsPieChart} class="chart w-full" />
                            </div>
                        </Lazy>
                        
                        <div class="flex flex-col items-center  sm:pt-0 m-auto">

                            <div class="flex flex-row items-center mr-auto mb-5">
                                <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
                                <div class="w-4 h-4 bg-[#F8901E] border-4 box-content border-[#202020] rounded-full transform -translate-x-1/2" aria-hidden="true"></div>
                                <span class="text-white text-sm sm:text-[1rem] font-medium inline-block">
                                    Others: {otherOwner >= 99.99 ? 99.99 : otherOwner?.toFixed(2)}%
                                </span>
                            </div>
        
                            <div class="flex flex-row items-center mr-auto">
                                <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
                                <div class="w-4 h-4 bg-[#5470C6] border-4 box-content border-[#202020] rounded-full transform -translate-x-1/2" aria-hidden="true"></div>
                                <span class="text-white text-sm sm:text-[1rem] font-medium inline-block">
                                    Institutions: {institutionalOwner <= 0.01 ? "< 0.01%" : institutionalOwner?.toFixed(2)+'%'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <h1 class="text-white font-semibold text-xl sm:text-2xl mb-3 mt-5 sm:-mt-5">
                    Top Shareholders
                </h1>

                {#if topHolders !== 0}
                <span class="text-white text-md">
                    The top 10 shareholders own {topHolders <= 0.01 ? "< 0.01%" : topHolders?.toFixed(2)+'%'}
                    of the company.
                </span>
                {/if}


                <div class="flex justify-start items-center w-full m-auto mt-6 ">
                    <table class="table table-sm table-compact w-full">
                      <thead>
                        <tr class="border-b border-blue-400">
                          <th class="text-white shadow-md font-semibold text-sm text-start bg-[#0F0F0F]">Institute</th>
                          <th class="text-white shadow-md font-semibold text-sm text-start bg-[#0F0F0F]">Ownership</th>
                          <th class="text-white shadow-md font-semibold text-sm text-end hidden sm:table-cell bg-[#0F0F0F]">Shares</th>
                          <th class="text-white shadow-md font-semibold text-sm text-end hidden sm:table-cell bg-[#0F0F0F]">Market Value</th>
                          <th class="text-white shadow-md font-semibold text-sm text-end  bg-[#0F0F0F]">Portfolio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each (showFullStats ? shareholderList?.slice(0,10) : shareholderList?.slice(0,3)) as item,index}
                        {#if item?.investorName?.length > 0}
                        <tr on:click={() => goto('/hedge-funds/'+item?.cik)} class="border-y border-gray-800 odd:bg-[#202020] {index === 2 && !showFullStats && shareholderList?.length > 3 ? 'opacity-[0.5]' : '' } sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] bg-[#0F0F0F] border-b-[#0F0F0F] cursor-pointer">
                         
                            <td class="text-white font-medium">
                             {item?.investorName?.length > charNumber ? formatString(item?.investorName?.slice(0,charNumber)) + "..." : formatString(item?.investorName)}
                            </td>
                        
                            <td class="text-white text-center font-medium">
                                {item?.ownership <= 0.01 ? "< 0.01%" : item?.ownership?.toFixed(2)+'%'}
                            </td>

                            <td class="text-white text-end hidden sm:table-cell font-medium">
                                {item?.sharesNumber !== null ? abbreviateNumber(item?.sharesNumber) : '-'}
                            </td>
                        
                            <td class="text-white text-end hidden sm:table-cell font-medium ">
                                {item?.marketValue !== null ? "$" + abbreviateNumber(item?.marketValue) : '-'}
                            </td>
                            
                            <td class="text-white text-end font-medium">
                                {item?.weight <= 0.01 ? "< 0.01%" : item?.weight?.toFixed(2)+'%'}
                            </td>
                        
                        </tr>
                        {/if}
                        {/each}
                      </tbody>
                    </table>

            
                  </div>

                  <label on:click={() => showFullStats = !showFullStats} class="cursor-pointer flex justify-center items-center mt-5">
                    <svg class="w-10 h-10 transform {showFullStats ? 'rotate-180' : ''} " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#2A323C" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 13.5L7.5 11l1.42-1.41L12 12.67l3.08-3.08L16.5 11L12 15.5z"/></svg>
                </label>

            

            
                {/if}
    
                {:else}
                <div class="flex justify-center items-center h-80">
                    <div class="relative">
                    <label class="bg-[#202020] rounded-xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <span class="loading loading-spinner loading-md"></span>
                    </label>
                    </div>
                </div>  
                {/if}
    
                {:else}
                <div class="shadow-lg shadow-bg-[#000] bg-[#202020] sm:bg-opacity-[0.5] text-sm sm:text-[1rem] rounded-md w-full p-4 min-h-24 mt-4 text-white m-auto flex justify-center items-center text-center font-semibold">
                    <svg class="mr-1.5 w-5 h-5 inline-block"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#A3A3A3" d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"/></svg>
                    Unlock content with <a class="inline-block ml-2 text-blue-400 hover:sm:text-white" href="/pricing">Pro Subscription</a>
                  </div>
                {/if}
        </main>
</section>
    




<style>

.app {
    height: 300px;
    max-width: 100%; /* Ensure chart width doesn't exceed the container */

    }

    @media (max-width: 640px) {
    .app {
        height: 120px;
        width: 120px;
    }
    }

.chart {
    width: 100%;
}


</style>