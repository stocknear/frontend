<script lang ='ts'>
    import { clinicalTrialComponent, displayCompanyName, stockTicker, assetType, etfTicker, screenWidth, userRegion, getCache, setCache} from '$lib/store';
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
    let displayList = []
    let trialId;
    let trialTitle;
    let trialStart;
    let trialEnd;
    let trialSummary;
    let trialSex;
    let trialAge;
    let trialStage;
    let trialPhase;
    let trialStudyType;
    let trialEnrollment;
    let trialSponsor;
    let trialResult;
    let trialLink;
    let trialFunderType;

    let numOfActive;
    let numOfTerminated;
    let numOfCompleted;
    let numOfResults;

    let optionsData;

function handleViewData(trialData) {
  trialId = trialData['NCT Number']
  trialStart = trialData['Start Date'] === null ? 'n/a' : new Date(trialData['Start Date'])?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' });
  trialEnd = trialData['Completion Date'] === null ? 'n/a' : new Date(trialData['Completion Date'])?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' });
  trialTitle = trialData["Study Title"];
  trialSummary = trialData['Brief Summary'];
  trialAge = trialData['Age'];
  trialSex = trialData['Sex'];
  trialStage = formatString(trialData['Study Status']);
  trialPhase = trialData['Phases'] !== 'NA' ? formatString(trialData["Phases"])?.replace('Phase','') : '-';
  trialStudyType = formatString(trialData['Study Type']);
  trialFunderType = formatString(trialData['Funder Type']);
  trialEnrollment = abbreviateNumber(trialData['Enrollment']);
  trialSponsor = trialData['Sponsor'];
  trialResult = formatString(trialData['Study Results'])
  trialLink = trialData['Study URL']

  const openPopup = $screenWidth < 1024 ? document.getElementById("clinicalMobileModal") : document.getElementById("clinicalDesktopModal");
  openPopup?.dispatchEvent(new MouseEvent('click'))

}
function normalizer(value) {
  if (Math?.abs(value) >= 1e18) {
    return { unit: 'Q', denominator: 1e18 };
  } else if (Math?.abs(value) >= 1e12) {
    return { unit: 'T', denominator: 1e12 };
  } else if (Math?.abs(value) >= 1e9) {
    return { unit: 'B', denominator: 1e9 };
  } else if (Math?.abs(value) >= 1e6) {
    return { unit: 'M', denominator: 1e6 };
  } else if (Math?.abs(value) >= 1e5) {
    return { unit: 'K', denominator: 1e5 };
  } else {
    return { unit: '', denominator: 1 };
  }
}


function getPlotOptions() {
  let dates = [];
  let valueList = [];
  let fiscalYearCount = {};

  
  // Sort rawData by 'Start Date'
  rawData?.sort((a, b) => new Date(a['Start Date']) - new Date(b['Start Date']));

  rawData?.forEach(item => {
    // Extract year from 'Start Date'
    const startDate = new Date(item['Start Date']);
    const year = startDate?.getFullYear();

    // Check if the year is valid and at least 2000
    if (year && year >= 2000) {
      // Convert it to fiscal year format
      const fiscalYear = "FY" + String(year).slice(2);

      // Ensure dates list is unique
      if (!dates.includes(fiscalYear)) {
        dates.push(fiscalYear);
      }

      // Count the occurrences of each fiscal year
      fiscalYearCount[fiscalYear] = (fiscalYearCount[fiscalYear] || 0) + 1;
    }
  });

    // Update valueList with the count of each fiscal year
    valueList = dates.map(fiscalYear => fiscalYearCount[fiscalYear]);


    const {unit, denominator } = normalizer(Math.max(...valueList) ?? 0)

    const option = {
    silent: true,
    grid: {
        left: $screenWidth < 640 ? '0%' : '2%',
        right: $screenWidth < 640 ? '2%' : '2%',
        bottom: $screenWidth < 640 ? '0%' : '2%',
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
                formatter: function (value) {
                return '#'+(value / denominator)?.toFixed(0) + unit; // Format value in millions
                },
            },
        },
        ],
    series: [
        {
        data: valueList,
        type: 'line',
        itemStyle: {
            color: 'rgb(255,255,255,0.8)' // Change bar color to white
        }
        }
    ]
    };


return option;
}

const getClinicalTrial = async (ticker) => {
    // Get cached data for the specific tickerID
    const cachedData = getCache(ticker, 'getClinicalTrial');
    if (cachedData) {
      rawData = cachedData;
      displayList = cachedData;
    } else {

      const postData = {'ticker': ticker};
      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/clinical-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });

      rawData = await response.json();
      displayList = rawData;
      // Cache the data for this specific tickerID with a specific name 'getClinicalTrial'
      setCache(ticker, rawData, 'getClinicalTrial');
    }
    if(rawData?.length !== 0) {
      $clinicalTrialComponent = true;
    } else {
      $clinicalTrialComponent = false;
    }
};


$: {
  if($assetType === 'stock' ? $stockTicker :$etfTicker && typeof window !== 'undefined') {
    isLoaded=false;
    const ticker = $assetType === 'stock' ? $stockTicker :$etfTicker
    const asyncFunctions = [
      getClinicalTrial(ticker)
      ];
      Promise.all(asyncFunctions)
          .then((results) => {
            numOfActive = rawData?.filter(item => item['Study Status'] === 'Active')?.length;
            numOfCompleted = rawData?.filter(item => item['Study Status'] === 'COMPLETED')?.length;
            numOfTerminated = rawData?.filter(item => item['Study Status'] === 'TERMINATED')?.length;
            numOfResults =  rawData?.filter(item => item['Study Results'] === 'YES')?.length;

            optionsData = getPlotOptions()
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
    
    
    
    
<section class="overflow-hidden text-white h-full pb-8">
    <main class="overflow-hidden ">
                    
        <div class="flex flex-row items-center">
            <label for="clinicalTrialInfo" class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold">
                Clinical Trials
            </label>
            <InfoModal
              title={"Clinical Trial"}
              content={"Info description coming soon! But first a word of our sponsor skillshare... just kidding"}
              id={"clinicalTrialInfo"}
            />
        </div>

        {#if data?.user?.tier === 'Pro'}
        {#if isLoaded}

        {#if rawData?.length !== 0}

        <div class="w-full flex flex-col items-start">
            <div class="text-white text-sm sm:text-[1rem] mt-2 mb-2 w-full">
              The Biotech company {$displayCompanyName} has conducted a total of {abbreviateNumber(rawData?.length)} clinical trials.
              Out of these, {numOfActive === 0 ? 'none' : numOfActive} are currently active,
              {numOfCompleted} have been completed, {numOfTerminated} were terminated and {numOfResults} trials have produced results.

            </div>
        </div>

        
        <div class="pb-2 rounded-lg bg-[#09090B]">
                
          
            <Lazy height={300} fadeOption={{delay: 100, duration: 500}} keep={true}>
                <div class="app w-full h-[300px] mt-5">
                    <Chart options={optionsData} class="chart" />
                </div>
            </Lazy>
        
        </div>
        





        <h2 class="mt-10 mr-1 flex flex-row items-center text-white text-xl sm:text-2xl font-bold mb-3">
          Latest Information
        </h2>


         
        <div class="rounded-lg sm:min-h-[330px]">
          <div class="w-full m-auto h-auto max-h-[500px] overflow-x-scroll sm:overflow-hidden sm:overflow-y-scroll scroller ">
          <table class="table table-sm table-compact table-pin-rows table-pin-cols w-full">
            <thead>
              <tr class="border-b border-blue-400">
                <th class="text-white shadow-md font-semibold text-sm text-start bg-[#09090B]">Drug</th>
                <th class="text-white shadow-md font-semibold text-sm text-start bg-[#09090B]">Stage</th>
                <th class="text-white shadow-md font-semibold text-sm text-center bg-[#09090B]">Phase Status</th>
                <th class="text-white shadow-md font-semibold text-sm text-end bg-[#09090B]">Result</th>
              </tr>
            </thead>
            <tbody>
              {#each displayList as item,index}
              <tr on:click={() => handleViewData(item)} class="border-y border-gray-800 odd:bg-[#27272A] sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] bg-[#09090B] border-b-[#09090B] cursor-pointer">
               
                  <td class="text-white font-medium">
                   {item["Interventions"]?.length === 0 ? '-' : item["Interventions"]?.length > charNumber ? formatString(item["Interventions"]?.slice(0,charNumber)) + "..." : formatString(item["Interventions"])}
                  </td>
                  <!--
                  <td class="text-white font-medium w-full text-start">
                    {item['Start Date'] === null ? 'n/a' : new Date(item["Start Date"])?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                   </td>
                  -->
              
                  <td class="text-white text-start font-medium">
                    {formatString(item['Study Status'])}
                  </td>

                  <td class="text-white text-center font-medium">
                    {item['Phases'] !== 'NA' ? formatString(item["Phases"])?.replace('Phase','') : '-'}
                  </td>
              
                  <td class="text-white text-end font-medium ">
                    {formatString(item["Study Results"])}
                  </td>
                  
              
              </tr>
              {/each}
            </tbody>
          </table>

  
        </div>
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
        <div class="shadow-lg shadow-bg-[#000] bg-[#09090B] sm:bg-opacity-[0.5] text-sm sm:text-[1rem] rounded-md w-full p-4 min-h-24 mt-4 text-white m-auto flex justify-center items-center text-center font-semibold">
            <svg class="mr-1.5 w-5 h-5 inline-block"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#A3A3A3" d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"/></svg>
            Unlock content with <a class="inline-block ml-2 text-blue-400 hover:sm:text-white" href="/pricing">Pro Subscription</a>
          </div>
        {/if}

    </main>
</section>




<!-- Put this part before </body> tag -->
<input type="checkbox" id="clinicalDesktopModal" class="modal-toggle" />

<label for="clinicalDesktopModal" class="hidden lg:modal modal-bottom sm:modal-middle cursor-pointer">

  <label for="clinicalDesktopModal"  class="cursor-pointer modal-backdrop"></label>



  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label class="modal-box w-full relative bg-[#09090B] h-auto max-h-[900px] overflow-y-scroll">
    <label for="clinicalDesktopModal" class="cursor-pointer absolute right-5 top-2 bg-[#09090B] text-2xl text-white">
      ✕
    </label>

    <h3 class="text-xl font-semibold text-white mt-10">
      Title: {trialTitle}
    </h3>
    <p class="py-4 text-gray-200 bg-[#09090B] w-full">
      <span class="font-semibold text-white">Brief Summary:</span>
      {trialSummary}

    </p>

    <table class="table table-sm table-compact bg-[#09090B] w-full mt-5 mb-10 text-white">
      <tbody>
        <!-- row 1 -->
        <tr class="border-b border-slate-700">
          <td class="bg-[#09090B] font-semibold ">NCT Number</td>
          <td class="bg-[#09090B] ">{trialId}</td>
        </tr>
        <tr class="border-b border-slate-700">
          <td class="bg-[#09090B] font-semibold ">Start Date</td>
          <td class="bg-[#09090B] ">{trialStart}</td>
        </tr>
        <tr class="border-b border-slate-700">
          <td class="bg-[#09090B] font-semibold ">End Date</td>
          <td class="bg-[#09090B] ">{trialEnd}</td>
        </tr>
        <!-- row 2 -->
        <tr class="border-b border-slate-700">
          <td class="bg-[#09090B] font-semibold ">Study Status</td>
          <td class="bg-[#09090B] ">{trialStage}</td>
        </tr>
        <tr class="border-b border-slate-700">
          <td class="bg-[#09090B] font-semibold ">Phase Status</td>
          <td class="bg-[#09090B] ">{trialPhase}</td>
        </tr>
        <tr class="border-b border-slate-700">
          <td class="bg-[#09090B] font-semibold ">Study Results</td>
          <td class="bg-[#09090B] ">{trialResult}</td>
        </tr>
        <tr class="border-b border-slate-700">
          <td class="bg-[#09090B] font-semibold ">Sex</td>
          <td class="bg-[#09090B] ">{formatString(trialSex)}</td>
        </tr>
        <tr class="border-b border-slate-700">
          <td class="bg-[#09090B] font-semibold ">Age</td>
          <td class="bg-[#09090B] ">{formatString(trialAge)?.replace('Older_adult', 'Older Adult')}</td>
        </tr>
        <tr class="border-b border-slate-700">
          <td class="bg-[#09090B] font-semibold ">Sponsor</td>
          <td class="bg-[#09090B] ">{trialSponsor}</td>
        </tr>
        <tr class="border-b border-slate-700">
          <td class="bg-[#09090B] font-semibold ">Enrollment</td>
          <td class="bg-[#09090B] ">{trialEnrollment}</td>
        </tr>
        <tr class="border-b border-slate-700">
          <td class="bg-[#09090B] font-semibold ">Study Type</td>
          <td class="bg-[#09090B] ">{trialStudyType}</td>
        </tr>
        <tr class="border-b border-slate-700">
          <td class="bg-[#09090B] font-semibold ">Funder Type</td>
          <td class="bg-[#09090B] ">{trialFunderType}</td>
        </tr>
        <tr class="border-b border-slate-700">
          <td class="bg-[#09090B] font-semibold ">Website</td>
          <td class="bg-[#09090B] "><a class="text-blue-400 sm:hover:text-white" href={trialLink} rel="noopener noreferrer" target="_blank">{trialLink}</a></td>
        </tr>
      </tbody>
    </table>


  </label>
</label>





<!--Start ETF Modal-->
<div class="lg:hidden drawer drawer-end z-40 overflow-hidden w-screen">
  <input id="clinicalMobileModal" type="checkbox" class="drawer-toggle"/>
  <div class="drawer-side overflow-hidden">
  
      
    <div class="bg-[#000] min-h-screen w-screen pb-20 overflow-hidden">

        <label for="clinicalMobileModal" class="absolute left-6 top-6">
          <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
        </label>

  
  <div class="w-full overflow-hidden overflow-y-scroll p-2">

    <h3 class="text-xl font-semibold text-white mt-14 p-3">
      Title: {trialTitle}
    </h3>
    <p class="py-4 text-gray-200 w-full p-3">
      <span class="font-semibold text-white">Brief Summary:</span>
      {trialSummary}
    </p>

    <table class="table table-sm table-compact w-full mt-5 mb-10 text-white">
      <tbody>
        <!-- row 1 -->
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold w-full">NCT Number</td>
          <td class="">{trialId}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A] even:bg-[#09090B]">
          <td class="font-semibold ">Start Date</td>
          <td class="">{trialStart}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A] even:bg-[#09090B]">
          <td class="font-semibold ">End Date</td>
          <td class="">{trialEnd}</td>
        </tr>
        <!-- row 2 -->
        <tr class="border-b border-slate-700 odd:bg-[#27272A] even:bg-[#09090B]">
          <td class="font-semibold ">Study Status</td>
          <td class="">{trialStage}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A] even:bg-[#09090B]">
          <td class="font-semibold ">Phase Status</td>
          <td class="">{trialPhase}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A] even:bg-[#09090B]">
          <td class="font-semibold ">Study Results</td>
          <td class="">{trialResult}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A] even:bg-[#09090B]">
          <td class="font-semibold ">Sex</td>
          <td class="">{formatString(trialSex)}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A] even:bg-[#09090B]">
          <td class="font-semibold ">Age</td>
          <td class="">{formatString(trialAge)?.replace('Older_adult', 'Older Adult')}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A] even:bg-[#09090B]">
          <td class="font-semibold ">Sponsor</td>
          <td class="">{trialSponsor}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A] even:bg-[#09090B]">
          <td class="font-semibold ">Enrollment</td>
          <td class="">{trialEnrollment}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A] even:bg-[#09090B]">
          <td class="font-semibold ">Study Type</td>
          <td class="">{trialStudyType}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A] even:bg-[#09090B]">
          <td class="font-semibold ">Funder Type</td>
          <td class="">{trialFunderType}</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A] even:bg-[#09090B]">
          <td class="font-semibold ">Website</td>
          <td class=""><a class="text-blue-400 sm:hover:text-white" href={trialLink} rel="noopener noreferrer" target="_blank">{trialLink}</a></td>
        </tr>
      </tbody>
    </table>

        
  </div>

</div>
</div>
</div>
  <!--End ETF Modal-->

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