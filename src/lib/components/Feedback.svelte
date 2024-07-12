<script lang='ts'>
  import toast from 'svelte-french-toast';
  import veryGoodEmoji from '$lib/assets/veryGoodEmoji.svg';
  import goodEmoji from '$lib/assets/goodEmoji.svg';
  import badEmoji from '$lib/assets/badEmoji.svg';
  import veryBadEmoji from '$lib/assets/veryBadEmoji.svg';
  import { userRegion, screenWidth } from '$lib/store';
  export let data;
  
  let cloudFrontUrl = import.meta.env.VITE_IMAGE_URL;

  const usRegion = ['cle1','iad1','pdx1','sfo1'];
  
    let fastifyURL;
  
    userRegion.subscribe(value => {
      if (usRegion.includes(value)) {
        fastifyURL = import.meta.env.VITE_USEAST_FASTIFY_URL;
      } else {
        fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;
      }
    });
  
  let rating = '';
  let inputValue = '';
  
  
  async function handleReturn() {
    rating = '';
    inputValue = '';
  
  }
  async function sendFeedback()
  { 
  
      if (inputValue?.length === 0) {
      toast.error('Please enter your feedback', {
        style: 'border-radius: 200px; background: #333; color: #fff;',
      });
      return;
    }
  
    if (rating?.length === 0) {
      toast.error('Please select an emoji', {
        style: 'border-radius: 200px; background: #333; color: #fff;',
      });
      return;
    }
  
    const userId = data?.user?.id ?? '';
  
    const postData = {'user': userId,
                      'rating': rating,
                      'description': inputValue};
  
  
    const response = await fetch(fastifyURL+'/feedback', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });
  
    const output = (await response.json())?.items;
  
    if (output === 'success') {
      toast.success('Thank you for your feedback', {
              style: 'border-radius: 200px; background: #333; color: #fff;'});
      inputValue = '';
  
    } else {
      toast.error('Something went wrong. Please try again later!', {
        style: 'border-radius: 200px; background: #333; color: #fff;'});
    }
  
    const closePopup = document.getElementById('feedbackInfo');
    closePopup?.dispatchEvent(new MouseEvent('click'))
  
    rating = '';
  
  }
  
  function handleInput(event) {
      inputValue = event.target.value;
    }
  
  </script>
  

<svelte:head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
</svelte:head>
  
  
  
  <div class="fixed z-[100] bottom-8 sm:bottom-10 right-8 sm:right-16">
      <label for="feedbackInfo" class="inline-flex items-center justify-center w-12 h-12 sm:w-full sm:h-10 font-medium bg-gray-700 sm:bg-[#FFEDE5] ml-1 mr-0 sm:mr-2 rounded-full cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" class="sm:hidden sm:ml-4 w-6 h-6 text-white inline-block" viewBox="0 0 256 256"><path fill="white" d="M140 180a12 12 0 1 1-12-12a12 12 0 0 1 12 12M128 72c-22.06 0-40 16.15-40 36v4a8 8 0 0 0 16 0v-4c0-11 10.77-20 24-20s24 9 24 20s-10.77 20-24 20a8 8 0 0 0-8 8v8a8 8 0 0 0 16 0v-.72c18.24-3.35 32-17.9 32-35.28c0-19.85-17.94-36-40-36m104 56A104 104 0 1 1 128 24a104.11 104.11 0 0 1 104 104m-16 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88"/></svg>
        <span class="text-black hidden sm:block text-md px-3">
          Feedback
        </span>
        <img class="hidden sm:inline-block w-12 -mt-6 opacity-[0.85]" src={cloudFrontUrl+"/assets/feedback_icon.png"} alt="feedback logo"/>
      </label>
  </div>
  
  
  
  
  {#if $screenWidth > 640}
  <!--Start Create Watchlist Modal-->
  <input type="checkbox" id="feedbackInfo" class="modal-toggle" />
  
  <dialog id="feedbackInfo" class="modal modal-bottom sm:modal-middle overflow-hidden">
  
  
      <label for="feedbackInfo"  class="cursor-pointer modal-backdrop bg-[#fff] bg-opacity-[0.05]"></label>
      
      
      <div class="modal-box w-full bg-[#000]" >
  
      <div class="flex flex-row items-center pt-5">
          <h1 class="text-white text-xl sm:text-2xl font-bold">
              Your Feedback matters!
          </h1>
      </div>
  
  
      <div class="p-2 mt-5 w-full ">
          <textarea
            class="textarea textarea-bordered  placeholder-gray-300 w-full bg-[#202020] text-white border border-gray-600"
            placeholder="Your feedback..."
            value={inputValue}
            on:input={handleInput}
            />
  
  
      </div>
  
  
      <ul class="flex gap-5 justify-center mt-5 mb-5">
          <li on:click={() => rating= 'Very Good'} class="cursor-pointer">
              <div class="rounded-full w-16 h-16 relative {rating === 'Very Good' ? 'bg-[#333333]' : ''} hover:bg-[#333333] flex items-center justify-center">
                  <img class="w-8 h-8 sm:w-10 sm:h-10" src={veryGoodEmoji} loading="lazy" />
              </div>
          </li>
          <li on:click={() => rating= 'Good'} class="cursor-pointer">
              <div class="rounded-full w-16 h-16 relative {rating === 'Good' ? 'bg-[#333333]' : ''} hover:bg-[#333333] flex items-center justify-center">
                  <img class="w-8 h-8 sm:w-10 sm:h-10" src={goodEmoji} loading="lazy" />
              </div>
          </li>
          <li on:click={() => rating= 'Bad'} class="cursor-pointer">
              <div class="rounded-full w-16 h-16 relative {rating === 'Bad' ? 'bg-[#333333]' : ''} hover:bg-[#333333] flex items-center justify-center">
                  <img class="w-8 h-8 sm:w-10 sm:h-10" src={badEmoji} loading="lazy" />
              </div>
          </li>
          <li on:click={() => rating= 'Very Bad'} class="cursor-pointer">
              <div class="rounded-full w-16 h-16 relative {rating === 'Very Bad' ? 'bg-[#333333]' : ''} hover:bg-[#333333] flex items-center justify-center">
                  <img class="w-8 h-8 sm:w-10 sm:h-10" src={veryBadEmoji} loading="lazy" />
              </div>
          </li>
      </ul>
  
      <span class="hidden text-white flex justify-center text-lg sm:text-xl font-bold">
          I think this website is {rating?.length !== 0 ? `"${rating}"` : ''}
      </span>
  
      <button on:click={() => sendFeedback()} class="mb-4 btn bg-purple-600 hover:bg-purple-500 {rating?.length !== 0 && inputValue?.length !== 0 ? 'opacity-100 cursor-pointer' : 'opacity-60 cursor-default'} btn-md w-full rounded-full m-auto text-white font-bold text-md">
          Send Feedback
      </button>
      
      
    </div>
  </dialog>
  {:else}
  
  
  <div class="drawer drawer-end z-50 overflow-hidden">
    <input id="feedbackInfo" type="checkbox" class="drawer-toggle"/>
    
    <div class="drawer-side overflow-hidden">
    
        
        <div class="bg-[#000] min-h-screen w-screen pb-20 overflow-hidden">
  
          <label for="feedbackInfo" on:click={handleReturn} class="absolute left-6 top-4">
            <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
            <span class="text-white text-md font-medium">
                Return
            </span>
          </label>
  
            <div class="flex flex-row items-center mt-10 p-7">
                <h1 class="text-white text-xl sm:text-2xl font-bold">
                    Your Feedback matters!
                </h1>
            </div>
        
        
            <div class="pl-7 pr-7 w-full ">
                <textarea
                  class="textarea textarea-bordered h-24 placeholder-gray-300 w-full bg-[#202020] text-white border border-gray-600"
                  placeholder="Your feedback..."
                  value={inputValue}
                  on:input={handleInput}
                  />
        
        
            </div>
        
        
            <ul class="flex gap-5 justify-center mt-5 mb-5">
                <li on:click={() => rating= 'Very Good'} class="cursor-pointer">
                    <div class="rounded-full w-16 h-16 relative {rating === 'Very Good' ? 'bg-[#333333]' : ''} hover:bg-[#333333] flex items-center justify-center">
                        <img class="w-10 h-10" src={veryGoodEmoji} loading="lazy" />
                    </div>
                </li>
                <li on:click={() => rating= 'Good'} class="cursor-pointer">
                    <div class="rounded-full w-16 h-16 relative {rating === 'Good' ? 'bg-[#333333]' : ''} hover:bg-[#333333] flex items-center justify-center">
                        <img class="w-10 h-10" src={goodEmoji} loading="lazy" />
                    </div>
                </li>
                <li on:click={() => rating= 'Bad'} class="cursor-pointer">
                    <div class="rounded-full w-16 h-16 relative {rating === 'Bad' ? 'bg-[#333333]' : ''} hover:bg-[#333333] flex items-center justify-center">
                        <img class="w-10 h-10" src={badEmoji} loading="lazy" />
                    </div>
                </li>
                <li on:click={() => rating= 'Very Bad'} class="cursor-pointer">
                    <div class="rounded-full w-16 h-16 relative {rating === 'Very Bad' ? 'bg-[#333333]' : ''} hover:bg-[#333333] flex items-center justify-center">
                        <img class="w-10 h-10" src={veryBadEmoji} loading="lazy" />
                    </div>
                </li>
            </ul>
        
            <span class="hidden text-white flex justify-center text-lg sm:text-xl font-bold">
                I think this website is {rating?.length !== 0 ? `"${rating}"` : ''}
            </span>
        
            <button on:click={() => sendFeedback()} class="pl-7 pr-7 mb-4 flex justify-center items-center btn bg-purple-600 hover:bg-purple-500 {rating?.length !== 0 && inputValue?.length !== 0 ? 'opacity-100 cursor-pointer' : 'opacity-60 cursor-default'} btn-md rounded-full w-5/6 m-auto text-white font-bold text-md">
                Send Feedback
            </button>
            
            
        </div>
    </div>
  </div>
  {/if}