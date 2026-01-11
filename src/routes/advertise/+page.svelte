<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";

  export let data;
</script>

<SEO
  title="Advertise With Us"
  description="Partner with Stocknear, the premier financial research platform for self-directed investors. Reach over 6,000+ engaged investors, traders, and analysts with our high-conversion newsletter and advanced market tools."
/>

<section
  class="w-full min-h-screen bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-200"
>
  <div class="mx-auto w-full max-w-6xl px-6 py-10 lg:py-14">
    <BreadCrumb
      containerClass="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300"
    >
      <li>
        <a
          href="/"
          class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >Home</a
        >
      </li>
      <li class="text-gray-800 dark:text-zinc-300">Advertise</li>
    </BreadCrumb>

    <div class="mt-8 border-b border-gray-200/70 pb-4 dark:border-zinc-700">
      <h1
        class="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
      >
        Advertise With Us
      </h1>
    </div>

    <div class="mt-10 grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
      <main
        class="space-y-6 text-[0.95rem] leading-relaxed text-gray-800 dark:text-zinc-300"
      >
        <p>
          Stocknear is a daily research hub for self-directed investors. We
          bring real-time market data, options flow, screeners, earnings
          calendars, and curated news into one fast, intuitive experience that
          keeps investors coming back day after day.
        </p>

        <p>
          Partner with us to reach a highly targeted audience of serious
          investors who actively seek quality financial content and tools. Our
          community spans the full spectrum of investment strategies-from
          conservative dividend investors and long-term allocators to active
          options traders and technical analysts. This diversity, combined with
          our global reach, ensures your message reaches high-intent
          decision-makers.
        </p>

        <div class="space-y-4">
          <h2
            class="text-lg font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            Newsletter Advertising That Delivers Results
          </h2>
          <p>
            Our newsletter isn't just another email in the inbox-it's a trusted
            daily resource that investors rely on for market insights and
            opportunities.
          </p>
          <ul class="ml-5 list-disc space-y-3">
            <li>
              <strong class="text-gray-800 dark:text-zinc-200"
                >6,000+ highly engaged subscribers</strong
              > who actively consume financial content
            </li>
            <li>
              <strong class="text-gray-800 dark:text-zinc-200"
                >30% open rate</strong
              >-significantly outperforming industry benchmarks
            </li>
            <li>
              <strong class="text-gray-800 dark:text-zinc-200"
                >Consistent daily reach</strong
              > with newsletters delivered Monday through Friday
            </li>
            <li>
              <strong class="text-gray-800 dark:text-zinc-200"
                >Premium audience</strong
              > of decision-makers with disposable income for investment products
              and services
            </li>
          </ul>
        </div>

        <div class="space-y-4">
          <h2
            class="text-lg font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            Why Choose Stocknear?
          </h2>
          <ul class="ml-5 list-disc space-y-3">
            <li>
              <strong class="text-gray-800 dark:text-zinc-200"
                >Targeted Reach:</strong
              > Connect directly with investors actively seeking financial solutions
            </li>
            <li>
              <strong class="text-gray-800 dark:text-zinc-200"
                >Trusted Platform:</strong
              > Benefit from our reputation as a reliable, unbiased financial resource
            </li>
            <li>
              <strong class="text-gray-800 dark:text-zinc-200"
                >Growing Community:</strong
              > Join us as we expand our influence in the retail investing space
            </li>
            <li>
              <strong class="text-gray-800 dark:text-zinc-200"
                >Flexible Options:</strong
              > Custom advertising solutions tailored to your budget and goals
            </li>
          </ul>
        </div>

        <div class="space-y-3">
          <h2
            class="text-lg font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            Ready to Get Started?
          </h2>
          <p>
            Transform your marketing strategy with access to one of the most
            engaged financial audiences online. Whether you're launching a new
            product, building brand awareness, or driving conversions, we'll
            help you achieve your goals.
          </p>
          <p>
            <strong class="text-gray-800 dark:text-zinc-200"
              >Get in touch today:</strong
            >
            <br />Email us at
            <a
              class="font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
              href="mailto:contact@stocknear.com">contact@stocknear.com</a
            > to discuss your advertising needs and discover how we can accelerate
            your business growth.
          </p>
        </div>
      </main>

      <aside class="space-y-4">
        <div
          class="rounded-2xl border border-gray-200/70 bg-white/70 p-5 transition hover:border-gray-300/80 hover:bg-gray-50/70 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:border-zinc-700/80 dark:hover:bg-zinc-900/60"
        >
          <a href="/donation" class="group flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h2
                class="text-lg font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                Sponsor Us
              </h2>
              <ArrowLogo
                class="h-5 w-5 text-gray-400 transition group-hover:text-violet-500 dark:text-zinc-500 dark:group-hover:text-violet-400"
              />
            </div>
            <p class="text-[0.9rem] text-gray-800 dark:text-zinc-300">
              Support our mission to democratize financial research for retail
              investors.
            </p>
          </a>
        </div>

        <div
          class="rounded-2xl border border-gray-200/70 bg-white/70 p-5 transition hover:border-gray-300/80 hover:bg-gray-50/70 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:border-zinc-700/80 dark:hover:bg-zinc-900/60"
        >
          <a href="/contact" class="group flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h2
                class="text-lg font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                Contact Us
              </h2>
              <ArrowLogo
                class="h-5 w-5 text-gray-400 transition group-hover:text-violet-500 dark:text-zinc-500 dark:group-hover:text-violet-400"
              />
            </div>
            <p class="text-[0.9rem] text-gray-800 dark:text-zinc-300">
              Have questions? We're here to help with personalized solutions.
            </p>
          </a>
        </div>
      </aside>
    </div>
  </div>
</section>
