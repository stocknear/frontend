<script lang="ts">
  import logo from "$lib/images/newsletter.png";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
</script>

<SEO
  title="Market Newsletter: Stay Informed in Just 2 Minutes Per Day"
  description="Stay ahead in the market with our pro newsletter! Get the latest updates, trends, and insights delivered straight to your inbox."
/>

<div
  class="w-full min-h-screen bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-200"
>
  <main id="main" class="mx-auto max-w-5xl px-6 py-12 md:py-16">
    <div class="grid items-start gap-10 lg:grid-cols-[1.2fr,0.8fr]">
      <div class="space-y-6">
        <div class="space-y-3">
          <p
            class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-zinc-500"
          >
            Newsletter
          </p>
          <h1
            class="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            Stay informed in just 2 minutes per day
          </h1>
          <p class="text-[0.95rem] text-gray-600 dark:text-zinc-400">
            Pre-market Report is a Newsletter that makes it super easy to keep
            up with financial markets.
          </p>
        </div>

        <div
          class="space-y-4 text-[0.95rem] leading-relaxed text-gray-600 dark:text-zinc-400"
        >
          <p>
            Our summaries are presented in short, bullet-point format, so
            reading this newsletter will never feel like a chore.
          </p>
          <p>
            Let us read the news for you and filter out the noise, then we'll
            send you the bullet points. Here's what you'll get:
          </p>
          <ul class="ml-5 list-disc space-y-3">
            <li>
              Access the latest analyst reports, with key insights extracted
              using AI.
            </li>
            <li>
              Get a quick snapshot of recent and upcoming earnings releases.
            </li>
            <li>
              Stay updated on major economic events with the potential to
              significantly impact the market.
            </li>
            <li>
              Benefit from accurate, up-to-date information sourced exclusively
              from top-tier outlets.
            </li>
          </ul>
          <p>
            The newsletter is completely free and will be delivered to your
            inbox every morning before the market opens, Monday to Friday
            (except holidays).
          </p>
        </div>

        {#if !data?.user}
          <a
            href="/register"
            class="inline-flex w-full items-center justify-center rounded-full border border-gray-300/80 bg-white/80 px-6 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-100/80 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-800/70 sm:w-auto"
          >
            Sign Up for Free
          </a>
        {/if}
      </div>
    </div>
  </main>
</div>
