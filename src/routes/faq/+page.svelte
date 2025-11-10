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
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3 text-muted dark:text-white"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
      <li class="text-muted dark:text-gray-300">FAQ</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-10">
          <div class="mb-6 border-b-2">
            <h1 class="mb-1 text-2xl sm:text-3xl font-bold">
              Frequently Asked Questions
            </h1>
          </div>

          <div class="w-full m-auto">
            <div>
              <h2 class="mb-1 text-xl sm:text-2xl font-bold">
                1. Is there a guide on how to use Stocknear’s features?
              </h2>
              <p class="mb-5 mt-5 text-[1rem] sm:text-lg">
                Yes! We've created the
                <a
                  href="/learning-center"
                  class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
                  >Learning Center</a
                > to explain each feature in detail—what it does, how to integrate
                it into your strategies, and its market impact. We update it regularly,
                so check back often for new content.
              </p>

              <h2 class="mb-1 text-xl sm:text-2xl font-bold">
                2. How long does it take to see earnings releases?
              </h2>
              <p class="mb-5 mt-5 text-[1rem] sm:text-lg">
                Earnings reports are available on Stocknear within 1-5 minutes
                after they go live.
              </p>

              <h2 class="mb-1 text-xl sm:text-2xl font-bold">
                3. Why is your data different from other finance sites?
              </h2>
              <p class="mb-5 mt-5 text-[1rem] sm:text-lg">
                Like other platforms, we source data from third-party providers.
                With thousands of stocks and funds worldwide, manual data
                collection is impractical.
              </p>
              <p class="mb-5 mt-5 text-[1rem] sm:text-lg">
                Data providers rely on automated methods, which can lead to
                variations between platforms. Differences in definitions and
                collection techniques can cause slight discrepancies.
              </p>
              <p class="mb-5 mt-5 text-[1rem] sm:text-lg">
                If you notice an inaccuracy, please contact us at <a
                  href={`mailto:${emailAddress}`}
                  class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
                  >{emailAddress}</a
                >.
              </p>

              <h2 class="mb-1 text-xl sm:text-2xl font-bold">
                4. Is the Options data real-time or delayed?
              </h2>
              <p class="mb-5 mt-5 text-[1rem] sm:text-lg">
                Our <a
                  href="/options-flow"
                  class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
                  >options flow</a
                > feature provides real-time options data from Benzinga without delays.
              </p>

              <h2 class="mb-1 text-xl sm:text-2xl font-bold">
                5. Why do other platforms show options data that Stocknear
                doesn’t?
              </h2>
              <p class="mb-5 mt-5 text-[1rem] sm:text-lg">
                We focus on unusual options activity from hedge funds and
                institutional traders. Retail investor contracts are excluded to
                eliminate noise and highlight significant market moves.
              </p>

              <h2 class="mb-1 text-xl sm:text-2xl font-bold">
                6. Is Dark Pool data real-time or delayed?
              </h2>
              <p class="mb-5 mt-5 text-[1rem] sm:text-lg">
                Dark Pool data is delayed by 15 minutes. We partner with major
                exchanges to provide exclusive Wall Street insights typically
                reserved for institutional traders.
              </p>

              <h2 class="mb-1 text-xl sm:text-2xl font-bold">
                7. I found an error in the data. What should I do?
              </h2>
              <p class="mb-5 mt-5 text-[1rem] sm:text-lg">
                Please email <a
                  href={`mailto:${emailAddress}`}
                  class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
                  >{emailAddress}</a
                >, and we’ll investigate immediately.
              </p>
              <p class="mb-5 mt-5 text-[1rem] sm:text-lg">
                We manually verify every error report and work with data
                providers to ensure corrections are made at the source.
              </p>

              <h2 class="mb-1 text-xl sm:text-2xl font-bold">
                8. Can I request new features? How can I contact you?
              </h2>
              <p class="mb-5 mt-5 text-[1rem] sm:text-lg">
                Absolutely! Email us or join our <a
                  href={discordURL}
                  rel="noopener noreferrer"
                  target="_blank"
                  class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
                  >official Discord</a
                > for quicker responses from our dev team. We’re always open to new
                ideas to improve the platform.
              </p>

              <h2 class="mb-1 text-xl sm:text-2xl font-bold">
                9. Do you offer an API?
              </h2>
              <p class="mb-5 mt-5 text-[1rem] sm:text-lg">
                Not at the moment. We license data from third-party providers
                and don’t have redistribution rights. However, we plan to offer
                an API in the future.
              </p>
            </div>
          </div>
        </main>

        <aside class="hidden lg:block relative fixed w-1/4 mt-4">
          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
          >
            <a
              href="/pricing"
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-bold ml-3">
                  Pro Subscription
                </h2>
                <ArrowLogo
                  class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                />
              </div>
              <span class=" p-3 ml-3 mr-3">
                Upgrade now for unlimited access to all data, tools and no ads.
              </span>
            </a>
          </div>

          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
          >
            <a
              href="/about"
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-bold ml-3">About Us</h2>
                <ArrowLogo
                  class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                />
              </div>
              <span class=" p-3 ml-3 mr-3">
                Learn more about why we're doing this here
              </span>
            </a>
          </div>

          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
          >
            <a
              href="/contact"
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-bold ml-3">Contact Us</h2>
                <ArrowLogo
                  class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                />
              </div>
              <span class=" p-3 ml-3 mr-3">
                Let me know if you need something
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>
