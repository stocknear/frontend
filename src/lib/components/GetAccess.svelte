<script lang='ts'>
  import { goto } from "$app/navigation";
  import backgroundLogo from '$lib/images/hide_content.jpg'

let opacityValue = 0.2
</script>


<section class="w-full max-w-5xl overflow-hidden relative mt-4">

  <div class="absolute inset-0 bg-cover bg-center bg-no-repeat blur-[6px]"
      style="
            opacity: {opacityValue};
            background-image: url('{backgroundLogo}');
            ">
    </div>

  <label on:click={() => goto('/login')} class="p-5 relative cursor-pointer flex flex-col items-center justify-center mt-10 overflow-hidden">
      
        <div class="rounded-full w-14 h-14 bg-[#202020] relative">
          <svg class="rounded-full w-6 h-6 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="white" d="M832 464h-68V240c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zM332 240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v224H332V240zm460 600H232V536h560v304zM484 701v53c0 4.4 3.6 8 8 8h40c4.4 0 8-3.6 8-8v-53a48.01 48.01 0 1 0-56 0z"/></svg>
        </div>
        <span class="text-slate-300 font-medium text-md sm:text-lg mt-3 w-3/4 text-center">
          Get full access for a more in-depth Stock Analysis
        </span>

        <label class="mt-4 w-5/6 sm:w-56 bg-[#fff] cursor-pointer py-2.5 px-4 normal-case font-medium text-center text-black rounded-full">
          <div class="flex flex-row items-center justify-center">
            <svg class="w-6 h-6 sm:w-8 sm:h-8 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><g fill="none" fill-rule="evenodd" stroke="black" stroke-linecap="round" stroke-linejoin="round"><path d="m15.5 4l3 4l-8 10l-8-10l3.009-4zm-13 4h16m-11 0l3 10m3-10l-3 10"/><path d="M5.509 4L7.5 8l3-4l3 4l2-4"/></g></svg>
            <span class="text-black text-md sm:text-[1rem] ml-2">
              Sign Up for Free
            </span>
          </div>

        </label>


    </label>
</section>