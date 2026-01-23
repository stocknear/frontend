<script>
  import SEO from "$lib/components/SEO.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import {
    common_home,
    common_sponsor_us,
    common_learn_more_sponsor,
    common_contact_us,
    common_let_me_know,
    data_seo_title,
    data_seo_description,
    data_breadcrumb,
    data_hero_title,
    data_intro,
    data_contact,
    data_market_title,
    data_market_content,
    data_coverage_title,
    data_coverage_content,
    data_fundamentals_title,
    data_fundamentals_content,
    data_business_title,
    data_business_content,
    data_analyst_title,
    data_analyst_content,
    data_etf_title,
    data_etf_content,
    data_options_title,
    data_options_content,
    faq_sidebar_pro_title,
    faq_sidebar_pro_desc,
    faq_sidebar_about_title,
  } from "$lib/paraglide/messages.js";

  let discordURL = import.meta.env.VITE_DISCORD_URL;
  const emailAddress = "support@stocknear.com";
  const fmpLink = `<a href="https://site.financialmodelingprep.com/pricing-plans?couponCode=stocknear" target="_blank" rel="noopener noreferrer" class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition">Financial Modeling Prep (FMP)</a>`;
  const mainStreetLink = `<a href="https://mainstreetdata.com" target="_blank" rel="noopener noreferrer" class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition">Main Street Data</a>`;
</script>

<SEO
  title={data_seo_title()}
  description={data_seo_description()}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
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
    <li class="text-gray-800 dark:text-zinc-300">{data_breadcrumb()}</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-10">
          <div class="mb-6 border-b border-gray-300 dark:border-zinc-700">
            <h1
              class="mb-2 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {data_hero_title()}
            </h1>
          </div>

          <div class="w-full m-auto">
            <div>
              <p
                class="mb-5 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
              >
                {data_intro()}
                <br />
                {@html data_contact({
                  discordLink: `<a href="${discordURL}" target="_blank" rel="noopener noreferrer" class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition">Discord</a>`,
                  email: `<a href="mailto:${emailAddress}" class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition">${emailAddress}</a>`
                })}
              </p>

              <h2
                class="mb-1 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {data_market_title()}
              </h2>
              <p
                class="mb-10 mt-4 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
              >
                {@html data_market_content({ fmpLink })}
              </p>

              <h2
                class="mb-1 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {data_coverage_title()}
              </h2>
              <p
                class="mb-10 mt-4 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
              >
                {data_coverage_content()}
              </p>

              <h2
                class="mb-1 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {data_fundamentals_title()}
              </h2>
              <p
                class="mb-10 mt-4 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
              >
                {@html data_fundamentals_content({ fmpLink })}
              </p>

              <h2
                class="mb-1 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {data_business_title()}
              </h2>
              <p
                class="mb-10 mt-4 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
              >
                {@html data_business_content({ mainStreetLink })}
              </p>

              <h2
                class="mb-1 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {data_analyst_title()}
              </h2>
              <p
                class="mb-10 mt-4 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
              >
                {@html data_analyst_content({ fmpLink })}
              </p>

              <h2
                class="mb-1 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {data_etf_title()}
              </h2>
              <p
                class="mb-10 mt-4 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
              >
                {@html data_etf_content({ fmpLink })}
              </p>

              <h2
                class="mb-1 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white"
              >
                {data_options_title()}
              </h2>
              <p
                class="mb-10 mt-4 text-sm sm:text-base text-gray-800 dark:text-zinc-300"
              >
                {data_options_content()}
              </p>
            </div>
          </div>
        </main>

        <aside class="hidden lg:block relative fixed w-1/4 mt-4">
          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href="/pricing"
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">
                  {faq_sidebar_pro_title()}
                </h2>
              </div>
              <span
                class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
              >
                {faq_sidebar_pro_desc()}
              </span>
            </a>
          </div>

          <div
            class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href="/about"
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start text-lg font-semibold ml-3">{faq_sidebar_about_title()}</h2>
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
