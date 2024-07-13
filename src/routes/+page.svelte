<script lang='ts'>  
  import DotPattern from '$lib/components/DotPattern.svelte';
  import Marquee from '$lib/components/Marquee.svelte';

  //import Discount from '$lib/components/Discount.svelte';
  import { intersect } from 'svelte-intersection-observer-action';

  export let data;

  let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;

  const frontendStars = data?.getFrontendStars;
  const backendStars = data?.getBackendStars;

  
const threshold = 0.4 // change the threshold value to 0.4 for 40%
const rootMargin = '-0px 0px'
const intersectOptions = { callback, threshold, rootMargin }
function callback(entry: IntersectionObserverEntry) {
  if (entry.intersectionRatio > threshold) {
    entry.target.classList.remove('invisible')
    entry.target.classList.add('fade-down')
  }
}



</script>
  
  


<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>
    Modern Stock Analysis Platform · stocknear
  </title>

  <meta name="description" content="Stocknear has everything you need to analyze stocks with help of AI, including detailed financial data, statistics, news and charts.">
  <!-- Other meta tags -->
  <meta property="og:title" content="Modern Stock Analysis Platform · stocknear"/>
  <meta property="og:description" content="Stocknear has everything you need to analyze stocks with help of AI, including detailed financial data, statistics, news and charts."/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="Stock Analysis Information for Small Investors · stocknear"/>
  <meta name="twitter:description" content="Stocknear has everything you need to analyze stocks with help of AI, including detailed financial data, statistics, news and charts."/>
  <!-- Add more Twitter meta tags as needed -->

</svelte:head>


<DotPattern
width={20}
height={20}
cx={10}
cy={10}
cr={1}
class="hidden sm:block [mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)] "
/>


<div class="w-full max-w-screen overflow-hidden m-auto min-h-screen bg-[#000]">


  <div class="m-auto flex flex-wrap flex-col justify-center items-center md:flex-row ">
    <!--Left Col-->

    
    
    <div class="flex flex-col w-full justify-center items-center">
      <div class="text-center mb-10 w-full">                

        <section>
          <div class="relative w-full mx-auto overflow-hidden">

         
              <div class="w-full m-auto flex justify-center overflow-hidden">
                  <div class="py-7">
    
                      <!-- Section content -->
                      <div class="relative m-auto">
      
                          <!-- Section header -->
                          <div class="h-auto">
                            
                            <div class="w-full sm:rounded-xl h-auto mt-3">
                              <div class="grid grid-cols-1 gap-10">
                            
                                <!-- Start Column -->
                                <div >

  

                                  <div class="flex flex-row justify-center items-center w-full sm:w-3/4 m-auto">
                                                                        
                                    <h1 class="fade-down text-center text-5xl sm:text-7xl bg-gradient-to-r from-[#E8BB28] to-purple-500 bg-clip-text text-transparent font-bold mb-6 w-80 sm:w-full">
                                      A modern stock analysis platform
                                    </h1>
                                  </div>

                                  
                                  <div class="w-5/6 sm:w-3/4 m-auto text-center flex-1 justify-center items-center text-white text-lg sm:text-2xl">
                                    Uncover what drives the stock market with our clear, actionable data.
                                  </div>
                                  
                                    
             
                                    <div class="flex flex-col gap-y-4 justify-center items-center mt-8 mb-6 m-auto w-full max-w-3xl">


                                      <a href='/register'
                                        class="animate-shine transition-colors group relative grid overflow-hidden rounded-xl px-6 py-3 shadow-[0_1000px_0_0_hsl(0_0%_20%)_inset] transition-colors"
                                      >
                                        <span>
                                          <span
                                            class="spark mask-gradient animate-flip before:animate-kitrotate absolute inset-0 h-[100%] w-[100%] overflow-hidden rounded-xl [mask:linear-gradient(white,_transparent_50%)] before:absolute before:aspect-square before:w-[200%] before:rotate-[-90deg] before:bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] before:content-[''] before:[inset:0_auto_auto_50%] before:[translate:-50%_-15%]"
                                          />
                                        </span>
                                        <span
                                          class="backdrop absolute inset-px rounded-[11px] bg-[#E8BB28] transition-colors duration-200 group-hover:bg-[#fac109]"
                                        />
                                        <span class="z-10 text-black text-[1rem] sm:text-lg font-semibold">
                                          <slot>Start free 7 days trial  <span class="ml-2 mt-0.5 tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out">
                                        </span></slot>
                                        <svg class="w-4 h-4 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(90 12 12)"><g fill="none"><path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"/><path fill="#000" d="M13.06 3.283a1.5 1.5 0 0 0-2.12 0L5.281 8.939a1.5 1.5 0 0 0 2.122 2.122L10.5 7.965V19.5a1.5 1.5 0 0 0 3 0V7.965l3.096 3.096a1.5 1.5 0 1 0 2.122-2.122L13.06 3.283Z"/></g></g></svg>

                                        </span>
                                        
                                      </a>


                                      <div class="flex flex-row items-center gap-x-5 justify-center m-auto mt-3 w-ful">
                                      <span class="text-white text-sm sm:text-lg">
                                        <svg class="w-6 h-6 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="#FBCE3C" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M416 128L192 384l-96-96"/></svg>
                                        No credit card required
                                      </span >
                                      <span class="text-white text-sm sm:text-lg">
                                        <svg class="w-6 h-6 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="#FBCE3C" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M416 128L192 384l-96-96"/></svg>
                                        Instant Access
                                      </span >
                                    </div>

                                    <div class="flex flex-col items-center justify-center mt-2 sm:mt-4">
                                      <div class="flex items-center">
                                        <svg class="w-5 h-5 sm:w-6 sm:h-6 ms-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FAC109" d="m5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275z"/></svg>
                                        <svg class="w-5 h-5 sm:w-6 sm:h-6 ms-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FAC109" d="m5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275z"/></svg>
                                        <svg class="w-5 h-5 sm:w-6 sm:h-6 ms-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FAC109" d="m5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275z"/></svg>
                                        <svg class="w-5 h-5 sm:w-6 sm:h-6 ms-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FAC109" d="m5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275z"/></svg>
                                        <svg class="w-5 h-5 sm:w-6 sm:h-6 ms-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FAC109" d="m5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275z"/></svg>
                                      </div>
                                      <span class="text-sm font-semibold text-white mt-1.5">
                                        Used by over 1,000+ traders
                                      </span>
                                    </div>




                                    </div>
                                    

                                    <!--<Discount />-->

                                  </div>
                                     
              
                                </div>
                                <!-- End Column -->

            

                                <h1 class="text-white w-5/6 sm:w-full m-auto text-3xl sm:text-4xl font-bold mt-14 mb-5">
                                  Explore High Quality Datasets
                                </h1>
                               
                                <div class="relative mb-4">
                                  <div class="absolute top-0 flex w-full justify-center">
                                    <div
                                      class="h-[1px] animate-border-width rounded-full bg-gradient-to-r from-[rgba(251,206,60,0)] via-white to-[rgba(188,126,254,0)] transition-all duration-1000"
                                    />
                                  </div>

                                  <div class="absolute flex items-center justify-center -top-[-140px] sm:top-[270px] -translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none w-96 sm:w-[900px] aspect-square">
                                    <div class="absolute inset-0 translate-z-0 bg-gradient-to-t from-[#E8BB28] to-purple-600 rounded-full blur-[1600px] opacity-[0.15]"></div>
                                    <div class="absolute w-64 h-64 translate-z-0 bg-gradient-to-t from-[#E8BB28] to-purple-900 rounded-full blur-[800px] "></div>
                                  </div>
                                  


                                  <div class="overlay m-auto flex justify-center z-20 items-center w-fit sm:w-[820px] h-full">
                                    <img class="w-full" src={cloudFrontUrl+"/assets/showcase-stock.png"} loading = 'lazy' alt="logo">
                                  </div>
                                </div>

                                


                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-4 w-full m-auto">
                                    <div use:intersect={intersectOptions} class="card bg-[#121016] sm:w-96 shadow-xl rounded-none sm:rounded-lg invisible">
                                      <div class="card-body">
                                        <h2 class="card-title text-white text-2xl font-bold">
                                          <svg class="w-9 h-9 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15"><path fill="none" stroke="#fff" stroke-linejoin="round" d="M.5 3.498L7.5.5l7 2.998m-14 0l7 2.998m-7-2.998V3.5m14-.002l-7 2.998m7-2.998V11.5l-7 3m7-11.002L7.5 6.5v8m0-8.004V14.5m0-8.004L.5 3.5m7 11l-7-3v-8"/></svg>
                                          Dark Pool
                                        </h2>
                                        <span class="text-start text-white">
                                          Access high-volume, privately negotiated trades from exclusive exchanges, typically used by institutional investors. This data is now available to you!
                                        </span>
                                      </div>
                                    </div>
  
                                  <div use:intersect={intersectOptions} class="card bg-[#121016] sm:w-96 shadow-xl rounded-none sm:rounded-lg invisible">
                                    <div class="card-body">
                                      <h2 class="card-title text-white text-2xl font-bold">
                                        <svg class="w-10 h-10 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 16V8c0-.943 0-1.414-.293-1.707S12.943 6 12 6s-1.414 0-1.707.293S10 7.057 10 8v8c0 .943 0 1.414.293 1.707S11.057 18 12 18s1.414 0 1.707-.293S14 16.943 14 16m7-7V7c0-.943 0-1.414-.293-1.707S19.943 5 19 5s-1.414 0-1.707.293S17 6.057 17 7v2c0 .943 0 1.414.293 1.707S18.057 11 19 11s1.414 0 1.707-.293S21 9.943 21 9M7 14v-2c0-.943 0-1.414-.293-1.707S5.943 10 5 10s-1.414 0-1.707.293S3 11.057 3 12v2c0 .943 0 1.414.293 1.707S4.057 16 5 16s1.414 0 1.707-.293S7 14.943 7 14m5 7v-3m7-5v-2m-7-5V3m7 2V3M5 18v-2m0-6V8" color="#F9784E"/></svg>
                                        Market Maker
                                      </h2>
                                      <span class="text-start text-white">
                                        Access Market Maker Activity to monitor their trading volume and identify the companies they are focusing on to spot potential hot stocks.
                                      </span>
                                    </div>
                                  </div>
  
                                  <div use:intersect={intersectOptions} class="card bg-[#121016] sm:w-96 shadow-xl rounded-none sm:rounded-lg invisible">
                                    <div class="card-body">
                                      <h2 class="card-title text-white text-2xl font-bold">
                                        <svg class="w-10 h-10 inline-block " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#fff" d="M4 7a1 1 0 0 0 0 2h2.22l2.624 10.5c.223.89 1.02 1.5 1.937 1.5h12.47c.903 0 1.67-.6 1.907-1.47L27.75 10h-2.094l-2.406 9H10.78L8.157 8.5A1.984 1.984 0 0 0 6.22 7zm18 14c-1.645 0-3 1.355-3 3s1.355 3 3 3s3-1.355 3-3s-1.355-3-3-3m-9 0c-1.645 0-3 1.355-3 3s1.355 3 3 3s3-1.355 3-3s-1.355-3-3-3m3-14v5h-3l4 4l4-4h-3V7zm-3 16c.564 0 1 .436 1 1c0 .564-.436 1-1 1c-.564 0-1-.436-1-1c0-.564.436-1 1-1m9 0c.564 0 1 .436 1 1c0 .564-.436 1-1 1c-.564 0-1-.436-1-1c0-.564.436-1 1-1"/></svg>
                                        Retail Trader Tracker
                                      </h2>
                                      <span class="text-start text-white">
                                        Gain exclusive insights with our Retail Trader Tracker to discover where retail traders are investing and identify the next potential hype stocks.
                                      </span>
                                    </div>
                                  </div>
  
                                  <div use:intersect={intersectOptions} class="card bg-[#121016] sm:w-96 shadow-xl rounded-none sm:rounded-lg invisible">
                                    <div class="card-body">
                                      <h2 class="card-title text-white text-2xl font-bold text-start">
                                        <svg class="w-9 h-9 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#fff" d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0S96 57.3 96 128s57.3 128 128 128m95.8 32.6L272 480l-32-136l32-56h-96l32 56l-32 136l-47.8-191.4C56.9 292 0 350.3 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-72.1-56.9-130.4-128.2-133.8"/></svg>
                                          Wall Str. Analyst
                                      </h2>
                                      <span class="text-start text-white">
                                        Access the Wall Street Analyst Database to explore insights from over 4,000 analysts, including their win rates, potential returns and latest ratings.
                                      </span>
                                    </div>
                                  </div>
  
                                  <div use:intersect={intersectOptions} class="card bg-[#121016] sm:w-96 shadow-xl rounded-none sm:rounded-lg invisible">
                                    <div class="card-body">
                                      <h2 class="card-title text-white text-2xl font-bold text-start">
                                        <svg class="w-10 h-10 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#fff" d="M247.002 32v47.725a56.5 56.5 0 0 1 17.996 0V32zM256 96.998c-11.5 0-23.002 5.001-23.002 15.002v10.1c7.37-2 15.05-3.098 23.002-3.098c7.953 0 15.632 1.098 23.002 3.098V112c0-10-11.502-15.002-23.002-15.002m0 40c-28.25 0-53.982 17.938-72.867 42.488c-16.345 21.249-26.934 47.277-29.496 67.516h204.726c-2.562-20.239-13.15-46.267-29.496-67.516c-18.885-24.55-44.617-42.488-72.867-42.488m-80 78.004h32v17.996h-32zm64 0h32v17.996h-32zm64 0h32v17.996h-32zm-170.29 49.996l-7.53 16.004h259.64l-7.53-16.004zm1.292 34v28.004h17.996v-28.004zm56 0v28.004h17.996v-28.004zm56 0v28.004h17.996v-28.004zm56 0v28.004h17.996v-28.004zm56 0v28.004h17.996v-28.004zm-270.004 46v16.004h334.004v-16.004zm14.004 34v60.004h17.996v-60.004zm48 0v60.004h17.996v-60.004zm48 0v60.004h17.996v-60.004zm48 0v60.004h17.996v-60.004zm48 0v60.004h17.996v-60.004zm48 0v60.004h17.996v-60.004zm48 0v60.004h17.996v-60.004zm-350.004 78v30.004h430.004v-30.004z"/></svg>
                                        Congress Trading 
                                      </h2>
                                      <span class="text-start text-white">
                                        Stay updated on the latest Congress Trading activities to see where politicians are investing and gain unique insights for potentially significant gains.
                                      </span>
                                    </div>
                                  </div>
  
                                  <div use:intersect={intersectOptions} class="card bg-[#121016] sm:w-96 shadow-xl rounded-none sm:rounded-lg invisible">
                                    <div class="card-body">
                                      <h2 class="card-title text-white text-2xl font-bold text-start">
                                        <svg class="w-10 h-10 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill="#fff" d="M9.228 2.183a1.33 1.33 0 0 1 1.543 0l5.852 4.152c.727.516.363 1.662-.528 1.664H3.907c-.894 0-1.26-1.147-.53-1.664zM10 5.874a.833.833 0 1 0 0-1.667a.833.833 0 0 0 0 1.667M4.5 9v4h2V9zM3 16.166c0-1.197.97-2.167 2.166-2.167h9.667A2.17 2.17 0 0 1 17 16.166v.333a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5zm12.5-7.167v4h-2V9zm-3 0v4h-2V9zm-3 0v4h-2V9z"/></svg>
                                        Hedge Funds
                                      </h2>
                                      <span class="text-start text-white">
                                        Access the Hedge Fund Portfolio to explore their investments and identify the top-performing funds.
                                      </span>
                                    </div>
                                  </div>
  
  
  
                                </div>

                                
                                
                                <h2 use:intersect={intersectOptions} class="invisible text-white text-3xl sm:text-4xl font-bold mt-16 w-5/6 sm:w-1/2 text-center m-auto">
                                  AI-Powered Algorithms to assist you in any way
                                </h2>

                                <section>
                                  <div class="max-w-6xl mx-auto px-4 sm:px-6">
                                      <div class="pt-10 pb-12 md:pt-16 md:pb-20">
                                  
                                          <!-- Items -->
                                          <div class="max-w-sm mx-auto grid gap-8 md:grid-cols-3 lg:gap-16 items-start md:max-w-none">
                  
                                              <!-- 1st item -->
                                              <div use:intersect={intersectOptions} class="relative flex flex-col items-center invisible">
                                                  
                                                <div class="mb-4 rounded-full flex-shrink-0 w-16 h-16 relative flex items-center justify-center bg-gradient-to-r from-purple-800 to-purple-500">
                                                  <svg class="w-7 h-7 " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14"><path fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" d="M6.15.555a.389.389 0 0 0-.399 0a.26.26 0 0 0-.06.34c1.227 2.123 1.486 5.016-.19 6.611a5.505 5.505 0 0 1-1.495-1.994a3.88 3.88 0 0 0-1.995 3.49a4.688 4.688 0 0 0 4.987 4.488c3.211 0 4.877-1.994 4.986-4.488C12.114 6.01 9.99 2.33 6.15.555"/></svg>
                                                </div>
                                                  <h4 class="text-xl text-white font-semibold mb-2">Market Trends</h4>
                                                  <p class="text-[1rem] sm:text-lg text-white text-center">
                                                    We are analyzing and predicting the trends for each company for the forthcoming months.
                                                  </p>
                                              </div>
                  
                                              <!-- 2nd item -->
                                              <div use:intersect={intersectOptions} class="relative flex flex-col items-center invisible">
                                                <div class="mb-4 rounded-full flex-shrink-0 w-16 h-16 relative flex items-center justify-center bg-gradient-to-r from-purple-800 to-purple-500">
                                                  <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#fff" d="m24 20l-1.41 1.41L26.17 25H10a4 4 0 0 1 0-8h12a6 6 0 0 0 0-12H5.83l3.58-3.59L8 0L2 6l6 6l1.41-1.41L5.83 7H22a4 4 0 0 1 0 8H10a6 6 0 0 0 0 12h16.17l-3.58 3.59L24 32l6-6Z"/></svg>
                                                </div>
                                                  <h4 class="text-xl text-white font-semibold mb-2">Price Movements</h4>
                                                  <p class="text-[1rem] sm:text-lg text-white text-center">
                                                    We are predicting the price movements of each company to empower you with confidence in your investment strategy.
                                                  </p>
                                              </div>
                  
                                              <!-- 3rd item -->
                                              <div use:intersect={intersectOptions} class="relative flex flex-col items-center invisible">
                                                <div class="mb-4 rounded-full flex-shrink-0 w-16 h-16 relative flex items-center justify-center bg-gradient-to-r from-purple-800 to-purple-500">
                                                  <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="#F9784E"><path d="M18 15V9c0-2.828 0-4.243-.879-5.121C16.243 3 14.828 3 12 3H8c-2.828 0-4.243 0-5.121.879C2 4.757 2 6.172 2 9v6c0 2.828 0 4.243.879 5.121C3.757 21 5.172 21 8 21h12M6 8h8m-8 4h8m-8 4h4"/><path d="M18 8h1c1.414 0 2.121 0 2.56.44c.44.439.44 1.146.44 2.56v8a2 2 0 1 1-4 0z"/></g></svg>
                                                </div>
                                                  <h4 class="text-xl text-white font-semibold mb-2">News Sentiments</h4>
                                                  <p class="text-[1rem] sm:text-lg text-white text-center">
                                                    We are processing millions of news articles to evaluate what the market thinks about each company.
                                                  </p>
                                              </div>
                  
                                          </div>
                  
                                      </div>
                                  </div>
                              </section>

                              


                              
                                <h2 use:intersect={intersectOptions} class="invisible text-white text-3xl sm:text-4xl text-center m-auto font-bold mt-20 w-11/12 sm:w-1/2 mb-10">
                                  Realtime Options Flow from Hedge Funds & Major Institutions
                                </h2>
                                    

                                <div use:intersect={intersectOptions} class="invisible relative mb-4">
                                  <div class="absolute top-0 flex w-full justify-center">
                                    <div
                                      class="h-[1px] animate-border-width rounded-full bg-gradient-to-r from-[rgba(251,206,60,0)] via-white to-[rgba(188,126,254,0)] transition-all duration-1000"
                                    />
                                  </div>
  
                                  <div class="absolute flex items-center justify-center -top-[-140px] sm:top-[270px] -translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none w-96 sm:w-[900px] aspect-square">
                                    <div class="absolute inset-0 translate-z-0 bg-gradient-to-t from-[#E8BB28] to-purple-600 rounded-full blur-[1600px] opacity-[0.15]"></div>
                                    <div class="absolute w-64 h-64 translate-z-0 bg-gradient-to-t from-[#E8BB28] to-purple-900 rounded-full blur-[800px] "></div>
                                  </div>
                                  
                                  
  
  
                                  <div class="overlay m-auto flex justify-center items-center w-fit sm:w-[820px] h-full">
                                    <img class="w-full" src={cloudFrontUrl+"/assets/showcase-options-flow.png"} loading = 'lazy' alt="logo">
                                  </div>
                                </div>
                                

                              
                                
                                <section>
                                  <div class="max-w-6xl mx-auto px-4 sm:px-6">
                                      <div class="pt-10 pb-12 md:pt-16 md:pb-20">
                                  
                                          <!-- Items -->
                                          <div class="max-w-sm mx-auto grid gap-8 md:grid-cols-3 lg:gap-16 items-start md:max-w-none">
                  
                                              <!-- 1st item -->
                                              <div use:intersect={intersectOptions} class="relative flex flex-col items-center invisible">
                                                  
                                                <div class="mb-4 rounded-full flex-shrink-0 w-16 h-16 relative flex items-center justify-center bg-gradient-to-r from-purple-800 to-purple-500">
                                                  <svg style="clip-path: circle(50%);" class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#fff" d="m7.288 23.292l7.997-7.997l1.414 1.414l-7.997 7.997z"/><path fill="#fff" d="M17 30a1 1 0 0 1-.37-.07a1 1 0 0 1-.62-.79l-1-7l2-.28l.75 5.27L21 24.52V17a1 1 0 0 1 .29-.71l4.07-4.07A8.94 8.94 0 0 0 28 5.86V4h-1.86a8.94 8.94 0 0 0-6.36 2.64l-4.07 4.07A1 1 0 0 1 15 11H7.48l-2.61 3.26l5.27.75l-.28 2l-7-1a1 1 0 0 1-.79-.62a1 1 0 0 1 .15-1l4-5A1 1 0 0 1 7 9h7.59l3.77-3.78A10.92 10.92 0 0 1 26.14 2H28a2 2 0 0 1 2 2v1.86a10.92 10.92 0 0 1-3.22 7.78L23 17.41V25a1 1 0 0 1-.38.78l-5 4A1 1 0 0 1 17 30"/></svg>
                                                </div>
                                                  <h4 class="text-xl text-white font-semibold mb-2">Track institutional activity</h4>
                                                  <p class="text-[1rem] sm:text-lg text-white text-center">
                                                    Gain insights into the latest moves smart money traders and hedge funds are doing. 
                                                  </p>
                                              </div>
                  
                                              <!-- 2nd item -->
                                              <div use:intersect={intersectOptions} class="relative flex flex-col items-center invisible">
                                                <div class="mb-4 rounded-full flex-shrink-0 w-16 h-16 relative flex items-center justify-center bg-gradient-to-r from-purple-800 to-purple-500">
                                                  <svg style="clip-path: circle(50%);" class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#fff" d="M184 184a32 32 0 0 1-32 32c-13.7 0-26.95-8.93-31.5-21.22a8 8 0 0 1 15-5.56C137.74 195.27 145 200 152 200a16 16 0 0 0 0-32H40a8 8 0 0 1 0-16h112a32 32 0 0 1 32 32m-64-80a32 32 0 0 0 0-64c-13.7 0-26.95 8.93-31.5 21.22a8 8 0 0 0 15 5.56C105.74 60.73 113 56 120 56a16 16 0 0 1 0 32H24a8 8 0 0 0 0 16Zm88-32c-13.7 0-26.95 8.93-31.5 21.22a8 8 0 0 0 15 5.56C193.74 92.73 201 88 208 88a16 16 0 0 1 0 32H32a8 8 0 0 0 0 16h176a32 32 0 0 0 0-64"/></svg>
                                                </div>
                                                  <h4 class="text-xl text-white font-semibold mb-2">Fast, reliable market data</h4>
                                                  <p class="text-[1rem] sm:text-lg text-white text-center">
                                                    Get the latest options flow data delivered to you quickly and accurately.
                                                  </p>
                                              </div>
                  
                                              <!-- 3rd item -->
                                              <div use:intersect={intersectOptions} class="relative flex flex-col items-center invisible" data-aos-delay="400">
                                                <div class="mb-4 rounded-full flex-shrink-0 w-16 h-16 relative flex items-center justify-center bg-gradient-to-r from-purple-800 to-purple-500">
                                                  <svg style="clip-path: circle(50%);" class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><path fill="#fff" d="M1536 0q27 0 50 10t40 27t28 41t10 50v1792q0 27-10 50t-27 40t-41 28t-50 10H512q-27 0-50-10t-40-27t-28-41t-10-50V128q0-27 10-50t27-40t41-28t50-10zm0 128H512v1792h1024zM896 1664h256v128H896z"/></svg>
                                                </div>
                                                  <h4 class="text-xl text-white font-semibold mb-2">Best User Experience</h4>
                                                  <p class="text-[1rem] sm:text-lg text-white text-center">
                                                    Enjoy an intuitive interface that makes finding the information you need effortless.
                                                  </p>
                                              </div>
                  
                                          </div>
                  
                                      </div>
                                  </div>
                              </section>
            


                              <h2 use:intersect={intersectOptions} class="invisible text-white text-3xl sm:text-4xl font-bold mt-16 w-11/12 sm:w-1/2 text-center m-auto">
                                Loved by our Users ❤
                              </h2>

                              <section use:intersect={intersectOptions} class="invisible relative flex items-center justify-center">
                                <div class="absolute top-0 max-w-6xl m-auto px-4 sm:px-6">
                                    <div class="pt-8 pb-12 md:pb-20">
                                
                                      <Marquee />

                                    </div>
                                </div>
                            </section>




                                <h1 class="text-white w-5/6 sm:w-full m-auto text-3xl sm:text-4xl font-bold pt-96 mt-10 mb-4">
                                  Proudly Open Source
                                </h1>

                                <div class="text-[1rem] sm:text-xl text-white font-semibold text-center w-11/12 sm:w-1/2 m-auto mb-8">
                                  Stocknear is committed to open source & transparency. You can also run it locally or self-hosted.
                                </div>

                                <a href="https://github.com/stocknear" rel="noopener noreferrer" target="_blank"
                                  class="w-fit sm:w-54 inline-flex animate-shine items-center justify-center rounded-xl text-sm border border-neutral-900 bg-[linear-gradient(110deg,#252626,55%,#fff,45%,#252626)] bg-[length:200%_100%] px-4 py-2 font-medium transition-colors"
                                >
                                <div class="m-auto flex-shrink-0 flex justify-center items-center">
                                  <svg class="w-8 h-8 sm:w-10 sm:h-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"/></svg>
                                
                                  <span class="text-white text-[1rem] ml-2 font-semibold">
                                    stocknear
                                    {frontendStars+backendStars}
                                  </span>
                                  <svg class="ml-1 w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#fff" d="m18.7 4.627l2.247 4.31a2.27 2.27 0 0 0 1.686 1.189l4.746.65c2.538.35 3.522 3.479 1.645 5.219l-3.25 2.999a2.225 2.225 0 0 0-.683 2.04l.793 4.398c.441 2.45-2.108 4.36-4.345 3.24l-4.536-2.25a2.282 2.282 0 0 0-2.006 0l-4.536 2.25c-2.238 1.11-4.786-.79-4.345-3.24l.793-4.399c.14-.75-.12-1.52-.682-2.04l-3.251-2.998c-1.877-1.73-.893-4.87 1.645-5.22l4.746-.65a2.23 2.23 0 0 0 1.686-1.189l2.248-4.309c1.144-2.17 4.264-2.17 5.398 0"/></svg>
                                </div>
                                </a>


   
                                <div class="text-white text-sm sm:text-lgs font-semibold font-mono mt-5">
                                  Leave a star to support us
                                </div>

                                </div>

                               


                            </div>


                      </div>
      
                  </div>
              </div>
      
          </div>



      </section>

  

        
     </div>


    </div>

    
    

  </div>

  

</div>





    <section class="bg-[#0A0A0A] w-full max-w-screen ">
      <div class="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
          <div class="flex flex-col sm:flex-row items-center mt-10 mb-10 mx-auto justify-center">
              <div class="m-auto sm:mx-8 text-center sm:text-start">
              <h2 class="mb-4 text-4xl tracking-tight font-bold leading-tight text-white">Start your free trial today</h2>
              <p class="mb-8 font-light font-medium text-white md:text-[1rem]">Try Stocknear Platform for 7 days. No credit card required.</p>
              
              <a href='/register'
              class="animate-shine w-fit m-auto group relative grid overflow-hidden rounded-xl px-6 py-3 shadow-[0_1000px_0_0_hsl(0_0%_20%)_inset] transition-colors"
            >
              <span>
                <span
                  class="spark mask-gradient animate-flip before:animate-kitrotate absolute inset-0 h-[100%] w-[100%] overflow-hidden rounded-xl [mask:linear-gradient(white,_transparent_50%)] before:absolute before:aspect-square before:w-[200%] before:rotate-[-90deg] before:bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] before:content-[''] before:[inset:0_auto_auto_50%] before:[translate:-50%_-15%]"
                />
              </span>
              <span
                class="backdrop absolute inset-px rounded-[11px] bg-[#FBCE3C] transition-colors duration-200 group-hover:bg-[#be9204"
              />
              <span class="z-10 text-black text-[1rem] sm:text-lg font-semibold">
                <slot>Free trial for 7 days</slot>
              </span>
              
            </a>


            </div>
              <!--<img class="w-72 sm:w-[450px] -my-8 mt-8 sm:mt-0 sm:-my-16" src={test} alt="logo">-->
            </div>
      </div>
    </section>










<style lang='scss'>

.overlay {
  position: relative;
}

.overlay img {
  width: 100%;
  height: auto;
}

.overlay::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: linear-gradient(to top, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0) 50%);
  pointer-events: none; /* Ensure the overlay doesn't interfere with interaction */
}

    .bg-radial-gradient {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    background: radial-gradient(circle at top, rgba(255, 165, 0, 1) 0%, rgba(255, 165, 0, 0.7) 30%, rgba(128, 0, 128, 0.7) 70%, rgba(128, 0, 128, 1) 100%);
    filter: blur(200px);
}


.fade-down {
    -webkit-transform: translate3d(0, -25px, 0);
    transform: translate3d(0, -25px, 0);
    opacity: 0;
    animation: fadeDown 0.6s ease-out forwards;
}

@keyframes fadeDown {
    to {
        -webkit-transform: translate3d(0, 0, 0);
        transform: translate3d(0, 0, 0);
        opacity: 1;
    }
}


  </style>