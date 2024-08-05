<script lang='ts'>


import { screenWidth, numberOfUnreadNotification } from '$lib/store';
import { goto } from '$app/navigation';
import { Chart } from 'svelte-echarts'

import { init, use } from 'echarts/core'
import { TreemapChart } from 'echarts/charts'
import { GridComponent} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
use([TreemapChart, GridComponent, CanvasRenderer])

export let data;
let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;

let displayIndex = 'S&P500';
let lowestSumCategory = null;
let highestSumCategory = null;

let lowestSum = Infinity;
let highestSum = -Infinity;

let rawData;

let isLoaded = false;
let options;
    
const visualMin = -100;
const visualMax = 100;

/*
To-do: Add export to save as png or jpg.
async function exportTreemap() {
    // Specify the desired width and height for the canvas
    const width = 1000 ;
    const height = 1000/;
    
    // Create the canvas element with the specified width and height
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const chart = echarts.init(canvas);
    chart.setOption(options);

    const link = document.createElement('a');
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = 'treemap.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, 'image/png');
}
*/

function getLevelOption() {
    return [
      {
        itemStyle: {
          borderColor: '#2D313C',
          borderWidth: 0,
          gapWidth: 1
        },
        upperLabel: {
          show: false
        }
      },
      {
        itemStyle: {
          borderColor: '#2D313C',
          borderWidth: 5,
          gapWidth: 1
        },
        
        emphasis: {
          itemStyle: {
            borderColor: '#2D313C'
          }
        }
      },
      {
        color: ['#942e38', '#aaa', '#269f3c'],
        colorMappingBy: 'value',
        itemStyle: {
            gapWidth: 1
        }
        },
      {
        colorSaturation: [0.5, 0.9],
        itemStyle: {
          borderWidth: 5,
          gapWidth: 1,
          borderColorSaturation: 0.6
        }
      }
    ];
  }

function plotData(fontSize) {
    lowestSum = Infinity;
    highestSum = -Infinity;

    rawData.forEach(category => {
    let sum = category?.children?.reduce((acc, stock) => acc + stock?.changesPercentage, 0);
    
    if (sum < lowestSum) {
        lowestSum = sum;
        lowestSumCategory = category.name;
    }
    });

    rawData?.forEach(category => {
    let sum = category?.children?.reduce((acc, stock) => acc + stock?.changesPercentage, 0);
    
    if (sum > highestSum) {
        highestSum = sum;
        highestSumCategory = category.name;
    }
    });

  
    options = {
    silent: true,
    tooltip: {},
    grid: {
        left: '0%',
        right: '0%',
        top: '0%',
        bottom: '0%',
        containLabel: true,
    },
    series: [{
        breadcrumb: { show: false },
        type: 'treemap',
        roam: false,
        width: '100%',
        height: '100%',
        visualMin: visualMin,
        visualMax: visualMax,
        visualDimension: 2,
        label: {
            show: true,
            textStyle: {
                color: '#fff',
                fontSize: fontSize,
                fontWeight: 'bold',
            },
            formatter: function (params) {
                var changesPercentage = params.data.changesPercentage || 0; // Access changesPercentage from params.data
                return params.name + '\n\n' + changesPercentage + '%';
            }
        },
        upperLabel: {
            show: true,
            textStyle: {
                color: '#fff',
                fontSize: fontSize,
            },
            formatter: function (params) {
                var sumChangesPercentage = 0;
                if (params.data.children && params.data.children.length > 0) {
                    sumChangesPercentage = params.data.children.reduce((acc, child) => acc + (child.changesPercentage || 0), 0);
                }
                return params.name + ': ' + sumChangesPercentage?.toFixed(2) + '%'; // Display sum with two decimal places
            },
            height: 40
        },
        itemStyle: {
            borderColor: '#2D313C',
            color: function(params) {
                return params.data.changesPercentage >= 0 ? '#30954F' : '#FF281E'; // Access changesPercentage from params.data
            }
        },
        levels: getLevelOption(),
        data: rawData.map(item => ({
            ...item,
            children: item.children.map(child => ({
                ...child,
                itemStyle: {
                    ...child.itemStyle,
                    color: child.changesPercentage < 0 ? '#7F4650' : '#396550'
                }
            }))
        })),
    }]
};


}
    

function changeIndex(indexName) {
    displayIndex = indexName;
}

function sectorSelector(sector) {
    let path;
    switch(sector) {
        case 'Financials':
            path = "financial-sector";
            break;
        case 'Healthcare':
            path = "healthcare-sector";
            break;
        case 'Information Technology':
            path = "technology-sector";
            break;
        case 'Technology':
            path = "technology-sector";
            break;
        case 'Financial Services':
            path = "financial-sector";
            break;
        case 'Industrials':
            path = "industrials-sector";
            break;
        case 'Energy':
            path = "energy-sector";
            break;
        case 'Utilities':
            path = "utilities-sector";
            break;
        case 'Consumer Cyclical':
            path = "consumer-cyclical-sector";
            break;
        case 'Real Estate':
            path = "real-estate-sector";
            break;
        case 'Basic Materials':
            path = "basic-materials-sector";
            break;
        case 'Communication Services':
            path = "communication-services-sector";
            break;
        case 'Consumer Defensive':
            path = "consumer-defensive-sector";
            break;
        default:
            // Handle default case if needed
            break;
    }
    goto("list/" + path);
}


$: {
    if(typeof window !== 'undefined' && displayIndex)
    {
        isLoaded = false;

        if(displayIndex === 'S&P500') {
            rawData = data?.getSP500HeatMap;
        }
        else if (displayIndex === 'Dow Jones') {
            rawData = data?.getDowJonesHeatMap;
        }
        else if (displayIndex === 'Nasdaq') {
            rawData = data?.getNasdaqHeatMap;
        }
        const fontSize = $screenWidth < 640 ? 12 : 16;
        plotData(fontSize);
  
        isLoaded = true;
    }
}


    let charNumber = 40;
    $: {
        if ($screenWidth < 640)
        {
          charNumber = 20;
        }
        else {
          charNumber = 40;
        }
      }
      
    
    
    
    </script>
    
<!-- HEADER FOR BETTER SEO -->
<svelte:head>
    <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Market Heatmaps · stocknear</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />

    <meta name="description" content="Stock Heatmaps of S&P500, Nasdaq and Dow Jones to see percentage changes of the return for different time periods">
    <!-- Other meta tags -->
    <meta property="og:title" content="Market Heatmaps · stocknear"/>
    <meta property="og:description" content="Stock Heatmaps of S&P500, Nasdaq and Dow Jones to see percentage changes of the return for different time periods">
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->

    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="Market Heatmaps · stocknear"/>
    <meta name="twitter:description" content="Stock Heatmaps of S&P500, Nasdaq and Dow Jones to see percentage changes of the return for different time periods">
    <!-- Add more Twitter meta tags as needed -->
</svelte:head>
    
    
    
    
    <section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-60">
    
          <div class="w-full max-w-4xl m-auto sm:bg-[#27272A] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
          
              <!-- Start Column -->
              <div>
                <div class="flex flex-row justify-center items-center">
                  <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
                    Market Heatmaps
                  </h1>
                </div>
        
                <span class="hidden sm:block text-white text-md font-medium text-center flex justify-center items-center ">
                  Latest market changes to never miss another bullish or bearish rally. 
                </span>
      
              </div>
              <!-- End Column -->
          
              <!-- Start Column -->
              <div class="hidden sm:block relative m-auto mb-5 mt-5 sm:mb-0 sm:mt-0">
                <svg class="w-40 -my-5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="5" result="glow"/>
                      <feMerge>
                        <feMergeNode in="glow"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <path fill="#1E40AF" d="M57.6,-58.7C72.7,-42.6,81.5,-21.3,82,0.5C82.5,22.3,74.7,44.6,59.7,60.1C44.6,75.6,22.3,84.3,0,84.3C-22.3,84.2,-44.6,75.5,-61.1,60.1C-77.6,44.6,-88.3,22.3,-87.6,0.7C-86.9,-20.8,-74.7,-41.6,-58.2,-57.7C-41.6,-73.8,-20.8,-85.2,0.2,-85.4C21.3,-85.6,42.6,-74.7,57.6,-58.7Z" transform="translate(100 100)" filter="url(#glow)" />
                </svg>
                
                
                <div class="z-1 absolute top-0 left-8">
                  <img class="w-32 h-fit" src={cloudFrontUrl+"/assets/heatmaps_logo.png"} alt="logo" loading="lazy">
                </div>
              </div>
              <!-- End Column -->
            </div>
        
           
        
        
          </div>
        
    
    
      <body class="w-full max-w-4xl overflow-hidden m-auto">
                
          
      {#if isLoaded}
    
                
        <section class="w-full max-w-4xl overflow-hidden m-auto">
          


          <div class="p-0 flex justify-center w-full m-auto overflow-hidden max-w-4xl">
              <div class="relative flex justify-center items-center overflow-hidden w-full">
                  <main class="w-full">
    
                    

                  <div class="w-full max-w-4xl sm:flex sm:flex-row sm:items-center m-auto text-gray-100 border border-gray-800 sm:rounded-lg h-auto p-5 mb-4 ">
                      <svg class="w-5 h-5 inline-block sm:mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#a474f6" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                      <span>
                          Today, <label on:click={() => sectorSelector(lowestSumCategory)} class="cursor-pointer text-blue-400 sm:hover:text-white">{lowestSumCategory}</label> took the lead as the {displayIndex} largest loser, marking a cumulative return of <span class="text-white font-medium">{lowestSum?.toFixed(2)}%</span>, 
                          while <label on:click={() => sectorSelector(highestSumCategory)} class="cursor-pointer text-blue-400 sm:hover:text-white">{highestSumCategory}</label> surged ahead as the top performer with an impressive cumulative return of <span class="text-white font-medium">{highestSum?.toFixed(2)}%</span>.
                      </span>
                  </div>


                  <div class="w-full pt-3">
                    <div class="relative right-0 bg-[#09090B]">
                      <ul class="relative w-fit flex flex-wrap px-2 list-none rounded-[3px]">
                        <li class="px-3 py-1.5 flex-auto text-center bg-[#2E3238] rounded-[3px]">
                          <label for="indexModal" class="cursor-pointer border flex items-center justify-center w-full px-0 py-1 mb-0 border-0 rounded-[3px] bg-inherit">
                            <span class="text-sm sm:text-md text-white ml-1">
                              Market Index:
                            </span>
                            <span class="text-sm sm:text-md font-medium text-white ml-2 mr-2">
                                {displayIndex}
                            </span>
                            <svg class="ml-auto sm:ml-0 mr-5 h-4 w-4 inline-block transform transition-transform mr-2 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="#fff" d="m488.832 344.32l-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872l319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z"/></svg>
                          </label>
                        </li>
                        <!--
                        <li class="pl-3 py-1.5 flex-auto text-center bg-[#2E3238] rounded-[3px]">
                          <label for="exportDataModal" class="cursor-pointer border flex items-center justify-center w-full px-0 py-1 mb-0 border-0 rounded-[3px] bg-inherit">
                            <span class="text-sm font-medium text-white ml-3">
                              Export
                            </span>
                            <svg class="ml-auto mr-5 h-4 w-4 inline-block transform transition-transform mr-2 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="#fff" d="m488.832 344.32l-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872l319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z"/></svg>
                          </label>
                        </li>
                        -->
                      </ul>
                    </div>
                  </div>

          
    
                    



                    <div class="app w-[100vw] h-full mt-10">
                        <Chart id="treemap" {init} options={options} class="chart w-full h-full" />
                    </div>



                    
                  
                  </main>
              </div>
          </div>
        </section>
        {:else}
        <div class="flex justify-center items-center h-80">
          <div class="relative">
          <label class="bg-[#09090B] rounded-xl h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span class="loading loading-spinner loading-md"></span>
          </label>
          </div>
      </div>
    
        {/if}
            
    </body>
            
            
        
    </section>
    
    
    
    
    
  <!--Start IndexModal -->
<input type="checkbox" id="indexModal" class="modal-toggle" />    
<dialog id="indexModal" class="modal modal-bottom sm:modal-middle ">
  
  
<label id="indexModal" for="indexModal"  class="cursor-pointer modal-backdrop bg-[#fff] bg-opacity-[0.02] sm:bg-[#000] sm:bg-opacity-[0.5]"></label>


<div class="modal-box w-full bg-[#000] sm:bg-[#09090B] sm:border sm:border-slate-800">



<label for="indexModal" class="cursor-pointer absolute right-5 top-2 bg-[#000] sm:bg-[#09090B] text-[1.8rem] text-white">
    ✕
</label>

    <div class="text-white">
    
    <h3 class="font-medium text-lg sm:text-xl mb-10">
        Market Index
    </h3>
        

    <div class="flex flex-col items-center w-full max-w-3xl bg-[#000] sm:bg-[#09090B]">


        <label for="indexModal" on:click={() => changeIndex('S&P500')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">

            <div class="flex flex-row items-center w-full bg-[#09090B] bg-opacity-[0.7] sm:bg-opacity-[1.0] sm:bg-[#303030] p-3 rounded-lg {displayIndex === 'S&P500' ? 'ring-2 ring-[#04E000]' : ''}">
            
            <span class="ml-1 text-white font-medium mr-auto">
                S&P500
            </span>

            </div>
            
        </label>


        <label for="indexModal" on:click={() => changeIndex('Dow Jones')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">

        <div class="flex flex-row items-center w-full bg-[#09090B] bg-opacity-[0.7] sm:bg-opacity-[1.0] sm:bg-[#303030] p-3 rounded-lg {displayIndex === 'Dow Jones' ? 'ring-2 ring-[#04E000]' : ''}">
            
            <span class="ml-1 text-white font-medium mr-auto">
            Dow Jones
            </span>

        </div>
        
    </label>

    <label for="indexModal" on:click={() => changeIndex('Nasdaq')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">

        <div class="flex flex-row items-center w-full bg-[#09090B] bg-opacity-[0.7] sm:bg-opacity-[1.0] sm:bg-[#303030] p-3 rounded-lg {displayIndex === 'Nasdaq' ? 'ring-2 ring-[#04E000]' : ''}">
            
            <span class="ml-1 text-white font-medium mr-auto">
            Nasdaq
            </span>

        </div>
        
    </label>

    </div>
        
    </div>


        
    </div>
</dialog>
<!--End Index Modal-->
        
    
    
    
      <!--Start Export -->
    <input type="checkbox" id="exportDataModal" class="modal-toggle" />    
      <dialog id="exportDataModal" class="modal modal-bottom sm:modal-middle ">
      
      
        <label id="exportDataModal" for="exportDataModal"  class="cursor-pointer modal-backdrop bg-[#fff] bg-opacity-[0.02] sm:bg-[#000] sm:bg-opacity-[0.5]"></label>
        
        
        <div class="modal-box w-full bg-[#000] sm:bg-[#09090B] sm:border sm:border-slate-800">
      
      
      
        <label for="exportDataModal" class="cursor-pointer absolute right-5 top-2 bg-[#000] sm:bg-[#09090B] text-[1.8rem] text-white">
          ✕
        </label>
      
          <div class="text-white">
            
            <h3 class="font-medium text-lg sm:text-xl mb-10">
              Export
            </h3>
              
      
            <div class="flex flex-col items-center w-full max-w-3xl bg-[#000] sm:bg-[#09090B]">
      
      
              <label for="exportDataModal" on:click={() => exportTreemap()} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
      
                  <div class="flex flex-row items-center w-full bg-[#09090B] bg-opacity-[0.7] sm:bg-opacity-[1.0] sm:bg-[#303030] p-3 rounded-lg ring-2 ring-[#04E000]">
                    
                    <span class="ml-1 text-white font-medium mr-auto">
                      Save as PNG
                    </span>
      
                  </div>
                 
              </label>
      
      
              <label for="exportDataModal" class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
      
                <div class="flex flex-row items-center w-full bg-[#09090B] bg-opacity-[0.7] sm:bg-opacity-[1.0] sm:bg-[#303030] p-3 rounded-lg ring-2 ring-[#04E000]">
                  
                  <span class="ml-1 text-white font-medium mr-auto">
                    Save as JPG
                  </span>
    
                </div>
               
            </label>
    
      
            </div>
             
          </div>
      
      
              
            </div>
      </dialog>
    <!--End Export-->
    

    <style>
        .app {
            height: 1200px;
            max-width: 900px;
        }
        
        
    
        .chart {
            width: 100%;
        }
    </style>