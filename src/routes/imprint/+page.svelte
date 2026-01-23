<script>
  import SEO from "$lib/components/SEO.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import {
    common_home,
    common_sponsor_us,
    common_learn_more_sponsor,
    common_contact_us,
    common_let_me_know,
    imprint_seo_title,
    imprint_breadcrumb,
    imprint_hero_title,
    imprint_tmg_notice,
    imprint_managing_director,
    imprint_managing_director_de,
    imprint_registered,
    imprint_vat,
    imprint_responsible,
    imprint_odr_notice,
    imprint_odr_content,
    imprint_odr_note,
    imprint_vsbg_title,
    imprint_vsbg_content,
    imprint_disclaimer_title,
    imprint_content_warning_title,
    imprint_content_warning,
    imprint_external_links_title,
    imprint_external_links,
    imprint_copyright_title,
    imprint_copyright,
    imprint_special_conditions_title,
    imprint_special_conditions,
  } from "$lib/paraglide/messages.js";

  const emailAddress = "support@stocknear.com";
</script>

<SEO title={imprint_seo_title()} description="" />

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
    <li class="text-gray-800 dark:text-zinc-300">{imprint_breadcrumb()}</li>
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
              {imprint_hero_title()}
            </h1>
          </div>

          <div
            class="w-full m-auto text-sm sm:text-base text-gray-800 dark:text-zinc-300"
          >
            <div class="">
              <p class="italic mb-2 text-xs text-gray-800 dark:text-zinc-300">
                {imprint_tmg_notice()}
              </p>

              <p class=" mb-5">
                Stocknear GmbH
                <br />
                Am Lohgraben 30
                <br />
                57074 Siegen
                <br />
                Email:
                <a
                  href={`mailto:${emailAddress}`}
                  class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                  >{emailAddress}</a
                >.
                <br class="mb-3" />

                {imprint_managing_director()} (<span class="italic">{imprint_managing_director_de()}</span>):
                Dr. rer. nat. Muslem Rahimi
                <br class="mb-3" />

                {imprint_registered()}
                <br />
                {imprint_vat()}
              </p>

              <p class="mb-5">
                {imprint_responsible()}
                <br />
                {imprint_odr_notice()}
              </p>

              <p class="mb-5">
                {imprint_odr_content()}
                <a
                  target="_blank"
                  href="http://ec.europa.eu/odr"
                  class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                  >http://ec.europa.eu/odr.</a
                >
                <br />
                {imprint_odr_note()}
              </p>

              <h2
                class="mb-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {imprint_vsbg_title()}
              </h2>

              <p class=" mb-5">
                {imprint_vsbg_content()}
              </p>

              <h1
                class="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white text-start mb-5"
              >
                {imprint_disclaimer_title()}
              </h1>
              <h1
                class="text-lg font-semibold text-gray-900 dark:text-white text-start mb-3 ml-2"
              >
                {imprint_content_warning_title()}
              </h1>

              <p class=" mb-3 ml-2">
                {imprint_content_warning()}
              </p>

              <h1
                class="text-lg font-semibold text-gray-900 dark:text-white text-start mb-3 ml-2"
              >
                {imprint_external_links_title()}
              </h1>
              <p class=" mb-3 ml-2">
                {imprint_external_links()}
              </p>

              <h1
                class="text-lg font-semibold text-gray-900 dark:text-white text-start mb-3 ml-2"
              >
                {imprint_copyright_title()}
              </h1>
              <p class=" mb-3 ml-2">
                {imprint_copyright()}
              </p>

              <h1
                class="text-lg font-semibold text-gray-900 dark:text-white text-start mb-3 ml-2"
              >
                {imprint_special_conditions_title()}
              </h1>
              <p class=" mb-3 ml-2">
                {imprint_special_conditions()}
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
