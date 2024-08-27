<script lang='ts'>
  //import ProgressBar from 'progressbar.js';
  import {stockTicker, screenWidth} from '$lib/store';
  import { abbreviateNumber } from '$lib/utils';
  
  export let lastPrice;
  export let analystRating = {};
  

  let buyCount = 0;
  let holdCount = 0;
  let sellCount = 0;
  let priceTarget = 'n/a';
  let numOfAnalyst = 0;
  let consensusRating = 'n/a';
  let changesPercentage = 0;  
  
  
  
  $: {
    
if ($stockTicker && typeof window !== 'undefined' && typeof analystRating !== 'undefined' && Object?.keys(analystRating)?.length !== 0)
  { 
    numOfAnalyst = analystRating?.numOfAnalyst;
    buyCount = (analystRating?.Buy/numOfAnalyst * 100)?.toFixed(2);
    holdCount = (analystRating?.Hold/numOfAnalyst * 100)?.toFixed(2);
    sellCount = (analystRating?.Sell/numOfAnalyst * 100)?.toFixed(2);
    priceTarget = analystRating?.priceTarget
    consensusRating = analystRating?.consensusRating;
    console.log(lastPrice)
    try {
        changesPercentage = ((priceTarget/lastPrice -1)*100)?.toFixed(2) ?? 0;
      } catch(e) {
        changesPercentage = 0;
      }
    
  }
}
  
  </script>
  


  
  
  <!--Start Analyst Card -->
  <div class="space-y-3 sm:pt-5 hidden sm:block sm:{Object?.keys(analystRating)?.length !== 0 ? '' : 'hidden'}">  
    <div class="sm:rounded-lg shadow-lg bg-[#000] sm:bg-[#09090B] sm:border sm:border-slate-800 h-auto {$screenWidth < 640 ? 'w-screen pt-16' : ''} md:w-[420px] -mx-1 sm:mx-0">
     
      <!--Start Content-->
      <div class="w-auto lg:w-full p-1 flex flex-col m-auto pb-14 sm:pb-10 px-2 sm:px-0">
        <h2 class="text-start text-2xl font-semibold text-white p-3 mt-3 ml-1">
          Analyst Rating
        </h2>
  
        <div class="flex flex-col mt-5 w-full">
            <div class="flex flex-row m-auto w-full">
                <span class="text-start mr-auto ml-5 text-white font-medium text-xl">
                    Signal
                </span>
                <span class="mr-5 text-white font-medium text-xl">
                    Price Target
                </span>
            </div>
            <div class="flex flex-row m-auto w-full">
                    {#if consensusRating === 'Buy' || consensusRating === 'Strong Buy'}
                    <span class="text-start font-semibold text-[#10DB06] mr-auto ml-5 mt-2 text-xl">
                    {consensusRating}
                    </span>
                    {:else if consensusRating === 'Sell' || consensusRating === 'Strong Sell' }
                    <span class="text-start font-semibold text-[#FF2F1F] mr-auto ml-5 mt-2 text-xl">
                        {consensusRating}
                    </span>
                    {:else}
                    <span class="text-start font-semibold text-[#FF2F1F] mr-auto ml-5 mt-2 text-xl">
                        {consensusRating}
                    </span>
                    {/if}
              
              <span class="mr-5 mt-2 font-semibold text-xl text-white">
                {#if priceTarget !== 'n/a'}  
                  ${priceTarget}
                {:else}
                  -
                {/if}
              </span>
                
                
            </div>
        </div>
        

        <div class="text-white pl-4 pr-4 mt-6">
          {#if changesPercentage < 0 }
              The Stock Price has a downside of
              <span style="color: #FF2F1F; font-weight: 500">{abbreviateNumber(Math.abs(changesPercentage))}%</span>
          {:else if changesPercentage >= 0 }
              The Stock Price has an upside of
              <span style="color: #10DB06; font-weight: 500">{abbreviateNumber(Math.abs(changesPercentage))}%</span>
          {/if}
          based on <span style="font-weight: 600">{numOfAnalyst}</span> analysts in the past 12 months.
      </div>
      


  
      
          <div class="mt-5 w-full rounded-full flex justify-center items-center mb-5">
            <div class="flex flex-col items-center w-full">
              <!--Start Progress-->
  
                  
             
              <div class="flex flex-col items-center w-full">
                <div class="flex flex-row items-center w-11/12 mt-5 mb-2">
                  <span class="text-white font-medium text-start mr-auto">
                    Buy
                  </span>
                  <span class="text-white text-md font-medium ml-auto">
                    {buyCount}%
                  </span>
                </div>
                <progress class="progress bg-[#3B3D3F] w-11/12 [&::-webkit-progress-value]:bg-[#10DB06] [&::-moz-progress-bar]:bg-[#10DB06]" value={buyCount} max="100"></progress>
              </div>
              
              <div class="flex flex-col items-center w-full">
                <div class="flex flex-row items-center w-11/12 mt-5 mb-2">
                  <span class="text-white font-medium text-start mr-auto">
                    Hold
                  </span>
                  <span class="text-white text-md font-medium ml-auto">
                    {holdCount}%
                  </span>
                </div>
                <progress class="progress bg-[#3B3D3F] w-11/12 [&::-webkit-progress-value]:bg-[#fff] [&::-moz-progress-bar]:bg-[#fff]" value={holdCount} max="100"></progress>
              </div>
            
              <div class="flex flex-col items-center w-full">
                <div class="flex flex-row items-center w-11/12 mt-5 mb-2">
                  <span class="text-white font-medium text-start mr-auto">
                    Sell
                  </span>
                  <span class="text-white text-md font-medium ml-auto">
                    {sellCount}%
                  </span>
                </div>
                <progress class="progress bg-[#3B3D3F] w-11/12 [&::-webkit-progress-value]:bg-[#FF2F1F] [&::-moz-progress-bar]:bg-[#FF2F1F]" value={sellCount} max="100"></progress>
              </div>

              
              <!--End Progress-->
            

            </div>
          </div>
        
          <a href={`/stocks/${$stockTicker}/analyst`} class="rounded-lg cursor-pointer w-11/12 py-2 h-full mt-6 text-lg text-center font-bold text-white m-auto hover:bg-purple-700 bg-purple-600 transition duration-100">
            Analyst Ratings
          </a>

        </div>
    </div>
  </div>
  
  <!--End Analyst Card-->




  <!--Start Mobile Analyst Card-->
<div class="space-y-3 sm:pt-5 sm:hidden">  
  
  <div class="bg-[#000] h-auto w-screen">
  
   <!--Start Header-->
   <div class="bg-[#09090B] w-full  p-1 flex flex-col items-center pb-5 h-auto rounded-b-[30px]">
    <h2 class="text-center m-auto text-[1.1rem] font-medium text-white mt-5">
      Analyst Rating
    </h2>

    <div class="flex flex-col items-center mt-10 w-full">

      <div class="flex flex-row justify-between items-center w-full mb-5">


        <div class="flex flex-col items-start ml-3 ">
          <span class="text-white text-lg font-medium inline-block">
            Recommendation:
          </span>
          <span class="text-white text-2xl font-medium inline-block">
              {#if consensusRating === 'Buy' || consensusRating === 'Strong Buy'}
              <span class="text-start font-medium text-[#10DB06] text-2xl">
              {consensusRating}
              </span>
              {:else if consensusRating === 'Sell' || consensusRating === 'Strong Sell' }
              <span class="text-start font-medium text-[#FF2F1F] text-2xl">
                  {consensusRating}
              </span>
              {:else if consensusRating === 'Hold'}
              <span class="text-start font-medium text-[#FF2F1F] text-2xl">
                  {consensusRating ?? 'n/a'}
              </span>
              {:else}
              <span class="text-start font-medium text-white text-2xl">
                n/a
            </span>
              {/if}
          </span>
        </div>



        <div class="flex flex-col items-start mr-5">
          <span class="text-white ml-auto text-lg font-medium inline-block">
            Price Target:
          </span>
          <span class="text-white ml-auto text-2xl font-medium inline-block">
            {#if priceTarget !== 'n/a'}  
              ${priceTarget}
            {:else}
              -
            {/if}
          </span>
        </div>
    
      </div>

      {#if changesPercentage < 0 }
      <div class="text-white p-4 text-center">
          The Stock Price has a downside of
          <span class="text-[#FF2F1F] font-medium">{abbreviateNumber(Math?.abs(changesPercentage))} %</span>
          based on <span class="font-semibold">{numOfAnalyst}</span> analysts.
      </div>
      {:else if changesPercentage >= 0 }
      <div class="text-white p-4 text-center">
          The Stock Price has an upside of
          <span class="text-[#10DB06] font-medium">{abbreviateNumber(Math?.abs(changesPercentage))} %</span>
          based on <span class="font-semibold">{numOfAnalyst}</span> analysts.
      </div>
      {/if}

    </div>
  </div>
  <!--End Header-->

    {#if numOfAnalyst !== 0}
    <div class="mt-5 flex flex-col m-auto items-center rounded-lg w-full mb-16 p-3">


      <div class="shadow-lg bg-[#09090B] w-full rounded-lg p-4 mb-5  flex flex-row items-center">
        <div class="flex flex-col -mt-2 w-full">
            <div class="flex flex-row items-center w-full">
                <span class="text-white text-md font-medium text-start mb-2 mr-auto mt-2">
                  Buy
                </span>
            <span class="text-white text-md font-medium ml-auto">
              {buyCount}%
            </span>
            </div>
            <progress class="progress w-full {buyCount >= 50 ? '[&::-webkit-progress-value]:bg-[#10DB06] [&::-moz-progress-bar]:bg-[#10DB06]'  : '[&::-webkit-progress-value]:bg-[#FF2F1F] [&::-moz-progress-bar]:bg-[#FF2F1F]'}" value={buyCount} max="100"></progress>
        </div>
      </div>

      <div class="shadow-lg bg-[#09090B] w-full rounded-lg p-4 mb-5  flex flex-row items-center">
        <div class="flex flex-col -mt-2 w-full">
            <div class="flex flex-row items-center w-full">
                <span class="text-white text-md font-medium text-start mb-2 mr-auto mt-2">
                  Hold
                </span>
            <span class="text-white text-md font-medium ml-auto">
              {holdCount}%
            </span>
            </div>
            <progress class="progress w-full {holdCount >= 50 ? '[&::-webkit-progress-value]:bg-[#10DB06] [&::-moz-progress-bar]:bg-[#10DB06]'  : '[&::-webkit-progress-value]:bg-[#FF2F1F] [&::-moz-progress-bar]:bg-[#FF2F1F]'}" value={holdCount} max="100"></progress>
        </div>
      </div>

      <div class="shadow-lg bg-[#09090B] w-full rounded-lg p-4 mb-5  flex flex-row items-center">
        <div class="flex flex-col -mt-2 w-full">
            <div class="flex flex-row items-center w-full">
                <span class="text-white text-md font-medium text-start mb-2 mr-auto mt-2">
                  Sell
                </span>
            <span class="text-white text-md font-medium ml-auto">
              {sellCount}
            </div>
            <progress class="progress w-full {sellCount >= 50 ? '[&::-webkit-progress-value]:bg-[#10DB06] [&::-moz-progress-bar]:bg-[#10DB06]'  : '[&::-webkit-progress-value]:bg-[#FF2F1F] [&::-moz-progress-bar]:bg-[#FF2F1F]'}" value={sellCount} max="100"></progress>
        </div>
      </div>

    
    

     
    </div>
    {:else}
      <div class=" mt-20 flex justify-center items-center text-3xl font-bold text-slate-700 mb-20 m-auto">
        No data available
      </div>
    {/if}

  </div>
  </div>
<!--End Mobile Analyst Card-->
  
