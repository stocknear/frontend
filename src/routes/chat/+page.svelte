<script lang="ts">
  import { onMount } from "svelte";

  import Arrow from "lucide-svelte/icons/arrow-up";
  import { mode } from "mode-watcher";
  import { toast } from "svelte-sonner";
  import { goto, invalidateAll } from "$app/navigation";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { EditorState, Plugin } from "prosemirror-state";
  import { EditorView, Decoration, DecorationSet } from "prosemirror-view";
  import { keymap } from "prosemirror-keymap";
  import { agentOptions, agentCategory } from "$lib/utils";
  import { chatReasoning } from "$lib/store";
  import {
  chat_credits,
  chat_credits_left,
  chat_how_to_use_agents,
  chat_placeholder,
  chat_seo_description,
  chat_seo_keywords,
  chat_seo_title,
  chat_stock_agents,
  chat_title,
  chat_toast_insufficient_credits,
} from "$lib/paraglide/messages";

  import { schema } from "prosemirror-schema-basic";

  import SEO from "$lib/components/SEO.svelte";

  export let data;
  export let form;
  let selectedGroup = "overview";
  let editorDiv;
  let editorView;
  let editorText = "";

  let suggestions = [];
  let showSuggestions = false;
  let suggestionPos = { top: 0, left: 0 };
  let selectedSuggestion = 0;
  let currentQuery = "";
  let isLoading = false;

  const allDefaultChats = data?.allDefaultChats || [];
  let displayedChats = shuffle(allDefaultChats).slice(0, 4);

  function shuffle(arr) {
    return [...arr].sort(() => 0.5 - Math.random());
  }

  function refreshSuggestions() {
    displayedChats = shuffle(allDefaultChats).slice(0, 4);
  }

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
          span.textContent = chat_placeholder();
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
        `${chat_toast_insufficient_credits()} ${data?.user?.credits}.`,
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

      if (!response.ok) {
        toast.error(
          output?.error || "Something went wrong. Please try again!",
          {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          },
        );
        isLoading = false;
        return;
      }

      await goto(`/chat/${output.id}`);
      await invalidateAll();
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

</script>

<SEO
  title={chat_seo_title()}
  description={chat_seo_description()}
  keywords={chat_seo_keywords()}
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
  class="w-full overflow-hidden m-auto min-h-[80vh] flex flex-col justify-center text-gray-700 dark:text-zinc-200"
>
  <div class="flex flex-col m-auto justify-center items-center w-full px-4">
    <div
      class="mx-auto w-full max-w-3xl flex flex-col justify-center items-center gap-6"
    >
      <div class="flex flex-col items-center gap-3">
        <img
          class="w-12 sm:w-14 rounded-full"
          src="/pwa-192x192.png"
          alt="Stocknear Logo"
        />
        <h1
          class="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white text-center"
        >
          {chat_title()}
        </h1>
      </div>

      <div
        class="w-full p-3 border border-gray-300 shadow dark:border-zinc-700 rounded-2xl overflow-hidden bg-white/90 dark:bg-zinc-950/70 shadow-sm"
      >
        <div
          bind:this={editorDiv}
          class="ml-2 bg-transparent w-full min-h-[100px]"
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
                                ></path></svg>

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
                                  {data?.user?.credits} {chat_credits_left()}
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
                                    <span>{chat_stock_agents()}</span>
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
                                      ><path d="m15 18-6-6 6-6"></path></svg>
</button
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
                                    <span>{chat_how_to_use_agents()}</span>
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
                                      ><path d="m15 18-6-6 6-6"></path></svg>
</button
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
                                          >{option?.credit} {chat_credits()}</span
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

            <div class="w-full rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
              <div class="flex items-center justify-between px-5 pt-4 pb-2">
                <span class="text-sm font-semibold text-gray-900 dark:text-white">Suggested questions</span>
                <button
                  type="button"
                  on:click={refreshSuggestions}
                  class="cursor-pointer p-1.5 rounded-lg text-gray-400 dark:text-zinc-500 sm:hover:text-gray-600 dark:sm:hover:text-zinc-300 transition-colors"
                  aria-label="Refresh suggestions"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 16h5v5" />
                  </svg>
                </button>
              </div>
              {#each displayedChats as item, i}
                <button
                  type="button"
                  on:click={() => {
                    if (data?.user) {
                      insertDefaultChat(item?.query);
                      createChat();
                    } else {
                      const closePopup = document.getElementById("userLogin");
                      closePopup?.dispatchEvent(new MouseEvent("click"));
                    }
                  }}
                  class="cursor-pointer flex items-center gap-3 w-full px-5 py-3.5 text-left text-sm text-gray-700 dark:text-zinc-300 sm:hover:bg-gray-50 dark:sm:hover:bg-zinc-900/50 transition-colors {i < displayedChats.length - 1 ? 'border-b border-gray-100 dark:border-zinc-800' : ''}"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0 text-gray-400 dark:text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                    <path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" />
                  </svg>
                  <span>{item?.label}</span>
                </button>
              {/each}
            </div>
    </div>
  </div>
</div>

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