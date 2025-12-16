<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import profile from "$lib/images/profile.webp";
  export let data;
</script>

<SEO
  title="About"
  description="Stocknear was built to give everyday investors the same data Wall Street uses. Founded by Dr. Muslem Rahimi, we're on a mission to democratize stock analysis."
/>

<div class="text-muted dark:text-white w-full">
  <!-- Hero Section -->
  <section
    class="border-b border-gray-200 shadow dark:border-gray-600 sm:rounded w-full bg-gray-100 dark:bg-default"
  >
    <div class="mx-auto max-w-4xl px-6 py-16 sm:py-24 md:px-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold sm:text-5xl lg:text-6xl leading-tight">
          About us
        </h1>
        <p
          class="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-gray-600 dark:text-gray-300"
        >
          Stocknear exists because we believe every investor deserves access to
          the same institutional-grade data that hedge funds pay thousands for.
        </p>
      </div>
    </div>
  </section>

  <!-- Values Section -->
  <section class="border-t border-gray-300 dark:border-gray-600">
    <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div class="lg:text-center">
        <p
          class="text-sm font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400 mb-4"
        >
          Our Values
        </p>
        <h2 class="text-3xl font-bold leading-8 sm:text-4xl">
          What we stand for
        </h2>
        <p
          class="mt-4 max-w-2xl text-xl text-gray-600 dark:text-gray-300 lg:mx-auto"
        >
          Every decision we make is guided by these principles.
        </p>
      </div>
      <div class="mt-12">
        <dl
          class="space-y-10 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-12 md:space-y-0"
        >
          <div class="relative">
            <dt>
              <div
                class="absolute flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600 text-white"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <p class="ml-16 text-lg font-semibold leading-6">
                Data Accuracy First
              </p>
            </dt>
            <dd class="ml-16 mt-2 text-gray-600 dark:text-gray-300">
              We partner with the same data vendors that serve hedge funds. No
              scraped data. No guesswork. Just clean, verified information you
              can trust.
            </dd>
          </div>
          <div class="relative">
            <dt>
              <div
                class="absolute flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600 text-white"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <p class="ml-16 text-lg font-semibold leading-6">Speed Matters</p>
            </dt>
            <dd class="ml-16 mt-2 text-gray-600 dark:text-gray-300">
              Markets move fast. Our platform loads instantly. Every screen,
              every chart, every data point is optimized so you never miss an
              opportunity.
            </dd>
          </div>
          <div class="relative">
            <dt>
              <div
                class="absolute flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600 text-white"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                  />
                </svg>
              </div>
              <p class="ml-16 text-lg font-semibold leading-6">
                Complete Objectivity
              </p>
            </dt>
            <dd class="ml-16 mt-2 text-gray-600 dark:text-gray-300">
              We show the data. You make the decisions. No hidden agendas, no
              paid promotions, no "hot picks." Just unbiased information for
              every stock.
            </dd>
          </div>
          <div class="relative">
            <dt>
              <div
                class="absolute flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600 text-white"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p class="ml-16 text-lg font-semibold leading-6">Built for You</p>
            </dt>
            <dd class="ml-16 mt-2 text-gray-600 dark:text-gray-300">
              We're investors too. Every feature is designed based on what we'd
              want to see. Your feedback shapes our roadmap—not venture
              capitalists.
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </section>

  <!-- Founder Section -->
  <section
    class="border-t border-gray-200 shadow dark:border-gray-600 bg-gray-100 dark:bg-default"
  >
    <div class="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
      <div class="lg:grid lg:grid-cols-3 lg:gap-12">
        <div>
          <p
            class="text-sm font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400 mb-4"
          >
            The Founder
          </p>
          <h2 class="text-3xl font-bold sm:text-4xl">
            From Physics to Finance
          </h2>
          <p class="mt-4 text-lg text-gray-600 dark:text-gray-300">
            The same analytical rigor that explores the universe now powers your
            investment research.
          </p>
        </div>
        <div class="lg:col-span-2 mt-10 lg:mt-0">
          <div class="flex flex-col sm:flex-row items-start gap-8">
            <img
              class="rounded-xl object-cover shadow-lg w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0"
              src={profile}
              alt="Dr. Muslem Rahimi"
              loading="lazy"
            />
            <div class="space-y-4">
              <div>
                <h3 class="text-xl font-bold">Dr. Muslem Rahimi</h3>
                <p class="text-purple-600 dark:text-purple-400 font-medium">
                  Founder & CEO
                </p>
              </div>
              <div class="text-gray-600 dark:text-gray-300 space-y-3">
                <p>
                  Honestly, I never planned to start a fintech company. As a
                  physicist, I was focused on research and academia. But when I
                  began trading stocks, I quickly saw the gaps in the tools
                  available to retail investors.
                </p>
                <p>
                  I like to solve problems and I realized that by applying the
                  same data analysis techniques from physics, I could create a
                  platform that gives everyday investors access to
                  institutional-grade data. So that's what I did. Stocknear was
                  born out of a desire to challenge myself to learn new skills
                  and build something meaningful.
                </p>

                <p class="text-sm text-gray-500 dark:text-gray-400">
                  PhD in Theoretical Particle Physics (University of Siegen) ·
                  MSc in Particle Physics (Technical University of Munich) · BSc
                  in Physics (University of Göttingen)
                </p>
              </div>
              <div class="flex space-x-4 pt-2">
                <a
                  href="https://x.com/intent/follow?screen_name=stocknear"
                  class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span class="sr-only">Twitter</span>
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"
                    />
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/in/dr-muslem-rahimi-013956172/"
                  class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span class="sr-only">LinkedIn</span>
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="border-t border-gray-300 dark:border-gray-600">
    <div class="mx-auto max-w-4xl px-6 py-16 lg:py-20 text-center">
      <div>
        <h2 class="text-3xl font-bold sm:text-4xl">
          Ready to access institutional-grade data?
        </h2>
        <p
          class="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
        >
          Join thousands of investors who are now data-driven instead of
          emotions. Start with a free account and upgrade when you're ready.
        </p>
        <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/register"
            class="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-lg"
          >
            Get Started Free
          </a>
          <a
            href="/pricing"
            class="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-gray-700 dark:text-white bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            View Pricing
          </a>
        </div>
      </div>
    </div>
  </section>
</div>
