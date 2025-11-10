<script lang="ts">
  import { closedPWA } from "$lib/store";

  function setClosedPWA() {
    const now = new Date();

    const expirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds
    localStorage.setItem(
      "closePWA",
      JSON.stringify({ value: true, expires: expirationDate }),
    );

    $closedPWA = true;
  }
</script>

<svelte:head>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
  />
</svelte:head>

<div
  class="mb-5 mt-5 relative isolate sm:rounded text-center flex sm:hidden justify-center items-center gap-x-6 overflow-hidden bg-default dark:bg-[#FFC233] px-6 py-3.5 sm:py-2.5 sm:px-3.5 sm:before:flex-1"
>
  <div class="absolute top-1/2 -z-10 -translate-y-1/2" aria-hidden="true"></div>
  <div
    class="absolute ] top-1/2 -z-10 -translate-y-1/2"
    aria-hidden="true"
  ></div>
  <div
    class="w-full flex flex-row justify-between items-center gap-x-4 gap-y-2"
  >
    <p class="text-lg text-white dark:text-black font-semibold text-start">
      Get the app for a better experience.
    </p>

    <div class="flex flex-row items-center">
      <label
        for="installModal"
        class="flex-none rounded-full px-5 py-1 text-lg font-semibold text-black shadow bg-[#fff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
      >
        Install
      </label>
      <label
        on:click={setClosedPWA}
        class="inline-block cursor-pointer text-[1.3rem] text-white dark:text-black"
      >
        <svg
          class="ml-2 w-8 h-8"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          ><path
            fill="currentColor"
            d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
          /></svg
        >
      </label>
    </div>
  </div>
</div>

<!--Start Create Watchlist Modal-->
<input type="checkbox" id="installModal" class="modal-toggle" />

<dialog id="installModal" class="modal overflow-hidden p-3 sm:p-0">
  <label for="installModal" class="cursor-pointer modal-backdrop"></label>

  <div class="modal-box rounded w-full bg-secondary border border-gray-600">
    <div class="flex flex-row items-center pt-5">
      <h4 class="text-white text-2xl font-bold text-center m-auto">
        Steps to install
      </h4>
      <label
        for="installModal"
        class="inline-block cursor-pointer absolute right-3 top-3 text-[1.3rem] sm:text-[1.8rem] text-white"
      >
        <svg
          class="w-6 h-6 sm:w-8 sm:h-8"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          ><path
            fill="white"
            d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
          /></svg
        >
      </label>
    </div>

    <div
      class="text-white flex flex-col justify-center items-center text-xl h-full"
    >
      <ul class="list-decimal list-inside text-left mt-5">
        <li class="mb-2">Tap on the Safari share button.</li>
        <li class="mb-2">Tap on "Add to Home Screen."</li>
        <li class="mb-4">Tap on "Add."</li>

        <p class="text-lg mb-4">
          Note that web apps on iOS can only be installed using Safari.
        </p>
      </ul>
    </div>

    <div class="border-t border-gray-600 mt-2">
      <label
        for="installModal"
        class="mt-4 font-semibold text-white text-xl m-auto flex justify-center"
      >
        Close
      </label>
    </div>
  </div>
</dialog>
