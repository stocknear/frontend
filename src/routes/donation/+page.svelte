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
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden pb-20 pt-5 px-4 lg:px-3 text-muted dark:text-white"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li>
        <a href="/" class="text-muted dark:text-gray-300">Home</a>
      </li>
      <li class="text-muted dark:text-gray-300">Sponsor</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-5">
          <div class="mb-6 border-[#2C6288] dark:border-white border-b-[2px]">
            <h1 class="mb-1 text-2xl sm:text-3xl font-bold">Sponsor</h1>
          </div>

          <div class="w-full m-auto">
            <div class="">
              <h2 class=" text-xl font-semibold mb-5">Hey 👋,</h2>
              <p class=" mb-5 text-[1rem]">
                Thank you for considering supporting our mission. As the sole
                person behind Stocknear—handling everything from backend
                development to customer service—I'm committed to keeping our
                platform affordable and accessible to all investors.
                <br />
                <br />
                Our Plans are priced ensure that high-quality stock data is within
                reach for retail investors of all backgrounds.
              </p>
              <div class=" mb-5 text-[1rem]">
                While the Membership is designed to sustain our basic
                operations, your additional support can help us go even further.
                By sponsoring, you're not just supporting a platform; you're
                investing in a vision of open, transparent, and affordable
                financial analysis.
                <br />
                <br />

                Your support will directly contribute to:
                <ul style="padding-left: 5px; padding-top:10px;">
                  <li
                    style="margin-left: 15px; line-height: 22px; margin-bottom: 10px; list-style-type: disc;"
                  >
                    Maintaining our low price point
                  </li>
                  <li
                    style="margin-left: 15px; line-height: 22px; margin-bottom: 10px; list-style-type: disc;"
                  >
                    Better data quality and features
                  </li>
                  <li
                    style="margin-left: 15px; line-height: 22px; margin-bottom: 10px; list-style-type: disc;"
                  >
                    Furthering our goal to become the #1 stock analysis platform
                    in the industry
                  </li>
                </ul>
              </div>

              <h2 class=" text-2xl font-semibold">
                Become a sponsor to Stocknear
              </h2>
              <p class=" mb-5 text-[1rem]">
                If you believe in our mission and want to support us beyond your
                Subscription, please support us via GitHub Sponsors. Every
                contribution, no matter the size, makes a significant impact on
                our ability to serve you and the retail investor community.
                <br />
                <br />
                <iframe
                  class="shadow w-full border border-gray-300 dark:border-gray-800 rounded"
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
