<script lang='ts'>
  import { isOpen, screenWidth } from '$lib/store';
  
</script>



<div class="flex flex-row items-center">
<label for="{$screenWidth > 640 ? 'marketHour' : ''}" class="cursor-pointer">
  {#if $isOpen}
  <div class="sm:border sm:border-slate-800 bg-[#141417B] sm:hover:bg-[#333333] sm:ease-in-out sm:duration-100 rounded-2xl pl-3 pr-3 pt-1 pb-1 flex flex-row items-center">
    <span class="text-xs py-0.5 text-slate-200 font-semibold">
      Market Open
    </span>
    <span class="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 ml-2">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10DB06] opacity-75"></span>
      <span class="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[#10DB06]"></span>
    </span>

  </div>
  {:else}
  <div class="sm:border sm:border-slate-800 bg-[#141417] sm:hover:bg-[#333333] sm:ease-in-out sm:duration-100 rounded-2xl pl-3 pr-3 pt-1 pb-1 flex flex-row items-center">
    <span class="text-xs py-0.5 text-slate-200 font-semibold">
      Market Closed
    </span>
    <span class="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 ml-2">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF2F1F] opacity-75"></span>
      <span class="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[#FF2F1F]"></span>
    </span>
  </div>
  {/if}
</label>

<!--
{#if $screenWidth < 640 && ($isBeforeMarketOpen || $isAfterMarketClose) && !$isWeekend}

<Drawer.Root>

  <Drawer.Trigger>
      <label for="extendedHoursInfo" class="ml-2 shadow-lg cursor-pointer rounded-full w-7 h-7 relative sm:border sm:border-slate-800 bg-[#09090B] sm:hover:bg-[#333333] flex items-center justify-center border border-slate-800">
        {#if $isBeforeMarketOpen}
        <svg class="w-4 h-4"  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="white" d="M120 40V16a8 8 0 0 1 16 0v24a8 8 0 0 1-16 0m72 88a64 64 0 1 1-64-64a64.07 64.07 0 0 1 64 64m-16 0a48 48 0 1 0-48 48a48.05 48.05 0 0 0 48-48M58.34 69.66a8 8 0 0 0 11.32-11.32l-16-16a8 8 0 0 0-11.32 11.32Zm0 116.68l-16 16a8 8 0 0 0 11.32 11.32l16-16a8 8 0 0 0-11.32-11.32M192 72a8 8 0 0 0 5.66-2.34l16-16a8 8 0 0 0-11.32-11.32l-16 16A8 8 0 0 0 192 72m5.66 114.34a8 8 0 0 0-11.32 11.32l16 16a8 8 0 0 0 11.32-11.32ZM48 128a8 8 0 0 0-8-8H16a8 8 0 0 0 0 16h24a8 8 0 0 0 8-8m80 80a8 8 0 0 0-8 8v24a8 8 0 0 0 16 0v-24a8 8 0 0 0-8-8m112-88h-24a8 8 0 0 0 0 16h24a8 8 0 0 0 0-16"/></svg>
        {:else}
        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="white" d="M232.13 143.64a6 6 0 0 0-6-1.49a90.07 90.07 0 0 1-112.27-112.3a6 6 0 0 0-7.49-7.48a102.88 102.88 0 0 0-51.89 36.31a102 102 0 0 0 142.84 142.84a102.88 102.88 0 0 0 36.31-51.89a6 6 0 0 0-1.5-5.99m-42 48.29a90 90 0 0 1-126-126a90.9 90.9 0 0 1 35.52-28.27a102.06 102.06 0 0 0 118.69 118.69a90.9 90.9 0 0 1-28.24 35.58Z"/></svg>
        {/if}
      </label>
    </Drawer.Trigger>

    <Drawer.Portal>

      <Drawer.Overlay class="fixed inset-0 bg-black/40" />
    

      <Drawer.Content class="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] bg-[#09090B]">
        <div class="flex-1 rounded-t-[10px] bg-[#09090B] p-4">

          <div class="mx-auto mb-8 h-1.5 w-20 flex-shrink-0 rounded-full bg-[#404040]" />
        <div class="max-w-md m-auto text-center mb-10">
            <Drawer.Title class="text-white text-xl mb-2 font-semibold">Extended Hours</Drawer.Title>
            <p class="mb-10 text-white">
              Trade this stock beyond regular hours. Extended trading hours offer you the chance to react to economic and business news outside standard market hours.
            </p>
            <Drawer.Close>
            <label class="cursor-pointer px-7 py-2 rounded-full bg-[#0DDE00] text-center text-black">OK</label>
            </Drawer.Close>
        </div>
        </div>
    </Drawer.Content>
    </Drawer.Portal>
</Drawer.Root>
{:else}
<label for="extendedHoursInfo" class="ml-2 shadow-lg cursor-pointer rounded-full w-7 h-7 relative sm:border sm:border-slate-800 bg-[#09090B] sm:hover:bg-[#333333] flex items-center justify-center border border-slate-800">
  {#if $isBeforeMarketOpen}
  <svg class="w-4 h-4"  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="white" d="M120 40V16a8 8 0 0 1 16 0v24a8 8 0 0 1-16 0m72 88a64 64 0 1 1-64-64a64.07 64.07 0 0 1 64 64m-16 0a48 48 0 1 0-48 48a48.05 48.05 0 0 0 48-48M58.34 69.66a8 8 0 0 0 11.32-11.32l-16-16a8 8 0 0 0-11.32 11.32Zm0 116.68l-16 16a8 8 0 0 0 11.32 11.32l16-16a8 8 0 0 0-11.32-11.32M192 72a8 8 0 0 0 5.66-2.34l16-16a8 8 0 0 0-11.32-11.32l-16 16A8 8 0 0 0 192 72m5.66 114.34a8 8 0 0 0-11.32 11.32l16 16a8 8 0 0 0 11.32-11.32ZM48 128a8 8 0 0 0-8-8H16a8 8 0 0 0 0 16h24a8 8 0 0 0 8-8m80 80a8 8 0 0 0-8 8v24a8 8 0 0 0 16 0v-24a8 8 0 0 0-8-8m112-88h-24a8 8 0 0 0 0 16h24a8 8 0 0 0 0-16"/></svg>
  {:else}
  <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="white" d="M232.13 143.64a6 6 0 0 0-6-1.49a90.07 90.07 0 0 1-112.27-112.3a6 6 0 0 0-7.49-7.48a102.88 102.88 0 0 0-51.89 36.31a102 102 0 0 0 142.84 142.84a102.88 102.88 0 0 0 36.31-51.89a6 6 0 0 0-1.5-5.99m-42 48.29a90 90 0 0 1-126-126a90.9 90.9 0 0 1 35.52-28.27a102.06 102.06 0 0 0 118.69 118.69a90.9 90.9 0 0 1-28.24 35.58Z"/></svg>
  {/if}
</label>

<input type="checkbox" id=extendedHoursInfo class="modal-toggle" />
  
    <dialog id=extendedHoursInfo class="modal modal-middle">

      <label for=extendedHoursInfo class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
  

      <div class="modal-box w-full bg-[#09090B]">
        <div class="text-white mb-5">
          <h3 class="font-bold text-2xl mb-5">Extended Hours</h3>
          <span class="text-white">
            Trade this stock beyond regular hours. Extended trading hours offer you the chance to react to economic and business news outside standard market hours.
          </span>
        </div>
      </div>
    </dialog>
  {/if}
-->
  


</div>


<!-- Put this part before </body> tag -->
<input type="checkbox" id="marketHour" class="modal-toggle" />



<label for="marketHour" class="modal modal-bottom sm:modal-middle cursor-pointer">

  <label for="marketHour"  class="cursor-pointer modal-backdrop"></label>



  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label class="modal-box w-full relative bg-[#09090B] border border-gray-800 h-auto">
    <label for="marketHour" class="cursor-pointer absolute right-5 top-2 bg-[#09090B] text-2xl text-white">
      ✕
    </label>

    <h3 class="text-2xl font-bold text-white">
      Opening Hours
    {#if isOpen}
    <svg class="ml-2 floating inline-block w-8 h-8 sm:w-12 sm:h-12 relative right-0 top-0" viewBox="0 0 32 32" enable-background="new 0 0 32 32" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Layer_2"></g> <g id="Layer_3"></g> <g id="Layer_4"></g> <g id="Layer_5"></g> <g id="Layer_6"></g> <g id="Layer_7"></g> <g id="Layer_8"></g> <g id="Layer_9"></g> <g id="Layer_10"></g> <g id="Layer_11"></g> <g id="Layer_12"></g> <g id="Layer_13"></g> <g id="Layer_14"></g> <g id="Layer_15"></g> <g id="Layer_16"></g> <g id="Layer_17"></g> <g id="Layer_18"></g> <g id="Layer_19"></g> <g id="Layer_20"></g> <g id="Layer_21"> <g> <path d="M26,16c0,5.5-4.5,10-10,10S6,21.5,6,16S10.5,6,16,6S26,10.5,26,16z" fill="#FFC10A"></path> </g> <g> <path d="M16,1c-0.6,0-1,0.4-1,1v2c0,0.6,0.4,1,1,1s1-0.4,1-1V2C17,1.4,16.6,1,16,1z" fill="#F44236"></path> <path d="M16,27c-0.6,0-1,0.4-1,1v2c0,0.6,0.4,1,1,1s1-0.4,1-1v-2C17,27.4,16.6,27,16,27z" fill="#F44236"></path> <path d="M30,15h-2c-0.6,0-1,0.4-1,1s0.4,1,1,1h2c0.6,0,1-0.4,1-1S30.6,15,30,15z" fill="#F44236"></path> <path d="M4,15H2c-0.6,0-1,0.4-1,1s0.4,1,1,1h2c0.6,0,1-0.4,1-1S4.6,15,4,15z" fill="#F44236"></path> <path d="M25.2,5.4l-1.4,1.4c-0.4,0.4-0.4,1,0,1.4c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3l1.4-1.4 c0.4-0.4,0.4-1,0-1.4S25.6,5,25.2,5.4z" fill="#F44236"></path> <path d="M6.8,23.8l-1.4,1.4c-0.4,0.4-0.4,1,0,1.4c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3l1.4-1.4 c0.4-0.4,0.4-1,0-1.4S7.2,23.4,6.8,23.8z" fill="#F44236"></path> <path d="M6.8,5.4C6.4,5,5.8,5,5.4,5.4s-0.4,1,0,1.4l1.4,1.4C7,8.4,7.3,8.5,7.5,8.5S8,8.4,8.2,8.2 c0.4-0.4,0.4-1,0-1.4L6.8,5.4z" fill="#F44236"></path> <path d="M25.2,23.8c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4l1.4,1.4c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3 c0.4-0.4,0.4-1,0-1.4L25.2,23.8z" fill="#F44236"></path> </g> </g> <g id="Layer_22"></g> <g id="Layer_23"></g> <g id="Layer_24"></g> <g id="Layer_25"></g> <g id="Wearher"></g> </g></svg>
    {:else}
    <svg class="ml-2 floating inline-block w-8 h-8 sm:w-12 sm:h-12 relative right-0 top-0" viewBox="0 0 12.7 12.7" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:svg="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <defs id="defs2"> <clipPath clipPathUnits="userSpaceOnUse" id="clipPath5343"> <path d="m 3.0688351,285.55677 c -1.613568,1.19596 -2.5662181,3.08478 -2.56883509,5.09323 0,3.50701 2.84299219,6.35 6.35000009,6.35 C 10.357008,297 13.2,294.15701 13.2,290.65 c -0.0022,-0.84296 -0.452078,-2.71271 -0.500228,-2.45359 -0.02424,0.84121 -0.571809,2.35322 -0.602031,2.23138 -0.0026,-0.50621 -0.2876,-1.42626 -0.305098,-1.19509 0.02804,1.40695 -1.48374,3.17677 -2.3076623,3.50038 -0.8310457,0.36942 -1.7371637,0.56412 -2.6117267,0.56534 -0.1736918,2e-5 -1.1686519,-0.13807 -1.6443439,-0.70435 -0.826376,-0.89253 -0.00201,-1.09994 0.4625039,-1.27331 0.5055862,-0.18871 1.030887,-0.30969 1.5203212,-0.42013 0.7456988,-0.16826 0.4710618,-0.52626 0.1049028,-0.6289 -0.9266939,-0.25976 -2.044886,0.33543 -2.8654579,0.30593 -0.848406,-0.0291 -0.804618,-1.69621 -0.1405601,-1.76217 0.7394212,-0.0734 1.6665151,-0.51079 1.461779,-0.65673 -0.8303549,-0.61672 -0.9617369,-0.79081 -1.0595549,-1.16418 -0.1480201,-0.565 0.341282,-1.03557 0.05777,-0.96356 -0.2596169,0.08 -0.4110678,0.15641 -0.5988619,0.25715 -0.1672929,0.0897 -0.293814,0.0546 -0.6751841,0.002 -0.3249449,-0.045 -0.3870058,-0.0557 -0.3755009,-0.25673 0.0115,-0.20097 0.07295,-0.52125 -0.05223,-0.47648 z" id="path5345" style="fill:#7aafff;fill-opacity:1;stroke:none;stroke-width:2.01045942;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"></path> </clipPath> <clipPath clipPathUnits="userSpaceOnUse" id="clipPath4543"> <path d="m 1.7760088,291.5696 c -1.82613339,0.17434 -3.2940315,0.91934 -3.4903996,2.16451 -0.2629054,1.66729 1.5678591,3.34127 4.0891213,3.73893 1.2172084,0.19119 2.434234,0.053 3.3807423,-0.38387 0.7310194,0.5283 1.669357,0.90078 2.6704721,1.06008 2.5212691,0.39771 4.7783381,-0.6315 5.0412801,-2.2988 0.262905,-1.6673 -1.490667,-1.94329 -4.257163,-2.17938 -2.7664958,-0.23609 -3.6163896,-1.68839 -5.7470448,-2.04575 -0.5660191,-0.0893 -1.1380808,-0.10817 -1.6870084,-0.0557 z" id="path4545" style="opacity:1;vector-effect:none;fill:#666666;fill-opacity:1;stroke:none;stroke-width:2.11666656;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1"></path> </clipPath> </defs> <g id="layer1" transform="translate(0,-284.3)"> <circle cx="6.3499999" cy="290.64999" id="path4514" r="6.3499999" style="fill:#3584e4;fill-opacity:1;stroke:none;stroke-width:1.74658811;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"></circle> <path clip-path="url(#clipPath4543)" d="m 12.7,290.64999 a 6.3499999,6.3499999 0 0 1 -6.3500001,6.35 A 6.3499999,6.3499999 0 0 1 0,290.64999 a 6.3499999,6.3499999 0 0 1 6.3499999,-6.35 6.3499999,6.3499999 0 0 1 6.3500001,6.35 z" id="path4514-3" style="fill:#666666;fill-opacity:1;stroke:none;stroke-width:1.74658811;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"></path> <g id="g4677-9" style="fill:#5b99f8;fill-opacity:1" transform="translate(-9.1524958,-3.5249232)"> <path d="m 19.567458,291.77561 a 2.4866811,2.4866811 0 0 0 -0.468992,-0.36467 2.4866811,2.4866811 0 0 1 -0.365116,3.04734 2.4866811,2.4866811 0 0 1 -3.04646,0.366 2.4866811,2.4866811 0 0 0 0.364231,0.46766 2.4866811,2.4866811 0 0 0 3.516337,4.5e-4 2.4866811,2.4866811 0 0 0 0,-3.51678 z" id="path4526-69" style="opacity:1;vector-effect:none;fill:#5b99f8;fill-opacity:1;stroke:none;stroke-width:2.56050229;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1"></path> <path d="m 6.4185145,294.23299 -0.3566249,-0.25394 -0.3566249,0.25394 0.041602,-0.43582 -0.3982267,-0.18187 0.3982267,-0.18188 -0.041602,-0.43582 0.356625,0.25394 0.3566249,-0.25394 -0.041602,0.43582 0.3982267,0.18188 -0.3982267,0.18187 z" id="path4561-33" style="opacity:1;vector-effect:none;fill:#5b99f8;fill-opacity:1;stroke:none;stroke-width:1.59991646;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1" transform="matrix(1.1168881,-0.64483565,0.64483565,1.1168881,-183.37821,-32.491666)"></path> <circle cx="11.315855" cy="293.72394" id="path4621-8" r="0.30267826" style="opacity:1;vector-effect:none;fill:#5b99f8;fill-opacity:1;stroke:none;stroke-width:2.98949623;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1"></circle> <circle cx="15.575421" cy="290.22079" id="path4625-0" r="0.35826889" style="opacity:1;vector-effect:none;fill:#5b99f8;fill-opacity:1;stroke:none;stroke-width:3.69939804;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1"></circle> <circle cx="17.168623" cy="292.01489" id="path4625-5-5" r="0.22649699" style="opacity:1;vector-effect:none;fill:#5b99f8;fill-opacity:1;stroke:none;stroke-width:2.33875299;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1"></circle> <path d="m 6.4185145,294.23299 -0.3566249,-0.25394 -0.3566249,0.25394 0.041602,-0.43582 -0.3982267,-0.18187 0.3982267,-0.18188 -0.041602,-0.43582 0.356625,0.25394 0.3566249,-0.25394 -0.041602,0.43582 0.3982267,0.18188 -0.3982267,0.18187 z" id="path4561-1-6" style="opacity:1;vector-effect:none;fill:#5b99f8;fill-opacity:1;stroke:none;stroke-width:1.59991646;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1" transform="matrix(0.68730172,-0.39681385,0.39681385,0.68730172,-106.13796,94.279576)"></path> </g> <g id="g4677" transform="translate(-9.3294517,-3.7423224)"> <path d="m 19.567458,291.77561 a 2.4866811,2.4866811 0 0 0 -0.468992,-0.36467 2.4866811,2.4866811 0 0 1 -0.365116,3.04734 2.4866811,2.4866811 0 0 1 -3.04646,0.366 2.4866811,2.4866811 0 0 0 0.364231,0.46766 2.4866811,2.4866811 0 0 0 3.516337,4.5e-4 2.4866811,2.4866811 0 0 0 0,-3.51678 z" id="path4526" style="opacity:1;vector-effect:none;fill:#ffffff;fill-opacity:1;stroke:none;stroke-width:2.56050229;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1"></path> <path d="m 6.4185145,294.23299 -0.3566249,-0.25394 -0.3566249,0.25394 0.041602,-0.43582 -0.3982267,-0.18187 0.3982267,-0.18188 -0.041602,-0.43582 0.356625,0.25394 0.3566249,-0.25394 -0.041602,0.43582 0.3982267,0.18188 -0.3982267,0.18187 z" id="path4561" style="opacity:1;vector-effect:none;fill:#ffffff;fill-opacity:1;stroke:none;stroke-width:1.59991646;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1" transform="matrix(1.1168881,-0.64483565,0.64483565,1.1168881,-183.37821,-32.491666)"></path> <circle cx="11.315855" cy="293.72394" id="path4621" r="0.30267826" style="opacity:1;vector-effect:none;fill:#ffffff;fill-opacity:1;stroke:none;stroke-width:2.98949623;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1"></circle> <circle cx="15.575421" cy="290.22079" id="path4625" r="0.35826889" style="opacity:1;vector-effect:none;fill:#ffffff;fill-opacity:1;stroke:none;stroke-width:3.69939804;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1"></circle> <circle cx="17.168623" cy="292.01489" id="path4625-5" r="0.22649699" style="opacity:1;vector-effect:none;fill:#ffffff;fill-opacity:1;stroke:none;stroke-width:2.33875299;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1"></circle> <path d="m 6.4185145,294.23299 -0.3566249,-0.25394 -0.3566249,0.25394 0.041602,-0.43582 -0.3982267,-0.18187 0.3982267,-0.18188 -0.041602,-0.43582 0.356625,0.25394 0.3566249,-0.25394 -0.041602,0.43582 0.3982267,0.18188 -0.3982267,0.18187 z" id="path4561-1" style="opacity:1;vector-effect:none;fill:#ffffff;fill-opacity:1;stroke:none;stroke-width:1.59991646;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1" transform="matrix(0.68730172,-0.39681385,0.39681385,0.68730172,-106.13796,94.279576)"></path> </g> </g> </g></svg>    
    {/if}
    </h3>
    <p class="py-4 text-gray-200 bg-[#09090B] w-full">
    The New York Stock Exchange, one of the largest stock exchanges in the world, operates on a regular trading schedule. 
    Its trading hours are from <span class="text-white font-semibold underline">9:30</span> ET in the morning to <span class="text-white font-semibold underline">16:00</span> ET in the afternoon.
    Monday through Friday.
    <br>
    <br>
    The market is closed on the following holidays:
    </p>

    <table class="table table-sm table-compact bg-[#09090B] w-full mt-5 mb-10 text-white">
      <!-- head -->
      <thead>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <th class="bg-[#09090B] text-white text-sm font-semibold">
            Exchange holidays
          </th>
          <th class="bg-[#09090B] text-white text-sm font-semibold">
            Date
          </th>
        </tr>
      </thead>
      <tbody>
        <!-- row 1 -->
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold "> New Years Day</td>
          <td class="">01.01.2024</td>
        </tr>
        <!-- row 2 -->
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold ">Martin Luther King, Jr. Day</td>
          <td class="">15.01.2024</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold ">Washington's Birthday</td>
          <td class="">19.02.2024</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold ">
            Good Friday
            </td>
          <td class="bg-[#09090B]">29.03.2024</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold ">Memorial Day</td>
          <td class="">27.05.2024</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold ">Juneteenth National Independence Day</td>
          <td class="">19.06.2024</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold ">Independence Day</td>
          <td class="">04.07.2024</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold ">Labor Day</td>
          <td class="">02.09.2024</td>
        </tr>
        <tr class="border-b border-slate-700 odd:bg-[#27272A]">
          <td class="font-semibold ">Thanksgiving Day</td>
          <td class="">28.11.2024</td>
        </tr>
        <tr class="odd:bg-[#27272A]">
          <td class="font-semibold ">Christmas</td>
          <td class="">25.12.2024</td>
        </tr>
      </tbody>
    </table>


  </label>
</label>

