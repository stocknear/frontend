<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import Crown from "lucide-svelte/icons/crown";
  import Link from "lucide-svelte/icons/link";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";

  import { enhance } from "$app/forms";
  import { isPWAInstalled } from "$lib/utils";
  import {
    requestNotificationPermission,
    checkSubscriptionStatus,
    unsubscribe,
    subscribeUser,
  } from "$lib/notifications";
  import { onMount } from "svelte";
  import {
    profile_seo_title,
    profile_seo_description,
    profile_breadcrumb_home,
    profile_breadcrumb_label,
    profile_page_title,
    profile_user_info_title,
    profile_user_email,
    profile_user_registered,
    profile_update_password,
    profile_discord_title,
    profile_discord_description,
    profile_discord_access_granted,
    profile_discord_premium_access,
    profile_discord_link_account,
    profile_push_title,
    profile_push_checking,
    profile_push_active,
    profile_push_disable,
    profile_push_processing,
    profile_push_description,
    profile_push_enable,
    profile_push_activating,
    profile_push_enable_settings,
    profile_push_install_required,
    profile_push_install_app,
    profile_subscription_title,
    profile_subscription_status,
    profile_subscription_active,
    profile_subscription_no_active,
    profile_subscription_current_plan,
    profile_subscription_lifetime,
    profile_subscription_free,
    profile_subscription_processing,
    profile_subscription_credits,
    profile_subscription_manage,
    profile_help_title,
    profile_help_how_to,
    profile_help_email,
    profile_help_subreddit,
    profile_help_discord,
    profile_help_discord_channel,
    profile_modal_cancel_title,
    profile_modal_cancel_description,
    profile_modal_proceed,
    profile_modal_proceeding,
    profile_modal_reactivate_title,
    profile_modal_reactivate_description,
    profile_modal_upgrade_plus_title,
    profile_modal_upgrade_plus_description,
    profile_modal_upgrade_plus_button,
    profile_modal_upgrade_pro_title,
    profile_modal_upgrade_pro_description,
    profile_modal_upgrade_pro_button,
    profile_install_title,
    profile_install_ios,
    profile_install_android,
    profile_install_ios_step1,
    profile_install_ios_step2,
    profile_install_ios_step3,
    profile_install_ios_note,
    profile_install_android_step1,
    profile_install_android_step2,
    profile_install_android_step3,
    profile_install_android_step4,
    profile_install_close,
    profile_toast_cancel_success,
    profile_toast_reactivate_success,
    profile_toast_change_plan_success,
    profile_toast_error,
    profile_toast_push_deactivated,
    profile_toast_push_deactivate_failed,
    profile_toast_push_allow,
    profile_toast_push_activated,
    profile_toast_push_activate_failed,
    profile_toast_push_error,
    profile_toast_premium_pro_only,
    profile_toast_premium_loading,
    profile_toast_premium_success,
    profile_toast_premium_error,
  } from "$lib/paraglide/messages.js";

  export let data;
  export let form;

  let pwaInstalled;
  let loading = false;

  let nottifPermGranted: boolean | null = null;
  let isPushSubscribed = data?.getPushSubscriptionData !== null ? true : false;

  let subscriptionData = data?.getSubscriptionData;
  let isClicked = false;
  let installPlatform: "ios" | "android" = "ios";
  const emailAddress = "support@stocknear.com";

  const submitCancellation = () => {
    return async ({ result, update }) => {
      switch (result.type) {
        case "success":
          toast.success(
            profile_toast_cancel_success(),
            {
              style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
            },
          );
          await update();
          break;
        case "redirect":
          toast.success(
            profile_toast_cancel_success(),
            {
              style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
            },
          );
          await update();
          break;
        case "failure":
          toast.error(profile_toast_error(), {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          });
          await update();
          break;
        case "error":
          toast.error(result.error.message, {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          });
          break;
        default:
          await update();
      }

      setTimeout(() => {
        if (result.type === "redirect") {
          const anchor = document.createElement("a");
          anchor.href = "/profile";
          anchor.dataset.sveltekitReload = true;
          document.body.appendChild(anchor);
          anchor.dispatchEvent(new MouseEvent("click"));
        }
      }, 2000);
    };
  };

  const submitReactivate = () => {
    return async ({ result, update }) => {
      switch (result.type) {
        case "success":
          toast.success(
            profile_toast_reactivate_success(),
            {
              style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
            },
          );
          await update();
          break;
        case "redirect":
          toast.success(
            profile_toast_reactivate_success(),
            {
              style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
            },
          );
          await update();
          break;
        case "failure":
          toast.error(profile_toast_error(), {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          });
          await update();
          break;
        case "error":
          toast.error(profile_toast_error(), {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          });
          break;
        default:
          await update();
      }

      setTimeout(() => {
        if (result.type) {
          const anchor = document.createElement("a");
          anchor.href = "/profile";
          anchor.dataset.sveltekitReload = true;
          document.body.appendChild(anchor);
          anchor.dispatchEvent(new MouseEvent("click"));
        }
      }, 2000);
    };
  };

  const submitChangePlan = () => {
    return async ({ result, update }) => {
      switch (result.type) {
        case "success":
          toast.success(
            profile_toast_change_plan_success(),
            {
              style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
            },
          );
          await update();
          break;
        case "redirect":
          toast.success(
            profile_toast_change_plan_success(),
            {
              style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
            },
          );
          await update();
          break;
        case "failure":
          toast.error(profile_toast_error(), {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          });
          await update();
          break;
        case "error":
          toast.error(result.error.message, {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          });
          break;
        default:
          await update();
      }

      setTimeout(() => {
        if (result.type === "redirect") {
          const anchor = document.createElement("a");
          anchor.href = "/profile";
          anchor.dataset.sveltekitReload = true;
          document.body.appendChild(anchor);
          anchor.dispatchEvent(new MouseEvent("click"));
        }
      }, 2000);
    };
  };

  onMount(async () => {
    pwaInstalled = isPWAInstalled();
    nottifPermGranted = await requestNotificationPermission();
    if (nottifPermGranted) {
      isPushSubscribed =
        ((await checkSubscriptionStatus()) &&
          data?.getPushSubscriptionData !== null) ||
        false;
    }
  });

  async function handlePushUnsubscribe() {
    loading = true;
    try {
      await unsubscribe();
      isPushSubscribed = false;
      toast.success(profile_toast_push_deactivated(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } catch (error) {
      console.error("Error unsubscribing:", error);
      toast.error(
        profile_toast_push_deactivate_failed(),
        {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        },
      );
    }
    loading = false;
  }

  async function handlePushSubscribe() {
    loading = true;

    try {
      // First check if notifications are allowed
      const permission = await requestNotificationPermission();
      if (!permission) {
        toast.error(profile_toast_push_allow(), {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
        loading = false;
        return;
      }

      // Try to subscribe with retry logic
      let output = await subscribeUser();

      // If failed, wait a bit and retry once (service worker might be initializing)
      if (!output?.success) {
        console.log("First attempt failed, retrying in 2 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        output = await subscribeUser();
      }

      if (output?.success === true) {
        isPushSubscribed = true;
        toast.success(profile_toast_push_activated(), {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
      } else {
        toast.error(
          profile_toast_push_activate_failed(),
          {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          },
        );
      }
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      toast.error(profile_toast_push_error(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    }

    loading = false;
  }

  async function handlePremiumAccess() {
    // build the promise that does the work
    if (data?.user?.tier !== "Pro") {
      toast?.error(profile_toast_premium_pro_only(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }
    const premiumPromise = fetch("/api/discord-assign-role", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => {
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return res.json();
    });

    // show toast while promise is pending
    toast.promise(
      premiumPromise,
      {
        loading: profile_toast_premium_loading(),
        success: () => {
          data.user.discord = { access: true };
          return profile_toast_premium_success();
        },
        error: profile_toast_premium_error(),
      },
      {
        style: {
          borderRadius: "5px",
          background: "#fff",
          color: "#000",
          borderColor: $mode === "light" ? "#F9FAFB" : "#4B5563",
          fontSize: "15px",
        },
      },
    );

    // optional: wait for the result if you need to do something with it
    const output = await premiumPromise;
    // you can use `output` here if needed
  }
</script>

<SEO
  title={profile_seo_title()}
  description={profile_seo_description()}
/>

<section
  class="text-gray-700 dark:text-zinc-200 w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3"
>
  <BreadCrumb
    containerClass="text-sm sm:text-[1rem] breadcrumbs text-gray-500 dark:text-zinc-400"
  >
    <li>
      <a
        href="/"
        class="text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
      >
        {profile_breadcrumb_home()}
      </a>
    </li>
    <li class="text-gray-500 dark:text-zinc-400">{profile_breadcrumb_label()}</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full lg:w-3/4 lg:mr-auto">
          <div class="mb-6 border-b border-gray-300 dark:border-zinc-700 pb-2">
            <h1
              class="mb-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {profile_page_title()}
            </h1>
          </div>

          <div
            class="rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 p-4 xs:p-4"
          >
            <h2
              class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-3"
            >
              {profile_user_info_title()}
            </h2>
            <div class="mt-1 text-sm text-gray-800 dark:text-zinc-300">
              <strong>{profile_user_email()}</strong>
              {data?.user?.email}
            </div>
            <div class="mt-1 mb-5 text-sm text-gray-800 dark:text-zinc-300">
              <strong>{profile_user_registered()}</strong>
              {new Date(data?.user?.created ?? null)?.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <a
              href="/update-password"
              class="cursor-pointer border border-gray-300 dark:border-zinc-700 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-zinc-200 text-sm px-4 py-2 rounded-full mt-5 transition"
              >{profile_update_password()}</a
            >
          </div>

          <div
            class="mt-6 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 p-4 pb-4"
          >
            <h2
              class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-3"
            >
              {profile_discord_title()}
            </h2>
            <p class="text-sm text-gray-800 dark:text-zinc-300 leading-relaxed">
              {profile_discord_description()}
            </p>

            <div class="mt-2">
              {#if data?.getDiscordAccount}
                {#if data?.user?.discord?.access}
                  <button
                    class="flex flex-row items-center w-fit border border-gray-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 text-gray-900 dark:text-white text-sm px-4 py-2 rounded-full mt-5"
                  >
                    {profile_discord_access_granted()}
                  </button>
                {:else}
                  <button
                    on:click={handlePremiumAccess}
                    class="flex flex-row items-center w-fit cursor-pointer border border-gray-300 dark:border-zinc-700 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-zinc-200 text-sm px-4 py-2 rounded-full mt-5 transition"
                  >
                    <Crown class="w-4 h-4 inline-block mr-1.5" />
                    {profile_discord_premium_access()}
                  </button>
                {/if}
              {:else}
                <form method="post" action="?/oauth2">
                  <input class="hidden" name="provider" value="discord" />
                  <button
                    aria-label="Discord Login"
                    class="flex flex-row items-center w-fit cursor-pointer border border-gray-300 dark:border-zinc-700 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-zinc-200 text-sm px-4 py-2 rounded-full mt-5 transition"
                  >
                    <Link class="w-4 h-4 inline-block mr-1.5" />
                    {profile_discord_link_account()}
                  </button>
                </form>
              {/if}
            </div>
          </div>

          <div
            class="mt-6 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 p-4 pb-6"
          >
            <h3
              class="text-xl font-semibold tracking-tight text-gray-900 dark:text-white mb-2"
            >
              {profile_push_title()}
            </h3>
            {#if pwaInstalled}
              <div class="mt-3">
                {#if nottifPermGranted === null}
                  <p class="text-sm text-gray-800 dark:text-zinc-300">
                    {profile_push_checking()}
                  </p>
                {:else if nottifPermGranted === true}
                  {#if isPushSubscribed}
                    <p class="mb-3 text-sm text-gray-800 dark:text-zinc-300">
                      {profile_push_active()}
                    </p>
                    <div class="mt-3">
                      {#if !loading}
                        <button
                          class="border border-gray-300 dark:border-zinc-700 w-fit px-5 py-2 bg-white/90 dark:bg-zinc-950/70 text-gray-900 dark:text-white text-sm font-semibold rounded-full hover:bg-white/80 dark:hover:bg-zinc-900/70 transition"
                          type="button"
                          on:click={handlePushUnsubscribe}
                          >{profile_push_disable()}</button
                        >
                      {:else}
                        <button
                          class="cursor-not-allowed border border-gray-300 dark:border-zinc-700 w-fit px-5 py-2 bg-white/60 dark:bg-zinc-950/50 text-gray-500 dark:text-zinc-400 text-sm font-semibold rounded-full transition"
                          disabled
                        >
                          <div class="flex flex-row m-auto items-center">
                            <svg
                              class="mr-2 w-4 h-4 animate-spin"
                              viewBox="0 0 20 20"
                            >
                              <circle
                                cx="10"
                                cy="10"
                                r="8"
                                stroke="currentColor"
                                stroke-width="2"
                                fill="none"
                                stroke-linecap="round"
                                stroke-dasharray="25.132741228718345"
                                stroke-dashoffset="25.132741228718345"
                              >
                                <animateTransform
                                  attributeName="transform"
                                  type="rotate"
                                  from="0 10 10"
                                  to="360 10 10"
                                  dur="1s"
                                  repeatCount="indefinite"
                                />
                              </circle>
                            </svg>
                            {profile_push_processing()}
                          </div>
                        </button>
                      {/if}
                    </div>
                  {:else}
                    <p class="mb-3 text-sm text-gray-800 dark:text-zinc-300">
                      {profile_push_description()}
                    </p>
                    {#if !loading}
                      <button
                        class="border border-gray-300 dark:border-zinc-700 w-fit px-5 py-2 bg-white/90 dark:bg-zinc-950/70 text-gray-900 dark:text-white text-sm font-semibold rounded-full hover:bg-white/80 dark:hover:bg-zinc-900/70 transition"
                        type="button"
                        on:click={handlePushSubscribe}
                        >{profile_push_enable()}</button
                      >
                    {:else}
                      <button
                        class="cursor-not-allowed border border-gray-300 dark:border-zinc-700 w-fit px-5 py-2 bg-white/60 dark:bg-zinc-950/50 text-gray-500 dark:text-zinc-400 text-sm font-semibold rounded-full transition"
                        ><div class="flex flex-row m-auto items-center">
                          <span class="loading loading-infinity"></span>
                          <span class=" ml-1.5">{profile_push_activating()}</span>
                        </div></button
                      >
                    {/if}
                  {/if}
                {:else if nottifPermGranted === false}
                  <p class="text-sm text-gray-800 dark:text-zinc-300">
                    {profile_push_enable_settings()}
                  </p>
                {/if}
              </div>
            {:else}
              <div class="mt-2">
                <p class="mb-5 text-sm text-gray-800 dark:text-zinc-300">
                  {profile_push_install_required()}
                </p>
                <label
                  for="installModal"
                  class="cursor-pointer border border-gray-300 dark:border-zinc-700 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-zinc-200 text-sm px-4 py-2 rounded-full mt-5 transition"
                >
                  {profile_push_install_app()}
                </label>
              </div>
            {/if}
          </div>

          <div
            class="mt-6 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 p-4 xs:p-4"
          >
            <h2
              class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-3"
            >
              {profile_subscription_title()}
            </h2>
            <div class="flex flex-row items-center">
              <span
                class="text-sm sm:text-[1rem] text-gray-800 dark:text-zinc-300"
              >
                {profile_subscription_status()}
              </span>
              <div class="ml-2 flex flex-row items-center">
                <span class="relative flex h-2 w-2">
                  <span
                    class="animate-ping absolute inline-flex h-full w-full rounded-full {subscriptionData?.status_formatted ===
                      'Active' ||
                    subscriptionData?.status_formatted === 'Paid' ||
                    subscriptionData?.status_formatted === 'On Trial'
                      ? 'bg-[#00FC50]'
                      : 'bg-[#FF3131]'} opacity-75"
                  ></span>
                  <span
                    class="relative inline-flex rounded-full h-2 w-2 {data?.user
                      ?.lifetime ||
                    subscriptionData?.status_formatted === 'Active' ||
                    subscriptionData?.status_formatted === 'Paid' ||
                    subscriptionData?.status_formatted === 'On Trial'
                      ? 'bg-[#00FC50]'
                      : 'bg-[#FF3131]'}"
                  ></span>
                </span>

                <span class="ml-2 text-sm text-gray-700 dark:text-zinc-200">
                  {#if data?.user?.lifetime === true}
                    {profile_subscription_active()}
                  {:else}
                    {subscriptionData?.status_formatted ??
                      profile_subscription_no_active()}
                  {/if}
                </span>
              </div>
            </div>
            {#if !data?.user?.lifetime}
              {#if subscriptionData?.status_formatted === "Active"}
                <span class="text-sm text-gray-800 dark:text-zinc-300 pr-5">
                  Your subscription will automatically renew on {new Date(
                    subscriptionData?.renews_at,
                  )?.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              {:else if subscriptionData?.status_formatted === "On Trial"}
                <span class="text-sm text-gray-800 dark:text-zinc-300 pr-5">
                  Your subscription will automatically billed on {new Date(
                    subscriptionData?.trial_ends_at,
                  )?.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </span>
              {:else if subscriptionData?.status_formatted === "Cancelled"}
                <span class="text-sm text-gray-800 dark:text-zinc-300">
                  Your subscription will remain active until {new Date(
                    subscriptionData?.ends_at,
                  )?.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              {/if}
            {/if}

            <div class="flex flex-col justify-start items-start mt-4 mb-3">
              <span class="mr-2 text-sm text-gray-800 dark:text-zinc-300">
                {profile_subscription_current_plan()}
              </span>
              <span class="text-sm text-gray-700 dark:text-zinc-200">
                {#if data?.user?.lifetime}
                  {profile_subscription_lifetime()}
                {:else}
                  {["Active", "Paid", "Cancelled", "On Trial"]?.includes(
                    subscriptionData?.status_formatted,
                  )
                    ? subscriptionData?.product_name ||
                      subscriptionData?.first_order_item?.product_name ||
                      profile_subscription_processing()
                    : profile_subscription_free()}
                {/if}
              </span>
            </div>

            <div class="flex flex-col justify-start items-start mb-3">
              <span class="mr-2 text-sm text-gray-800 dark:text-zinc-300">
                {profile_subscription_credits({ credits: data?.user?.credits?.toLocaleString("en-US") ?? "0" })}
              </span>
            </div>

            {#if ["Plus", "Pro"].includes(data?.user?.tier)}
              <div class="mx-auto w-full mt-6 mb-2">
                <div class="flex items-center mt-3">
                  <p class="text-sm text-gray-800 dark:text-zinc-300">
                    <a
                      href="https://app.lemonsqueezy.com/my-orders"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="cursor-pointer border border-gray-300 dark:border-zinc-700 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-zinc-200 text-sm px-4 py-2 rounded-full mt-5 transition"
                      >{profile_subscription_manage()}</a
                    >
                  </p>
                </div>
              </div>
            {/if}
            <!--
            {#if !data?.user?.lifetime}
              {#if subscriptionData?.status_formatted === "Active"}
                <div
                  class="flex flex-col items-start sm:flex-row sm:items-center"
                >
                  <label
                    for="cancelSubscriptionModal"
                    class="cursor-pointer border border-gray-300 dark:border-gray-300 dark:border-gray-600 transition-all text-white bg-default sm:hover:bg-primary dark:bg-default dark:sm:hover:bg-primary text-sm sm:text-[1rem] px-4 py-2 rounded"
                  >
                    Cancel Subscription
                  </label>
                  {#if subscriptionData?.product_name === "Plus Subscription (Monthly)"}
                    <label
                      for="changeSubscriptionPlusAnnualModal"
                      class="mt-3 sm:mt-0 sm:ml-3 cursor-pointer border border-gray-300 dark:border-gray-300 dark:border-gray-600 dark:bg-default transition-all text-white bg-default sm:hover:bg-primary dark:sm:hover:bg-primary text-sm sm:text-[1rem] px-4 py-2 rounded"
                    >
                      Upgrade to Plus (Annual Plan)
                    </label>
                  {:else if subscriptionData?.product_name === "Plus Subscription (Annually)" || subscriptionData?.product_name === "Pro Subscription (Monthly)"}
                    <label
                      for="changeSubscriptionProAnnualModal"
                      class="mt-3 sm:mt-0 sm:ml-3 cursor-pointer border border-gray-300 dark:border-gray-300 dark:border-gray-600 dark:bg-default transition-all text-white bg-default sm:hover:bg-primary dark:sm:hover:bg-primary text-sm sm:text-[1rem] px-4 py-2 rounded"
                    >
                      Upgrade to Pro (Annual Plan)
                    </label>
                  {/if}
                </div>
              {:else if subscriptionData?.status_formatted === "On Trial"}
                <div
                  class="flex flex-col items-start sm:flex-row sm:items-center"
                >
                  <label
                    for="cancelSubscriptionModal"
                    class="cursor-pointer border border-gray-300 dark:border-gray-300 dark:border-gray-600 transition-all text-white bg-default sm:hover:bg-primary dark:bg-default dark:sm:hover:bg-primary text-sm sm:text-[1rem] px-4 py-2 rounded"
                  >
                    Cancel Subscription
                  </label>
                </div>
              {:else if subscriptionData?.status_formatted === "Cancelled"}
                <label
                  for="reactivateSubscriptionModal"
                  class="cursor-pointer border border-gray-300 dark:border-gray-300 dark:border-gray-600 transition-all text-white bg-default sm:hover:bg-primary dark:bg-default dark:sm:hover:bg-primary text-sm sm:text-[1rem] px-4 py-2 rounded mt-5"
                >
                  Reactivate Subscription
                </label>
              {:else if subscriptionData?.status_formatted === "Paid" && !subscriptionData?.first_order_item?.product_name === "Pro Subscription (Life Time Access)"}
                <span class=" mt-5">
                  Please wait a moment; you will be updated to Pro in a second.
                </span>
              {:else}
                <a
                  href="/pricing"
                  class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400"
                >
                  Get Full Access with our Subscription.
                </a>
              {/if}
            {/if}
            -->
          </div>

          <div
            class="mt-6 rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 p-4 xs:p-4"
          >
            <h2
              class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-3"
            >
              {profile_help_title()}
            </h2>
            <div class="mt-1 text-sm text-gray-800 dark:text-zinc-300">
              <strong>{profile_help_how_to()}</strong>
            </div>
            <div class="mt-2 mb-1 text-sm text-gray-800 dark:text-zinc-300">
              <ul class="list-disc pl-5">
                <li>
                  {profile_help_email()} <a
                    href={`mailto:${emailAddress}`}
                    class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                    >{emailAddress}</a
                  >
                </li>
                <li>
                  {profile_help_subreddit()}
                  <a
                    rel="noopener noreferrer"
                    target="_blank"
                    href="https://www.reddit.com/r/stocknear/"
                    class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                  >
                    r/stocknear</a
                  >.
                </li>
                <li>
                  {profile_help_discord()} <a
                    rel="noopener noreferrer"
                    target="_blank"
                    href="https://discord.com/invite/hCwZMMZ2MT"
                    class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 transition"
                    >{profile_help_discord_channel()}</a
                  >.
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</section>

<!-- Start Cancel Subscription Modal -->
<input type="checkbox" id="cancelSubscriptionModal" class="modal-toggle" />

<dialog id="cancelSubscriptionModal" class="modal overflow-hidden p-3 sm:p-0">
  <label for="cancelSubscriptionModal" class="cursor-pointer modal-backdrop"
  ></label>
  <label for="cancelSubscriptionModal" class="cursor-pointer modal-backdrop"
  ></label>

  <!-- Desktop modal content -->
  <form
    method="POST"
    action="?/cancelSubscription"
    use:enhance={submitCancellation}
    class="modal-box w-full rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 text-gray-700 dark:text-zinc-200 flex flex-col items-center"
  >
    <div class=" mb-5 text-center">
      <h3
        class="font-semibold tracking-tight text-2xl text-gray-900 dark:text-white mb-5"
      >
        {profile_modal_cancel_title()}
      </h3>
      <span class="text-sm text-gray-800 dark:text-zinc-300 font-normal">
        {profile_modal_cancel_description()}
      </span>
    </div>

    <button
      on:click={() => (isClicked = !isClicked)}
      class="{!isClicked
        ? ''
        : 'hidden'} cursor-pointer px-7 py-2 mb-5 rounded-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-zinc-200 ease-out duration-150 text-center text-white dark:text-gray-900 text-[1rem] font-normal transition"
    >
      {profile_modal_proceed()}
      <input
        class="hidden"
        name="subscriptionId"
        value={subscriptionData?.first_subscription_item?.subscription_id}
      />
    </button>
    {#if isClicked === true}
      <label
        class="cursor-pointer px-7 py-2 mb-5 rounded-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-zinc-200 ease-out duration-150 text-center text-white dark:text-gray-900 text-[1rem] font-normal transition"
      >
        <div class="flex flex-row m-auto">
          <span class="loading loading-infinity"></span>
          <span class="text-white dark:text-gray-900 ml-2">{profile_modal_proceeding()}</span>
        </div>
      </label>
    {/if}
  </form>
</dialog>
<!-- End Cancel Subscription Modal -->

<!-- Start Reactivate Subscription Modal -->
<input type="checkbox" id="reactivateSubscriptionModal" class="modal-toggle" />
<dialog
  id="reactivateSubscriptionModal"
  class="modal overflow-hidden p-3 sm:p-0"
>
  <label for="reactivateSubscriptionModal" class="cursor-pointer modal-backdrop"
  ></label>
  <label for="reactivateSubscriptionModal" class="cursor-pointer modal-backdrop"
  ></label>

  <!-- Desktop modal content -->
  <form
    method="POST"
    action="?/reactivateSubscription"
    use:enhance={submitReactivate}
    class="modal-box w-full rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 text-gray-700 dark:text-zinc-200 flex flex-col items-center"
  >
    <div class=" mb-5 text-center">
      <h3
        class="font-semibold tracking-tight text-2xl text-gray-900 dark:text-white mb-5"
      >
        {profile_modal_reactivate_title()}
      </h3>
      <span class="text-sm text-gray-800 dark:text-zinc-300 font-normal">
        {profile_modal_reactivate_description()}
      </span>
    </div>

    <button
      on:click={() => (isClicked = !isClicked)}
      class="{!isClicked
        ? ''
        : 'hidden'} cursor-pointer px-7 py-2 mb-5 rounded-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-zinc-200 ease-out duration-150 text-center text-white dark:text-gray-900 text-[1rem] font-normal transition"
    >
      {profile_modal_proceed()}
      <input
        class="hidden"
        name="subscriptionId"
        value={subscriptionData?.first_subscription_item?.subscription_id}
      />
    </button>
    {#if isClicked === true}
      <label
        class="cursor-pointer px-7 py-2 mb-5 rounded-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-zinc-200 ease-out duration-150 text-center text-white dark:text-gray-900 text-[1rem] font-normal transition"
      >
        <div class="flex flex-row m-auto">
          <span class="loading loading-infinity"></span>
          <span class="text-white dark:text-gray-900 ml-2">{profile_modal_proceeding()}</span>
        </div>
      </label>
    {/if}
  </form>
</dialog>
<!-- End Reactivate Subscription Modal -->

<!-- End Cancel Subscription Modal -->

<!--Change Plan to Plus Annual -->
<input
  type="checkbox"
  id="changeSubscriptionPlusAnnualModal"
  class="modal-toggle"
/>
<dialog
  id="changeSubscriptionPlusAnnualModal"
  class="modal overflow-hidden p-3 sm:p-0"
>
  <label
    for="changeSubscriptionPlusAnnualModal"
    class="cursor-pointer modal-backdrop"
  ></label>

  <!-- Desktop modal content -->
  <form
    method="POST"
    action="?/changeSubscription"
    use:enhance={submitChangePlan}
    class="modal-box w-full rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 text-gray-700 dark:text-zinc-200 flex flex-col items-center"
  >
    <div class=" mb-5 text-center">
      <h3
        class="font-semibold tracking-tight text-2xl text-gray-900 dark:text-white mb-5"
      >
        {profile_modal_upgrade_plus_title()}
      </h3>
      <span class="text-sm text-gray-800 dark:text-zinc-300 font-normal">
        {profile_modal_upgrade_plus_description()}
      </span>
    </div>

    <button
      on:click={() => (isClicked = !isClicked)}
      class="{!isClicked
        ? ''
        : 'hidden'} cursor-pointer px-7 py-2 mb-5 rounded-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-zinc-200 ease-out duration-150 text-center text-white dark:text-gray-900 text-[1rem] font-normal transition"
    >
      {profile_modal_upgrade_plus_button()}
      <input
        class="hidden"
        name="subscriptionId"
        value={subscriptionData?.first_subscription_item?.subscription_id}
      />
      <input class="hidden" name="newPlan" value={"plusAnnual"} />
    </button>
    {#if isClicked === true}
      <label
        class="cursor-pointer px-7 py-2 mb-5 rounded-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-zinc-200 ease-out duration-150 text-center text-white dark:text-gray-900 text-[1rem] font-normal transition"
      >
        <div class="flex flex-row m-auto">
          <span class="loading loading-infinity"></span>
          <span class="text-white dark:text-gray-900 ml-2">{profile_modal_proceeding()}</span>
        </div>
      </label>
    {/if}
  </form>
</dialog>

<!--Change Plan to Pro Annual-->
<input
  type="checkbox"
  id="changeSubscriptionProAnnualModal"
  class="modal-toggle"
/>
<dialog
  id="changeSubscriptionProAnnualModal"
  class="modal overflow-hidden p-3 sm:p-0"
>
  <label
    for="changeSubscriptionProAnnualModal"
    class="cursor-pointer modal-backdrop"
  ></label>

  <!-- Desktop modal content -->
  <form
    method="POST"
    action="?/changeSubscription"
    use:enhance={submitChangePlan}
    class="modal-box w-full rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 text-gray-700 dark:text-zinc-200 flex flex-col items-center"
  >
    <div class=" mb-5 text-center">
      <h3
        class="font-semibold tracking-tight text-2xl text-gray-900 dark:text-white mb-5"
      >
        {profile_modal_upgrade_pro_title()}
      </h3>
      <span class="text-sm text-gray-800 dark:text-zinc-300 font-normal">
        {profile_modal_upgrade_pro_description()}
      </span>
    </div>

    <button
      on:click={() => (isClicked = !isClicked)}
      class="{!isClicked
        ? ''
        : 'hidden'} cursor-pointer px-7 py-2 mb-5 rounded-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-zinc-200 ease-out duration-150 text-center text-white dark:text-gray-900 text-[1rem] font-normal transition"
    >
      {profile_modal_upgrade_pro_button()}
      <input
        class="hidden"
        name="subscriptionId"
        value={subscriptionData?.first_subscription_item?.subscription_id}
      />
      <input class="hidden" name="newPlan" value={"proAnnual"} />
    </button>
    {#if isClicked === true}
      <label
        class="cursor-pointer px-7 py-2 mb-5 rounded-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-zinc-200 ease-out duration-150 text-center text-white dark:text-gray-900 text-[1rem] font-normal transition"
      >
        <div class="flex flex-row m-auto">
          <span class="loading loading-infinity"></span>
          <span class="text-white dark:text-gray-900 ml-2">{profile_modal_proceeding()}</span>
        </div>
      </label>
    {/if}
  </form>
</dialog>

<!--Start Create Watchlist Modal-->
<input type="checkbox" id="installModal" class="modal-toggle" />

<dialog id="installModal" class="modal overflow-hidden p-3 sm:p-0">
  <label for="installModal" class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box rounded-2xl w-full border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 text-gray-700 dark:text-zinc-200"
  >
    <div class="flex flex-row items-center pt-5">
      <h4
        class="mb-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white text-center m-auto"
      >
        {profile_install_title()}
      </h4>
      <label
        for="installModal"
        class="inline-block cursor-pointer absolute right-3 top-3 text-[1.3rem] sm:text-[1.8rem]"
      >
        <svg
          class="w-6 h-6 sm:w-8 sm:h-8"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          ><path
            fill="currentColor"
            d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
          /></svg
        >
      </label>
    </div>

    <div class="flex flex-col justify-center items-center text-xl h-full">
      <div
        class="w-fit text-sm flex items-center gap-1 rounded-full border border-gray-300 dark:border-zinc-700"
      >
        <button
          type="button"
          on:click={() => (installPlatform = "ios")}
          class="cursor-pointer font-medium rounded-full px-3 py-1.5 focus:z-10 focus:outline-none transition-all {installPlatform ===
          'ios'
            ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}"
        >
          {profile_install_ios()}
        </button>
        <button
          type="button"
          on:click={() => (installPlatform = "android")}
          class="cursor-pointer font-medium rounded-full px-3 py-1.5 focus:z-10 focus:outline-none transition-all {installPlatform ===
          'android'
            ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}"
        >
          {profile_install_android()}
        </button>
      </div>

      {#if installPlatform === "ios"}
        <ul
          class="list-decimal list-inside text-left mt-5 text-sm text-gray-800 dark:text-zinc-300"
        >
          <li class="mb-2">{profile_install_ios_step1()}</li>
          <li class="mb-2">{profile_install_ios_step2()}</li>
          <li class="mb-4">{profile_install_ios_step3()}</li>
          <p class="text-sm mb-4 text-gray-800 dark:text-zinc-300">
            {profile_install_ios_note()}
          </p>
        </ul>
      {:else}
        <ul
          class="list-decimal list-inside text-left mt-5 text-sm text-gray-800 dark:text-zinc-300"
        >
          <li class="mb-2">{profile_install_android_step1()}</li>
          <li class="mb-2">{profile_install_android_step2()}</li>
          <li class="mb-2">{profile_install_android_step3()}</li>
          <li class="mb-4">{profile_install_android_step4()}</li>
        </ul>
      {/if}
    </div>

    <div class="border-t border-gray-300 dark:border-zinc-700 mt-2">
      <label
        for="installModal"
        class="mt-4 font-semibold text-lg text-gray-900 dark:text-white m-auto flex justify-center cursor-pointer"
      >
        {profile_install_close()}
      </label>
    </div>
  </div>
</dialog>
