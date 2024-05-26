<script lang='ts'>
  import { assetType, stockTicker, etfTicker, displayCompanyName} from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";
  import InfoModal from '$lib/components/InfoModal.svelte';
  import { LayerCake, Html } from 'layercake';
  import Circle from '$lib/components/Circle/Circle.html.svelte';

  export let optionsDict = {};
  export let data;

  let deactivateContent = data?.user?.tier === 'Pro' ? false : true;


function changeStatement(event)
{
  displayTimePeriod = event.target.value;
}
  
function allValuesZero(obj) {
    return Object?.values(obj)?.every(value => value === 0);
}


  let displayTimePeriod = 'oneMonth'
  let signal = '';
  let callVolume;
  let putVolume;
  let dataset;

  const idKey = 'contract';
  const valueKey = 'value';
  let rawData = [];

let checkIfNotZero:boolean;


$: {
  if (displayTimePeriod && Object?.keys(optionsDict)?.length !== 0)
  {
    checkIfNotZero = false;
    rawData = [];
    try {
      dataset = optionsDict[displayTimePeriod]
    }
    catch(e) {
      dataset = {};
    }


    callVolume = dataset?.callVolume
    putVolume = dataset?.putVolume

    const totalVolume = dataset?.putVolume + dataset?.callVolume;
    const callProportion = Math.ceil((dataset.callVolume / totalVolume) * 100);
    const putProportion = 100- callProportion;

    rawData.push({ 'contract': 'calls', value: callProportion });
    rawData.push({ 'contract': 'puts', value: putProportion });
    signal = callProportion >= putProportion ? 'Bullish' : 'Bearish';
    checkIfNotZero = allValuesZero(dataset);
  }
}

</script>
    
<section class="bg-[#0F0F0F] overflow-hidden text-white h-full w-full sm:mb-10">
  <div class="flex justify-center w-full m-auto h-full overflow-hidden">
      <div class="relative flex justify-center items-center overflow-hidden w-full">
          <main class="w-full">
              <div class="w-full sm:max-w-2xl m-auto mt-5 sm:mt-0">
                  

              <div class="flex flex-row items-center">
                  <label for="optionsInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                    Latest Options Activity
                  </label>
                  <InfoModal
                    title={"Options Activity"}
                    content={`Monitor real-time unusual options activity from big instiutional traders and hedge funds of ${$displayCompanyName} with a 1-minute delay, which can significantly influence stock prices.`}
                    id={"optionsInfo"}
                  />
              </div>


              <div class="flex flex-row items-end justify-between">
                  <select class="mt-5 sm:mb-0 ml-1 w-36 select select-bordered select-sm p-0 pl-5  bg-[#2A303C]" on:change={changeStatement}>
                      <option disabled>Choose a time period</option>
                      <option disabled={deactivateContent} value="oneDay">
                        {!deactivateContent ? 'Last 24h' : 'Last 24h (Pro Only)'} 
                      </option>
                      <option disabled={deactivateContent} value="oneWeek">
                        {!deactivateContent ? 'Last Week' : 'Last Week (Pro Only)'} 
                      </option>
                      <option value="oneMonth" selected>
                        Last Month
                      </option>
                      <option value="threeMonth">Last 3 Months</option>                        
                  </select>


                <a href={$assetType === 'stock' ? `/stocks/${$stockTicker}/options` : `/etf/${$etfTicker}/options`} class="text-sm sm:text-[1rem] sm:hover:text-white text-blue-400 font-normal">Full report</a>
              </div>

            {#if !checkIfNotZero}
              <div class="flex flex-row items-center justify-center m-auto w-full h-auto mt-4">
                
                <div class="flex flex-col items-start w-full">
              
                  

                  <div class="chart-container ">
                    <LayerCake
                      padding={{ top: 0, bottom: 0, left: 0, right: 10 }}
                      data={rawData}
                    >
                      <Html>
                        <Circle
                          idKey={idKey}
                          valueKey={valueKey}
                          textStrokeWidth={-0.5}
                        />
                      </Html>
                    </LayerCake>
                  </div>


                    
                <div>
                    The Options activity signals a
                    {#if signal === 'Bullish' }
                      <span class="text-[#10DB06]">
                      <svg class="w-6 h-6 sm:w-7 sm:h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="#10db06" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"><path d="m3 17l6-6l4 4l8-8"/><path d="M17 7h4v4"/></g></svg>
                      {signal}
                      </span>
  
                      {:else if signal === 'Bearish' }
                      <span class="text-[#E57C34]">
                          <svg class="w-6 h-6 sm:w-7 sm:h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#ff2f1f" d="M244 136v64a12 12 0 0 1-12 12h-64a12 12 0 0 1 0-24h35l-67-67l-31.51 31.52a12 12 0 0 1-17 0l-72-72a12 12 0 0 1 17-17L96 127l31.51-31.52a12 12 0 0 1 17 0L220 171v-35a12 12 0 0 1 24 0Z"/></svg>
                      {signal}
                      </span>
                      {:else}
                      <span class="text-[#FF2F1F]">
                          <svg class="w-6 h-6 sm:w-7 sm:h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#e57c34" d="m22 12l-4-4v3H3v2h15v3l4-4Z"/></svg>
                          Neutral
                      </span>
                      {/if} trend.
                  </div>

                  <span class="text-[1rem] text-white">
                    In the past {displayTimePeriod ==='oneDay' ? '24h': displayTimePeriod==='oneWeek' ? 'week' : displayTimePeriod==='oneMonth' ? 'month' : 'three months'}, hedge funds and major institutional traders have bought {abbreviateNumber(callVolume)} calls and {abbreviateNumber(putVolume)} puts with an average DTE of {dataset?.avgDTE} days.
                  </span>

                </div>
                
                  

              </div>

            
              

      
              {:else} 
              <div class="flex justify-center items-center m-auto mt-16 mb-6">
                <div class="text-gray-100 text-sm sm:text-[1rem] sm:rounded-lg h-auto border border-slate-800 p-4">
                  <svg class="w-5 h-5 inline-block sm:mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#60a5fa" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                  No Options activity found
                </div>
              </div>
              {/if}
              
          </div>
      </main>
      </div>
      </div>
</section>
      
  
  
  

<style>
  /*
    The wrapper div needs to have an explicit width and height in CSS.
    It can also be a flexbox child or CSS grid element.
    The point being it needs dimensions since the <LayerCake> element will
    expand to fill it.
  */
  .chart-container {
    width: 100%;
    height: 250px;
  }
</style>
