<script>
  import { screenWidth } from "$lib/store";
  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  import SEO from "$lib/components/SEO.svelte";
</script>

<SEO
  title="Become
    a sponsor to Stocknear"
  description="Your sponsor helps us to become the number 1 stock analysis platform in the world with the best price plans."
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
>
  <div class="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300">
    <ul>
      <li>
        <a
          href="/"
          class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >Home</a
        >
      </li>
      <li class="text-gray-800 dark:text-zinc-300">Sponsor</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-5">
          <div class="mb-6 border-b border-gray-300 dark:border-zinc-700">
            <h1
              class="mb-2 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              Sponsor
            </h1>
          </div>

          <div
            class="w-full m-auto text-sm sm:text-base text-gray-800 dark:text-zinc-300"
          >
            <div class="">
              <h2
                class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-5"
              >
                Hey 👋,
              </h2>
              <p class="mb-5">
                Thank you for considering supporting our mission. As the sole
                person behind Stocknear—handling everything from backend
                development to customer service—I'm committed to keeping our
                platform affordable and accessible to all investors.
                <br />
                <br />
                Our Plans are priced ensure that high-quality stock data is within
                reach for retail investors of all backgrounds.
              </p>
              <div class="mb-5">
                While the Membership is designed to sustain our basic
                operations, your additional support can help us go even further.
                By sponsoring, you're not just supporting a platform; you're
                investing in a vision of open, transparent, and affordable
                financial analysis.
                <br />
                <br />

                Your support will directly contribute to:
                <ul class="list-disc pl-6 pt-2 space-y-2">
                  <li>Maintaining our low price point</li>
                  <li>Better data quality and features</li>
                  <li>
                    Furthering our goal to become the #1 stock analysis platform
                    in the industry
                  </li>
                </ul>
              </div>

              <h2
                class="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                Become a sponsor to Stocknear
              </h2>
              <p class="mb-5">
                If you believe in our mission and want to support us beyond your
                Subscription, please support us via GitHub Sponsors. Every
                contribution, no matter the size, makes a significant impact on
                our ability to serve you and the retail investor community.
                <br />
                <br />
                <iframe
                  class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40"
                  src="https://github.com/sponsors/stocknear/card"
                  title="Sponsor Stocknear"
                  height={$screenWidth < 640 ? "300" : "auto"}
                ></iframe>
                <br />

                Your support means the world to me and helps keep Stocknear
                running smoothly.
              </p>
            </div>
          </div>
        </main>

        <aside class="hidden lg:block relative fixed w-1/4 ml-4">
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
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
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
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
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
