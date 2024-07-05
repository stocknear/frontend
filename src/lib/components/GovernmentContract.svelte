<script lang ='ts'>
    import { governmentContractComponent, displayCompanyName, stockTicker, screenWidth, userRegion, getCache, setCache} from '$lib/store';
    import InfoModal from '$lib/components/InfoModal.svelte';
    import { Chart } from 'svelte-echarts'
    import { abbreviateNumber, formatString } from "$lib/utils";
  
    import Lazy from 'svelte-lazy';
    export let data;
  
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
  
  
    let rawData = [];
    let optionsData;
    let avgNumberOfContracts = 0;
    let displayMaxContracts = 0;
    let displayYear = 'n/a';
    let totalAmount;
    let totalContract;

  
  function normalizer(value) {
  if (Math?.abs(value) >= 1e18) {
    return { unit: 'Q', denominator: 1e18 };
  } else if (Math?.abs(value) >= 1e12) {
    return { unit: 'T', denominator: 1e12 };
  } else if (Math?.abs(value) >= 1e9) {
    return { unit: 'B', denominator: 1e9 };
  } else if (Math?.abs(value) >= 1e8) {
    return { unit: 'B', denominator: 1e9 };
  } else if (Math?.abs(value) >= 1e6) {
    return { unit: 'M', denominator: 1e6 };
  } else if (Math?.abs(value) >= 1e5) {
    return { unit: 'K', denominator: 1e5 };
  } else if (Math?.abs(value) >= 1e4) {
        return { unit: 'K', denominator: 1e4 };
  } else {
    return { unit: '', denominator: 1 };
  }
  }
  
  
  function getPlotOptions() {
    let dates = [];
    let amountList = [];
    let numList = []

    // Iterate over the data and extract required information
    rawData?.forEach(item => {
    // Extract year and convert it to fiscal year format
    const fiscalYear = "FY" + item?.year?.slice(2);
    dates?.push(fiscalYear);

    // Extract totalValue
    amountList?.push(item?.amount);
    numList?.push(item?.numOfContracts);

    });
    
   // Calculate total number of contracts
   totalContract = rawData?.reduce((sum, item) => sum + item?.numOfContracts, 0)
   totalAmount =  rawData?.reduce((sum, item) => sum + item?.amount, 0);

   avgNumberOfContracts = Math.floor((totalContract)/rawData?.length);
    const { year:yearWithMaxContracts, numOfContracts:maxContracts } = rawData?.reduce((max, contract) => contract?.numOfContracts > max?.numOfContracts ? contract : max, rawData?.at(0));
    displayYear = yearWithMaxContracts;
    displayMaxContracts = maxContracts
        
    const {unit, denominator } = normalizer(Math.max(...amountList) ?? 0)

    const option = {
    silent: true,
    tooltip: {
        trigger: 'axis',
        hideDelay: 100, // Set the delay in milliseconds
    },
    animation: $screenWidth < 640 ? false: true,
    grid: {
        left:'2%',
        right:  $screenWidth < 640 ? '0%' : '2%',
        bottom: '0%',
        top: '10%',
        containLabel: true
    },
    xAxis: {
        data: dates,
        type: 'category',
        },
        yAxis: [
        {
            type: 'value',
            splitLine: {
            show: false, // Disable x-axis grid lines
            },
            axisLabel: {
            color: '#6E7079', // Change label color to white
                formatter: function (value, index) {
                    if(index % 2) {
                        return '$'+(value / denominator)?.toFixed(1) + unit; // Format value in millions        
                    } else {
                        return ''
                    }
                },
            },
        },
        {
            type: 'value',
            show: false,
            splitLine: {
                    show: false, // Disable x-axis grid lines
            },
            position: 'right',
            
          },
        ],
    series: [
        {
        name: '# of Contracts',
        data: numList,
        type: 'line',
        yAxisIndex: 1,
        itemStyle: {
            color: '#fff' // Change bar color to white
        }
        },
        {
        name: 'Amount',
        data: amountList,
        type: 'bar',
        itemStyle: {
            color: '#FF9E21' // Change bar color to white
        }
        },
    ]
    };
  
  
  return option;
  }
  
  const getGovernmentContract = async (ticker) => {
    // Get cached data for the specific tickerID
    const cachedData = getCache(ticker, 'getGovernmentContract');
    if (cachedData) {
      rawData = cachedData;
    } else {
  
      const postData = {'ticker': ticker};
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/government-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });
  
      rawData = (await response.json());
      // Cache the data for this specific tickerID with a specific name 'getGovernmentContract'
      setCache(ticker, rawData, 'getGovernmentContract');
    }
    
    if(rawData?.length !== 0) {
      $governmentContractComponent = true;
    } else {
      $governmentContractComponent = false;
    }
  };
  
  

  $: {
  if($stockTicker && typeof window !== 'undefined') {
    isLoaded=false;
    const ticker = $stockTicker
    const asyncFunctions = [
      getGovernmentContract(ticker)
      ];
      Promise.all(asyncFunctions)
          .then((results) => {
            if(rawData?.length !== 0) {
                optionsData = getPlotOptions();
            }
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
    charNumber =40;
  }
  }
    
  
  
  </script>
    
    
    
  <section class="overflow-hidden text-white h-full pb-8">
    <main class="overflow-hidden ">
                    
        <div class="flex flex-row items-center">
            <label for="governmentContractInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                US Government Contract
            </label>
            <InfoModal
              title={"Government Contract"}
              content={"Government contracts are agreements between the local government and companies for goods or services. They can be substantial revenue sources for companies, particularly in sectors like defense, technology, and infrastructure. Winning contracts can enhance a company's stability and credibility, but it often involves competitive bidding and compliance with strict regulations."}
              id={"governmentContractInfo"}
            />
        </div>
  
        {#if data?.user?.tier === 'Pro'}
        {#if isLoaded}
  
        {#if rawData?.length !== 0}
  
        <div class="w-full flex flex-col items-start">
            <div class="text-white text-sm sm:text-[1rem] mt-2 mb-2 w-full">
                Since 2015, {$displayCompanyName} has secured a total of {totalContract} government contracts, amassing {abbreviateNumber(totalAmount,true)} in revenue. The company has averaged {avgNumberOfContracts} contracts per year, with a peak of {displayMaxContracts} contracts in {displayYear}.
            </div>
        </div>
  
        <div class="pb-2 rounded-lg bg-[#0F0F0F]">
                
          
            <Lazy height={300} fadeOption={{delay: 100, duration: 500}} keep={true}>
                <div class="app w-full h-[300px] mt-5">
                    <Chart options={optionsData} class="chart" />
                </div>
            </Lazy>
        
        </div>
  
        <div class="flex flex-row items-center justify-between mx-auto mt-5 w-full sm:w-11/12">
            
            <div class="mt-3.5 sm:mt-0 flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
                <div class="w-3 h-3 bg-[#fff] border-4 box-content border-[#202020] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                <span class="mt-2 sm:mt-0 text-white text-center sm:text-start text-xs sm:text-md inline-block">
                    # of Contracts
                </span>
            </div>

            <div class="flex flex-col sm:flex-row items-center ml-3 sm:ml-0 w-1/2 justify-center">
                <div class="h-full transform -translate-x-1/2 " aria-hidden="true"></div>
                <div class="w-3 h-3 bg-[#FFAD24] border-4 box-content border-[#202020] rounded-full transform sm:-translate-x-1/2" aria-hidden="true"></div>
                <span class="mt-2 sm:mt-0 text-white text-xs sm:text-md sm:font-medium inline-block">
                    Amount
                </span>
            </div>  
        </div>
  

        
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
    height: 210px;
  }
  }
  
  .chart {
  width: 100%;
  }
  
  </style>