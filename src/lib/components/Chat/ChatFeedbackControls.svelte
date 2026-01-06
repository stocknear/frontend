<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { toast } from "svelte-sonner";
  import { page } from "$app/stores";
  import { mode } from "mode-watcher";
  import Like from "lucide-svelte/icons/thumbs-up";
  import Dislike from "lucide-svelte/icons/thumbs-down";

  const dispatch = createEventDispatcher();

  export let isStreaming = false;
  export let index: number;

  let isModalOpen = false;
  let isSubmitting = false;
  let description = "";
  let userId: string | null = null;
  let fallbackUrl = "";
  let pageUrl = "";
  let selectedRating: "like" | "dislike" | null = null;

  $: userId = $page?.data?.user?.id ?? null;
  $: fallbackUrl = $page?.url?.href ?? "";
  $: pageUrl =
    typeof window !== "undefined" && window?.location?.href
      ? window.location.href
      : fallbackUrl;

  const toastStyle = () =>
    `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`;

  function handleRewrite() {
    if (isStreaming) return;
    dispatch("rewrite", { index });
  }

  function openDislikeModal() {
    if (isStreaming || isSubmitting || selectedRating) return;
    isModalOpen = true;
  }

  function closeModal() {
    if (isSubmitting) return;
    isModalOpen = false;
    description = "";
  }

  async function handleLike() {
    if (isStreaming || selectedRating) return;
    const ok = await submitFeedback({ rating: "like", note: "" });
    if (ok) {
      selectedRating = "like";
    }
  }

  async function handleDislikeSubmit() {
    if (isStreaming || isSubmitting || selectedRating) return;
    if (!description.trim()) {
      toast.error("Describe what went wrong.", { style: toastStyle() });
      return;
    }

    const ok = await submitFeedback({
      rating: "dislike",
      note: description.trim(),
    });

    if (ok) {
      selectedRating = "dislike";
      closeModal();
    }
  }

  type FeedbackPayload = {
    rating: "like" | "dislike";
    note: string;
  };

  async function submitFeedback({ rating, note }: FeedbackPayload) {
    if (!userId) {
      toast.error("Please sign in before giving feedback.", {
        style: toastStyle(),
      });
      return false;
    }

    if (!pageUrl) {
      toast.error("Unable to detect the current page URL.", {
        style: toastStyle(),
      });
      return false;
    }

    isSubmitting = true;

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: note,
          url: pageUrl,
          rating,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          result?.error ??
          "Something went wrong sending feedback. Please try again.";
        throw new Error(message);
      }

      toast.success(
        rating === "like"
          ? "Thanks for the thumbs up!"
          : "Thanks! Your feedback helps us improve.",
        { style: toastStyle() },
      );

      if (rating === "dislike") {
        description = "";
      }

      return true;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong sending feedback.";
      toast.error(message, { style: toastStyle() });
      return false;
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="flex flex-row sm:gap-1 items-center">
  <button
    type="button"
    class="inline-flex items-center gap-1 rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 transition sm:hover:text-violet-600 dark:sm:hover:text-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
    on:click={handleRewrite}
    aria-label="Rewrite response"
    disabled={isStreaming || isSubmitting}
  >
    <div class="flex flex-row items-center min-w-0 gap-1 justify-center">
      <div class="flex shrink-0 items-center justify-center size-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="mt-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M4 12v-3a3 3 0 0 1 3 -3h13m-3 -3l3 3l-3 3"></path>
          <path d="M20 12v3a3 3 0 0 1 -3 3h-13m3 3l-3 -3l3 -3"></path>
        </svg>
      </div>
      <div class="text-align-center relative truncate leading-loose -mb-px">
        Rewrite
      </div>
    </div>
  </button>

  {#if !selectedRating}
    <button
      type="button"
      class="inline-flex items-center rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 px-2.5 py-1.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 transition sm:hover:text-violet-600 dark:sm:hover:text-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
      on:click={handleLike}
      aria-label="Like response"
      disabled={isStreaming || isSubmitting}
    >
      <div class="flex flex-row items-center min-w-0 gap-1 justify-center">
        <div class="flex shrink-0 items-center justify-center size-4">
          <Like class="mt-0.5" />
        </div>
      </div>
    </button>

    <button
      type="button"
      class="inline-flex items-center rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 px-2.5 py-1.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 transition sm:hover:text-violet-600 dark:sm:hover:text-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
      on:click={openDislikeModal}
      aria-label="Dislike response"
      disabled={isStreaming || isSubmitting}
    >
      <div class="flex flex-row items-center min-w-0 gap-1 justify-center">
        <div class="flex shrink-0 items-center justify-center size-4">
          <Dislike class="mt-0.5" />
        </div>
      </div>
    </button>
  {:else}
    <div
      class="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 dark:border-zinc-700 bg-gray-50/80 dark:bg-zinc-900/50 text-xs font-semibold text-gray-500 dark:text-zinc-400"
    >
      <div class="flex items-center justify-center size-4">
        {#if selectedRating === "like"}
          <Like class="mt-0.5 fill-black dark:fill-white" fill="currentColor" />
        {:else}
          <Dislike
            class="mt-0.5 fill-black dark:fill-white"
            fill="currentColor"
          />
        {/if}
      </div>
      <span>Feedback recorded</span>
    </div>
  {/if}
</div>

{#if isModalOpen}
  <dialog
    class="modal modal-open overflow-hidden p-3 sm:p-0 bg-black/40 text-gray-700 dark:text-zinc-200"
    aria-modal="true"
    role="dialog"
  >
    <button
      class="cursor-pointer modal-backdrop"
      aria-label="Dismiss dislike feedback modal"
      on:click={closeModal}
      disabled={isSubmitting}
    ></button>

    <div
      class="modal-box w-full max-w-lg rounded-2xl bg-white/90 dark:bg-zinc-950/80 border border-gray-300 dark:border-zinc-700"
    >
      <div class="flex items-center justify-between">
        <h2
          class="text-base sm:text-lg font-semibold tracking-tight text-gray-900 dark:text-zinc-100"
        >
          Provide Feedback
        </h2>
        <button
          class="cursor-pointer inline-flex size-8 items-center justify-center rounded-full text-gray-400 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400 transition"
          on:click={closeModal}
          aria-label="Close dislike feedback modal"
          disabled={isSubmitting}
        >
          ✕
        </button>
      </div>

      <div class="mt-3 space-y-3">
        <p class="text-xs text-gray-600 dark:text-zinc-400">
          Help us improve by sharing what could be better with this response.
        </p>
        <textarea
          class="textarea w-full h-48 max-h-[600px] resize-vertical rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50/80 dark:bg-zinc-900/60 text-sm text-gray-700 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-500 focus-visible:outline-none focus-visible:border-violet-400/60"
          placeholder="Tell us what could be improved..."
          bind:value={description}
          disabled={isSubmitting}
        />
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <button
          type="button"
          class="cursor-pointer inline-flex items-center rounded-full border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 transition sm:hover:text-violet-600 dark:sm:hover:text-violet-400 disabled:opacity-60"
          on:click={closeModal}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="button"
          class="cursor-pointer inline-flex items-center gap-2 rounded-full border border-gray-900/10 dark:border-zinc-700 bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-xs font-semibold transition hover:opacity-90 disabled:opacity-60"
          on:click={handleDislikeSubmit}
          disabled={isSubmitting}
        >
          {#if isSubmitting}
            <span class="loading loading-infinity loading-sm"></span>
          {/if}
          Send feedback
        </button>
      </div>
    </div>
  </dialog>
{/if}
