<script lang="ts">

    import { numberOfUnreadNotification } from '$lib/store';

    export let data;

    let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;

</script>
      
      
    
<svelte:head>

<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>
  {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Free Market Newsletter: Stay Informed in Just 2 Minutes Per Day · stocknear
</title>
<meta name="description" content={`Get our free newsletter to be up to date with the current market.`} />

<!-- Other meta tags -->
<meta property="og:title" content={`Free Market Newsletter: Stay Informed in Just 2 Minutes Per Day · stocknear`}/>
<meta property="og:description" content={`Get our free newsletter to be up to date with the current market.`} />
<meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`Free Market Newsletter: Stay Informed in Just 2 Minutes Per Day · stocknear`}/>
<meta name="twitter:description" content={`Get our free newsletter to be up to date with the current market.`} />
<meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
<!-- Add more Twitter meta tags as needed -->

</svelte:head>

    
<section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-40">
    <!--
    <div class="text-sm breadcrumbs ml-4">
        <ul>
          <li><a href="/" class="text-gray-300">Home</a></li> 
          <li class="text-gray-300">Newsletter</li>
        </ul>
      </div>
    -->

    <div class="w-full max-w-4xl m-auto sm:bg-[#09090B] sm:rounded-xl h-auto p-10 mt-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
    
        <!-- Start Column -->
        <div>
            <div class="flex flex-row justify-center items-center">
            <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-4">
                Market Newsletter
            </h1>
            </div>
    
            <span class="w-3/4 m-auto text-white text-md font-medium text-center flex justify-center items-center ">
                Stay informed everyday to trade smarter
            </span>
    
        </div>
        <!-- End Column -->
    
        <!-- Start Column -->
        <div class="relative m-auto mb-5 mt-5 sm:mb-0 sm:mt-0">
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
            
            
            <div class="z-1 absolute top-0 left-8 ">
            <img class="w-32 " src={cloudFrontUrl+'/assets/newsletter_logo.png'} alt="logo" loading="lazy">
            </div>
        </div>
        <!-- End Column -->
        </div>
    
    
    </div>
    
    
        
    <div class="bg-[#09090B] sm:mt-10 sm:rounded-xl border-t sm:border hover:border-slate-700 border-slate-800 pb-10">
      
        <div class="text-white w-5/6 sm:w-full m-auto sm:m-0 text-center sm:text-start font-bold text-2xl flex justify-center sm:justify-start items-center pt-10 sm:ml-10">
            Stay informed in just 2 minutes per day
        </div>

        <span class="text-white w-5/6 sm:w-full m-auto sm:m-0 text-center sm:text-start font-medium text-[1rem] sm:text-lg flex justify-center sm:justify-start items-center pt-7 sm:pt-4 pb-10 sm:pb-5 sm:ml-10">
            Get super simple bullet-point summaries keep up with the market. 
        </span>

        <ol class="list-disc pl-7 text-white text-[1rem] sm:text-lg pb-5 ml-3 sm:ml-10">
            <li class="w-11/12">
                A quick overview of the most active stocks the past 24h.
            </li>
            <li class="pt-3 w-11/12">
                Concise, easy-to-read bullet points highlighting key market developments, significant earnings and other important news.
            <li class="pt-3 w-11/12">
                We rely exclusively on reliable, current information from top-tier sources.
            </li>
        </ol>

        <span class="text-white w-96 sm:w-11/12 m-auto sm:m-0 text-center sm:text-start text-[1rem] sm:text-lg flex justify-center sm:justify-start items-center pt-7 sm:pt-4 pb-5 sm:pb-5 sm:ml-10">
            Receive our free newsletter in your inbox every weekday morning, before the market opens, from Monday to Friday.
        </span>

        {#if !data?.user}
        <a class="w-96 mt-6 m-auto flex m-auto justify-center items-center m-auto btn text-white bg-purple-600 hover:bg-purple-500 transition duration-150 ease-in-out group" href="/register">
            Get Newsletter
            <span class="tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out">
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(90 12 12)"><g fill="none"><path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"/><path fill="white" d="M13.06 3.283a1.5 1.5 0 0 0-2.12 0L5.281 8.939a1.5 1.5 0 0 0 2.122 2.122L10.5 7.965V19.5a1.5 1.5 0 0 0 3 0V7.965l3.096 3.096a1.5 1.5 0 1 0 2.122-2.122L13.06 3.283Z"/></g></g></svg>
            </span>
        </a>
        {/if}


        <!--
        <form method="POST" class="flex flex-col items-center space-y-2 w-5/6 sm:pt-8 ml-auto mr-auto">
            <Input
                type="email"
                id="email"
                label=""
                placeholder="Enter your email address"
                value={form?.data?.email ?? ''}
                required={true}
                errors=''
            />
            <div class="w-full sm:w-5/6 max-w-lg m-auto pb-5">
                <button type="submit" class="py-3 bg-purple-600 text-white hover:bg-purple-500 w-full rounded-lg m-auto font-bold text-md">
                    Subscribe
                </button>
            </div>
        </form>
        -->


    </div>
    
    
</section>

    
