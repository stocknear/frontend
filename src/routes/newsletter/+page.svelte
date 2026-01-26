<script lang="ts">
  import logo from "$lib/images/newsletter.png";
  import SEO from "$lib/components/SEO.svelte";
  import {
  newsletter_closing,
  newsletter_description,
  newsletter_feature_1,
  newsletter_feature_2,
  newsletter_feature_3,
  newsletter_feature_4,
  newsletter_intro_1,
  newsletter_intro_2,
  newsletter_label,
  newsletter_seo_description,
  newsletter_seo_title,
  newsletter_signup_button,
  newsletter_title,
} from "$lib/paraglide/messages";

  export let data;
</script>

<SEO
  title={newsletter_seo_title()}
  description={newsletter_seo_description()}
/>

<div
  class="w-full min-h-screen bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-200"
>
  <main id="main" class="mx-auto max-w-5xl px-6 py-12 md:py-16">
    <div class="grid items-start gap-10 lg:grid-cols-[1.2fr,0.8fr]">
      <div class="space-y-6">
        <div class="space-y-3">
          <p
            class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gray-800 dark:text-zinc-300"
          >
            {newsletter_label()}
          </p>
          <h1
            class="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            {newsletter_title()}
          </h1>
          <p class="text-[0.95rem] text-gray-800 dark:text-zinc-300">
            {newsletter_description()}
          </p>
        </div>

        <div
          class="space-y-4 text-[0.95rem] leading-relaxed text-gray-800 dark:text-zinc-300"
        >
          <p>
            {newsletter_intro_1()}
          </p>
          <p>
            {newsletter_intro_2()}
          </p>
          <ul class="ml-5 list-disc space-y-3">
            <li>
              {newsletter_feature_1()}
            </li>
            <li>
              {newsletter_feature_2()}
            </li>
            <li>
              {newsletter_feature_3()}
            </li>
            <li>
              {newsletter_feature_4()}
            </li>
          </ul>
          <p>
            {newsletter_closing()}
          </p>
        </div>

        {#if !data?.user}
          <a
            href="/register"
            class="inline-flex w-full items-center justify-center rounded-full border border-gray-300/80 bg-white/80 px-6 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-100/80 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-800/70 sm:w-auto"
          >
            {newsletter_signup_button()}
          </a>
        {/if}
      </div>
    </div>
  </main>
</div>
