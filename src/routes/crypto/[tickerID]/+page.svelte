<script lang="ts">

  import {AreaSeries, Chart, PriceLine, CandlestickSeries} from 'svelte-lightweight-charts';
  
  import { TrackingModeExitMode } from 'lightweight-charts';
  import {setCache, getCache, screenWidth, displayCompanyName, numberOfUnreadNotification, globalForm, userRegion, isCrosshairMoveActive, realtimePrice, priceIncrease, currentPortfolioPrice, currentPrice, clientSideCache, cryptoTicker} from '$lib/store';
  import { onDestroy, onMount } from 'svelte';
  import CryptoKeyInformation from '$lib/components/CryptoKeyInformation.svelte';
  import Lazy from '$lib/components/Lazy.svelte';

    
  const usRegion = ['cle1','iad1','pdx1','sfo1'];
  
  let apiURL;
  userRegion?.subscribe(value => {
  if (usRegion?.includes(value)) {
    apiURL = import.meta.env.VITE_USEAST_API_URL;
  } else {
    apiURL = import.meta.env.VITE_EU_API_URL;
  }
  });
  
  
    export let data;
    export let form;
  
    let displayChartType = 'line';
  
    let cryptoProfile = data?.getStockDeck ?? [];

    let previousClose = data?.getStockQuote?.previousClose;
    let taRating = {};
    let varDict = {};

    //============================================//
    
    let chart = null;
    async function checkChart() {
      if (chart) {
        clearInterval(intervalId);
        fitContentChart();
      }
    }
  
  
  
  
  
  
  let TARating;
  let VaR;
  //let StockKeyInformation;

  //let AnalystEstimate;




onMount(async() => {  
    VaR = (await import('$lib/components/VaR.svelte')).default;

    TARating = (await import('$lib/components/TARating.svelte')).default;

  })
  
  
  
  
  //const startTimeTracking = performance.now();
  
  
  
  
  //==========================//
  
$: {
  if (output !==null)
  {
    
    //Bug value is NaN
    if (displayData === '1D')
    {
      const length = oneDayPrice?.length;
      for (let i = length - 1; i >= 0; i--) {
        if (!isNaN(oneDayPrice[i]?.close)) {
          currentDataRow = oneDayPrice[i];
          break;
        }
      }
    }
    else if (displayData === '6M') {
      currentDataRow = sixMonthPrice?.slice(-1)[0];
    }
  
    
    //currentDataRow = oneWeekPrice.slice(-1)[0]
    const change = (displayData === '1D') 
                  ? (((currentDataRow?.close ?? currentDataRow?.value)/previousClose -1 )*100)?.toFixed(2)
                  : (((currentDataRow?.close ?? currentDataRow?.value)/displayLastLogicalRangeValue -1 )*100)?.toFixed(2)

    const date = new Date(currentDataRow?.time)

  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };


    //const formattedDate = (displayData === '1D' || displayData === '1W' || displayData === '1M') ? date.toLocaleString('en-GB', options).replace(/\//g, '.') : date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
    const formattedDate = (displayData === '1D' || displayData === '1W' || displayData === '1M') 
    ? date.toLocaleString('en-US', options)
    : date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });


    displayLegend = {'close': currentDataRow?.close ?? currentDataRow?.value, 'date': formattedDate, 'change': change};



  }

}
    
  //==========================//
  
  
  $: {
    if ($cryptoTicker  && typeof window !== 'undefined') // add a check to see if running on client-side
    {
      
      if ($realtimePrice !== null)
      {
        $currentPortfolioPrice = $realtimePrice;
  
      }
      
      else if (oneDayPrice?.length !== 0)
      {
        const length = oneDayPrice?.length;
          for (let i = length - 1; i >= 0; i--) {
            if (!isNaN(oneDayPrice[i]?.close)) {
              $currentPortfolioPrice = oneDayPrice[i]?.close;
              break;
            }
          }
      }
  
    }
  
  }
  
  
  
    let displayData;
    let colorChange;
    let topColorChange;
    let bottomColorChange;
  
    let lastValue;
    async function changeData(state) {
  
      switch (state) {
        case '1D':
          displayData = '1D';
          if(oneDayPrice?.length !== 0)
          {
            displayLastLogicalRangeValue = oneDayPrice?.at(0)?.close; //previousClose
            const length = oneDayPrice?.length;
            for (let i = length - 1; i >= 0; i--) {
              if (!isNaN(oneDayPrice[i]?.close)) {
                lastValue = oneDayPrice[i]?.close;
                break;
              }
            }
  
          }
          else {
            displayLastLogicalRangeValue = null;
            lastValue = null;
  
          }
  
         
          break;
        case '1W':
          displayData = '1W';
          await historicalPrice('one-week');
          if(oneWeekPrice?.length !== 0)
          {
            displayLastLogicalRangeValue = oneWeekPrice?.at(0)?.close;
            lastValue = oneWeekPrice?.slice(-1)?.at(0)?.close;
  
          }
          else {
            displayLastLogicalRangeValue = null;
            lastValue = null;
  
          }
          
  
          break;
        case '1M':
          displayData = '1M';
          await historicalPrice('one-month');
          if(oneMonthPrice?.length !== 0)
          {
            displayLastLogicalRangeValue = oneMonthPrice?.at(0)?.close;
            lastValue = oneMonthPrice.slice(-1)?.at(0)?.close;
  
          }
          else {
            displayLastLogicalRangeValue = null;
            lastValue = null;
  
          }
          break;
  
        case '6M':
          displayData = '6M';
          await historicalPrice('six-months');
          if(sixMonthPrice?.length !== 0)
          {
            displayLastLogicalRangeValue = sixMonthPrice?.at(0)?.close;
            lastValue = sixMonthPrice?.slice(-1)?.at(0)?.close;
  
          }
          else {
            displayLastLogicalRangeValue = null;
            lastValue = null;
  
          }
          break;
        case '1Y':
          displayData = '1Y';
          await historicalPrice('one-year');
          if(oneYearPrice?.length !== 0)
          {
            displayLastLogicalRangeValue = oneYearPrice?.at(0)?.close;
            lastValue = oneYearPrice.slice(-1)?.at(0)?.close;
          }
          else {
            displayLastLogicalRangeValue = null;
            lastValue = null;
          }
          
          break;
        case 'MAX':
          displayData = 'MAX';
          await historicalPrice('max');
          if(threeYearPrice?.length !== 0)
          {
            displayLastLogicalRangeValue = threeYearPrice?.at(0)?.close;
            lastValue = threeYearPrice.slice(-1)?.at(0)?.close;
  
          }
          else {
            displayLastLogicalRangeValue = null;
            lastValue = null;
  
          }
         
          break;
        default:
          return;
      }
      colorChange = lastValue < displayLastLogicalRangeValue ? "#FF2F1F" : "#10DB06";
      topColorChange = lastValue < displayLastLogicalRangeValue ? "rgb(255, 47, 31, 0.2)" : "rgb(16, 219, 6, 0.2)";
      bottomColorChange = lastValue < displayLastLogicalRangeValue ? "rgb(255, 47, 31, 0.001)" : "rgb(16, 219, 6, 0.001)";
      
      fitContentChart();
      
  
      //trackButtonClick('Time Period: '+ state)
    }
  
    
  
  let output = null;
  
  
  //====================================//
  
  
  
  let intervalId = null;
  let oneDayPrice = [];
  let oneWeekPrice = [];
  let oneMonthPrice = [];
  let sixMonthPrice = [];
  
  let oneYearPrice = [];
  let threeYearPrice = [];
  
  
  
  async function historicalPrice(timePeriod:string) {
  
  const cachedData = getCache($cryptoTicker, 'historicalPrice'+timePeriod);
    if (cachedData) {
      switch (timePeriod) {
          case 'one-week':
              oneWeekPrice = cachedData
              break;
          case 'one-month':
              oneMonthPrice = cachedData
              break;
          case 'six-months':
              sixMonthPrice = cachedData
              break;
          case 'one-year':
              oneYearPrice = cachedData
              break;
          case 'max':
              threeYearPrice = cachedData
              break;
          default:
              console.log(`Unsupported time period: ${timePeriod}`);
      }
  } else {
    output = null;

      const postData = {
        ticker: $cryptoTicker,
        timePeriod: timePeriod,
      };

      const response = await fetch(apiURL+'/historical-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });

      output = await response?.json() ?? [];

      const mapData = (data) => data?.map(({ time, open, high, low, close }) => ({ 
          time: Date.parse(time), 
          open, 
          high, 
          low, 
          close 
      }));

    const mappedData = mapData(output);
    try {
        switch (timePeriod) {
            case 'one-week':
                oneWeekPrice = mappedData
                break;
            case 'one-month':
                oneMonthPrice = mappedData
                break;
            case 'six-months':
                sixMonthPrice = mappedData
                break;
            case 'one-year':
                oneYearPrice = mappedData
                break;
            case 'max':
                threeYearPrice = mappedData
                break;
            default:
                console.log(`Unsupported time period: ${timePeriod}`);
        }
        setCache($cryptoTicker, mappedData, 'historicalPrice'+timePeriod);

    } catch (e) {
        console.log(e);
    }

  }  
}


  async function initializePrice() {
  
    output = null;
    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(checkChart, 0);
    try {

    output = [...data?.getOneDayPrice] ?? [];
    oneDayPrice = output?.map(item => ({ time: Date.parse(item?.time), open: item?.open !== null ? item?.open : NaN, high: item?.high !== null ? item?.high : NaN, low: item?.low !== null ? item?.low : NaN, close: item?.close !== null ? item?.close : NaN}));
      
  
      displayData = oneDayPrice?.length  === 0 && sixMonthPrice?.length !== 0 ? '6M' : '1D';
        //lastValue = oneDayPrice[oneDayPrice?.length - 1]?.value;
        if (displayData === '1D')
        {
          const length = oneDayPrice?.length;
          for (let i = length - 1; i >= 0; i--) {
            if (!isNaN(oneDayPrice[i]?.close)) {
              lastValue = oneDayPrice[i]?.close;
              break;
            }
          }
        }
        else if (displayData === '6M') {
          lastValue = sixMonthPrice?.slice(-1)?.at(0)?.close
        }
        
  
        displayLastLogicalRangeValue = oneDayPrice?.length  === 0 && sixMonthPrice?.length !== 0 ? sixMonthPrice?.at(0)?.close : oneDayPrice?.at(0)?.close //previousClose;
  
        //colorChange = lastValue < displayLastLogicalRangeValue ? "#CC3636" : "#367E18";
        
        colorChange = lastValue < displayLastLogicalRangeValue ? "#FF2F1F" : "#10DB06";
        topColorChange = lastValue < displayLastLogicalRangeValue ? "rgb(255, 47, 31, 0.2)" : "rgb(16, 219, 6, 0.2)";
        bottomColorChange = lastValue < displayLastLogicalRangeValue ? "rgb(255, 47, 31, 0.001)" : "rgb(16, 219, 6, 0.001)";
      } catch(e) {
        console.log(e)
      }
  };
  

  
      let currentDataRow = {'value': '-', 'date': '-'};
  
      let lineLegend = null;
      let displayLegend = {'close': '-', 'date': '-'};
  
  
  
    
      function handleSeriesReference(ref) {
        try {
          lineLegend = ref;
        }
        catch (error)
        {
          console.log(error);
        }
  
          
      };
  
  
  
      async function handleCrosshairMove({detail: param}) {
        
        if (param?.time && !isNaN(param?.seriesData?.get(lineLegend)?.close ?? param?.seriesData?.get(lineLegend)?.value)) 
        { 
          $isCrosshairMoveActive = true;
          try {
            let graphData;
              graphData = param?.seriesData?.get(lineLegend);
  
              const price = graphData?.close ?? graphData?.value
              const dateObj = graphData?.time
              const date = new Date(dateObj);
  
              
              const options = {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              };
              
              //const formattedDate = (displayData === '1D' || displayData === '1W' || displayData === '1M') ? date.toLocaleString('en-GB', options).replace(/\//g, '.') : date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })?.replace(/\//g, '.');
              
              const formattedDate = (displayData === '1D' || displayData === '1W' || displayData === '1M') 
              ? date.toLocaleString('en-US', options)
              : date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });


              const change = ((price/displayLastLogicalRangeValue -1 )*100)?.toFixed(2);
  
  
              displayLegend = {"close": price?.toFixed(2), 'date': formattedDate, 'change': change};
  
           
  
          }
  
          catch(error)
          {
              //pass;
          }
            
        }
      else
        {
  
          //currentDataRow = oneDayPrice[oneDayPrice?.length - 1];
          const length = oneDayPrice?.length;
          for (let i = length - 1; i >= 0; i--) {
            if (!isNaN(oneDayPrice[i]?.close )) {
              currentDataRow = oneDayPrice[i];
              break;
            }
          }
     
  
        }
        
      };
  
  
  
    
    let displayLastLogicalRangeValue; 
    
      
      const fitContentChart = async () => {
  
        if(displayData === '1Y' && oneYearPrice?.length === 0)
        {
  
        }
        else if (chart !== null && typeof window !== 'undefined') {
  
          chart?.timeScale().fitContent();
  
          chart?.applyOptions({
            trackingMode: {
              exitMode: TrackingModeExitMode.OnTouchEnd
            },
          });
  
        }
       
  
        
      };
  
    
  
  
  
      let width = 580;
      //Initial height of graph
      let height = 350;
  
      let observer;
      let ref;
  
      ref = (element) => {
          if (observer) {
              observer?.disconnect();
          }
          if (!element) {
              return;
          }
          
          observer = new ResizeObserver(([entry]) => {
              width = entry.contentRect.width;
              height = entry.contentRect.height;
          });
          observer.observe(element);
      }
  
  
  
      //===============================================//
      
  
  
  
  
  
  
  const options = {
    width: width,
    height: height,
    layout: {
      background: {
        color: '#0F0F0F',
      },
    
    },
    grid: {
      vertLines: {
        color: '#0F0F0F',
        visible: false,
      },
      horzLines: {
        color: '#0F0F0F',
        visible: false,
      },
    },
    crosshair: {
      // hide the horizontal crosshair line
      horzLine: {
        visible: false,
        labelVisible: false,
      },
      // hide the vertical crosshair label
      vertLine: {
        labelVisible: false,
        style: 0,
      },
    },
    rightPriceScale: {
      visible: false,
      borderColor: 'rgba(197, 203, 206, 0.8)',
    },
    leftPriceScale: {
      visible: false,
      borderColor: 'rgba(197, 203, 206, 0.8)',
    },
    handleScale: {
      mouseWheel: false,
    },
    handleScroll: {
      mouseWheel: false,
      horzTouchDrag: false,
      vertTouchDrag: false,
      pressedMouseMove: false,
    },
    timeScale: {
      borderColor: '#FFFFFF',
      textColor: '#FFFFFF',
      visible: false,
      fixLeftEdge: true,
      fixRightEdge: true,
    },
  };
  
  
  
  onDestroy(async() => {
    $priceIncrease = null;
    $globalForm = [];
  })
  
function changeChartType() {
    if(displayChartType === 'line') {
      displayChartType = 'candlestick';
    }
    else {
      displayChartType = 'line';
    }
}
  let dowloadData = false;
  $: {
  
    if ($cryptoTicker  && typeof window !== 'undefined') // add a check to see if running on client-side
    {
      $realtimePrice = null;
      dowloadData = false;
      oneDayPrice = [];
      oneWeekPrice = [];
      oneMonthPrice = [];
      oneYearPrice = [];
      threeYearPrice = [];
      taRating = {};
      varDict={}
      output = null;
  
  
      cryptoProfile = data?.getCryptoProfile;
      previousClose = data?.getStockQuote?.previousClose;
      taRating = data?.getStockTARating;
      varDict = data?.getVaR;

      const asyncFunctions = [];

  
      Promise.all(asyncFunctions)
          .then((results) => {
            initializePrice()
          })
          .catch((error) => {
            console.error('An error occurred:', error);
          });


    }

  }
/*
afterUpdate(async () => {
  if ($cryptoTicker  && typeof window !== 'undefined' && dowloadData === false) {
    dowloadData = true;
    await initializePrice()

  }
})

*/

  $: {
    if(form)
    {
      $globalForm = form;
    }
  }
  
  
  </script>
  
  <svelte:head>
  
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>
      {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {$displayCompanyName} ({$cryptoTicker}) Stock Price, Quote & News · stocknear
    </title>
  
    <meta name="description" content={`Get a real-time ${$displayCompanyName} (${$cryptoTicker}) stock price quote with breaking news, financials, statistics, charts and more.`}>
    <!-- Other meta tags -->
    <meta property="og:title" content={`${$displayCompanyName} (${$cryptoTicker}) Stock Price, Quote & News · stocknear`}/>
    <meta property="og:description" content={`Get a real-time ${$displayCompanyName} (${$cryptoTicker}) stock price quote with breaking news, financials, statistics, charts and more.`} />
    <!--<meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>-->
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->
  
    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content={`${$displayCompanyName} (${$cryptoTicker}) Stock Price, Quote & News · stocknear`}/>
    <meta name="twitter:description" content={`Get a real-time ${$displayCompanyName} (${$cryptoTicker}) stock price quote with breaking news, financials, statistics, charts and more.`} />
    <!--<meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>-->
    <!-- Add more Twitter meta tags as needed -->
  
  </svelte:head>
    
  
  <section class="bg-[#0F0F0F] min-h-screen pb-40">
  
              <div class="w-full max-w-3xl m-auto ">
  
          
                    <div class="md:flex md:justify-between md:divide-x md:divide-slate-800">
                        <!-- Main content -->
                        <div class="pb-12 md:pb-20 w-full max-w-2xl sm:pr-6 xl:pr-0">
                          <div class="xl:pr-10">
  
      
                                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                                  <!-- svelte-ignore a11y-label-has-associated-control -->
                                  
                                
                                    <div class="flex flex-row items-start w-full sm:pl-6 mt-4">
                                      <div class="flex flex-col items-start justify-start w-full" >
                                      
                                      <div class="text-2xl md:text-3xl font-bold text-white flex flex-row items-center w-full">
                                          {#if $isCrosshairMoveActive }
                                          ${displayLegend?.close}
                                          {:else if !$isCrosshairMoveActive && $realtimePrice !== null}
                                          ${$realtimePrice}
                                          {:else}
                                          ${displayLegend?.close}
                                          
                                          {/if}
                                            
                                          {#if $priceIncrease === true}
                                          <div style="background-color: green;" class="inline-block pulse rounded-full w-3 h-3 ml-2" ></div>
                                          {:else if $priceIncrease === false}
                                          <div style="background-color: red;" class="inline-block pulse rounded-full w-3 h-3 ml-2" ></div>
                                          {/if}

                                      </div>  

                                      
                                        
      
                                      <div class="flex flex-row items-center w-full">
                                        
                                        {#if displayLegend?.change >= 0}
                                        <svg class="inline-block w-5 h-5 mt-0.5 -mr-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                                        <span class="items-center justify-start text-[#10DB06] font-medium text-xs sm:text-sm">+{displayLegend?.change}%</span> 
                                        {:else if displayLegend?.change < 0}
                                        <svg class="inline-block w-5 h-5 mt-0.5 -mr-0.5 rotate-180"  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                                        <span class="items-center justify-start text-[#FF2F1F] font-medium text-xs sm:text-sm">{displayLegend?.change}% </span> 
                                        {/if}

                                        <span class="ml-3 text-white text-xs sm:text-sm">{displayLegend?.date}</span>
                                        

                                      
                                      </div>

                                      </div>

                                
                                </div>
                                <!-----End-Header-CandleChart-Indicators------>
                                   <!--Start Time Interval-->
                                   <div class="hidden sm:flex flex-row items-center pl-1 sm:pl-6 w-full mt-4">
                                    <div class="flex flex-col items-center mr-4">
                                    <button on:click={() => changeData('1D')} class="text-sm font-medium text-gray-400 {displayData === '1D' ? 'text-white ' : 'bg-[#0F0F0F]'}">
                                        1D
                                    </button>
                                    <div class="{displayData === '1D' ? `bg-[${colorChange}]` : 'bg-[#0F0F0F]'} mt-1 h-[3px] w-[1.5rem] rounded-full" />
                                    </div>
                                    <div class="flex flex-col items-center mr-4">
                                    <button on:click={() => (changeData('1W'))} class="w-full text-sm font-medium text-gray-400 {displayData === '1W' ? 'text-white ' : 'bg-[#0F0F0F]'}">
                                        1W
                                    </button>
                                    <div class="{displayData === '1W' ? `bg-[${colorChange}]` : 'bg-[#0F0F0F]'} mt-1 h-[3px] w-[1.5rem]" />
                                    </div>
                                    <div class="flex flex-col items-center mr-4">
                                    <button on:click={() => (changeData('1M'))} class="text-sm font-medium text-gray-400 {displayData === '1M' ? 'text-white ' : 'bg-[#0F0F0F]'}">
                                        1M
                                    </button>
                                    <div class="{displayData === '1M' ? `bg-[${colorChange}]` : 'bg-[#0F0F0F]'} mt-1 h-[3px] w-[1.5rem]" />
                                    </div>
                                    <div class="flex flex-col items-center mr-4">
                                    <button on:click={() => changeData('6M')} class="text-sm font-medium text-gray-400 {displayData === '6M' ? 'text-white ' : 'bg-[#0F0F0F]'}">
                                        6M
                                    </button>
                                    <div class="{displayData === '6M' ? `bg-[${colorChange}]` : 'bg-[#0F0F0F]'} mt-1 h-[3px] w-[1.5rem]" />
                                    </div>
                                  <div class="flex flex-col items-center mr-4">
                                    <button on:click={() => changeData('1Y')} class="text-sm font-medium text-gray-400 {displayData === '1Y' ? 'text-white ' : 'bg-[#0F0F0F]'}">
                                        1Y
                                    </button>
                                    <div class="{displayData === '1Y' ? `bg-[${colorChange}]` : 'bg-[#0F0F0F]'} mt-1 h-[3px] w-[1.5rem]" />
                                  </div>
                                  
                                  <div class="flex flex-col items-center mr-4">
                                    <button on:click={() => changeData('MAX')} class="text-sm font-medium text-gray-400 {displayData === 'MAX' ? 'text-white ' : 'bg-[#0F0F0F]'}">
                                        MAX
                                    </button>
                                    <div class="{displayData === 'MAX' ? `bg-[${colorChange}]` : 'bg-[#0F0F0F]'} mt-1 h-[3px] w-[1.5rem]" />
                                  
                                  </div>


  
                                  <label on:click={changeChartType} class="ml-auto -mt-3 block cursor-pointer bg-[#202020] sm:hover:bg-[#202020] duratiion-100 transition ease-in-out px-3 py-1 rounded-lg shadow-sm">
                                    {#if displayChartType === 'line'}
                                      <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M7 20v-2H5V6h2V4h2v2h2v12H9v2zm8 0v-5h-2V8h2V4h2v4h2v7h-2v5z"/></svg>
                                      {:else}
                                      <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 16.5L9 10l4 6l8-9.5"/></svg>
                                      {/if}
                                </label>
                                  
                                </div>
                                  <!--End Time Interval-->
                                
                                  <!--End Ticker Section-->
                                <!-- Start Graph -->
  
                                {#if output !== null}
                                  <div class ="w-full sm:pl-7 ml-auto max-w-3xl mb-10">
                                    {#if displayData === '1D' && oneDayPrice?.length === 0}
                                    <h2 class=" mt-20 flex h-[240px] justify-center items-center text-3xl font-bold text-slate-700 mb-20 m-auto">
                                      No data available
                                    </h2>
                                    {:else if displayData === '1W' && oneWeekPrice?.length === 0}
                                    <h2 class=" mt-20 flex h-[240px] justify-center items-center text-3xl font-bold text-slate-700 mb-20 m-auto">
                                      No data available
                                    </h2>
                                    {:else if displayData === '1M' && oneMonthPrice?.length === 0}
                                    <h2 class=" mt-20 flex h-[240px] justify-center items-center text-3xl font-bold text-slate-700 mb-20 m-auto">
                                      No data available
                                    </h2>
                                    {:else if displayData === '6M' && sixMonthPrice?.length === 0}
                                    <h2 class=" mt-20 flex h-[240px] justify-center items-center text-3xl font-bold text-slate-700 mb-20 m-auto">
                                      No data available
                                    </h2>
                                    {:else if displayData === '1Y' && oneYearPrice?.length === 0}
                                    <h2 class=" mt-20 flex h-[240px] justify-center items-center text-3xl font-bold text-slate-700 mb-20 m-auto">
                                      No data available
                                    </h2>
                                    {:else if displayData === 'MAX' && threeYearPrice?.length === 0}
                                    <h2 class=" mt-20 flex h-[240px] justify-center items-center text-3xl font-bold text-slate-700 mb-20 m-auto">
                                      No data available
                                    </h2>
                                    {:else}
  
                                    <Chart {...options} autoSize={true} ref={(ref) => chart = ref} on:crosshairMove={handleCrosshairMove} >
                                    
                                    {#if displayData === '1D'}
                                      {#if displayChartType === 'line'}
                                      <AreaSeries 
                                        data={oneDayPrice?.map(({ time, close }) => ({ time, value: close }))}
                                        lineWidth={1.5}
                                        priceScaleId="left"
                                        lineColor={colorChange}
                                        topColor={topColorChange}
                                        bottomColor={bottomColorChange}
                                        crosshairMarkerVisible={false}
                                        ref={handleSeriesReference}
                                        priceLineVisible= {false}
                                        lastPriceAnimation={1}
                                        >
                                        <PriceLine
                                          price={oneDayPrice?.at(0)?.close}
                                          lineWidth = {1}
                                          color="#fff"
                                        />
                                      </AreaSeries>
                                      {:else}
                                      <CandlestickSeries
                                          data={oneDayPrice}
                                          crosshairMarkerVisible={false}
                                          ref={handleSeriesReference}
                                          priceLineVisible= {false}
                                          >
                                        <PriceLine
                                          price={oneDayPrice?.at(0)?.close}
                                          lineWidth = {1}
                                          color="#fff"
                                        />
                                    </CandlestickSeries>
                                      {/if}
                                      {:else if displayData === '1W'}
                                      {#if displayChartType === 'line'}
                                      <AreaSeries 
                                        data={oneWeekPrice?.map(({ time, close }) => ({ time, value: close }))}
                                        lineWidth={1.5}
                                        priceScaleId="left"
                                        lineColor={colorChange}
                                        topColor={topColorChange}
                                        bottomColor={bottomColorChange}
                                        crosshairMarkerVisible={false}
                                        ref={handleSeriesReference}
                                        priceLineVisible= {false}
                                        lastPriceAnimation={1}
                                        >
                                        <PriceLine
                                          price={oneWeekPrice?.at(0)?.close}
                                          lineWidth = {1}
                                          color="#fff"
                                        />
                                      </AreaSeries>
                                      {:else}
                                      <CandlestickSeries
                                          data={oneWeekPrice}
                                          crosshairMarkerVisible={false}
                                          ref={handleSeriesReference}
                                          priceLineVisible= {false}
                                          >
                                        <PriceLine
                                          price={oneWeekPrice?.at(0)?.close}
                                          lineWidth = {1}
                                          color="#fff"
                                        />
                                    </CandlestickSeries>
                                      {/if}
  
                                      {:else if displayData === '1M'}
                                      {#if displayChartType === 'line'}
                                      <AreaSeries 
                                        data={oneMonthPrice?.map(({ time, close }) => ({ time, value: close }))}
                                        lineWidth={1.5}
                                        priceScaleId="left"
                                        lineColor={colorChange}
                                        topColor={topColorChange}
                                        bottomColor={bottomColorChange}
                                        crosshairMarkerVisible={false}
                                        ref={handleSeriesReference}
                                        priceLineVisible= {false}
                                        lastPriceAnimation={1}
                                        >
                                        <PriceLine
                                          price={oneMonthPrice?.at(0)?.close}
                                          lineWidth = {1}
                                          color="#fff"
                                        />
                                      </AreaSeries>
                                      {:else}
                                      <CandlestickSeries
                                          data={oneMonthPrice}
                                          crosshairMarkerVisible={false}
                                          ref={handleSeriesReference}
                                          priceLineVisible= {false}
                                          >
                                        <PriceLine
                                          price={oneMonthPrice?.at(0)?.close}
                                          lineWidth = {1}
                                          color="#fff"
                                        />
                                    </CandlestickSeries>
                                      {/if}
  
  
                                      {:else if displayData === '6M'}
                                      {#if displayChartType === 'line'}
                                      <AreaSeries 
                                      data={sixMonthPrice?.map(({ time, close }) => ({ time, value: close }))}
                                        lineWidth={1.5}
                                        priceScaleId="left"
                                        lineColor={colorChange}
                                        topColor={topColorChange}
                                        bottomColor={bottomColorChange}
                                        crosshairMarkerVisible={false}
                                        ref={handleSeriesReference}
                                        priceLineVisible= {false}
                                        lastPriceAnimation={1}
                                        >
                                        <PriceLine
                                          price={sixMonthPrice?.at(0)?.close}
                                          lineWidth = {1}
                                          color="#fff"
                                        />
                                      </AreaSeries>
                                      {:else}
                                      <CandlestickSeries
                                          data={sixMonthPrice}
                                          crosshairMarkerVisible={false}
                                          ref={handleSeriesReference}
                                          priceLineVisible= {false}
                                          >
                                        <PriceLine
                                          price={sixMonthPrice?.at(0)?.close}
                                          lineWidth = {1}
                                          color="#fff"
                                        />
                                    </CandlestickSeries>
                                      {/if}
  
  
  
                                      {:else if displayData === '1Y'}
                                      {#if displayChartType === 'line'}
                                      <AreaSeries 
                                      data={oneYearPrice?.map(({ time, close }) => ({ time, value: close }))}
                                        lineWidth={1.5}
                                        priceScaleId="left"
                                        lineColor={colorChange}
                                        topColor={topColorChange}
                                        bottomColor={bottomColorChange}
                                        crosshairMarkerVisible={false}
                                        ref={handleSeriesReference}
                                        priceLineVisible= {false}
                                        lastPriceAnimation={1}
                                        >
                                        <PriceLine
                                          price={oneYearPrice?.at(0)?.close}
                                          lineWidth = {1}
                                          color="#fff"
                                        />
                                      </AreaSeries>
                                      {:else}
                                      <CandlestickSeries
                                          data={oneYearPrice}
                                          crosshairMarkerVisible={false}
                                          ref={handleSeriesReference}
                                          priceLineVisible= {false}
                                          >
                                        <PriceLine
                                          price={oneYearPrice?.at(0)?.close}
                                          lineWidth = {1}
                                          color="#fff"
                                        />
                                    </CandlestickSeries>
                                      {/if}
  
  
  
                                      {:else if displayData === 'MAX'}
                                      {#if displayChartType === 'line'}
                                      <AreaSeries 
                                        data={threeYearPrice?.map(({ time, close }) => ({ time, value: close }))}
                                        lineWidth={1.5}
                                        priceScaleId="left"
                                        lineColor={colorChange}
                                        topColor={topColorChange}
                                        bottomColor={bottomColorChange}
                                        crosshairMarkerVisible={false}
                                        ref={handleSeriesReference}
                                        priceLineVisible= {false}
                                        lastPriceAnimation={1}
                                        >
                                        <PriceLine
                                          price={threeYearPrice?.at(0)?.close}
                                          lineWidth = {1}
                                          color="#fff"
                                        />
                                      </AreaSeries>
                                      {:else}
                                      <CandlestickSeries
                                          data={threeYearPrice}
                                          crosshairMarkerVisible={false}
                                          ref={handleSeriesReference}
                                          priceLineVisible= {false}
                                          >
                                        <PriceLine
                                          price={threeYearPrice?.at(0)?.close}
                                          lineWidth = {1}
                                          color="#fff"
                                        />
                                    </CandlestickSeries>
                                      {/if}
  
  
                                    {/if}
                                    </Chart>
                                    {/if}
  
                                  </div>
                                  {:else}
                                  <!-- else output not loaded yet-->
                                      <div class="flex justify-center w-full sm:w-[650px] h-80 sm:w-[600px] items-center">
                                        <div class="relative">
                                          <label class="bg-[#202020] rounded-xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                            <span class="loading loading-spinner loading-md"></span>
                                          </label>
                                      </div>  
                                    </div>
                                  {/if}
                                  
                                  <!--End Graph-->
  
                                    <!--Start Time Interval-->
                                    <div class="pl-1 w-screen sm:hidden flex flex-row items-center">
                                    <div class="flex flex-col items-center mr-4">
                                    <button on:click={() => changeData('1D')} class="text-sm font-medium text-gray-400 {displayData === '1D' ? 'text-white ' : 'bg-[#0F0F0F]'}">
                                        1D
                                    </button>
                                    <div class="{displayData === '1D' ? `bg-[${colorChange}]` : 'bg-[#0F0F0F]'} mt-1 h-[3px] w-[1.5rem] rounded-full" />
                                    </div>
                                    <div class="flex flex-col items-center mr-4">
                                    <button on:click={() => (changeData('1W'))} class="w-full text-sm font-medium text-gray-400 {displayData === '1W' ? 'text-white ' : 'bg-[#0F0F0F]'}">
                                        1W
                                    </button>
                                    <div class="{displayData === '1W' ? `bg-[${colorChange}]` : 'bg-[#0F0F0F]'} mt-1 h-[3px] w-[1.5rem]" />
                                    </div>
                                    <div class="flex flex-col items-center mr-4">
                                    <button on:click={() => (changeData('1M'))} class="text-sm font-medium text-gray-400 {displayData === '1M' ? 'text-white ' : 'bg-[#0F0F0F]'}">
                                        1M
                                    </button>
                                    <div class="{displayData === '1M' ? `bg-[${colorChange}]` : 'bg-[#0F0F0F]'} mt-1 h-[3px] w-[1.5rem]" />
                                    </div>
                                    <div class="flex flex-col items-center mr-4">
                                    <button on:click={() => changeData('6M')} class="text-sm font-medium text-gray-400 {displayData === '6M' ? 'text-white ' : 'bg-[#0F0F0F]'}">
                                        6M
                                    </button>
                                    <div class="{displayData === '6M' ? `bg-[${colorChange}]` : 'bg-[#0F0F0F]'} mt-1 h-[3px] w-[1.5rem]" />
                                    </div>
                                  <div class="flex flex-col items-center mr-4">
                                    <button on:click={() => changeData('1Y')} class="text-sm font-medium text-gray-400 {displayData === '1Y' ? 'text-white ' : 'bg-[#0F0F0F]'}">
                                        1Y
                                    </button>
                                    <div class="{displayData === '1Y' ? `bg-[${colorChange}]` : 'bg-[#0F0F0F]'} mt-1 h-[3px] w-[1.5rem]" />
                                  </div>
                                  
                                  <div class="flex flex-col items-center mr-4">
                                    <button on:click={() => changeData('MAX')} class="text-sm font-medium text-gray-400 {displayData === 'MAX' ? 'text-white ' : 'bg-[#0F0F0F]'}">
                                        MAX
                                    </button>
                                    <div class="{displayData === 'MAX' ? `bg-[${colorChange}]` : 'bg-[#0F0F0F]'} mt-1 h-[3px] w-[1.5rem]" />
                                  </div>

                                  <label on:click={changeChartType} class="ml-auto mr-5 -mt-1 sm:hidden border border-slate-800 px-2.5 py-1 rounded-xl">
                                    {#if displayChartType === 'line'}
                                      <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M7 20v-2H5V6h2V4h2v2h2v12H9v2zm8 0v-5h-2V8h2V4h2v4h2v7h-2v5z"/></svg>
                                      {:else}
                                      <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 16.5L9 10l4 6l8-9.5"/></svg>
                                      {/if}
                                  </label>
                                    
                                    </div>
                                    <!--End Time Interval-->


                                    {#if CryptoKeyInformation && $screenWidth <=1022} <!--BUG: Dont remove since when changing ETF symbol display freezes-->
                                    <div class="w-full mt-8  m-auto sm:p-6">
                                      <label class="cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                                        Key Information
                                      </label>
                                      <CryptoKeyInformation 
                                        cryptoProfile={cryptoProfile}
                                      />
      
                                    </div>
                                    {/if}

                               

             

                                
                                <Lazy>
                                  <div class="w-full mt-10 sm:mt-5 m-auto sm:pl-6 sm:pb-6 sm:pt-6">
                                  {#await import('$lib/components/PriceAnalysis.svelte') then {default: Comp}}
                                    <svelte:component this={Comp} data={data} />
                                  {/await}
                                </div>
                                </Lazy>

                                <Lazy>
                                  <div class="w-full mt-10 sm:mt-5 m-auto sm:pl-6 sm:pb-6 sm:pt-6">
                                  {#await import('$lib/components/TrendAnalysis.svelte') then {default: Comp}}
                                    <svelte:component this={Comp} data={data} />
                                  {/await}
                                </div>
                                </Lazy>

                                <Lazy>
                                  <div class="w-full mt-10 sm:mt-5 m-auto sm:pl-6 sm:pb-6 sm:pt-6">
                                  {#await import('$lib/components/SentimentAnalysis.svelte') then {default: Comp}}
                                    <svelte:component this={Comp} data={data} />
                                  {/await}
                                </div>
                                </Lazy>
                                {#if VaR}
                                <div class="w-full sm:mt-5 m-auto sm:pl-6 sm:pb-6 sm:pt-6 {Object?.keys(varDict)?.length !== 0  ? '' : 'hidden'}">
                                  <VaR data={data} varDict={varDict}/>
                                </div>
                                {/if}
                                
                    
                                 
  
                                <div class="w-full pt-10 m-auto sm:pl-6 sm:pb-6 sm:pt-6 rounded-2xl {Object?.keys(taRating)?.length !== 0 ? '' : 'hidden'} ">
                                    {#if TARating}
                                    <TARating taRating = {data?.getStockTARating}/>
                                    {/if}
                                </div>
                            
  
  
  
              
  

    
                      
  
                            </div>
          </div>
    </div>
  </section>
  
  
  
  
  
  
  <!--End-Indicator-Modal-->
  
  
  <style lang='scss'>
     
  
  canvas {
    width: 100%;
    height: 100%;
    max-width: 800px;
    max-height: 450px;
  }
  
  .pulse {
    position: relative;
    animation: pulse-animation 1s forwards cubic-bezier(0.5, 0, 0.5, 1);
  }
  
  @keyframes pulse-animation {
    0% {
      transform: scale(0.9);
      opacity: 1;
    }
    100% {
      transform: scale(0.9);
      opacity: 0;
    }
  }
  
  
  :root {
    --date-picker-background: #0F0F0F;
    --date-picker-foreground: #f7f7f7;
  }
  
  
  
  </style>