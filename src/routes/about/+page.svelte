<script lang="ts">
  

  import { numberOfUnreadNotification } from '$lib/store';
  /*
  import { intersect } from 'svelte-intersection-observer-action';

  
  const threshold = 0.4 // change the threshold value to 0.4 for 40%
	const rootMargin = '-0px 0px'
	const intersectOptions = { callback, threshold, rootMargin }
	function callback(entry: IntersectionObserverEntry) {
		if (entry.intersectionRatio > threshold) {
      entry.target.classList.remove('invisible')
			entry.target.classList.add('')
    }
  }
  */
  
  let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;

</script>

<svelte:head>
  <title> {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} About · stocknear</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />

  <meta name="description" content="Welcome to Stocknear — a site that aims to be the internet's best source of free stock data and information for small investors.">
  <!-- Other meta tags -->
  <meta property="og:title" content="About · stocknear"/>
  <meta property="og:description" content="Welcome to Stocknear — a site that aims to be the internet's best source of free stock data and information for small investors.">
  <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="About · stocknear"/>
  <meta name="twitter:description" content="Welcome to Stocknear — a site that aims to be the internet's best source of free stock data and information for small investors.">
  <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>
    


<body>


    
  <div class="w-full max-w-4xl overflow-hidden m-auto min-h-screen pt-10 mb-40">
    
    <!--Start Mission-->
    <div class="bg-[#0F0F0F] w-full hover:border-slate-500 border-slate-600 h-auto sm:p-10 mt-3">
      <div class="text-white text-4xl sm:text-5xl text-center p-3 sm:mt-5">
          <span class="font-bold">
            A stock analysis platform by the users, for the users.
          </span>
      </div>

      
      <div class="text-white text-lg mt-3 text-center pl-10 pr-10">
        Our mission is to create the first large-scale stock analysis platform in which the platform's interests are aligned with those of the user—a platform founded on ethical design principles. At the heart of these principles is the concept of complete transparency, which is why the entire codebase is <a href="https://github.com/stocknear" rel="noopener noreferrer" target="_blank" class="text-blue-400 sm:hover:text-white sm:hover:underline" >open source</a>. 

           <!-- Start Image -->
           <div class="m-auto flex justify-center mt-6">
            <div class="relative">
                <div class="z-1 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <img class="w-28 mr-4"  src={cloudFrontUrl+"/assets/globe.png"} alt="logo" loading="lazy">
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
            </div>
            <!-- End Image -->
      </div>
    </div>
    <!--End Mission-->


        <!-- Start Section-->
        <div class="bg-[#0F0F0F] w-full hover:border-slate-500 border-slate-600 h-auto pl-1 pr-1 sm:pl-0 sm:pr-0 pb-10 mb-8">
          <div class="text-white text-4xl sm:text-5xl text-center p-3 mt-10 sm:mt-5">
              <span class="font-bold ">
                No ads. No tracking.
              </span>
          </div>

          
          <div class="text-white text-lg mt-3 text-center pl-10 pr-10">
            Stocknear has no ads, third-party affiliate marketing, or tracking. Your attention and data are never monetized. If you're skeptical, that's okay—soon, just look at our code <a href="https://github.com/stocknear" rel="noopener noreferrer" target="_blank" class="text-blue-400 sm:hover:text-white sm:hover:underline" >here</a>. 
          </div>
      </div>
      <!--End Section-->


       <!-- Start Section-->
       <div class="bg-[#0F0F0F] w-full hover:border-slate-500 border-slate-600 h-auto pb-10 mb-8">
        <div class="text-white text-4xl sm:text-5xl text-center p-3 mt-10 sm:mt-5">
            <span class="font-bold ">
              No Dark Patterns
            </span>
        </div>

        
        <div class="text-white text-lg mt-3 text-center pl-10 pr-10">
          On Stocknear, there are no intrusive pop-ups asking you to sign up unless necessary. You don't need an account to view pages, we don't manipulate you into using our platform more than you want to. If you wish to cancel your subscription, there's no survey to fill out; you can cancel it in just 2 seconds.
        </div>
    </div>
    <!--End Section-->

    <!--Start Why we need this -->
    <div class="bg-[#0F0F0F] w-full bg-[#0F0F0F]  sm:border-t hover:border-slate-500 border-slate-600 h-auto sm:p-10 mt-3 mb-8">
      <div class="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-200/60 via-slate-200 to-slate-200/60 text-center p-3 mt-10 sm:mt-5">
            What we offer
      </div>

      <div class="text-white text-lg mt-3 text-center pl-3 pr-3 sm:pl-10 sm:pr-10">
          We support small investors, like yourself, to conduct due diligence through an extensive array of data sources. These include fundamental data such as income statements, balance sheets, and cashflow ratios, along with insights from US Senate trading data, dividends, hedge fund portfolios, latest news, earnings transcripts, statistical models for future prices, and more to be added in the future. Take control of your investments, make informed decisions, and execute profitable trades by leveraging our comprehensive data presented with the best UI.

           <!-- Start Image -->
           <div class="m-auto flex justify-center mt-5">
            <div class="relative">
                <div class="z-1 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <img class="w-20 mr-8"  src={cloudFrontUrl+"/assets/no_money_logo.png"} alt="logo" loading="lazy">
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
            </div>
            <!-- End Image -->
      </div>
    </div>
    <!--End Why we need this -->


     <!--Start Why we need this -->
     <div class="bg-[#0F0F0F] w-full bg-[#0F0F0F]  sm:border-t hover:border-slate-500 border-slate-600 h-auto sm:p-10 mt-3 mb-20 sm:mb-8">
      <div class="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-200/60 via-slate-200 to-slate-200/60 text-center p-3 mt-10 sm:mt-5">
          <span class="font-bold ">
            Why choose us
          </span>
      </div>

      <div class="-mt-10 sm:mt-0 text-white text-lg text-center pl-3 pr-3 sm:pl-10 sm:pr-10">
        <br class="mb-8 sm:mb-5">
          You don't have to. There are tons of other website that provide similar services and that's ok.
          <br>
          <br>

          As a physicist, I prioritize transparency and rigorous analysis. 
          During my PhD in theoretical particle physics, I developed models to describe New Physics effects beyond our current knowledge of the universe, as shown by my publication record <a href="https://inspirehep.net/authors/1838037" target="_blank" class="hover:text-white text-blue-400 underline">here</a>. 
          <br class="mb-5">
          Unlike most financial websites run by programmers, I combine my programming skills with a scientific approach.
          <br>
          <br>
          If you find value in stocknear's approach to tackling stock analysis tasks, that's great. If not, I wish you all the best on your trading journey and maybe we will see us again in the future.
          <!-- Start Image -->
           <div class="m-auto flex justify-center mt-5">
            <div class="relative">
                <div class="z-2 absolute mt-3">
                    <img class="w-56 sm:w-64 ml-16 sm:ml-10 mt-12 sm:mt-8"  src={cloudFrontUrl+"/assets/community_logo.png"} alt="logo" loading="lazy">
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
            </div>
            <!-- End Image -->
      </div>
    </div>
    <!--End Why we need this -->


     <!--Start Team -->
     <div class="bg-[#0F0F0F] w-full bg-[#0F0F0F]  sm:border-t hover:border-slate-500 border-slate-600 h-auto sm:p-10 mt-3">
      <div class="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-200/60 via-slate-200 to-slate-200/60 text-center p-3 mt-10 sm:mt-5">
        Team
      </div>

      <div class="text-white text-lg mt-3 text-center">
        <!-- Team members -->
        <div class="sm:flex sm:flex-wrap sm:justify-center mb-4">
            <!-- 1st member -->
            <div class="m-auto flex justify-center items-center mt-6">
                <div class="flex flex-col justify-center items-center w-full">
                    <img class="rounded-full mb-4 w-20 sm:w-28" src={cloudFrontUrl+"/assets/mrahimi.webp"} alt="Founder" loading="lazy"/>
                    <h4 class="text-lg mb-1">
                      Dr. Muslem Rahimi
                    </h4>
                    <div class="text-white mb-6">
                      Chief of Nothing
                    </div>
                    <span class="text-[1.1rem] p-3 text-gray-300">
                      During my PhD in physics, I was developing models to describe New Physics.
                      Now I'm developing a stock analysis platform to help small investors.
                    </span>
                </div>
            </div>

        </div>
      </div>
    </div>
    <!--End Team -->






  </div>

</body>

