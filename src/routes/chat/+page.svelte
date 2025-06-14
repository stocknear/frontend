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

  let defaultChats = [
    {
      label: "Summarize Pelosi's trading moves",
      query:
        "Summarize Nancy Pelosi’s most recent stock trades and provide a sentiment analysis (bullish or bearish) for each company involved, based on the nature and timing of the transactions.",
      type: "Stocks",
    },
    {
      label: "Highlights of options flow orders today",
      query:
        "Provide an overview of today's notable options flow, focusing on large block trades, unusual volume spikes, and directional sentiment.",
      type: "Options",
    },
    {
      label: "Todays Market News",
      query:
        "Give me a summary of today’s top market news and key financial events.",
      type: "Stocks",
    },

    {
      label: "Bull vs Bear Case for Nvidia",
      query: "@BullvsBear for Nvidia",
      type: "Stocks",
    },
  ];
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
                    class: "text-blue-800 dark:text-blue-400",
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
            "text-gray-800 dark:text-gray-200 pointer-events-none text-sm sm:text-[1rem]";
          span.textContent =
            "Ask anything about stocks — get real-time updates";
          return span;
        });

        return DecorationSet.create(state.doc, [widget]);
      },
    },
  });

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
        editorText = editorView?.state.doc?.textContent;
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

    if (data?.user?.credits < 1) {
      toast.error(
        `Insufficient credits. Your current balance is ${data?.user?.credits}.`,
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
  title="Stocknear AI Agent – Real-Time Market Insights, Options Flow, and News"
  description="Get real-time stock market insights with Stocknear AI Agent. Analyze fundamentals, dark pool activity, options flow, and breaking market news – all in one place."
/>

<div
  class="w-full max-w-5xl overflow-hidden m-auto min-h-screen bg-white dark:bg-default mb-16"
>
  <div class="flex flex-col m-auto justify-center items-center">
    <div class="text-center mb-10 w-full px-4 sm:px-3">
      <main class="flex flex-1 flex-col gap-4 sm:p-4 md:gap-8 text-start">
        <div class="h-full w-full flex">
          <div
            class="w-full flex flex-col justify-center items-center gap-6 pb-4"
          >
            <img
              class="m-auto w-16 sm:w-20 rounded-full pt-4"
              src="/pwa-192x192.png"
              alt="Stocknear Logo"
              loading="lazy"
            />
            <h1
              class="block text-2xl lg:text-4xl font-bold text-center mb-10 relative w-fit flex justify-center m-auto break-words"
            >
              Research your Trading Ideas
            </h1>

            <div
              class="block p-3 w-full border border-gray-300 dark:border-gray-600 shadow-sm rounded-[5px] overflow-hidden bg-gray-50 dark:bg-[#2A2E39]"
            >
              <div
                bind:this={editorDiv}
                class="ml-2 bg-gray-50 dark:bg-[#2A2E39] w-full min-h-[50px]"
                on:keydown={handleKeyDown}
              />

              <!-- Suggestions Dropdown -->
              {#if showSuggestions}
                <ul
                  class="absolute bg-white dark:bg-default rounded-[5px] shadow-md border border-gray-300 dark:border-gray-600 mt-1 z-60 w-56 h-fit max-h-56 overflow-y-auto scroller"
                  style="top: {suggestionPos?.top}px; left: {suggestionPos?.left}px;"
                >
                  {#each suggestions as suggestion, i}
                    <li
                      class="px-2 py-1 cursor-pointer sm:hover:bg-gray-100 dark:sm:hover:bg-[#1E222D] text-sm {i ===
                      selectedSuggestion
                        ? ' bg-gray-100 dark:bg-[#1E222D]'
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
                    class="absolute bottom-0 flex flex-row justify-end w-full bg-gray-50 dark:bg-[#2A2E39]"
                  >
                    <div class="flex flex-row justify-between w-full">
                      <div
                        class="order-first relative inline-block text-left cursor-pointer shadow-xs"
                      >
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild let:builder>
                            <Button
                              builders={[builder]}
                              class="w-full border-gray-300 font-semibold dark:font-normal dark:border-gray-600 border bg-gray-50 dark:bg-[#2A2E39] sm:hover:bg-gray-100 dark:sm:hover:bg-primary ease-out  flex flex-row justify-between items-center px-3 py-2  rounded truncate"
                            >
                              <span class="truncate">@Agents</span>
                              <svg
                                class="-mr-1 ml-3 h-5 w-5 xs:ml-2 inline-block"
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
                            </Button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content
                            class="w-56 h-fit max-h-56 overflow-y-auto scroller"
                          >
                            {#if selectedGroup === "overview"}
                              <DropdownMenu.Group>
                                {#each agentCategory as option}
                                  <DropdownMenu.Item
                                    on:click={(e) => {
                                      e.preventDefault();
                                      selectedGroup = option;
                                    }}
                                    class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
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
                                {#each agentOptions as option}
                                  {#if option?.group === selectedGroup}
                                    <DropdownMenu.Item
                                      on:click={() =>
                                        insertAgentOption(option?.name)}
                                      class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                                    >
                                      <div
                                        class="flex flex-row items-center w-full"
                                      >
                                        <span>{option?.name} </span>

                                        <span class="ml-auto text-xs"
                                          >{option?.credit} Credits</span
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
                      {#if data?.user}
                        <label
                          class="ml-auto mr-2 whitespace-nowrap w-auto text-xs border-gray-300 font-semibold dark:font-normal dark:border-gray-600 border bg-gray-50 dark:bg-[#2A2E39] flex flex-row justify-between items-center px-3 rounded"
                        >
                          <div>
                            {data?.user?.credits?.toLocaleString("en-US")}
                            <span class="hidden sm:inline-block">Credits</span>
                          </div>
                        </label>
                      {/if}

                      <label
                        for={!data?.user ? "userLogin" : ""}
                        on:click={() => (data?.user ? createChat() : "")}
                        class="{editorText?.trim()?.length > 0
                          ? 'cursor-pointer'
                          : 'cursor-not-allowed opacity-60'} py-2 text-white dark:text-black text-[1rem] rounded border border-gray-300 dark:border-gray-800 bg-black dark:bg-white px-3 transition-colors duration-200"
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
              {#each defaultChats as item}
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
                  class="flex flex-col border border-gray-300 dark:border-gray-800 sm:hover:bg-gray-100 dark:sm:hover:bg-secondary transition-all bg-white dark:bg-default shadow-sm"
                >
                  <div class="block flex-grow">
                    <button
                      type="button"
                      class="w-full h-full p-2 group font-sans focus:outline-none outline-none outline-transparent transition duration-300 ease-in-out items-center relative group cursor-pointer"
                      ><div
                        class="flex leading-none items-center h-full flex-grow"
                      >
                        <div
                          class="ml-2 text-left font-medium text-sm sm:text-[1rem] flex flex-col justify-center relative text-wrap"
                        >
                          {item?.label}
                          <div class="flex items-center">
                            <svg
                              viewBox="0 0 76 76"
                              xmlns="http://www.w3.org/2000/svg"
                              version="1.1"
                              baseProfile="full"
                              enable-background="new 0 0 76.00 76.00"
                              xml:space="preserve"
                              fill="currentColor"
                              class="h-5 w-5"
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
                            ><span class="text-xs">{item?.type}</span>
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
          <div class="w-full">
            <h2
              class="text-lg sm:text-xl text-start w-full font-semibold flex flex-row items-center"
            >
              <svg
                aria-hidden="true"
                focusable="false"
                data-prefix="fasr"
                data-icon="rectangle-vertical-history"
                class="w-5 h-5 inline-block"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 576 512"
                ><path
                  fill="currentColor"
                  d="M240 48V464H528V48H240zM192 0h48H528h48V48 464v48H528 240 192V464 48 0zM96 48h48V464H96V48zM0 96H48V416H0V96z"
                ></path></svg
              > <span class="ml-2">Threads</span>
            </h2>
            <div class="pb-2 last:mb-10 mt-2">
              {#each historyChat as item}
                <a
                  href={"/chat/" + item?.id}
                  class="block rounded-[5px] border p-3 mb-3 border-gray-300 dark:border-gray-800 sm:hover:bg-gray-100 dark:sm:hover:bg-secondary transition-all cursor-pointer"
                >
                  <div class="group border-transparent rounded-t-md">
                    <div class="mt-[2px]">
                      <p class="text-sm sm:text-[1rem]">
                        {item?.message}
                      </p>
                    </div>
                    <span class="text-sm text-gray-600 dark:text-gray-300"
                      >Last message {formatDate(item?.updated)} ago</span
                    >
                  </div>
                </a>
              {/each}
            </div>
          </div>
        {/if}
      </main>
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
