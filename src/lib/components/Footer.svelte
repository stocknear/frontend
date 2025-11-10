<script lang="ts">
  import { setMode, mode } from "mode-watcher";

  let discordURL = import.meta.env.VITE_DISCORD_URL;

  async function handleModeChange(newMode) {
    setMode(newMode);

    try {
      await fetch("/api/theme-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
    } catch (error) {
      console.error("Failed to update theme:", error);
    }
  }
</script>

<footer
  class="w-full mt-auto bg-gray-800 dark:bg-default border-t border-gray-600"
>
  <div class="mx-auto max-w-7xl px-5 pt-12 sm:px-6 lg:px-8 lg:pb-8">
    <div
      class="flex flex-col md:flex-row md:items-start md:justify-between gap-12"
    >
      <!-- Branding -->
      <div
        class="w-80 flex-shrink-0 flex flex-col sm:flex-row items-start space-x-4"
      >
        <img src="/pwa-192x192.png" alt="logo" class="w-12 h-12 rounded-lg" />
        <div>
          <span class="text-2xl font-bold text-white">Stocknear</span>
          <p class="mt-2 text-gray-100">
            All-in-one Stock Analysis Platform to research your trading ideas.
          </p>
        </div>
      </div>

      <!-- Nav Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 w-full">
        <!-- Repeat this block for each section -->
        <nav class="space-y-3">
          <h6
            class="text-sm font-semibold uppercase tracking-wider text-white dark:text-dark-400"
          >
            Sections
          </h6>
          <ul class="space-y-2">
            <li>
              <a
                class="text-gray-300 hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/stocks/">Stocks</a
              >
            </li>
            <li>
              <a
                class="text-gray-300 hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/ipos/">IPOs</a
              >
            </li>
            <li>
              <a
                class="text-gray-300 hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/etf/">ETFs</a
              >
            </li>
            <li>
              <a
                class="text-gray-300 hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/portfolio/">Portfolio</a
              >
            </li>
            <li>
              <a
                class="text-gray-300 hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/learning-center/">Learning Center</a
              >
            </li>
          </ul>
        </nav>
        <nav class="space-y-3">
          <h6
            class="text-sm font-semibold uppercase tracking-wider text-white dark:text-dark-400"
          >
            Services
          </h6>
          <ul class="space-y-2">
            <li>
              <a
                class="text-gray-300 hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/pricing/">Pricing Plan</a
              >
            </li>

            <li>
              <a
                class="text-gray-300 hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/support/">Get Support</a
              >
            </li>

            <li>
              <a
                class="text-gray-300 hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/advertise">Advertise</a
              >
            </li>
          </ul>
        </nav>
        <nav class="space-y-3">
          <h6
            class="text-sm font-semibold uppercase tracking-wider text-white dark:text-dark-400"
          >
            Website
          </h6>
          <ul class="space-y-2">
            <li>
              <a
                class="text-gray-300 hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/login/">Login</a
              >
            </li>
            <li>
              <a
                class="text-gray-300 hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/faq/">FAQ</a
              >
            </li>

            <li>
              <a
                class="text-gray-300 hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/sitemap/">Sitemap</a
              >
            </li>

            <!--
            <li>
              <a
                class="text-gray-300 hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/affiliate-program/">Affiliate Program</a
              >
            </li>
            -->
            <li class="text-te">
              <div class="flex rounded-md shadow-sm">
                <button
                  id="lightBtn"
                  on:click={() => handleModeChange("light")}
                  class="cursor-pointer {$mode === 'light'
                    ? 'bg-gray-600 dark:bg-primary'
                    : ''} text-sm flex items-center gap-x-2 px-3 py-2 rounded-l-md border border-gray-600 dark:border-gray-800 sm:hover:bg-gray-600 text-white focus:z-10 focus:outline-none transition-all"
                >
                  <svg
                    class="h-4 w-4 -mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    ></path>
                  </svg>
                  Light
                  <span class="sr-only">Toggle theme</span>
                </button>
                <button
                  id="darkBtn"
                  on:click={() => handleModeChange("dark")}
                  class="cursor-pointer {$mode === 'dark'
                    ? 'bg-gray-600 dark:bg-primary'
                    : ''} text-sm flex items-center gap-x-2 px-3 py-2 text-sm font-medium rounded-l-md border border-gray-600 dark:border-gray-800 sm:hover:bg-gray-600 text-white focus:z-10 focus:outline-none transition-all"
                >
                  <svg
                    class="h-4 w-4 -mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    ></path>
                  </svg>
                  Dark
                  <span class="sr-only">Toggle theme</span>
                </button>
              </div>
            </li>
          </ul>
        </nav>
        <nav class="space-y-3">
          <h6
            class="text-sm font-semibold uppercase tracking-wider text-white dark:text-dark-400"
          >
            Company
          </h6>
          <ul class="space-y-2">
            <li>
              <a
                class="text-gray-300 hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/about/">About</a
              >
            </li>
            <li>
              <a
                class="text-gray-300 hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/contact/">Contact Us</a
              >
            </li>
            <li>
              <a
                class="text-gray-300 hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/terms-of-use/">Terms of Use</a
              >
            </li>
            <li>
              <a
                class="text-gray-300 hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/privacy-policy/">Privacy Policy</a
              >
            </li>
            <li>
              <a
                class="text-gray-300 hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/data-disclaimer/">Data Disclaimer</a
              >
            </li>
            <li>
              <a
                class="text-gray-300 hover:text-white dark:text-neutral-200 hover:dark:underline"
                href="/imprint/">Imprint</a
              >
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Bottom bar -->
    <div
      class="-mb-8 pb-5 mt-8 border-t border-gray-700 pt-8 dark:border-dark-700 md:flex md:items-center md:justify-between"
    >
      <div class="flex space-x-6 md:order-1">
        <a
          href="https://www.youtube.com/@stocknear"
          rel="noopener noreferrer"
          target="_blank"
          aria-label="Join us on Reddit"
          class=" text-gray-400 hover:text-gray-300 dark:text-dark-400 dark:hover:text-dark-300"
        >
          <svg
            class="pointer-events-none h-8 w-8"
            viewBox="0 -7 48 48"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            fill="currentColor"
            ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></g><g id="SVGRepo_iconCarrier">
              <title>Youtube-color</title> <desc>Created with Sketch.</desc>
              <defs> </defs>
              <g
                id="Icons"
                stroke="none"
                stroke-width="1"
                fill="none"
                fill-rule="evenodd"
              >
                <g
                  id="Color-"
                  transform="translate(-200.000000, -368.000000)"
                  fill="currentColor"
                >
                  <path
                    d="M219.044,391.269916 L219.0425,377.687742 L232.0115,384.502244 L219.044,391.269916 Z M247.52,375.334163 C247.52,375.334163 247.0505,372.003199 245.612,370.536366 C243.7865,368.610299 241.7405,368.601235 240.803,368.489448 C234.086,368 224.0105,368 224.0105,368 L223.9895,368 C223.9895,368 213.914,368 207.197,368.489448 C206.258,368.601235 204.2135,368.610299 202.3865,370.536366 C200.948,372.003199 200.48,375.334163 200.48,375.334163 C200.48,375.334163 200,379.246723 200,383.157773 L200,386.82561 C200,390.73817 200.48,394.64922 200.48,394.64922 C200.48,394.64922 200.948,397.980184 202.3865,399.447016 C204.2135,401.373084 206.612,401.312658 207.68,401.513574 C211.52,401.885191 224,402 224,402 C224,402 234.086,401.984894 240.803,401.495446 C241.7405,401.382148 243.7865,401.373084 245.612,399.447016 C247.0505,397.980184 247.52,394.64922 247.52,394.64922 C247.52,394.64922 248,390.73817 248,386.82561 L248,383.157773 C248,379.246723 247.52,375.334163 247.52,375.334163 L247.52,375.334163 Z"
                    id="Youtube"
                  >
                  </path>
                </g>
              </g>
            </g></svg
          >
        </a>

        <a
          href="https://www.reddit.com/r/stocknear/"
          rel="noopener noreferrer"
          target="_blank"
          aria-label="Join us on Reddit"
          class=" text-gray-400 hover:text-gray-300 dark:text-dark-400 dark:hover:text-dark-300"
        >
          <svg
            class="pointer-events-none h-7 w-7 mt-0.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            aria-hidden="true"
            ><path
              fill="currentColor"
              d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286A.72.72 0 0 0 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0m4.388 3.199a1.999 1.999 0 1 1-1.947 2.46v.002a2.37 2.37 0 0 0-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363a2.802 2.802 0 1 1 2.908 4.753c-.088 3.256-3.637 5.876-7.997 5.876c-4.361 0-7.905-2.617-7.998-5.87a2.8 2.8 0 0 1 1.189-5.34c.645 0 1.239.218 1.712.585c1.275-.79 2.881-1.291 4.64-1.365v-.01a3.23 3.23 0 0 1 2.88-3.207a2 2 0 0 1 1.959-1.595m-8.085 8.376c-.784 0-1.459.78-1.506 1.797s.64 1.429 1.426 1.429s1.371-.369 1.418-1.385s-.553-1.841-1.338-1.841m7.406 0c-.786 0-1.385.824-1.338 1.841s.634 1.385 1.418 1.385c.785 0 1.473-.413 1.426-1.429c-.046-1.017-.721-1.797-1.506-1.797m-3.703 4.013c-.974 0-1.907.048-2.77.135a.222.222 0 0 0-.183.305a3.2 3.2 0 0 0 2.953 1.964a3.2 3.2 0 0 0 2.953-1.964a.222.222 0 0 0-.184-.305a28 28 0 0 0-2.769-.135"
            /></svg
          >
        </a>

        <a
          href={discordURL}
          rel="noopener noreferrer"
          target="_blank"
          aria-label="Join us on Discord"
          class="w-5 h-5 text-gray-400 hover:text-gray-300 dark:text-dark-400 dark:hover:text-dark-300"
        >
          <svg
            class="pointer-events-none h-8 w-8 -ml-1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            ><path
              fill="currentColor"
              d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"
            /></svg
          >
        </a>

        <a
          href="https://twitter.com/intent/follow?screen_name=stocknear"
          target="_blank"
          rel="noopener noreferrer"
          class="text-gray-400 hover:text-gray-300 dark:text-dark-400 dark:hover:text-dark-300"
          aria-label="Follow on X"
          ><svg
            class="pointer-events-none h-8 w-8"
            fill="currentColor"
            viewBox="0 0 24 24"
            style="max-width:40px"
            aria-hidden="true"
            ><path
              d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"
            ></path></svg
          ></a
        >
      </div>
      <p
        class="my-3 text-gray-400 dark:text-dark-400 md:order-2 md:my-0 flex flex-row items-center"
      >
        <!--© 2025 Stocknear. All rights reserved.-->
        <a
          class="inline-block text-gray-200 dark:text-gray-300 sm:hover:underline sm:hover:underline-offset-4"
          href="https://github.com/stocknear"
          aria-label="Follow on Github"
        >
          Stocknear is Proudly Open Source ❤️
        </a>
      </p>
    </div>
  </div>
  <!--
  <div class="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 lg:pb-8">
    <p class="text-gray-400 dark:text-dark-400 md:order-2 md:my-0">
      Stocknear is Proudly Open Source
    </p>
  </div>
  -->
</footer>
