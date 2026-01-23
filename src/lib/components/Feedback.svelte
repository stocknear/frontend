<script lang="ts">
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { page } from "$app/stores";
  import {
    feedback_title,
    feedback_error_signin,
    feedback_error_description,
    feedback_error_send_try_again,
    feedback_success,
    feedback_error_send_generic,
    feedback_description_label,
    feedback_page_label,
    feedback_cancel_button,
    feedback_send_button,
  } from "$lib/paraglide/messages.js";

  import Question from "lucide-svelte/icons/message-circle-question";

  export let data;

  let description = "";
  let pageUrl = "";
  let isSubmitting = false;
  let isModalOpen = false;

  function closeModal() {
    if (isSubmitting) return;
    isModalOpen = false;
    description = "";
  }

  $: {
    if (typeof window !== "undefined" && $page?.url) {
      pageUrl = window.location.href;
    }
  }

  async function sendFeedback() {
    if (isSubmitting) return;

    if (!data?.user?.id) {
      toast.error(feedback_error_signin(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${
          $mode === "light" ? "#F9FAFB" : "#4B5563"
        }; font-size: 15px;`,
      });
      return;
    }

    if (!description.trim()) {
      toast.error(feedback_error_description(), {
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
    const urlValue = pageUrl || fallbackUrl;

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          url: urlValue,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          result?.error ?? feedback_error_send_try_again();
        throw new Error(message);
      }

      isModalOpen = false;
      toast.success(feedback_success(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${
          $mode === "light" ? "#F9FAFB" : "#4B5563"
        }; font-size: 15px;`,
      });

      description = "";
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : feedback_error_send_generic();
      toast.error(message, {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${
          $mode === "light" ? "#F9FAFB" : "#4B5563"
        }; font-size: 15px;`,
      });
    } finally {
      isSubmitting = false;
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
{#if !$page.url.pathname.startsWith("/chat")}
  <div class="fixed z-[100] bottom-8 sm:bottom-10 right-8 sm:right-16">
    <label
      for="feedbackModalToggle"
      aria-label={feedback_title()}
      class="group flex fixed bottom-8 right-8 items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-2.5 rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/90 cursor-pointer pointer-events-auto text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/80 dark:hover:bg-zinc-900/60 transition"
      style="position: fixed !important; z-index: 99999 !important;"
    >
      <Question
        class="size-5 text-gray-500 dark:text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition"
      />
      <span class="hidden sm:inline text-sm font-semibold">{feedback_title()}</span>
    </label>
  </div>
{/if}

<!-- Toggle for modal -->
<input
  type="checkbox"
  id="feedbackModalToggle"
  class="modal-toggle"
  bind:checked={isModalOpen}
/>

<!-- Modal -->
<dialog
  id="feedbackModal"
  class="modal modal-middle overflow-hidden p-3 sm:p-0 bg-black/40 text-gray-700 dark:text-zinc-200"
>
  <label for="feedbackModalToggle" class="cursor-pointer modal-backdrop"
  ></label>

  <div
    class="modal-box w-full max-w-4xl rounded-2xl bg-white dark:bg-zinc-950 border border-gray-300 shadow dark:border-zinc-700 shadow-none"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1
        class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
      >
        {feedback_title()}
      </h1>
      <label
        for="feedbackModalToggle"
        class="inline-block cursor-pointer text-[1.6rem] text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
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
        <label
          class="block text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
          >{feedback_description_label()}</label
        >
        <textarea
          class="w-full min-h-[160px] max-h-[600px] resize-y rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 p-3 text-sm text-gray-700 dark:text-zinc-200 placeholder:text-gray-500 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80"
          placeholder=""
          bind:value={description}
        />
      </div>

      <!-- Feedback for page -->
      <div class="space-y-2">
        <label
          class="block text-xs uppercase tracking-wide text-gray-800 dark:text-zinc-300"
          >{feedback_page_label()}</label
        >
        <input
          type="text"
          class="cursor-not-allowed w-full h-10 rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 px-3 text-sm text-gray-700 dark:text-zinc-200 focus:outline-none focus:ring-0"
          bind:value={pageUrl}
          readonly
        />
      </div>
    </div>

    <!-- Footer -->

    <div class="mt-6 flex justify-end gap-2">
      <button
        type="button"
        class="cursor-pointer px-4 py-2 rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-sm text-gray-700 dark:text-zinc-200 hover:bg-gray-50/80 dark:hover:bg-zinc-900/60 transition disabled:opacity-60"
        on:click={closeModal}
        disabled={isSubmitting}
      >
        {feedback_cancel_button()}
      </button>
      <button
        type="button"
        class="cursor-pointer px-4 py-2 rounded-full border border-gray-900/80 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 dark:border-zinc-200 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition disabled:opacity-60 flex items-center gap-2"
        on:click={sendFeedback}
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {#if isSubmitting}
          <span class="loading loading-infinity loading-sm"></span>
        {/if}
        {feedback_send_button()}
      </button>
    </div>
  </div>
</dialog>
