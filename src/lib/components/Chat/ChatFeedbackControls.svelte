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
    if (isStreaming || isSubmitting) return;
    isModalOpen = true;
  }

  function closeModal() {
    if (isSubmitting) return;
    isModalOpen = false;
    description = "";
  }

  async function handleLike() {
    if (isStreaming) return;
    await submitFeedback({ rating: "like", note: "" });
  }

  async function handleDislikeSubmit() {
    if (isStreaming || isSubmitting) return;
    if (!description.trim()) {
      toast.error("Describe what went wrong.", { style: toastStyle() });
      return;
    }

    const ok = await submitFeedback({
      rating: "dislike",
      note: description.trim(),
    });

    if (ok) {
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

<div class="flex flex-row gap-1 items-center">
  <button
    type="button"
    class="text-muted pr-3 dark:text-gray-300 dark:sm:hover:text-white focus-visible:bg-offsetPlus dark:focus-visible:bg-offsetPlusDark hover:bg-offsetPlus text-textOff dark:text-textOffDark hover:text-textMain dark:hover:bg-offsetPlusDark dark:hover:text-textMainDark font-sans focus:outline-none outline-none outline-transparent transition duration-300 ease-out select-none relative group/button justify-center text-center items-center rounded-full cursor-pointer active:scale-[0.97] active:duration-150 active:ease-outExpo origin-center whitespace-nowrap inline-flex text-sm h-8 pl-1 disabled:cursor-not-allowed disabled:opacity-60"
    on:click={handleRewrite}
    aria-label="Rewrite response"
    disabled={isStreaming || isSubmitting}
  >
    <div class="flex flex-row items-center min-w-0 font-medium gap-1.5 justify-center">
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

  <button
    type="button"
    class="text-muted pr-3 dark:text-gray-300 dark:sm:hover:text-white focus-visible:bg-offsetPlus dark:focus-visible:bg-offsetPlusDark hover:bg-offsetPlus text-textOff dark:text-textOffDark hover:text-textMain dark:hover:bg-offsetPlusDark dark:hover:text-textMainDark font-sans focus:outline-none outline-none outline-transparent transition duration-300 ease-out select-none relative group/button justify-center text-center items-center rounded-full cursor-pointer active:scale-[0.97] active:duration-150 active:ease-outExpo origin-center whitespace-nowrap inline-flex text-sm h-8 pl-1 disabled:cursor-not-allowed disabled:opacity-60"
    on:click={handleLike}
    aria-label="Like response"
    disabled={isStreaming || isSubmitting}
  >
    <div class="flex flex-row items-center min-w-0 font-medium gap-1.5 justify-center">
      <div class="flex shrink-0 items-center justify-center size-4">
        <Like class="mt-0.5" />
      </div>
    </div>
  </button>

  <button
    type="button"
    class="text-muted pr-3 dark:text-gray-300 dark:sm:hover:text-white focus-visible:bg-offsetPlus dark:focus-visible:bg-offsetPlusDark hover:bg-offsetPlus text-textOff dark:text-textOffDark hover:text-textMain dark:hover:bg-offsetPlusDark dark:hover:text-textMainDark font-sans focus:outline-none outline-none outline-transparent transition duration-300 ease-out select-none relative group/button justify-center text-center items-center rounded-full cursor-pointer active:scale-[0.97] active:duration-150 active:ease-outExpo origin-center whitespace-nowrap inline-flex text-sm h-8 pl-1 disabled:cursor-not-allowed disabled:opacity-60"
    on:click={openDislikeModal}
    aria-label="Dislike response"
    disabled={isStreaming || isSubmitting}
  >
    <div class="flex flex-row items-center min-w-0 font-medium gap-1.5 justify-center">
      <div class="flex shrink-0 items-center justify-center size-4">
        <Dislike class="mt-0.5" />
      </div>
    </div>
  </button>
</div>

{#if isModalOpen}
  <div class="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
    <div
      class="w-full max-w-lg rounded-lg bg-white dark:bg-secondary border border-gray-300 dark:border-gray-600 shadow-xl"
    >
      <div class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          What missed the mark?
        </h2>
        <button
          class="text-2xl leading-none text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
          on:click={closeModal}
          aria-label="Close dislike feedback modal"
          disabled={isSubmitting}
        >
          &times;
        </button>
      </div>

      <div class="p-4 space-y-3">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Share details so we can improve future answers.
        </p>
        <textarea
          class="w-full h-32 resize-none rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tell us what went wrong..."
          bind:value={description}
          disabled={isSubmitting}
        />
      </div>

      <div class="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700 p-4">
        <button
          type="button"
          class="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60"
          on:click={closeModal}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black text-sm font-medium hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
          on:click={handleDislikeSubmit}
          disabled={isSubmitting}
        >
          {#if isSubmitting}
            <span class="loading loading-infinity loading-sm"></span>
          {/if}
          Submit
        </button>
      </div>
    </div>
  </div>
{/if}
