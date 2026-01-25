<script lang="ts">
  import { onMount } from "svelte";
  import { DateTime } from "luxon";

  import Arrow from "lucide-svelte/icons/arrow-up";
  import { mode } from "mode-watcher";
  import { toast } from "svelte-sonner";
  import { goto } from "$app/navigation";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { EditorState, Plugin } from "prosemirror-state";
  import { EditorView, Decoration, DecorationSet } from "prosemirror-view";
  import { keymap } from "prosemirror-keymap";
  import { agentOptions, agentCategory } from "$lib/utils";
  import { chatReasoning } from "$lib/store";
  import * as m from "$lib/paraglide/messages";

  import { schema } from "prosemirror-schema-basic";

  import SEO from "$lib/components/SEO.svelte";

  export let data;
  export let form;
  let selectedGroup = "overview";
  let historyChat = data?.getAllChats || [];
  let editorDiv;
  let editorView;
  let editorText = "";

  let suggestions = [];
  let showSuggestions = false;
  let suggestionPos = { top: 0, left: 0 };
  let selectedSuggestion = 0;
  let currentQuery = "";
  let isLoading = false;
  let currentItem = {};

  const formatDate = (dateString) => {
    // Ensure the date string is ISO compliant
    const isoDateString = dateString.replace(" ", "T");

    // Parse input and current time as UTC
    const inputDate = DateTime.fromISO(isoDateString, { zone: "utc" });
    const currentUTC = DateTime.utc();

    // Calculate difference in minutes
    const diffInMinutes = Math.abs(
      inputDate.diff(currentUTC, "minutes").minutes,
    );

    if (diffInMinutes < 60) {
      return `${Math.round(diffInMinutes)} minutes`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.round(diffInMinutes / 60);
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    } else {
      const days = Math.round(diffInMinutes / 1440);
      return `${days} day${days !== 1 ? "s" : ""}`;
    }
  };

  const randomChats = data?.randomChats || [];
  let agentNames = agentOptions?.map((item) => item?.name);

  const editorHighlighter = new Plugin({
    props: {
      decorations(state) {
        const decorations = [];
        const regex = /\@([a-zA-Z0-9_]+)/g;

        state.doc.descendants((node, pos) => {
          if (!node.isText) return;

          const text = node.text;
          if (!text) return;

          let match;
          while ((match = regex.exec(text)) !== null) {
            const mention = match[1];
            if (agentNames?.includes(mention)) {
              decorations?.push(
                Decoration?.inline(
                  pos + match.index,
                  pos + match.index + match[0]?.length,
                  {
                    class: "text-violet-800 dark:text-violet-400",
                  },
                ),
              );
            }
          }
        });

        return DecorationSet.create(state.doc, decorations);
      },
    },
  });

  function getCaretCoordinates(view) {
    const { from } = view.state.selection;
    const start = view.coordsAtPos(from);
    return start;
  }

  function checkAutocomplete(view) {
    const { from } = view.state.selection;
    const before = view.state.doc.textBetween(
      Math.max(0, from - 20),
      from,
      "\n",
      "\n",
    );
    const match = /\@([a-zA-Z0-9_]*)$/.exec(before);

    if (match) {
      currentQuery = match[1];
      suggestions = agentNames?.filter((s) =>
        s.toLowerCase().startsWith(currentQuery.toLowerCase()),
      );

      const coords = getCaretCoordinates(view);
      suggestionPos = { top: coords.bottom + 4, left: coords.left };
      showSuggestions = suggestions.length > 0;
    } else {
      showSuggestions = false;
    }
  }

  const placeholderPlugin = new Plugin({
    props: {
      decorations(state) {
        // only show if empty
        if (state.doc.textContent.length > 0) return null;

        const widget = Decoration.widget(1, () => {
          const span = document.createElement("span");
          span.className =
            "text-gray-500 dark:text-zinc-400 pointer-events-none text-sm sm:text-[1rem]";
          span.textContent = m.chat_placeholder();
          return span;
        });

        return DecorationSet.create(state.doc, [widget]);
      },
    },
  });

  function saveSettings() {
    if (localStorage && typeof localStorage !== "undefined") {
      localStorage.setItem(
        "chat-settings",
        JSON.stringify({ reasoning: $chatReasoning }),
      );
    }
  }

  onMount(() => {
    editorView = new EditorView(editorDiv, {
      state: EditorState.create({
        schema,
        plugins: [
          editorHighlighter,
          placeholderPlugin,
          agentMentionDeletePlugin(agentOptions),
        ],
      }),
      attributes: {
        style: "outline: none !important; border: none !important;",
      },
      dispatchTransaction(transaction) {
        const newState = editorView.state.apply(transaction);
        editorView.updateState(newState);

        // Extract text with line breaks preserved
        let extractedText = "";
        newState.doc.descendants((node, pos) => {
          if (node.isText) {
            extractedText += node.text;
          } else if (node.type.name === "hard_break") {
            extractedText += "\n";
          }
        });

        editorText = extractedText;
        checkAutocomplete(editorView);
      },
    });

    // Force remove outline after creation
    const proseMirrorEl = editorDiv.querySelector(".ProseMirror");
    if (proseMirrorEl) {
      proseMirrorEl.style.outline = "none";
      proseMirrorEl.style.border = "none";
      proseMirrorEl.style.boxShadow = "none";
    }

    // Autofocus the editor
    // Autofocus the editor with a small delay
    setTimeout(() => {
      editorView.focus();
    }, 100);

    editorText = editorView.state.doc.textContent;
  });

  function insertSuggestion(suggestion) {
    const { from } = editorView.state.selection;
    const before = editorView.state.doc.textBetween(
      Math.max(0, from - 20),
      from,
      "\n",
      "\n",
    );
    const match = /\@([a-zA-Z0-9_]*)$/.exec(before);

    if (match) {
      const start = from - match[0].length;

      // First, create transaction
      const tr = editorView.state.tr.insertText(`@${suggestion} `, start, from);

      // Then set selection on the new transaction
      const resolvedPos = tr.doc.resolve(start + suggestion.length + 2);
      const newSelection =
        editorView.state.selection.constructor.near(resolvedPos);
      tr.setSelection(newSelection);

      editorView.dispatch(tr);
      showSuggestions = false;
    }
  }

  function handleKeyDown(event) {
    if (showSuggestions) {
      if (event.key === "ArrowDown") {
        selectedSuggestion = (selectedSuggestion + 1) % suggestions.length;
        event.preventDefault();
      } else if (event.key === "ArrowUp") {
        selectedSuggestion =
          (selectedSuggestion - 1 + suggestions.length) % suggestions.length;
        event.preventDefault();
      } else if (event.key === "Enter") {
        insertSuggestion(suggestions[selectedSuggestion]);
        event.preventDefault();
      } else if (event.key === "Escape") {
        showSuggestions = false;
      }
    } else {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (data?.user) {
          createChat();
        } else {
          const closePopup = document.getElementById("userLogin");
          closePopup?.dispatchEvent(new MouseEvent("click"));
        }
      }
    }
  }

  async function createChat() {
    if (isLoading) {
      return;
    }

    isLoading = true;
    /*
    if (!["Pro", "Plus"].includes(data?.user?.tier)) {
      toast.error("Upgrade your account to unlock this feature", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      isLoading = false;
      return;
    }
      */

    if (data?.user?.credits < 2) {
      toast.error(
        `${m.chat_toast_insufficient_credits()} ${data?.user?.credits}.`,
        {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        },
      );
      isLoading = false;
      return;
    }

    if (editorText?.trim()?.length > 0) {
      const response = await fetch("/api/create-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: editorText }),
      });

      const output = await response.json();
      goto(`/chat/${output.id}`);
    }
    isLoading = false;
  }

  function insertAgentOption(option) {
    const { from, to } = editorView.state.selection;
    const text = `@${option} `;

    const tr = editorView.state.tr.insertText(text, from, to);
    const resolvedPos = tr.doc.resolve(from + text.length);
    const newSelection =
      editorView.state.selection.constructor.near(resolvedPos);
    tr.setSelection(newSelection);

    editorView?.dispatch(tr);
    editorView?.focus();
  }

  function insertDefaultChat(option) {
    const emptyDoc = schema?.topNodeType?.createAndFill();
    const trBefore = editorView?.state?.tr?.replaceWith(
      0,
      editorView?.state?.doc?.content?.size,
      emptyDoc?.content,
    );
    editorView?.dispatch(trBefore);
    editorText = "";

    const { from, to } = editorView.state.selection;
    const text = `${option} `;

    const tr = editorView.state.tr.insertText(text, from, to);
    const resolvedPos = tr.doc.resolve(from + text.length);
    const newSelection =
      editorView.state.selection.constructor.near(resolvedPos);
    tr.setSelection(newSelection);

    editorView?.dispatch(tr);
    editorView?.focus();
  }
  function agentMentionDeletePlugin(agentNames: string[]) {
    return keymap({
      "Shift-Enter": (state, dispatch) => {
        if (dispatch) {
          const br = schema.nodes.hard_break.create();
          const tr = state.tr.replaceSelectionWith(br).scrollIntoView();
          dispatch(tr);
        }
        return true;
      },
      Backspace: (state, dispatch, view) => {
        const { $cursor } = state.selection as any;

        if (!$cursor) return false;

        const { pos } = $cursor;
        const textBefore = state.doc.textBetween(
          Math.max(0, pos - 30),
          pos,
          "\n",
          "\n",
        );

        const regex = /\@([a-zA-Z0-9_]+)$/;
        const match = regex.exec(textBefore);

        if (match && agentNames?.includes(match[1])) {
          const start = pos - match[0].length;

          if (dispatch) {
            dispatch(state.tr.delete(start, pos));
          }
          return true;
        }

        return false;
      },

      // Optional: support Delete key too
      Delete: (state, dispatch, view) => {
        const { $cursor } = state.selection as any;
        if (!$cursor) return false;

        const { pos } = $cursor;
        const textAfter = state.doc.textBetween(
          pos,
          Math.min(pos + 30, state.doc.content.size),
          "\n",
          "\n",
        );

        const regex = /^\@([a-zA-Z0-9_]+)/;
        const match = regex.exec(textAfter);

        if (match && agentNames?.includes(match[1])) {
          const end = pos + match[0].length;

          if (dispatch) {
            dispatch(state.tr.delete(pos, end));
          }
          return true;
        }

        return false;
      },
    });
  }

  async function handleDeleteThread() {
    const postData = {
      threadId: currentItem?.id,
    };

    try {
      const response = await fetch("/api/delete-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      const output = await response.json();

      if (output === "success") {
        toast.success(m.chat_toast_deleted(), {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });

        const updatedHistoryChat = historyChat?.filter(
          (item) => item.id !== currentItem?.id,
        );

        historyChat = [...updatedHistoryChat];
      } else {
        toast.error(m.chat_toast_error(), {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(m.chat_toast_error_occurred(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    }
  }
</script>

<SEO
  title={m.chat_seo_title()}
  description={m.chat_seo_description()}
  keywords={m.chat_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Stocknear AI Financial Agent",
    description:
      "AI-powered financial analysis platform providing real-time market insights, stock research, and investment recommendations through conversational AI",
    url: "https://stocknear.com/chat",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    browserRequirements: "Modern web browser with JavaScript enabled",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "AI Financial Agent",
          item: "https://stocknear.com/chat",
        },
      ],
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    featureList: [
      "AI-powered stock market analysis",
      "Real-time financial data processing",
      "Specialized AI agents for different market sectors",
      "Natural language financial queries",
      "Personalized investment recommendations",
      "Dark pool activity analysis",
      "Options flow tracking and analysis",
      "Market sentiment analysis",
      "Earnings and financial statement analysis",
      "Portfolio optimization suggestions",
    ],
    creator: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://stocknear.com/chat?query={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  }}
/>

<div
  class="w-full max-w-8xl overflow-hidden m-auto min-h-screen bg-white dark:bg-default mb-16 text-gray-700 dark:text-zinc-200"
>
  <div class="flex flex-col m-auto justify-center items-center">
    <div class="text-center mb-10 w-full sm:px-3">
      <main class="flex flex-1 flex-col gap-4 sm:p-4 md:gap-8 text-start">
        <div class="px-4 bg-white/70 dark:bg-zinc-950/60">
          <div
            class="mx-auto w-full max-w-[850px] flex flex-col justify-center items-center gap-6 pb-8"
          >
            <img
              class="m-auto w-16 sm:w-20 rounded-full pt-4"
              src="/pwa-192x192.png"
              alt="Stocknear Logo"
              loading="lazy"
            />
            <h1
              class="block text-2xl lg:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white mb-3 text-center relative w-fit flex justify-center m-auto break-words"
            >
              {m.chat_title()}
            </h1>

            <div
              class="block p-3 w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl overflow-hidden bg-white/90 dark:bg-zinc-950/70 shadow-sm"
            >
              <div
                bind:this={editorDiv}
                class="ml-2 bg-transparent w-full min-h-[50px]"
                on:keydown={handleKeyDown}
              />

              <!-- Suggestions Dropdown -->
              {#if showSuggestions}
                <ul
                  class="absolute rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 text-gray-700 dark:text-zinc-200 shadow-lg shadow-black/5 mt-1 z-60 w-56 h-fit max-h-56 overflow-y-auto scroller"
                  style="top: {suggestionPos?.top}px; left: {suggestionPos?.left}px;"
                >
                  {#each suggestions as suggestion, i}
                    <li
                      class="px-2 py-1 rounded-lg cursor-pointer sm:hover:bg-gray-100 dark:sm:hover:bg-zinc-900 text-sm text-gray-700 dark:text-zinc-200 {i ===
                      selectedSuggestion
                        ? ' bg-gray-100 dark:bg-zinc-900'
                        : ''}"
                      on:click={() => insertSuggestion(suggestion)}
                    >
                      {suggestion}
                    </li>
                  {/each}
                </ul>
              {/if}
              <form
                class="grow rounded relative flex items-center w-full overflow-hidden"
              >
                <div
                  class="relative min-h-12 h-auto overflow-y-hidden w-full outline-none"
                >
                  <div
                    class="absolute bottom-0 flex flex-row justify-end w-full bg:inherit dark:bg-transparent"
                  >
                    <div class="flex flex-row justify-between w-full">
                      <div
                        class="order-first relative inline-block text-left cursor-pointer"
                      >
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild let:builder>
                            <Button
                              builders={[builder]}
                              class="h-9 w-9 shrink-0 bg-white/90 dark:bg-zinc-950/70 text-gray-700 dark:text-zinc-200 border border-gray-300 shadow dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900 ease-out flex items-center justify-center rounded-full px-0 py-0"
                            >
                              <svg
                                class="size-4.5"
                                viewBox="0 0 15 15"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                ><path
                                  d="M5.5 3C4.67157 3 4 3.67157 4 4.5C4 5.32843 4.67157 6 5.5 6C6.32843 6 7 5.32843 7 4.5C7 3.67157 6.32843 3 5.5 3ZM3 5C3.01671 5 3.03323 4.99918 3.04952 4.99758C3.28022 6.1399 4.28967 7 5.5 7C6.71033 7 7.71978 6.1399 7.95048 4.99758C7.96677 4.99918 7.98329 5 8 5H13.5C13.7761 5 14 4.77614 14 4.5C14 4.22386 13.7761 4 13.5 4H8C7.98329 4 7.96677 4.00082 7.95048 4.00242C7.71978 2.86009 6.71033 2 5.5 2C4.28967 2 3.28022 2.86009 3.04952 4.00242C3.03323 4.00082 3.01671 4 3 4H1.5C1.22386 4 1 4.22386 1 4.5C1 4.77614 1.22386 5 1.5 5H3ZM11.9505 10.9976C11.7198 12.1399 10.7103 13 9.5 13C8.28967 13 7.28022 12.1399 7.04952 10.9976C7.03323 10.9992 7.01671 11 7 11H1.5C1.22386 11 1 10.7761 1 10.5C1 10.2239 1.22386 10 1.5 10H7C7.01671 10 7.03323 10.0008 7.04952 10.0024C7.28022 8.8601 8.28967 8 9.5 8C10.7103 8 11.7198 8.8601 11.9505 10.0024C11.9668 10.0008 11.9833 10 12 10H13.5C13.7761 10 14 10.2239 14 10.5C14 10.7761 13.7761 11 13.5 11H12C11.9833 11 11.9668 10.9992 11.9505 10.9976ZM8 10.5C8 9.67157 8.67157 9 9.5 9C10.3284 9 11 9.67157 11 10.5C11 11.3284 10.3284 12 9.5 12C8.67157 12 8 11.3284 8 10.5Z"
                                  fill="currentColor"
                                  fill-rule="evenodd"
                                  clip-rule="evenodd"
                                ></path></svg
                              >
                              <div class="flex items-center gap-0.5">
                                <span class="max-w-16 truncate"
                                  ><span class="truncate"></span></span
                                >
                              </div>
                            </Button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content
                            side="bottom"
                            align="start"
                            sideOffset={10}
                            alignOffset={0}
                            class="w-64 h-fit max-h-56 overflow-y-auto scroller rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 text-gray-700 dark:text-zinc-200 shadow-lg shadow-black/5 p-2"
                          >
                            {#if selectedGroup === "overview"}
                              {#if data?.user}
                                <DropdownMenu.Label
                                  class="text-gray-500 dark:text-zinc-400 font-semibold text-xs"
                                >
                                  {data?.user?.credits} {m.chat_credits_left()}
                                </DropdownMenu.Label>
                              {/if}
                              <!--
                              <DropdownMenu.Item
                                class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
                              >
                                <label
                                  on:click|capture={(event) => {
                                    event.preventDefault();
                                    $chatReasoning = !$chatReasoning;
                                    saveSettings();
                                  }}
                                  class="inline-flex justify-between w-full items-center cursor-pointer"
                                >
                                  <span class="mr-1 text-sm">Reasoning</span>

                                  <div class="relative ml-auto">
                                    <input
                                      type="checkbox"
                                      checked={$chatReasoning}
                                      class="sr-only peer"
                                    />
                                    <div
                                      class="w-9 h-5 bg-gray-400 rounded-full peer peer-checked:bg-blue-600
      after:content-[''] after:absolute after:top-0.5 after:left-[2px]
      after:bg-white after:border-gray-300 after:border
      after:rounded-full after:h-4 after:w-4 after:transition-all
      peer-checked:after:translate-x-full"
                                    ></div>
                                  </div></label
                                >
                              </DropdownMenu.Item>
                              -->

                              <DropdownMenu.Group>
                                <DropdownMenu.Item
                                  on:click={(e) => {
                                    e.preventDefault();
                                    selectedGroup = "stockAgents";
                                  }}
                                  class="cursor-pointer sm:hover:bg-gray-100 dark:sm:hover:bg-zinc-900 rounded-lg text-gray-700 dark:text-zinc-200 transition-colors"
                                >
                                  <div
                                    class="flex flex-row items-center w-full text-sm"
                                  >
                                    <span>{m.chat_stock_agents()}</span>
                                  </div>
                                  <svg
                                    class="ml-auto h-5 w-5 inline-block rotate-270"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    style="max-width:40px"
                                    aria-hidden="true"
                                  >
                                    <path
                                      fill-rule="evenodd"
                                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                      clip-rule="evenodd"
                                    ></path>
                                  </svg>
                                </DropdownMenu.Item>
                              </DropdownMenu.Group>
                            {:else if selectedGroup === "stockAgents"}
                              <DropdownMenu.Group>
                                <div
                                  class="w-full p-1 flex items-stretch gap-1"
                                >
                                  <button
                                    type="button"
                                    on:click={(e) => {
                                      e.preventDefault();
                                      selectedGroup = "overview";
                                    }}
                                    class="aspect-square flex items-center cursor-pointer"
                                    ><svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      class="w-5 h-5"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      ><path d="m15 18-6-6 6-6"></path></svg
                                    ></button
                                  >
                                </div>
                                {#each agentCategory as option}
                                  <DropdownMenu.Item
                                    on:click={(e) => {
                                      e.preventDefault();
                                      selectedGroup = option;
                                    }}
                                    class="cursor-pointer sm:hover:bg-gray-100 dark:sm:hover:bg-zinc-900 rounded-lg text-gray-700 dark:text-zinc-200 transition-colors"
                                  >
                                    <div
                                      class="flex flex-row items-center w-full"
                                    >
                                      <span
                                        >{option} ({agentOptions?.filter(
                                          (item) => item?.group === option,
                                        )?.length})</span
                                      >

                                      <svg
                                        class="ml-auto h-5 w-5 inline-block rotate-270"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        style="max-width:40px"
                                        aria-hidden="true"
                                      >
                                        <path
                                          fill-rule="evenodd"
                                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                          clip-rule="evenodd"
                                        ></path>
                                      </svg>
                                    </div>
                                  </DropdownMenu.Item>
                                {/each}
                                <DropdownMenu.Item
                                  on:click={() => goto("/faq/ai-agents")}
                                  class="cursor-pointer sm:hover:bg-gray-100 dark:sm:hover:bg-zinc-900 rounded-lg text-gray-700 dark:text-zinc-200 transition-colors"
                                >
                                  <div
                                    class="flex flex-row items-center w-full text-sm"
                                  >
                                    <span>{m.chat_how_to_use_agents()}</span>
                                  </div>
                                  <svg
                                    class="ml-auto h-5 w-5 inline-block rotate-270"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    style="max-width:40px"
                                    aria-hidden="true"
                                  >
                                    <path
                                      fill-rule="evenodd"
                                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                      clip-rule="evenodd"
                                    ></path>
                                  </svg>
                                </DropdownMenu.Item>
                              </DropdownMenu.Group>
                            {:else}
                              <DropdownMenu.Group>
                                <div
                                  class="w-full p-1 flex items-stretch gap-1"
                                >
                                  <button
                                    type="button"
                                    on:click={(e) => {
                                      e.preventDefault();
                                      selectedGroup = "stockAgents";
                                    }}
                                    class="aspect-square flex items-center cursor-pointer"
                                    ><svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      class="w-5 h-5"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      ><path d="m15 18-6-6 6-6"></path></svg
                                    ></button
                                  >
                                </div>
                                {#each agentOptions as option}
                                  {#if option?.group === selectedGroup}
                                    <DropdownMenu.Item
                                      on:click={() =>
                                        insertAgentOption(option?.name)}
                                      class="cursor-pointer sm:hover:bg-gray-100 dark:sm:hover:bg-zinc-900 rounded-lg text-gray-700 dark:text-zinc-200 transition-colors"
                                    >
                                      <div
                                        class="flex flex-row items-center w-full"
                                      >
                                        <span>{option?.name} </span>

                                        <span class="ml-auto text-xs"
                                          >{option?.credit} {m.chat_credits()}</span
                                        >
                                      </div>
                                    </DropdownMenu.Item>
                                  {/if}
                                {/each}
                              </DropdownMenu.Group>
                            {/if}
                          </DropdownMenu.Content>
                        </DropdownMenu.Root>
                      </div>

                      <!--
            {#if data?.user}
              <label
                class="ml-auto mr-2 whitespace-nowrap w-auto text-xs border-gray-300 font-semibold dark:font-normal dark:border-gray-600 border bg-white dark:bg-[#2A2E39] flex flex-row justify-between items-center px-3 rounded"
              >
                <div>
                  {data?.user?.credits?.toLocaleString("en-US")}
                  <span class="hidden sm:inline-block">Credits</span>
                </div>
              </label>
            {/if}
          -->

                      <label
                        for={!data?.user ? "userLogin" : ""}
                        on:click={() => (data?.user ? createChat() : "")}
                        class="{editorText?.trim()?.length > 0
                          ? 'cursor-pointer'
                          : 'cursor-not-allowed opacity-60'} h-9 w-9 shrink-0 text-white dark:text-gray-900 text-[0.95rem] rounded-full border border-gray-900/10 dark:border-white/10 bg-gray-900 dark:bg-white transition-colors duration-200 hover:bg-gray-800 dark:hover:bg-gray-100 flex items-center justify-center px-0 py-0"
                      >
                        {#if isLoading}
                          <span
                            class="loading loading-spinner loading-xs text-center m-auto flex justify-center items-center text-white dark:text-black"
                          ></span>
                        {:else}
                          <Arrow
                            class="w-4 h-4 text-center m-auto flex justify-center items-center text-white dark:text-black"
                          />
                        {/if}
                      </label>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div
              class="grid grid-cols-1 md:grid-cols-2 gap-2 shrink w-full overflow-y-auto sidenav-scrollbar"
            >
              {#each randomChats as item}
                <div
                  on:click={() => {
                    if (data?.user) {
                      insertDefaultChat(item?.query);
                      createChat();
                    } else {
                      const closePopup = document.getElementById("userLogin");
                      closePopup?.dispatchEvent(new MouseEvent("click"));
                    }
                  }}
                  class="flex flex-col rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 sm:hover:bg-gray-50 dark:sm:hover:bg-zinc-900/70 transition"
                >
                  <div class="block flex-grow">
                    <button
                      type="button"
                      class="w-full h-full p-2 group font-sans focus:outline-none outline-none outline-transparent transition duration-300 ease-in-out items-center relative group cursor-pointer"
                      ><div
                        class="flex leading-none items-center h-full flex-grow"
                      >
                        <div
                          class="ml-2 text-left text-[0.95rem] text-gray-900 dark:text-white flex flex-col justify-center box-border relative text-wrap"
                        >
                          {item?.label}
                          <div class="flex items-center font-medium pt-1">
                            <svg
                              viewBox="0 0 76 76"
                              xmlns="http://www.w3.org/2000/svg"
                              version="1.1"
                              baseProfile="full"
                              enable-background="new 0 0 76.00 76.00"
                              xml:space="preserve"
                              fill="currentColor"
                              class="h-5 w-5 text-gray-600 dark:text-zinc-300"
                              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                                id="SVGRepo_tracerCarrier"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              ></g><g id="SVGRepo_iconCarrier"
                                ><path
                                  fill="currentColor"
                                  fill-opacity="1"
                                  stroke-width="0.2"
                                  stroke-linejoin="round"
                                  d="M 15.8332,47.5002L 15.8332,40.1901L 25.3332,31.6669L 30.0832,36.4169L 34.8331,20.5836L 44.3331,31.6669L 50.6664,25.3336L 45.9164,20.5836L 58.583,20.5836L 58.583,33.2502L 53.8331,28.5003L 44.3331,38.0002L 36.4165,28.5003L 31.6665,44.3335L 25.3332,38.0002L 15.8332,47.5002 Z "
                                ></path><path
                                  fill="currentColor"
                                  fill-opacity="1"
                                  stroke-width="0.2"
                                  stroke-linejoin="round"
                                  d="M 58.5833,55.4167L 53.8333,55.4167L 53.8333,34.8333L 58.5833,39.5833L 58.5833,55.4167 Z M 49.0833,55.4167L 44.3333,55.4167L 44.3333,44.3333L 49.0833,39.5834L 49.0833,55.4167 Z M 39.5833,55.4167L 34.8333,55.4167L 34.8333,45.9167L 37.2083,36.4167L 39.5833,39.5833L 39.5833,55.4167 Z M 30.0833,55.4167L 25.3333,55.4167L 25.3333,44.3333L 30.0833,49.0833L 30.0833,55.4167 Z M 20.5833,55.4167L 15.8333,55.4167L 15.8333,53.8334L 20.5833,49.0834L 20.5833,55.4167 Z "
                                ></path></g
                              ></svg
                            ><span class="text-sm">{item?.type}</span>
                          </div>
                        </div>
                      </div></button
                    >
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
        {#if historyChat?.length > 0}
          <div class="px-4 sm:px-0 pt-5 sm:pt-0 mx-auto w-full max-w-[850px]">
            <h2
              class="text-base sm:text-lg text-start w-full font-semibold tracking-tight text-gray-900 dark:text-white flex flex-row items-center"
            >
              <svg
                aria-hidden="true"
                focusable="false"
                data-prefix="fasr"
                data-icon="rectangle-vertical-history"
                class="w-5 h-5 inline-block text-gray-800 dark:text-zinc-300"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 576 512"
                ><path
                  fill="currentColor"
                  d="M240 48V464H528V48H240zM192 0h48H528h48V48 464v48H528 240 192V464 48 0zM96 48h48V464H96V48zM0 96H48V416H0V96z"
                ></path></svg
              > <span class="ml-2">{m.chat_threads()}</span>
            </h2>
            <div class="pb-2 last:mb-10 mt-2">
              {#each historyChat as item}
                <a
                  href={"/chat/" + item?.id}
                  class="block rounded-xl border p-3 mb-3 border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 sm:hover:bg-gray-50 dark:sm:hover:bg-zinc-900/60 transition-all cursor-pointer"
                >
                  <div class="group border-transparent rounded-t-md">
                    <div class="mt-[2px]">
                      <p class="text-[1rem]">
                        {item?.message?.length > 250
                          ? item?.message?.slice(0, 250) + "..."
                          : item?.message}
                      </p>
                    </div>
                    <div
                      class="flex flex-row items-center justify-between w-full"
                    >
                      <span
                        class="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 w-full"
                        >{m.chat_last_message()} {formatDate(item?.updated)} {m.chat_ago()}</span
                      >
                      <button
                        on:click|preventDefault={(e) => {
                          e.preventDefault();
                          currentItem = item;
                          const clicked =
                            document.getElementById("deleteThread");
                          clicked?.dispatchEvent(new MouseEvent("click"));
                        }}
                        class="flex gap-2 w-fit items-center sm:hover:text-red-600 dark:sm:hover:text-red-400 text-xs sm:text-sm text-gray-500 dark:text-zinc-400 border border-transparent cursor-pointer px-2 py-1 rounded-md transition"
                        ><span class="text-sm"
                          ><svg
                            role="graphics-symbol"
                            viewBox="0 0 16 16"
                            class="w-3.5 h-3.5 sm:w-4 sm:h-4"
                            fill="currentColor"
                            stroke="currentColor"
                            stroke-width="0"
                            ><path
                              d="M4.8623 15.4287H11.1445C12.1904 15.4287 12.8672 14.793 12.915 13.7402L13.3799 3.88965H14.1318C14.4736 3.88965 14.7402 3.62988 14.7402 3.28809C14.7402 2.95312 14.4736 2.69336 14.1318 2.69336H11.0898V1.66797C11.0898 0.62207 10.4268 0 9.29199 0H6.69434C5.56641 0 4.89648 0.62207 4.89648 1.66797V2.69336H1.86133C1.5332 2.69336 1.25977 2.95312 1.25977 3.28809C1.25977 3.62988 1.5332 3.88965 1.86133 3.88965H2.62012L3.08496 13.7471C3.13281 14.7998 3.80273 15.4287 4.8623 15.4287ZM6.1543 1.72949C6.1543 1.37402 6.40039 1.14844 6.7832 1.14844H9.20312C9.58594 1.14844 9.83203 1.37402 9.83203 1.72949V2.69336H6.1543V1.72949ZM4.99219 14.2188C4.61621 14.2188 4.34277 13.9453 4.32227 13.542L3.86426 3.88965H12.1152L11.6709 13.542C11.6572 13.9453 11.3838 14.2188 10.9941 14.2188H4.99219ZM5.9834 13.1182C6.27051 13.1182 6.45508 12.9336 6.44824 12.667L6.24316 5.50293C6.23633 5.22949 6.04492 5.05176 5.77148 5.05176C5.48438 5.05176 5.2998 5.23633 5.30664 5.50293L5.51172 12.667C5.51855 12.9404 5.70996 13.1182 5.9834 13.1182ZM8 13.1182C8.28711 13.1182 8.47852 12.9336 8.47852 12.667V5.50293C8.47852 5.23633 8.28711 5.05176 8 5.05176C7.71289 5.05176 7.52148 5.23633 7.52148 5.50293V12.667C7.52148 12.9336 7.71289 13.1182 8 13.1182ZM10.0166 13.1182C10.29 13.1182 10.4746 12.9404 10.4814 12.667L10.6934 5.50293C10.7002 5.23633 10.5088 5.05176 10.2285 5.05176C9.95508 5.05176 9.76367 5.22949 9.75684 5.50293L9.54492 12.667C9.53809 12.9336 9.72949 13.1182 10.0166 13.1182Z"
                            ></path></svg
                          ></span
                        ></button
                      >
                    </div>
                  </div>
                </a>
              {/each}
            </div>
          </div>
        {:else if !data?.user}
          <div class="mx-auto w-full max-w-[850px] px-4 sm:px-0">
            <h2
              class="text-base sm:text-lg text-start w-full font-semibold tracking-tight text-gray-900 dark:text-white flex flex-row items-center"
            >
              <svg
                aria-hidden="true"
                focusable="false"
                data-prefix="fasr"
                data-icon="rectangle-vertical-history"
                class="w-5 h-5 inline-block text-gray-800 dark:text-zinc-300"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 576 512"
                ><path
                  fill="currentColor"
                  d="M240 48V464H528V48H240zM192 0h48H528h48V48 464v48H528 240 192V464 48 0zM96 48h48V464H96V48zM0 96H48V416H0V96z"
                ></path></svg
              > <span class="ml-2">{m.chat_threads()}</span>
            </h2>
            <div class="pb-2 last:mb-10 mt-2">
              {m.chat_no_threads()}
            </div>

            <div
              class="bg-white/80 border border-gray-300 shadow dark:border-zinc-700 shadow-sm dark:bg-zinc-950/60 p-6 rounded-2xl mt-2 text-center mb-8"
            >
              <h2
                class="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4"
              >
                {m.chat_ready_to_analyze()}
              </h2>
              <p class="mb-4 text-gray-800 dark:text-zinc-300">
                {m.chat_ready_description()}
              </p>
              <label
                for="userLogin"
                class="cursor-pointer bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 inline-block text-sm sm:text-[1rem] font-semibold"
                >{m.chat_get_started()}</label
              >
            </div>
          </div>
        {:else}
          <div class="mx-auto w-full max-w-[850px] px-4 sm:px-0">
            <h2
              class="text-base sm:text-lg text-start w-full font-semibold tracking-tight text-gray-900 dark:text-white flex flex-row items-center"
            >
              <svg
                aria-hidden="true"
                focusable="false"
                data-prefix="fasr"
                data-icon="rectangle-vertical-history"
                class="w-5 h-5 inline-block text-gray-800 dark:text-zinc-300"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 576 512"
                ><path
                  fill="currentColor"
                  d="M240 48V464H528V48H240zM192 0h48H528h48V48 464v48H528 240 192V464 48 0zM96 48h48V464H96V48zM0 96H48V416H0V96z"
                ></path></svg
              > <span class="ml-2">{m.chat_threads()}</span>
            </h2>
            <div class="pb-2 last:mb-10 mt-2">
              {m.chat_no_threads()}
            </div>
          </div>
        {/if}
      </main>
    </div>
  </div>
</div>

<input type="checkbox" id="deleteThread" class="modal-toggle" />

<dialog id="deleteThread" class="modal modal-middle p-3 sm:p-0">
  <label for="deleteThread" class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box w-full p-6 rounded-2xl border bg-white dark:bg-zinc-950 border-gray-300 dark:border-zinc-700"
  >
    <h3 class="text-lg font-medium mb-2">{m.chat_delete_thread_title()}</h3>
    <p class="text-sm mb-6">
      {m.chat_delete_thread_confirm()}
    </p>
    <div class="flex justify-end space-x-3">
      <label
        for="deleteThread"
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors duration-100 border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400"
        tabindex="0">{m.chat_cancel()}</label
      ><label
        for="deleteThread"
        on:click={handleDeleteThread}
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors duration-100 flex items-center border border-rose-200/70 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300"
        tabindex="0"
        ><svg
          stroke="currentColor"
          fill="none"
          stroke-width="2"
          viewBox="0 0 24 24"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-4 h-4 mr-2"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
          ><polyline points="3 6 5 6 21 6"></polyline><path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          ></path><line x1="10" y1="11" x2="10" y2="17"></line><line
            x1="14"
            y1="11"
            x2="14"
            y2="17"
          ></line></svg
        >{m.chat_delete()}</label
      >
    </div>
  </div>
</dialog>

{#await import("$lib/components/LoginPopup.svelte") then { default: Comp }}
  <svelte:component this={Comp} {data} />
{/await}

<style>
  /* Base textarea styling */
  .textarea-base {
    background: transparent;
    position: relative;
    z-index: 1;
    color: currentColor;
    resize: none;
    white-space: pre-wrap;
  }

  :global(.ProseMirror) {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
  }

  :global(.ProseMirror:focus) {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
  }

  :global(.ProseMirror:focus-visible) {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
  }

  /* Target the editor container div */
  .editor-container {
    outline: none !important;
  }

  .editor-container:focus {
    outline: none !important;
  }

  .editor-container:focus-within {
    outline: none !important;
  }

  /* Remove focus from any child elements */
  .editor-container * {
    outline: none !important;
  }

  .editor-container *:focus {
    outline: none !important;
  }
</style>
