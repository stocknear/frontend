<script lang='ts'>

  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { abbreviateNumber, formatDate } from '$lib/utils';
  import StockSlider from '$lib/components/StockSlider.svelte';
  import InfoModal from '$lib/components/InfoModal.svelte';

  import { screenWidth, numberOfUnreadNotification} from '$lib/store';



  export let data;

  let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;

  const rawData = data?.getDailyGainerLoserActive;
  const rssFeedWIIM = data?.getRssFeedWIIM;



  let gainer = rawData?.gainers['1D']?.slice(0,5);
  let loser = rawData?.losers['1D']?.slice(0,5);
  let active = rawData?.active['1D']?.slice(0,5);
  let sliderList = rawData?.active['1D'];

  let gainerLoserTickers = [];
  let showLoser = false;
  let buttonText = 'Top Winners';

  let trendingText = 'gainer';
  gainerLoserTickers = gainer;

function scrollToItem(state) {
  trendingText = state;
  
  const item = document?.getElementById('start-trending-slider');
  if (item) {
    item?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'start' });
  }
  
}



  function handleClick() {
    showLoser = !showLoser;
    buttonText = showLoser ? 'Top Losers' : 'Top Winners';
    
    if(showLoser)
    {
      gainerLoserTickers = loser;
    }
    else {
      gainerLoserTickers = gainer;
    }


  }


function latestInfoDate(inputDate) {
    // Convert the input date string to milliseconds since epoch
    const inputDateMs = Date?.parse(inputDate);

    // Get today's date in milliseconds since epoch
    const todayMs = Date?.now();

    // Calculate the difference in milliseconds
    const differenceInMs = todayMs - inputDateMs;

    // Convert milliseconds to days
    const differenceInDays = Math?.floor(differenceInMs / (1000 * 60 * 60 * 24));

    // Return the difference in days
    return differenceInDays <=1;
}



let Feedback;

onMount( async() => {
    Feedback = (await import('$lib/components/Feedback.svelte')).default   
})



</script>
  
  


<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Free Stock Analysis Information for Small Investors · stocknear
  </title>

  <meta name="description" content="Stocknear has everything you need to analyze stocks with help of AI, including detailed financial data, statistics, news and charts.">
  <!-- Other meta tags -->
  <meta property="og:title" content="Free Stock Analysis Information for Small Investors · stocknear"/>
  <meta property="og:description" content="Stocknear has everything you need to analyze stocks with help of AI, including detailed financial data, statistics, news and charts."/>
  <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="Free Stock Analysis Information for Small Investors · stocknear"/>
  <meta name="twitter:description" content="Stocknear has everything you need to analyze stocks with help of AI, including detailed financial data, statistics, news and charts."/>
  <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>



<div class="w-full max-w-5xl overflow-hidden m-auto min-h-screen bg-[#0F0F0F]">



  <div class=" m-auto flex flex-wrap flex-col justify-center items-center md:flex-row sm:px-5">
    <!--Left Col-->

    
    
    <div class="flex flex-col w-full max-w-6xl justify-center items-center">
      <div class="text-center mb-10 w-full">                
        <!---Start-Autocomplete-Searchbar-->
        {#if sliderList?.length !== 0}
        <StockSlider sliderList={sliderList}/>
        {/if}

        {#if Feedback}
          <Feedback data={data} />
        {/if}
        <section>
          <div class="relative w-full max-w-6xl mx-auto overflow-hidden">

            <!--
            <div class="overflow-hidden overflow-x-hidden w-auto">
              <Snow />
            </div>
            -->

            
            
              <div class="w-full max-w-3xl m-auto flex justify-center overflow-hidden">
                  <div class="py-7">
    
                      <!-- Section content -->
                      <div class="relative m-auto">
      
                          <!-- Section header -->
                          <div class="h-auto">
                            
                            <div class="w-full sm:rounded-xl h-auto p-5 sm:p-10 mt-3">
                              <div class="grid grid-cols-1 gap-10">
                            
                                <!-- Start Column -->
                                <div >

                                <!--
                                  <div class="text-center mb-5 relative w-fit flex justify-center m-auto">
                                    <a href="/politicians" class="text-white antialiased bg-[#202020] w-full px-3 py-1.5 rounded-xl m-auto font-medium text-sm">
                                      <svg class="w-8 h-8 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><path fill="#fff" d="M5 17h62v38H5z"/><path fill="#d22f27" d="M5 17h62v5H5zm0 9h62v4H5zm0 8h62v4H5z"/><path fill="#1e50a0" d="M5 17h32v21H5z"/><path fill="#d22f27" d="M5 42h62v4H5z"/><circle cx="9" cy="22" r="1.75" fill="#fff"/><circle cx="17" cy="22" r="1.75" fill="#fff"/><circle cx="25" cy="22" r="1.75" fill="#fff"/><circle cx="33" cy="22" r="1.75" fill="#fff"/><circle cx="29" cy="26" r="1.75" fill="#fff"/><circle cx="21" cy="26" r="1.75" fill="#fff"/><circle cx="13" cy="26" r="1.75" fill="#fff"/><circle cx="9" cy="30" r="1.75" fill="#fff"/><circle cx="17" cy="30" r="1.75" fill="#fff"/><circle cx="25" cy="30" r="1.75" fill="#fff"/><circle cx="33" cy="30" r="1.75" fill="#fff"/><circle cx="29" cy="34" r="1.75" fill="#fff"/><circle cx="21" cy="34" r="1.75" fill="#fff"/><circle cx="13" cy="34" r="1.75" fill="#fff"/><path fill="#d22f27" d="M5 50h62v5H5z"/><path fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 17h62v38H5z"/></svg>
                                      Analyze Congressional Trading using our latest Database.
                                    </a>
                                    <div class="absolute top-[-2.0rem] -right-5 sm:-right-10 rotate-[7deg]">
                                      <span class="bg-[#EF4444] text-white text-sm sm:text-[0.9rem] rounded-xl font-medium sm:me-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                                        New
                                      </span>
                                    </div>
                                  </div>
                                -->
                                  



                                  <div class="flex flex-row justify-center items-center">
                                    <h1 class="text-center text-5xl sm:text-7xl text-primary/100 font-bold font-mono mb-6 w-full">
                                      Open Source
                                      <br>
                                      <span class="text-3xl sm:text-4xl">ML Stock Analysis Platform</span>
                                    </h1>
                                  </div>


                                   <!-- Start Image -->
                                   <!--
                                <div class="ml-2 m-auto flex justify-center items-center w-full">
                                    <img class="w-36 sm:w-44 m-auto mt-2 mb-8" src={cloudFrontUrl+"/assets/wsb_praising_logo.png"} alt="logo">
                                </div>
                                -->
                                  <!-- End Image -->
                                  
                                  <span class="text-center flex justify-center items-center text-slate-200 text-[1rem] sm:text-lg">
                                    Analyze over 10,000 companies in one place, exploring stock prices, options contracts, news, price predictions, charts, memes, and more!
                                  </span>
                                  
                                    
                                    <!-- Start Search button -->
                                    
                                    <div id="step-search" class="flex justify-center items-center mt-8 mb-6">
                                      <label for="searchBarModal" class="shadow-lg w-96 h-10 sm:h-12 flex flex-row items-center justify-start bg-[#202327] appearance-none py-3 cursor-pointer border border-slate-600 rounded-lg">
                                          <svg class="w-4 h-4 shrink-0 ml-3 sm:ml-5 text-white inline-block" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5zm8.707 12.293a.999.999 0 11-1.414 1.414L11.9 13.314a8.019 8.019 0 001.414-1.414l2.393 2.393z" fill="currentColor"></path>
                                          </svg>
                                          <span class="text-sm sm:text-lg text-slate-200 ml-3">
                                            Explore Stocks and ETF's...
                                          </span>
                                      </label>
                                     </div>
                                     
                                    
                                    
                                  <!-- End Search button -->
  
                                    <!-- Ticker Logos -->
                                    {#if active?.length !== 0}
                                    <div class="w-auto m-auto flex flex-row items-center justify-center mt-6 text-[1rem] sm:text-lg">
                                      <span class="text-center text-slate-100">
                                        Trending:
                                      </span>
                                      {#each active?.slice(0,4) as item, index}
                                        <a href={'/stocks/'+item?.symbol} class="ml-1 text-blue-400 sm:hover:text-slate-100">
                                          {item?.symbol}
                                        </a>
                                        {#if index !== 3}
                                        <span class="text-blue-400">,</span>
                                        {/if}
                                      {/each}
                                    </div>
                                    {/if}

                                     
              
                                </div>
                                <!-- End Column -->
                            

                            
                              </div>
                            </div>


                      </div>
      
                  </div>
              </div>
      
          </div>

  <div class="w-full max-w-3xl m-auto mb-20 -mt-4 flex justify-center items-center">
    <a href="/community" class="px-4 py-3 text-white bg-[#202327] rounded-lg flex flex-row items-center font-medium transition duration-150 ease-in-out group">
     <span>Follow the Community </span>
      <span class="ml-1 mt-0.5 tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out">
        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(90 12 12)"><g fill="none"><path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"/><path fill="white" d="M13.06 3.283a1.5 1.5 0 0 0-2.12 0L5.281 8.939a1.5 1.5 0 0 0 2.122 2.122L10.5 7.965V19.5a1.5 1.5 0 0 0 3 0V7.965l3.096 3.096a1.5 1.5 0 1 0 2.122-2.122L13.06 3.283Z"/></g></g></svg>
    </span>
    </a>
  </div>
  
  
  <!--Start what we offer-->
<!--
  <div class="hidden w-full max-w-3xl m-auto mb-20 flex justify-center items-center">

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-5">

      <a href="/stocks/NVDA" class="shadow-lg bg-[#202020] flex w-40 h-24 sm:h-32 items-center justify-center rounded-lg sm:rounded-2xl cursor-pointer">
        <div class="flex flex-col items-center">
          <svg class="inline block h-7 w-7 sm:h-9 sm:w-9" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img"  preserveAspectRatio="xMidYMid meet" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#A0041E" d="M1 17l8-7l16 1l1 16l-7 8s.001-5.999-6-12s-12-6-12-6z"></path><path fill="#FFAC33" d="M.973 35s-.036-7.979 2.985-11S15 21.187 15 21.187S14.999 29 11.999 32c-3 3-11.026 3-11.026 3z"></path><circle fill="#FFCC4D" cx="8.999" cy="27" r="4"></circle><path fill="#55ACEE" d="M35.999 0s-10 0-22 10c-6 5-6 14-4 16s11 2 16-4c10-12 10-22 10-22z"></path><path d="M26.999 5a3.996 3.996 0 0 0-3.641 2.36A3.969 3.969 0 0 1 24.999 7a4 4 0 0 1 4 4c0 .586-.133 1.139-.359 1.64A3.993 3.993 0 0 0 30.999 9a4 4 0 0 0-4-4z" fill="#0F0F0F000"></path><path fill="#A0041E" d="M8 28s0-4 1-5s13.001-10.999 14-10s-9.001 13-10.001 14S8 28 8 28z"></path></g></svg>
          <span class="text-md text-white mt-2 font-medium">
            Stock Analysis
          </span>
        </div>
      </a>

      <a href="/stock-screener" class="shadow-lg bg-[#202020] flex w-40 h-24 sm:h-32 items-center justify-center rounded-lg sm:rounded-2xl cursor-pointer">
        <div class="flex flex-col items-center">
          <svg class="inline block h-7 w-7 sm:h-9 sm:w-9" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 377.13 377.13" xml:space="preserve" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <polygon style="fill:#C11F1F;" points="287.815,343.64 287.815,372.13 35.825,372.13 35.825,343.64 66.575,343.64 165.715,343.64 257.065,343.64 "></polygon> <path style="fill:#F73E3E;" d="M190.075,156.22c49.9,49.89,111.55,69.32,138.52,43.89c-31.98,31.49-75.71,43.65-116.27,36.33 c-16.38-2.94-32.25-9.07-46.61-18.4c-7.34-4.74-14.28-10.33-20.7-16.75c-4.71-4.71-8.98-9.71-12.79-14.93 c-36.78-50.34-31.97-122.01,13.96-168.65C120.755,44.68,140.185,106.32,190.075,156.22z"></path> <path style="opacity:0.25;enable-background:new ;" d="M312.453,213.7c-29.71,21.28-66.04,28.89-100.13,22.74 c-16.38-2.94-32.25-9.07-46.61-18.4c-7.34-4.74-14.28-10.33-20.7-16.75c-4.71-4.71-8.98-9.71-12.79-14.93 c-32.76-44.84-32.52-106.59,0.38-152.51c-10.48,42.3-2.59,87.89,23.79,123.99c4.41,6.04,9.35,11.82,14.8,17.27 c7.43,7.43,15.46,13.9,23.95,19.38c16.61,10.8,34.97,17.89,53.93,21.29C269.983,219.55,291.613,218.851,312.453,213.7z"></path> <path style="fill:#FCBC1D;" d="M286.225,60.08c50.37,50.37,69.69,112.73,43.14,139.28c-0.26,0.26-0.51,0.51-0.77,0.75 c-26.97,25.43-88.62,6-138.52-43.89c-49.89-49.9-69.32-111.54-43.89-138.51c0.24-0.26,0.49-0.51,0.75-0.77 C173.485-9.61,235.845,9.7,286.225,60.08z M262.805,115.54c8.85-8.85,8.85-23.19,0-32.04c-8.85-8.85-23.2-8.85-32.05,0 s-8.85,23.19,0,32.04S253.955,124.39,262.805,115.54z"></path> <path style="opacity:0.25;enable-background:new ;" d="M286.225,60.081c-50.38-50.38-112.74-69.69-139.29-43.14 c-0.26,0.26-0.51,0.51-0.75,0.77c-7.33,7.77-10.93,18.42-11.15,30.83c30.69-0.56,72.17,19.51,107.7,55.04 c35.52,35.52,55.6,77,55.04,107.68c12.41-0.23,23.05-3.83,30.82-11.15c0.26-0.24,0.51-0.49,0.77-0.75 C355.915,172.811,336.595,110.45,286.225,60.081z"></path> <path style="fill:#4A7984;" d="M257.065,343.64h-91.35v-125.6c14.36,9.33,30.23,15.46,46.61,18.4l18.35,43.97L257.065,343.64z"></path> <path style="fill:#23464F;" d="M165.715,218.05v125.59h-99.14l65.65-157.28c3.81,5.22,8.08,10.22,12.79,14.93 c6.42,6.42,13.36,12.01,20.7,16.75V218.05z"></path> <path style="fill:#F24125;" d="M262.805,83.5c8.85,8.85,8.85,23.19,0,32.04c-8.85,8.85-23.2,8.85-32.05,0s-8.85-23.19,0-32.04 S253.955,74.65,262.805,83.5z"></path> <path style="fill:#333333;" d="M296.42,216.314c-31.983,0-73.708-20.393-109.88-56.557 c-52.281-52.292-71.604-116.193-43.992-145.477c1.895-2.009,5.057-2.103,7.068-0.208c2.009,1.894,2.102,5.059,0.207,7.068 c-11.008,11.675-12.845,31.462-5.171,55.718c8.016,25.337,25.403,52.266,48.959,75.827c23.56,23.555,50.49,40.942,75.831,48.958 c24.257,7.675,44.049,5.838,55.724-5.17c2.01-1.894,5.174-1.802,7.067,0.208c1.895,2.009,1.802,5.174-0.208,7.068 C322.997,212.261,310.675,216.314,296.42,216.314z"></path> <path style="fill:#333333;" d="M329.365,204.36c-1.279,0-2.56-0.488-3.535-1.464c-1.953-1.953-1.953-5.119,0-7.071 c11.464-11.464,13.607-31.243,6.034-55.692c-7.912-25.544-25.376-52.718-49.174-76.516c-23.802-23.801-50.979-41.267-76.525-49.178 c-24.448-7.571-44.227-5.428-55.694,6.038c-1.951,1.952-5.119,1.952-7.07,0c-1.953-1.953-1.953-5.119,0-7.071 c14.215-14.216,37.557-17.243,65.723-8.519c27.071,8.384,55.709,26.73,80.638,51.659c24.927,24.926,43.271,53.561,51.656,80.629 c8.724,28.166,5.7,51.506-8.517,65.722C331.925,203.872,330.644,204.36,329.365,204.36z"></path> <path style="fill:#23464F;" d="M230.675,280.41c-6.16-0.22-12.29-0.87-18.35-1.97c-16.38-2.94-32.25-9.07-46.61-18.4v-42 c14.36,9.33,30.23,15.46,46.61,18.4L230.675,280.41z"></path> <path style="fill:#333333;" d="M235.39,243.503c-7.977,0-15.988-0.705-23.953-2.142c-17.424-3.127-33.726-9.563-48.446-19.127 c-7.685-4.962-14.926-10.822-21.511-17.407c-4.834-4.834-9.307-10.055-13.294-15.519c-18.605-25.465-27.479-57.09-24.982-89.049 c2.517-32.215,16.496-62.755,39.368-86.005c0.259-0.278,0.527-0.548,0.807-0.828c1.949-1.955,5.125-1.966,7.08-0.016 c1.954,1.951,1.966,5.107,0.016,7.062c-0.226,0.226-0.426,0.425-0.618,0.633c-0.035,0.038-0.071,0.076-0.108,0.113 c-21.251,21.579-34.239,49.926-36.574,79.818c-2.311,29.579,5.89,58.834,23.089,82.374c3.685,5.049,7.818,9.875,12.288,14.344 c6.087,6.087,12.774,11.499,19.877,16.085c13.608,8.842,28.671,14.787,44.781,17.679c40.403,7.292,82.232-5.781,111.879-34.972 c0.038-0.038,0.077-0.075,0.117-0.111c0.21-0.194,0.411-0.397,0.621-0.608c1.95-1.955,5.117-1.958,7.071-0.007 s1.957,5.117,0.007,7.071c-0.288,0.289-0.567,0.566-0.854,0.833C305.936,229.412,271.053,243.502,235.39,243.503z"></path> <path style="fill:#333333;" d="M246.78,127.165c-7.084,0-14.168-2.696-19.561-8.089c-10.783-10.783-10.783-28.328,0-39.111 c10.785-10.785,28.336-10.785,39.121,0l0,0c10.783,10.783,10.783,28.328,0,39.111C260.948,124.469,253.864,127.165,246.78,127.165z M246.78,81.871c-4.523,0-9.047,1.722-12.49,5.165c-6.883,6.884-6.883,18.085,0,24.969c6.887,6.886,18.092,6.887,24.98,0 c6.883-6.884,6.883-18.085,0-24.969l0,0C255.827,83.593,251.304,81.871,246.78,81.871z"></path> <path style="fill:#FFFFFF;" d="M253.612,111.348c-1.28,0-2.56-0.488-3.536-1.465c-1.952-1.953-1.952-5.119,0.001-7.071 c0.894-0.893,1.365-2.031,1.365-3.291s-0.473-2.399-1.365-3.292c-0.894-0.894-2.033-1.366-3.297-1.366c-2.762,0-5-2.239-5-5 s2.238-5,5-5c3.916,0,7.599,1.525,10.367,4.294c2.77,2.77,4.295,6.45,4.295,10.363c0,3.914-1.525,7.594-4.295,10.363 C256.171,110.859,254.891,111.348,253.612,111.348z"></path> <path style="fill:#333333;" d="M66.573,348.642c-0.643,0-1.295-0.125-1.924-0.387c-2.549-1.064-3.752-3.992-2.688-6.54 l65.65-157.28c1.063-2.549,3.995-3.751,6.54-2.688c2.549,1.064,3.752,3.992,2.688,6.54l-65.65,157.28 C70.388,347.485,68.53,348.642,66.573,348.642z"></path> <path style="fill:#333333;" d="M257.067,348.642c-1.957,0-3.815-1.157-4.616-3.076l-44.74-107.2 c-1.063-2.548,0.14-5.477,2.688-6.54c2.547-1.063,5.477,0.141,6.54,2.688l44.74,107.2c1.063,2.548-0.14,5.477-2.688,6.54 C258.362,348.518,257.709,348.642,257.067,348.642z"></path> <path style="fill:#333333;" d="M165.715,348.641c-2.762,0-5-2.239-5-5v-125.59c0-2.761,2.238-5,5-5s5,2.239,5,5v125.59 C170.715,346.402,168.476,348.641,165.715,348.641z"></path> <path style="fill:#333333;" d="M287.815,377.13H35.825c-2.762,0-5-2.239-5-5v-28.49c0-2.761,2.238-5,5-5h251.99 c2.762,0,5,2.239,5,5v28.49C292.815,374.892,290.577,377.13,287.815,377.13z M40.825,367.13h241.99v-18.49H40.825V367.13z"></path> <path style="fill:#333333;" d="M191.581,159.718c-1.279,0-2.56-0.488-3.535-1.464c-1.953-1.953-1.953-5.119,0-7.071l39.173-39.173 c1.951-1.952,5.119-1.952,7.07,0c1.953,1.953,1.953,5.119,0,7.071l-39.173,39.173C194.14,159.229,192.86,159.718,191.581,159.718z"></path> <path style="fill:#333333;" d="M143.651,93.757c-2.624,0-4.826-2.044-4.986-4.699c-0.166-2.756,1.934-5.125,4.689-5.292 l87.098-5.26c2.745-0.178,5.127,1.933,5.293,4.689c0.166,2.756-1.934,5.125-4.689,5.292l-87.098,5.26 C143.855,93.754,143.753,93.757,143.651,93.757z"></path> <path style="fill:#333333;" d="M257.546,207.643c-0.102,0-0.204-0.003-0.307-0.009c-2.756-0.167-4.855-2.536-4.689-5.292 l5.261-87.098c0.166-2.756,2.546-4.865,5.293-4.689c2.756,0.167,4.855,2.536,4.689,5.292l-5.261,87.098 C262.372,205.598,260.169,207.643,257.546,207.643z"></path> <rect x="195.571" y="343.64" style="fill:#F73E3E;" width="92.244" height="28.49"></rect> <g> <rect x="195.571" y="343.64" style="fill:#F73E3E;" width="92.244" height="28.49"></rect> <path style="fill:#333333;" d="M287.815,377.13h-92.244c-2.762,0-5-2.239-5-5v-28.49c0-2.761,2.238-5,5-5h92.244 c2.762,0,5,2.239,5,5v28.49C292.815,374.892,290.577,377.13,287.815,377.13z M200.571,367.13h82.244v-18.49h-82.244V367.13z"></path> </g> <path style="fill:#FFFFFF;" d="M276.204,360.457c-1.319,0-2.609-0.53-3.54-1.46c-0.229-0.23-0.439-0.49-0.619-0.76 c-0.181-0.27-0.341-0.56-0.46-0.86c-0.131-0.31-0.221-0.62-0.29-0.94c-0.061-0.32-0.091-0.65-0.091-0.98 c0-0.32,0.03-0.65,0.091-0.97c0.069-0.32,0.159-0.64,0.29-0.94c0.119-0.3,0.279-0.59,0.46-0.86c0.18-0.28,0.39-0.53,0.619-0.76 c1.16-1.16,2.891-1.7,4.511-1.37c0.319,0.07,0.64,0.16,0.939,0.29c0.3,0.12,0.59,0.28,0.86,0.46c0.28,0.18,0.53,0.39,0.76,0.62 c0.23,0.23,0.44,0.48,0.63,0.76c0.17,0.27,0.33,0.56,0.46,0.86c0.12,0.3,0.221,0.62,0.28,0.94c0.06,0.32,0.1,0.65,0.1,0.97 c0,0.33-0.04,0.66-0.1,0.98s-0.16,0.63-0.28,0.94c-0.13,0.3-0.279,0.59-0.46,0.86c-0.189,0.27-0.399,0.53-0.63,0.76 c-0.229,0.23-0.479,0.44-0.76,0.62c-0.271,0.18-0.561,0.33-0.86,0.46c-0.3,0.12-0.62,0.22-0.939,0.29 C276.854,360.427,276.524,360.457,276.204,360.457z"></path> <path style="fill:#FFFFFF;" d="M222.973,304.026c-1.957,0-3.815-1.157-4.616-3.076l-2.823-6.766 c-1.063-2.548,0.141-5.476,2.688-6.54c2.552-1.063,5.477,0.141,6.54,2.689l2.823,6.766c1.063,2.548-0.141,5.476-2.688,6.54 C224.267,303.902,223.615,304.026,222.973,304.026z"></path> <path style="fill:#FFFFFF;" d="M234.595,331.871c-1.957,0-3.815-1.157-4.616-3.076l-5.753-13.785 c-1.063-2.548,0.14-5.477,2.688-6.54c2.548-1.064,5.478,0.141,6.54,2.688l5.753,13.785c1.063,2.548-0.14,5.477-2.688,6.54 C235.889,331.747,235.236,331.871,234.595,331.871z"></path> </g> </g></svg>
          <span class="text-md text-white mt-2 font-medium">
            Stock Screener
          </span>
        </div>
      </a>

      <a href="/hedge-funds/category/best" class="shadow-lg bg-[#202020] w-40 flex h-24 sm:h-32 items-center justify-center rounded-lg sm:rounded-2xl cursor-pointer">
        <div class="flex flex-col items-center">
          <svg class="inline block h-10 w-10 sm:w-12 sm:h-12" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 504.123 504.123" xml:space="preserve" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <circle style="fill:#324A5E;" cx="252.062" cy="252.062" r="252.062"></circle> <path style="fill:#F9B54C;" d="M148.48,252.062H94.523c0,87.04,70.498,157.538,157.538,157.538v-53.957 C194.954,355.643,148.48,309.169,148.48,252.062z"></path> <path style="fill:#54C0EB;" d="M252.062,355.643V409.6c87.04,0,157.538-70.498,157.538-157.538h-53.957 C355.643,309.169,309.169,355.643,252.062,355.643z"></path> <path style="fill:#F1543F;" d="M252.062,148.48V94.523c-87.04,0-157.538,70.498-157.538,157.538h53.957 C148.48,194.954,194.954,148.48,252.062,148.48z"></path> <path style="fill:#ACB3BA;" d="M301.292,102.4l-46.08,46.08c14.572,0.394,28.357,3.938,40.566,9.452l39.778-39.778 C324.923,111.852,313.502,106.338,301.292,102.4z"></path> <g> <path style="fill:#E6E9EE;" d="M252.062,94.523v53.957c1.182,0,1.969,0,3.151,0l46.08-46.08 C285.932,97.28,269.391,94.523,252.062,94.523z"></path> <path style="fill:#E6E9EE;" d="M335.557,118.548l-39.778,39.778c11.028,5.12,20.874,12.209,29.538,20.48l38.203-38.203 C354.855,132.332,345.797,124.849,335.557,118.548z"></path> </g> <g> <path style="fill:#ACB3BA;" d="M363.52,140.603l-38.203,38.203c8.665,8.665,15.36,18.511,20.48,29.538l39.778-39.778 C379.274,158.326,371.791,149.268,363.52,140.603z"></path> <path style="fill:#ACB3BA;" d="M355.643,248.911c0,1.182,0,1.969,0,3.151H409.6c0-17.329-2.757-33.871-7.877-49.231 L355.643,248.911z"></path> </g> <path style="fill:#E6E9EE;" d="M385.575,168.566l-39.778,39.778c5.908,12.603,9.058,25.994,9.452,40.566l46.474-46.08 C397.785,190.622,392.271,179.2,385.575,168.566z"></path> <path style="fill:#FFFFFF;" d="M248.123,328.862v-13.391c-16.935-1.575-31.902-8.271-45.686-20.086l13.391-16.148 c10.24,9.058,20.874,14.572,31.902,16.148v-35.84c-13.785-3.151-24.025-7.877-30.72-12.997c-6.695-5.12-9.846-13.391-9.846-24.025 c0-10.634,3.545-19.298,11.028-26.388c7.483-6.695,17.329-10.634,29.145-11.028v-9.452h11.815v9.452 c13.391,1.182,26.388,5.514,38.597,13.785l-12.209,16.935c-8.271-5.908-16.935-9.452-26.388-10.634v34.658h0.394 c14.178,3.151,24.812,7.877,31.114,13.391c6.695,5.514,9.846,13.785,9.846,24.812c0,10.634-3.938,19.692-11.422,26.388 c-7.483,6.695-17.723,10.634-30.326,11.028v13.391L248.123,328.862L248.123,328.862z M235.126,209.132 c-3.151,2.757-4.726,6.302-4.726,10.24s1.182,7.483,3.545,9.846c2.363,2.363,7.089,4.726,14.178,7.089v-31.902 C242.609,204.8,238.277,206.375,235.126,209.132z M273.723,290.658c3.545-2.757,5.12-6.302,5.12-10.634 c0-4.332-1.182-7.877-3.938-10.24c-2.757-2.363-7.877-4.726-15.36-7.089v33.477C265.846,294.991,270.572,293.415,273.723,290.658z"></path> </g></svg>
          <span class="text-md text-white mt-2 font-medium">
            Hedge Funds
          </span>
        </div>
      </a>

      <a href="/community" class="shadow-lg bg-[#202020] flex w-40 h-24 sm:h-32 items-center justify-center rounded-lg sm:rounded-2xl cursor-pointer">
        <div class="flex flex-col items-center">
          <svg class="inline block h-10 w-10" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <defs> <style>.cls-1{fill:#f99;}.cls-1,.cls-2{stroke:#54596e;stroke-linecap:round;stroke-linejoin:round;stroke-width:2px;}.cls-2{fill:#9af43b;}.cls-3{opacity:0.1;}.cls-4{fill:#54596e;}.cls-5{fill:#61c5a8;}.cls-6{fill:#ff927d;}</style> </defs> <title>chat</title> <g id="chat"> <path class="cls-1" d="M35,8C20.09,8,8,17.4,8,29c0,6.39,3.68,12.11,9.47,16L15,53l8.26-5.08A33.5,33.5,0,0,0,35,50c14.91,0,27-9.4,27-21S49.91,8,35,8Z"></path> <path class="cls-2" d="M29,12C14.09,12,2,21.4,2,33c0,6.39,3.68,12.11,9.47,16L9,57l8.26-5.08A33.5,33.5,0,0,0,29,54c14.91,0,27-9.4,27-21S43.91,12,29,12Z"></path> <g class="cls-3"> <path class="cls-4" d="M10.81,51.11,9,57l7.28-4.48A33,33,0,0,1,10.81,51.11Z"></path> <path class="cls-4" d="M30.34,12C41.17,14.76,49,22.67,49,32c0,11.6-12.09,21-27,21-.45,0-.89,0-1.34,0A34.27,34.27,0,0,0,29,54c14.91,0,27-9.4,27-21C56,21.75,44.63,12.57,30.34,12Z"></path> </g> <circle class="cls-4" cx="31" cy="27" r="2"></circle> <circle class="cls-4" cx="14" cy="27" r="2"></circle> <circle class="cls-5" cx="31" cy="32" r="2"></circle> <circle class="cls-5" cx="14" cy="32" r="2"></circle> <ellipse class="cls-4" cx="22" cy="36" rx="4" ry="5"></ellipse> <ellipse class="cls-6" cx="22" cy="39" rx="2" ry="1"></ellipse> </g> </g></svg>
          <span class="text-md text-white mt-2 font-medium">
            Community
          </span>
        </div>
      </a>

  </div>

</div>
-->
  <!--End what we offer-->


    <!--Start Portfolio Tournament-->
    <div class="hidden w-full max-w-3xl m-auto flex flex-col justify-center items-center pb-10">
  

      <div class="w-full bg-[#0F0F0F] sm:rounded-xl h-auto p-6 sm:p-10">
        <div class="grid grid-cols-1">
      
          <!-- Start Column -->
          <div>
            <div id="step-portfolio" class="flex flex-row justify-center  items-center">
              <h2 class="text-4xl sm:text-5xl text-white font-bold mb-2">
                Portfolio Tournament
              </h2>
            </div>


             <!-- Start Image -->
          <a href="/portfolio" class="m-auto flex justify-center">
            <div class="relative">
              <div class="z-1 w-48 sm:w-64 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <img src={cloudFrontUrl+"/assets/trophy_logo.png"} alt="trophy logo" loading="lazy">
              </div>
                  <svg id="visual" viewBox="0 0 960 540" width="380" height="200" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">
                    <defs>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="12" result="glow"/>
                        <feMerge>
                          <feMergeNode in="glow"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <g transform="translate(506.6556351091302 253.49315711627338)">
                      <path d="M141.5 -60.2C185.5 -5.4 224.8 73.5 200.5 122.1C176.1 170.7 88 188.8 -4.7 191.5C-97.4 194.3 -194.9 181.5 -236.6 122.9C-278.3 64.3 -264.3 -40.1 -215.6 -97.5C-166.9 -155 -83.4 -165.5 -17.4 -155.5C48.7 -145.5 97.4 -114.9 141.5 -60.2" fill="#1E40AF" stroke-width="10" filter="url(#glow)"></path>
                    </g>
                  </svg>
              </div>
          </a>
          <!-- End Image -->

            
          <span class="text-white text-lg text-center pl-8 pr-8 flex justify-center items-center">
            Join our monthly Tournament, where you start with $100,000 in-game money, and the top 3 with the highest returns win Pro Subscription Discounts worth up to 30%.
          </span>
      
          </div>
          <!-- End Column -->
      
         
  

          <div class="pt-3 flex flex-col justify-center sm:flex-row items-center mt-7">
            <a id="step-leaderboard" href="/leaderboard" class="shadow-lg w-full sm:w-56 hover:bg-[#3C74D4] bg-[#3C74D4] bg-opacity-[0.6] duration-150 cursor-pointer py-3 px-4 font-bold text-center text-white text-sm rounded-full">
              View Leaderboard
            </a>
            <a href="/tournament-rules" class="shadow-lg mt-3 sm:mt-0 sm:ml-3 w-full sm:w-56 hover:bg-[#3C74D4] bg-[#3C74D4] bg-opacity-[0.6] duration-150 cursor-pointer py-3 px-4 font-bold text-center text-white text-sm rounded-full">
              More Info
            </a>
          </div>

     

      
        </div>
      </div>


   

    </div>

    <!--End Portfolio Tournament-->
          

  <div class="flex flex-wrap justify-between items-start w-full m-auto pb-14 sm:pb-20 sm:mt-10">

  
    <div class="hidden sm:block w-full sm:w-1/2">
      
      <!--Start Top Winners/Losers-->
      <div id="step-top-winners" class="flex justify-between items-center">
          <button on:click={handleClick}>          
          <h2 class="text-white text-xl sm:text-2xl font-bold text-start mb-2 ml-2 sm:ml-0">
            <svg class="h-6 w-6 inline-block transform transition-transform {showLoser ? 'mb-2' : 'rotate-180'} mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="white" d="m488.832 344.32l-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872l319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z"/></svg>
              {buttonText} Today
          </h2>
        </button>
      </div>

      <!--Start of Mode-->
      <table class="table table-sm table-pin-rows table-compact rounded-none sm:rounded-lg bg-[#202020]">
        <thead class="rounded-lg">
          <tr class="bg-[#313131]">
            <th class="text-white font-medium text-sm">Symbol</th>
            <th class="text-white font-medium text-sm">Name</th>
            <th class="text-white font-medium text-sm ">Market Cap</th>
            <th class="text-white font-medium text-end text-sm">Today</th>
          </tr>
        </thead>

        <tbody>
          {#each gainerLoserTickers as item}
          <tr on:click={() => goto("/stocks/"+item.symbol)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] border-b-[#202020] shake-ticker cursor-pointer">
            <td class="text-blue-400 border-b border-[#202020]">
                {item?.symbol}
            </td>

            <td class="text-white border-b border-[#202020]">
              {item?.name?.length > 20 ? item?.name?.slice(0,20) + "..." : item?.name}
            </td>
            

      
              <td class="text-white border-b border-[#202020]">
                {item?.marketCap !== null ? abbreviateNumber(item?.marketCap,true) : '-'}
              </td>

      
              <td class="text-white border-b border-[#202020] font-semibold">
                <div class="flex flex-row justify-end items-center">
      
                  <div class="flex flex-col items-center">
                    <span class="text-white text-md ml-auto">${item.price?.toFixed(2)}</span>
                    <div class="flex flex-row mt-1">
                      {#if item?.changesPercentage >=0}
                        <svg class="w-5 h-5 -mr-0.5 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                        <span class="text-[#10DB06] text-xs font-medium">+{item?.changesPercentage?.toFixed(2)}%</span>
                      {:else}
                        <svg class="w-5 h-5 -mr-0.5 -mt-0.5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                        <span class="text-[#FF2F1F] text-xs font-medium">{item?.changesPercentage?.toFixed(2)}% </span> 
                      {/if}
                    </div>
                  </div>
      
                  
              </div>
            </td>
          </tr>
          {/each}
        </tbody>
      </table>


    </div>



     <!--Start Mobile Trending Scrollbar-->
     <div class="sm:hidden overflow-hidden">
      <div class="flex flex-row items-center w-full">



        <label class="text-white text-xl p-4 font-medium flex flex-row items-center">
          Trending
          <InfoModal
          title={'Trending'}
          content={"Explore today's market highlights, including top gainers, losers and the most actively traded stocks."}
          id={'trendingModal'}
          />
        </label>
          
      

        <a href="/market-mover" class="ml-auto text-slate-300 text-sm font-medium pr-4 cursor-pointer">
          See All
        </a>
      </div>

      <div class="w-full flex flex-row items-center mb-5 ml-3 overflow-hidden">
        <label on:click={() => scrollToItem('gainer')} class="flex flex-row items-center {trendingText === 'gainer' ? 'bg-[#333333]' : 'bg-[#202020]'} rounded-xl py-1">
          <svg class="ml-2 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="white" d="m1 7.4l.7.7l6-6l6 6l.7-.7L8.1 1h-.7L1 7.4zm0 6l.7.7l6-6l6 6l.7-.7L8.1 7h-.7L1 13.4z"/></svg>
          <span class="text-white text-sm font-medium ml-2 mr-4">
            Gainers
          </span>
        </label>
        <label on:click={() => scrollToItem('loser')} class="flex flex-row items-center {trendingText === 'loser' ? 'bg-[#333333]' : 'bg-[#202020]'} rounded-xl py-1 ml-4">
          <svg class="ml-2 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="white" d="M240 136v64a8 8 0 0 1-8 8h-64a8 8 0 0 1 0-16h44.69L136 115.31l-34.34 34.35a8 8 0 0 1-11.32 0l-72-72a8 8 0 0 1 11.32-11.32L96 132.69l34.34-34.35a8 8 0 0 1 11.32 0L224 180.69V136a8 8 0 0 1 16 0Z"/></svg>
          <span class="text-white text-sm font-medium ml-2 mr-4">
            Losers
          </span>
        </label>
        <label on:click={() => scrollToItem('active')} class="flex flex-row items-center {trendingText === 'active' ? 'bg-[#333333]' : 'bg-[#202020]'} rounded-xl py-1 ml-4">
          <svg class="ml-2 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="white" d="M253.78 17.188c-130.728 0-236.905 106.177-236.905 236.906C16.875 384.824 123.052 491 253.78 491c130.73 0 236.907-106.18 236.907-236.906c0-130.73-106.177-236.906-236.906-236.906zm0 18.687c120.63 0 218.22 97.59 218.22 218.22c0 120.626-97.59 218.218-218.22 218.218c-120.628 0-218.218-97.59-218.218-218.22s97.59-218.218 218.22-218.218zm101.19 46.313l-76.41 132.875c15.916 9.635 25.177 26.33 26.125 43.78h148.407c1.644-70.01-33.49-138.867-98.125-176.656zm-205.126 2.468c-27.1 16.725-50.68 40.147-67.72 69.656c-19.01 32.928-26.926 69.12-26 104.532H196a54.04 54.04 0 0 1 7.188-24.438c5.21-9.024 12.64-16 21.218-20.625L149.844 84.657zm100.594 141.156a36.723 36.723 0 0 0-2.594.094c-11.446.793-22.288 7.084-28.5 17.844c-9.94 17.216-4.09 38.967 13.125 48.906c17.213 9.94 38.935 4.12 48.874-13.094c9.94-17.215 4.12-38.967-13.094-48.906c-5.648-3.26-11.768-4.824-17.813-4.844zm28.218 82.375c-16.127 9.75-36.864 10.846-54.406 1.25l-68.03 117.22c29.454 16.785 61.044 25.177 92.75 26c34.567.898 68.72-7.786 99.124-24.032l-69.438-120.438z"/></svg>
          <span class="text-white text-sm font-medium ml-2 mr-4">
            Most Active
          </span>
        </label>
      </div>

      <div class="w-screen no-scrollbar grid grid-cols-5 gap-x-44 overflow-hidden overflow-x-scroll pl-5 pr-10">
        {#each (trendingText === 'gainer' ? gainer : trendingText === 'loser' ? loser : active) as item,index}
          <a href={"/stocks/"+item?.symbol} class="bg-[#202020] rounded-lg  h-[90px] w-36 relative">
            <span class="stroke-text absolute right-32 bottom-0">
              {index+1}
            </span>
            <div class="flex flex-row items-center justify-end p-2">
              <span class="text-slate-200 text-sm font-medium mr-2">
                {item?.symbol}
              </span>
              <div class="rounded-full w-7 h-7 relative bg-[#0F0F0F] flex items-center justify-center">
                <img style="clip-path: circle(50%);" class="w-5 h-5" src={`https://financialmodelingprep.com/image-stock/${item?.symbol}.png`} alt="stock logo"/>
              </div>
            </div>

            <div class="flex flex-col items-center">
              <span class="text-white font-bold text-xs ml-auto mr-2">${item.price?.toFixed(2)}</span>
              <div class="flex flex-row mt-1 ml-auto mr-2">
                {#if item?.changesPercentage >=0}
                  <svg class="w-5 h-5 -mr-0.5 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                  <span class="text-[#10DB06] text-xs font-medium">+{item?.changesPercentage?.toFixed(2)}%</span>
                {:else}
                  <svg class="w-5 h-5 -mr-0.5 -mt-0.5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                  <span class="text-[#FF2F1F] text-xs font-medium">{item?.changesPercentage?.toFixed(2)}% </span> 
                {/if}
              </div>
            </div>

            
          </a>
        {/each}
      </div>
    </div>
    <!--End Mobile Trending Scrollbar-->

    <!--End Top Winners/Losers-->

    <div class="hidden sm:block w-full  sm:w-1/2 mt-10 sm:mt-0">
      <div class="ml-0 sm:ml-10">
        <div id="step-most-active" class="flex justify-between items-center">
          
          <h2 class="text-white text-xl sm:text-2xl font-bold text-start mb-2 ml-2 sm:ml-0">
            Most Active Today
          </h2>
          
        </div>

      <table class="table table-sm table-compact table-pin-rows shadow-md rounded-none sm:rounded-lg bg-[#202020]">
        <thead>
          <tr class="bg-[#313131]">
            <th class="text-white font-semibold text-sm">Symbol</th>
            <th class="text-white font-semibold text-sm">Name</th>
            <th class="text-white font-semibold text-sm ">Volume</th>
            <th class="text-white font-semibold text-end text-sm">Today</th>
          </tr>
        </thead>
        <tbody>
          {#each active as item, index}
          <tr on:click={() => goto("/stocks/"+item?.symbol)} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] border-b-[#202020] shake-ticker cursor-pointer">
            <td class="text-blue-400 border-b border-[#202020]">
              {item?.symbol}
            </td>
            
            <td class="text-white border-b border-[#202020]">
              {item?.name?.length > 20 ? item?.name?.slice(0,20) + "..." : item?.name}
            </td>
    
      
  
          <td class="text-white border-b border-[#202020]">
            {item?.volume !== null ? abbreviateNumber(item?.volume) : '-'}
          </td>

  
          <td class="text-white border-b border-[#202020] font-semibold">
            <div class="flex flex-row justify-end items-center">
  
              <div class="flex flex-col items-center">
                <span class="text-white text-md ml-auto">${item.price?.toFixed(2)}</span>
                <div class="flex flex-row mt-1">
                  {#if item?.changesPercentage >=0}
                    <svg class="w-5 h-5 -mr-0.5 -mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#10db06" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>
                    <span class="text-[#10DB06] text-xs">+{item?.changesPercentage?.toFixed(2)}%</span>
                  {:else}
                    <svg class="w-5 h-5 -mr-0.5 -mt-0.5 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="evaArrowUpFill0"><g id="evaArrowUpFill1"><path id="evaArrowUpFill2" fill="#FF2F1F" d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"/></g></g></svg>    
                    <span class="text-[#FF2F1F] text-xs">{item?.changesPercentage?.toFixed(2)}% </span> 
                  {/if}
                  </div>
              </div>
  
              
          </div>
        </td>
      </tr>
          {/each}
        </tbody>
      </table>

    </div>
  </div>




  </div>





    <!--Start Join Community-->
    <!--
    <div class="w-full max-w-3xl m-auto flex flex-col justify-center items-center pb-20 sm:pb-40">
  

      <div class="w-full bg-[#0F0F0F] sm:rounded-xl h-auto p-6 sm:p-10">
        <div class="grid grid-cols-1">
      
          <div>
            <div id="step-portfolio" class="flex flex-row justify-center  items-center">
              <h3 class="text-4xl sm:text-5xl text-white font-bold mb-2">
                Join the Community
              </h3>
            </div>


          <a href={discordURL} rel="noopener noreferrer" target="_blank" class="m-auto flex justify-center">
            <div class="relative">
              <div class="z-1 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <img class="w-24 sm:w-28" src="{welcomeLogo}" alt="stocknear_logo">
              </div>
                  <svg class="w-72 sm:w-80" id="visual" viewBox="0 0 960 540"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">
                    <defs>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="12" result="glow"/>
                        <feMerge>
                          <feMergeNode in="glow"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <g transform="translate(506.6556351091302 253.49315711627338)">
                      <path d="M141.5 -60.2C185.5 -5.4 224.8 73.5 200.5 122.1C176.1 170.7 88 188.8 -4.7 191.5C-97.4 194.3 -194.9 181.5 -236.6 122.9C-278.3 64.3 -264.3 -40.1 -215.6 -97.5C-166.9 -155 -83.4 -165.5 -17.4 -155.5C48.7 -145.5 97.4 -114.9 141.5 -60.2" fill="#1E40AF" stroke-width="10" filter="url(#glow)"></path>
                    </g>
                  </svg>
              </div>
          </a>

            
          <span class="text-white text-lg text-center pl-8 pr-8 flex justify-center items-center">
            We'd love to chat with you! Please join us in Discord/Twitter if you have any questions.
          </span>
      
          </div>
      
         

          <div class="pt-3 flex flex-col justify-center sm:flex-row items-center mt-7">
            <a href={discordURL} rel="noopener noreferrer" target="_blank" class="shadow-lg w-full sm:w-56 hover:bg-[#3C74D4] bg-[#3C74D4] bg-opacity-[0.6] duration-150 cursor-pointer py-2.5 px-4 font-bold text-center text-white text-sm rounded-full">
              <svg class="inline-block w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"/></svg>
              <span class="ml-1">Discord</span>
            </a>

            <a href="https://twitter.com/intent/follow?screen_name=stocknear" rel="noopener noreferrer" target="_blank" class="shadow-lg mt-3 sm:mt-0 sm:ml-3 w-full sm:w-56 hover:bg-[#3C74D4] bg-[#3C74D4] bg-opacity-[0.6] duration-150 cursor-pointer py-2.5 px-4 font-bold text-center text-white text-sm rounded-full">
              <svg class="w-5 h-5 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M18.205 2.25h3.308l-7.227 8.26l8.502 11.24H16.13l-5.214-6.817L4.95 21.75H1.64l7.73-8.835L1.215 2.25H8.04l4.713 6.231l5.45-6.231Zm-1.161 17.52h1.833L7.045 4.126H5.078L17.044 19.77Z"/></svg>
              <span class="ml-1">Twitter</span>
            </a>
          </div>


        </div>
      </div>



    </div>
    -->
    <!--End Join Community-->

    <!--Start WIIM-->
    <div class="w-full m-auto p-2 sm:p-0 mb-20">
      <h2 class="text-white text-xl sm:text-2xl font-bold text-start mt-5 mb-2 ml-2 ">
        Latest Market Momentum
      </h2>
          {#each rssFeedWIIM?.slice(0,5) as item}
          <div class="shadow-md bg-[#202020] p-6 mb-4 rounded-lg text-start">
            <div class="text-sm text-white">
              <div class="flex flex-col items-start">
                <div class="hidden sm:flex flex-row items-center mb-3">
                  <span class="text-gray-300 text-xs">
                    {formatDate(item?.date)} ago
                  </span>
                  {#if latestInfoDate(item?.date)}
                    <label class="bg-[#313131] text-white font-medium text-xs rounded-lg px-2 py-0.5 ml-3">New</label>
                  {/if}
                </div>
                <span class="text-white">{item?.text}</span>
                <div class="flex flex-col mt-5 items-start w-full">
                  <div class="flex flex-wrap gap-y-3 flex-row items-center">
                    {#each item?.stocks as item2}
                      <div class="mr-2 mb-2 sm:mb-0">
                        <a href={item2?.assetType === 'stock' ? `/stocks/${item2?.ticker}` : item2?.assetType === 'etf' ? `/etf/${item2?.ticker}` : ''} class="cursor-pointer w-fit bg-[#404040] bg-opacity-[0.5] sm:hover:bg-opacity-[0.6] px-3 sm:px-4 py-1.5 sm:py-2 text-sm rounded-xl hover:text-white text-blue-400">
                          {item2?.ticker}
                        </a>
                      </div>
                    {/each}
                  </div>
                  
                  <div class="sm:hidden flex flex-row items-center justify-end mt-3 ml-auto">
                    <span class="text-gray-300 text-xs">
                      {formatDate(item?.date)} ago
                    </span>
                    {#if latestInfoDate(item?.date)}
                      <label class="bg-[#313131] text-white font-medium text-xs rounded-lg px-2 py-0.5 ml-3">New</label>
                    {/if}
                  </div>

                </div>
              </div>
              
            </div>
          </div>
          {/each}
    </div>
    <!--End WIIM-->
    
    



      </section>

      

        
     </div>
      <!--End-Searchbar-->     


    </div>
    

  </div>

</div>










  
<style>
   


.scrollbar {
    display: grid;
    grid-gap: 90px;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    grid-auto-flow: column;
    overflow-x: auto;
    scrollbar-width: thin; /* Hide the default scrollbar in Firefox */
    scrollbar-color: transparent transparent; /* Hide the default scrollbar in Firefox */
  }

  /* Custom scrollbar for Webkit (Chrome, Safari) */
  .scrollbar::-webkit-scrollbar {
    width: 0; /* Hide the width of the scrollbar */
    height: 0; /* Hide the height of the scrollbar */
  }

  .scrollbar::-webkit-scrollbar-thumb {
    background: transparent; /* Make the thumb transparent */
  }


  .stroke-text {
  font-size: 56px; /* Adjust the font size as needed */
  font-weight: bold; /* Adjust the font weight as needed */
  color: transparent; /* Make the text transparent */
  -webkit-text-stroke: 1px #CBD5E1; /* Add a black stroke outline with a thickness of 2px */
}

</style>