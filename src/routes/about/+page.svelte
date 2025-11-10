<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import profile from "$lib/images/profile.webp";
  export let data;
</script>

<SEO
  title="About"
  description="Welcome to Stocknear — a site that aims to be the internet's best source of free stock data and information for regular investors."
/>

<body class="text-muted dark:text-white w-full">
  <section
    class="border-b border-gray-200 shadow dark:border-gray-600 sm:rounded w-full bg-gray-100 dark:bg-default"
  >
    <div class="mx-auto max-w-7xl px-6 py-16 sm:py-28 md:px-8">
      <div class="text-center">
        <h1 class="mt-1 text-4xl font-bold sm:text-5xl lg:text-6xl">
          About Us
        </h1>
        <p
          class="mx-auto mt-5 max-w-3xl text-xl leading-normal md:mt-7 md:text-2xl"
        >
          Welcome to Stocknear — a stock analysis platform created by users, for
          users. We’re here to make stock analysis simple, valueable and
          accessible for everyday investors like you.
        </p>
      </div>
    </div>
  </section>

  <section class="border-t border-gray-300 dark:border-gray-600">
    <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div class="lg:text-center">
        <h2 class="mt-2 text-3xl font-bold leading-8 sm:text-4xl">
          What sets us apart
        </h2>
        <p class="mt-4 max-w-lg text-xl lg:mx-auto">
          We're here to make investing simple and efficient with data that’s
          always up-to-date and highly accurate.
        </p>
      </div>
      <div class="mt-10">
        <dl
          class="space-y-10 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-12 md:space-y-0"
        >
          <div class="relative">
            <dt>
              <div
                class="absolute flex h-12 w-12 items-center justify-center rounded bg-default dark:bg-white text-white dark:text-black"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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
              <p class="ml-16 text-lg font-semibold leading-6">Data accuracy</p>
            </dt>
            <dd class="ml-16 mt-2">
              We partner with top-tier data vendors to bring you premium Wall
              Street data, backed by the highest standards of accuracy.
            </dd>
          </div>
          <div class="relative">
            <dt>
              <div
                class="absolute flex h-12 w-12 items-center justify-center rounded bg-default dark:bg-white text-white dark:text-black"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style="max-width:40px"
                  aria-hidden="true"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path></svg
                >
              </div>
              <p class="ml-16 text-lg font-semibold leading-6">Ease of use</p>
            </dt>
            <dd class="ml-16 mt-2">
              Our goal is to deliver the latest market insights—simple, clear,
              efficient and fast.
            </dd>
          </div>
          <div class="relative">
            <dt>
              <div
                class="absolute flex h-12 w-12 items-center justify-center rounded bg-default dark:bg-white text-white dark:text-black"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style="max-width:40px"
                  aria-hidden="true"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path></svg
                >
              </div>
              <p class="ml-16 text-lg font-semibold leading-6">Speed</p>
            </dt>
            <dd class="ml-16 mt-2">
              The market moves fast and so does Stocknear. We’ve designed the
              website to load instantly, ensuring you never miss a beat.
            </dd>
          </div>
          <div class="relative">
            <dt>
              <div
                class="absolute flex h-12 w-12 items-center justify-center rounded bg-default dark:bg-white text-white dark:text-black"
              >
                <svg
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style="max-width:40px"
                  aria-hidden="true"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  ></path></svg
                >
              </div>
              <p class="ml-16 text-lg font-semibold leading-6">Integrity</p>
            </dt>
            <dd class="ml-16 mt-2">
              We provide unbiased data for every stock, letting you form your
              own opinions.
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </section>

  <section
    class="border-t border-gray-200 shadow dark:border-gray-600 bg-gray-100 dark:bg-default"
  >
    <div class="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-28">
      <div class="space-y-12 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
        <div class="space-y-5 sm:space-y-4">
          <h2 class="text-3xl font-bold sm:text-4xl">Our Team</h2>
          <p class="text-lg sm:text-xl">Developer of Stocknear</p>
        </div>
        <div class="lg:col-span-2">
          <ul
            class="space-y-12 sm:-mt-8 sm:space-y-0 sm:divide-y sm:divide-gray-200 lg:gap-x-8 lg:space-y-0"
          >
            <li class="sm:py-8">
              <div
                class="space-y-4 sm:grid sm:grid-cols-3 sm:items-start sm:gap-6 sm:space-y-0"
              >
                <div>
                  <img
                    class="rounded-full object-cover shadow-lg w-24 h-24 sm:w-28 sm:h-28 m-auto mb-10 sm:mb-0"
                    src={profile}
                    alt="Muslem Rahimi profile picture"
                    loading="lazy"
                  />
                </div>
                <div class="sm:col-span-2">
                  <div class="space-y-4">
                    <div class="space-y-1 text-lg font-semibold leading-6">
                      <h3>Muslem Rahimi, PhD</h3>
                      <p class="text-blue-800 dark:text-blue-400">
                        Founder / Chief of Nothing
                      </p>
                    </div>
                    <div class="text-lg">
                      <p class="">
                        Muslem founded Stocknear in 2022 after leaving his role
                        as an insurance mathematician at Deloitte. He holds a
                        Bachelor's degree in Physics from the University of
                        Göttingen, a Master's in Particle Physics from the
                        Technical University of Munich (TUM), and a PhD in
                        Theoretical Particle Physics from the University of
                        Siegen.
                      </p>
                    </div>
                    <ul class="flex space-x-5">
                      <!--
                      <li>
                        <a
                          href="https://github.com/stocknear"
                          class="text-muted sm:hover:text-gray-800 dark:text-white dark:sm:hover:text-gray-300"
                          target="_blank"
                          rel="noopener noreferrer"
                          ><span class="sr-only">Github</span>
                          <svg
                            class="h-6 w-6"
                            aria-hidden="true"
                            fill="currentColor"
                            style="max-width:40px"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            ><path
                              d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
                            /></svg
                          ></a
                        >
                      </li>
                      -->

                      <li>
                        <a
                          href="https://x.com/intent/follow?screen_name=stocknear"
                          class="text-muted sm:hover:text-gray-800 dark:text-white dark:sm:hover:text-gray-300"
                          target="_blank"
                          rel="noopener noreferrer"
                          ><span class="sr-only">Twitter</span>
                          <svg
                            class="h-5 w-5"
                            aria-hidden="true"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            style="max-width:40px"
                            ><path
                              d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"
                            ></path></svg
                          ></a
                        >
                      </li>

                      <li>
                        <a
                          href="https://www.linkedin.com/in/dr-muslem-rahimi-013956172/"
                          class="text-muted sm:hover:text-gray-800 dark:text-white dark:sm:hover:text-gray-300"
                          target="_blank"
                          rel="noopener noreferrer"
                          ><span class="sr-only">LinkedIn</span>
                          <svg
                            class="h-5 w-5"
                            aria-hidden="true"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            style="max-width:40px"
                            ><path
                              fill-rule="evenodd"
                              d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                              clip-rule="evenodd"
                            ></path></svg
                          ></a
                        >
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</body>
