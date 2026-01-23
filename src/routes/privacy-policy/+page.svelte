<script>
  import SEO from "$lib/components/SEO.svelte";
  import { showCookiePreferences } from "$lib/store";
  import { Button } from "$lib/components/shadcn/button/index.ts";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import {
    common_home,
    common_sponsor_us,
    common_learn_more_sponsor,
    common_contact_us,
    common_let_me_know,
    privacy_seo_title,
    privacy_seo_description,
    privacy_breadcrumb,
    privacy_hero_title,
    privacy_last_updated,
    privacy_intro,
    privacy_cookies_title,
    privacy_cookies_intro,
    privacy_cookies_necessary,
    privacy_cookies_necessary_desc,
    privacy_cookies_analytics,
    privacy_cookies_analytics_desc,
    privacy_cookies_marketing,
    privacy_cookies_marketing_desc,
    privacy_cookies_manage,
    privacy_cookies_button,
    privacy_links_title,
    privacy_links_content,
    privacy_security_title,
    privacy_security_content,
    privacy_gdpr_title,
    privacy_gdpr_intro,
    privacy_gdpr_contact,
    privacy_gdpr_rights_intro,
    privacy_gdpr_right_1,
    privacy_gdpr_right_2,
    privacy_gdpr_right_3,
    privacy_gdpr_right_4,
    privacy_gdpr_right_5,
    privacy_gdpr_right_6,
    privacy_gdpr_verify,
    privacy_gdpr_complaint,
    privacy_caloppa_title,
    privacy_caloppa_intro,
    privacy_caloppa_compliance,
    privacy_caloppa_1,
    privacy_caloppa_2,
    privacy_caloppa_3,
    privacy_caloppa_4,
    privacy_caloppa_dnt,
    privacy_children_title,
    privacy_children_content,
    privacy_changes_title,
    privacy_changes_content,
    footer_terms_of_use,
  } from "$lib/paraglide/messages.js";

  const emailAddress = "support@stocknear.com";

  function openCookiePreferences() {
    showCookiePreferences.set(true);
  }
</script>

<SEO
  title={privacy_seo_title()}
  description={privacy_seo_description()}
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
    <li class="text-gray-800 dark:text-zinc-300">{privacy_breadcrumb()}</li>
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
              {privacy_hero_title()}
            </h1>
          </div>

          <div
            class="w-full m-auto text-sm sm:text-base text-gray-800 dark:text-zinc-300"
          >
            <div class="">
              <p class="italic mb-2 text-xs text-gray-800 dark:text-zinc-300">
                {privacy_last_updated()}
              </p>

              <p class=" mb-10">
                {@html privacy_intro({
                  termsLink: `<a href="/terms-of-use" class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition">${footer_terms_of_use()}</a>`
                })}
              </p>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {privacy_cookies_title()}
              </h2>

              <p class="mb-4">
                {privacy_cookies_intro()}
              </p>

              <ul class="list-disc ml-6 mb-4 space-y-2">
                <li>
                  <strong>{privacy_cookies_necessary()}</strong> {privacy_cookies_necessary_desc()}
                </li>
                <li>
                  <strong>{privacy_cookies_analytics()}</strong> {privacy_cookies_analytics_desc()}
                </li>
                <li>
                  <strong>{privacy_cookies_marketing()}</strong> {privacy_cookies_marketing_desc()}
                </li>
              </ul>

              <p class="mb-4">
                {privacy_cookies_manage()}
              </p>

              <div class="mb-10">
                <Button
                  on:click={openCookiePreferences}
                  class="flex-shrink-0 w-fit border border-gray-300 shadow dark:border-zinc-700 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 ease-out flex flex-row justify-between items-center px-4 py-2 rounded-full truncate"
                >
                  {privacy_cookies_button()}
                </Button>
              </div>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {privacy_links_title()}
              </h2>

              <div class=" mb-10">
                {privacy_links_content()}
              </div>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {privacy_security_title()}
              </h2>

              <div class=" mb-10">
                {privacy_security_content()}
              </div>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {privacy_gdpr_title()}
              </h2>

              <div class=" mb-10">
                {privacy_gdpr_intro()}<br /><br />
                {@html privacy_gdpr_contact({
                  email: `<a href="mailto:${emailAddress}" class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition">${emailAddress}</a>`
                })}<br /><br />
                {privacy_gdpr_rights_intro()}
                <ol class="list-decimal ml-8 mt-2">
                  <li>{privacy_gdpr_right_1()}</li>
                  <li>{privacy_gdpr_right_2()}</li>
                  <li>{privacy_gdpr_right_3()}</li>
                  <li>{privacy_gdpr_right_4()}</li>
                  <li>{privacy_gdpr_right_5()}</li>
                  <li>{privacy_gdpr_right_6()}</li>
                </ol>
                <br />
                {privacy_gdpr_verify()}<br /><br />
                {privacy_gdpr_complaint()}
              </div>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {privacy_caloppa_title()}
              </h2>

              <div class=" mb-10">
                {privacy_caloppa_intro()}<br /><br />
                {privacy_caloppa_compliance()}
                <ol class="list-decimal ml-8 mt-2">
                  <li>{privacy_caloppa_1()}</li>
                  <li>{privacy_caloppa_2()}</li>
                  <li>{privacy_caloppa_3()}</li>
                  <li>
                    {@html privacy_caloppa_4({
                      email: `<a href="mailto:${emailAddress}" class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition">${emailAddress}</a>`
                    })}
                  </li>
                </ol>
                <br />
                {privacy_caloppa_dnt()}
              </div>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {privacy_children_title()}
              </h2>

              <div class=" mb-10">
                {privacy_children_content()}
              </div>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {privacy_changes_title()}
              </h2>

              <div class=" mb-10">
                {privacy_changes_content()}
              </div>
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
