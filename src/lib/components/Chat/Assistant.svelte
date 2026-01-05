<script lang="ts">
  import { onMount, afterUpdate, tick, onDestroy } from "svelte";
  import { slide, fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import { getCreditFromQuery, agentOptions, agentCategory } from "$lib/utils";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import { derived } from "svelte/store";
  import { chatReasoning } from "$lib/store";

  // Lazy load components
  import ChatMessage from "$lib/components/Chat/ChatMessage.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";

  // Icons
  import X from "lucide-svelte/icons/x";
  import Plus from "lucide-svelte/icons/plus";
  import History from "lucide-svelte/icons/history";
  import ArrowUp from "lucide-svelte/icons/arrow-up";
  import Spark from "lucide-svelte/icons/sparkles";

  // Lazy load ProseMirror modules
  import { EditorState, Plugin } from "prosemirror-state";
  import { EditorView, Decoration, DecorationSet } from "prosemirror-view";
  import { keymap } from "prosemirror-keymap";
  import { schema } from "prosemirror-schema-basic";

  export let data;
  let userData = data?.user || null;

  let selectedGroup = "overview";

  // Window state
  let isOpen = false;
  let isMinimized = false;
  let isFullscreen = false;

  // Chat state
  let messages = [];
  let relatedQuestions = [];
  let chatId = null;
  let isLoading = false;
  let isStreaming = false;

  // Editor state
  let editorDiv;
  let editorView;
  let editorText = "";
  let suggestions = [];
  let showSuggestions = false;
  let suggestionPos = { top: 0, left: 0 };
  let selectedSuggestion = 0;
  let currentQuery = "";

  // UI refs
  let chatContainer: HTMLDivElement;
  let bottomEl: HTMLDivElement;
  let chatWindow: HTMLDivElement;

  // Drag state (kept but panel is docked right by default)
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let windowX = 20;
  let windowY = 20;

  // Stream handling
  let saveTimeout = null;
  let lastSavedContent = "";
  let animationFrameId = null;
  let pendingContent = "";

  // Message editing
  let editingMessageIndex: number | null = null;
  let editable = true; // Assistant is always editable

  // Chat history
  let showChatHistory = false;
  let chatHistory = [];
  let loadingHistory = false;

  // Memoize agent names
  const agentNames = agentOptions?.map((item) => item?.name) ?? [];

  // Use derived store for better reactivity
  const shouldShowAssistant = derived(
    page,
    ($page) => !$page.url.pathname.startsWith("/chat"),
  );

  // --- editor plugins & helpers (kept from your original) ---
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
          if (dispatch) dispatch(state.tr.delete(start, pos));
          return true;
        }
        return false;
      },
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
          if (dispatch) dispatch(state.tr.delete(pos, end));
          return true;
        }
        return false;
      },
    });
  }

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
              decorations.push(
                Decoration.inline(
                  pos + match.index,
                  pos + match.index + match[0]?.length,
                  {
                    class: "text-violet-800 dark:text-violet-400 font-medium",
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

  const placeholderPlugin = new Plugin({
    props: {
      decorations(state) {
        if (state.doc.textContent.length > 0) return null;
        const widget = Decoration.widget(1, () => {
          const span = document.createElement("span");
          span.className =
            "text-gray-600 dark:text-gray-300 pointer-events-none";
          span.textContent = editable
            ? "Ask anything about stocks, markets, or financial data..."
            : "Read-only: You don't have permission to edit this chat.";
          return span;
        });
        return DecorationSet.create(state.doc, [widget]);
      },
    },
  });

  function getCaretCoordinates(view) {
    const { from } = view.state.selection;
    return view.coordsAtPos(from);
  }

  // Debounce autocomplete for better performance
  let autocompleteTimeout;
  function checkAutocomplete(view) {
    clearTimeout(autocompleteTimeout);
    autocompleteTimeout = setTimeout(() => {
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
        suggestionPos = { top: coords.bottom + 6, left: coords.left - 8 };
        showSuggestions = suggestions.length > 0;
      } else {
        showSuggestions = false;
      }
    }, 100);
  }

  // Window controls
  function openChat() {
    isOpen = true;
    isMinimized = false;
    // focus editor after smooth transition
    setTimeout(() => {
      editorView?.focus();
      // Immediately scroll to bottom when opening
      if (bottomEl) {
        bottomEl.scrollIntoView({ behavior: "instant" });
      }
    }, 450);
  }

  function toggleFullscreen() {
    isFullscreen = !isFullscreen;
  }

  function closeChat() {
    isOpen = false;
    isMinimized = false;
    isFullscreen = false;
  }

  // Helper function to clear editor
  function clearEditor() {
    if (!editorView) return;

    const emptyDoc = schema?.topNodeType?.createAndFill();
    const tr = editorView?.state?.tr?.replaceWith(
      0,
      editorView?.state?.doc?.content?.size,
      emptyDoc?.content,
    );
    editorView?.dispatch(tr);
    editorText = "";
  }

  function newChat() {
    messages = [];
    chatId = null; // Reset chatId so next message creates new chat
    relatedQuestions = [];
    editingMessageIndex = null;
    // Clear cache when starting new chat
    chatHistoryCache = null;
    clearEditor();
  }

  // Throttle drag handling for better performance
  let dragAnimationFrame;
  function startDrag(e: MouseEvent) {
    if (isFullscreen) return;
    isDragging = true;
    dragStartX = e.clientX - windowX;
    dragStartY = e.clientY - windowY;
  }

  function handleDrag(e: MouseEvent) {
    if (!isDragging || isFullscreen) return;
    if (dragAnimationFrame) return;

    dragAnimationFrame = requestAnimationFrame(() => {
      windowX = e.clientX - dragStartX;
      windowY = e.clientY - dragStartY;
      windowX = Math.max(
        0,
        Math.min(window.innerWidth - (chatWindow?.offsetWidth || 400), windowX),
      );
      windowY = Math.max(
        0,
        Math.min(
          window.innerHeight - (chatWindow?.offsetHeight || 600),
          windowY,
        ),
      );
      dragAnimationFrame = null;
    });
  }

  function stopDrag() {
    isDragging = false;
    if (dragAnimationFrame) {
      cancelAnimationFrame(dragAnimationFrame);
      dragAnimationFrame = null;
    }
  }

  function handleClickOutside(event) {
    if (showChatHistory && !event.target.closest(".chat-history-dropdown")) {
      showChatHistory = false;
    }
  }

  // Chat functionality - complete workflow like main chat
  async function llmChat(userMessage?: string) {
    if (isLoading || isStreaming) return;

    const userQuery = userMessage || editorText?.trim();
    if (!userQuery || userQuery?.length < 1) return;

    // Check if user is logged in
    if (!userData) {
      // Clear editor first
      clearEditor();

      // Trigger login popup
      openLoginModal();
      return;
    }

    // Step 1: Create chat if we don't have a chatId (like /chat/+page.svelte)
    if (!chatId) {
      await createChatSession(userQuery);
      return;
    }

    // Step 2: Continue existing chat (like /chat/[slug]/+page.svelte)
    await continueChat(userQuery, userMessage);
  }

  // Create new chat session (like createChat in /chat/+page.svelte)
  async function createChatSession(userQuery: string) {
    if (isLoading) return;

    isLoading = true;

    // Calculate credit cost for this query
    const creditCost = getCreditFromQuery(userQuery, agentOptions);

    // Check user credits (same as main chat)
    if (userData?.credits < creditCost) {
      // Add user message and insufficient credits message
      messages = [
        ...messages,
        { content: userQuery, role: "user" },
        {
          content: `Insufficient credits. Your current balance is ${userData?.credits}. Your prompt would cost ${creditCost} credits. Credits are reset at the start of each month.`,
          role: "system",
        },
      ];

      // Clear editor
      clearEditor();
      isLoading = false;
      return;
    }

    try {
      const response = await fetch("/api/create-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userQuery }),
      });

      const output = await response.json();
      chatId = output.id; // Set the PocketBase ID

      // Now continue with the actual chat
      await continueChat(userQuery, null);
    } catch (error) {
      console.error("Failed to create chat:", error);
      isLoading = false;
    }
  }

  // Continue chat conversation (like llmChat in /chat/[slug]/+page.svelte)
  async function continueChat(userQuery: string, userMessage?: string) {
    // Calculate credit cost for this query
    const creditCost = getCreditFromQuery(userQuery, agentOptions);

    // Check user credits before continuing
    if (userData?.credits < creditCost) {
      // Add user message if not already there
      if (!userMessage) {
        messages = [...messages, { content: userQuery, role: "user" }];
      }
      // Add insufficient credits message
      messages = [
        ...messages,
        {
          content: `Insufficient credits. Your current balance is ${userData?.credits}. Your prompt would cost ${creditCost} credits. Credits are reset at the start of each month.`,
          role: "system",
        },
      ];

      // Clear editor
      clearEditor();
      return;
    }

    isLoading = true;
    isStreaming = true;
    relatedQuestions = [];

    // Clear editor
    clearEditor();

    // Add user message if not already in messages
    if (!userMessage) {
      messages = [...messages, { content: userQuery, role: "user" }];
    }

    // Add placeholder for assistant response
    messages = [...messages, { content: "", role: "system" }];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userQuery,
          chatId: chatId,
          reasoning: $chatReasoning,
        }),
      });

      if (!res.ok || !res.body) {
        messages = messages.slice(0, -1);
        const errorMessage = (await res?.json())?.error || "Unknown error";
        messages = [...messages, { content: errorMessage, role: "system" }];
        isLoading = false;
        isStreaming = false;
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const idx = messages.length - 1;
      let assistantText = "";
      let updateBuffer = [];
      let batchTimeout = null;
      let sourcesCollected = [];

      isLoading = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line?.trim()) continue;

          try {
            const json = JSON.parse(line);

            if (json.error) {
              console.error("Stream error:", json.error);
              break;
            }

            // Handle sources event - Skip for Assistant
            // if (json?.event === "sources" && json?.sources) {
            //   sourcesCollected = json.sources;
            //   if (messages[idx]) {
            //     messages[idx].sources = sourcesCollected;
            //     messages = [...messages];
            //   }
            // }

            // Handle related questions event - Skip for Assistant
            // if (json?.event === "related_questions" && json?.questions) {
            //   relatedQuestions = json.questions;
            //   if (messages[idx]) {
            //     messages[idx].relatedQuestions = json.questions;
            //     messages = [...messages];
            //   }
            // }

            // Handle content updates
            if (json?.content) {
              assistantText = json.content;
              pendingContent = assistantText;
              updateBuffer.push(assistantText);

              if (batchTimeout) clearTimeout(batchTimeout);
              batchTimeout = setTimeout(() => {
                if (updateBuffer.length > 0) {
                  const latest = updateBuffer[updateBuffer.length - 1];
                  if (animationFrameId) cancelAnimationFrame(animationFrameId);
                  animationFrameId = requestAnimationFrame(() => {
                    messages[idx].content = latest;
                    messages = [...messages];
                    animationFrameId = null;
                  });
                  updateBuffer = [];
                }
              }, 30);

              await saveChatWithDebounce(assistantText);
            }
          } catch (err) {
            console.error("Parse error:", err, "line:", line);
          }
        }
      }

      isStreaming = false;
      if (pendingContent && messages[idx]) {
        messages[idx].content = pendingContent;
        messages = [...messages];
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      // Deduct credits
      const costOfCredit = getCreditFromQuery(userQuery, agentOptions);
      if (userData) userData.credits -= costOfCredit;

      await saveChat();
    } catch (error) {
      console.error("Chat request failed:", error);
      messages = messages.slice(0, -1);
      let errorMessage =
        "Failed to connect to the chat service. Please try again later.";
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        errorMessage =
          "Network error: Unable to reach the chat service. Please check your connection.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      messages = [...messages, { content: errorMessage, role: "system" }];
    } finally {
      isLoading = false;
      isStreaming = false;
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
      }
    }
  }

  function handleRelatedQuestionClick(event) {
    const { question } = event.detail;
    messages = [...messages, { role: "user", content: question }];
    llmChat(question);
  }

  async function handleKeyDown(event) {
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
        await llmChat();
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeChat();
      }
    }
  }

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

  // Cache chat history to avoid redundant fetches
  let chatHistoryCache = null;
  let chatHistoryCacheTime = 0;
  const CACHE_DURATION = 60000; // 1 minute cache

  async function fetchChatHistory() {
    if (!userData) return;

    // Use cache if available and fresh
    const now = Date.now();
    if (chatHistoryCache && now - chatHistoryCacheTime < CACHE_DURATION) {
      chatHistory = chatHistoryCache;
      return;
    }

    loadingHistory = true;
    try {
      const response = await fetch("/api/chat-history", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        chatHistory = data.getAllChats || [];
        chatHistoryCache = chatHistory;
        chatHistoryCacheTime = now;
      }
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
    } finally {
      loadingHistory = false;
    }
  }

  function toggleChatHistory() {
    showChatHistory = !showChatHistory;
    if (showChatHistory && chatHistory.length === 0) {
      fetchChatHistory();
    }
  }

  async function loadChatFromHistory(chatData) {
    try {
      // Show loading state
      loadingHistory = true;

      // Load the specific chat by ID
      const response = await fetch(`/api/chat/${chatData.id}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Loaded chat data:", data);

        // Load the chat data into the assistant and clean it
        const cleanedMessages = (data.getChat?.messages || []).map(
          (message) => ({
            content: message.content,
            role: message.role,
            // Remove sources, plots, and related questions
            // sources: undefined,
            // plots: undefined,
            // relatedQuestions: undefined
          }),
        );

        messages = cleanedMessages;
        chatId = data.getChat?.id;
        relatedQuestions = [];
        editingMessageIndex = null;

        // Clear any text in the editor
        clearEditor();

        // Close dropdown
        showChatHistory = false;

        console.log("Chat loaded successfully, messages:", messages);
      } else {
        console.error("Failed to load chat:", response.status);
      }
    } catch (error) {
      console.error("Failed to load chat:", error);
    } finally {
      loadingHistory = false;
    }
  }

  // rewriting/editing handlers (kept)
  async function rewriteResponse(dispatchData: any) {
    const index = dispatchData?.detail ?? null;
    if (index < 1 || index > messages?.length) return;
    editingMessageIndex = null;
    const userMessage = messages?.[index - 1]?.content;
    messages = messages?.slice(0, index);
    await llmChat(userMessage);
  }

  async function editMessage(event: any) {
    const { index, content } = event.detail;
    if (index < 0 || index >= messages?.length) return;
    editingMessageIndex = null;
    messages[index].content = content;
    messages = messages.slice(0, index + 1);
    messages = [...messages];
    // When editing, pass the content as userMessage to indicate it's already in the array
    await continueChat(content, content);
  }

  function handleStartEdit(event: any) {
    const { index } = event.detail;
    editingMessageIndex = index;
  }

  function handleCancelEdit() {
    editingMessageIndex = null;
  }

  // Function to open login modal
  function openLoginModal() {
    const loginCheckbox = document.getElementById(
      "userLogin",
    ) as HTMLInputElement;
    if (loginCheckbox) {
      loginCheckbox.checked = true;
    }
  }

  // Saving functions (exact same as working chat)
  async function saveChatWithDebounce(assistantContent = "") {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      // Only save if content has changed
      if (assistantContent !== lastSavedContent) {
        lastSavedContent = assistantContent;
        await saveChat();
      }
    }, 2000); // Save every 2 seconds during streaming
  }

  async function saveChat() {
    const postData = { messages: messages, chatId: chatId };

    const response = await fetch("/api/update-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData),
    });

    const output = await response?.json();
  }

  function handlePageUnload() {
    if (isStreaming && messages.length > 0) {
      const postData = JSON.stringify({ messages, chatId });
      navigator.sendBeacon(
        "/api/update-chat",
        new Blob([postData], { type: "application/json" }),
      );
    }
  }

  // lifecycle
  // Optimize editor initialization
  let editorInitialized = false;
  function initializeEditor() {
    if (!editorDiv || editorView || editorInitialized) return;
    editorInitialized = true;

    // Create initial document with preserved text if any
    let initialDoc = schema?.topNodeType?.createAndFill();
    if (editorText && editorText.trim() !== "") {
      // Create a document with the preserved text
      initialDoc = schema.nodes.doc.create(null, [
        schema.nodes.paragraph.create(null, schema.text(editorText)),
      ]);
    }

    editorView = new EditorView(editorDiv, {
      state: EditorState.create({
        doc: initialDoc,
        schema,
        plugins: [
          editorHighlighter,
          placeholderPlugin,
          agentMentionDeletePlugin(agentNames),
          keymap({
            "Ctrl-Enter": () => {
              if (editorText?.trim()) {
                llmChat();
                return true;
              }
              return false;
            },
            Enter: () => {
              if (editorText?.trim()) {
                llmChat();
                return true;
              }
              return false;
            },
            Escape: () => {
              closeChat();
              return true;
            },
          }),
        ],
      }),
      attributes: {
        style: "outline: none !important; border: none !important;",
      },
      editable: () => editable,
      dispatchTransaction(transaction) {
        // Prevent dispatch if not editable
        if (!editable) return;

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

    // Force remove outline after creation (same as working chat)
    const proseMirrorEl = editorDiv.querySelector(".ProseMirror");
    if (proseMirrorEl) {
      proseMirrorEl.style.outline = "none";
      proseMirrorEl.style.border = "none";
      proseMirrorEl.style.boxShadow = "none";
    }

    // Focus with small delay and ensure editorText is synced
    setTimeout(() => {
      if (editorView) {
        editorView.focus();
        // Move cursor to the end if there's existing text
        if (editorText && editorText.trim() !== "") {
          const endPos = editorView.state.doc.content.size;
          const tr = editorView.state.tr.setSelection(
            editorView.state.selection.constructor.near(
              editorView.state.doc.resolve(endPos),
            ),
          );
          editorView.dispatch(tr);
        }
      }
    }, 100);
  }

  function saveSettings() {
    if (localStorage && typeof localStorage !== "undefined") {
      localStorage.setItem(
        "chat-settings",
        JSON.stringify({ reasoning: $chatReasoning }),
      );
    }
  }

  onMount(() => {
    if (browser) {
      document.addEventListener("mousemove", handleDrag);
      document.addEventListener("mouseup", stopDrag);
      document.addEventListener("click", handleClickOutside);
      window.addEventListener("beforeunload", handlePageUnload);
      window.addEventListener("pagehide", handlePageUnload);
    }
  });

  afterUpdate(async () => {
    if (isStreaming && bottomEl) {
      await tick();
      bottomEl.scrollIntoView({ behavior: "smooth" });
    }

    // Initialize editor when chat opens
    if (isOpen && editorDiv && !editorView) {
      await tick(); // Wait for DOM
      initializeEditor();
      // Immediately scroll to bottom when opening
      if (bottomEl) {
        bottomEl.scrollIntoView({ behavior: "instant" });
      }
    }

    // Destroy editor when chat closes but preserve the input text
    if (!isOpen && editorView) {
      // Save the current text before destroying
      if (editorView.state && editorView.state.doc) {
        editorText = editorView.state.doc.textContent || editorText;
      }
      editorView.destroy();
      editorView = null;
      editorInitialized = false; // Reset initialized flag
      showSuggestions = false;
    }
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", stopDrag);
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("beforeunload", handlePageUnload);
      window.removeEventListener("pagehide", handlePageUnload);
    }
    if (editorView) {
      editorView.destroy();
      editorInitialized = false;
    }
    if (saveTimeout) clearTimeout(saveTimeout);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (autocompleteTimeout) clearTimeout(autocompleteTimeout);
    if (dragAnimationFrame) cancelAnimationFrame(dragAnimationFrame);
  });
</script>

<!-- Floating Open Button - Only show on lg screens and above, and not on /chat pages -->
{#if $shouldShowAssistant && !isOpen}
  <label
    on:click|stopPropagation={openChat}
    for={!data?.user ? "userLogin" : ""}
    aria-label="Ask AI"
    class=" hidden lg:flex fixed bottom-8 right-8 items-center gap-2 px-4 py-3 rounded-full bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 shadow-lg hover:shadow-xl cursor-pointer pointer-events-auto text-white dark:text-black transition-all duration-200 hover:scale-105"
    style="position: fixed !important; z-index: 99999 !important;"
  >
    <Spark class="w-5 h-5" />
    <span class="text-sm font-medium">Ask AI</span>
  </label>
{/if}

<!-- Panel - Only show on lg screens and above, and not on /chat pages -->
{#if $shouldShowAssistant && isOpen}
  <!-- panel -->
  <aside
    bind:this={chatWindow}
    role="dialog"
    aria-modal="true"
    class="hidden lg:flex fixed right-5 bottom-10 w-full md:w-[480px] lg:w-[600px] {isFullscreen
      ? 'h-full max-h-[90%]'
      : 'h-[600px]'} max-w-full z-50 bg-white dark:bg-default border border-gray-300 dark:border-gray-700 shadow-2xl flex-col transition-all duration-300 {isFullscreen
      ? 'rounded-none'
      : 'rounded-l-2xl'}"
    style="transform-origin: bottom center;"
    transition:slide={{ duration: 400, easing: quintOut, axis: "y" }}
  >
    <!-- Header -->
    <header
      role="banner"
      class="flex items-center justify-between px-6 py-4 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-default/50 cursor-default select-none"
      on:mousedown={startDrag}
    >
      <div class="flex items-center gap-3 min-w-0">
        <div class="flex-shrink-0">
          <div
            class="w-9 h-9 rounded bg-black dark:bg-white flex items-center justify-center shadow-sm"
          >
            <Spark class="w-5 h-5 text-white dark:text-black" />
          </div>
        </div>
        <div class="min-w-0">
          <div
            class="text-base font-semibold text-gray-900 dark:text-white truncate"
          >
            AI Assistant
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
            Real-time financial insights at your fingertips
          </div>
        </div>
      </div>

      <div class="flex items-center gap-1">
        <button
          on:click={newChat}
          class="cursor-pointer p-2 rounded sm:hover:bg-gray-300 dark:sm:hover:bg-gray-800 transition-colors"
          title="New chat"
          aria-label="New chat"
        >
          <Plus class="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
        <div class="relative chat-history-dropdown">
          <button
            on:click={toggleChatHistory}
            class="cursor-pointer p-2 rounded sm:hover:bg-gray-300 dark:sm:hover:bg-gray-800 transition-colors"
            title="Chat history"
            aria-label="Chat history"
          >
            <History class="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>

          {#if showChatHistory}
            <div
              class="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-xl z-50 max-h-96 overflow-y-auto"
              transition:fly={{ y: -10, duration: 200 }}
            >
              <div class="p-4 border-b border-gray-300 dark:border-gray-600">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                  Recent Conversations
                </h3>
              </div>

              {#if loadingHistory}
                <div class="p-4 text-center">
                  <div
                    class="loading loading-spinner loading-md text-black dark:text-white"
                  ></div>
                  <span class="ml-2 text-sm text-gray-600 dark:text-gray-300"
                    >Loading...</span
                  >
                </div>
              {:else if chatHistory.length === 0}
                <div
                  class="p-4 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No chat history found
                </div>
              {:else}
                <div class="py-2">
                  {#each chatHistory as chat}
                    <button
                      on:click={() => loadChatFromHistory(chat)}
                      class="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div
                        class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate"
                      >
                        {chat.message || "No message"}
                      </div>
                      <div
                        class="text-xs text-gray-500 dark:text-gray-400 mt-1"
                      >
                        {new Date(chat.updated).toLocaleDateString()}
                        {new Date(chat.updated).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>
        <button
          on:click={() => toggleFullscreen()}
          class="cursor-pointer p-2 rounded sm:hover:bg-gray-300 dark:sm:hover:bg-gray-800 transition-colors"
          title={isFullscreen ? "Shrink window" : "Expand window"}
          aria-label={isFullscreen ? "Shrink window" : "Expand window"}
        >
          {#if isFullscreen}
            <!-- Shrink icon -->
            <svg
              class="w-4 h-4 text-gray-600 dark:text-gray-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M8 3v3a2 2 0 0 1-2 2H3" />
              <path d="m3 3 5 5" />
              <path d="M8 21v-3a2 2 0 0 1 2-2h3" />
              <path d="m8 21 5-5" />
              <path d="M16 3h3a2 2 0 0 1 2 2v3" />
              <path d="m16 3 5 5" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
              <path d="m16 21 5-5" />
            </svg>
          {:else}
            <!-- Expand icon -->
            <svg
              class="w-4 h-4 text-gray-600 dark:text-gray-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M15 3h6v6" />
              <path d="m21 3-7 7" />
              <path d="M9 21H3v-6" />
              <path d="m3 21 7-7" />
              <path d="M22 12h-7" />
              <path d="M3 12h7" />
              <path d="M12 3v7" />
              <path d="M12 22v-7" />
            </svg>
          {/if}
        </button>
        <button
          on:click={closeChat}
          class="cursor-pointer p-2 rounded sm:hover:bg-gray-300 dark:sm:hover:bg-gray-800 transition-colors"
          title="Close (Esc)"
          aria-label="Close"
        >
          <X class="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    </header>

    <!-- Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- messages -->
      <div
        bind:this={chatContainer}
        class="flex-1 px-6 py-6 space-y-6 overflow-y-auto overflow-x-hidden scroll-smooth bg-white dark:bg-default text-gray-900 dark:text-white"
        style="will-change: scroll-position; contain: layout style paint;"
      >
        {#each messages as message, index (`${chatId || "temp"}-${index}-${message.role}`)}
          {#if index === messages.length - 1 && message.role === "system" && isLoading}
            <ChatMessage
              {message}
              {index}
              isLoading={true}
              {isStreaming}
              {editable}
              isEditMode={editingMessageIndex === index}
              isLatestSystemMessage={index === messages.length - 1}
              allMessages={messages}
              showSources={false}
              showPlots={false}
              showRelatedQuestions={false}
              assistant={true}
              {chatId}
              on:rewrite={rewriteResponse}
              on:edit={editMessage}
              on:start-edit={handleStartEdit}
              on:cancel-edit={handleCancelEdit}
              on:related-question={handleRelatedQuestionClick}
            />
          {:else}
            <ChatMessage
              {message}
              {index}
              isLoading={false}
              isStreaming={index === messages.length - 1 &&
                message.role === "system" &&
                isStreaming}
              {editable}
              isEditMode={editingMessageIndex === index}
              isLatestSystemMessage={index === messages.length - 1}
              allMessages={messages}
              showSources={false}
              showPlots={false}
              showRelatedQuestions={false}
              assistant={true}
              {chatId}
              on:rewrite={rewriteResponse}
              on:edit={editMessage}
              on:start-edit={handleStartEdit}
              on:cancel-edit={handleCancelEdit}
              on:related-question={handleRelatedQuestionClick}
            />
          {/if}
        {/each}

        <div bind:this={bottomEl} />
      </div>

      <!-- Input area -->
      <div
        class="px-6 py-4 border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-default/50"
      >
        <div
          class="block p-4 w-full border border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-gray-50 dark:bg-[#2A2E39] shadow-sm"
        >
          <div
            bind:this={editorDiv}
            role="textbox"
            aria-label="Message input"
            aria-multiline="true"
            class="assistant-editor editor-container ml-2 bg-gray-50 dark:bg-[#2A2E39] w-full min-h-[60px] text-sm"
            on:keydown={handleKeyDown}
          />

          <!-- Suggestions Dropdown -->
          {#if showSuggestions}
            <ul
              class="absolute bg-white dark:bg-default rounded-[5px] shadow border border-gray-300 dark:border-gray-600 mt-1 z-60 w-56 h-fit max-h-56 overflow-y-auto scroller"
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
                    class="order-first relative inline-block text-left cursor-pointer shadow"
                  >
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="w-full bg-white dark:bg-secondary text-gray-800 sm:hover:text-black dark:text-gray-200 dark:sm:hover:text-white ease-out flex flex-row justify-between items-center  rounded truncate"
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
                        class="w-64 h-fit max-h-56 overflow-y-auto scroller"
                      >
                        {#if selectedGroup === "overview"}
                          {#if data?.user}
                            <DropdownMenu.Label
                              class="text-muted dark:text-gray-400 font-semibold dark:font-normal text-xs"
                            >
                              {data?.user?.credits} Credits left
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
                              class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                            >
                              <div
                                class="flex flex-row items-center w-full text-sm"
                              >
                                <span>Stock Agents</span>
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
                            <div class="w-full p-1 flex items-stretch gap-1">
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
                                class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                              >
                                <div class="flex flex-row items-center w-full">
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
                              class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                            >
                              <div
                                class="flex flex-row items-center w-full text-sm"
                              >
                                <span>How to Use Agents correctly</span>
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
                            <div class="w-full p-1 flex items-stretch gap-1">
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

                  <button
                    on:click={() =>
                      editorText?.trim()?.length > 0 &&
                      !isLoading &&
                      !isStreaming
                        ? llmChat()
                        : ""}
                    class="{editorText?.trim()?.length > 0 &&
                    !isLoading &&
                    !isStreaming
                      ? 'cursor-pointer bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100'
                      : 'cursor-not-allowed opacity-60 bg-gray-400'} py-2 text-white dark:text-black text-[1rem] rounded border-0 px-3 transition-colors duration-200 shadow-sm"
                    type="button"
                  >
                    {#if isLoading || isStreaming}
                      <svg
                        class="w-4 h-4 animate-spin text-white dark:text-black"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-dasharray="31.416"
                          stroke-dashoffset="31.416"
                        >
                          <animate
                            attributeName="stroke-dasharray"
                            dur="2s"
                            values="0 31.416;15.708 15.708;0 31.416"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="stroke-dashoffset"
                            dur="2s"
                            values="0;-15.708;-31.416"
                            repeatCount="indefinite"
                          />
                        </circle>
                      </svg>
                    {:else}
                      <ArrowUp
                        class="w-4 h-4 text-center m-auto flex justify-center items-center text-white dark:text-black"
                      />
                    {/if}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </aside>
{/if}

<!-- Login Popup - Load when user is not logged in -->
{#if !userData}
  {#await import("$lib/components/LoginPopup.svelte") then { default: LoginPopup }}
    <svelte:component this={LoginPopup} form={null} />
  {/await}
{/if}

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

  .assistant-editor :global(.ProseMirror) {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
    min-height: 56px;
    white-space: pre-wrap;
    word-break: break-word;
    padding: 0;
    line-height: 1.5;
    font-size: 14px;
    color: #374151; /* gray-700 for light mode */
  }

  :global(.dark) .assistant-editor :global(.ProseMirror) {
    color: #ffffff; /* white for dark mode */
  }

  .assistant-editor :global(.ProseMirror:focus) {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
  }

  .assistant-editor :global(.ProseMirror:focus-visible) {
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

  .assistant-editor :global(.ProseMirror p) {
    margin: 0;
    line-height: inherit;
  }
  .assistant-editor :global(.ProseMirror .text-blue-800) {
    color: rgb(30 64 175) !important;
  }
  .assistant-editor :global(.dark .ProseMirror .text-blue-400) {
    color: rgb(96 165 250) !important;
  }

  /* Enhanced scrollbar styling */
  :global(.overflow-y-auto::-webkit-scrollbar) {
    width: 6px;
    height: 6px;
  }
  :global(.overflow-y-auto::-webkit-scrollbar-track) {
    background: transparent;
  }
  :global(.overflow-y-auto::-webkit-scrollbar-thumb) {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
    transition: background 0.2s;
  }
  :global(.dark .overflow-y-auto::-webkit-scrollbar-thumb) {
    background: rgba(255, 255, 255, 0.2);
  }
  :global(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
    background: rgba(0, 0, 0, 0.3);
  }
  :global(.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover) {
    background: rgba(255, 255, 255, 0.3);
  }

  /* Smooth animations */
  .transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Custom backdrop blur effects */
  @supports (backdrop-filter: blur(20px)) {
    .backdrop-blur-custom {
      backdrop-filter: blur(20px) saturate(180%);
    }
  }

  /* Enhanced focus states */
  .focus-ring {
    @apply focus:outline-none;
  }
  .focus-ring:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
  }

  /* Smooth entrance animation */
  .slide-in-right {
    animation: slideInRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  }

  @keyframes slideInRight {
    0% {
      transform: translateX(100%);
      opacity: 0;
    }
    100% {
      transform: translateX(0);
      opacity: 1;
    }
  }
</style>
