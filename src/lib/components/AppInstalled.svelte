<script lang="ts">
  import { closedPWA } from "$lib/store";
  import {
    app_installed_android_step_1,
    app_installed_android_step_2,
    app_installed_android_step_3,
    app_installed_android_step_4,
    app_installed_banner_title,
    app_installed_button_install,
    app_installed_close,
    app_installed_ios_note,
    app_installed_ios_step_1,
    app_installed_ios_step_2,
    app_installed_ios_step_3,
    app_installed_modal_title,
    app_installed_platform_android,
    app_installed_platform_ios,
  } from "$lib/paraglide/messages.js";

  let installPlatform: "ios" | "android" = "ios";

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
  class="mb-5 mt-5 relative isolate sm:rounded text-center flex sm:hidden justify-center items-center gap-x-6 overflow-hidden bg-[#101828] dark:bg-secondary/60 px-6 py-3.5 sm:py-2.5 sm:px-3.5 sm:before:flex-1"
>
  <div class="absolute top-1/2 -z-10 -translate-y-1/2" aria-hidden="true"></div>
  <div
    class="absolute ] top-1/2 -z-10 -translate-y-1/2"
    aria-hidden="true"
  ></div>
  <div
    class="w-full flex flex-row justify-between items-center gap-x-4 gap-y-2"
  >
    <p class="text-lg text-white font-semibold text-start">
      {app_installed_banner_title()}
    </p>

    <div class="flex flex-row items-center">
      <label
        for="installModal"
        class="flex-none rounded-full px-5 py-1 text-lg font-semibold text-black shadow bg-[#fff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
      >
        {app_installed_button_install()}
      </label>
      <label
        on:click={setClosedPWA}
        class="inline-block cursor-pointer text-[1.3rem] text-white"
      >
        <svg
          class="ml-2 w-8 h-8"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          ><path
            fill="currentColor"
            d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
          /></svg>

      </label>
    </div>
  </div>
</div>

<!--Start Install Modal-->
<input type="checkbox" id="installModal" class="modal-toggle" />

<dialog id="installModal" class="modal overflow-hidden p-3 sm:p-0">
  <label for="installModal" class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box w-full relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <label
      for="installModal"
      class="inline-block cursor-pointer absolute right-4 top-4 text-[1.3rem] sm:text-[1.6rem] text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
      aria-label="Close modal"
    >
      <svg
        class="w-6 h-6 sm:w-7 sm:h-7"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
        /></svg>
    </label>
    <div class="flex flex-row items-center pt-5">
      <h4
        class="mb-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white text-center m-auto"
      >
        {app_installed_modal_title()}
      </h4>
      <label
        for="installModal"
        class="inline-block cursor-pointer absolute right-3 top-3 text-[1.3rem] sm:text-[1.8rem]"
      >
        <svg
          class="w-6 h-6 sm:w-8 sm:h-8"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          ><path
            fill="currentColor"
            d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
          /></svg>

      </label>
    </div>

    <div class="flex flex-col justify-center items-center text-xl h-full">
      <div
        class="w-fit text-sm flex items-center gap-1 rounded-full border border-gray-300 dark:border-zinc-700"
      >
        <button
          type="button"
          on:click={() => (installPlatform = "ios")}
          class="cursor-pointer font-medium rounded-full px-3 py-1.5 focus:z-10 focus:outline-none transition-all {installPlatform ===
          'ios'
            ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}"
        >
          {app_installed_platform_ios()}
        </button>
        <button
          type="button"
          on:click={() => (installPlatform = "android")}
          class="cursor-pointer font-medium rounded-full px-3 py-1.5 focus:z-10 focus:outline-none transition-all {installPlatform ===
          'android'
            ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}"
        >
          {app_installed_platform_android()}
        </button>
      </div>

      {#if installPlatform === "ios"}
        <ul
          class="list-decimal list-inside text-left mt-5 text-sm text-gray-800 dark:text-zinc-300"
        >
          <li class="mb-2">{app_installed_ios_step_1()}</li>
          <li class="mb-2">{app_installed_ios_step_2()}</li>
          <li class="mb-4">{app_installed_ios_step_3()}</li>
          <p class="text-sm mb-4 text-gray-800 dark:text-zinc-300">
            {app_installed_ios_note()}
          </p>
        </ul>
      {:else}
        <ul
          class="list-decimal list-inside text-left mt-5 text-sm text-gray-800 dark:text-zinc-300"
        >
          <li class="mb-2">{app_installed_android_step_1()}</li>
          <li class="mb-2">{app_installed_android_step_2()}</li>
          <li class="mb-2">{app_installed_android_step_3()}</li>
          <li class="mb-4">{app_installed_android_step_4()}</li>
        </ul>
      {/if}
    </div>

    <div class="border-t border-gray-300 dark:border-zinc-700 mt-2">
      <label
        for="installModal"
        class="mt-4 font-semibold text-lg text-gray-900 dark:text-white m-auto flex justify-center cursor-pointer"
      >
        {app_installed_close()}
      </label>
    </div>
  </div>
</dialog>