<script lang="ts">
  import { mode } from "mode-watcher";
  export let data;
  export let display = false;
</script>

{#if (display === true && data?.user?.tier !== "Pro") || !["Pro", "Plus"]?.includes(data?.user?.tier)}
  <div class="mt-4 py-6 text-muted dark:text-white">
    <div class="mx-auto max-w-7xl px-3 xs:px-6 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <h3 class="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
          Stop Guessing, Start Knowing.
        </h3>
        <p class="mt-4 text-lg">
          Cut through market noise with <span class="italic">actionable</span> insights
          that actually help you make confident investment decisions. No more endless
          research or gut-based guessing.
        </p>
      </div>

      <div class="mx-auto mt-12 max-w-2xl lg:max-w-5xl">
        <dl
          class="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-2 lg:gap-y-12"
        >
          <!-- Success Rate -->
          <div class="relative pl-14">
            <dt class="text-lg font-semibold leading-6">
              <div
                class="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded bg-default dark:bg-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke={$mode === "light" ? "white" : "black"}
                  class="h-6 w-6"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path></svg
                >
              </div>
              Unlimited access to all data and tools
            </dt>
            <dd class="mt-2 leading-7">
              Unlimited access to all data and tools, giving you the edge over
              everyone else in the market.
            </dd>
          </div>

          <!-- Average Return -->
          <div class="relative pl-14">
            <dt class="text-lg font-semibold leading-6">
              <div
                class="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded bg-default dark:bg-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke={$mode === "light" ? "white" : "black"}
                  class="h-6 w-6"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  ></path></svg
                >
              </div>
              Realtime Options & Dark Pool Data
            </dt>
            <dd class="mt-2 leading-7">
              Instant access to live options & dark pool data to spot
              opportunities and trade with precision before the market moves.
            </dd>
          </div>

          <!-- Rating Count -->
          <div class="relative pl-14">
            <dt class="text-lg font-semibold leading-6">
              <div
                class="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded bg-default dark:bg-white"
              >
                <svg
                  class="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g><g id="SVGRepo_iconCarrier">
                    <path
                      d="M11.2691 4.41115C11.5006 3.89177 11.6164 3.63208 11.7776 3.55211C11.9176 3.48263 12.082 3.48263 12.222 3.55211C12.3832 3.63208 12.499 3.89177 12.7305 4.41115L14.5745 8.54808C14.643 8.70162 14.6772 8.77839 14.7302 8.83718C14.777 8.8892 14.8343 8.93081 14.8982 8.95929C14.9705 8.99149 15.0541 9.00031 15.2213 9.01795L19.7256 9.49336C20.2911 9.55304 20.5738 9.58288 20.6997 9.71147C20.809 9.82316 20.8598 9.97956 20.837 10.1342C20.8108 10.3122 20.5996 10.5025 20.1772 10.8832L16.8125 13.9154C16.6877 14.0279 16.6252 14.0842 16.5857 14.1527C16.5507 14.2134 16.5288 14.2807 16.5215 14.3503C16.5132 14.429 16.5306 14.5112 16.5655 14.6757L17.5053 19.1064C17.6233 19.6627 17.6823 19.9408 17.5989 20.1002C17.5264 20.2388 17.3934 20.3354 17.2393 20.3615C17.0619 20.3915 16.8156 20.2495 16.323 19.9654L12.3995 17.7024C12.2539 17.6184 12.1811 17.5765 12.1037 17.56C12.0352 17.5455 11.9644 17.5455 11.8959 17.56C11.8185 17.5765 11.7457 17.6184 11.6001 17.7024L7.67662 19.9654C7.18404 20.2495 6.93775 20.3915 6.76034 20.3615C6.60623 20.3354 6.47319 20.2388 6.40075 20.1002C6.31736 19.9408 6.37635 19.6627 6.49434 19.1064L7.4341 14.6757C7.46898 14.5112 7.48642 14.429 7.47814 14.3503C7.47081 14.2807 7.44894 14.2134 7.41394 14.1527C7.37439 14.0842 7.31195 14.0279 7.18708 13.9154L3.82246 10.8832C3.40005 10.5025 3.18884 10.3122 3.16258 10.1342C3.13978 9.97956 3.19059 9.82316 3.29993 9.71147C3.42581 9.58288 3.70856 9.55304 4.27406 9.49336L8.77835 9.01795C8.94553 9.00031 9.02911 8.99149 9.10139 8.95929C9.16534 8.93081 9.2226 8.8892 9.26946 8.83718C9.32241 8.77839 9.35663 8.70162 9.42508 8.54808L11.2691 4.41115Z"
                      stroke={$mode === "light" ? "white" : "black"}
                      stroke-width="1.3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></path>
                  </g></svg
                >
              </div>
              Top Wallstreet Analyst Ratings
            </dt>
            <dd class="mt-2 leading-7">
              Follow ratings from the best analysts on Wall Street to stay
              ahead.
            </dd>
          </div>

          <!-- Recency -->
          <div class="relative pl-14">
            <dt class="text-lg font-semibold leading-6">
              <div
                class="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded bg-default dark:bg-white"
              >
                <svg
                  class="w-6 h-6 text-black"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke={$mode === "light" ? "white" : "black"}
                  style="max-width:40px"
                  aria-hidden="true"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  ></path></svg
                >
              </div>
              Up to 30 years financial history
            </dt>
            <dd class="mt-2 leading-7">
              We deliver premium Wall Street data with top-tier accuracy and up
              to 30 years of history.
            </dd>
          </div>
        </dl>
      </div>

      <div class="mt-10 text-center">
        <a
          href="/pricing"
          class="mt-10 flex justify-center text-[1rem] items-center px-5 w-fit m-auto border-none rounded btn btn-lg font-semibold text-white dark:text-black bg-default dark:bg-[#fff] dark:sm:hover:bg-gray-300 transition duration-150 ease-in-out group"
        >
          Get Pro Membership
          <span
            class="tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out"
          >
            <svg
              class="w-4 h-4 mt-1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              ><g transform="rotate(90 12 12)"
                ><g fill="none"
                  ><path
                    d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"
                  /><path
                    fill={$mode === "light" ? "white" : "black"}
                    d="M13.06 3.283a1.5 1.5 0 0 0-2.12 0L5.281 8.939a1.5 1.5 0 0 0 2.122 2.122L10.5 7.965V19.5a1.5 1.5 0 0 0 3 0V7.965l3.096 3.096a1.5 1.5 0 1 0 2.122-2.122L13.06 3.283Z"
                  /></g
                ></g
              ></svg
            >
          </span>
        </a>
      </div>
    </div>
  </div>
{/if}
