<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import {
    app_page_seo_title,
    app_page_seo_description,
    app_page_hero_title,
    app_page_hero_description,
    app_page_install_title,
    app_installed_platform_ios,
    app_installed_platform_android,
    app_installed_ios_step_1,
    app_installed_ios_step_2,
    app_installed_ios_step_3,
    app_installed_ios_note,
    app_installed_android_step_1,
    app_installed_android_step_2,
    app_installed_android_step_3,
    app_installed_android_step_4,
  } from "$lib/paraglide/messages.js";

  export let data;

  let installPlatform: "ios" | "android" = "ios";
</script>

<SEO title={app_page_seo_title()} description={app_page_seo_description()} />

<div class="text-gray-700 dark:text-zinc-200 w-full">
  <!-- Hero Section -->
  <section
    class="border-b border-gray-300 dark:border-zinc-700 w-full bg-white dark:bg-zinc-950/60"
  >
    <div
      class="mx-auto max-w-6xl px-6 py-16 sm:py-24 md:px-8 flex flex-col lg:flex-row items-center gap-12 lg:gap-16"
    >
      <div class="flex-1 text-center lg:text-left">
        <h1
          class="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-5xl leading-tight"
        >
          {app_page_hero_title()}
        </h1>
        <p
          class="mt-6 max-w-xl text-lg leading-relaxed text-gray-800 dark:text-zinc-300 mx-auto lg:mx-0"
        >
          {app_page_hero_description()}
        </p>
      </div>

      <div class="flex-shrink-0 hidden sm:inline-block">
        <img
          src="/img/mockup.png"
          alt="Stocknear app on mobile"
          class="h-full w-full sm:w-[600px]"
          loading="eager"
        />
      </div>
    </div>
  </section>

  <!-- Install Instructions Section -->
  <section class="border-b border-gray-300 dark:border-zinc-700">
    <div class="mx-auto max-w-3xl px-6 py-16 sm:py-20 md:px-8">
      <h2
        class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white text-center sm:text-4xl"
      >
        {app_page_install_title()}
      </h2>

      <!-- Platform Toggle -->
      <div class="flex justify-center mt-8">
        <div
          class="inline-flex items-center gap-1 rounded-full border border-gray-300 dark:border-zinc-700 p-1"
        >
          <button
            type="button"
            on:click={() => (installPlatform = "ios")}
            class="cursor-pointer font-medium rounded-full px-5 py-2 text-sm transition-all {installPlatform ===
            'ios'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
              : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}"
          >
            {app_installed_platform_ios()}
          </button>
          <button
            type="button"
            on:click={() => (installPlatform = "android")}
            class="cursor-pointer font-medium rounded-full px-5 py-2 text-sm transition-all {installPlatform ===
            'android'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
              : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}"
          >
            {app_installed_platform_android()}
          </button>
        </div>
      </div>

      <!-- Steps -->
      <div class="mt-10 max-w-lg mx-auto">
        {#if installPlatform === "ios"}
          <ol class="space-y-4">
            <li class="flex items-start gap-4">
              <span
                class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400 text-sm font-semibold"
                >1</span
              >
              <span class="text-base text-gray-800 dark:text-zinc-300 pt-1"
                >{app_installed_ios_step_1()}</span
              >
            </li>
            <li class="flex items-start gap-4">
              <span
                class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400 text-sm font-semibold"
                >2</span
              >
              <span class="text-base text-gray-800 dark:text-zinc-300 pt-1"
                >{app_installed_ios_step_2()}</span
              >
            </li>
            <li class="flex items-start gap-4">
              <span
                class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400 text-sm font-semibold"
                >3</span
              >
              <span class="text-base text-gray-800 dark:text-zinc-300 pt-1"
                >{app_installed_ios_step_3()}</span
              >
            </li>
          </ol>
          <p
            class="mt-6 text-sm text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-900/50 rounded-xl px-4 py-3 border border-gray-200 dark:border-zinc-800"
          >
            {app_installed_ios_note()}
          </p>
        {:else}
          <ol class="space-y-4">
            <li class="flex items-start gap-4">
              <span
                class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400 text-sm font-semibold"
                >1</span
              >
              <span class="text-base text-gray-800 dark:text-zinc-300 pt-1"
                >{app_installed_android_step_1()}</span
              >
            </li>
            <li class="flex items-start gap-4">
              <span
                class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400 text-sm font-semibold"
                >2</span
              >
              <span class="text-base text-gray-800 dark:text-zinc-300 pt-1"
                >{app_installed_android_step_2()}</span
              >
            </li>
            <li class="flex items-start gap-4">
              <span
                class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400 text-sm font-semibold"
                >3</span
              >
              <span class="text-base text-gray-800 dark:text-zinc-300 pt-1"
                >{app_installed_android_step_3()}</span
              >
            </li>
            <li class="flex items-start gap-4">
              <span
                class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400 text-sm font-semibold"
                >4</span
              >
              <span class="text-base text-gray-800 dark:text-zinc-300 pt-1"
                >{app_installed_android_step_4()}</span
              >
            </li>
          </ol>
        {/if}
      </div>
    </div>
  </section>
</div>
