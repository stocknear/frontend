<script lang='ts'>
import logo from '$lib/images/news_logo.png'
import ScrollToTop from '$lib/components/ScrollToTop.svelte';


let displaySection = 'stock'


</script>

<!-- HEADER FOR BETTER SEO -->
<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
</svelte:head>




<section class="w-full max-w-3xl sm:max-w-screen-xl overflow-hidden min-h-screen pt-5 pb-40">

  <!--
  <div class="text-sm breadcrumbs ml-4">
    <ul>
      <li><a href="/" class="text-gray-300">Home</a></li> 
      <li class="text-gray-300">Market News</li>
    </ul>
  </div>
  -->

    <div class="flex justify-center w-full m-auto h-full overflow-hidden mb-40">
        <div class="relative flex justify-center items-center overflow-hidden">
            <main>
  
  
              <div class="w-full m-auto sm:bg-[#27272A] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
              
                  <!-- Start Column -->
                  <div>
                    <div class="flex flex-row justify-center items-center">
                      <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
                        Market News
                      </h1>
                    </div>
          
                    <span class="hidden sm:block text-white text-md font-medium text-center flex justify-center items-center ">
                      Flush your stock worries away with our website's latest news!
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
                    
                    
                    <div class="z-1 absolute top-1 right-10">
                      <img class="w-24 mr-1" src={logo} alt="logo" loading="lazy">
                    </div>
                  </div>
                  <!-- End Column -->
                </div>
          
               
          
          
              </div>
  


                <div class="ml-4 w-full mb-2" >
                  <ul class="pr-4 sm:pr-0 w-full font-medium flex flex-row items-center bg-[#09090B] overflow-x-scroll no-scrollbar space-x-3 rtl:space-x-reverse py-2">
                    <li class="cursor-pointer flex flex-col items-center text-xl">
                      <a href='/market-news' on:click={() => displaySection = 'stock'} class="px-3 font-medium text-gray-400 sm:hover:text-white {displaySection === 'stock' ? 'text-white ' : 'bg-[#09090B]'}" >
                        Stock
                      </a>
                      <div class="{displaySection === 'stock' ? 'bg-[#75D377]' : 'bg-[#09090B]'} mt-1 h-[3px] rounded-full w-[4.2rem]" />
                    </li>
                    <li class="cursor-pointer flex flex-col items-center text-xl">
                      <a href='/market-news/general' on:click={() => displaySection = 'general'} class="px-3 font-medium text-gray-400 sm:hover:text-white {displaySection === 'general' ? 'text-white ' : 'bg-[#09090B]'}" >
                        General
                      </a>
                      <div class="{displaySection === 'general' ? 'bg-[#75D377]' : 'bg-[#09090B]'} mt-1 h-[3px] rounded-full w-[4.2rem]" />
                    </li>
                  </ul>
                </div>




              <div class="border-b mt-5 border-slate-700" />

                <slot />
                
                <ScrollToTop />
                
            </main>

        </div>
    </div>
  </section>
  
  
  
  
  