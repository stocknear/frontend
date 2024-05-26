<script lang='ts'>
import { page } from '$app/stores';
import { numberOfUnreadNotification, screenWidth } from '$lib/store';
import { goto } from '$app/navigation';
      
let navigation = [];
let displaySection = '2024'
let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;


for(let year = 2024; year >=2019; year--) {
  
    navigation.push({ title: year, link: `/ipos/${year}` });
 
}

function scrollToItem(itemId) {
    const item = document.getElementById(itemId);
    if (item) {
      
      item.scrollIntoView({ behavior: 'smooth' });
      window.scrollTo(0,0)
    }
  }

    
function changeSection(state, item) {
  scrollToItem(item);
  displaySection = state;
  goto(`/ipos/${state}`);
}


$: {
  if($page.url.pathname)
  {
      const parts = $page?.url?.pathname?.split('/');
      const sectionMap = {
        '2024': '2024',
        '2023': '2023',
        '2022': '2022',
        '2021': '2021',
        '2020': '2020',
        '2019': '2019'
      };
      displaySection = sectionMap[parts?.find(part => Object?.keys(sectionMap)?.includes(part))] || 'overview';
  }
}


</script>
    
<!-- HEADER FOR BETTER SEO -->
<svelte:head>
    <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} IPOs Calendar · stocknear</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />

    <meta name="description" content="A list of upcoming ipos on the US stock market.">
    <!-- Other meta tags -->
    <meta property="og:title" content="IPOs Calendar · stocknear"/>
    <meta property="og:description" content="A list of upcoming ipos on the US stock market.">
    <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <meta property="og:type" content="website"/>
    <!-- Add more Open Graph meta tags as needed -->

    <!-- Twitter specific meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="IPOs Calendar · stocknear"/>
    <meta name="twitter:description" content="A list of upcoming ipos on the US stock market.">
    <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
    <!-- Add more Twitter meta tags as needed -->
</svelte:head>
    
    
    
    <section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 mb-40">
      <!--
      <div class="text-sm breadcrumbs ml-4">
        <ul>
          <li><a href="/" class="text-gray-300">Home</a></li> 
          <li class="text-gray-300">Analysts</li>
        </ul>
      </div>
    -->
    
        <div class="flex justify-center w-full m-auto h-full overflow-hidden mb-40">
            <div class="relative flex justify-center items-center overflow-hidden">
                <main>
      
      
                  <div class="w-full max-w-4xl m-auto sm:bg-[#202020] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-12">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
                  
                      <!-- Start Column -->
                      <div>
                        <div class="flex flex-row justify-center items-center">
                          <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
                            IPO Calendar
                          </h1>
                        </div>
              
                        <span class="text-white text-md font-medium text-center flex justify-center items-center ">
                            Stay updated on upcoming IPOs in the stock market.
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
                        
                        
                        <div class="z-1 absolute top-0 left-7">
                            <img class="w-[90px] h-fit" src={cloudFrontUrl+"/assets/ipo_logo.png"} alt="logo" loading="lazy">
                          </div>
                      </div>
                      <!-- End Column -->
                    </div>
              
                   
              
              
                  </div>
      

                  <div class="pl-4 pr-4 sm:pl-0 sm:pr-0 w-full {$page?.url?.pathname === '/ipos' ? 'hidden' : ''}">
    
                        <div class="tabs flex flex-row justify-between sm:justify-start items-center w-full pl-3 pr-3 sm:pl-0 sm:pr-0">
    
                          <div class="sm:pl-2 w-screen sm:w-full {$screenWidth < 640 ? 'overflow-auto scrollbar no-scrollbar' : 'flex flex-row items-center gap-x-4'} pr-5 sm:pr-0">
                            <div class="flex flex-col items-center sm:w-fit">
                              <button id="item1" on:click={() => (changeSection('2024','item1'))} class="text-lg font-medium text-gray-400 sm:hover:text-white {displaySection === '2024' ? 'text-white' : 'bg-[#0F0F0F]'}">
                                2024
                              </button>
                              <div class="{displaySection === '2024' ? 'bg-[#75D377]' : 'bg-[#0F0F0F]'} mt-1 h-[3px] rounded-full w-14" />
                            </div>
                            <div class="flex flex-col items-center sm:ml-5 w-fit">
                              <button id="item2" on:click={() => (changeSection('2023','item2'))} class="text-lg font-medium text-gray-400 sm:hover:text-white {displaySection === '2023' ? 'text-white ' : 'bg-[#0F0F0F]'}">
                                2023
                              </button>
                              <div class="{displaySection === '2023' ? 'bg-[#75D377]' : 'bg-[#0F0F0F]'} mt-1 h-[3px] rounded-full w-14" />
                            </div>
                            <div class="flex flex-col items-center -ml-6 sm:ml-4 w-fit">
                              <button id="item3" on:click={() => (changeSection('2022','item3'))} class="text-lg font-medium text-gray-400 sm:hover:text-white {displaySection === '2022' ? 'text-white ' : 'bg-[#0F0F0F]'}">
                                2022
                              </button>
                              <div class="{displaySection === '2022' ? 'bg-[#75D377]' : 'bg-[#0F0F0F]'} mt-1 h-[3px] rounded-full w-14" />
                            </div>
                            <div class="flex flex-col items-center -ml-12 sm:ml-4 w-fit ">
                              <button id="item4" on:click={() => (changeSection('2021','item4'))} class="text-lg font-medium text-gray-400 sm:hover:text-white {displaySection === '2021' ? 'text-white ' : 'bg-[#0F0F0F]'}">
                                2021
                              </button>
                              <div class="{displaySection === '2021' ? 'bg-[#75D377]' : 'bg-[#0F0F0F]'} mt-1 h-[3px] rounded-full w-14" />
                            </div>
                            <div class="flex flex-col items-center ml-2 sm:ml-4 w-fit">
                              <button id="item5" on:click={() => (changeSection('2020','item5'))} class="text-lg font-medium text-gray-400 sm:hover:text-white {displaySection === '2020' ? 'text-white ' : 'bg-[#0F0F0F]'}">
                                2020
                              </button>
                              <div class="{displaySection === '2020' ? 'bg-[#75D377]' : 'bg-[#0F0F0F]'} mt-1 h-[3px] rounded-full w-14" />
                            </div>
                            <div class="flex flex-col items-center ml-2 sm:ml-4 w-fit">
                              <button id="item6" on:click={() => (changeSection('2019','item6'))} class="text-lg font-medium text-gray-400 sm:hover:text-white {displaySection === '2019' ? 'text-white ' : 'bg-[#0F0F0F]'}">
                                2019
                              </button>
                              <div class="{displaySection === '2019' ? 'bg-[#75D377]' : 'bg-[#0F0F0F]'} mt-1 h-[3px] rounded-full w-14" />
                            </div>
                            
                          </div>
                          
            
                      </div>
    
    
                  </div>
                  <div class="border-b mt-4 border-slate-700" />
    
                    <slot />
                    
                </main>
    
            </div>
        </div>
      </section>
      
      
      
      
      


<style lang='scss'>
       

  .scrollbar {
      display: grid;
      grid-gap: 17px;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
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
  
  
  </style>