<script lang='ts'>
  import { goto } from '$app/navigation';
  import republicanBackground from "$lib/images/bg-republican.png";
  import democraticBackground from "$lib/images/bg-democratic.png";
  import otherBackground from "$lib/images/bg-other.png";

  import {formatString} from '$lib/utils';
  import { getPartyForPoliticians } from '$lib/utils';
  import { stockTicker, etfTicker, cryptoTicker, screenWidth, numberOfUnreadNotification } from '$lib/store';
  import { onMount } from 'svelte';
  import defaultAvatar from '$lib/images/senator/default-avatar.png';
  import defaultLogo from '$lib/images/stocks/logo/default_logo.png';
	import UpgradeToPro from '$lib/components/UpgradeToPro.svelte';
  //  import * as XLSX from 'xlsx';

  export let data;
  
  let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;


  let rawData = data?.getPoliticianRSS;
  let slicedRawData = [];
  let displayList = [];
  let images = {};
  let isLoaded = false;
  let displayStructure = 'Table';
  let displayRows = 100;
  
  let filterList = [];
  
  let changeRowFilter = false;
  let changeRuleFilter = false;
  
  
  const rowList = [10, 20,50,100,200];
  
  async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && displayList?.length !== slicedRawData?.length) {
        const nextIndex = displayList?.length;
        const filteredNewResults = slicedRawData?.slice(nextIndex, nextIndex + 9);
        displayList = [...displayList, ...filteredNewResults];
    }
  }
  
  function changeRows(rows:Number) {
    changeRowFilter = true;
    displayRows= rows
  }
  function changeStructure() {
    if(displayStructure === 'Card') {
      displayStructure = 'Table';
    }
    else {
      displayStructure = 'Card';
    }
  }
  
  // Function to load images only when they are viewed
    async function loadImages() {
      const imageFiles = import.meta.glob('$lib/images/senator/*.png');
      const imagesPromises = [];
  
      for (const [path, resolver] of Object?.entries(imageFiles)) {
        const imageNameMatch = path.match(/\/([^/]+)\.png$/);
        if (imageNameMatch && imageNameMatch[1] !== 'default-avatar') {
          imagesPromises?.push(resolver()?.then(module => {
            images[imageNameMatch[1]] = module.default;
          }));
        }
      }
  
      await Promise.all(imagesPromises);
    }
  
  
  
  
    
  async function assetSelector(ticker, assetType)
      {    
        if(assetType === 'etf')
        {
          etfTicker.update(value => ticker);
          goto(`/etf/${ticker}`)
        }
        else if(assetType === 'stock') {
          stockTicker.update(value => ticker);
          goto(`/stocks/${ticker}`)
        }
        else if(assetType === 'crypto') {
          cryptoTicker.update(value => ticker);
          goto(`/crypto/${ticker}`)
        }
        
    }
    
  
      
  
  
  onMount(async () => {
    await loadImages();
    rawData?.forEach(item => {
      let representative = item?.representative || '';
  
      representative = representative?.replace('Jr', '')
          .replace(/Dr./g, '')
          .replace(/Dr_/g, '')
  
      const fullName = representative?.replace(/(\s(?:Dr\s)?\w(?:\.|(?=\s)))?\s/g, '_').trim();
      item.image = images[fullName] || defaultAvatar;
      item.representative = fullName?.replace(/_/g, ' ');
      });
  
      rawData = rawData?.map(item => {
          const party = getPartyForPoliticians(item?.representative);
          return {
              ...item,
              party: party
          };
    });

  
    slicedRawData = rawData?.slice(0,displayRows) ?? [];
    displayList = slicedRawData?.slice(0,20) ?? [];
    isLoaded = true;
  
    window.addEventListener('scroll', handleScroll);
      //window.addEventListener('keydown', handleKeyDown);
    
      return () => {
        // Cleanup the event listeners when the component is unmounted
        window.removeEventListener('scroll', handleScroll);
        //window.removeEventListener('keydown', handleKeyDown);
      };
  
  });
  
  
  function getAbbreviatedName(fullName) {
  
  if (fullName === null)
  {
    return '-';
  }
  
  const names = fullName?.split(' ');
  let firstName = names[0];
  // Remove any title prefix (e.g. Dr., Mr., Mrs., Ms.)
  if (names.length > 1 && /^(Dr|Mr|Mrs|Ms)\.?$/i.test(names[0])) {
    firstName = names[1];
    names?.splice(0, 1);
  }
  const initials = names?.slice(0, -1)?.map(name => name?.charAt(0))?.join('. ');
  const lastName = names[names?.length - 1];
  return `${firstName?.charAt(0)}. ${lastName}`;
  }
  
  const exportData = (format = 'csv') => {
      const data = slicedRawData;
      if (!data || data.length === 0) {
          return;
      }
  
      let properties = [
          { key: "disclosureDate", label: "Disclosure Date" },
          { key: "transactionDate", label: "Transaction Date" },
          { key: "owner", label: "Owner" },
          { key: "ticker", label: "Ticker" },
          { key: "assetDescription", label: "Asset Description" },
          { key: "type", label: "Type" },
          { key: "amount", label: "Amount" },
          { key: "representative", label: "Representative" },
          { key: "district", label: "District" },
          { key: "link", label: "Link" },
          { key: "capitalGainsOver200USD", label: "Capital Gains Over $200" },
          { key: "assetType", label: "Asset Type" },
          { key: "party", label: "Party" }
      ];
  
      // Create rows for CSV/Excel
      let rows = data?.map(item => properties?.map(property => item[property.key] || ""));
  
      // Include headers
      const headers = properties.map(prop => prop.label);
      rows.unshift(headers);
  
      // Check the format to export
      if (format.toLowerCase() === 'csv') {
          const csvContent = rows.map(row => row.join(",")).join("\n");
          const blob = new Blob([csvContent], { type: "data:text/csv;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "data.csv";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      } else if (format.toLowerCase() === 'excel') {
        /*
          const worksheet = XLSX.utils.aoa_to_sheet(rows);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
          XLSX.writeFile(workbook, "data.xlsx");
          */
      }
  };
  
  
  async function handleFilter(e, newFilter) {
    //e.preventDefault();
  
    changeRuleFilter = true;
    const filterSet = new Set(filterList);
  
    // Check if the new filter already exists in the list
    if (filterSet?.has(newFilter)) {
      // If it exists, remove it from the list
      filterSet?.delete(newFilter);
    } else {
      // If it doesn't exist, add it to the list
      filterSet?.add(newFilter);
  
    }
    filterList = Array?.from(filterSet);
    //console.log(filterList)
    changeRuleFilter = true;
  
  }
  
  
  function filterData(data) {
    const newData = data?.filter(item => {
  
      //Bought only nested conditions
      if (filterList?.includes("Bought") && item?.type === 'Bought' && !filterList?.includes("Democratic") && !filterList?.includes("Republican") && !filterList?.includes("Other") ) {
        return true;
      }
      //Sell only nested conditions
      if (filterList?.includes("Sold") && item?.type === 'Sold' && !filterList?.includes("Democratic") && !filterList?.includes("Republican") && !filterList?.includes("Other") ) {
        return true;
      }
  
      //Amount only nested conditions
      if (filterList?.includes('$1,001 - $15,000') && item?.amount === '$1,001 - $15,000') {
        return true;
      }
  
  
      //Democratic Party nested conditions
      if (filterList?.includes("Democratic") && item?.party && item?.party?.toLowerCase() === "democratic") {
        if(!filterList?.includes('Sold') && !filterList?.includes('Bought'))
        {
          return true;
        }
        
        else if (filterList?.includes("Democratic") && item?.party && item?.party?.toLowerCase() === "democratic" && filterList?.includes("Bought") && item?.type === 'Bought') {
          return true;
        }
  
        else if (filterList?.includes("Democratic") && item?.party && item?.party?.toLowerCase() === "democratic" && filterList?.includes("Sold") && item?.type === 'Sold') {
          return true;
        }
      }
      //Republican Party nested conditions
      if (filterList?.includes("Republican") && item?.party && item?.party?.toLowerCase() === "republican") {
        if(!filterList?.includes('Sold') && !filterList?.includes('Bought'))
        {
          return true;
        }
        else if (filterList.includes("Republican") && item?.party && item?.party?.toLowerCase() === "republican" && filterList?.includes("Bought") && item?.type === 'Bought') {
          return true;
        }
  
        else if (filterList.includes("Republican") && item?.party && item?.party?.toLowerCase() === "republican" && filterList?.includes("Sold") && item?.type === 'Sold') {
          return true;
        }
      }
  
      //Other Party nested conditions
      if (filterList?.includes("Other") && item?.party && item?.party?.toLowerCase() === "other") {
        if(!filterList?.includes('Sold') && !filterList?.includes('Bought'))
        {
          return true;
        }
        else if (filterList.includes("Other") && item?.party && item?.party?.toLowerCase() === "other" && filterList?.includes("Bought") && item?.type === 'Bought') {
          return true;
        }
  
        else if (filterList.includes("Other") && item?.party && item?.party?.toLowerCase() === "other" && filterList?.includes("Sold") && item?.type === 'Sold') {
          return true;
        }
      }
  
      else {
        return false;
      }
      
    });
  
    return newData
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
    
  
  
  $: {
    if( displayRows && changeRowFilter === true)
    {
      slicedRawData = rawData?.slice(0, displayRows);
    
      slicedRawData = filterList?.length !== 0 ? filterData(slicedRawData) : slicedRawData;
      slicedRawData = [...slicedRawData];
      displayList = slicedRawData?.slice(0,20) ?? [];
      displayList = [...displayList];
      
      changeRowFilter = false;
    }
  }
  
  
  $: {
    if(filterList && changeRuleFilter === true)
    {
      slicedRawData = rawData?.slice(0, displayRows);
      slicedRawData = filterList?.length !== 0 ? filterData(slicedRawData) : slicedRawData;
      slicedRawData = [...slicedRawData];
      displayList = slicedRawData?.slice(0,20) ?? [];
      displayList = [...displayList];
      changeRuleFilter = false;
      //console.log(slicedRawData?.length)
  
    }
  }

  
  </script>
  
  <!-- HEADER FOR BETTER SEO -->
  <svelte:head>
      <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Latest Congressional Trading · stocknear</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width" />
  
      <meta name="description" content="Find the latest congress trading and see what insiders who have access to regulations are investing.">
      <!-- Other meta tags -->
      <meta property="og:title" content="Latest Congressional Trading · stocknear"/>
      <meta property="og:description" content="Find the latest congress trading and see what insiders who have access to regulations are investing.">
      <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
      <meta property="og:type" content="website"/>
      <!-- Add more Open Graph meta tags as needed -->
  
      <!-- Twitter specific meta tags -->
      <meta name="twitter:card" content="summary_large_image"/>
      <meta name="twitter:title" content="Latest Congressional Trading · stocknear"/>
      <meta name="twitter:description" content="Find the latest congress trading and see what insiders who have access to regulations are investing.">
      <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
      <!-- Add more Twitter meta tags as needed -->
  </svelte:head>
  
  
  
  
  <section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-60">
      <!-- 
      <div class="text-sm breadcrumbs ml-4">
        <ul>
          <li><a href="/" class="text-gray-300">Home</a></li> 
          <li class="text-gray-300">Politicians</li>
        </ul>
      </div>
    -->
  
        <div class="w-full max-w-4xl m-auto sm:bg-[#202020] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
        
            <!-- Start Column -->
            <div>
              <div class="flex flex-row justify-center items-center">
                <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
                  Latest Trades of Politicians
                </h1>
              </div>
      
              <span class="hidden sm:block text-white text-md font-medium text-center flex justify-center items-center ">
                Gain from monitoring the latest trades of corrupt U.S. politicians
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
              
              
              <div class="z-1 absolute top-2 right-0">
                <img class="w-24 mr-8" src={cloudFrontUrl+"/assets/politician_logo.png"} alt="logo" loading="lazy">
              </div>
            </div>
            <!-- End Column -->
          </div>
      
         
      
      
        </div>
      
  
  
    <body class="w-full max-w-4xl overflow-hidden m-auto">
              
        
    {#if isLoaded}
  
              
      <section class="w-full max-w-4xl overflow-hidden m-auto  sm:mt-10">
        
        <div class="p-3 sm:p-0 flex justify-center w-full m-auto overflow-hidden max-w-4xl">
            <div class="relative flex justify-center items-center overflow-hidden w-full">
                <main class="w-full">
  
  
                <div class="w-full pb-3">
                  <div class="relative right-0 bg-[#0F0F0F]">
                    <ul class="relative grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-3 flex flex-wrap p-1 list-none rounded-[3px]">
                      <li class="pl-3 py-1.5 flex-auto text-center bg-[#2E3238] rounded-[3px]">
                        <label on:click={changeStructure}  class="cursor-pointer border flex items-center justify-center w-full px-0 py-1 mb-0 border-0 rounded-[3px] bg-inherit">
                          <span class="text-[0.75rem] sm:text-sm font-medium text-white ml-3">
                            Switch To: {displayStructure}
                          </span>
                          <svg class="ml-auto mr-5 h-4 w-4 inline-block transform transition-transform mr-2 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="#fff" d="m488.832 344.32l-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872l319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z"/></svg>
                        </label>
                      </li>
                      <li class="pl-3 py-1.5 flex-auto text-center bg-[#2E3238] rounded-[3px]">
                        <label for="filterList" class="cursor-pointer border flex items-center justify-center w-full px-0 py-1 mb-0 border-0 rounded-[3px] bg-inherit">
                          <span class="text-[0.75rem] sm:text-sm font-medium text-white ml-3">
                            Filter
                          </span>
                          <svg class="ml-auto mr-5 h-4 w-4 inline-block transform transition-transform mr-2 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="#fff" d="m488.832 344.32l-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872l319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z"/></svg>
                        </label>
                      </li>
                      <li class="pl-3 py-1.5 flex-auto text-center bg-[#2E3238] rounded-[3px]">
                        <label for="rowList" class="cursor-pointer border flex items-center justify-center w-full px-0 py-1 mb-0 border-0 rounded-[3px] bg-inherit">
                          <span class="text-[0.75rem] sm:text-sm font-medium text-white ml-3">
                            {displayRows} Rows
                          </span>
                          <svg class="ml-auto mr-5 h-4 w-4 inline-block transform transition-transform mr-2 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="#fff" d="m488.832 344.32l-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872l319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z"/></svg>
                        </label>
                      </li>
                      <!--
                      <li class="pl-3 py-1.5 flex-auto text-center bg-[#2E3238] rounded-[3px]">
                        <label for="exportDataModal" class="cursor-pointer border flex items-center justify-center w-full px-0 py-1 mb-0 border-0 rounded-[3px] bg-inherit">
                          <span class="text-[0.75rem] sm:text-sm font-medium text-white ml-3">
                            Export
                          </span>
                          <svg class="ml-auto mr-5 h-4 w-4 inline-block transform transition-transform mr-2 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="#fff" d="m488.832 344.32l-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872l319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z"/></svg>
                        </label>
                      </li>
                      -->
                    </ul>
                  </div>
                </div>
  
                  
                  <div class="w-full m-auto mt-4">
                    {#if displayStructure === 'Card'}
                      <div class="grid grid-cols-1 sm:grid-cols-2 sm:gap-5">
                            {#each displayList as item}
                              <label on:click={() => goto(`/politicians/${item?.id}`)} class="w-full cursor-pointer bg-[#202020] sm:hover:bg-[#000] transition-colors ease-in-out border sm:hover:border-[#000] {item?.party ==='Republican' ? 'sm:hover:shadow-[#80000D]' : 'sm:hover:shadow-[#1358C3]' } border-slate-800 shadow-md rounded-lg h-auto pb-4 pt-4 mb-7">
                                <div class="flex flex-col relative">
                                  {#if item?.party === 'Republican'}
                                  <img class="absolute -mt-4 w-full m-auto rounded-lg" src={republicanBackground} />
                                  {:else if item?.party === 'Democratic'}
                                    <img class="absolute -mt-4 w-[500px] m-auto rounded-lg"  src={democraticBackground} />
                                  {:else}
                                    <img class="absolute -mt-4 w-[500px] m-auto rounded-lg" src={otherBackground} />
                                  {/if}
                                  <div class="flex flex-col justify-center items-center rounded-2xl ">


                                    <div class="-mt-3 shadow-lg rounded-full border border-slate-600 w-20 h-20 relative {item?.party === 'Republican' ? 'republican-striped bg-[#98272B]' : item?.party === 'Democratic' ? 'democratic-striped bg-[#295AC7]' : 'bg-[#20202E]'} flex items-center justify-center">
                                      <img style="clip-path: circle(50%);" class="rounded-full w-16" src={item?.image} loading="lazy"/>
                                    </div>
                                    <span class="text-white text-lg font-medium mt-2 mb-2">
                                      {item?.representative?.replace('Dr','')}
                                    </span>
                                    <span class="text-white text-md mb-8">
                                      {item?.party ?? 'n/a'} {#if item?.district !== undefined && item?.district?.length !== 0} / {item?.district} {/if}
                                    </span>
  
                                  </div>
  
                                  <div class="flex flex-row items-center pr-4 pl-2">
                                    <div on:click|stopPropagation={() => assetSelector(item?.ticker, item?.assetType)} class="cursor-pointer shake-ticker rounded-full w-10 h-10 relative bg-[#20202E] flex items-center justify-center">
                                      <img style="clip-path: circle(50%);" class="w-6 h-6" src={item?.ticker?.length !== 0 ? `https://financialmodelingprep.com/image-stock/${item?.ticker}.png` : defaultLogo} loading="lazy"/>
                                    </div>
                                    <label on:click|stopPropagation={() => assetSelector(item?.ticker, item?.assetType)} class="cursor-pointer flex flex-col ml-2 w-40">
                                      <span class="text-blue-400 text-sm">{item?.ticker ?? '-'}</span>
                                      <span class="text-white font-medium text-sm">{item?.assetDescription.length > 20 ? formatString(item?.assetDescription.slice(0,20)) + "..." : formatString(item?.assetDescription)}</span>
                                    </label>
                
                                    <div class="flex flex-col justify-end items-end ml-auto">
                                      <span class="font-medium text-white">Owner</span>
                                      <span class="text-white text-opacity-[0.8] text-sm text-end">
                                        {item?.owner?.length !== 0 ? formatString(item?.owner) : '-'}
                                      </span>
                                    </div>
                                  </div>
  
                                  <div class="w-full mt-5 mb-5" />
              
                                  <div class="flex flex-row items-center pr-4 pl-4">
                                    <div class="flex flex-col w-40">
                                      <span class="font-medium text-white">Transaction Date</span>
                                      <span class="text-slate-300 text-sm">
                                        {new Date(item?.transactionDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                      </span>
                                    </div>
                
                                    <div class="flex flex-col justify-end items-end ml-auto">
                                      <span class="font-medium text-white">Disclosure Date</span>
                                      <span class="text-white text-opacity-[0.8] text-sm text-end">
                                        {new Date(item?.disclosureDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                      </span>
                                    </div>
                                  </div>
              
                                  <div class="w-full mt-5 mb-5" />
              
                                  <div class="flex flex-row items-center pr-4 pl-4">
                                    <div class="flex flex-col w-40">
                                      <span class="font-medium text-white">Amount</span>
                                      <span class="text-slate-300 text-sm font-medium">
                                        {item?.amount?.replace("$1,000,001 - $5,000,000","$1Mio - $5Mio")}
                                      </span>
                                    </div>
                
                                    <div class="flex flex-col justify-end items-end ml-auto">
                                      <span class="font-medium text-white">Type</span>
                                      <span class="text-white text-md text-end">
                                        {#if item?.type === 'Bought'}
                                          <span class="text-[#10DB06]">Bought</span>
                                        {:else if item?.type === 'Sold'}
                                          <span class="text-[#FF2F1F]">Sold</span>
                                        {/if}
                                      </span>
                                    </div>
                                  </div>
  
                                </div>
              
              
                              </label>
                            {/each}
  
                            <!--<InfiniteLoading on:infinite={infiniteHandler} />-->
                      </div>
  
                      {:else}
                      <div class="w-full m-auto rounded-none sm:rounded-lg mb-4 overflow-x-scroll sm:overflow-hidden">
                        <table class="table table-sm sm:table-md table-pin-cols table-compact rounded-none sm:rounded-md w-full bg-[#0F0F0F] border-bg-[#0F0F0F] m-auto">
                          <thead>
                            <tr class="bg-[#0F0F0F] border-b border-blue-400">
                              <th class="bg-[#0F0F0F] text-start bg-[#0F0F0F] text-white text-sm font-medium sm:font-semibold">
                                Person
                              </th>
                              <td class="text-start bg-[#0F0F0F] text-white text-sm font-medium sm:font-semibold">
                                Company
                              </td>
                              <td class="text-end bg-[#0F0F0F] text-white text-sm font-medium sm:font-semibold">
                                Transaction
                              </td>
                              <td class="text-end bg-[#0F0F0F] text-white text-sm font-medium sm:font-semibold">
                                Disclosure
                              </td>
                              <td class="text-center bg-[#0F0F0F] text-white text-sm font-medium sm:font-semibold">
                                Amount
                              </td>
                              <td class="text-white text-end text-sm font-medium sm:font-semibold">Type</td>
                            </tr>
                          </thead>
                          <tbody>
                            {#each displayList as item, index}
                            <tr on:click={() => goto(`/politicians/${item?.id}`)} class="cursor-pointer text-gray-200 odd:bg-[#202020] border-b-[#0F0F0F] {index+1 === rawData?.length && data?.user?.tier !== 'Pro' ? 'opacity-[0.1]' : ''}">
                            
                              <th class="{index % 2 ? 'bg-[#0F0F0F]' : 'bg-[#202020]'} text-gray-200 ">
                                <div class="flex flex-row items-center">
                                  <div class="flex-shrink-0 rounded-full border border-slate-700 w-9 h-9 relative {item?.party === 'Republican' ? 'bg-[#98272B]' : item?.party === 'Democratic' ? 'bg-[#295AC7]' : 'bg-[#4E2153]'} flex items-center justify-center">
                                    <img style="clip-path: circle(50%);" class="rounded-full w-7" src={item?.image} loading="lazy"/>
                                  </div>
                                  <div class="flex flex-col ml-3 text-xs sm:text-sm font-normal">
                                    <span class="text-white">{getAbbreviatedName(item?.representative?.replace('_',' '))}</span>
                                    <span class="text-white text-opacity-60">{item?.party}</span>
                                  </div>
                                </div>
                                <!--{item?.firstName} {item?.lastName}-->
                              </th>
                              
  
                              <td on:click|stopPropagation={() => assetSelector(item?.ticker, item?.assetType)} class="cursor-pointer text-start text-xs sm:text-sm text-blue-400">
                                <div class="flex flex-col items-start">
                                  <span class="text-blue-400">{item?.ticker?.length !== 0 ? item?.ticker : '-'}</span>
                                  <span class="text-white">{item?.assetDescription.length > charNumber ? formatString(item?.assetDescription.slice(0,charNumber)) + "..." : formatString(item?.assetDescription)?.replace("- Common Stock", "")?.replace("Common Stock", "")}</span>
                                </div>
                              </td>
  
                                <td class="text-end text-xs sm:text-sm text-white w-32">
                                    {new Date(item?.transactionDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                </td>

                                <td class="text-end text-xs sm:text-sm text-white w-32">
                                  {new Date(item?.disclosureDate)?.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', daySuffix: '2-digit' })}
                                </td>
  
                                <td class="text-center text-xs sm:text-sm text-white w-32">
                                    {item?.amount?.replace("$1,000,001 - $5,000,000","$1Mio - $5Mio")}
                                </td>
                                <td class="text-start text-xs text-end sm:text-sm text-white">
                                  {#if item?.type === 'Bought'}
                                    <span class="text-[#10DB06]">Bought</span>
                                  {:else if item?.type === 'Sold'}
                                    <span class="text-[#FF2F1F]">Sold</span>
                                  {/if}
                                </td>
                            </tr>
                          {/each}
                          </tbody>
                        </table>
                    </div>
                    <!--<InfiniteLoading on:infinite={infiniteHandler} />-->
                      {/if}

                      <UpgradeToPro data={data} title="Track the latest trades of corrupt US Politicians"/>

  
                  </div>
                
                </main>
            </div>
        </div>
      </section>
      {:else}
      <div class="flex justify-center items-center m-auto relative w-[100px]">
        <div class="loader">Loading...</div>
      </div>
  
      {/if}
          
  </body>
          
          
      
  </section>
  
  
  
  
  
  
  
  <!--Start Rows-->
  <input type="checkbox" id="rowList" class="modal-toggle" />
      
  <dialog id="rowList" class="modal modal-bottom sm:modal-middle ">
  
  
    <label id="rowList" for="rowList"  class="cursor-pointer modal-backdrop bg-[#fff] bg-opacity-[0.05] sm:bg-[#000] sm:bg-opacity-[0.5]"></label>
    
    
    <div class="modal-box w-full bg-[#000] sm:bg-[#202020] sm:border sm:border-slate-800">
  
      <h3 class="text-white text-2xl font-bold">
        Rows
      </h3>
  
    <label for="rowList" class="sm:hidden cursor-pointer absolute right-5 top-2 bg-[#000] sm:bg-[#202020] text-[1.8rem] text-white">
      ✕
    </label>
  
      <div class="text-white mt-10">
  
        <div class="flex flex-col items-center w-full max-w-3xl bg-[#000] sm:bg-[#202020]">
  
          {#each rowList as rows}
            <label on:click={() => changeRows(rows)} for="rowList" class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
  
                <div class="flex flex-row items-center w-full bg-[#202020] bg-opacity-[0.7] sm:bg-opacity-[1.0] sm:bg-[#303030] p-3 rounded-lg {rows === displayRows ? 'ring-2 ring-[#04E000]' : ''}">
                  
                  <div class="flex flex-col items-center w-full">
                    <span class="ml-1 text-white font-medium mr-auto">
                      {rows} Rows
                    </span>
                  </div>
                 
  
                  <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                    {#if rows === displayRows}
                      <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                    {/if}
                  </div>
  
                </div>
              
            </label>
          {/each}
  
        </div>
         
      </div>
  
  
          
        </div>
    </dialog>
  <!--End Rows-->
      
  
  
  
    <!--Start Export -->
  <input type="checkbox" id="exportDataModal" class="modal-toggle" />    
    <dialog id="exportDataModal" class="modal modal-bottom sm:modal-middle ">
    
    
      <label id="exportDataModal" for="exportDataModal"  class="cursor-pointer modal-backdrop bg-[#fff] bg-opacity-[0.02] sm:bg-[#000] sm:bg-opacity-[0.5]"></label>
      
      
      <div class="modal-box w-full bg-[#000] sm:bg-[#202020] sm:border sm:border-slate-800">
    
    
    
      <label for="exportDataModal" class="cursor-pointer absolute right-5 top-2 bg-[#000] sm:bg-[#202020] text-[1.8rem] text-white">
        ✕
      </label>
    
        <div class="text-white">
          
          <h3 class="font-medium text-lg sm:text-xl mb-10">
            Export
          </h3>
            
    
          <div class="flex flex-col items-center w-full max-w-3xl bg-[#000] sm:bg-[#202020]">
    
    
            <label for="exportDataModal" on:click={() => exportData('excel')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
    
                <div class="flex flex-row items-center w-full bg-[#202020] bg-opacity-[0.7] sm:bg-opacity-[1.0] sm:bg-[#303030] p-3 rounded-lg ring-2 ring-[#04E000]">
                  
                  <span class="ml-1 text-white font-medium mr-auto">
                    Export to Excel
                  </span>
    
                </div>
               
            </label>
    
    
            <label for="exportDataModal" on:click={() => exportData('csv')} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
    
              <div class="flex flex-row items-center w-full bg-[#202020] bg-opacity-[0.7] sm:bg-opacity-[1.0] sm:bg-[#303030] p-3 rounded-lg ring-2 ring-[#04E000]">
                
                <span class="ml-1 text-white font-medium mr-auto">
                  Export to CSV
                </span>
  
              </div>
             
          </label>
  
    
          </div>
           
        </div>
    
    
            
          </div>
    </dialog>
  <!--End Export-->
  
  
  {#if $screenWidth >= 640}
  <!--Start View All List-->
  <input type="checkbox" id="filterList" class="modal-toggle" />
      
  <dialog id="filterList" class="modal modal-bottom sm:modal-middle">
  
  
    <label id="filterList" for="filterList" class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
    
    
    <div class="modal-box w-full bg-[#202020] sm:border sm:border-slate-800 max-h-[600px] overflow-y-scroll">
  
  
    <label for="filterList" class="cursor-pointer absolute right-5 top-2 bg-[#202020] text-[1.8rem] text-white">
      ✕
    </label>
  
      <div class="text-white mt-5 pb-5">
  
        <div class="flex flex-col items-center justify-start">
          <!--Start Political Party-->
          <div class="grid grid-cols-2 mt-4 w-full ml-auto mt-4">
            <div class="mb-4 mr-auto">
              <h2 class="text-xl sm:text-2xl text-white font-bold mb-3">Political Party</h2>
              <ul class="space-y-1 ">
                <li class="mb-2 cursor-pointer">
                  <label on:click|stopPropagation={(event) => handleFilter(event,'Democratic')} class="cursor-pointer flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                    <input checked={filterList?.includes('Democratic')} type="checkbox" class="cursor-pointer bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                    <label class="text-white text-md cursor-pointer">Democratic</label>
                  </label>
                </li>
                  <li class="mb-2 cursor-pointer">
                    <label on:click|stopPropagation={(event) => handleFilter(event,'Republican')} class="cursor-pointer flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                      <input checked={filterList?.includes('Republican')} type="checkbox" class="cursor-pointer bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                      <label class="text-white text-md cursor-pointer">Republican</label>
                    </label>
                  </li>
              </ul>
            </div>
              <!-- Column 2 -->
              <div class="mt-11">
                <ul class="space-y-1 ">
                  <li class="mb-2 cursor-pointer">
                    <label on:click|stopPropagation={(event) => handleFilter(event,'Other')} class="cursor-pointer flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                      <input checked={filterList?.includes('Other')} type="checkbox" class="cursor-pointer bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                      <label class="text-white text-md cursor-pointer">Other</label>
                    </label>
                  </li>
                  <!-- ...other list items -->
                </ul>
              </div>
          </div>
          <!--End Political Party-->
      
          <!--Start Transaction Type-->
          <div class="grid grid-cols-2 w-full ml-auto mt-4">
            <div class="mb-4 mr-auto">
              <h2 class="text-xl sm:text-2xl text-white font-bold mb-3">Transaction Type</h2>
              <ul class="space-y-1">
                <li class="mb-2 cursor-pointer">
                  <label on:click|stopPropagation={(event) => handleFilter(event,'Bought')} class="cursor-pointer flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                    <input checked={filterList?.includes('Bought')} type="checkbox" class="cursor-pointer bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                    <label class="text-white text-md cursor-pointer">Bought</label>
                  </label>
                </li>
              </ul>
            </div>
              <!-- Column 2 -->
              <div class="mt-11">
                <ul class="space-y-1">
                  <li class="mb-2 cursor-pointer">
                    <label on:click|stopPropagation={(event) => handleFilter(event,'Sold')} class="cursor-pointer flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                      <input checked={filterList?.includes('Sold')} type="checkbox" class="cursor-pointer bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                      <label class="text-white text-md cursor-pointer">Sold</label>
                    </label>
                  </li>
                  <!-- ...other list items -->
                </ul>
              </div>
          </div>
      
          <!--End Transaction Type-->
      
      
           <!--Start Trade Size-->
           <!--
           <div class="grid grid-cols-2 w-full ml-auto mt-4">
            <div class="mb-4 mr-auto">
              <h2 class="text-xl sm:text-2xl text-white font-bold mb-3">Trade Size</h2>
              <ul class="space-y-1 ">
                  <li class="mb-2 cursor-pointer">
                    <label for="upTo15K" on:click|stopPropagation={(event) => handleFilter(event, '$1,001 - $15,000')} class="cursor-pointer flex w-full items-center space-x-2 py-1.5 lg:space-x-1.5 lg:py-[5px]">
                      <input id="upTo15K" checked={filterList?.includes('$1,001 - $15,000')} type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                      <span class="text-white text-md">$1K-$15K</span>
                    </label>
                  </li>
  
                  <li class="mb-2 cursor-pointer">
                    <label for="upTo50K" class="cursor-pointer flex w-full items-center space-x-2 py-1.5 lg:space-x-1.5 lg:py-[5px]">
                      <input id="upTo50K" type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                      <span class="text-white text-md">$15K-$50K</span>
                    </label>
                  </li>
                  
                  <li class="mb-2 cursor-pointer">
                    <label for="upTo100K" class="cursor-pointer flex w-full items-center space-x-2 py-1.5 lg:space-x-1.5 lg:py-[5px]">
                      <input id="upTo100K" type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                      <span class="text-white text-md">$50K-$100K</span>
                    </label>
                  </li>
  
                  <li class="mb-2 cursor-pointer">
                    <label for="upTo250K" class="cursor-pointer flex w-full items-center space-x-2 py-1.5 lg:space-x-1.5 lg:py-[5px]">
                      <input id="upTo250K" type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                      <span class="text-white text-md">$100K-$250K</span>
                    </label>
                  </li>
              </ul>
            </div>
              -- Column 2 -
              <div class="mt-10">
                <ul class="space-y-1 ">
                  <li class="mb-2 cursor-pointer">
                    <label for="upTo500K" class="cursor-pointer flex w-full items-center space-x-2 py-1.5 lg:space-x-1.5 lg:py-[5px]">
                      <input id="upTo500K" type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                      <span class="text-white text-md">$100K-$500K</span>
                    </label>
                  </li>
  
                  <li class="mb-2 cursor-pointer">
                    <label for="from250KTo500K" class="cursor-pointer flex w-full items-center space-x-2 py-1.5 lg:space-x-1.5 lg:py-[5px]">
                      <input id="from250KTo500K" type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                      <span class="text-white text-md">$250K-$500K</span>
                    </label>
                  </li>
  
                  <li class="mb-2 cursor-pointer">
                    <label for="from500KTo1M" class="cursor-pointer flex w-full items-center space-x-2 py-1.5 lg:space-x-1.5 lg:py-[5px]">
                      <input id="from500KTo1M" type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                      <span class="text-white text-md">$500K-$1M</span>
                    </label>
                  </li>
  
                  <li class="mb-2 cursor-pointer">
                    <label for="over1M" class="cursor-pointer flex w-full items-center space-x-2 py-1.5 lg:space-x-1.5 lg:py-[5px]">
                      <input id="over1M" type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                      <span class="text-white text-md">Over $1M</span>
                    </label>
                  </li>
  
                </ul>
              </div>
          </div>
        -->
          <!--End Trade Size-->
      
      
          </div>
         
      </div>
  
  
          
        </div>
    </dialog>
  <!--End View All List-->
  {:else}
  <div class="drawer drawer-end z-40 overflow-hidden w-screen">
    <input id="filterList" type="checkbox" class="drawer-toggle"/>
    <div class="drawer-side overflow-y-scroll overflow-hidden">
    
        
      <div class="bg-[#000] min-h-screen w-screen pb-20 overflow-y-scroll overflow-hidden">
  
          <label for="filterList" class="absolute left-6 top-6">
            <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
          </label>
  
    
  <div class="w-screen overflow-y-scroll" >
  
  
  <div class="space-y-3 sm:pt-5">  
    
    <div class="bg-[#000] h-auto w-screen">
    
      <!--Start Header-->
      <div class="bg-[#000] w-full p-1 flex flex-col items-center pb-10 h-auto">
        <h2 class="text-center m-auto text-[1.1rem] font-medium text-white mt-5">
          Filter List
        </h2>
  
        </div>
      <!--End Header-->
  
      <div class="flex flex-col items-center justify-center">
      <!--Start Political Party-->
      <div class="grid grid-cols-2 mt-4 w-11/12 ml-auto mt-4">
        <div class="mb-4 mr-auto">
          <h2 class="text-xl sm:text-2xl text-white font-bold mb-3">Political Party</h2>
          <ul class="space-y-1 ">
            <li class="mb-2 cursor-pointer">
              <label on:click|stopPropagation={(event) => handleFilter(event,'Democratic')} class="flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                <input checked={filterList?.includes('Democratic')} type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                <label class="text-white text-md">Democratic</label>
              </label>
            </li>
              <li class="mb-2 cursor-pointer">
                <label on:click|stopPropagation={(event) => handleFilter(event,'Republican')} class="flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                  <input checked={filterList?.includes('Republican')} type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                  <label class="text-white text-md">Republican</label>
                </label>
              </li>
          </ul>
        </div>
          <!-- Column 2 -->
          <div class="mt-10">
            <ul class="space-y-1 ">
              <li class="mb-2 cursor-pointer">
                <label on:click|stopPropagation={(event) => handleFilter(event,'Other')} class="flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                  <input checked={filterList?.includes('Other')} type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                  <span class="text-white text-md">Other</span>
                </label>
              </li>
              <!-- ...other list items -->
            </ul>
          </div>
      </div>
      <!--End Political Party-->
  
      <!--Start Transaction Type-->
      <div class="grid grid-cols-2 w-11/12 ml-auto mt-4">
        <div class="mb-4 mr-auto">
          <h2 class="text-xl sm:text-2xl text-white font-bold mb-3">Transaction Type</h2>
          <ul class="space-y-1">
            <li class="mb-2 cursor-pointer">
              <label on:click|stopPropagation={(event) => handleFilter(event,'Bought')} class="flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                <input checked={filterList?.includes('Bought')} type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                <label class="text-white text-md">Bought</label>
              </label>
            </li>
          </ul>
        </div>
          <!-- Column 2 -->
          <div class="mt-10">
            <ul class="space-y-1 ">
              <li class="mb-2 cursor-pointer">
                <label on:click|stopPropagation={(event) => handleFilter(event,'Sold')} class="flex w-full items-center space-x-2 py-2 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                  <input checked={filterList?.includes('Sold')} type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                  <label class="text-white text-md">Sold</label>
                </label>
              </li>
              <!-- ...other list items -->
            </ul>
          </div>
      </div>
  
      <!--End Transaction Type-->
  
  
       <!--Start Trade Size-->
       <!--
       <div class="grid grid-cols-2 w-11/12 ml-auto mt-4">
        <div class="mb-4 mr-auto">
          <h2 class="text-xl sm:text-2xl text-white font-bold mb-3">Trade Size</h2>
          <ul class="space-y-1 ">
              <li class="mb-2 cursor-pointer">
                <div class="flex w-full items-center space-x-2 py-1.5 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                  <input id="marketCap" type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                  <label for="marketCap" class="text-white text-md">$1K-$15K</label>
                </div>
              </li>
  
              <li class="mb-2 cursor-pointer">
                <div class="flex w-full items-center space-x-2 py-1.5 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                  <input id="marketCap" type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                  <label for="marketCap" class="text-white text-md">$15K-$50K</label>
                </div>
              </li>
  
              <li class="mb-2 cursor-pointer">
                <div class="flex w-full items-center space-x-2 py-1.5 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                  <input id="marketCap" type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                  <label for="marketCap" class="text-white text-md">$50K-$100K</label>
                </div>
              </li>
  
              <li class="mb-2 cursor-pointer">
                <div class="flex w-full items-center space-x-2 py-1.5 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                  <input id="marketCap" type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                  <label for="marketCap" class="text-white text-md">$100K-$250K</label>
                </div>
              </li>
  
          </ul>
        </div>
          -- Column 2 --
          <div class="mt-10">
            <ul class="space-y-1 ">
              <li class="mb-2 cursor-pointer">
                <div class="flex w-full items-center space-x-2 py-1.5 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                  <input id="marketCap" type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                  <label for="marketCap" class="text-white text-md">$100K-$500K</label>
                </div>
              </li>
              <li class="mb-2 cursor-pointer">
                <div class="flex w-full items-center space-x-2 py-1.5 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                  <input id="marketCap" type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                  <label for="marketCap" class="text-white text-md">$250K-$500K</label>
                </div>
              </li>
              <li class="mb-2 cursor-pointer">
                <div class="flex w-full items-center space-x-2 py-1.5 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                  <input id="marketCap" type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                  <label for="marketCap" class="text-white text-md">$500K-$1M</label>
                </div>
              </li>
              <li class="mb-2 cursor-pointer">
                <div class="flex w-full items-center space-x-2 py-1.5 md:w-1/2 lg:w-1/3 lg:space-x-1.5 lg:py-[5px]">
                  <input id="marketCap" type="checkbox" class="bg-[#2E3238] h-[18px] w-[18px] rounded-sm ring-offset-0 dark:bg-dark-600 lg:h-4 lg:w-4" />
                  <label for="marketCap" class="text-white text-md">Over $1M</label>
                </div>
              </li>
            </ul>
          </div>
      </div>
      -->
      <!--End Trade Size-->
  
  
      </div>
    
  
      
      </div>
      </div>
      </div>
      </div>
    </div>
  </div>
  {/if}

<style>
  .republican-striped {
    background-image: repeating-linear-gradient(
        -45deg,
        #98272B,
        #98272B 10px,
        #840412 10px,
        #840412 20px
    );
}

.democratic-striped {
    background-image: repeating-linear-gradient(
        -45deg,
        #295AC7,
        #295AC7 10px,
        #164D9D 10px,
        #164D9D 20px
    );
}
</style>