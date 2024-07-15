<script>
  import logo from '$lib/images/feedback_logo.png';
  import { numberOfUnreadNotification } from '$lib/store';
  
  const emailAddress = 'support@stocknear.com';
</script>


<svelte:head>

<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>
  {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Contact Us · stocknear
</title>
<meta name="description" content={`Need help, found a bug or you have a feature request. Please contact us to resolve any issues.`} />

<!-- Other meta tags -->
<meta property="og:title" content={`Contact Us · stocknear`}/>
<meta property="og:description" content={`Need help, found a bug or you have a feature request. Please contact us to resolve any issues.`} />
<meta property="og:type" content="website"/>
<!-- Add more Open Graph meta tags as needed -->

<!-- Twitter specific meta tags -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content={`Contact Us · stocknear`}/>
<meta name="twitter:description" content={`Need help, found a bug or you have a feature request. Please contact us to resolve any issues.`} />
<!-- Add more Twitter meta tags as needed -->

</svelte:head>




    
    
<section class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-5 pb-40">
   <!-- 
  <div class="text-sm breadcrumbs ml-4">
    <ul>
      <li><a href="/" class="text-gray-300">Home</a></li> 
      <li class="text-gray-300">Contact Us</li>
    </ul>
  </div>
  -->

  <div  class="w-full m-auto sm:bg-[#27272A] sm:rounded-xl h-auto pl-10 pr-10 pt-5 sm:pb-10 sm:pt-10 mt-3 mb-8">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
  
      <!-- Start Column -->
      <div>
        <div class="flex flex-row justify-center items-center sm:mt-5">
          <h1 class="text-3xl sm:text-4xl text-white text-center font-bold mb-5">
            Sharing is Caring
          </h1>
        </div>

        <span class="text-white text-md font-medium text-center flex justify-center  items-center ">
          unless it's family
        </span>
      </div>
      <!-- End Column -->
  
      <!-- Start Column -->
      <div class="relative m-auto mb-5 sm:mb-0">
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
        
        
        <div class="z-1 absolute top-3 ">
          <img class="w-24 ml-9" src={logo} alt="logo">
        </div>
      </div>
      <!-- End Column -->
  
    </div>
    
  </div>



<div class="card w-full rounded-none sm:rounded-xl border-t border-slate-800 sm:border sm:border-slate-800 m-auto ">
  <div class="card-body">
    <h2 class="card-title text-2xl mb-5 text-white">Support</h2>
    <p class="text-white ">
      Please take a moment to share your thoughts on this website with us. We welcome any feedback you may have. If there's a feature you'd like to see implemented, please let us know and we'll work to make the website even better for you. Thank you for your time and input!
  
  </p>
  <p class="text-white mt-5">
      <!-- svelte-ignore a11y-missing-content -->
      You can contact us at 
      <a href={`mailto:${emailAddress}`} class="text-blue-400 hover:text-white hover:underline">{emailAddress}</a>
  </p>
  </div>
  </div>
  


</section>