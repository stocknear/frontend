
<script lang ='ts'>
    import { displayCompanyName, stockTicker, etfTicker, cryptoTicker, assetType} from '$lib/store';
    import InfoModal from '$lib/components/InfoModal.svelte';

    export let sentimentList = [];
    export let data;
    
    let oneMonthResult;
    let outlook;

    let oneYearResult;

    let dashedLinePosition = {
        '0': '-mt-[80px]',
        '1': '-mt-[95px]',
        '2': '-mt-[105px]',
        '3': '-mt-[120px]',
        '4': '-mt-[125px]',
        '5': '-mt-[140px]',
        '6': '-mt-[152px]',
        '7': '-mt-[165px]',
        '8': '-mt-[178px]',
        '9': '-mt-[190px]',
        '10': '-mt-[200px]',
    }

$: {
    if($assetType === 'stock' ? $stockTicker : $assetType === 'etf' ? $etfTicker : $cryptoTicker && typeof window !== 'undefined' && sentimentList?.length !== 0) {
        oneMonthResult = sentimentList?.at(1)?.value;
        outlook = oneMonthResult > 5 ? 'Positive' : oneMonthResult < 5 ? 'Negative' : 'Neutral';
        oneYearResult = sentimentList?.at(-1)?.value;
    }
}
</script>
    
    
    
    <section class="overflow-hidden text-white h-full pb-10 sm:pb-0">
        <main class="overflow-hidden ">
                        
            <div class="flex flex-row items-center">
                <label for="sentimentAnalysisInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                    AI Sentiment Analysis
                </label>
                <InfoModal
                  title={"AI Sentiment Analysis"}
                  content={`We trained our AI model on over 1 million news stories and social media postings to analyze the news for various time periods and measure public opinion on  ${$displayCompanyName}`}
                  id={"sentimentAnalysisInfo"}
                />
            </div>
    
            {#if sentimentList?.length !== 0}
            

            <div class="pb-4 w-full mt-5">
                <div class="w-auto p-4 sm:p-6 bg-[#202020] sm:bg-[#0F0F0F] rounded-lg relative">
                  <h3 class="text-gray-300 font-medium text-sm uppercase mb-3">
                    Average Score
                  </h3>
                  <div class="flex flex-row items-center justify-between ">
                        <!--Start Big Circle-->
                        <div class="relative size-24 sm:size-28">
                        <svg class="size-full w-24 h-24 sm:w-28 sm:h-28" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                            <!-- Background Circle -->
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#303030]" stroke-width="3.5"></circle>
                            <!-- Progress Circle inside a group with rotation -->
                            <g class="origin-center -rotate-90 transform">
                            <circle cx="18" cy="18" r="16" fill="none" class="stroke-current {oneYearResult > 5 ? 'text-[#10DB06]' : oneYearResult < 5 ? 'text-[#FF2F1F]' : 'text-white'} text-opacity-[0.7]" stroke-width="3.5" stroke-dasharray="100" stroke-dashoffset={100-oneYearResult*10}></circle>
                            </g>
                        </svg>
                        <!--Start Inside Circle-->
                        <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                            
                            <div class="relative size-[60px] sm:size-[70px] ml-auto">
                            <svg class="size-full w-[60px] h-[60px] sm:w-[70px] sm:h-[70px]" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                                <!-- Background Circle -->
                                <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-[#303030]" stroke-width="4"></circle>
                                <!-- Progress Circle inside a group with rotation -->
                                <g class="origin-center -rotate-90 transform">
                                <circle cx="18" cy="18" r="16" fill="none" class="stroke-current {oneMonthResult > 5 ? 'text-[#10DB06]' : oneMonthResult < 5 ? 'text-[#FF2F1F]' : 'text-white'} " stroke-width="4" stroke-dasharray="100" stroke-dashoffset={100-oneMonthResult*10}></circle>
                                </g>
                            </svg>
                            <!-- Percentage Text -->
                            <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
                                <span class="text-center text-white text-xl font-semibold">
                                    {oneMonthResult}
                                </span>
                            </div>
                            </div>
                        </div>
                        <!--End Inside Circle-->
                        </div>
                        <!--End Big Circle-->
                    
                        <div class="flex flex-col items-start ml-4 sm:ml-10 mr-auto sm:-top-3 sm:relative">
                            <h3 class="hidden sm:block text-gray-300 text-[1rem] sm:text-lg font-semibold">
                                <span class="{outlook === 'Positive' ? 'text-[#10BC09]' : outlook==='Negative' ? 'text-red-500' : 'text-white'}">{outlook}</span> outlook:
                            </h3>
                            {#if oneMonthResult !== 0 && oneYearResult !== 0}
                            <span class="text-gray-200 text-sm mt-1">
                                In the past month, major news and social media rated the company {oneMonthResult > 5 ? 'positively' : oneMonthResult < 5 ? 'negatively' : 'neutral'} at {oneMonthResult} and
                                with a yearly average of {oneYearResult}.
                            </span>
                            {:else}
                            <span class="text-gray-200 text-sm mt-1">
                                Not much news coverage and discussion for {$displayCompanyName}. 
                            </span>
                            {/if}
                        </div>
                    </div>
                </div>
              </div>

              <div class="w-full">
                <div class="w-auto p-4 sm:p-6 bg-[#202020] sm:bg-[#0F0F0F] rounded-lg relative">
                    <h3 class="text-gray-300 font-medium text-sm uppercase mb-3">
                        Average Score Trend
                      </h3>
                    <div class="grid grid-cols-8 sm:grid-cols-9 -ml-2 sm:-ml-5 mt-7">
                            {#each sentimentList as item}
                            <div class="flex flex-col items-center">
                                <span class="text-white font-medium text-[1rem] mb-4">
                                    {#if data?.user?.tier === 'Pro'}
                                    {item?.value}
                                    {:else if ['1M','1Y']?.includes(item?.label)}
                                        {item?.value}
                                    {:else}
                                    <svg class="w-3.5 h-3.5 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#A3A3A3" d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"/></svg>
                                    {/if}
                                </span>
                                <div class="w-2 {item?.value === 5 ? 'bg-white' : item?.value < 5 ? 'bg-[#FF2F1F]' : 'bg-[#10DB06]' } rounded-full" style="height: 120px;">
                                    {#if data?.user?.tier === 'Pro'}
                                    <div class="bg-[#2F2F2F] w-2 rounded-t-full" style="height: {(100-item?.value*10)}%;"></div>
                                    {:else if ['1M','1Y']?.includes(item?.label)}
                                    <div class="bg-[#2F2F2F] w-2 rounded-t-full" style="height: {(100-item?.value*10)}%;"></div>
                                    {:else}
                                    <div class="bg-[#2F2F2F] w-2 rounded-t-full" style="height: {(100)}%;"></div>
                                    {/if}
                                </div>
                                <span class="text-gray-400 font-medium text-sm mt-4">
                                    {item?.label}
                                </span>
                            </div>
                            {/each}
                       
                    </div>
                    <!-- Adjusted line -->
                    <div class="sm:-ml-5 border-b absolute border-dashed border-gray-400 w-11/12 sm:w-5/6 left-1/2 transform -translate-x-1/2 {dashedLinePosition[oneMonthResult]}">
                        <div class="w-full flex justify-end mb-2">
                            <label class="text-sm font-semibold px-2 py-1.5 border rounded-full text-black {oneMonthResult === 5 ? 'bg-white border-white' : oneMonthResult < 5 ? 'bg-[#FF2F1F] border-[#FF2F1F]' : 'bg-[#10DB06] border-[#10DB06]'}">
                                Current: {oneMonthResult}
                            </label>
                        </div>
                    </div>
                
                
                </div>

                 <!-- Circular Progress -->
               

                  
                <!-- End Circular Progress -->

            </div>
            
            
            
              <!--End AI News Score-->
    
            
              
            {:else}
            <h2 class="mt-10 mb-5 flex justify-center items-center text-3xl font-bold text-slate-700 m-auto">
                No data available
                <svg class="w-10 sm:w-12 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#334155" d="M18.68 12.32a4.49 4.49 0 0 0-6.36.01a4.49 4.49 0 0 0 0 6.36a4.508 4.508 0 0 0 5.57.63L21 22.39L22.39 21l-3.09-3.11c1.13-1.77.87-4.09-.62-5.57m-1.41 4.95c-.98.98-2.56.97-3.54 0c-.97-.98-.97-2.56.01-3.54c.97-.97 2.55-.97 3.53 0c.97.98.97 2.56 0 3.54M10.9 20.1a6.527 6.527 0 0 1-1.48-2.32C6.27 17.25 4 15.76 4 14v3c0 2.21 3.58 4 8 4c-.4-.26-.77-.56-1.1-.9M4 9v3c0 1.68 2.07 3.12 5 3.7v-.2c0-.93.2-1.85.58-2.69C6.34 12.3 4 10.79 4 9m8-6C7.58 3 4 4.79 4 7c0 2 3 3.68 6.85 4h.05c1.2-1.26 2.86-2 4.6-2c.91 0 1.81.19 2.64.56A3.215 3.215 0 0 0 20 7c0-2.21-3.58-4-8-4Z"/></svg>
            </h2>
            
            {/if}
    
        </main>
    </section>
    
    
    
    
    