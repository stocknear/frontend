<script>
  import SEO from "$lib/components/SEO.svelte";
  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  import Input from "$lib/components/Input.svelte";
  import TextArea from "$lib/components/TextArea.svelte";
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { tick } from "svelte";
  import { Turnstile } from "svelte-turnstile";

  export let data;
  export let form;

  let messageSent = false;

  let isClicked = false;
  let loading = false;
  let errorMessage = false;
  let showTurnstile = true;

  const emailAddress = "contact@stocknear.com";

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
          await update();
          toast.error("Something went wrong. Please try again...", {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          });
          break;
        case "error":
          messageSent = false;
          errorMessage = true;
          toast.error("Something went wrong. Please try again...", {
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

<SEO title="Contact us" description="" />

{#key messageSent}
  <section
    class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pt-5 px-4 lg:px-3 text-muted dark:text-white"
  >
    <div class="text-sm sm:text-[1rem] breadcrumbs">
      <ul>
        <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
        <li class="text-muted dark:text-gray-300">Contact Us</li>
      </ul>
    </div>

    <div class="w-full overflow-hidden m-auto mt-5">
      <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
        <div
          class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
        >
          <main class="w-full lg:w-3/4 lg:pr-10">
            <div class="mb-6 border-[#2C6288] dark:border-white border-b-[2px]">
              <h1 class="mb-1 text-2xl sm:text-3xl font-bold">Contact Us</h1>
            </div>

            <div class="w-full m-auto">
              <p>
                We would love to hear from you. Please submit a message using
                the contact form below and we will get back to you as soon as
                possible. You can also send an email directly to
                <a
                  href={`mailto:${emailAddress}`}
                  class="text-blue-800 dark:text-blue-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:underline"
                  >{emailAddress}</a
                >.
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
                    label="Email"
                    value={form?.data?.email}
                    required={true}
                  />
                  <Input
                    type="text"
                    id="subject"
                    label="Subject"
                    required={true}
                  />
                </div>
                <div class="mt-5 w-full max-w-[650px]">
                  <TextArea label="Message" id="message" required={true} />

                  {#if showTurnstile}
                    <div class="pt-5">
                      <Turnstile siteKey={import.meta.env.VITE_CF_TURNSTILE_SITE_KEY} />
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
                      class="mt-5 cursor-pointer py-2.5 bg-black dark:bg-[#fff] border-none sm:hover:bg-default dark:sm:hover:bg-gray-300 transition duration-100 w-full rounded text-white dark:text-black font-semibold text-[1rem]"
                    >
                      <span>Send Message</span>
                    </button>
                  {:else}
                    <label
                      class="mt-5 cursor-not-allowed btn bg-black dark:bg-[#fff] opacity-[0.5] border border-gray-600 sm:hover:bg-default dark:sm:hover:bg-gray-300 transition duration-100 btn-md w-full rounded m-auto text-white dark:text-black font-semibold text-[1rem]"
                    >
                      <div class="flex flex-row m-auto items-center">
                        <span class="loading loading-infinity"></span>
                        <span class="ml-1.5">Sending Message</span>
                      </div>
                    </label>
                  {/if}

                  {#if messageSent}
                    <div class="my-4 pt-4">
                      <div
                        class="border-l-4 border-green-400 bg-green-50 p-4 text-green-700 dark:bg-green-950 dark:text-white"
                      >
                        <div class="flex flex-row items-center">
                          <div class="shrink-0">
                            <svg
                              class="w-5 h-5 text-green-400 dark:text-green-800"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              style="max-width:40px"
                              aria-hidden="true"
                              ><path
                                fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd"
                              ></path></svg
                            >
                          </div>
                          <div class="ml-3 sm:ml-4">
                            <span class="text-base"
                              >Your message was sent successfully. We will get
                              back to you soon.</span
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

          <aside class="inline-block relative w-full lg:w-1/4 mt-3">
            <div
              class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
            >
              <a
                href="/pricing"
                class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-xl font-bold ml-3">
                    Pro Subscription
                  </h2>
                  <ArrowLogo
                    class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                  />
                </div>
                <span class=" p-3 ml-3 mr-3">
                  Upgrade now for unlimited access to all data, tools and no
                  ads.
                </span>
              </a>
            </div>

            <div
              class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
            >
              <a
                href="/stock-screener"
                class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-xl font-bold ml-3">
                    Stock Screener
                  </h2>
                  <ArrowLogo
                    class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                  />
                </div>
                <span class=" p-3 ml-3 mr-3">
                  Filter, sort and analyze all stocks to find your next
                  investment.
                </span>
              </a>
            </div>

            <div
              class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
            >
              <a
                href="/watchlist/stocks"
                class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-xl font-bold ml-3">Watchlists</h2>
                  <ArrowLogo
                    class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                  />
                </div>
                <span class=" p-3 ml-3 mr-3"
                  >Keep track of your favorite stocks in real-time.
                </span>
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </section>
{/key}
