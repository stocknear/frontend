<script lang='ts'>

    import { Chart } from 'svelte-echarts'
    import InfoModal from '$lib/components/InfoModal.svelte';
    import {dcfComponent, stockTicker, screenWidth, getCache, setCache} from '$lib/store';
    import Lazy from 'svelte-lazy';
    
    //export let quantData;
    export let data;
    
    let fairPrice;
    let isLoaded = false;
    let lastPrice:Number;
    
    let optionsBarChart;
    
    let change:Number;

    const contentModal = `<span class="text-white">
            Discounted Cash Flow (DCF) is a core method for valuing a company's true worth. It starts by predicting the company's growth and how it affects its future cash flow.
            <br>
            <br>
            Then, it adjusts these future cash flows to their present value using a discount rate. This considers the risk associated with future cash flow predictions. Simply put, higher discount rates signal greater risk.
          </span>`
    
    
    const plotBarChart = () => {
    
    
        const options = {
            grid: {
            left: '0%',
            right: '0%',
            top: '0%',
            bottom: '0%',
            containLabel: true,
        },
        animation: $screenWidth < 640 ? false: true,
        silent: true,
        xAxis: {
            type: 'value',
            axisLabel: {
            show: false, // Hide the x-axis labels
            },
            axisLine: {
            show: false, // Hide the y-axis lines
            },
            splitLine: {
            show: false, // Hide the grid lines on the y-axis
            },
    
        },
        yAxis: {
            type: 'category',
            axisLabel: {
            show: false, // Hide the x-axis labels
            },
            axisLine: {
            show: true, // Hide the y-axis lines
            },
            splitLine: {
            show: false, // Hide the grid lines on the y-axis
            },
        },
        series: [
            {
            name: 'Current Price',
            type: 'bar',
            barWidth: $screenWidth < 640 ? '30%' : '30%',
            smooth: true,
            stack: change < 0 ? 'lastPriceStack' : '',
            data: [lastPrice],
            label: {
                show: true,
                position: 'inside',
                formatter: function (params) {
                return [
                    '{a|Current Price}',
                    '{b|' + '$' + params.value + '}',
                ].join('\n');
                },
                rich: {
                a: {
                    color: 'white',
                    fontSize: $screenWidth < 640 ? 15 : 20,
                    fontWeight: 'bold',
                },
                b: {
                    color: 'white',
                    fontSize: $screenWidth < 640 ? 24 : 30,
                    fontWeight: 'bold',
                },
                },
            },
            markLine: {
                symbol: 'none',
                label: {
                position: 'middle',
                formatter: '{b}',
                },
                lineStyle: {
                color: 'white',
                fontWeight: 'bold', // Make the mark line bold
                type: 'dashed',
                width: 2, // Increase the dashed line width
                },
                data: [{ type: 'average', name: '' }],
            },
            },
            {
            name: 'Fair Price',
            type: 'bar',
            barWidth: $screenWidth < 640 ? '30%' : '30%',
            smooth: true,
            stack: change > 0 ? 'fairPriceStack' : '',
            data: [fairPrice],
            itemStyle: {
                    color: '#2DC97E',
                },
            label: {
                show: true,
                position: lastPrice > fairPrice ? 'outside': 'inside',
                formatter: function (params) {
                return [
                    '{a|Fair Price}',
                    '{b|' + '$' + params.value + '}',
                ].join('\n');
                },
                rich: {
                a: {
                    color: 'white',
                    fontSize: $screenWidth < 640 ? 15 : 20,
                    fontWeight: 'bold',
                },
                b: {
                    color: 'white',
                    fontSize:  $screenWidth < 640 ? 24 : 30,
                    fontWeight: 'bold',
                },
                },
            },
            
            markLine: {
                symbol: 'none',
                label: {
                position: 'middle',
                formatter: '{b}',
                },
                lineStyle: {
                color: 'white',
                fontWeight: 'bold', // Make the mark line bold
                type: 'dashed',
                width: 2, // Increase the dashed line width
                },
                data: [{ type: 'average', name: '' }],
            },
            
            },
            // Add the new bar chart on top
            
            {
            name: 'Difference',
            type: 'bar',
            barWidth: '100%', // Set the width to cover the other bars
            smooth: true,
            stack: change > 0 ? 'fairPriceStack' : 'lastPriceStack', // Stack this bar on top of the others
            data: change > 0 ? [lastPrice - fairPrice] : [fairPrice - lastPrice], // Set the value to 200
            itemStyle: {
                color: '#FF2F1F',
            },
        
            },
        ],
        aria: {
            enabled: true,
                decal: {
                show: true,
                },
            },
        };
    
    
    
        return options;
    }
    
    
async function getFairPrice(ticker) {
    const cachedData = getCache(ticker, 'getFairPrice');
    if (cachedData) {
      fairPrice = cachedData;
    } else {
      try {
        const response = await fetch(data?.apiURL+'/fair-price', {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": data?.apiKey
          },
          body: JSON.stringify({ ticker })
        });
        fairPrice = await response.json();

        setCache(ticker, fairPrice, 'getFairPrice');
      } catch (error) {
        console.error('Failed to fetch swap data:', error);
        fairPrice = null;
      }
    }
    if (fairPrice !== null) {
      $dcfComponent = true;
    }
    else {
      $dcfComponent = false;
    }
  }
  

    
    
    
$: {
        
    if ($stockTicker && typeof window !== 'undefined')
    {
        isLoaded = false;
        getFairPrice($stockTicker).then(() => {

            if (fairPrice !== null) {
                lastPrice = data?.getStockQuote?.price?.toFixed(2);
                change = ( (1 - fairPrice/lastPrice ) * 100)?.toFixed(2);
                optionsBarChart = plotBarChart()
            }
       
        isLoaded = true;
        });

    }
}


    
    </script>
    
    
    
    <section class="overflow-hidden text-white h-full pb-8">
        <main class="overflow-hidden ">
        <div class="flex flex-row items-center">
            <label for="dcfInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                Discounted Cashflow Model
            </label>
            <InfoModal
                title={"Discounted Cashflow Model"}
                content={contentModal}
                id={"dcfInfo"}
            />
        </div>

                    {#if data?.user?.tier === 'Pro'}
                    {#if isLoaded}  
                    {#if fairPrice !== null}
                    
                    <div class="p-3 sm:p-0 mt-2 pb-8 sm:pb-2 rounded-lg bg-[#09090B] sm:bg-[#09090B]">

                        <div class="mt-4 text-white text-[1rem] sm:text-xl pb-4 sm:pb-0 m-auto text-start">
                            The DCF model signals a
                        
                            {#if change < -3 }
                            <span class="text-[#10DB06]">
                            <svg class="w-6 h-6 sm:w-7 sm:h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="#10db06" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"><path d="m3 17l6-6l4 4l8-8"/><path d="M17 7h4v4"/></g></svg>
                            Buy
                            </span>
        
                            {:else if change > 3 }
                            <span class="text-[#E57C34]">
                                <svg class="w-6 h-6 sm:w-7 sm:h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#ff2f1f" d="M244 136v64a12 12 0 0 1-12 12h-64a12 12 0 0 1 0-24h35l-67-67l-31.51 31.52a12 12 0 0 1-17 0l-72-72a12 12 0 0 1 17-17L96 127l31.51-31.52a12 12 0 0 1 17 0L220 171v-35a12 12 0 0 1 24 0Z"/></svg>
                            Sell
                            </span>
                            {:else}
                            <span class="text-[#FF2F1F]">
                                <svg class="w-6 h-6 sm:w-7 sm:h-7 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#e57c34" d="m22 12l-4-4v3H3v2h15v3l4-4Z"/></svg>
                                Hold
                            </span>
                            {/if}
        
                        </div>
        
                        {#if change > 0 }
                        <div class="text-white">
                            The Stock Price is
                            <span class="text-[#FF2F1F] sm:text-lg">{Math?.abs(change)}% overvalued</span>.
                        </div>
                        {:else if change < 0 }
                        <div class="text-white">
                            The Stock Price is
                            <span class="text-[#10DB06]">{Math?.abs(change)}% undervalued</span>.
                        </div>
                        {/if}
        
                        <div class="text-white text-md mt-2">
                            <span class="text-blue-400">${$stockTicker}</span> 
                            (${lastPrice}) is trading {change < 0 ? 'below' : 'above'} 
                            our estimate of fair value (${fairPrice}).
                        </div>
                
                        <br>
        
                        <div class="text-white text-md mb-10 -mt-3">
                            What is the Fair Price of <span class="font-normal text-blue-400">${$stockTicker}</span> when looking at its future cash flows? For this estimate we use a Discounted Cash Flow model (DCF).
                        </div>
                        
                        <Lazy height={300} fadeOption={{delay: 100, duration: 500}} keep={true}>
                            <div class="app w-full m-auto mb-5">
                                <Chart options={optionsBarChart} class="chart w-full" />
                            </div>
                        </Lazy>
                        
                        {#if Math?.abs(change) > 30}
                        <div class=" mb-5 text-gray-100 text-sm sm:text-[1rem] sm:rounded-lg h-auto border border-slate-800 p-4">
                            <svg class="w-5 h-5 inline-block mr-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                            Caution: The DCF model may not be reliable for <span class="text-blue-400">${$stockTicker}</span> due to significant deviation between intrinsic value and current price.
                        </div>
                        {/if}
                    </div>
    
    
        
            {/if}



            {:else}
            <div class="flex justify-center items-center h-80">
                <div class="relative">
                <label class="bg-[#09090B] rounded-xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span class="loading loading-spinner loading-md"></span>
                </label>
                </div>
            </div>
            {/if}
        
            {:else}
            <div class="shadow-lg shadow-bg-[#000] bg-[#111112] sm:bg-opacity-[0.5] text-sm sm:text-[1rem] rounded-md w-full p-4 min-h-24 mt-4 text-white m-auto flex justify-center items-center text-center font-semibold">
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
        height: 180px;
    }
    }
    
    .chart {
    width: 100%;
    }
        
    </style>