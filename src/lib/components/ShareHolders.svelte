<script lang='ts'>

import { Chart } from 'svelte-echarts'
import { screenWidth, stockTicker, userRegion, getCache, setCache} from '$lib/store';
import { formatString } from '$lib/utils';
import { goto } from '$app/navigation';
import { abbreviateNumber } from '$lib/utils';
import InfoModal from '$lib/components/InfoModal.svelte';
import Lazy from 'svelte-lazy';

let isLoaded = false;
const usRegion = ['cle1','iad1','pdx1','sfo1'];

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



<section class="bg-[#0F0F0F] overflow-hidden text-white h-full sm:mb-0">
    <div class="flex justify-center w-fit m-auto h-full overflow-hidden">
        <div class="relative flex justify-center items-center overflow-hidden">
            <main>
                <div class="w-fit sm:w-full sm:max-w-2xl m-auto mt-5 sm:mt-0">

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
                        <tr on:click={() => goto('/hedge-funds/'+item?.cik)} class="{index === 2 && !showFullStats && shareholderList?.length > 3 ? 'opacity-[0.5]' : '' } sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] bg-[#0F0F0F] border-b-[#0F0F0F] cursor-pointer">
                         
                            <td class="text-white font-medium  border-b border-[#0F0F0F]">
                             {item?.investorName?.length > charNumber ? formatString(item?.investorName?.slice(0,charNumber)) + "..." : formatString(item?.investorName)}
                            </td>
                        
                            <td class="text-white text-center font-medium  border-b border-[#0F0F0F]">
                                {item?.ownership <= 0.01 ? "< 0.01%" : item?.ownership?.toFixed(2)+'%'}
                            </td>

                            <td class="text-white text-end hidden sm:table-cell font-medium  border-b border-[#0F0F0F]">
                                {item?.sharesNumber !== null ? abbreviateNumber(item?.sharesNumber) : '-'}
                            </td>
                        
                            <td class="text-white text-end hidden sm:table-cell font-medium  border-b border-[#0F0F0F] ">
                                {item?.marketValue !== null ? "$" + abbreviateNumber(item?.marketValue) : '-'}
                            </td>
                            
                            <td class="text-white text-end font-medium  border-b border-[#0F0F0F]">
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

            

        
                {:else} 
                <h2 class=" mt-10 justify-center items-center text-3xl font-bold text-slate-700 mb-5 m-auto">
                    No data available
                    <svg class="w-10 sm:w-12 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#334155" d="M18.68 12.32a4.49 4.49 0 0 0-6.36.01a4.49 4.49 0 0 0 0 6.36a4.508 4.508 0 0 0 5.57.63L21 22.39L22.39 21l-3.09-3.11c1.13-1.77.87-4.09-.62-5.57m-1.41 4.95c-.98.98-2.56.97-3.54 0c-.97-.98-.97-2.56.01-3.54c.97-.97 2.55-.97 3.53 0c.97.98.97 2.56 0 3.54M10.9 20.1a6.527 6.527 0 0 1-1.48-2.32C6.27 17.25 4 15.76 4 14v3c0 2.21 3.58 4 8 4c-.4-.26-.77-.56-1.1-.9M4 9v3c0 1.68 2.07 3.12 5 3.7v-.2c0-.93.2-1.85.58-2.69C6.34 12.3 4 10.79 4 9m8-6C7.58 3 4 4.79 4 7c0 2 3 3.68 6.85 4h.05c1.2-1.26 2.86-2 4.6-2c.91 0 1.81.19 2.64.56A3.215 3.215 0 0 0 20 7c0-2.21-3.58-4-8-4Z"/></svg>
                </h2>
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
    
                
            </div>
        </main>
        </div>
        </div>
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