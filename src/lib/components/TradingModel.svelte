<script lang='ts'>

import InfoModal from '$lib/components/InfoModal.svelte';

export let modelStats = {};
let showFullStats = false;

</script>
    
    
    
<section class="overflow-hidden">
                            
        <main>
          {#if Object?.keys(modelStats)?.length !== 0}

          <div class="flex flex-row items-center">
            <label for="tradingModelInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-medium">
              Trading Algorithm
            </label>
            <InfoModal
              title={"Trading Algorithm"}
              content={`The AI Trading Model uses historical data and technical indicators to generate optimal buy and sell signals for maximizing profits.`}
              id={"tradingModelInfo"}
            />
          </div>

            <div class="text-white text-[1rem] sm:text-lg mt-3 mb-8 text-start">
                The Algorithm signals a
                {#if modelStats['nextSignal'] === 'Buy'}
                <span class="text-[#10DB06] sm:font-medium">
                  <svg class="w-7 h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="#10db06" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"><path d="m3 17l6-6l4 4l8-8"/><path d="M17 7h4v4"/></g></svg>
                  {modelStats['nextSignal']}
                </span>

                {:else if modelStats['nextSignal'] === 'Hold'}
                <span class="text-[#E57C34] sm:font-medium">
                  <svg class="w-7 h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#e57c34" d="m22 12l-4-4v3H3v2h15v3l4-4Z"/></svg>
                  {modelStats['nextSignal']}.
                </span>
                {:else}
                <span class="text-[#FF2F1F] sm:font-medium">
                  <svg class="w-7 h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#ff2f1f" d="M244 136v64a12 12 0 0 1-12 12h-64a12 12 0 0 1 0-24h35l-67-67l-31.51 31.52a12 12 0 0 1-17 0l-72-72a12 12 0 0 1 17-17L96 127l31.51-31.52a12 12 0 0 1 17 0L220 171v-35a12 12 0 0 1 24 0Z"/></svg>
                  {modelStats['nextSignal']}.
                </span>
                {/if}
                <br>
                <span class="text-gray-300 text-xs sm:text-sm italic">
                  For past performance on historical data see Backtesting result.
                </span>
              </div>

              <div class="flex flex-col items-start">
                
                <div class="flex flex-row items-center">
                  <label for="backtestingInfo" class="cursor-pointer flex flex-row items-center text-gray-200 text-lg sm:text-lg font-medium">
                    Backtesting
                  </label>
                  <InfoModal
                    title={"Backtesting"}
                    content={`Backtesting is the process of evaluating the performance of a trading strategy by applying it to historical market data to see how it would have performed in the past.`}
                    id={"backtestingInfo"}
                  />
                  </div>

                
              </div>
              

              <table class="table table-pin-rows table-sm table-compact mt-3 mb-5">
                <tbody>
                  <!-- row 1 -->
                  <tr class="text-white ">
                    <td class="text-start bg-[#0F0F0F] border-b border-[#0F0F0F] text-xs sm:text-sm sm:font-medium">
                      Total Return
                    </td>
                    <td class="tex-white bg-[#0F0F0F] border-b border-[#0F0F0F] sm:font-medium">
                      <div class="flex flex-row items-center ">
                        {#if modelStats['Return [%]'] >= 0}
                        <span class="text-[#10DB06] text-xs sm:text-[0.95rem]">+{modelStats['Return [%]']?.toFixed(2)} %</span>
                        {:else if modelStats['Return [%]'] < 0}
                        <span class="text-[#FF2F1F] text-xs sm:text-[0.95rem]">{modelStats['Return [%]']?.toFixed(2)} %</span>
                        {:else}
                        <span class="text-gray-300 text-xs sm:text-sm m-auto pr-2">n/a</span>
                        {/if}
                      </div>
                    </td>
                    <td class="text-start text-white border-b border-[#0F0F0F] bg-[#0F0F0F] text-xs sm:text-sm sm:font-medium">
                      Buy & Hold Return
                    </td>
                    <td class="text-white bg-[#0F0F0F] border-b border-[#0F0F0F] text-xs sm:text-sm sm:font-medium">
                      <div class="flex flex-row items-center ">
                        {#if modelStats['Buy & Hold Return [%]'] >= 0}
                        <span class="text-[#10DB06] text-xs sm:text-[0.95rem]">+{modelStats['Buy & Hold Return [%]']?.toFixed(2)} %</span>
                        {:else if modelStats['Buy & Hold Return [%]'] < 0}
                        <span class="text-[#FF2F1F] text-xs sm:text-[0.95rem]">{modelStats['Buy & Hold Return [%]']?.toFixed(2)} %</span>
                        {:else}
                        <span class="text-gray-300 text-xs sm:text-sm m-auto pr-2">n/a</span>
                        {/if}
                      </div>
                    </td>
                  </tr>
                  <tr class="text-white {!showFullStats ? 'opacity-[0.50]' : ''}">
                    <td class="text-start bg-[#0F0F0F] border-b border-[#0F0F0F] text-xs sm:text-sm sm:font-medium">
                      Win Rate
                    </td>
                    <td class="tex-white bg-[#0F0F0F] border-b border-[#0F0F0F] text-xs sm:text-sm sm:font-medium">
                      <div class="flex flex-row items-center ">
                        {#if modelStats['Win Rate [%]'] >= 0}
                        <span class="text-[#10DB06] text-xs sm:text-[0.95rem]">+{modelStats['Win Rate [%]']?.toFixed(2)} %</span>
                        {:else if modelStats['Win Rate [%]'] < 0}
                        <span class="text-[#FF2F1F] text-xs sm:text-[0.95rem]">{modelStats['Win Rate [%]']?.toFixed(2)} %</span>
                        {:else}
                        <span class="text-gray-300 text-xs sm:text-sm m-auto pr-2">n/a</span>
                        {/if}
                      </div>
                    </td>
                    <td class="text-start text-white bg-[#0F0F0F] border-b border-[#0F0F0F] text-xs sm:text-sm sm:font-medium">
                      Best Trade
                    </td>
                    <td class="text-white bg-[#0F0F0F] border-b border-[#0F0F0F] text-xs sm:text-sm sm:font-medium">
                      <div class="flex flex-row items-center ">
                        {#if modelStats['Best Trade [%]'] >= 0}
                        <span class="text-[#10DB06] text-xs sm:text-[0.95rem]">+{modelStats['Best Trade [%]']?.toFixed(2)} %</span>
                        {:else if modelStats['Best Trade [%]'] < 0}
                        <span class="text-[#FF2F1F] text-xs sm:text-[0.95rem]">{modelStats['Best Trade [%]']?.toFixed(2)} %</span>
                        {:else}
                        <span class="text-gray-300 text-xs sm:text-[0.95rem] m-auto pr-2">n/a</span>
                        {/if}
                      </div>
                    </td>
                  </tr>
                  {#if showFullStats}
                  <tr class="text-white">
                    <td class="text-start bg-[#0F0F0F] border-b border-[#0F0F0F] text-xs sm:text-sm sm:font-medium">
                      Avg. Trade
                    </td>
                    <td class="tex-white bg-[#0F0F0F] border-b border-[#0F0F0F] text-xs sm:text-sm sm:font-medium">
                      <div class="flex flex-row items-center ">
                        {#if modelStats['Avg. Trade [%]'] >= 0}
                        <span class="text-[#10DB06] text-xs sm:text-[0.95rem]">+{modelStats['Avg. Trade [%]']?.toFixed(2)} %</span>
                        {:else if modelStats['Avg. Trade [%]'] < 0}
                        <span class="text-[#FF2F1F] text-xs sm:text-[0.95rem]">{modelStats['Avg. Trade [%]']?.toFixed(2)} %</span>
                        {:else}
                        <span class="text-gray-300 text-xs sm:text-sm m-auto pr-2">n/a</span>
                        {/if}
                      </div>
                    </td>
                    <td class="text-start text-white border-b border-[#0F0F0F] text-xs sm:text-sm bg-[#0F0F0F] sm:font-medium">
                      Worst Trade
                    </td>
                    <td class="text-white bg-[#0F0F0F] border-b border-[#0F0F0F] text-xs sm:text-sm sm:font-medium">
                      <div class="flex flex-row items-center ">
                        {#if modelStats['Worst Trade [%]'] >= 0}
                        <span class="text-[#10DB06] text-xs sm:text-[0.95rem]">+{modelStats['Worst Trade [%]']?.toFixed(2)} %</span>
                        {:else if modelStats['Worst Trade [%]'] < 0}
                        <span class="text-[#FF2F1F] text-xs sm:text-[0.95rem]">{modelStats['Worst Trade [%]']?.toFixed(2)} %</span>
                        {:else}
                        <span class="text-gray-300 text-xs sm:text-[0.95rem] m-auto pr-2">n/a</span>
                        {/if}
                      </div>
                    </td>
                  </tr>
                  <tr class="text-white">
                    <td class="text-start bg-[#0F0F0F] border-b border-[#0F0F0F] text-xs sm:text-sm sm:font-medium">
                      Avg. Drawdown
                    </td>
                    <td class="tex-white bg-[#0F0F0F] border-b border-[#0F0F0F] text-xs sm:text-sm sm:font-medium">
                      <div class="flex flex-row items-center ">
                        {#if modelStats['Avg. Drawdown [%]'] >= 0}
                        <span class="text-[#10DB06] text-xs sm:text-[0.95rem]">+{modelStats['Avg. Drawdown [%]']?.toFixed(2)} %</span>
                        {:else if modelStats['Avg. Drawdown [%]'] < 0}
                        <span class="text-[#FF2F1F] text-xs sm:text-[0.95rem]">{modelStats['Avg. Drawdown [%]']?.toFixed(2)} %</span>
                        {:else}
                        <span class="text-gray-300 text-xs sm:text-[0.95rem] m-auto pr-2">n/a</span>
                        {/if}
                      </div>
                    </td>
                    <td class="text-start text-white border-b border-[#0F0F0F] text-xs sm:text-sm bg-[#0F0F0F] sm:font-medium">
                      Max. Drawdown
                    </td>
                    <td class="text-white bg-[#0F0F0F] border-b border-[#0F0F0F] text-xs sm:text-sm sm:font-medium">
                      <div class="flex flex-row items-center ">
                        {#if modelStats['Max. Drawdown [%]'] >= 0}
                        <span class="text-[#10DB06] text-xs sm:text-[0.95rem]">+{modelStats['Max. Drawdown [%]']?.toFixed(2)} %</span>
                        {:else if modelStats['Max. Drawdown [%]'] < 0}
                        <span class="text-[#FF2F1F] text-xs sm:text-[0.95rem]">{modelStats['Max. Drawdown [%]']?.toFixed(2)} %</span>
                        {:else}
                        <span class="text-gray-300 text-xs sm:text-[0.95rem] m-auto pr-2">n/a</span>
                        {/if}
                      </div>
                    </td>
                  </tr>
                  <tr class="text-white">
                    <td class="text-start text-xs border-b border-[#0F0F0F] sm:text-sm bg-[#0F0F0F] sm:font-medium">
                      Number of Trades
                    </td>
                    <td class="tex-white bg-[#0F0F0F] border-b border-[#0F0F0F] text-xs sm:text-[0.95rem] sm:font-medium">{modelStats['# Trades']} </td>
                    <td class="text-start text-xs border-b border-[#0F0F0F] sm:text-sm text-white bg-[#0F0F0F] sm:font-medium">
                      Profit Factor
                    </td>
                    <td class="text-white bg-[#0F0F0F] border-b border-[#0F0F0F] text-xs sm:text-[0.95rem] sm:font-medium">{modelStats['Profit Factor']?.toFixed(2)} </td>
                  </tr>
                  <tr class="text-white">
                    <td class="text-start bg-[#0F0F0F] border-b border-[#0F0F0F] text-xs sm:text-sm sm:font-medium">
                      Sharpe Ratio
                    </td>
                    <td class="tex-white bg-[#0F0F0F] border-b border-[#0F0F0F] text-xs sm:text-[0.95rem] sm:font-medium">{modelStats['Sharpe Ratio']?.toFixed(2)} </td>
                    <td class="text-start text-xs sm:text-sm text-white bg-[#0F0F0F] sm:font-medium">
                      Sortino Ratio
                    </td>
                    <td class="text-white bg-[#0F0F0F] border-b border-[#0F0F0F] text-xs sm:text-[0.95rem] sm:font-medium">{modelStats['Sortino Ratio']?.toFixed(2)} </td>
                  </tr>
                  {/if}
                
                </tbody>
              </table>

              <span class="{!showFullStats ? 'hidden' : ''} text-start italic text-xs sm:text-sm text-gray-200 mr-auto pt-10">
                Time Period between {new Date(modelStats['Start'])?.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })} 
                - 
                {new Date(modelStats['End'])?.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
              </span>

              <label on:click={() => showFullStats = !showFullStats} class="cursor-pointer flex justify-center items-center mt-5">
                <svg class="w-10 h-10 transform {showFullStats ? 'rotate-180' : ''} " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#2A323C" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 13.5L7.5 11l1.42-1.41L12 12.67l3.08-3.08L16.5 11L12 15.5z"/></svg>
                </label>

            {:else}
            <h2 class="mt-10 mb-5 flex justify-center items-center text-3xl sm:font-medium text-slate-700 m-auto">
              No data available
              <svg class="ml-2 w-10 sm:w-12 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#334155" d="M18.68 12.32a4.49 4.49 0 0 0-6.36.01a4.49 4.49 0 0 0 0 6.36a4.508 4.508 0 0 0 5.57.63L21 22.39L22.39 21l-3.09-3.11c1.13-1.77.87-4.09-.62-5.57m-1.41 4.95c-.98.98-2.56.97-3.54 0c-.97-.98-.97-2.56.01-3.54c.97-.97 2.55-.97 3.53 0c.97.98.97 2.56 0 3.54M10.9 20.1a6.527 6.527 0 0 1-1.48-2.32C6.27 17.25 4 15.76 4 14v3c0 2.21 3.58 4 8 4c-.4-.26-.77-.56-1.1-.9M4 9v3c0 1.68 2.07 3.12 5 3.7v-.2c0-.93.2-1.85.58-2.69C6.34 12.3 4 10.79 4 9m8-6C7.58 3 4 4.79 4 7c0 2 3 3.68 6.85 4h.05c1.2-1.26 2.86-2 4.6-2c.91 0 1.81.19 2.64.56A3.215 3.215 0 0 0 20 7c0-2.21-3.58-4-8-4Z"/></svg>
            </h2>
            {/if}
        </main>
</section>



  

  

