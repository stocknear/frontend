<script>
  import SEO from "$lib/components/SEO.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import {
    common_home,
    common_sponsor_us,
    common_learn_more_sponsor,
    common_contact_us,
    common_let_me_know,
    faq_seo_title,
    faq_seo_description,
    faq_breadcrumb,
    faq_hero_title,
    faq_q1_title,
    faq_q1_answer,
    faq_q2_title,
    faq_q2_answer,
    faq_q3_title,
    faq_q3_answer_1,
    faq_q3_answer_2,
    faq_q3_answer_3,
    faq_q4_title,
    faq_q4_answer,
    faq_q5_title,
    faq_q5_answer,
    faq_q6_title,
    faq_q6_answer,
    faq_q7_title,
    faq_q7_answer_1,
    faq_q7_answer_2,
    faq_q8_title,
    faq_q8_answer,
    faq_q9_title,
    faq_q9_answer,
    faq_sidebar_pro_title,
    faq_sidebar_pro_desc,
    faq_sidebar_about_title,
    footer_learning_center,
  } from "$lib/paraglide/messages.js";

  export let data;
  let discordURL = import.meta.env.VITE_DISCORD_URL;
  const emailAddress = "contact@stocknear.com";
</script>

<SEO
  title={faq_seo_title()}
  description={faq_seo_description()}
  keywords="Stocknear FAQ, stock platform help, investment platform questions, stock analysis help, trading platform support, financial data questions, subscription help, platform features"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: "Stocknear FAQ",
    description:
      "Frequently asked questions about Stocknear stock analysis platform",
    url: "https://stocknear.com/faq",
    mainEntity: {
      "@type": "Question",
      name: "Common questions about Stocknear platform features and services",
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-fg"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-fg-muted"
  >
    <li>
      <a
        href="/"
        class="text-fg-muted hover:text-accent transition"
        >{common_home()}</a
      >
    </li>
    <li class="text-fg-muted">{faq_breadcrumb()}</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:pr-10">
          <div class="mb-6 border-b border-line">
            <h1
              class="mb-2 type-h1 text-fg"
            >
              {faq_hero_title()}
            </h1>
          </div>

          <div class="w-full m-auto">
            <div>
              <h2
                class="mb-1 text-lg sm:type-h2 text-fg text-fg"
              >
                {faq_q1_title()}
              </h2>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-fg-muted"
              >
                {@html faq_q1_answer({
                  learningCenterLink: `<a href="/learning-center" class="font-medium text-fg transition-colors hover:text-accent transition">${footer_learning_center()}</a>`,
                })}
              </p>

              <h2
                class="mb-1 text-lg sm:type-h2 text-fg text-fg"
              >
                {faq_q2_title()}
              </h2>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-fg-muted"
              >
                {faq_q2_answer()}
              </p>

              <h2
                class="mb-1 text-lg sm:type-h2 text-fg text-fg"
              >
                {faq_q3_title()}
              </h2>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-fg-muted"
              >
                {faq_q3_answer_1()}
              </p>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-fg-muted"
              >
                {faq_q3_answer_2()}
              </p>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-fg-muted"
              >
                {@html faq_q3_answer_3({
                  email: `<a href="mailto:${emailAddress}" class="font-medium text-fg transition-colors hover:text-accent transition">${emailAddress}</a>`,
                })}
              </p>

              <h2
                class="mb-1 text-lg sm:type-h2 text-fg text-fg"
              >
                {faq_q4_title()}
              </h2>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-fg-muted"
              >
                {@html faq_q4_answer({
                  optionsFlowLink: `<a href="/options-flow" class="font-medium text-fg transition-colors hover:text-accent transition">Options Flow</a>`,
                })}
              </p>

              <h2
                class="mb-1 text-lg sm:type-h2 text-fg text-fg"
              >
                {faq_q5_title()}
              </h2>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-fg-muted"
              >
                {faq_q5_answer()}
              </p>

              <h2
                class="mb-1 text-lg sm:type-h2 text-fg text-fg"
              >
                {faq_q6_title()}
              </h2>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-fg-muted"
              >
                {faq_q6_answer()}
              </p>

              <h2
                class="mb-1 text-lg sm:type-h2 text-fg text-fg"
              >
                {faq_q7_title()}
              </h2>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-fg-muted"
              >
                {@html faq_q7_answer_1({
                  email: `<a href="mailto:${emailAddress}" class="font-medium text-fg transition-colors hover:text-accent transition">${emailAddress}</a>`,
                })}
              </p>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-fg-muted"
              >
                {faq_q7_answer_2()}
              </p>

              <h2
                class="mb-1 text-lg sm:type-h2 text-fg text-fg"
              >
                {faq_q8_title()}
              </h2>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-fg-muted"
              >
                {@html faq_q8_answer({
                  discordLink: `<a href="${discordURL}" rel="noopener noreferrer" target="_blank" class="font-medium text-fg transition-colors hover:text-accent transition">Discord</a>`,
                })}
              </p>

              <h2
                class="mb-1 text-lg sm:type-h2 text-fg text-fg"
              >
                {faq_q9_title()}
              </h2>
              <p
                class="mb-5 mt-4 text-sm sm:text-base text-fg-muted"
              >
                {faq_q9_answer()}
              </p>
            </div>
          </div>
        </main>

        <aside class="hidden lg:block relative fixed w-1/4 mt-4">
          <div
            class="w-full bg-surface-card border border-line rounded-container pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href="/pricing"
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start type-h3 text-fg ml-3">
                  {faq_sidebar_pro_title()}
                </h2>
              </div>
              <span class="p-3 ml-3 mr-3 text-sm text-fg-muted">
                {faq_sidebar_pro_desc()}
              </span>
            </a>
          </div>

          <div
            class="w-full bg-surface-card border border-line rounded-container pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href="/about"
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start type-h3 text-fg ml-3">
                  {faq_sidebar_about_title()}
                </h2>
              </div>
              <span class="p-3 ml-3 mr-3 text-sm text-fg-muted">
                {common_learn_more_sponsor()}
              </span>
            </a>
          </div>

          <div
            class="w-full bg-surface-card border border-line rounded-container pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <a
              href="/contact"
              class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
            >
              <div class="w-full flex justify-between items-center p-3 mt-3">
                <h2 class="text-start type-h3 text-fg ml-3">
                  {common_contact_us()}
                </h2>
              </div>
              <span class="p-3 ml-3 mr-3 text-sm text-fg-muted">
                {common_let_me_know()}
              </span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</section>
