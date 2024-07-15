<script lang='ts'>
    import { numberOfUnreadNotification } from '$lib/store';
    import { page } from '$app/stores';
    import logo from '$lib/images/provider_logo.png';
    import { formatETFName } from '$lib/utils';
        
    let currentPath = '';

    $: {
        if($page?.url?.pathname?.startsWith('/etf/etf-providers'))
        {
            const parts = $page?.url?.pathname.split('/');
            if (parts?.[3]?.length !== 0) {
                currentPath = formatETFName(parts[3]) ?? '';
                console.log(currentPath)
            }
            else {
                currentPath = '';
            }
        }
    }
</script>
        


<svelte:head>
  <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Largest ETF Providers by Assets Under Management · stocknear</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />

  <meta name="description" content="A complete list of all the companies that provide exchange-traded funds (ETFs) that are actively traded on the U.S. stock market.">
  <!-- Other meta tags -->
  <meta property="og:title" content="Largest ETF Providers by Assets Under Management · stocknear"/>
  <meta property="og:description" content="A complete list of all the companies that provide exchange-traded funds (ETFs) that are actively traded on the U.S. stock market.">
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="Largest ETF Providers by Assets Under Management · stocknear"/>
  <meta name="twitter:description" content="A complete list of all the companies that provide exchange-traded funds (ETFs) that are actively traded on the U.S. stock market.">
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>
    
    
          
<section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-40">
    
    <div class="text-sm breadcrumbs mb-2 ml-4">
        <ul>
            <li><a href="/" class="text-gray-300">Home</a></li> 
            <li><a href="/etf/etf-providers" class="text-gray-300">ETF Providers</a></li> 
        {#if currentPath?.length !== 0 && typeof currentPath !== undefined}
            <li class="text-gray-300">{currentPath}</li> 
        {/if}
        </ul>
    </div>



<div class="w-full max-w-4xl m-auto sm:bg-[#27272A] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">

    <!-- Start Column -->
    <div>
        <div class="flex flex-row justify-center items-center">
        <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
            ETF Providers
        </h1>
        </div>

        <span class="hidden sm:block text-white text-md font-medium text-center flex justify-center items-center ">
            Companies issue and manage ETFs actively traded on the U.S. stock market.
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
        

        <div class="z-1 absolute top-4">
        <img class="w-32 ml-4" src={logo} alt="logo" loading="lazy">
        </div>
    </div>
    <!-- End Column -->
    </div>


</div>



<div class="w-full max-w-4xl m-auto mb-10 bg-[#09090B] overflow-hidden">


    <!--Start Top Winners/Losers-->
    <div class="flex flex-col justify-center items-center">
        

        <slot />
    </div>
        
    

    
    </div>





</section>

