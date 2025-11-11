<script lang="ts">
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import Question from "lucide-svelte/icons/message-circle-question";

  export let data: { user?: { id?: string } } | undefined;
  export let pageUrl: string = "";

  let description = "";
  let email = "";
  let page = pageUrl;

  onMount(() => {
    // Only set from location on client if not provided
    if (!page) {
      try {
        page = window.location.href;
      } catch {
        page = "";
      }
    }
  });

  async function sendFeedback() {
    if (!description.trim()) {
      toast.error("Please describe your issue or suggestion.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${
          $mode === "light" ? "#F9FAFB" : "#4B5563"
        }; font-size: 15px;`,
      });
      return;
    }

    const closeEl = document.getElementById("feedbackModal");
    closeEl?.dispatchEvent(new MouseEvent("click"));

    const userId = data?.user?.id ?? "";

    const postData = {
      user: userId,
      rating: "", // not used in this layout
      description,
      category: "general",
      email: email?.trim() || undefined,
      page,
    };

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      toast.success("Thanks! Your feedback was sent.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${
          $mode === "light" ? "#F9FAFB" : "#4B5563"
        }; font-size: 15px;`,
      });

      description = "";
      email = "";
    } catch (e) {
      toast.error("Something went wrong sending feedback.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${
          $mode === "light" ? "#F9FAFB" : "#4B5563"
        }; font-size: 15px;`,
      });
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
    class="border inline-flex items-center justify-center w-12 h-12 sm:w-auto sm:h-10 font-semibold bg-black dark:bg-gray-100 border-gray-500 dark:border-gray-700 ml-1 mr-0 sm:mr-2 rounded-full cursor-pointer px-3 gap-2"
  >
    <Question class="w-5 h-5 text-white dark:text-black" />
    <span class="text-white dark:text-black hidden sm:inline text-md"
      >Give feedback</span
    >
  </label>
</div>

<!-- Toggle for modal -->
<input type="checkbox" id="feedbackModal" class="modal-toggle" />

<!-- Modal -->
<dialog
  id="feedbackModal"
  class="modal overflow-hidden p-3 sm:p-0 bg-[#000]/30"
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
          class="textarea w-full h-48 max-h-[600px] resize-vertical bg-white dark:bg-gray-200 border border-gray-300 dark:border-gray-800 focus:outline-none text-black placeholder-gray-500 rounded-md"
          placeholder=""
          bind:value={description}
        />
      </div>

      <!-- Email (optional) -->
      <div class="space-y-2">
        <label class="block text-base font-semibold"
          >Your email address (optional):</label
        >
        <input
          type="email"
          class="input w-full h-12 bg-white dark:bg-gray-200 border border-gray-300 dark:border-gray-800 focus:outline-none text-black rounded-md px-3"
          placeholder=""
          bind:value={email}
        />
      </div>

      <!-- Feedback for page -->
      <div class="space-y-2">
        <label class="block text-base font-semibold">Feedback for page:</label>
        <input
          type="text"
          class="input w-full h-12 bg-white dark:bg-gray-200 border border-gray-300 dark:border-gray-800 focus:outline-none text-black rounded-md px-3"
          bind:value={page}
          readonly
        />
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-8">
      <button
        on:click={sendFeedback}
        class="w-28 h-11 rounded-md font-semibold bg-[#0b74ff] text-white hover:opacity-90 active:opacity-100"
      >
        Submit
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
