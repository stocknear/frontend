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
  class="w-full max-w-7xl min-h-screen text-muted dark:text-white m-auto mt-5 mb-40"
>
  <main
    id="main"
    class="mx-auto max-w-screen-lg space-x-20 p-6 md:flex md:p-10"
  >
    <div class="md:text-lg [&amp;_li]:mb-5 [&amp;_p]:mb-5">
      <h1 class="mb-10 sm:mb-5 text-center text-3xl md:text-4xl font-bold">
        Stay informed in just 2 minutes per day
      </h1>
      <p>
        Market Bullets is a Pro Newsletter that makes it super easy to keep up
        with financial markets.
      </p>
      <p class="mt-4">
        Our summaries are presented in short, bullet-point format, so reading
        this newsletter will never feel like a chore.
      </p>

      <p class="mt-4">
        Let us read the news for you and filter out the noise, then we'll send
        you the bullet points. Here's what you'll get:
      </p>
      <ul class="ml-8 list-disc mt-2">
        <li>
          Access the latest analyst reports, with key insights extracted using
          AI.
        </li>
        <li>Get a quick snapshot of recent and upcoming earnings releases.</li>
        <li>
          Stay updated on major economic events with the potential to
          significantly impact the market.
        </li>

        <li>
          Benefit from accurate, up-to-date information sourced exclusively from
          top-tier outlets.
        </li>
      </ul>

      <p class="mt-4">
        The newsletter is completely free and will be delivered to your inbox
        every morning before the market opens, Monday to Friday (except
        holidays).
      </p>
      {#if !data?.user}
        <a
          href="/register"
          class="mt-10 btn btn-lg w-full text-center bg-[#fff] border border-gray-600 sm:hover:bg-gray-300 transition duration-100 w-full rounded m-auto text-black font-semibold text-[1rem]"
        >
          <span class="text-[1rem] sm:text-lg">Sign Up for Free</span>
        </a>
      {/if}
    </div>
    <div class="hidden md:block">
      <img
        src={logo}
        class="w-auto max-w-[300px] h-fit"
        alt="Morning bullets preview"
      />
    </div>
  </main>
</div>
