<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import {
    about_seo_title,
    about_seo_description,
    about_hero_title,
    about_hero_description,
    about_story_label,
    about_story_title,
    about_story_paragraph_1,
    about_story_paragraph_2,
    about_story_paragraph_3,
    about_stats_investors,
    about_stats_investors_label,
    about_stats_stocks,
    about_stats_stocks_label,
    about_stats_data_points,
    about_stats_data_points_label,
    about_stats_trustpilot,
    about_stats_trustpilot_label,
    about_cta_badge,
    about_cta_title,
    about_cta_description,
    about_cta_button_primary,
    about_cta_button_secondary,
  } from "$lib/paraglide/messages.js";

  export let data;
</script>

<SEO title={about_seo_title()} description={about_seo_description()} />

<div class="text-gray-700 dark:text-zinc-200 w-full">
  <!-- Hero -->
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

  <!-- Our Story -->
  <section class="border-t border-gray-300 dark:border-zinc-700">
    <div class="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
      <div class="lg:grid lg:grid-cols-3 lg:gap-12">
        <div>
          <p
            class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-800 dark:text-zinc-300 mb-4"
          >
            {about_story_label()}
          </p>
          <h2
            class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
          >
            {about_story_title()}
          </h2>
        </div>
        <div class="lg:col-span-2 mt-10 lg:mt-0">
          <div
            class="text-gray-800 dark:text-zinc-300 space-y-4 text-lg leading-relaxed"
          >
            <p>{about_story_paragraph_1()}</p>
            <p>{about_story_paragraph_2()}</p>
            <p>{about_story_paragraph_3()}</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Stats -->
  <section
    class="border-t border-gray-300 dark:border-zinc-700 bg-gray-50/60 dark:bg-zinc-950/50"
  >
    <div class="mx-auto max-w-7xl px-6 py-16 lg:py-20">
      <dl class="grid grid-cols-2 gap-8 sm:grid-cols-4">
        <div class="text-center">
          <dt
            class="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-5xl"
          >
            {about_stats_investors()}
          </dt>
          <dd
            class="mt-2 text-sm font-medium text-gray-800 dark:text-zinc-300 uppercase tracking-[0.1em]"
          >
            {about_stats_investors_label()}
          </dd>
        </div>
        <div class="text-center">
          <dt
            class="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-5xl"
          >
            {about_stats_stocks()}
          </dt>
          <dd
            class="mt-2 text-sm font-medium text-gray-800 dark:text-zinc-300 uppercase tracking-[0.1em]"
          >
            {about_stats_stocks_label()}
          </dd>
        </div>
        <div class="text-center">
          <dt
            class="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-5xl"
          >
            {about_stats_data_points()}
          </dt>
          <dd
            class="mt-2 text-sm font-medium text-gray-800 dark:text-zinc-300 uppercase tracking-[0.1em]"
          >
            {about_stats_data_points_label()}
          </dd>
        </div>
        <div class="text-center">
          <dt
            class="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-5xl"
          >
            {about_stats_trustpilot()}
          </dt>
          <dd
            class="mt-2 text-sm font-medium text-gray-800 dark:text-zinc-300 uppercase tracking-[0.1em]"
          >
            <a
              href="https://www.trustpilot.com/review/stocknear.com"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-violet-600 dark:hover:text-violet-400 transition-colors underline underline-offset-4"
            >
              {about_stats_trustpilot_label()}
            </a>
          </dd>
        </div>
      </dl>
    </div>
  </section>

  <!-- CTA -->
  <section class="border-t border-gray-300 dark:border-zinc-700">
    <div class="mx-auto max-w-4xl px-6 py-16 lg:py-20 text-center">
      <p
        class="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 mb-4"
      >
        {about_cta_badge()}
      </p>
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
  </section>
</div>
