<script lang="ts">
  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
</script>

<SEO
  title="Advertise With Us"
  description="Partner with Stocknear, the premier open-source financial research platform. Reach over 6,000+ engaged investors, traders, and analysts with our high-conversion newsletter and innovative investment tools."
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden px-4 lg:px-3 min-h-screen text-muted dark:text-white pb-20"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
      <li class="text-muted dark:text-gray-300">Advertise</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 w-full m-auto overflow-hidden">
      <div class="w-full">
        <div class="mb-6 border-[#2C6288] dark:border-white border-b-[2px]">
          <h1 class="mb-1 text-2xl sm:text-3xl font-bold">Advertise With Us</h1>
        </div>
      </div>
      <div
        class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-10">
          <div class="w-full m-auto">
            <div>
              <p class="mb-3 text-lg">
                Stocknear is revolutionizing financial research as the world's
                first fully open-source platform built specifically for retail
                investors. Our cutting-edge technology delivers lightning-fast
                performance and an intuitive user experience that keeps
                investors coming back daily.
              </p>

              <p class="mb-3 text-lg">
                Partner with us to reach a highly targeted audience of serious
                investors who actively seek quality financial content and tools.
                Our community spans the full spectrum of investment
                strategies—from conservative dividend investors and value
                seekers to active options traders and technical analysts. This
                diversity, combined with our global reach, ensures your message
                connects with the exact audience that matters most to your
                business.
              </p>

              <h2 class="font-bold text-xl mt-8 mb-4">
                Newsletter Advertising That Delivers Results
              </h2>

              <p class="text-lg mb-4">
                Our newsletter isn't just another email in the inbox—it's a
                trusted daily resource that investors rely on for market
                insights and opportunities.
              </p>

              <ul class="list-disc pl-7 md:pl-5 text-lg space-y-2 mb-8">
                <li>
                  <strong>6,000+ highly engaged subscribers</strong> who actively
                  consume financial content
                </li>
                <li>
                  <strong>30% open rate</strong>—significantly outperforming
                  industry benchmarks
                </li>
                <li>
                  <strong>Consistent daily reach</strong> with newsletters delivered
                  Monday through Friday
                </li>
                <li>
                  <strong>Premium audience</strong> of decision-makers with disposable
                  income for investment products and services
                </li>
              </ul>

              <h2 class="font-bold text-xl mb-4">Why Choose Stocknear?</h2>

              <ul class="list-disc pl-7 md:pl-5 text-lg space-y-2 mb-8">
                <li>
                  <strong>Targeted Reach:</strong> Connect directly with investors
                  actively seeking financial solutions
                </li>
                <li>
                  <strong>Trusted Platform:</strong> Benefit from our reputation
                  as a reliable, unbiased financial resource
                </li>
                <li>
                  <strong>Growing Community:</strong> Join us as we expand our influence
                  in the retail investing space
                </li>
                <li>
                  <strong>Flexible Options:</strong> Custom advertising solutions
                  tailored to your budget and goals
                </li>
              </ul>

              <h2 class="font-bold text-xl mb-4">Ready to Get Started?</h2>
              <p class="text-lg">
                Transform your marketing strategy with access to one of the most
                engaged financial audiences online. Whether you're launching a
                new product, building brand awareness, or driving conversions,
                we'll help you achieve your goals.
              </p>

              <p class="mt-4 text-lg">
                <strong>Get in touch today:</strong>
                <br />Email us at
                <a
                  class="text-blue-800 dark:text-blue-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:underline font-medium"
                  href="mailto:contact@stocknear.com">contact@stocknear.com</a
                > to discuss your advertising needs and discover how we can accelerate
                your business growth.
              </p>
            </div>
          </div>
        </main>

        <aside class="inline-block relative w-full lg:w-1/4 mt-6 lg:mt-0">
          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
          >
            <a
              href="/donation"
              class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-xl font-bold ml-3">Sponsor Us</h2>
                <ArrowLogo
                  class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                />
              </div>
              <span class="p-3 ml-3 mr-3">
                Support our mission to democratize financial research for retail
                investors
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
              <span class="p-3 ml-3 mr-3">
                Have questions? We're here to help with personalized solutions
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>
