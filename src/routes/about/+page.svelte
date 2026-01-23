<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  // Import individual message functions for tree-shaking
  import {
    about_seo_title,
    about_seo_description,
    about_hero_title,
    about_hero_description,
    about_values_label,
    about_values_title,
    about_values_description,
    about_value_accuracy_title,
    about_value_accuracy_description,
    about_value_speed_title,
    about_value_speed_description,
    about_value_objectivity_title,
    about_value_objectivity_description,
    about_value_built_title,
    about_value_built_description,
    about_founder_label,
    about_founder_title,
    about_founder_subtitle,
    about_founder_name,
    about_founder_role,
    about_founder_bio_1,
    about_founder_bio_2,
    about_founder_credentials,
    about_cta_title,
    about_cta_description,
    about_cta_button_primary,
    about_cta_button_secondary,
    footer_twitter,
    footer_discord,
  } from "$lib/paraglide/messages.js";

  export let data;

  let discordURL = import.meta.env.VITE_DISCORD_URL;
</script>

<SEO
  title={about_seo_title()}
  description={about_seo_description()}
/>

<div class="text-gray-700 dark:text-zinc-200 w-full">
  <!-- Hero Section -->
  <section
    class="border-b border-gray-300 dark:border-zinc-700 w-full bg-white dark:bg-zinc-950/60"
  >
    <div class="mx-auto max-w-4xl px-6 py-16 sm:py-24 md:px-8">
      <div class="text-center">
        <h1
          class="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl leading-tight"
        >
          {about_hero_title()}
        </h1>
        <p
          class="mx-auto mt-6 max-w-2xl text-lg sm:text-xl leading-relaxed text-gray-800 dark:text-zinc-300"
        >
          {about_hero_description()}
        </p>
      </div>
    </div>
  </section>

  <!-- Values Section -->
  <section class="border-t border-gray-300 dark:border-zinc-700">
    <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div class="lg:text-center">
        <p
          class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-800 dark:text-zinc-300 mb-4"
        >
          {about_values_label()}
        </p>
        <h2
          class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white leading-8 sm:text-4xl"
        >
          {about_values_title()}
        </h2>
        <p
          class="mt-4 max-w-2xl text-lg text-gray-800 dark:text-zinc-300 lg:mx-auto"
        >
          {about_values_description()}
        </p>
      </div>
      <div class="mt-12">
        <dl
          class="space-y-10 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-12 md:space-y-0"
        >
          <div class="relative">
            <dt>
              <div
                class="absolute flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-zinc-900 dark:text-zinc-200 border border-gray-300 shadow dark:border-zinc-700"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <p
                class="ml-16 text-lg font-semibold leading-6 text-gray-900 dark:text-white"
              >
                {about_value_accuracy_title()}
              </p>
            </dt>
            <dd class="ml-16 mt-2 text-gray-800 dark:text-zinc-300">
              {about_value_accuracy_description()}
            </dd>
          </div>
          <div class="relative">
            <dt>
              <div
                class="absolute flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-zinc-900 dark:text-zinc-200 border border-gray-300 shadow dark:border-zinc-700"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <p
                class="ml-16 text-lg font-semibold leading-6 text-gray-900 dark:text-white"
              >
                {about_value_speed_title()}
              </p>
            </dt>
            <dd class="ml-16 mt-2 text-gray-800 dark:text-zinc-300">
              {about_value_speed_description()}
            </dd>
          </div>
          <div class="relative">
            <dt>
              <div
                class="absolute flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-zinc-900 dark:text-zinc-200 border border-gray-300 shadow dark:border-zinc-700"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                  />
                </svg>
              </div>
              <p
                class="ml-16 text-lg font-semibold leading-6 text-gray-900 dark:text-white"
              >
                {about_value_objectivity_title()}
              </p>
            </dt>
            <dd class="ml-16 mt-2 text-gray-800 dark:text-zinc-300">
              {about_value_objectivity_description()}
            </dd>
          </div>
          <div class="relative">
            <dt>
              <div
                class="absolute flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-zinc-900 dark:text-zinc-200 border border-gray-300 shadow dark:border-zinc-700"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p
                class="ml-16 text-lg font-semibold leading-6 text-gray-900 dark:text-white"
              >
                {about_value_built_title()}
              </p>
            </dt>
            <dd class="ml-16 mt-2 text-gray-800 dark:text-zinc-300">
              {about_value_built_description()}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </section>

  <!-- Founder Section -->
  <section
    class="border-t border-gray-300 dark:border-zinc-700 bg-gray-50/60 dark:bg-zinc-950/50"
  >
    <div class="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
      <div class="lg:grid lg:grid-cols-3 lg:gap-12">
        <div>
          <p
            class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-800 dark:text-zinc-300 mb-4"
          >
            {about_founder_label()}
          </p>
          <h2
            class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
          >
            {about_founder_title()}
          </h2>
          <p class="mt-4 text-lg text-gray-800 dark:text-zinc-300">
            {about_founder_subtitle()}
          </p>
        </div>
        <div class="lg:col-span-2 mt-10 lg:mt-0">
          <div class="flex flex-col sm:flex-row items-start gap-8">
            <img
              class="rounded-xl object-cover shadow-sm w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0"
              src="/img/profile.jpg"
              alt="Dr. Muslem Rahimi"
              loading="lazy"
            />
            <div class="space-y-4">
              <div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                  {about_founder_name()}
                </h3>
                <p class="text-gray-500 dark:text-zinc-400 font-medium">
                  {about_founder_role()}
                </p>
              </div>
              <div class="text-gray-800 dark:text-zinc-300 space-y-3">
                <p>
                  {about_founder_bio_1()}
                </p>
                <p>
                  {about_founder_bio_2()}
                </p>

                <p class="text-sm text-gray-800 dark:text-zinc-300">
                  {about_founder_credentials()}
                </p>
              </div>
              <div class="flex space-x-4 pt-2">
                <a
                  href="https://x.com/intent/follow?screen_name=stocknear"
                  class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span class="sr-only">{footer_twitter()}</span>
                  <svg class="size-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"
                    />
                  </svg>
                </a>
                <a
                  href={discordURL}
                  class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span class="sr-only">{footer_discord()}</span>
                  <svg
                    class="size-6"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    ><path
                      fill="currentColor"
                      d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"
                    /></svg
                  >
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="border-t border-gray-300 dark:border-zinc-700">
    <div class="mx-auto max-w-4xl px-6 py-16 lg:py-20 text-center">
      <div>
        <h2
          class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
        >
          {about_cta_title()}
        </h2>
        <p
          class="mt-4 text-lg text-gray-800 dark:text-zinc-300 max-w-2xl mx-auto"
        >
          {about_cta_description()}
        </p>
        <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/register"
            class="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-full text-white bg-gray-900 hover:bg-gray-800 transition-colors"
          >
            {about_cta_button_primary()}
          </a>
          <a
            href="/pricing"
            class="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-full text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-900/60 border border-gray-300 shadow dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
          >
            {about_cta_button_secondary()}
          </a>
        </div>
      </div>
    </div>
  </section>
</div>
