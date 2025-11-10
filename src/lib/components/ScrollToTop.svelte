<script lang="ts">
  import { onMount } from "svelte";

  let isScrolled = false;

  function handleScroll() {
    // Check the scroll position
    isScrolled = window.scrollY > 250;
  }

  function handleScrollUp() {
    window.scrollTo({
      top: 0, // Scrolls to the top of the page
    });
  }
  onMount(() => {
    window?.addEventListener("scroll", handleScroll);
    return () => {
      // Remove the event listener when the component is unmounted
      window?.removeEventListener("scroll", handleScroll);
    };
  });
</script>

<div
  class="{!isScrolled
    ? 'hidden'
    : ''} sm:hidden fixed z-40 bottom-8 sm:bottom-10 right-8 sm:right-16"
>
  <label
    on:click={handleScrollUp}
    class="inline-flex items-center justify-center w-12 h-12 sm:w-full sm:h-10 bg-gray-700 sm:bg-[#FFEDE5] ml-1 mr-0 sm:mr-2 rounded-full cursor-pointer"
  >
    <svg
      class="sm:hidden sm:ml-4 w-6 h-6 text-white inline-block"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      ><g fill="none"
        ><path
          d="M24 0v24H0V0zM12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036c-.01-.003-.019 0-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z"
        /><path
          fill="currentColor"
          d="M19 5a1 1 0 1 0 0-2H5a1 1 0 1 0 0 2zM7.05 12.703a1 1 0 0 0 1.415 0L11 10.167V20a1 1 0 0 0 2 0v-9.833l2.536 2.536a1 1 0 0 0 1.414-1.415l-4.243-4.242a1 1 0 0 0-1.414 0L7.05 11.288a1 1 0 0 0 0 1.415"
        /></g
      ></svg
    >
  </label>
</div>
