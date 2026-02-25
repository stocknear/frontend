<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import {
    about_seo_title,
    about_seo_description,
    about_hero_title,
    about_hero_description,
    about_stats_investors,
    about_stats_investors_label,
    about_stats_stocks,
    about_stats_stocks_label,
    about_stats_data_points,
    about_stats_data_points_label,
    about_stats_trustpilot,
    about_stats_trustpilot_label,
    about_story_label,
    about_story_title,
    about_story_paragraph_1,
    about_story_paragraph_2,
    about_story_paragraph_3,
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
    about_data_label,
    about_data_title,
    about_data_description,
    about_data_source_1_title,
    about_data_source_1_description,
    about_data_source_2_title,
    about_data_source_2_description,
    about_data_source_3_title,
    about_data_source_3_description,
    about_diff_label,
    about_diff_title,
    about_diff_1_title,
    about_diff_1_description,
    about_diff_2_title,
    about_diff_2_description,
    about_diff_3_title,
    about_diff_3_description,
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

  <!-- Stats Section -->
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

  <!-- Story Section -->
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

  <!-- Values Section -->
  <section
    class="border-t border-gray-300 dark:border-zinc-700 bg-gray-50/60 dark:bg-zinc-950/50"
  >
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
      <div class="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div
          class="rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-200 border border-gray-300 dark:border-zinc-700"
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
          <h3
            class="mt-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            {about_value_accuracy_title()}
          </h3>
          <p class="mt-2 text-gray-800 dark:text-zinc-300">
            {about_value_accuracy_description()}
          </p>
        </div>
        <div
          class="rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-200 border border-gray-300 dark:border-zinc-700"
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
          <h3
            class="mt-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            {about_value_speed_title()}
          </h3>
          <p class="mt-2 text-gray-800 dark:text-zinc-300">
            {about_value_speed_description()}
          </p>
        </div>
        <div
          class="rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-200 border border-gray-300 dark:border-zinc-700"
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
          <h3
            class="mt-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            {about_value_objectivity_title()}
          </h3>
          <p class="mt-2 text-gray-800 dark:text-zinc-300">
            {about_value_objectivity_description()}
          </p>
        </div>
        <div
          class="rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-200 border border-gray-300 dark:border-zinc-700"
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
          <h3
            class="mt-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            {about_value_built_title()}
          </h3>
          <p class="mt-2 text-gray-800 dark:text-zinc-300">
            {about_value_built_description()}
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Data Transparency Section -->
  <section class="border-t border-gray-300 dark:border-zinc-700">
    <div class="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
      <div class="lg:text-center">
        <p
          class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-800 dark:text-zinc-300 mb-4"
        >
          {about_data_label()}
        </p>
        <h2
          class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
        >
          {about_data_title()}
        </h2>
        <p
          class="mt-4 max-w-2xl text-lg text-gray-800 dark:text-zinc-300 lg:mx-auto"
        >
          {about_data_description()}
        </p>
      </div>
      <div class="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div class="relative">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-zinc-900 dark:text-zinc-200 border border-gray-300 shadow dark:border-zinc-700"
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3
            class="mt-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            {about_data_source_1_title()}
          </h3>
          <p class="mt-2 text-gray-800 dark:text-zinc-300">
            {about_data_source_1_description()}
          </p>
        </div>
        <div class="relative">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-zinc-900 dark:text-zinc-200 border border-gray-300 shadow dark:border-zinc-700"
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
          <h3
            class="mt-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            {about_data_source_2_title()}
          </h3>
          <p class="mt-2 text-gray-800 dark:text-zinc-300">
            {about_data_source_2_description()}
          </p>
        </div>
        <div class="relative">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-zinc-900 dark:text-zinc-200 border border-gray-300 shadow dark:border-zinc-700"
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3
            class="mt-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            {about_data_source_3_title()}
          </h3>
          <p class="mt-2 text-gray-800 dark:text-zinc-300">
            {about_data_source_3_description()}
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Differentiators Section -->
  <section
    class="border-t border-gray-300 dark:border-zinc-700 bg-gray-50/60 dark:bg-zinc-950/50"
  >
    <div class="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
      <div class="lg:text-center">
        <p
          class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-800 dark:text-zinc-300 mb-4"
        >
          {about_diff_label()}
        </p>
        <h2
          class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
        >
          {about_diff_title()}
        </h2>
      </div>
      <div class="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div
          class="rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-200 border border-gray-300 dark:border-zinc-700"
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
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h3
            class="mt-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            {about_diff_1_title()}
          </h3>
          <p class="mt-2 text-gray-800 dark:text-zinc-300">
            {about_diff_1_description()}
          </p>
        </div>
        <div
          class="rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-200 border border-gray-300 dark:border-zinc-700"
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3
            class="mt-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            {about_diff_2_title()}
          </h3>
          <p class="mt-2 text-gray-800 dark:text-zinc-300">
            {about_diff_2_description()}
          </p>
        </div>
        <div
          class="rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white dark:bg-zinc-900/60 p-6"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-200 border border-gray-300 dark:border-zinc-700"
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <h3
            class="mt-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            {about_diff_3_title()}
          </h3>
          <p class="mt-2 text-gray-800 dark:text-zinc-300">
            {about_diff_3_description()}
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="border-t border-gray-300 dark:border-zinc-700">
    <div class="mx-auto max-w-4xl px-6 py-16 lg:py-20 text-center">
      <div>
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
    </div>
  </section>
</div>
