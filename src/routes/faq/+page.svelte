<script>
  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
  let discordURL = import.meta.env.VITE_DISCORD_URL;
  const emailAddress = "contact@stocknear.com";
</script>

<SEO
  title="Frequently Asked Questions - Stocknear Help Center"
  description="Get answers to common questions about Stocknear's stock analysis platform. Find help with features, subscriptions, data sources, technical analysis tools, and investment research capabilities."
  keywords="Stocknear FAQ, stock platform help, investment platform questions, stock analysis help, trading platform support, financial data questions, subscription help, platform features"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: "Stocknear FAQ",
    description:
      "Frequently asked questions about Stocknear stock analysis platform",
    url: "https://stocknear.com/faq",
    mainEntity: {
      "@type": "Question",
      name: "Common questions about Stocknear platform features and services",
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
>
  <div class="text-xs sm:text-sm breadcrumbs text-gray-500 dark:text-zinc-500">
    <ul>
      <li>
        <a
          href="/"
          class="text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white transition"
          >Home</a
        >
      </li>
      <li class="text-gray-500 dark:text-zinc-500">FAQ</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-10">
          <div class="mb-6 border-b border-gray-300 dark:border-zinc-700">
            <h1
              class="mb-2 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              Frequently Asked Questions
            </h1>
          </div>

          <div class="w-full m-auto">
            <div>
              <h2
                class="mb-1 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
              >
                1. Is there a guide on how to use Stocknear’s features?
              </h2>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-gray-600 dark:text-zinc-400"
              >
                Yes! We've created the
                <a
                  href="/learning-center"
                  class="text-gray-900 dark:text-white hover:text-violet-500 transition"
                  >Learning Center</a
                > to explain each feature in detail—what it does, how to integrate
                it into your strategies, and its market impact. We update it regularly,
                so check back often for new content.
              </p>

              <h2
                class="mb-1 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
              >
                2. How long does it take to see earnings releases?
              </h2>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-gray-600 dark:text-zinc-400"
              >
                Earnings reports are available on Stocknear within 1-5 minutes
                after they go live.
              </p>

              <h2
                class="mb-1 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
              >
                3. Why is your data different from other finance sites?
              </h2>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-gray-600 dark:text-zinc-400"
              >
                Like other platforms, we source data from third-party providers.
                With thousands of stocks and funds worldwide, manual data
                collection is impractical.
              </p>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-gray-600 dark:text-zinc-400"
              >
                Data providers rely on automated methods, which can lead to
                variations between platforms. Differences in definitions and
                collection techniques can cause slight discrepancies.
              </p>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-gray-600 dark:text-zinc-400"
              >
                If you notice an inaccuracy, please contact us at <a
                  href={`mailto:${emailAddress}`}
                  class="text-gray-900 dark:text-white hover:text-violet-500 transition"
                  >{emailAddress}</a
                >.
              </p>

              <h2
                class="mb-1 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
              >
                4. Is the Options data real-time or delayed?
              </h2>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-gray-600 dark:text-zinc-400"
              >
                Our <a
                  href="/options-flow"
                  class="text-gray-900 dark:text-white hover:text-violet-500 transition"
                  >options flow</a
                > feature provides real-time options data from Benzinga without delays.
              </p>

              <h2
                class="mb-1 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
              >
                5. Why do other platforms show options data that Stocknear
                doesn’t?
              </h2>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-gray-600 dark:text-zinc-400"
              >
                We focus on unusual options activity from hedge funds and
                institutional traders. Retail investor contracts are excluded to
                eliminate noise and highlight significant market moves.
              </p>

              <h2
                class="mb-1 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
              >
                6. Is Dark Pool data real-time or delayed?
              </h2>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-gray-600 dark:text-zinc-400"
              >
                Dark Pool data is delayed by 15 minutes. We partner with major
                exchanges to provide exclusive Wall Street insights typically
                reserved for institutional traders.
              </p>

              <h2
                class="mb-1 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
              >
                7. I found an error in the data. What should I do?
              </h2>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-gray-600 dark:text-zinc-400"
              >
                Please email <a
                  href={`mailto:${emailAddress}`}
                  class="text-gray-900 dark:text-white hover:text-violet-500 transition"
                  >{emailAddress}</a
                >, and we’ll investigate immediately.
              </p>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-gray-600 dark:text-zinc-400"
              >
                We manually verify every error report and work with data
                providers to ensure corrections are made at the source.
              </p>

              <h2
                class="mb-1 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
              >
                8. Can I request new features? How can I contact you?
              </h2>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-gray-600 dark:text-zinc-400"
              >
                Absolutely! Email us or join our <a
                  href={discordURL}
                  rel="noopener noreferrer"
                  target="_blank"
                  class="text-gray-900 dark:text-white hover:text-violet-500 transition"
                  >official Discord</a
                > for quicker responses from our dev team. We’re always open to new
                ideas to improve the platform.
              </p>

              <h2
                class="mb-1 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
              >
                9. Do you offer an API?
              </h2>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-gray-600 dark:text-zinc-400"
              >
                Not at the moment. We license data from third-party providers
                and don’t have redistribution rights. However, we plan to offer
                an API in the future.
              </p>
            </div>
          </div>
        </main>

        <aside class="hidden lg:block relative fixed w-1/4 mt-4">
          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href="/pricing"
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">
                  Pro Subscription
                </h2>
                <ArrowLogo
                  class="w-6 h-6 mr-3 shrink-0 text-gray-400 dark:text-zinc-500 group-hover:text-violet-500 transition"
                />
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-600 dark:text-zinc-400"
              >
                Upgrade now for unlimited access to all data, tools and no ads.
              </span>
            </a>
          </div>

          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href="/about"
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">About Us</h2>
                <ArrowLogo
                  class="w-6 h-6 mr-3 shrink-0 text-gray-400 dark:text-zinc-500 group-hover:text-violet-500 transition"
                />
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-600 dark:text-zinc-400"
              >
                Learn more about why we're doing this here
              </span>
            </a>
          </div>

          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href="/contact"
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">
                  Contact Us
                </h2>
                <ArrowLogo
                  class="w-6 h-6 mr-3 shrink-0 text-gray-400 dark:text-zinc-500 group-hover:text-violet-500 transition"
                />
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-600 dark:text-zinc-400"
              >
                Let me know if you need something
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>
