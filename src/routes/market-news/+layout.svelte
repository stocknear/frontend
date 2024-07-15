<script lang='ts'>
import { page } from '$app/stores';
import logo from '$lib/images/news_logo.png'
import ScrollToTop from '$lib/components/ScrollToTop.svelte';

let displaySection = '';



const navigation = [
    {
        title: 'Stock',
        link: '/market-news'
    },
    {
        title: 'Crypto',
        link: '/market-news/crypto'
    },
    {
        title: 'General',
        link: '/market-news/general'
    },

];



</script>

<!-- HEADER FOR BETTER SEO -->
<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
</svelte:head>




<section class="w-full max-w-5xl overflow-hidden m-auto min-h-screen pt-4 mb-40">

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
  
  
              <div class="w-full max-w-5xl m-auto sm:bg-[#27272A] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
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
  
  
              <div class="pl-4 pr-4 sm:pl-0 sm:pr-0 w-screen sm:w-full">

                    <div class="tabs flex flex-row justify-between sm:justify-start items-center w-full pl-3 pr-3 sm:pl-0 sm:pr-0">

                    {#each navigation as item}
                   
                      <a href={item?.link} class="flex flex-col items-center w-fit text-center text-xl mr-0 sm:mr-10 rounded-md transition font-semibold hover:text-white {(item?.link === $page.url.pathname || item?.link +'/' === $page.url.pathname) ? ' text-white' : 'text-[#9A9996]'}" >
                        <span>{item.title}</span>
                        <div class="{(item?.link === $page.url.pathname || item?.link +'/' === $page.url.pathname) ? 'bg-[#75D377]' : 'bg-[#09090B]'} mt-1 h-[3px] rounded-full w-[3rem] rounded-full" />
                      </a> 

        
                    {/each}
        
                  </div>


              </div>
              <div class="border-b mt-5 border-slate-700" />

                <slot />
                
                <ScrollToTop />
                
            </main>

        </div>
    </div>
  </section>
  
  
  
  
  