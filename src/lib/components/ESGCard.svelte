<script lang="ts">
//import ProgressBar from 'progressbar.js';
//import { onMount } from 'svelte';
import {stockTicker, screenWidth} from '$lib/store';


export let stockDeck;

let info;
let esgScore;
let socialScore;
let environmentalScore;
let governanceScore;
let esgRiskRating;



$: {
  
  if ($stockTicker && typeof window !== 'undefined' && typeof stockDeck !== 'undefined' && stockDeck?.length !== 0)
  {
   
    info = stockDeck[0]


    esgScore = info?.esgScore !== 'n/a' ? Math.round(info?.esgScore.toFixed(1)) : 'n/a';
    socialScore = info?.socialScore !== 'n/a' ? Math.round(info?.socialScore.toFixed(1)) : 'n/a';
    environmentalScore = info?.environmentalScore !== 'n/a' ? Math.round(info?.environmentalScore.toFixed(1)) : 'n/a';
    governanceScore =  info?.governanceScore !== 'n/a' ? Math.round(info?.governanceScore.toFixed(1)) : 'n/a';
    esgRiskRating = info?.esgRiskRating;
  
    };
    /*
    if (esgRatingCircleContainer)
    {
      esgRatingAcc(esgScore/100);
    }
    */

  }


</script>







<!--Start ESG Card -->
<div class="space-y-3 lg:pt-5 hidden lg:block lg:{esgScore && esgRiskRating && environmentalScore && governanceScore !== 'n/a' ? '' : 'hidden'}">  
  <div class="sm:rounded-lg shadow-lg bg-[#000] sm:bg-[#09090B] sm:border sm:border-slate-800 h-auto sm:h-[470px] {$screenWidth < 640 ? 'w-screen pt-16' : ''} md:w-[420px] -mx-1 sm:mx-0">
   
    <!--Start Content-->
    <div class="w-auto lg:w-full p-1 flex flex-col m-auto pb-14 sm:pb-10 px-2 sm:px-0">
      <h2 class="text-start text-2xl font-semibold text-white p-3 mt-3 ml-1">
        ESG Score
      </h2>
  
        {#if esgScore && esgRiskRating &&  environmentalScore && governanceScore !== 'n/a'}
  
        <p class="text-white mb-5 ml-4 mr-1">
          Gain valuable insights into a company's sustainability by evaluating its ESG (Environmental, Social, and Governance) scores.
        </p>
  
        

        <div class="flex flex-col m-auto items-center rounded-lg w-full mb-16">

          <div class="flex flex-col items-center w-full">
            <div class="flex flex-row items-center w-11/12 mt-2 mb-2">
              <span class="text-white font-medium text-start mr-auto">
               Total
              </span>
              <span class="text-white text-md font-medium ml-auto">
                {esgScore}
              </span>
            </div>
            <progress class="progress bg-[#3B3D3F] w-11/12 {esgScore >= 50 ? '[&::-webkit-progress-value]:bg-[#10DB06] [&::-moz-progress-bar]:bg-[#10DB06]'  : '[&::-webkit-progress-value]:bg-[#FF2F1F] [&::-moz-progress-bar]:bg-[#FF2F1F]'}" value={esgScore} max="100"></progress>
          </div>



          <div class="flex flex-col items-center w-full mt-2">
            <div class="flex flex-row items-center w-11/12 mt-5 mb-2">
              <span class="text-white font-medium text-start mr-auto">
                Environment
              </span>
              <span class="text-white text-md font-medium ml-auto">
                {environmentalScore}
              </span>
            </div>
            <progress class="progress bg-[#3B3D3F] w-11/12 {environmentalScore >= 50 ? '[&::-webkit-progress-value]:bg-[#10DB06] [&::-moz-progress-bar]:bg-[#10DB06]'  : '[&::-webkit-progress-value]:bg-[#FF2F1F] [&::-moz-progress-bar]:bg-[#FF2F1F]'}" value={environmentalScore} max="100"></progress>
          </div>

          <div class="flex flex-col items-center w-full">
            <div class="flex flex-row items-center w-11/12 mt-5 mb-2">
              <span class="text-white font-medium text-start mr-auto">
                Social
              </span>
              <span class="text-white text-md font-medium ml-auto">
                {socialScore}
              </span>
            </div>
            <progress class="progress bg-[#3B3D3F] w-11/12 {socialScore >= 50 ? '[&::-webkit-progress-value]:bg-[#10DB06] [&::-moz-progress-bar]:bg-[#10DB06]'  : '[&::-webkit-progress-value]:bg-[#FF2F1F] [&::-moz-progress-bar]:bg-[#FF2F1F]'}" value={socialScore} max="100"></progress>
          </div>


          <div class="flex flex-col items-center w-full">
            <div class="flex flex-row items-center w-11/12 mt-5 mb-2">
              <span class="text-white font-medium text-start mr-auto">
                Governance
              </span>
              <span class="text-white text-md font-medium ml-auto">
                {governanceScore}
              </span>
            </div>
            <progress class="progress bg-[#3B3D3F] w-11/12 {governanceScore >= 50 ? '[&::-webkit-progress-value]:bg-[#10DB06] [&::-moz-progress-bar]:bg-[#10DB06]'  : '[&::-webkit-progress-value]:bg-[#FF2F1F] [&::-moz-progress-bar]:bg-[#FF2F1F]'}" value={governanceScore} max="100"></progress>
          </div>



        

         
        </div>
      

        {:else}
        <h2 class="mt-20 justify-center items-center text-3xl font-bold text-slate-700 mb-20 m-auto">
          No data available
        </h2>
        {/if}
        </div>
    </div>
  </div>
  
  <!--End ESG Card-->



<!--Start Mobile ESG Card-->
<div class="lg:hidden space-y-3 sm:pt-5">  
  
  <div class="bg-[#000] h-auto w-screen">
  
    <!--Start Header-->
    <div class="bg-[#27272A] w-full  p-1 flex flex-col items-center pb-5 h-auto rounded-b-[30px]">
      <h2 class="text-center m-auto text-[1.1rem] font-medium text-white mt-5">
        ESG Score
      </h2>

      <div class="flex flex-col items-center mt-10 w-full">
        <span class="text-white text-center text-md text-opacity-[0.8]">
          Gain valuable insights into a company's sustainability by evaluating its ESG (Environmental, Social, and Governance) scores.
        </span>

        <div class="flex flex-row justify-center items-center w-full mt-5">

        
        </div>
      </div>
    </div>
    <!--End Header-->

    {#if esgScore && esgRiskRating &&  environmentalScore && governanceScore !== 'n/a'}
    <div class="mt-5 flex flex-col m-auto items-center rounded-lg w-full mb-16 p-3">


      <div class="shadow-lg bg-[#27272A] w-full rounded-lg p-4 mb-5  flex flex-row items-center">
        <div class="flex flex-col -mt-2 w-full">
            <div class="flex flex-row items-center w-full">
                <span class="text-white text-md font-medium text-start mb-2 mr-auto mt-2">
                  Total
                </span>
            <span class="text-white text-md font-medium ml-auto">
              {esgScore}
            </span>
            </div>
            <progress class="progress w-full {esgScore >= 50 ? '[&::-webkit-progress-value]:bg-[#10DB06] [&::-moz-progress-bar]:bg-[#10DB06]'  : '[&::-webkit-progress-value]:bg-[#FF2F1F] [&::-moz-progress-bar]:bg-[#FF2F1F]'}" value={esgScore} max="100"></progress>
        </div>
      </div>

      <div class="shadow-lg bg-[#27272A] w-full rounded-lg p-4 mb-5  flex flex-row items-center">
        <div class="flex flex-col -mt-2 w-full">
            <div class="flex flex-row items-center w-full">
                <span class="text-white text-md font-medium text-start mb-2 mr-auto mt-2">
                  Environment
                </span>
            <span class="text-white text-md font-medium ml-auto">
              {environmentalScore}
            </span>
            </div>
            <progress class="progress w-full {environmentalScore >= 50 ? '[&::-webkit-progress-value]:bg-[#10DB06] [&::-moz-progress-bar]:bg-[#10DB06]'  : '[&::-webkit-progress-value]:bg-[#FF2F1F] [&::-moz-progress-bar]:bg-[#FF2F1F]'}" value={environmentalScore} max="100"></progress>
        </div>
      </div>

      <div class="shadow-lg bg-[#27272A] w-full rounded-lg p-4 mb-5  flex flex-row items-center">
        <div class="flex flex-col -mt-2 w-full">
            <div class="flex flex-row items-center w-full">
                <span class="text-white text-md font-medium text-start mb-2 mr-auto mt-2">
                  Social
                </span>
            <span class="text-white text-md font-medium ml-auto">
              {socialScore}
            </div>
            <progress class="progress w-full {socialScore >= 50 ? '[&::-webkit-progress-value]:bg-[#10DB06] [&::-moz-progress-bar]:bg-[#10DB06]'  : '[&::-webkit-progress-value]:bg-[#FF2F1F] [&::-moz-progress-bar]:bg-[#FF2F1F]'}" value={socialScore} max="100"></progress>
        </div>
      </div>

      <div class="shadow-lg bg-[#27272A] w-full rounded-lg p-4 mb-5  flex flex-row items-center">
        <div class="flex flex-col -mt-2 w-full">
            <div class="flex flex-row items-center w-full">
                <span class="text-white text-md font-medium text-start mb-2 mr-auto mt-2">
                  Governance
                </span>
            <span class="text-white text-md font-medium ml-auto">
              {governanceScore}
            </div>
            <progress class="progress w-full {governanceScore >= 50 ? '[&::-webkit-progress-value]:bg-[#10DB06] [&::-moz-progress-bar]:bg-[#10DB06]'  : '[&::-webkit-progress-value]:bg-[#FF2F1F] [&::-moz-progress-bar]:bg-[#FF2F1F]'}" value={governanceScore} max="100"></progress>
        </div>
      </div>
    

     
    </div>
    {:else}
      <div class=" mt-20 flex justify-center items-center text-2xl font-bold text-slate-700 mb-20 m-auto">
        No data available
      </div>
    {/if}

  </div>
  </div>
<!--End Mobile ESG Card-->
  
