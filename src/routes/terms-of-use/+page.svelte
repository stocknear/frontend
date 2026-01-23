<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import {
    common_home,
    common_privacy_policy,
    common_imprint,
    common_contact_us,
    common_sponsor_us,
    common_learn_more_sponsor,
    common_let_me_know,
    terms_seo_title,
    terms_seo_description,
    terms_breadcrumb,
    terms_hero_title,
    terms_last_updated,
    terms_intro,
    terms_noadvice_title,
    terms_noadvice_content_1,
    terms_noadvice_content_2,
    terms_noadvice_content_3,
    terms_noadvice_content_4,
    terms_noadvice_disclaimer_1,
    terms_noadvice_disclaimer_2,
    terms_accuracy_title,
    terms_accuracy_content,
    terms_content_title,
    terms_content_content,
    terms_fairuse_title,
    terms_fairuse_content_1,
    terms_fairuse_content_2,
    terms_liability_title,
    terms_liability_content_1,
    terms_liability_content_2,
    terms_copyright_title,
    terms_copyright_content_1,
    terms_copyright_content_2,
    terms_copyright_content_3,
    terms_subscriptions_title,
    terms_subscriptions_content_1,
    terms_subscriptions_content_2,
    terms_subscriptions_content_3,
    terms_subscriptions_content_4,
    terms_subscriptions_content_5,
    terms_pricing_title,
    terms_pricing_content,
    terms_lifetime_title,
    terms_lifetime_content_1,
    terms_lifetime_content_2,
    terms_lifetime_content_3,
    terms_termination_title,
    terms_termination_content_1,
    terms_termination_content_2,
    terms_termination_content_3,
    terms_amendments_title,
    terms_amendments_content,
    terms_data_title,
    terms_data_content_1,
    terms_data_content_2,
    terms_complete_title,
    terms_complete_content_1,
    terms_complete_content_2,
  } from "$lib/paraglide/messages.js";
</script>

<SEO title={terms_seo_title()} description={terms_seo_description()} />

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
    <li class="text-gray-800 dark:text-zinc-300">{terms_breadcrumb()}</li>
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
              {terms_hero_title()}
            </h1>
          </div>

          <div
            class="w-full m-auto text-sm sm:text-base text-gray-800 dark:text-zinc-300"
          >
            <div class="">
              <p class="italic mb-2 text-xs text-gray-800 dark:text-zinc-300">
                {terms_last_updated()}
              </p>

              <p class=" mb-10">
                {@html terms_intro({
                  privacyLink: `<a href="/privacy-policy" class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition">${common_privacy_policy()}</a>`
                })}
              </p>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {terms_noadvice_title()}
              </h2>

              <p class=" mb-10">
                {terms_noadvice_content_1()}<br /><br />
                {terms_noadvice_content_2()}<br /><br />
                {terms_noadvice_content_3()}<br /><br />
                {terms_noadvice_content_4()}<br /><br />
                {terms_noadvice_disclaimer_1()}<br /><br />
                {terms_noadvice_disclaimer_2()}
              </p>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {terms_accuracy_title()}
              </h2>

              <p class=" mb-10">
                {terms_accuracy_content()}
              </p>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {terms_content_title()}
              </h2>

              <p class=" mb-10">
                {terms_content_content()}
              </p>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {terms_fairuse_title()}
              </h2>

              <p class=" mb-10">
                {terms_fairuse_content_1()}<br /><br />
                {terms_fairuse_content_2()}
              </p>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {terms_liability_title()}
              </h2>

              <p class=" mb-10">
                {terms_liability_content_1()}<br /><br />
                {terms_liability_content_2()}
              </p>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {terms_copyright_title()}
              </h2>

              <p class=" mb-10">
                {terms_copyright_content_1()}<br /><br />
                {@html terms_copyright_content_2({
                  email: `<a href="mailto:contact@stocknear.com" class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition">contact@stocknear.com</a>`
                })}<br /><br />
                {terms_copyright_content_3()}
              </p>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {terms_subscriptions_title()}
              </h2>

              <p class="mb-10">
                {terms_subscriptions_content_1()}<br /><br />
                {terms_subscriptions_content_2()}<br /><br />
                {@html terms_subscriptions_content_3({
                  email: `<a href="mailto:support@stocknear.com" class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition">support@stocknear.com</a>`
                })}<br /><br />
                {terms_subscriptions_content_4()}<br /><br />
                {terms_subscriptions_content_5()}
              </p>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {terms_pricing_title()}
              </h2>

              <p class=" mb-10">
                {terms_pricing_content()}
              </p>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {terms_lifetime_title()}
              </h2>

              <div class="mb-10">
                {terms_lifetime_content_1()}<br /><br />
                {terms_lifetime_content_2()}<br /><br />
                {terms_lifetime_content_3()}
              </div>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {terms_termination_title()}
              </h2>

              <div class=" mb-10">
                {terms_termination_content_1()}<br /><br />
                {terms_termination_content_2()}<br /><br />
                {terms_termination_content_3()}
              </div>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {terms_amendments_title()}
              </h2>

              <div class=" mb-10">
                {terms_amendments_content()}
              </div>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {terms_data_title()}
              </h2>

              <div class=" mb-10">
                {terms_data_content_1()}<br /><br />
                {@html terms_data_content_2({
                  email: `<a href="mailto:support@stocknear.com" class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition">support@stocknear.com</a>`
                })}
              </div>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {terms_complete_title()}
              </h2>

              <p class=" mb-10">
                {@html terms_complete_content_1({
                  privacyLink: `<a href="/privacy-policy" class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition">${common_privacy_policy()}</a>`,
                  imprintLink: `<a href="/imprint" class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition">${common_imprint()}</a>`
                })}
                <br /><br />
                {terms_complete_content_2()}
              </p>
            </div>
          </div>
        </main>

        <aside class="hidden lg:block relative fixed w-1/4 ml-4">
          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href="/donation"
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">
                  {common_sponsor_us()}
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
