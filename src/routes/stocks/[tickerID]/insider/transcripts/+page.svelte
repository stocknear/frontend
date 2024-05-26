<script lang='ts'>
  import { stockTicker, userRegion, getCache, setCache, displayCompanyName, screenWidth, numberOfUnreadNotification } from '$lib/store';
  import InfiniteLoading from '$lib/components/InfiniteLoading.svelte';
  import { page } from '$app/stores';
    
  export let data;
  
  let rawData = data?.getTranscripts?.chat ?? [];
  let date = data?.getTranscripts?.date;
  
  let chats = rawData?.slice(0,20) ?? [];
  let notDestroyed = true;
  
  let charNumber = 20;
  let displayQuarter = '4';
  let displayYear = '2023';
  let quarter = displayQuarter;
  let year = displayYear;
  let isLoaded = true;
  
  const usRegion = ['cle1','iad1','pdx1','sfo1'];
  
  let apiURL;
  
  userRegion.subscribe(value => {
  
    if (usRegion.includes(value)) {
      apiURL = import.meta.env.VITE_USEAST_API_URL;
    } else {
      apiURL = import.meta.env.VITE_EU_API_URL;
    }
  });
  
  
  function backToTop() {
      window.scrollTo({
          top: 0,
          behavior: 'smooth'
      });
  }
  
  
  async function infiniteHandler({ detail: { loaded, complete } }) 
  {
      if (chats?.length === rawData?.length && notDestroyed) {
          complete();
      } else if (notDestroyed) {
          const nextIndex = chats?.length;
          const newSymbols = rawData?.slice(nextIndex, nextIndex + 5);
          chats = [...chats, ...newSymbols];
          loaded();
      }
  }
  
  const getTranscripts = async () => {
      isLoaded = false;
      chats = [];
      let output;
      // Get cached data for the specific tickerID
      const cachedData = getCache(`${$stockTicker}-Q-${quarter}-${year}`, 'getTranscripts');
      if (cachedData) {
        output = cachedData;
      } else {
        const postData = {
          ticker: $stockTicker,
          quarter: quarter,
          year: year
        };
  
        // make the POST request to the endpoint
        const response = await fetch(apiURL + '/earnings-call-transcripts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData)
        });
  
        output = await response.json();
        // Cache the data for this specific tickerID with a specific name 'getTranscripts'
        setCache(`${$stockTicker}-Q-${quarter}-${year}`, output, 'getTranscripts');
      }
  
      rawData = output?.chat ?? [];
      chats = rawData?.slice(0,5); 
      date = output?.date ?? '-';
      displayQuarter = quarter;
      displayYear = year;
      isLoaded = true;
  
    };
  
  
  $: {
      if($screenWidth < 640)
      {
      charNumber = 10;
      }
      else {
      charNumber =20;
      }
  }
  
  $: {
    if(chats) {
      rawData = [...rawData];
      chats = [...chats];
    }
  }
  $: {
  if ($page.url.pathname !== `/stocks/${$stockTicker}/transcripts`) {
  notDestroyed = false;
  }
  }
  </script>
    
    
    <svelte:head>
    
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width" />
      <title>
        {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} {$displayCompanyName} ({$stockTicker}) · Q{quarter} {year} · Earnings Call Transcript · stocknear
      </title>
      <meta name="description" content={`Get the latest Earnings Call Transcript of ${$displayCompanyName} (${$stockTicker}) for different years and quarters.`} />
      
      <!-- Other meta tags -->
      <meta property="og:title" content={`${$displayCompanyName} (${$stockTicker}) · Q${quarter} ${year} · Earnings Call Transcript · stocknear`}/>
      <meta property="og:description" content={`Get the latest Earnings Call Transcript of ${$displayCompanyName} (${$stockTicker}) for different years and quarters.`} />
      <meta property="og:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
      <meta property="og:type" content="website"/>
      <!-- Add more Open Graph meta tags as needed -->
    
      <!-- Twitter specific meta tags -->
      <meta name="twitter:card" content="summary_large_image"/>
      <meta name="twitter:title" content={`${$displayCompanyName} (${$stockTicker}) · Q${quarter} ${year} · Earnings Call Transcript · stocknear`}/>
      <meta name="twitter:description" content={`Get the latest Earnings Call Transcript of ${$displayCompanyName} (${$stockTicker}) for different years and quarters.`} />
      <meta name="twitter:image" content="https://stocknear-pocketbase.s3.amazonaws.com/logo/meta_logo.jpg"/>
      <!-- Add more Twitter meta tags as needed -->
    
    </svelte:head>
      
         
                      
        
              
        <section class="bg-[#0F0F0F] overflow-hidden text-white h-full mb-40 sm:mb-0">
            <div class="flex justify-center m-auto h-full overflow-hidden">
                <div class="relative flex justify-center items-center overflow-hidden w-full">
                      <div class="sm:p-7 sm:w-full sm:max-w-3xl m-auto mt-5 sm:mt-0">
                        <div class="mb-6 w-full">
                            <h1 class="text-2xl sm:text-3xl text-gray-200 font-bold mb-4">
                              Transcripts
                            </h1>
                            
                            <div class="text-white p-3 sm:p-5 mb-10 rounded-lg sm:flex sm:flex-row sm:items-center border border-slate-800 text-sm sm:text-[1rem]">
                              <svg class="w-6 h-6 flex-shrink-0 inline-block sm:mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#60a5fa" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m-4 48a12 12 0 1 1-12 12a12 12 0 0 1 12-12m12 112a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 0 16"/></svg>
                              Discover the earnings call highlights and investor Q&A with {$displayCompanyName}!                              
                            </div>

  
                            <div class="flex flex-row items-center mb-5 pt-3 justify-center sm:justify-end">
                              <label for="quarterModal" class="ml-1 sm:ml-3 text-sm cursor-pointer bg-[#202020] sm:hover:bg-[#202020] duration-100 transition ease-in-out px-4 py-1.5 rounded-lg shadow-md">
                                  Quarter: Q{quarter}
                              </label>
                              <label for="yearModal" class="ml-3 text-sm cursor-pointer bg-[#202020] sm:hover:bg-[#202020] duration-100 transition ease-in-out px-4 py-1.5 rounded-lg shadow-md">
                                  Year: {year}
                              </label>
                              <label on:click={() => getTranscripts()} class="ml-3 text-sm cursor-pointer bg-[#202020] sm:hover:bg-[#202020] duration-100 transition ease-in-out px-4 py-1.5 rounded-lg shadow-md">
                                  Run
                              </label>
                            </div>
                           
        
                        </div>
  
                        {#if isLoaded}
  
          
                          {#if chats?.length !== 0}
  
                          <div class="flex flex-col sm:flex-row items-center pt-5 pb-5">
                              <span class="text-white text-md">
                                  Q{displayQuarter} {displayYear} · Earnings Call Transcript
                              </span>
                              <span class="text-white text-opacity-80 text-md mt-2 sm:mt-0 sm:ml-auto">
                                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                            
  
  
                          {#each chats as item}
                              {#if item?.name === 'Operator'}
  
                                  <div class="flex flex-col items-start gap-2.5 mt-5">
                                      <div class="flex flex-row items-center ml-auto mr-2">
                                          <div class="flex items-center space-x-2 rtl:space-x-reverse">
                                              <span class="text-sm text-base">
                                              {item?.name}
                                              </span>
                                          </div>
                                          <div class="ml-2 avatar rounded-full w-8 h-8 sm:w-10 sm:h-10 relative bg-[#0DDE00] bg-opacity-[0.6] flex items-center justify-center">
                                            <svg class="w-6 h-6 sm:w-7 sm:h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#202020" d="M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2q1.25 0 2.125.875T15 5v6q0 1.25-.875 2.125T12 14m-1 7v-3.075q-2.6-.35-4.3-2.325T5 11h2q0 2.075 1.463 3.538T12 16q2.075 0 3.538-1.463T17 11h2q0 2.625-1.7 4.6T13 17.925V21z"/></svg>
                                          </div>
                                      </div>
                                      <div class="flex flex-col w-full leading-1.5 p-4 bg-[#202020] rounded-s-xl rounded-es-xl">
                                         <p class="text-sm font-normal py-2.5 text-gray-200">
                                          {item?.description}
                                         </p>
                                      </div>
                                   </div>
                                   
                          
                              {:else}
  
                              <div class="flex flex-col items-start gap-2.5 mt-5">
                                  <div class="flex flex-row items-center ">
                                      <div class="avatar rounded-full w-8 h-8 sm:w-10 sm:h-10 relative bg-red-600 bg-opacity-[0.6] flex items-center justify-center text-white text-sm sm:text-base">
                                          <span class="absolute inset-0 flex items-center justify-center">
                                              {item?.name?.slice(0,1)}
                                          </span>
                                      </div>
                                      <div class="ml-2 flex items-center space-x-2 rtl:space-x-reverse">
                                          <span class="text-sm text-base">
                                          {item?.name}
                                          </span>
                                      </div>
                                  </div>
                                  <div class="flex flex-col w-full leading-1.5 p-4 bg-[#202020] rounded-e-xl rounded-es-xl">
                                     <p class="text-sm font-normal py-2.5 text-gray-200">
                                      {item?.description}
                                     </p>
                                  </div>
                               </div>
  
                              
                              {/if}
                          {/each}
  
                          
                          <label on:click={backToTop} class="w-32 py-1.5 mt-10 hover:bg-white hover:bg-opacity-[0.05] cursor-pointer m-auto flex justify-center items-center border border-slate-800 rounded-full">
                              Back to top
                          </label>
          
                          {:else} 
                          <h3 class="pl-4 pr-4 pt-5 flex justify-center items-center text-md sm:text-lg text-center text-slate-200">
                            No transcript available for {$displayCompanyName} for the Q{displayQuarter} of {displayYear} 🧐.
                          </h3>
                          {/if}
  
  
                          <InfiniteLoading on:infinite={infiniteHandler} />
  
  
                      {:else}
                      <div class="flex justify-center items-center m-auto w-full max-w-6xl">
                          <div class="loader">Loading...</div>
                      </div>
                      {/if}
        
                    </div>
  
                </div>
             </div>
        </section>
  
  
  
  
  
  
  
    <!--Start Quarter-->
    <input type="checkbox" id="quarterModal" class="modal-toggle" />
        
    <dialog id="quarterModal" class="modal modal-bottom sm:modal-middle ">
    
    
      <label id="quarterModal" for="quarterModal"  class="cursor-pointer modal-backdrop bg-[#0F0F0F] bg-opacity-[0.5]"></label>
      
      
      <div class="modal-box w-full bg-[#202020] sm:border sm:border-slate-800">
    
    
    
      <label for="quarterModal" class="cursor-pointer absolute right-5 top-2 bg-[#202020] text-[1.8rem] text-white">
        ✕
      </label>
    
        <div class="text-white">
          
          <h3 class="font-medium text-lg sm:text-xl mb-10">
            Quarter
          </h3>
            
    
          <div class="flex flex-col items-center w-full max-w-3xl bg-[#202020]">
    
    
            <label for="quarterModal" on:click={() => quarter='1'} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
    
                <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {quarter === '1' ? 'ring-2 ring-[#04E000]' : ''}">
                  
                  <span class="ml-1 text-white font-medium mr-auto">
                    Q1
                  </span>
    
                  <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                    {#if quarter === '1'}
                      <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                    {/if}
                  </div>
    
                </div>
               
            </label>
    
    
            <label for="quarterModal" on:click={() => quarter='2'} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
    
              <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {quarter === '2' ? 'ring-2 ring-[#04E000]' : ''}">
                
                <span class="ml-1 text-white font-medium mr-auto">
                  Q2
                </span>
  
                <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                  {#if quarter === '2'}
                    <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                  {/if}
                </div>
  
              </div>
             
          </label>
  
          <label for="quarterModal" on:click={() => quarter='3'} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
    
              <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {quarter === '3' ? 'ring-2 ring-[#04E000]' : ''}">
                
                <span class="ml-1 text-white font-medium mr-auto">
                  Q3
                </span>
  
                <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                  {#if quarter === '3'}
                    <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                  {/if}
                </div>
  
              </div>
             
          </label>
  
          <label for="quarterModal" on:click={() => quarter='4'} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
    
              <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {quarter === '4' ? 'ring-2 ring-[#04E000]' : ''}">
                
                <span class="ml-1 text-white font-medium mr-auto">
                  Q4
                </span>
  
                <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                  {#if quarter === '4'}
                    <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                  {/if}
                </div>
  
              </div>
             
          </label>
    
    
        
  
    
    
          </div>
           
        </div>
    
    
            
          </div>
      </dialog>
    <!--End Quarter-->
  
  
  
  
  
    <!--Start Quarter-->
    <input type="checkbox" id="yearModal" class="modal-toggle" />
        
    <dialog id="yearModal" class="modal modal-bottom sm:modal-middle ">
    
    
      <label id="yearModal" for="yearModal"  class="cursor-pointer modal-backdrop bg-[#0F0F0F] bg-opacity-[0.5]"></label>
      
      
      <div class="modal-box w-full bg-[#202020] sm:border sm:border-slate-800">
    
    
    
      <label for="yearModal" class="cursor-pointer absolute right-5 top-2 bg-[#202020] text-[1.8rem] text-white">
        ✕
      </label>
    
        <div class="text-white">
          
          <h3 class="font-medium text-lg sm:text-xl mb-10">
            Year
          </h3>
            
    
          <div class="flex flex-col items-center w-full max-w-3xl bg-[#202020]">
    
    
            <label for="yearModal" on:click={() => year='2023'} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
    
                <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {year === '1' ? 'ring-2 ring-[#04E000]' : ''}">
                  
                  <span class="ml-1 text-white font-medium mr-auto">
                    2023
                  </span>
    
                  <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                    {#if year === '2023'}
                      <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                    {/if}
                  </div>
    
                </div>
               
            </label>
    
    
            <label for="yearModal" on:click={() => year='2022'} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
    
              <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {year === '2' ? 'ring-2 ring-[#04E000]' : ''}">
                
                <span class="ml-1 text-white font-medium mr-auto">
                  2022
                </span>
  
                <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                  {#if year === '2022'}
                    <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                  {/if}
                </div>
  
              </div>
             
          </label>
  
          <label for="yearModal" on:click={() => year='2021'} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
    
              <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {year === '3' ? 'ring-2 ring-[#04E000]' : ''}">
                
                <span class="ml-1 text-white font-medium mr-auto">
                  2021
                </span>
  
                <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                  {#if year === '2021'}
                    <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                  {/if}
                </div>
  
              </div>
             
          </label>
  
          <label for="yearModal" on:click={() => year='2020'} class="cursor-pointer w-full flex flex-row justify-start items-center mb-5">
    
              <div class="flex flex-row items-center w-full bg-[#303030] p-3 rounded-lg {year === '4' ? 'ring-2 ring-[#04E000]' : ''}">
                
                <span class="ml-1 text-white font-medium mr-auto">
                  2020
                </span>
  
                <div class="rounded-full w-8 h-8 relative border border-[#737373]">
                  {#if year === '2020'}
                    <svg class="w-full h-full rounded-full" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#0F0F0F000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --> <title>ic_fluent_checkmark_circle_48_filled</title> <desc>Created with Sketch.</desc> <g id="🔍-Product-Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="ic_fluent_checkmark_circle_48_filled" fill="#04E000" fill-rule="nonzero"> <path d="M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z" id="🎨-Color"> </path> </g> </g> </g></svg>
                  {/if}
                </div>
  
              </div>
             
          </label>
    
    
        
  
    
    
          </div>
           
        </div>
    
    
            
          </div>
      </dialog>
    <!--End Quarter-->