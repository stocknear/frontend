<script lang='ts'>
  import toast from 'svelte-french-toast';
  import { stockTicker, etfTicker, cryptoTicker, assetType, screenWidth } from "$lib/store";
  import { page } from '$app/stores';

  export let data;


  let isClicked = false;


async function createPortfolio(event) {

  event.preventDefault();

  const postData = {'userId': data?.user?.id}

  const response = await fetch(data?.fastifyURL+'/create-portfolio', {
      method: 'POST',
      headers: {
      "Content-Type": "application/json"
      },
      body: JSON.stringify(postData)
  });

  const output = await response.json();


  if ( output?.message === 'success')
  {
    isClicked = true;
    toast.success('Portfolio created successfully!', {
      style: 'border-radius: 200px; background: #333; color: #fff;'});

    setTimeout(() => {

          const clicked = document.getElementById('addPortfolio');
          clicked.dispatchEvent(new MouseEvent('click'));

          const anchor = document.createElement('a');
          
          if ($page.url.pathname === '/portfolio')
          {
            anchor.href = '/portfolio';
          }
          else  {
            if ($assetType === 'etf')
            {
              anchor.href = `/etf/${$etfTicker}`;
            }
            else if ($assetType === 'crypto')
            {
              anchor.href = `/crypto/${$cryptoTicker}`;
            }
            else {
              anchor.href = `/stocks/${$stockTicker}`;
            }
          }
          

          anchor.dataset.sveltekitReload = true;
          document.body.appendChild(anchor);
          anchor.dispatchEvent(new MouseEvent('click'));
      }, 500);
  }
else {
  toast.error('Something went wrong. Please try again.', {
        style: 'border-radius: 200px; background: #333; color: #fff;'});
}


}



  let participationCheckbox = false;
  let ageCheckbox = false;

  function handleAge() {
    ageCheckbox = !ageCheckbox; // Toggle the value using the ! operator
  }

  function handleParticipation() {
    participationCheckbox = !participationCheckbox; // Toggle the value using the ! operator
  }
</script>


{#if $screenWidth >= 640}
<input type="checkbox" id="addPortfolio" class="modal-toggle" />

<dialog id="addPortfolio" class="modal modal-bottom sm:modal-middle overflow-hidden">


  <label for="addPortfolio"  class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
  
  
  <div class="modal-box w-full bg-[#09090B] overflow-hidden" >


    <div class="flex flex-col w-full mt-10 sm:mt-0">

    
      <div class="text-white text-3xl font-bold mb-5">
        Portfolio Tournament 🔥🚀
      </div>

      <div class="text-white text-lg font-medium mb-3">
        Terms and Conditions of Participation
      </div>

      <div class="text-white text-sm border bg-[#313131] border-gray-800 p-3 rounded-lg overflow-y-scroll h-56">
        
        <ol class="text-white list-decimal ml-3 p-2">
          <li class="p-1">The organizer of the Prize competition is stocknear.</li>
          <li class="p-1">Participation is free of charge.</li>
          <li class="p-1">
            All individuals worldwide who have reached the age of 18 and comply with the laws and regulations of their respective countries are eligible to participate. Persons involved in the conception and implementation of this prize competition are excluded - this explicitly does not apply to voluntary moderators or other voluntary members who have a special status on the platform.
          </li>
          <li class="p-1">
            The prerequisite for participation in the competition is the creation of a portfolio whereby the user can buy and sell shares. Each user starts with a play money of 100,000 $. To be considered in the final draw and eligible for any prizes, participants must make at least one trade (buy or sell shares) during the tournament period.
          </li>
          <li class="p-1">
            The prize competition will take place automated once a month for an indefinite period of time. The potential winners are drawn automatically, randomly on the first day of each month, whereby the chance of winning depends on the overall return of the portfolio. If a participant has collected too little return of the portfolio, the chance can also be 0 percent.
          </li>
          <li class="p-1">
            The prizes to be awarded may change from month to month.
          </li>
          <li class="p-1">
            After the draw, the accounts of the winners will be checked for possible fraud attempts. If no abnormalities are found, the potential winners will be notified by email from stocknear.
            If any abnormalities are found, the draw will be repeated. The organizer reserves the right to refuse and reclaim prizes even after the fact and to permanently exclude participants from competitions in case of suspicion of attempted fraud or manipulation for their own benefit or the benefit of third parties as well as to temporarily or permanently block their accounts.
          </li>
          <li class="p-1">
            The potential winner must respond to the respective prize notification within 14 days, 
            which will be sent via email, in order to claim the prize. 
            Only a response via email will be considered. 
            Otherwise, unclaimed prizes will be included in the next monthly draw.
          </li>
          <li class="p-1">
            The organizer points out that the availability and functionality of the prize draw cannot be guaranteed.
            The organizer is not responsible for entries not being included due to technical failures or other reasons. 
            The prize competition may be terminated or removed due to external circumstances and constraints 
            without any claims arising for the participants against the organizer.
          </li>
          <li class="p-1">
            The organizer reserves the right to change, discontinue, or suspend the game 
            and the draw in whole or in part without prior notice in the event 
            of unforeseen circumstances. These circumstances include, but are not limited to, 
            the appearance of a computer virus, a program error, unauthorized intervention by third parties, 
            or mechanical or technical problems beyond the control and influence of the organizer.
          </li>
          <li class="p-1">
            The organizer reserves the right to terminate the prize draw at any time without prior notice.
            In this case, any outstanding prizes will be properly awarded.
          </li>
          <li class="p-1">
            Should individual provisions of these terms and conditions of participation be or become invalid,
            inadmissible, or unenforceable, this shall not affect the validity of the remaining terms 
            and conditions. In place of the invalid, inadmissible, or unenforceable clause, provisions 
            shall be deemed to have been agreed upon that come as close as possible to the economic objectives.
          </li>
          <li class="p-1">
            Furthermore, the <a href="/imprint" class="text-blue-700 hover:underline">Imprint</a>, <a href="/terms-of-use" class="text-blue-700 hover:underline">
              Terms of Use
            </a> and our 
            <a href="/privacy-policy" class="text-blue-700 hover:underline">
              Privacy Policy
            </a>
            apply. 
            The applicable law and jurisdiction for this prize draw shall be determined based on the participant's 
            country of residence. In case of any legal disputes, the competent courts of the participant's 
            country of residence shall have exclusive jurisdiction.
          </li>
          <li class="p-1">
            The right of recourse to the courts is excluded.
          </li>

        </ol> 
      </div>

      <div class="form-control mt-5">
        <label class="label cursor-pointer flex flex-row">
          <input on:click={handleParticipation} checked={participationCheckbox} aria-describedby="helper-checkbox-text" type="checkbox" value="" class="w-6 h-6 bg-[#333333] border-slate-500 focus-none rounded ring-1">
          <span class="label-text text-white ml-3">I accept the Terms and Conditions of Participation 
            in the monthly portfolio tournament.</span> 
        </label>
      </div>



      <div class="form-control ">
        <label class="label cursor-pointer">
          <input on:click={handleAge} checked={ageCheckbox} aria-describedby="helper-checkbox-text" type="checkbox" value="" class="w-6 h-6 bg-[#333333] border-slate-500 focus-none rounded ring-1">
          <span class="label-text text-white ml-3 mr-auto">I'm at least 18 years old.</span> 
        </label>
      </div>

      {#if ageCheckbox && participationCheckbox && !isClicked}
      <form
        on:submit={createPortfolio}
        class="w-full max-w-lg pt-5 m-auto pb-8"
        >
        <button type="submit" class="btn bg-purple-600 hover:bg-purple-500  btn-md w-full rounded-lg m-auto text-white font-bold text-md">
            Create Portfolio
        </button>
      </form>
      {:else}
      <div class="w-full max-w-lg pt-5 m-auto pb-8">
        <label class="opacity-[0.4] cursor-not-allowed btn bg-purple-600  btn-md w-full rounded-lg m-auto text-white font-bold text-md">
          {#if !isClicked} 
            Create Portfolio
          {:else}
          <div class="flex flex-row m-auto">
            <span class="loading loading-infinity"></span>
            <span class="text-white ml-2">Loading</span>
          </div>
          {/if}
        </label>
      </div>
      {/if}


    </div>

 

        
      </div>
  </dialog>



{:else}
<!--Start Drawer Sidewise for mobile-->


  <!--Start ESG Modal-->
  <div class="drawer drawer-end overflow-hidden w-screen" style="z-index: 9999;">
    <input id="addPortfolio" type="checkbox" class="drawer-toggle"/>
    <div class="drawer-side overflow-y-scroll overflow-hidden">
    
        
      <div class="bg-[#000] min-h-screen px-5 pt-16 w-screen pb-20 overflow-y-scroll overflow-hidden">
  
      <h1 class="text-white sm:hidden font-bold text-2xl mb-5">
        Portfolio Tournament 🔥🚀
      </h1>


      <div class="text-white text-lg font-medium mb-3">
        Terms and Conditions of Participation
      </div>

      <div class="text-white text-sm border bg-[#09090B]  border-gray-800 p-3 rounded-lg overflow-y-scroll h-56">
        
        <ol class="text-white list-decimal ml-3 p-2">
          <li class="p-1">The organizer of the Prize competition is stocknear.</li>
          <li class="p-1">Participation is free of charge.</li>
          <li class="p-1">
            All individuals worldwide who have reached the age of 18 and comply with the laws and regulations of their respective countries are eligible to participate. Persons involved in the conception and implementation of this prize competition are excluded - this explicitly does not apply to voluntary moderators or other voluntary members who have a special status on the platform.
          </li>
          <li class="p-1">
            The prerequisite for participation in the competition is the creation of a portfolio whereby the user can buy and sell shares. Each user starts with a play money of 100,000 $. To be considered in the final draw and eligible for any prizes, participants must make at least one trade (buy or sell shares) during the tournament period.
          </li>
          <li class="p-1">
            The prize competition will take place automated once a month for an indefinite period of time. The potential winners are drawn automatically, randomly on the first day of each month, whereby the chance of winning depends on the overall return of the portfolio. If a participant has collected too little return of the portfolio, the chance can also be 0 percent.
          </li>
          <li class="p-1">
            The prizes to be awarded may change from month to month.
          </li>
          <li class="p-1">
            After the draw, the accounts of the winners will be checked for possible fraud attempts. If no abnormalities are found, the potential winners will be notified by email from stocknear.
            If any abnormalities are found, the draw will be repeated. The organizer reserves the right to refuse and reclaim prizes even after the fact and to permanently exclude participants from competitions in case of suspicion of attempted fraud or manipulation for their own benefit or the benefit of third parties as well as to temporarily or permanently block their accounts.
          </li>
          <li class="p-1">
            The potential winner must respond to the respective prize notification within 14 days, 
            which will be sent via email, in order to claim the prize. 
            Only a response via email will be considered. 
            Otherwise, unclaimed prizes will be included in the next monthly draw.
          </li>
          <li class="p-1">
            The organizer points out that the availability and functionality of the prize draw cannot be guaranteed.
            The organizer is not responsible for entries not being included due to technical failures or other reasons. 
            The prize competition may be terminated or removed due to external circumstances and constraints 
            without any claims arising for the participants against the organizer.
          </li>
          <li class="p-1">
            The organizer reserves the right to change, discontinue, or suspend the game 
            and the draw in whole or in part without prior notice in the event 
            of unforeseen circumstances. These circumstances include, but are not limited to, 
            the appearance of a computer virus, a program error, unauthorized intervention by third parties, 
            or mechanical or technical problems beyond the control and influence of the organizer.
          </li>
          <li class="p-1">
            The organizer reserves the right to terminate the prize draw at any time without prior notice.
            In this case, any outstanding prizes will be properly awarded.
          </li>
          <li class="p-1">
            Should individual provisions of these terms and conditions of participation be or become invalid,
            inadmissible, or unenforceable, this shall not affect the validity of the remaining terms 
            and conditions. In place of the invalid, inadmissible, or unenforceable clause, provisions 
            shall be deemed to have been agreed upon that come as close as possible to the economic objectives.
          </li>
          <li class="p-1">
            Furthermore, the <a href="/imprint" class="text-blue-700 hover:underline">Imprint</a>, <a href="/terms-of-use" class="text-blue-700 hover:underline">
              Terms of Use
            </a> and our 
            <a href="/privacy-policy" class="text-blue-700 hover:underline">
              Privacy Policy
            </a>
            apply. 
            The applicable law and jurisdiction for this prize draw shall be determined based on the participant's 
            country of residence. In case of any legal disputes, the competent courts of the participant's 
            country of residence shall have exclusive jurisdiction.
          </li>
          <li class="p-1">
            The right of recourse to the courts is excluded.
          </li>

        </ol> 
      </div>

      <div class="form-control mt-5">
        <label class="label cursor-pointer flex flex-row">
          <input on:click={handleParticipation} checked={participationCheckbox} aria-describedby="helper-checkbox-text" type="checkbox" value="" class="w-6 h-6 bg-[#333333] border-slate-500 focus-none rounded ring-1">
          <span class="label-text text-white ml-3">I accept the Terms and Conditions of Participation 
            in the monthly portfolio tournament.</span> 
        </label>
      </div>



      <div class="form-control">
        <label class="label cursor-pointer">
          <input on:click={handleAge} checked={ageCheckbox} aria-describedby="helper-checkbox-text" type="checkbox" value="" class="w-6 h-6 bg-[#333333] border-slate-500 focus-none rounded ring-1">
          <span class="label-text text-white ml-3 mr-auto">I'm at least 18 years old.</span> 
        </label>
      </div>

      {#if ageCheckbox && participationCheckbox && !isClicked}
      <form
        on:submit={createPortfolio}
        class="w-full max-w-lg m-auto pb-8 mt-10"
        >
        <button type="submit" class="btn bg-purple-600 hover:bg-purple-500  btn-md w-full rounded-lg m-auto text-white font-bold text-md">
            Create Portfolio
        </button>
      </form>
      {:else}
      <div class="w-full max-w-lg m-auto pb-8 mt-10">
        <label class="opacity-[0.4] cursor-not-allowed btn bg-purple-600  btn-md w-full rounded-lg m-auto text-white font-bold text-md">
          {#if !isClicked} 
            Create Portfolio
          {:else}
          <div class="flex flex-row m-auto">
            <span class="loading loading-infinity"></span>
            <span class="text-white ml-2">Loading</span>
          </div>
          {/if}
        </label>
      </div>
      {/if}


      <label for="addPortfolio" class="absolute left-6 top-4 sm:hidden">
        <svg class="w-6 h-6 inline-block mb-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
        <span class="text-white text-md font-medium">
          Return
        </span>
      </label>


    </div>

  </div>


</div>

{/if}