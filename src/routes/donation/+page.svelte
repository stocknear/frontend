<script>
  import { screenWidth } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import {
    common_contact_us,
    common_home,
    common_learn_more_sponsor,
    common_let_me_know,
    donation_cta_paragraph_1,
    donation_cta_paragraph_2,
    donation_cta_title,
    donation_intro_greeting,
    donation_intro_paragraph_1,
    donation_intro_paragraph_2,
    donation_iframe_title,
    donation_seo_description,
    donation_seo_title,
    donation_sidebar_about_title,
    donation_support_list_intro,
    donation_support_list_item_1,
    donation_support_list_item_2,
    donation_support_list_item_3,
    donation_support_paragraph_1,
    donation_title,
  } from "$lib/paraglide/messages.js";
</script>

<SEO
  title={donation_seo_title()}
  description={donation_seo_description()}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300"
  >
    <li>
      <a
        href="/"
        class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >{common_home()}</a
      >
    </li>
    <li class="text-gray-800 dark:text-zinc-300">{donation_title()}</li>
  </BreadCrumb>

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
              {donation_title()}
            </h1>
          </div>

          <div
            class="w-full m-auto text-sm sm:text-base text-gray-800 dark:text-zinc-300"
          >
            <div class="">
              <h2
                class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-5"
              >
                {donation_intro_greeting()}
              </h2>
              <p class="mb-5">
                {donation_intro_paragraph_1()}
                <br />
                <br />
                {donation_intro_paragraph_2()}
              </p>
              <div class="mb-5">
                {donation_support_paragraph_1()}
                <br />
                <br />

                {donation_support_list_intro()}
                <ul class="list-disc pl-6 pt-2 space-y-2">
                  <li>{donation_support_list_item_1()}</li>
                  <li>{donation_support_list_item_2()}</li>
                  <li>
                    {donation_support_list_item_3()}
                  </li>
                </ul>
              </div>

              <h2
                class="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {donation_cta_title()}
              </h2>
              <p class="mb-5">
                {donation_cta_paragraph_1()}
                <br />
                <br />
                <iframe
                  class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40"
                  src="https://github.com/sponsors/stocknear/card"
                  title={donation_iframe_title()}
                  height={$screenWidth < 640 ? "300" : "auto"}
                ></iframe>
                <br />

                {donation_cta_paragraph_2()}
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
                <h2 class="text-start text-lg font-semibold ml-3">
                  {donation_sidebar_about_title()}
                </h2>
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
              >
                {common_learn_more_sponsor()}
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
                  {common_contact_us()}
                </h2>
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
              >
                {common_let_me_know()}
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>
