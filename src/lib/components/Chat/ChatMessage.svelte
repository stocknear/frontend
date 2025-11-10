<script lang="ts">
  import { onDestroy } from "svelte";
  import { page } from "$app/stores";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { createEventDispatcher } from "svelte";
  import { chatReasoning } from "$lib/store";
  const dispatch = createEventDispatcher();

  import TickerGraph from "$lib/components/Plot/TickerGraph.svelte";
  import SourcesSection from "$lib/components/Chat/SourcesSection.svelte";
  import Related from "$lib/components/Chat/Related.svelte";

  export let message: {
    content: string;
    role: "user" | "system";
    callComponent?: {};
    sources?: Array<{
      name: string;
      function: string;
      ticker?: string;
      timestamp?: string;
    }>;
    relatedQuestions?: string[];
  };
  export let isLoading = false;
  export let isStreaming = false;
  export let index;
  export let editable;
  export let isEditMode = false;
  export let isLatestSystemMessage = false;
  export let allMessages = [];
  export let onExportPDF = null;
  export let assistant = false;
  export let chatId = null;

  // Smooth text rendering
  let displayedContent = "";
  let typewriterInterval = null;
  let targetContent = "";

  let editedContent = "";
  let textareaElement;

  // Auto-resize textarea when edit mode changes or content changes
  $: if (isEditMode && textareaElement && editedContent) {
    setTimeout(() => {
      if (
        textareaElement &&
        textareaElement.style &&
        textareaElement.scrollHeight
      ) {
        try {
          textareaElement.style.height = "auto";
          textareaElement.style.height = textareaElement.scrollHeight + "px";
        } catch (e) {
          console.warn("Error in reactive textarea resize:", e);
        }
      }
    }, 10);
  }
  let loadingTime = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null; // Specify type for clarity
  const loadingMessages = [
    "Fetching data...",
    "Analyzing....",
    "Thinking...",
    "Finalizing....",
  ];

  $: {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    if (isLoading) {
      intervalId = setInterval(() => {
        // Only increment if we haven't reached the last message
        if (loadingTime < loadingMessages.length + 2) {
          // +2 because of "Preparing insights..." and then index 0 of loadingMessages
          loadingTime += 1;
        } else {
          // If we've reached the last message, clear the interval
          clearInterval(intervalId as ReturnType<typeof setInterval>);
          intervalId = null;
        }
      }, 3000);
    } else {
      loadingTime = 0;
    }
  }

  // Smooth character-by-character rendering for streaming
  $: if (message?.role === "system" && message?.content) {
    targetContent = message.content;
    if (isStreaming && targetContent.length > displayedContent.length) {
      // Clear existing interval
      if (typewriterInterval) {
        clearInterval(typewriterInterval);
      }

      // Start smooth rendering
      const charsToAdd = targetContent.length - displayedContent.length;
      const speed = Math.min(10, Math.max(1, Math.floor(charsToAdd / 20))); // Dynamic speed

      typewriterInterval = setInterval(() => {
        if (displayedContent.length < targetContent.length) {
          const nextChars = targetContent.slice(
            displayedContent.length,
            displayedContent.length + speed,
          );
          displayedContent += nextChars;
        } else {
          clearInterval(typewriterInterval);
          typewriterInterval = null;
        }
      }, 10); // 10ms interval for smooth rendering
    } else if (!isStreaming) {
      // Ensure full content is displayed when streaming ends
      displayedContent = targetContent;
      if (typewriterInterval) {
        clearInterval(typewriterInterval);
        typewriterInterval = null;
      }
    }
  } else if (message?.role === "user") {
    displayedContent = message?.content || "";
  }

  onDestroy(() => {
    if (intervalId) clearInterval(intervalId);
    if (typewriterInterval) clearInterval(typewriterInterval);
  });

  function handleRelatedQuestionClick(event) {
    // Dispatch event to parent component
    dispatch("related-question", event.detail);
  }

  function handleShare() {
    // Use the chat-specific URL if chatId is available, otherwise use current URL
    const url = chatId 
      ? `${$page?.url?.origin}/chat/${chatId}`
      : $page?.url?.href;
    navigator.clipboard
      ?.writeText(url)
      ?.then(() => {
        toast?.success("Link copied. Paste to share", {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
      })
      ?.catch((err) => {
        toast?.error("Something went wrong. Please try again!", {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
      });
  }

  function handleCopyPrompt() {
    const content = message?.content;

    if (!content) return;

    navigator.clipboard
      ?.writeText(content)
      ?.then(() => {
        toast?.success("Copied!", {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
      })
      ?.catch((err) => {
        toast?.error("Failed to copy prompt", {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
      });
  }

  function focus(element) {
    if (element) {
      element.focus();
      element.select();
      // Auto-resize on initial load
      if (element.style && element.scrollHeight) {
        try {
          element.style.height = "auto";
          element.style.height = element.scrollHeight + "px";
        } catch (e) {
          console.warn("Error in focus resize:", e);
        }
      }
    }
  }

  // Function to auto-resize textarea
  function autoResize(element) {
    if (element && element.style && element.scrollHeight) {
      try {
        element.style.height = "auto";
        element.style.height = element.scrollHeight + "px";
      } catch (e) {
        console.warn("Error in autoResize:", e);
      }
    }
  }
</script>

<div
  class="flex m-auto mb-6 w-full max-w-[1000px] {assistant
    ? 'text-sm'
    : 'text-sm sm:text-[1rem]'}"
  class:justify-end={message.role === "user"}
>
  <div class="flex flex-col sm:flex-row items-start w-full">
    <img
      class="mr-auto {assistant
        ? 'size-8'
        : 'sm:mr-3 size-8 sm:size-10'} rounded-full {message.role === 'user'
        ? 'hidden'
        : ''}"
      src="/pwa-192x192.png"
      alt="Stocknear Logo"
      loading="lazy"
    />
    <div
      class="rounded p-3 min-w-14 max-w-full {message?.role === 'user'
        ? 'ml-auto group/turn-messages max-w-[80%]'
        : message?.role === 'system'
          ? 'mr-auto w-full'
          : 'mr-auto w-fit border-b rounded-none border-gray-300 dark:border-gray-700'}"
    >
      {#if isLoading}
        <div class="py-3">
          <div
            class="text-sm sm:text-[1rem] text-gray-500 dark:text-gray-400 shimmer-text"
          >
            {$chatReasoning
              ? "Thinking very hard..."
              : "Gathering relevant data..."}
          </div>
        </div>
      {:else}
        <div class="w-full">
          {#if message?.role === "user" && isEditMode}
            <div
              class="p-3 border border-gray-200 dark:border-gray-800 rounded-[5px] bg-gray-200 dark:bg-table"
            >
              <textarea
                bind:this={textareaElement}
                bind:value={editedContent}
                class="w-96 sm:w-[500px] h-auto resize-none border-0 bg-transparent focus:outline-none"
                placeholder="Edit your message..."
                on:input={(e) => autoResize(e.target)}
                use:focus
              ></textarea>
              <div class="flex justify-end gap-2 mt-2">
                <button
                  on:click={() => {
                    dispatch("cancel-edit");
                    editedContent = "";
                  }}
                  class="cursor-pointer px-2.5 py-1.5 rounded text-sm relative bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                  >Cancel</button
                >
                <button
                  on:click={() => {
                    if (editedContent.trim()) {
                      dispatch("edit", {
                        index,
                        content: editedContent.trim(),
                      });
                    }
                  }}
                  class="cursor-pointer px-3.5 py-1.5 rounded text-sm relative bg-black text-white dark:text-black sm:hove:bg-default dark:bg-white dark:sm:hover:bg-gray-100"
                  >Save & Regenerate</button
                >
              </div>
            </div>
          {:else}
            <p
              class="w-full transition-all duration-75 ease-out break-words overflow-wrap-anywhere {message?.role ===
              'user'
                ? 'p-3  border border-gray-200 dark:border-gray-800 rounded-[5px] bg-gray-200 dark:bg-table'
                : ''}"
            >
              {@html isStreaming && message?.role === "system"
                ? displayedContent
                : message?.role === "user"
                  ? message?.content?.replace(/\n/g, "<br/>")
                  : message?.content}
              {#if isStreaming && message?.role === "system" && typewriterInterval}
                <span
                  class="inline-block w-1 h-4 ml-0.5 bg-gray-600 dark:bg-gray-400 animate-pulse"
                ></span>
              {/if}
            </p>
          {/if}

          <!-- Sources Section - Perplexity Style -->
          {#if message?.sources && message?.sources?.length > 0 && !isStreaming}
            <SourcesSection sources={message.sources} />
          {/if}

          <!-- Related Questions Section - Only show for latest system message -->
          {#if message?.relatedQuestions && message?.relatedQuestions?.length > 0 && !isStreaming && editable && isLatestSystemMessage}
            <Related
              questions={message.relatedQuestions}
              on:question-click={handleRelatedQuestionClick}
            />
          {/if}

          {#if message?.role === "system" && message?.sources && message?.sources?.length > 0 && isLatestSystemMessage}
            <div class="mt-6 hidden lg:block">
              <TickerGraph
                tickerList={[
                  ...new Set(
                    message.sources
                      ?.map((item) => item?.ticker)
                      ?.filter(Boolean), // removes null/undefined/empty
                  ),
                ]}
                sources={message?.sources}
              />
            </div>
          {/if}
        </div>
        {#if message?.role === "system"}
          {#if !isStreaming}
            <div class=" gap-xs flex items-center mt-2">
              <button
                type="button"
                class="text-muted dark:text-gray-300 dark:sm:hover:text-white focus-visible:bg-offsetPlus dark:focus-visible:bg-offsetPlusDark hover:bg-offsetPlus text-textOff dark:text-textOffDark hover:text-textMain dark:hover:bg-offsetPlusDark dark:hover:text-textMainDark font-sans focus:outline-none outline-none outline-transparent transition duration-300 ease-out font-sans select-none items-center relative group/button justify-center text-center items-center rounded-full cursor-pointer active:scale-[0.97] active:duration-150 active:ease-outExpo origin-center whitespace-nowrap inline-flex text-sm h-8 pr-3"
                on:click={handleShare}
                ><div
                  class="flex flex-row items-center min-w-0 font-medium gap-1.5 justify-center"
                >
                  <div class="flex shrink-0 items-center justify-center size-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-8 h-8 mt-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      ><path
                        d="M13 4v4c-6.575 1.028 -9.02 6.788 -10 12c-.037 .206 5.384 -5.962 10 -6v4l8 -7l-8 -7z"
                      ></path></svg
                    >
                  </div>
                  <div
                    class="text-align-center relative truncate leading-loose -mb-px"
                  >
                    Share
                  </div>
                </div></button
              >

              <!-- Export to PDF Button - Show only for latest system message with content -->
              <!--
              {#if message?.role === "system" && allMessages.length > 1 && onExportPDF && !isStreaming}
                <button
                  type="button"
                  class="text-muted dark:text-gray-300 dark:sm:hover:text-white focus-visible:bg-offsetPlus dark:focus-visible:bg-offsetPlusDark hover:bg-offsetPlus text-textOff dark:text-textOffDark hover:text-textMain dark:hover:bg-offsetPlusDark dark:hover:text-textMainDark font-sans focus:outline-none outline-none outline-transparent transition duration-300 ease-out font-sans select-none items-center relative group/button justify-center text-center items-center rounded-full cursor-pointer active:scale-[0.97] active:duration-150 active:ease-outExpo origin-center whitespace-nowrap inline-flex text-sm h-8 pl-1 pr-3"
                  on:click={onExportPDF}
                  ><div
                    class="flex flex-row items-center min-w-0 font-medium gap-1.5 justify-center"
                  >
                    <div
                      class="flex shrink-0 items-center justify-center size-4"
                    >
                      <svg
                        class="w-8 h-8 mt-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                          id="SVGRepo_tracerCarrier"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        ></g><g id="SVGRepo_iconCarrier">
                          <path
                            d="M15 17H21M21 17L19 19M21 17L19 15M13 3H8.2C7.0799 3 6.51984 3 6.09202 3.21799C5.71569 3.40973 5.40973 3.71569 5.21799 4.09202C5 4.51984 5 5.0799 5 6.2V17.8C5 18.9201 5 19.4802 5.21799 19.908C5.40973 20.2843 5.71569 20.5903 6.09202 20.782C6.51984 21 7.0799 21 8.2 21H15M13 3L19 9M13 3V7.4C13 7.96005 13 8.24008 13.109 8.45399C13.2049 8.64215 13.3578 8.79513 13.546 8.89101C13.7599 9 14.0399 9 14.6 9H19M19 9V11.0228"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          ></path>
                        </g></svg
                      >
                    </div>
                    <div
                      class="text-align-center relative truncate leading-loose -mb-px"
                    >
                      Export to PDF
                    </div>
                  </div></button
                >
              {/if}
              -->

              {#if editable}
                <button
                  type="button"
                  on:click={() => {
                    if (!isStreaming) {
                      dispatch("rewrite", index);
                    }
                  }}
                  class="text-muted dark:text-gray-300 dark:sm:hover:text-white focus-visible:bg-offsetPlus dark:focus-visible:bg-offsetPlusDark hover:bg-offsetPlus text-textOff dark:text-textOffDark hover:text-textMain dark:hover:bg-offsetPlusDark dark:hover:text-textMainDark font-sans focus:outline-none outline-none outline-transparent transition duration-300 ease-out font-sans select-none items-center relative group/button justify-center text-center items-center rounded-full cursor-pointer active:scale-[0.97] active:duration-150 active:ease-outExpo origin-center whitespace-nowrap inline-flex text-sm h-8 pl-1"
                  ><div
                    class="flex flex-row items-center min-w-0 font-medium gap-1.5 justify-center"
                  >
                    <div
                      class="flex shrink-0 items-center justify-center size-4"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-8 h-8 mt-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path d="M4 12v-3a3 3 0 0 1 3 -3h13m-3 -3l3 3l-3 3"
                        ></path><path
                          d="M20 12v3a3 3 0 0 1 -3 3h-13m3 3l-3 -3l3 -3"
                        ></path></svg
                      >
                    </div>
                    <div
                      class="text-align-center relative truncate leading-loose -mb-px"
                    >
                      Rewrite
                    </div>
                  </div></button
                >
              {/if}
            </div>
          {/if}
        {/if}
        {#if message?.role === "user"}
          <div class=" relative w-full">
            <div
              class=" flex flex-wrap items-center justify-end gap-y-4 p-1 select-none focus-within:transition-none hover:transition-none duration-300 group-hover/turn-messages:delay-300 pointer-events-none opacity-0 motion-safe:transition-opacity group-hover/turn-messages:pointer-events-auto group-hover/turn-messages:opacity-100 group-focus-within/turn-messages:pointer-events-auto group-focus-within/turn-messages:opacity-100 has-data-[state=open]:pointer-events-auto has-data-[state=open]:opacity-100"
            >
              <!-- Copy button -->
              <button
                on:click={handleCopyPrompt}
                class="cursor-pointer text-token-text-secondary hover:bg-token-bg-secondary rounded-lg text-muted dark:text-gray-300 dark:sm:hover:text-white"
                aria-label="Copy"
                aria-selected="false"
                data-testid="copy-turn-action-button"
                data-state="closed"
              >
                <span
                  class="touch:w-10 flex h-8 w-8 items-center justify-center"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    class="icon"
                  >
                    <path
                      d="M12.668 10.667C12.668 9.95614 12.668 9.46258 12.6367 9.0791C12.6137 8.79732 12.5758 8.60761 12.5244 8.46387L12.4688 8.33399C12.3148 8.03193 12.0803 7.77885 11.793 7.60254L11.666 7.53125C11.508 7.45087 11.2963 7.39395 10.9209 7.36328C10.5374 7.33197 10.0439 7.33203 9.33301 7.33203H6.5C5.78896 7.33203 5.29563 7.33195 4.91211 7.36328C4.63016 7.38632 4.44065 7.42413 4.29688 7.47559L4.16699 7.53125C3.86488 7.68518 3.61186 7.9196 3.43555 8.20703L3.36524 8.33399C3.28478 8.49198 3.22795 8.70352 3.19727 9.0791C3.16595 9.46259 3.16504 9.95611 3.16504 10.667V13.5C3.16504 14.211 3.16593 14.7044 3.19727 15.0879C3.22797 15.4636 3.28473 15.675 3.36524 15.833L3.43555 15.959C3.61186 16.2466 3.86474 16.4807 4.16699 16.6348L4.29688 16.6914C4.44063 16.7428 4.63025 16.7797 4.91211 16.8027C5.29563 16.8341 5.78896 16.835 6.5 16.835H9.33301C10.0439 16.835 10.5374 16.8341 10.9209 16.8027C11.2965 16.772 11.508 16.7152 11.666 16.6348L11.793 16.5645C12.0804 16.3881 12.3148 16.1351 12.4688 15.833L12.5244 15.7031C12.5759 15.5594 12.6137 15.3698 12.6367 15.0879C12.6681 14.7044 12.668 14.211 12.668 13.5V10.667ZM13.998 12.665C14.4528 12.6634 14.8011 12.6602 15.0879 12.6367C15.4635 12.606 15.675 12.5492 15.833 12.4688L15.959 12.3975C16.2466 12.2211 16.4808 11.9682 16.6348 11.666L16.6914 11.5361C16.7428 11.3924 16.7797 11.2026 16.8027 10.9209C16.8341 10.5374 16.835 10.0439 16.835 9.33301V6.5C16.835 5.78896 16.8341 5.29563 16.8027 4.91211C16.7797 4.63025 16.7428 4.44063 16.6914 4.29688L16.6348 4.16699C16.4807 3.86474 16.2466 3.61186 15.959 3.43555L15.833 3.36524C15.675 3.28473 15.4636 3.22797 15.0879 3.19727C14.7044 3.16593 14.211 3.16504 13.5 3.16504H10.667C9.9561 3.16504 9.46259 3.16595 9.0791 3.19727C8.79739 3.22028 8.6076 3.2572 8.46387 3.30859L8.33399 3.36524C8.03176 3.51923 7.77886 3.75343 7.60254 4.04102L7.53125 4.16699C7.4508 4.32498 7.39397 4.53655 7.36328 4.91211C7.33985 5.19893 7.33562 5.54719 7.33399 6.00195H9.33301C10.022 6.00195 10.5791 6.00131 11.0293 6.03809C11.4873 6.07551 11.8937 6.15471 12.2705 6.34668L12.4883 6.46875C12.984 6.7728 13.3878 7.20854 13.6533 7.72949L13.7197 7.87207C13.8642 8.20859 13.9292 8.56974 13.9619 8.9707C13.9987 9.42092 13.998 9.97799 13.998 10.667V12.665ZM18.165 9.33301C18.165 10.022 18.1657 10.5791 18.1289 11.0293C18.0961 11.4302 18.0311 11.7914 17.8867 12.1279L17.8203 12.2705C17.5549 12.7914 17.1509 13.2272 16.6553 13.5313L16.4365 13.6533C16.0599 13.8452 15.6541 13.9245 15.1963 13.9619C14.8593 13.9895 14.4624 13.9935 13.9951 13.9951C13.9935 14.4624 13.9895 14.8593 13.9619 15.1963C13.9292 15.597 13.864 15.9576 13.7197 16.2939L13.6533 16.4365C13.3878 16.9576 12.9841 17.3941 12.4883 17.6982L12.2705 17.8203C11.8937 18.0123 11.4873 18.0915 11.0293 18.1289C10.5791 18.1657 10.022 18.165 9.33301 18.165H6.5C5.81091 18.165 5.25395 18.1657 4.80371 18.1289C4.40306 18.0962 4.04235 18.031 3.70606 17.8867L3.56348 17.8203C3.04244 17.5548 2.60585 17.151 2.30176 16.6553L2.17969 16.4365C1.98788 16.0599 1.90851 15.6541 1.87109 15.1963C1.83431 14.746 1.83496 14.1891 1.83496 13.5V10.667C1.83496 9.978 1.83432 9.42091 1.87109 8.9707C1.90851 8.5127 1.98772 8.10625 2.17969 7.72949L2.30176 7.51172C2.60586 7.0159 3.04236 6.6122 3.56348 6.34668L3.70606 6.28027C4.04237 6.136 4.40303 6.07083 4.80371 6.03809C5.14051 6.01057 5.53708 6.00551 6.00391 6.00391C6.00551 5.53708 6.01057 5.14051 6.03809 4.80371C6.0755 4.34588 6.15483 3.94012 6.34668 3.56348L6.46875 3.34473C6.77282 2.84912 7.20856 2.44514 7.72949 2.17969L7.87207 2.11328C8.20855 1.96886 8.56979 1.90385 8.9707 1.87109C9.42091 1.83432 9.978 1.83496 10.667 1.83496H13.5C14.1891 1.83496 14.746 1.83431 15.1963 1.87109C15.6541 1.90851 16.0599 1.98788 16.4365 2.17969L16.6553 2.30176C17.151 2.60585 17.5548 3.04244 17.8203 3.56348L17.8867 3.70606C18.031 4.04235 18.0962 4.40306 18.1289 4.80371C18.1657 5.25395 18.165 5.81091 18.165 6.5V9.33301Z"
                    ></path>
                  </svg>
                </span>
              </button>

              <!-- Edit button -->
              {#if editable}
                <button
                  on:click={() => {
                    dispatch("start-edit", { index });
                    editedContent = message?.content || "";
                    // Force resize after a short delay to ensure the textarea is rendered
                    setTimeout(() => {
                      if (textareaElement && textareaElement.style) {
                        try {
                          textareaElement.style.height = "auto";
                          textareaElement.style.height =
                            textareaElement.scrollHeight + "px";
                        } catch (e) {
                          console.warn("Error resizing textarea:", e);
                        }
                      }
                    }, 100);
                  }}
                  class="cursor-pointer text-token-text-secondary hover:bg-token-bg-secondary rounded-lg text-muted dark:text-gray-300 dark:sm:hover:text-white"
                  aria-label="Edit message"
                  aria-selected="false"
                  data-state="closed"
                >
                  <span
                    class="touch:w-10 flex h-8 w-8 items-center justify-center"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="CurrentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      class="icon"
                    >
                      <path
                        d="M11.3312 3.56837C12.7488 2.28756 14.9376 2.33009 16.3038 3.6963L16.4318 3.83106C17.6712 5.20294 17.6712 7.29708 16.4318 8.66895L16.3038 8.80372L10.0118 15.0947C9.68833 15.4182 9.45378 15.6553 9.22179 15.8457L8.98742 16.0225C8.78227 16.1626 8.56423 16.2832 8.33703 16.3828L8.10753 16.4756C7.92576 16.5422 7.73836 16.5902 7.5216 16.6348L6.75695 16.7705L4.36339 17.169C4.22053 17.1928 4.06908 17.2188 3.94054 17.2285C3.84177 17.236 3.70827 17.2386 3.56261 17.2031L3.41417 17.1543C3.19115 17.0586 3.00741 16.8908 2.89171 16.6797L2.84581 16.5859C2.75951 16.3846 2.76168 16.1912 2.7716 16.0596C2.7813 15.931 2.80736 15.7796 2.83117 15.6367L3.2296 13.2432L3.36437 12.4785C3.40893 12.2616 3.45789 12.0745 3.52453 11.8926L3.6173 11.6621C3.71685 11.4352 3.83766 11.2176 3.97765 11.0127L4.15343 10.7783C4.34386 10.5462 4.58164 10.312 4.90538 9.98829L11.1964 3.6963L11.3312 3.56837ZM5.84581 10.9287C5.49664 11.2779 5.31252 11.4634 5.18663 11.6162L5.07531 11.7627C4.98188 11.8995 4.90151 12.0448 4.83507 12.1963L4.77355 12.3506C4.73321 12.4607 4.70242 12.5761 4.66808 12.7451L4.54113 13.4619L4.14269 15.8555L4.14171 15.8574H4.14464L6.5382 15.458L7.25499 15.332C7.424 15.2977 7.5394 15.2669 7.64953 15.2266L7.80285 15.165C7.95455 15.0986 8.09947 15.0174 8.23644 14.9238L8.3839 14.8135C8.53668 14.6876 8.72225 14.5035 9.0714 14.1543L14.0587 9.16602L10.8331 5.94044L5.84581 10.9287ZM15.3634 4.63673C14.5281 3.80141 13.2057 3.74938 12.3097 4.48048L12.1368 4.63673L12.7735 5.00001L15.0001 8.22559L15.3634 7.86329L15.5196 7.68946C16.2015 6.85326 16.2015 5.64676 15.5196 4.81056L15.3634 4.63673Z"
                      ></path>
                    </svg>
                  </span>
                </button>
              {/if}
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>
