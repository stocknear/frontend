<script lang="ts">
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { page } from "$app/stores";
  import { Turnstile } from "svelte-turnstile";

  import Question from "lucide-svelte/icons/message-circle-question";

  export let data;

  let description = "";
  let email = "";
  let pageUrl = "";
  let isSubmitting = false;
  let turnstileToken = "";
  let turnstileReset: (() => void) | undefined;

  $: {
    if (typeof window !== "undefined" && $page?.url) {
      pageUrl = window.location.href;
    }
  }

  $: {
    if (data?.user?.id && data.user.email) {
      email = data.user.email.trim();
    }
  }

  const resetTurnstile = () => {
    turnstileToken = "";
    turnstileReset?.();
  };

  const handleTurnstileCallback = (event: CustomEvent<{ token: string }>) => {
    turnstileToken = event?.detail?.token ?? "";
  };

  const handleTurnstileFailure = () => {
    resetTurnstile();
  };

  async function sendFeedback() {
    if (isSubmitting) return;

    if (!description.trim()) {
      toast.error("Please describe your issue or suggestion.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${
          $mode === "light" ? "#F9FAFB" : "#4B5563"
        }; font-size: 15px;`,
      });
      return;
    }

    if (!data?.user?.id && !email.trim()) {
      toast.error("Please provide your email address.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${
          $mode === "light" ? "#F9FAFB" : "#4B5563"
        }; font-size: 15px;`,
      });
      return;
    }

    if (!turnstileToken) {
      toast.error("Please confirm you are not a robot.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${
          $mode === "light" ? "#F9FAFB" : "#4B5563"
        }; font-size: 15px;`,
      });
      return;
    }

    isSubmitting = true;

    const fallbackUrl =
      (typeof window !== "undefined" && window?.location?.href) ||
      $page?.url?.href ||
      "";
    const fieldValue = pageUrl || fallbackUrl;

    const userId = data?.user?.id ?? "";
    const postData = {
      user: userId || undefined,
      description: description.trim(),
      email: email?.trim() || undefined,
      field: fieldValue,
      token: turnstileToken,
    };

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          result?.error ??
          "Something went wrong sending feedback. Please try again.";
        throw new Error(message);
      }

      const closeEl = document.getElementById("feedbackModal");
      closeEl?.dispatchEvent(new MouseEvent("click"));

      toast.success("Thanks! Your feedback was sent.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${
          $mode === "light" ? "#F9FAFB" : "#4B5563"
        }; font-size: 15px;`,
      });

      description = "";
      if (!data?.user?.id) {
        email = "";
      }
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "Something went wrong sending feedback.";
      toast.error(message, {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${
          $mode === "light" ? "#F9FAFB" : "#4B5563"
        }; font-size: 15px;`,
      });
    } finally {
      isSubmitting = false;
      resetTurnstile();
    }
  }
</script>

<svelte:head>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
  />
</svelte:head>

<!-- Floating trigger (bottom-right), like your existing one -->
<div class="fixed z-[100] bottom-8 sm:bottom-10 right-8 sm:right-16">
  <label
    for="feedbackModal"
    aria-label="Give Feedback"
    class="flex fixed bottom-8 right-8 items-center gap-2 px-3 py-3 sm:px-4 sm:py-3 rounded-full bg-black dark:bg-white sm:hover:bg-default dark:hover:bg-gray-100 shadow hover:shadow-xl cursor-pointer pointer-events-auto text-white dark:text-black transition-all duration-50"
    style="position: fixed !important; z-index: 99999 !important;"
  >
    <Question class="size-5 text-white dark:text-black" />
    <span
      class="text-white dark:text-black hidden sm:inline text-md font-semibold"
      >Give feedback</span
    >
  </label>
</div>

<!-- Toggle for modal -->
<input type="checkbox" id="feedbackModal" class="modal-toggle" />

<!-- Modal -->
<dialog
  id="feedbackModal"
  class="modal overflow-hidden p-3 sm:p-0 bg-[#000]/30 text-muted dark:text-white"
>
  <label for="feedbackModal" class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box w-full max-w-4xl rounded bg-white dark:bg-secondary border border-gray-300 dark:border-gray-600"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Give feedback</h1>
      <label
        for="feedbackModal"
        class="inline-block cursor-pointer text-[1.6rem]"
        aria-label="Close"
      >
        <svg
          class="w-8 h-8"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
          />
        </svg>
      </label>
    </div>

    <!-- Body -->
    <div class="mt-6 space-y-6">
      <!-- Describe your issue or suggestion -->
      <div class="space-y-2">
        <label class="block text-base font-semibold"
          >Describe your issue or suggestion:</label
        >
        <textarea
          class="textarea w-full h-48 max-h-[600px] resize-vertical bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-800 focus:outline-none placeholder-gray-500 rounded-md"
          placeholder=""
          bind:value={description}
        />
      </div>

      {#if !data?.user?.id}
        <div class="space-y-2">
          <label class="block text-base font-semibold"
            >Your email address:</label
          >
          <input
            type="email"
            class="input w-full h-12 dark:bg-gray-600 dark:bg-gray-200 border border-gray-300 dark:border-gray-800 focus:outline-none rounded-md px-3"
            placeholder=""
            bind:value={email}
          />
        </div>
      {/if}

      <!-- Feedback for page -->
      <div class="space-y-2">
        <label class="block text-base font-semibold">Feedback for page:</label>
        <input
          type="text"
          class="input cursor-not-allowed w-full h-12 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-800 focus:outline-none rounded-md px-3"
          bind:value={pageUrl}
          readonly
        />
      </div>

      <div class="pt-2">
        <Turnstile
          siteKey={import.meta.env.VITE_CF_TURNSTILE_SITE_KEY}
          bind:reset={turnstileReset}
          on:callback={handleTurnstileCallback}
          on:error={handleTurnstileFailure}
          on:expired={handleTurnstileFailure}
          on:timeout={handleTurnstileFailure}
        />
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-8">
      <button
        type="button"
        on:click={sendFeedback}
        class="flex items-center justify-center gap-2 cursor-pointer px-5 py-2 rounded font-semibold text-sm bg-[#0b74ff] text-white hover:opacity-90 active:opacity-100 disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {#if isSubmitting}
          <span class="loading loading-infinity loading-sm"></span>
          <span>Sending...</span>
        {:else}
          Submit
        {/if}
      </button>
    </div>
  </div>
</dialog>

<style>
  /* Optional: ensure the textarea resizes but keeps corner radius intact */
  textarea.textarea {
    border-radius: 0.5rem;
  }
</style>
