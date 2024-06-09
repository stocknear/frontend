<script lang="ts">

  import {AreaSeries, Chart, PriceLine, CandlestickSeries} from 'svelte-lightweight-charts';
  
    import { TrackingModeExitMode } from 'lightweight-charts';
    import {trendAnalysisComponent, priceAnalysisComponent, assetType, screenWidth, globalForm, userRegion, numberOfUnreadNotification, displayCompanyName, isCrosshairMoveActive, realtimePrice, priceIncrease, currentPortfolioPrice, currentPrice, clientSideCache, etfTicker, isOpen,  isBeforeMarketOpen, isWeekend} from '$lib/store';
    import { onDestroy, onMount } from 'svelte';    
    import ETFKeyInformation from '$lib/components/ETFKeyInformation.svelte';
    import Lazy from '$lib/components/Lazy.svelte';

    export let data;
    export let form;
  
  $assetType = 'etf';
  const usRegion = ['cle1','iad1','pdx1','sfo1'];
    
  let apiURL;
  userRegion?.subscribe(value => {
  if (usRegion?.includes(value)) {
    apiURL = import.meta.env.VITE_USEAST_API_URL;
  } else {
    apiURL = import.meta.env.VITE_EU_API_URL;
  }
  });
    
    
      let isLoaded = false;
      
      let geographicList = [];
      let sectorList = [];
      let etfProfile = [];
      let correlationList = [];
      let topHoldingList = [];
      let dividendList = [];
      let similarTicker = []
      let prePostData = {};
      let optionsDict = {};
      let taRating = {};
      let varDict = {};

      let previousClose = data?.getStockQuote?.previousClose;
      //============================================//
      
    
    
      let chart = null;
      let displayChartType = 'line';
  
      async function checkChart() {
        if (chart) {
          clearInterval(intervalId);
          fitContentChart();
        }
      }
    
    
    
    
    let TARating;
  //let PricePredictionCard;
  //let TradingModel;
    let Correlation;
    let CountrySegmentation;
    let SectorSegmentation;
    let OptionsData;
    let WIIM;
    let VaR;
    //let ETFKeyInformation;
    
    
  onMount(async() => {  

    WIIM = (await import('$lib/components/WIIM.svelte')).default;
    VaR = (await import('$lib/components/VaR.svelte')).default;
    OptionsData = (await import('$lib/components/OptionsData.svelte')).default;
    TARating = (await import('$lib/components/TARating.svelte')).default;
    //PricePredictionCard = (await import('$lib/components/PricePredictionCard.svelte')).default;
    //TradingModel = (await import('$lib/components/TradingModel.svelte')).default;    
    Correlation = (await import('$lib/components/Correlation.svelte')).default;
    CountrySegmentation = (await import('$lib/components/CountrySegmentation.svelte')).default;
    SectorSegmentation = (await import('$lib/components/SectorSegmentation.svelte')).default;
      //ShareHolders = (await import('$lib/components/ShareHolders.svelte')).default;
      /*
      if ($screenWidth < 640) {
        ETFKeyInformation = (await import('$lib/components/ETFKeyInformation.svelte')).default;
      }
      */
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
              if (!isNaN(oneDayPrice[i]?.close ?? oneDayPrice[i]?.value)) {
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
  
    
          const date = new Date(currentDataRow?.time);
    
      
          const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          };
    
          //const formattedDate = ( displayData === '1W' || displayData === '1M' ) ? date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric',hour: '2-digit', minute: '2-digit' }).replace(/\//g, '.') : date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
          
          const formattedDate = (displayData === '1D' || displayData === '1W' || displayData === '1M') ? date.toLocaleString('en-GB', options).replace(/\//g, '.') : date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
          
    
    
    
          displayLegend = {'close':  (currentDataRow?.close ?? currentDataRow?.value) , 'date': formattedDate, 'change': change};
    
    
        }
    
      }
      
    //==========================//
    
    
    $: {
      if ($etfTicker  && typeof window !== 'undefined') // add a check to see if running on client-side
      {
        
        if ($realtimePrice !== null)
        {
          $currentPortfolioPrice = $realtimePrice;
    
        }
        
        else if (oneDayPrice?.length !== 0)
        {
          const length = oneDayPrice.length;
            for (let i = length - 1; i >= 0; i--) {
              if (!isNaN(oneDayPrice[i]?.close ?? oneDayPrice[i]?.value)) {
                $currentPortfolioPrice = oneDayPrice[i]?.close ?? oneDayPrice[i]?.value;
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
              displayLastLogicalRangeValue = (oneDayPrice?.at(0)?.close ?? oneDayPrice?.at(0)?.value) //previousClose;
              const length = oneDayPrice.length;
              for (let i = length - 1; i >= 0; i--) {
                if (!isNaN(oneDayPrice[i]?.close ?? oneDayPrice[i]?.value)) {
                  lastValue = oneDayPrice[i]?.close ?? oneDayPrice[i]?.value;
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
            if(oneWeekPrice?.length !== 0)
            {
              displayLastLogicalRangeValue = oneWeekPrice?.at(0)?.close ?? oneWeekPrice?.at(0)?.value;
              lastValue = oneWeekPrice.slice(-1)?.at(0)?.close ?? oneWeekPrice.slice(-1)?.at(0)?.value;
    
            }
            else {
              displayLastLogicalRangeValue = null;
              lastValue = null;
    
            }
            
    
            break;
          case '1M':
            displayData = '1M';
            if(oneMonthPrice?.length !== 0)
            {
              displayLastLogicalRangeValue = oneMonthPrice?.at(0)?.close ?? oneMonthPrice?.at(0)?.value;
              lastValue = oneMonthPrice.slice(-1)?.at(0)?.close ?? oneMonthPrice.slice(-1)?.at(0)?.value;
    
            }
            else {
              displayLastLogicalRangeValue = null;
              lastValue = null;
    
            }
            break;
    
          case '6M':
            displayData = '6M';
            if(sixMonthPrice?.length !== 0)
            {
              displayLastLogicalRangeValue = sixMonthPrice?.at(0)?.close ?? sixMonthPrice?.at(0)?.value;
              lastValue = sixMonthPrice.slice(-1)?.at(0)?.close ?? sixMonthPrice.slice(-1)?.at(0)?.value;
    
            }
            else {
              displayLastLogicalRangeValue = null;
              lastValue = null;
    
            }
            break;
          case '1Y':
            displayData = '1Y';
            if(oneYearPrice?.length !== 0)
            {
              displayLastLogicalRangeValue = oneYearPrice?.at(0)?.close ?? oneYearPrice?.at(0)?.value;
              lastValue = oneYearPrice.slice(-1)?.at(0)?.close ?? oneYearPrice.slice(-1)?.at(0)?.value;
            }
            else {
              displayLastLogicalRangeValue = null;
              lastValue = null;
            }
            
            break;
          case 'MAX':
            displayData = 'MAX';
            if(threeYearPrice?.length !== 0)
            {
              displayLastLogicalRangeValue = threeYearPrice?.at(0)?.close ?? threeYearPrice?.at(0)?.value;
              lastValue = threeYearPrice.slice(-1)?.at(0)?.close ?? threeYearPrice.slice(-1)?.at(0)?.value;
    
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
    let pastPriceList = [];
    
    
    
    async function getHistoricalPrice() {
    
    
    if($clientSideCache[$etfTicker]?.getHistoricalPrice)
    {
      pastPriceList = $clientSideCache[$etfTicker]?.getHistoricalPrice;
    }
    else {
      const postData = { ticker: $etfTicker};
      const response = await fetch(apiURL+'/historical-price', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
      });
    
      pastPriceList =  await response.json();
      $clientSideCache[$etfTicker].getHistoricalPrice = pastPriceList;
    }
    
      
    if(displayChartType === 'line') {
      oneWeekPrice = pastPriceList['1W']?.map(({ time, close }) => ({ time: Date.parse(time), value: close }));
      oneMonthPrice = pastPriceList['1M']?.map(({ time, close }) => ({ time: Date.parse(time), value: close }));
      sixMonthPrice = pastPriceList['6M']?.map(({ time, close }) => ({ time: Date.parse(time), value: close }));
      oneYearPrice = pastPriceList['1Y']?.map(({ time, close }) => ({ time: Date.parse(time), value: close }));
      threeYearPrice = pastPriceList['MAX']?.map(({ time, close }) => ({ time: Date.parse(time), value: close }));
    }
    else if (displayChartType === 'candlestick') {
      oneWeekPrice = pastPriceList['1W']?.map(({ time, open,high,low,close }) => ({ time: Date.parse(time), open,high,low,close }));
      oneMonthPrice = pastPriceList['1M']?.map(({ time, open,high,low,close }) => ({ time: Date.parse(time), open,high,low,close }));
      sixMonthPrice = pastPriceList['6M']?.map(({ time, open,high,low,close }) => ({ time: Date.parse(time), open,high,low,close }));
      oneYearPrice = pastPriceList['1Y']?.map(({ time, open,high,low,close }) => ({ time: Date.parse(time), open,high,low,close }));
      threeYearPrice = pastPriceList['MAX']?.map(({ time, open,high,low,close }) => ({ time: Date.parse(time), open,high,low,close }));
    
    }
      
    };
    
    
    
    async function getOneDayPrice() {
    
      output = null;
      if (intervalId) {
          clearInterval(intervalId);
      }
      intervalId = setInterval(checkChart, 0);
    
    
      if($clientSideCache[$etfTicker]?.getOneDayPrice)
      {
        output = $clientSideCache[$etfTicker]?.getOneDayPrice;
      }
      else {
        const postData = { ticker: $etfTicker};
        const response = await fetch(apiURL+'/one-day-price', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
        });
    
        output = await response.json();
        $clientSideCache[$etfTicker].getOneDayPrice = output;
      }
            
      if(displayChartType === 'line') {
      oneDayPrice = output?.map(({ time, close }) => ({ time: Date.parse(time), value: close }));
      oneDayPrice = oneDayPrice?.map(item => ({ time: item?.time, value: item?.value !== null ? item?.value : NaN }));
      }
      else if (displayChartType === 'candlestick') {
        oneDayPrice = output?.map(({ time, open,high,low,close }) => ({ time: Date.parse(time), open,high,low,close }));
        oneDayPrice = oneDayPrice?.map(item => ({ time: item?.time, open: item?.open !== null ? item?.open : NaN, high: item?.high !== null ? item?.high : NaN, low: item?.low !== null ? item?.low : NaN, close: item?.close !== null ? item?.close : NaN}));
      }
    
    
    
        displayData = oneDayPrice?.length  === 0 && sixMonthPrice?.length !== 0 ? '6M' : '1D';
          //lastValue = oneDayPrice[oneDayPrice.length - 1]?.value;
          if (displayData === '1D')
          {
            const length = oneDayPrice.length;
            for (let i = length - 1; i >= 0; i--) {
              if (!isNaN(oneDayPrice[i]?.close ?? oneDayPrice[i]?.value)) {
                lastValue = oneDayPrice[i]?.close ?? oneDayPrice[i]?.value;
                break;
              }
            }
          }
          else if (displayData === '6M') {
            lastValue = sixMonthPrice?.slice(-1)?.at(0)?.value;
          }
          
    
          displayLastLogicalRangeValue = oneDayPrice?.length  === 0 && sixMonthPrice?.length !== 0 ? (sixMonthPrice?.at(0)?.close ?? sixMonthPrice?.at(0)?.value) : (oneDayPrice?.at(0)?.close ?? oneDayPrice?.at(0)?.value) //previousClose;
    
          //colorChange = lastValue < displayLastLogicalRangeValue ? "#CC3636" : "#367E18";
          
          colorChange = lastValue < displayLastLogicalRangeValue ? "#FF2F1F" : "#10DB06";
          topColorChange = lastValue < displayLastLogicalRangeValue ? "rgb(255, 47, 31, 0.2)" : "rgb(16, 219, 6, 0.2)";
          bottomColorChange = lastValue < displayLastLogicalRangeValue ? "rgb(255, 47, 31, 0.001)" : "rgb(16, 219, 6, 0.001)";
      
    };
    
    
    
    
    
    
    
  async function getPrePostQuote() {
  
  if(!$isOpen) {
    const postData = { ticker: $etfTicker};
      const response = await fetch(apiURL+'/pre-post-quote', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
      });
  
      prePostData = await response.json();
  
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
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              };
  
              //const formattedDate = ( displayData === '1W' || displayData === '1M' ) ? date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric',hour: '2-digit', minute: '2-digit' }).replace(/\//g, '.') : date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
              
              const formattedDate = (displayData === '1D' || displayData === '1W' || displayData === '1M') ? date.toLocaleString('en-GB', options).replace(/\//g, '.') : date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })?.replace(/\//g, '.');
              
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
            if (!isNaN(oneDayPrice[i]?.close ?? oneDayPrice[i]?.value )) {
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
          else if (chart !== null) {
    
            chart?.timeScale().fitContent();
    
            chart?.applyOptions({
              trackingMode: {
                exitMode: TrackingModeExitMode.OnTouchEnd
              },
            });
    
          }
         
    
          
        };
    
      
    
        let width = 500;
        //Initial height of graph
        let height = 350;
    
        let observer;
        let ref;
    
        ref = (element) => {
            if (observer) {
                observer.disconnect();
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
    })
    
  function changeChartType() {
    if(displayChartType === 'line') {
      displayChartType = 'candlestick';
    }
    else {
      displayChartType = 'line';
    }
  }
  
    $: {
    
      if ($etfTicker  && typeof window !== 'undefined') // add a check to see if running on client-side
      {
    
        isLoaded = false;
        oneDayPrice = [];
        oneWeekPrice = [];
        oneMonthPrice = [];
        oneYearPrice = [];
        threeYearPrice = [];
        pastPriceList = [];
    
        geographicList = [];
        sectorList = [];
        correlationList = [];
        prePostData = {};
        taRating = {};
        varDict = {};
        output = null;
  
        
        geographicList = data?.getCountryWeighting;
        sectorList = data?.getETFProfile[0]?.sectorsList;
        sectorList = sectorList?.sort(function(a,b) {
          return b?.exposure - a?.exposure;
        })
        etfProfile = data?.getETFProfile;
        correlationList = data?.getCorrelation?.correlation;
  
        topHoldingList = data?.getETFHoldings;
        dividendList = data?.getStockDividend;
        similarTicker = data?.getSimilarETFs;
        optionsDict = data?.getOptionsData;
        previousClose = data?.getStockQuote?.previousClose
        taRating = data?.getStockTARating;
        varDict = data?.getVaR;
  
        //stockDeck = data?.getStockDeckData;
        
    
        const asyncFunctions = [
          getHistoricalPrice(),
          getOneDayPrice(),
          getPrePostQuote(),
        ];
    
        Promise.all(asyncFunctions)
            .then((results) => {
  
              isLoaded = true;
            })
            .catch((error) => {
              console.error('An error occurred:', error);
            });
    
    
            
      }
    
    }
    $: {
    if($etfTicker && displayChartType && output !== null && pastPriceList?.length !== 0 && typeof window !== 'undefined')
    {
      if(displayChartType === 'line') {
      oneDayPrice = output?.map(({ time, close }) => ({ time: Date.parse(time), value: close }));
      oneDayPrice = oneDayPrice?.map(item => ({ time: item?.time, value: item?.value !== null ? item?.value : NaN }));
      oneWeekPrice = pastPriceList['1W']?.map(({ time, close }) => ({ time: Date.parse(time), value: close }));
      oneMonthPrice = pastPriceList['1M']?.map(({ time, close }) => ({ time: Date.parse(time), value: close }));
      sixMonthPrice = pastPriceList['6M']?.map(({ time, close }) => ({ time: Date.parse(time), value: close }));
      oneYearPrice = pastPriceList['1Y']?.map(({ time, close }) => ({ time: Date.parse(time), value: close }));
      threeYearPrice = pastPriceList['MAX']?.map(({ time, close }) => ({ time: Date.parse(time), value: close }));
  
      }
      else if (displayChartType === 'candlestick') {
        oneDayPrice = output?.map(({ time, open,high,low,close }) => ({ time: Date.parse(time), open,high,low,close }));
        oneDayPrice = oneDayPrice?.map(item => ({ time: item?.time, open: item?.open !== null ? item?.open : NaN, high: item?.high !== null ? item?.high : NaN, low: item?.low !== null ? item?.low : NaN, close: item?.close !== null ? item?.close : NaN}));
        oneWeekPrice = pastPriceList['1W']?.map(({ time, open,high,low,close }) => ({ time: Date.parse(time), open,high,low,close }));
        oneMonthPrice = pastPriceList['1M']?.map(({ time, open,high,low,close }) => ({ time: Date.parse(time), open,high,low,close }));
        sixMonthPrice = pastPriceList['6M']?.map(({ time, open,high,low,close }) => ({ time: Date.parse(time), open,high,low,close }));
        oneYearPrice = pastPriceList['1Y']?.map(({ time, open,high,low,close }) => ({ time: Date.parse(time), open,high,low,close }));
        threeYearPrice = pastPriceList['MAX']?.map(({ time, open,high,low,close }) => ({ time: Date.parse(time), open,high,low,close }));
      }
    }
  }
    
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
  {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {$displayCompanyName} ({$etfTicker}) Stock Price, Quote & News · stocknear
</title>

<meta name="description" content={`Get a real-time ${$displayCompanyName} (${$etfTicker}) stock price quote with breaking news, financials, statistics, charts and more.`}>
<!-- Other meta tags -->
<meta property="og:title" content={`${$displayCompanyName} (${$etfTicker}) Stock Price, Quote & News · stocknear`}/>
<meta property="og:description" content={`Get a real-time ${$displayCompanyName} (${$etfTicker}) stock price quote with breaking news, financials, statistics, charts and more.`} />
<meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`${$displayCompanyName} (${$etfTicker}) Stock Price, Quote & News · stocknear`}/>
<meta name="twitter:description" content={`Get a real-time ${$displayCompanyName} (${$etfTicker}) stock price quote with breaking news, financials, statistics, charts and more.`} />
<meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
<!-- Add more Twitter meta tags as needed -->

</svelte:head>

  
    
    <section class="bg-[#0F0F0F] min-h-screen pb-40">
      <div class="w-full xl:w-fit max-w-4xl m-auto ">
            <div class="md:flex md:justify-between md:divide-x md:divide-slate-800">
                <!-- Main content -->
                <div class="md:grow pb-12 md:pb-20 w-full max-w-2xl sm:pr-6">
                  <div class="xl:pr-10">
    
        
                                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                                    <!-- svelte-ignore a11y-label-has-associated-control -->
                                    
                                    <div class="flex flex-row items-start w-full sm:pl-6">
                                      <div class="flex flex-col items-start justify-start w-full" >
                                      
                                      <div class="text-2xl md:text-3xl font-bold text-white flex flex-row items-center w-full">
                                          {#if $isCrosshairMoveActive }
                                          {$etfTicker?.includes('.DE') || $etfTicker?.includes('.F') ? `${displayLegend?.close}€` : ` $${displayLegend?.close}`}
                                          {:else if !$isCrosshairMoveActive && $realtimePrice !== null}
                                          {$etfTicker?.includes('.DE') || $etfTicker?.includes('.F') ? `${$realtimePrice}€` : ` $${$realtimePrice}`}
                                          {:else}
                                          {$etfTicker?.includes('.DE') || $etfTicker?.includes('.F') ? `${displayLegend?.close}€` : ` $${displayLegend?.close}`}
                                          
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
                                      
                                      {#if Object?.keys(prePostData)?.length !== 0 && prePostData?.price !== 0}
                                      <div class="ml-auto flex flex-col justify-end items-end ">
                                        <div class="flex flex-row items-center justify-end">
                                        <span class="text-white text-2xl font-bold">
                                          ${prePostData?.price}
                                        </span>
                                        {#if prePostData?.changesPercentage >= 0}
                                        <span class="ml-1 items-center justify-start text-[#10DB06] font-medium text-xs sm:text-sm">({prePostData?.changesPercentage}%)</span> 
                                        {:else if prePostData?.changesPercentage < 0}
                                        <span class="ml-1 items-center justify-start text-[#FF2F1F] font-medium text-xs sm:text-sm">({prePostData?.changesPercentage}%)</span> 
                                        {/if}
                                        </div>
                                        {#if $isBeforeMarketOpen && !$isOpen && !$isWeekend}
                                        <div class="flex flex-row items-center text-white text-[0.65rem] sm:text-sm font-normal text-end w-24">
                                          <span>Pre-market:</span>
                                            <svg class="ml-1 w-4 h-4 inline-block"  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#EA9703" d="M120 40V16a8 8 0 0 1 16 0v24a8 8 0 0 1-16 0m72 88a64 64 0 1 1-64-64a64.07 64.07 0 0 1 64 64m-16 0a48 48 0 1 0-48 48a48.05 48.05 0 0 0 48-48M58.34 69.66a8 8 0 0 0 11.32-11.32l-16-16a8 8 0 0 0-11.32 11.32Zm0 116.68l-16 16a8 8 0 0 0 11.32 11.32l16-16a8 8 0 0 0-11.32-11.32M192 72a8 8 0 0 0 5.66-2.34l16-16a8 8 0 0 0-11.32-11.32l-16 16A8 8 0 0 0 192 72m5.66 114.34a8 8 0 0 0-11.32 11.32l16 16a8 8 0 0 0 11.32-11.32ZM48 128a8 8 0 0 0-8-8H16a8 8 0 0 0 0 16h24a8 8 0 0 0 8-8m80 80a8 8 0 0 0-8 8v24a8 8 0 0 0 16 0v-24a8 8 0 0 0-8-8m112-88h-24a8 8 0 0 0 0 16h24a8 8 0 0 0 0-16"/></svg>
                                        </div>
                                        {:else}
                                        <div class="flex flex-row items-center justify-end text-white text-[0.65rem] sm:text-sm font-normal text-end w-28">
                                          <span>Post-market:</span>
                                            <svg class="ml-1 w-4 h-4 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#70A1EF" d="M232.13 143.64a6 6 0 0 0-6-1.49a90.07 90.07 0 0 1-112.27-112.3a6 6 0 0 0-7.49-7.48a102.88 102.88 0 0 0-51.89 36.31a102 102 0 0 0 142.84 142.84a102.88 102.88 0 0 0 36.31-51.89a6 6 0 0 0-1.5-5.99m-42 48.29a90 90 0 0 1-126-126a90.9 90.9 0 0 1 35.52-28.27a102.06 102.06 0 0 0 118.69 118.69a90.9 90.9 0 0 1-28.24 35.58Z"/></svg>
                                        </div>
                                        {/if}
  
                                      </div>
                                      {/if}
  
                 
                                    </div>
                                  <!-----End-Header-CandleChart-Indicators------>
    
    
                                  <!--Start Time Interval-->
                                    <div class="hidden sm:flex flex-row items-center pl-1 sm:pl-6 w-full mt-4 ">
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
  
  
    
                                    <label on:click={changeChartType} class="ml-auto -mt-3 block cursor-pointer bg-[#18181B] sm:hover:bg-[#202020] duratiion-100 transition ease-in-out px-3 py-1 rounded-lg shadow-sm">
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
    
                                  {#if output !== null && pastPriceList?.length !== 0}
                                    <div class ="w-full max-w-[540px] md:max-w-[620px] lg:max-w-[570px] xl:max-w-[540px] ml-auto mb-4">
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
                                            data={oneDayPrice}
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
                                              price={(oneDayPrice?.at(0)?.close ?? oneDayPrice?.at(0)?.value)}
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
                                              price={(oneDayPrice?.at(0)?.close ?? oneDayPrice?.at(0)?.value)}
                                              lineWidth = {1}
                                              color="#fff"
                                            />
                                        </CandlestickSeries>
                                          {/if}
                                          {:else if displayData === '1W'}
                                          {#if displayChartType === 'line'}
                                          <AreaSeries 
                                            data={oneWeekPrice}
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
                                              price={oneWeekPrice?.at(0)?.value}
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
                                            data={oneMonthPrice}
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
                                              price={oneMonthPrice?.at(0)?.value}
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
                                            data={sixMonthPrice}
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
                                              price={sixMonthPrice?.at(0)?.value}
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
                                            data={oneYearPrice}
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
                                              price={oneYearPrice?.at(0)?.value}
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
                                            data={threeYearPrice}
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
                                              price={threeYearPrice?.at(0)?.value}
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
                                        <span class="loading loading-spinner loading-lg text-success"></span>
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
    
    
    
                                   
                      
                                  {#if ETFKeyInformation && $screenWidth <=1022} <!--BUG: Dont remove since when changing ETF symbol display freezes-->
                                  <div class="w-full mt-8  m-auto sm:p-6">
                                    <label class="cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                                      Key Information
                                    </label>
                                    <ETFKeyInformation 
                                      etfProfile={etfProfile}
                                      similarTicker={similarTicker}
                                      topHoldingList={topHoldingList}
                                      dividendList={dividendList}
                                      data={data}
                                    />
    
                                  </div>
                                  {/if}

                                  {#if WIIM}
                                  <div class="w-full mt-10  m-auto sm:p-6 {data?.getWhyPriceMoved?.length !== 0  ? '' : 'hidden'}">
                                    <WIIM wiim={data?.getWhyPriceMoved} data={data}/>
                                  </div>
                                  {/if}

                                  
                                <Lazy>
                                  <div class="w-full mt-10 sm:mt-5 m-auto sm:pl-6 sm:pb-6 sm:pt-6 {!$priceAnalysisComponent ? 'hidden' : ''}">
                                  {#await import('$lib/components/PriceAnalysis.svelte') then {default: Comp}}
                                    <svelte:component this={Comp} data={data} />
                                  {/await}
                                </div>
                                </Lazy>
                                  
                                <Lazy>
                                  <div class="w-full mt-10 sm:mt-5 m-auto sm:pl-6 sm:pb-6 sm:pt-6 {!$trendAnalysisComponent ? 'hidden' : ''}">
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

                                  {#if OptionsData}
                                      <div class="w-full mt-10 sm:mt-0 m-auto sm:p-6 {Object?.keys(optionsDict)?.length !== 0 ? '' : 'hidden'}">
                                        <OptionsData data={data} optionsDict={optionsDict}/>
                                      </div>
                                  {/if}
                                  
                
  
                                    <!--End Price Prediction Model-->
    
                                     <!--Start CountrySegmentation-->
                                      <div class="w-full pt-10 sm:p-6 m-auto {geographicList?.length !== 0 ? '' : 'hidden'}">
                                          {#if CountrySegmentation}
                                            <CountrySegmentation
                                            geographicList = {geographicList}
                                            />     
                                          {/if}
                                      </div>  
                                      <!--End CountrySegmentation-->
  
  
                                      <!--Start SectorSegmentation -->
                                      <div class="w-full pt-10 sm:p-6 m-auto {sectorList?.length === 0 ? 'hidden' : ''}"> 
                                          {#if SectorSegmentation}
                                            <SectorSegmentation
                                            sectorList = {sectorList}
                                            />
                                          {/if}
                                      </div>  
                                      <!--End SectorSegmentation -->
  
                                
  
                                    
                                    <div class="w-full pt-10 m-auto sm:p-6 rounded-2xl {Object?.keys(taRating)?.length !== 0 ? '' : 'hidden'} ">
                                        {#if TARating }
                                        <TARating taRating={taRating}/>
                                        {/if}  
                                    </div>
                                  
    
                                  
                                    <div class="w-full pt-10 m-auto sm:p-6 rounded-2xl {correlationList?.length !== 0 ? '' : 'hidden'}">
                                      {#if Correlation}
                                        <Correlation correlationList={correlationList}/>
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