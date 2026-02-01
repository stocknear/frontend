<script>
  import SEO from "$lib/components/SEO.svelte";

  import Input from "$lib/components/Input.svelte";
  import TextArea from "$lib/components/TextArea.svelte";
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { tick } from "svelte";
  import { Turnstile } from "svelte-turnstile";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import {
  support_breadcrumb_current,
  support_breadcrumb_home,
  support_button_processing,
  support_button_send,
  support_description_1,
  support_description_2,
  support_description_3,
  support_faq_link,
  support_label_email,
  support_label_message,
  support_label_subject,
  support_seo_title,
  support_sidebar_pro_description,
  support_sidebar_pro_title,
  support_sidebar_screener_description,
  support_sidebar_screener_title,
  support_sidebar_watchlist_description,
  support_sidebar_watchlist_title,
  support_success_message,
  support_title,
  support_toast_error,
} from "$lib/paraglide/messages";

  export let data;
  export let form;

  let messageSent = false;

  let isClicked = false;
  let loading = false;
  let errorMessage = false;
  let showTurnstile = true;

  const emailAddress = "support@stocknear.com";

  const resetTurnstile = async () => {
    showTurnstile = false;
    await tick();
    showTurnstile = true;
  };

  const submitMessage = () => {
    loading = true;
    isClicked = true;

    return async ({ result, update }) => {
      switch (result.type) {
        case "success":
        case "redirect":
          messageSent = true;
          errorMessage = false;
          await update();
          break;
        case "failure":
          messageSent = false;
          errorMessage = true;
          toast.error(support_toast_error(), {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          });
          await update();
          break;
        case "error":
          messageSent = false;
          errorMessage = true;
          toast.error(support_toast_error(), {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          });
          break;
        default:
          await update();
      }
      loading = false;
      isClicked = false;
      await resetTurnstile();
    };
  };
</script>

<SEO title={support_seo_title()} description="" />

{#key messageSent}
  <section
    class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
  >
    <BreadCrumb
      containerClass="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300"
    >
      <li>
        <a
          href="/"
          class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >{support_breadcrumb_home()}</a
        >
      </li>
      <li class="text-gray-800 dark:text-zinc-300">{support_breadcrumb_current()}</li>
    </BreadCrumb>

    <div class="w-full overflow-hidden m-auto mt-5">
      <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
        <div
          class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
        >
          <main class="w-full lg:w-3/4 lg:pr-10">
            <div class="mb-6 border-b border-gray-300 dark:border-zinc-700">
              <h1
                class="mb-2 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                {support_title()}
              </h1>
            </div>

            <div class="w-full m-auto">
              <p class="text-sm sm:text-base">
                {support_description_1()} <a
                  href={`mailto:${emailAddress}`}
                  class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                  >{emailAddress}</a
                >.
              </p>
              <br />
              <p class="text-sm sm:text-base">
                {support_description_2()} <a
                  href="/faq"
                  class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                  >{support_faq_link()}</a
                >.
              </p>
              <br />
              <p class="text-sm sm:text-base">
                {support_description_3()}
              </p>

              <form
                action="?/support"
                method="POST"
                use:enhance={submitMessage}
              >
                <div class="mt-10 w-full max-w-[500px]">
                  <Input
                    type="email"
                    id="email"
                    label={support_label_email()}
                    value={form?.data?.email}
                    required={true}
                  />
                  <Input
                    type="text"
                    id="subject"
                    label={support_label_subject()}
                    required={true}
                  />
                </div>
                <div class="mt-5 w-full max-w-[650px]">
                  <TextArea label={support_label_message()} id="message" required={true} />

                  {#if showTurnstile}
                    <div class="pt-5">
                      <Turnstile
                        siteKey={import.meta.env.VITE_CF_TURNSTILE_SITE_KEY}
                      />
                    </div>
                  {/if}
                  {#if form?.errors?.turnstile}
                    <p class="text-sm text-error pt-2">
                      {form.errors.turnstile[0]}
                    </p>
                  {/if}

                  {#if !loading && !isClicked}
                    <button
                      type="submit"
                      class="mt-5 cursor-pointer py-2.5 px-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-none hover:bg-gray-800 dark:hover:bg-gray-200 transition w-full rounded-full font-semibold text-[1rem]"
                    >
                      <span>{support_button_send()}</span>
                    </button>
                  {:else}
                    <label
                      class="mt-5 cursor-not-allowed py-2.5 px-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-none opacity-80 transition w-full rounded-full font-semibold text-[1rem] flex justify-center"
                    >
                      <div class="flex flex-row m-auto items-center">
                        <span class="loading loading-spinner"></span>
                        <span class="ml-1.5">{support_button_processing()}</span>
                      </div>
                    </label>
                  {/if}

                  {#if messageSent}
                    <div class="my-4 pt-4">
                      <div
                        class="rounded-lg border border-green-200/70 bg-green-50/70 p-4 text-green-700 dark:border-green-900/60 dark:bg-green-950/60 dark:text-green-100"
                      >
                        <div class="flex flex-row items-center">
                          <div class="shrink-0">
                            <svg
                              class="w-5 h-5 text-green-400 dark:text-green-600"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              style="max-width:40px"
                              aria-hidden="true"
                              ><path
                                fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd"
                              ></path></svg>

                          </div>
                          <div class="ml-3 sm:ml-4">
                            <span class="text-base"
                              >{support_success_message()}</span
                            >
                          </div>
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>
              </form>
            </div>
          </main>

          <aside class="inline-block relative w-full lg:w-1/4 mt-4">
            <div
              class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
            >
              <a
                href="/pricing"
                class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-lg font-semibold ml-3">
                    {support_sidebar_pro_title()}
                  </h2>
                </div>
                <span
                  class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
                >
                  {support_sidebar_pro_description()}
                </span>
              </a>
            </div>

            <div
              class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
            >
              <a
                href="/stock-screener"
                class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-lg font-semibold ml-3">
                    {support_sidebar_screener_title()}
                  </h2>
                </div>
                <span
                  class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
                >
                  {support_sidebar_screener_description()}
                </span>
              </a>
            </div>

            <div
              class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
            >
              <a
                href="/watchlist/stocks"
                class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-lg font-semibold ml-3">
                    {support_sidebar_watchlist_title()}
                  </h2>
                </div>
                <span
                  class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
                  >{support_sidebar_watchlist_description()}
                </span>
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </section>
{/key}
