<script>

//Nested layout
import { page } from '$app/stores'
let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;


const navigation = [
    {
        title: 'Best',
        link: '/hedge-funds/category/best'
    },
    {
        title: 'Worst',
        link: '/hedge-funds/category/worst'
    },
    {
        title: 'All',
        link: '/hedge-funds/category/all'
    },
];


</script>




<section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-60">
        
  <div class="text-sm breadcrumbs ml-4">
    <ul>
      <li><a href="/" class="text-gray-300">Home</a></li> 
      <li class="text-gray-300">Hedge Funds</li>
    </ul>
  </div>

    <div class="w-full max-w-4xl m-auto sm:bg-[#202020] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
    
        <!-- Start Column -->
        <div>
          <div class="flex flex-row justify-center items-center">
            <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
              Hedge Funds
            </h1>
          </div>
  
          <span class="hidden sm:block text-white text-md font-medium text-center flex justify-center items-center ">
              Monitor expert portfolios to maximize your profit potential
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
          
          
          <div class="z-1 absolute -top-0">
            <img class="w-20 ml-8" src={cloudFrontUrl+"/assets/hedge_funds_logo.png"} alt="logo" loading="lazy">
          </div>
        </div>
        <!-- End Column -->
      </div>
  
    
  
    </div>
  
      <div class="w-full m-auto mb-10 bg-[#0F0F0F] pl-3 pr-3">
        <div class="tabs flex flex-row justify-start items-center w-full pl-3 pr-3 sm:pl-0 sm:pr-0">
          {#each navigation as item}
         
            <a href={item?.link} class="w-fit text-center text-xl m-auto sm:m-0 sm:mr-10 rounded-md transition font-semibold hover:text-white {(item?.link === $page.url.pathname || item?.link +'/' === $page.url.pathname) ? ' text-white' : 'text-[#9A9996]'}">
              {item?.title}
              <div class="{(item?.link === $page.url.pathname || item?.link +'/' === $page.url.pathname) ? 'bg-[#75D377]' : 'bg-[#0F0F0F]'} mt-1 h-[3px] rounded-full w-[3.5rem] rounded-full" />
            </a> 

          {/each}

        </div>
          <div class="border-b mt-5 border-blue-400" />
        </div>
  
  
    
    <div class="w-full">
        <slot/>
    </div>
  
  
  </section>

  