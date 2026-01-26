<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import {
  advertise_breadcrumb_current,
  advertise_breadcrumb_home,
  advertise_cta_contact,
  advertise_cta_description_1,
  advertise_cta_email_intro,
  advertise_cta_email_outro,
  advertise_cta_title,
  advertise_intro_1,
  advertise_intro_2,
  advertise_newsletter_daily_reach,
  advertise_newsletter_daily_reach_detail,
  advertise_newsletter_description,
  advertise_newsletter_open_rate,
  advertise_newsletter_open_rate_detail,
  advertise_newsletter_premium_audience,
  advertise_newsletter_premium_audience_detail,
  advertise_newsletter_subscribers,
  advertise_newsletter_subscribers_detail,
  advertise_newsletter_title,
  advertise_seo_description,
  advertise_seo_title,
  advertise_sidebar_contact_description,
  advertise_sidebar_contact_title,
  advertise_sidebar_sponsor_description,
  advertise_sidebar_sponsor_title,
  advertise_title,
  advertise_why_choose_title,
  advertise_why_flexible,
  advertise_why_flexible_detail,
  advertise_why_growing,
  advertise_why_growing_detail,
  advertise_why_targeted,
  advertise_why_targeted_detail,
  advertise_why_trusted,
  advertise_why_trusted_detail,
} from "$lib/paraglide/messages";

  export let data;
</script>

<SEO
  title={advertise_seo_title()}
  description={advertise_seo_description()}
/>

<section
  class="w-full min-h-screen bg-white dark:bg-zinc-950 text-gray-700 dark:text-zinc-200"
>
  <div class="mx-auto w-full max-w-6xl px-6 py-10 lg:py-14">
    <BreadCrumb
      containerClass="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300"
    >
      <li>
        <a
          href="/"
          class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >{advertise_breadcrumb_home()}</a
        >
      </li>
      <li class="text-gray-800 dark:text-zinc-300">{advertise_breadcrumb_current()}</li>
    </BreadCrumb>

    <div class="mt-8 border-b border-gray-200/70 pb-4 dark:border-zinc-700">
      <h1
        class="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
      >
        {advertise_title()}
      </h1>
    </div>

    <div class="mt-10 grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
      <main
        class="space-y-6 text-[0.95rem] leading-relaxed text-gray-800 dark:text-zinc-300"
      >
        <p>
          {advertise_intro_1()}
        </p>

        <p>
          {advertise_intro_2()}
        </p>

        <div class="space-y-4">
          <h2
            class="text-lg font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            {advertise_newsletter_title()}
          </h2>
          <p>
            {advertise_newsletter_description()}
          </p>
          <ul class="ml-5 list-disc space-y-3">
            <li>
              <strong class="text-gray-800 dark:text-zinc-200"
                >{advertise_newsletter_subscribers()}</strong
              > {advertise_newsletter_subscribers_detail()}
            </li>
            <li>
              <strong class="text-gray-800 dark:text-zinc-200"
                >{advertise_newsletter_open_rate()}</strong
              >{advertise_newsletter_open_rate_detail()}
            </li>
            <li>
              <strong class="text-gray-800 dark:text-zinc-200"
                >{advertise_newsletter_daily_reach()}</strong
              > {advertise_newsletter_daily_reach_detail()}
            </li>
            <li>
              <strong class="text-gray-800 dark:text-zinc-200"
                >{advertise_newsletter_premium_audience()}</strong
              > {advertise_newsletter_premium_audience_detail()}
            </li>
          </ul>
        </div>

        <div class="space-y-4">
          <h2
            class="text-lg font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            {advertise_why_choose_title()}
          </h2>
          <ul class="ml-5 list-disc space-y-3">
            <li>
              <strong class="text-gray-800 dark:text-zinc-200"
                >{advertise_why_targeted()}</strong
              > {advertise_why_targeted_detail()}
            </li>
            <li>
              <strong class="text-gray-800 dark:text-zinc-200"
                >{advertise_why_trusted()}</strong
              > {advertise_why_trusted_detail()}
            </li>
            <li>
              <strong class="text-gray-800 dark:text-zinc-200"
                >{advertise_why_growing()}</strong
              > {advertise_why_growing_detail()}
            </li>
            <li>
              <strong class="text-gray-800 dark:text-zinc-200"
                >{advertise_why_flexible()}</strong
              > {advertise_why_flexible_detail()}
            </li>
          </ul>
        </div>

        <div class="space-y-3">
          <h2
            class="text-lg font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            {advertise_cta_title()}
          </h2>
          <p>
            {advertise_cta_description_1()}
          </p>
          <p>
            <strong class="text-gray-800 dark:text-zinc-200"
              >{advertise_cta_contact()}</strong
            >
            <br />{advertise_cta_email_intro()}
            <a
              class="font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
              href="mailto:contact@stocknear.com">contact@stocknear.com</a
            > {advertise_cta_email_outro()}
          </p>
        </div>
      </main>

      <aside class="space-y-4">
        <div
          class="rounded-2xl border border-gray-200/70 bg-white/70 p-5 transition hover:border-gray-300/80 hover:bg-gray-50/70 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:border-zinc-700/80 dark:hover:bg-zinc-900/60"
        >
          <a href="/donation" class="group flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h2
                class="text-lg font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                {advertise_sidebar_sponsor_title()}
              </h2>
            </div>
            <p class="text-[0.9rem] text-gray-800 dark:text-zinc-300">
              {advertise_sidebar_sponsor_description()}
            </p>
          </a>
        </div>

        <div
          class="rounded-2xl border border-gray-200/70 bg-white/70 p-5 transition hover:border-gray-300/80 hover:bg-gray-50/70 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:border-zinc-700/80 dark:hover:bg-zinc-900/60"
        >
          <a href="/contact" class="group flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h2
                class="text-lg font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                {advertise_sidebar_contact_title()}
              </h2>
            </div>
            <p class="text-[0.9rem] text-gray-800 dark:text-zinc-300">
              {advertise_sidebar_contact_description()}
            </p>
          </a>
        </div>
      </aside>
    </div>
  </div>
</section>
