<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { EditorState } from "prosemirror-state";
  import { EditorView } from "prosemirror-view";
  import {
    schema,
    defaultMarkdownParser,
    defaultMarkdownSerializer,
  } from "prosemirror-markdown";
  import { keymap } from "prosemirror-keymap";
  import { history, undo, redo } from "prosemirror-history";
  import {
    baseKeymap,
    toggleMark,
    setBlockType,
    wrapIn,
    lift,
    chainCommands,
    exitCode,
    createParagraphNear,
    liftEmptyBlock,
    splitBlock,
  } from "prosemirror-commands";
  import {
    inputRules,
    wrappingInputRule,
    textblockTypeInputRule,
    InputRule,
  } from "prosemirror-inputrules";
  import {
    splitListItem,
    liftListItem,
    sinkListItem,
    wrapInList,
  } from "prosemirror-schema-list";
  import { Plugin } from "prosemirror-state";
  import { Decoration, DecorationSet } from "prosemirror-view";
  import showdown from "showdown";
  import { mode } from "mode-watcher";

  // Icons
  import Bold from "lucide-svelte/icons/bold";
  import Italic from "lucide-svelte/icons/italic";
  import Heading1 from "lucide-svelte/icons/heading-1";
  import Heading2 from "lucide-svelte/icons/heading-2";
  import Heading3 from "lucide-svelte/icons/heading-3";
  import Link from "lucide-svelte/icons/link";
  import List from "lucide-svelte/icons/list";
  import ListOrdered from "lucide-svelte/icons/list-ordered";
  import Code from "lucide-svelte/icons/code";
  import Quote from "lucide-svelte/icons/quote";
  import Undo2 from "lucide-svelte/icons/undo-2";
  import Redo2 from "lucide-svelte/icons/redo-2";
  import Eye from "lucide-svelte/icons/eye";
  import Pencil from "lucide-svelte/icons/pencil";
  import X from "lucide-svelte/icons/x";

  // Props
  export let value: string = "";
  export let onSave: (markdown: string) => Promise<void>;
  export let onCancel: () => void;
  export let symbol: string;
  export let isNewNote: boolean = false;

  // State
  let isPreviewMode = !isNewNote && value.length > 0;
  let editorDiv: HTMLDivElement;
  let editorView: EditorView | null = null;
  let isSaving = false;
  let currentMarkdown = value;

  // Lazy-loaded markdown converter for preview (only created when needed)
  let converter: ReturnType<typeof showdown.Converter> | null = null;

  function getConverter() {
    if (!converter) {
      converter = new showdown.Converter({
        tables: true,
        strikethrough: true,
        tasklists: true,
        simpleLineBreaks: true,
        openLinksInNewWindow: true,
      });
    }
    return converter;
  }

  // Security: Sanitize HTML to prevent XSS attacks
  function sanitizeHtml(html: string): string {
    // Guard for SSR - DOMParser only available in browser
    if (typeof window === "undefined" || typeof DOMParser === "undefined") {
      return ""; // Return empty in SSR context
    }

    // Create a temporary element to parse the HTML
    const doc = new DOMParser().parseFromString(html, "text/html");

    // Remove dangerous elements
    const dangerousTags = [
      "script",
      "iframe",
      "object",
      "embed",
      "form",
      "input",
      "button",
      "textarea",
      "select",
      "style",
    ];
    dangerousTags.forEach((tag) => {
      doc.querySelectorAll(tag).forEach((el) => el.remove());
    });

    // Remove dangerous attributes from all elements
    const dangerousAttrs = [
      "onerror",
      "onload",
      "onclick",
      "onmouseover",
      "onmouseout",
      "onkeydown",
      "onkeyup",
      "onkeypress",
      "onfocus",
      "onblur",
      "onchange",
      "onsubmit",
      "onreset",
      "onselect",
      "oninput",
      "onanimationend",
      "ontransitionend",
    ];
    doc.querySelectorAll("*").forEach((el) => {
      // Remove event handlers
      dangerousAttrs.forEach((attr) => el.removeAttribute(attr));

      // Remove javascript: URLs from href/src
      const href = el.getAttribute("href");
      if (
        href &&
        (href.toLowerCase().startsWith("javascript:") ||
          href.toLowerCase().startsWith("data:"))
      ) {
        el.removeAttribute("href");
      }
      const src = el.getAttribute("src");
      if (
        src &&
        (src.toLowerCase().startsWith("javascript:") ||
          src.toLowerCase().startsWith("data:"))
      ) {
        el.removeAttribute("src");
      }

      // Ensure external links have security attributes
      if (el.tagName === "A" && el.getAttribute("href")?.startsWith("http")) {
        el.setAttribute("rel", "noopener noreferrer");
      }
    });

    return doc.body.innerHTML;
  }

  // Security: Validate URL to prevent javascript: protocol XSS
  function isValidUrl(url: string): boolean {
    if (!url) return false;
    const trimmed = url.trim().toLowerCase();
    // Only allow http, https, mailto, and relative URLs
    if (
      trimmed.startsWith("javascript:") ||
      trimmed.startsWith("data:") ||
      trimmed.startsWith("vbscript:")
    ) {
      return false;
    }
    // Allow http, https, mailto, tel, and relative URLs
    return (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("mailto:") ||
      trimmed.startsWith("tel:") ||
      trimmed.startsWith("/") ||
      trimmed.startsWith("#") ||
      !trimmed.includes(":")
    );
  }

  // Placeholder plugin
  function placeholderPlugin(placeholder: string) {
    return new Plugin({
      props: {
        decorations(state) {
          const doc = state.doc;
          if (
            doc.childCount === 1 &&
            doc.firstChild?.isTextblock &&
            doc.firstChild.content.size === 0
          ) {
            const decoration = Decoration.node(0, doc.firstChild.nodeSize, {
              class: "placeholder",
              "data-placeholder": placeholder,
            });
            return DecorationSet.create(doc, [decoration]);
          }
          return DecorationSet.empty;
        },
      },
    });
  }

  // Build input rules for markdown shortcuts
  function buildInputRules() {
    const rules: InputRule[] = [];

    // Blockquote: > at start of line
    rules.push(wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote));

    // Bullet list: - or * at start of line
    rules.push(wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bullet_list));

    // Ordered list: 1. at start of line
    rules.push(
      wrappingInputRule(/^(\d+)\.\s$/, schema.nodes.ordered_list, (match) => ({
        order: parseInt(match[1], 10),
      })),
    );

    // Code block: ``` at start of line
    rules.push(textblockTypeInputRule(/^```$/, schema.nodes.code_block));

    // Headings: # ## ### at start of line
    rules.push(
      textblockTypeInputRule(/^(#{1,6})\s$/, schema.nodes.heading, (match) => ({
        level: match[1].length,
      })),
    );

    // Horizontal rule: --- or ***
    rules.push(
      new InputRule(/^(?:---|___|\*\*\*)\s$/, (state, match, start, end) => {
        const tr = state.tr.replaceWith(
          start - 1,
          end,
          schema.nodes.horizontal_rule.create(),
        );
        return tr;
      }),
    );

    return inputRules({ rules });
  }

  // Create editor state
  function createEditorState(content: string) {
    const doc = content ? defaultMarkdownParser.parse(content) : undefined;

    return EditorState.create({
      doc,
      schema,
      plugins: [
        history(),
        buildInputRules(),
        keymap({
          "Mod-z": undo,
          "Mod-y": redo,
          "Mod-Shift-z": redo,
          "Mod-b": toggleMark(schema.marks.strong),
          "Mod-i": toggleMark(schema.marks.em),
          "Mod-`": toggleMark(schema.marks.code),
          "Mod-Enter": () => {
            handleSave();
            return true;
          },
          Escape: () => {
            onCancel();
            return true;
          },
          // List handling - Enter splits list items, Tab indents, Shift-Tab outdents
          Enter: chainCommands(
            splitListItem(schema.nodes.list_item),
            createParagraphNear,
            liftEmptyBlock,
            splitBlock,
          ),
          Tab: sinkListItem(schema.nodes.list_item),
          "Shift-Tab": liftListItem(schema.nodes.list_item),
        }),
        keymap(baseKeymap),
        placeholderPlugin(
          "Write your investment thesis, target price, or key reasons for watching this stock...",
        ),
      ],
    });
  }

  // Initialize editor
  function initEditor() {
    if (!editorDiv || editorView) return;

    editorView = new EditorView(editorDiv, {
      state: createEditorState(currentMarkdown),
      dispatchTransaction(transaction) {
        if (!editorView) return;
        const newState = editorView.state.apply(transaction);
        editorView.updateState(newState);
        // Update current markdown
        currentMarkdown = defaultMarkdownSerializer.serialize(newState.doc);
      },
    });

    // Focus the editor
    setTimeout(() => editorView?.focus(), 100);
  }

  // Destroy editor
  function destroyEditor() {
    if (editorView) {
      editorView.destroy();
      editorView = null;
    }
  }

  // Toggle preview mode
  function togglePreview() {
    if (isPreviewMode) {
      // Switching to edit mode
      isPreviewMode = false;
      // Reinitialize editor after DOM update
      setTimeout(() => {
        destroyEditor();
        initEditor();
      }, 0);
    } else {
      // Switching to preview mode
      isPreviewMode = true;
      destroyEditor();
    }
  }

  // Toolbar commands
  function execCommand(
    command: (state: EditorState, dispatch?: any) => boolean,
  ) {
    if (!editorView) return;
    command(editorView.state, editorView.dispatch);
    editorView.focus();
  }

  function toggleBold() {
    execCommand(toggleMark(schema.marks.strong));
  }

  function toggleItalic() {
    execCommand(toggleMark(schema.marks.em));
  }

  function toggleCode() {
    execCommand(toggleMark(schema.marks.code));
  }

  function setHeading(level: number) {
    execCommand(setBlockType(schema.nodes.heading, { level }));
  }

  function toggleBlockquote() {
    execCommand(wrapIn(schema.nodes.blockquote));
  }

  function toggleBulletList() {
    execCommand(wrapInList(schema.nodes.bullet_list));
  }

  function toggleOrderedList() {
    execCommand(wrapInList(schema.nodes.ordered_list));
  }

  function insertLink() {
    const url = prompt("Enter URL:");
    if (!url || !editorView) return;

    // Security: Validate URL to prevent XSS
    if (!isValidUrl(url)) {
      alert("Invalid URL. Please use http://, https://, or mailto: links.");
      return;
    }

    const { state, dispatch } = editorView;
    const { from, to, empty } = state.selection;

    if (empty) {
      // No selection, insert link with URL as text
      const linkMark = schema.marks.link.create({ href: url });
      const textNode = schema.text(url, [linkMark]);
      dispatch(state.tr.replaceSelectionWith(textNode));
    } else {
      // Selection exists, wrap it with link
      dispatch(
        state.tr.addMark(from, to, schema.marks.link.create({ href: url })),
      );
    }
    editorView.focus();
  }

  function execUndo() {
    execCommand(undo);
  }

  function execRedo() {
    execCommand(redo);
  }

  // Save handler
  async function handleSave() {
    if (isSaving) return;
    isSaving = true;
    try {
      await onSave(currentMarkdown);
    } finally {
      isSaving = false;
    }
  }

  // Check if there are changes
  $: hasChanges = currentMarkdown !== value;

  // Lifecycle
  onMount(() => {
    if (!isPreviewMode) {
      initEditor();
    }
  });

  onDestroy(() => {
    destroyEditor();
  });

  // Render markdown to HTML for preview (only computed when in preview mode)
  // Security: Sanitize HTML output to prevent XSS attacks
  $: previewHtml = isPreviewMode
    ? sanitizeHtml(getConverter().makeHtml(currentMarkdown || ""))
    : "";
</script>

<div class="flex flex-col h-full max-h-[80vh]">
  <!-- Header -->
  <div
    class="flex items-start justify-between pb-4 border-b border-gray-300 dark:border-zinc-700"
  >
    <div class="flex items-center gap-3">
      <div>
        <h3 class="font-semibold text-lg text-gray-900 dark:text-zinc-100">
          {isNewNote ? "New Note" : "Edit Note"}
        </h3>
        <div class="flex items-center gap-2 mt-0.5">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
          >
            {symbol}
          </span>
        </div>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <!-- Preview/Edit Toggle -->
      <button
        on:click={togglePreview}
        class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-2xl transition-colors bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
      >
        {#if isPreviewMode}
          <Pencil class="w-4 h-4" />
          Edit
        {:else}
          <Eye class="w-4 h-4" />
          Preview
        {/if}
      </button>
      <button
        on:click={onCancel}
        class="cursor-pointer p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
      >
        <X class="w-5 h-5" />
      </button>
    </div>
  </div>

  <!-- Toolbar (only in edit mode) -->
  {#if !isPreviewMode}
    <div
      class="flex flex-wrap items-center gap-1 py-2 px-1 border-b border-gray-300 dark:border-zinc-700 overflow-x-hidden"
    >
      <div class="flex items-center gap-0.5">
        <button
          on:click={toggleBold}
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold class="w-4 h-4" />
        </button>
        <button
          on:click={toggleItalic}
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic class="w-4 h-4" />
        </button>
      </div>

      <div class="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1"></div>

      <div class="flex items-center gap-0.5">
        <button
          on:click={() => setHeading(1)}
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 transition-colors"
          title="Heading 1"
        >
          <Heading1 class="w-4 h-4" />
        </button>
        <button
          on:click={() => setHeading(2)}
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 transition-colors"
          title="Heading 2"
        >
          <Heading2 class="w-4 h-4" />
        </button>
        <button
          on:click={() => setHeading(3)}
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 transition-colors"
          title="Heading 3"
        >
          <Heading3 class="w-4 h-4" />
        </button>
      </div>

      <div class="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1"></div>

      <div class="flex items-center gap-0.5">
        <button
          on:click={toggleBulletList}
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 transition-colors"
          title="Bullet List"
        >
          <List class="w-4 h-4" />
        </button>
        <button
          on:click={toggleOrderedList}
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 transition-colors"
          title="Numbered List"
        >
          <ListOrdered class="w-4 h-4" />
        </button>
      </div>

      <div class="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1"></div>

      <div class="flex items-center gap-0.5">
        <button
          on:click={insertLink}
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 transition-colors"
          title="Insert Link (Ctrl+K)"
        >
          <Link class="w-4 h-4" />
        </button>
        <button
          on:click={toggleCode}
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 transition-colors"
          title="Inline Code (Ctrl+`)"
        >
          <Code class="w-4 h-4" />
        </button>
        <button
          on:click={toggleBlockquote}
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 transition-colors"
          title="Blockquote"
        >
          <Quote class="w-4 h-4" />
        </button>
      </div>

      <div class="flex items-center gap-0.5 ml-auto">
        <button
          on:click={execUndo}
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 class="w-4 h-4" />
        </button>
        <button
          on:click={execRedo}
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 class="w-4 h-4" />
        </button>
      </div>
    </div>
  {/if}

  <!-- Editor / Preview Area -->
  <div
    class="flex-1 overflow-y-auto overflow-x-hidden min-h-[200px] max-h-[400px]"
  >
    {#if isPreviewMode}
      <!-- Preview Mode -->
      <div
        class="prose prose-sm dark:prose-invert max-w-none p-4 markdown-preview"
      >
        {#if previewHtml}
          {@html previewHtml}
        {:else}
          <p class="text-gray-400 dark:text-zinc-500 italic">
            No content yet...
          </p>
        {/if}
      </div>
    {:else}
      <!-- Edit Mode -->
      <div bind:this={editorDiv} class="prosemirror-editor"></div>
    {/if}
  </div>

  <!-- Footer -->
  <div
    class="flex items-center justify-end gap-3 pt-4 border-t border-gray-300 dark:border-zinc-700"
  >
    <button
      on:click={onCancel}
      class="cursor-pointer px-4 py-2 text-sm font-medium rounded-2xl border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
    >
      Cancel
    </button>
    <button
      on:click={handleSave}
      disabled={isSaving || (!hasChanges && !isNewNote)}
      class="cursor-pointer px-4 py-2 text-sm font-medium rounded-2xl bg-violet-600 dark:bg-violet-500 text-white hover:bg-violet-700 dark:hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      {#if isSaving}
        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        Saving...
      {:else}
        Save Note
      {/if}
    </button>
  </div>
</div>

<style>
  /* ProseMirror Editor Styles */
  :global(.prosemirror-editor) {
    height: 100%;
    min-height: 200px;
  }

  :global(.prosemirror-editor .ProseMirror) {
    outline: none;
    min-height: 200px;
    padding: 1rem;
    font-size: 0.9375rem;
    line-height: 1.6;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  :global(.prosemirror-editor .ProseMirror p) {
    margin: 0.5rem 0;
  }

  :global(.prosemirror-editor .ProseMirror h1) {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 1rem 0 0.5rem;
    line-height: 1.3;
  }

  :global(.prosemirror-editor .ProseMirror h2) {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0.875rem 0 0.5rem;
    line-height: 1.3;
  }

  :global(.prosemirror-editor .ProseMirror h3) {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0.75rem 0 0.375rem;
    line-height: 1.4;
  }

  :global(.prosemirror-editor .ProseMirror h4),
  :global(.prosemirror-editor .ProseMirror h5),
  :global(.prosemirror-editor .ProseMirror h6) {
    font-size: 1rem;
    font-weight: 600;
    margin: 0.625rem 0 0.375rem;
    line-height: 1.4;
  }

  :global(.prosemirror-editor .ProseMirror blockquote) {
    border-left: 3px solid #8b5cf6;
    padding-left: 1rem;
    margin: 0.75rem 0;
    color: #6b7280;
    font-style: italic;
  }

  :global(.dark .prosemirror-editor .ProseMirror blockquote) {
    color: #a1a1aa;
    border-left-color: #a78bfa;
  }

  :global(.prosemirror-editor .ProseMirror code) {
    background: rgba(139, 92, 246, 0.1);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: ui-monospace, monospace;
    font-size: 0.875em;
  }

  :global(.dark .prosemirror-editor .ProseMirror code) {
    background: rgba(139, 92, 246, 0.2);
  }

  :global(.prosemirror-editor .ProseMirror pre) {
    background: #1f2937;
    color: #e5e7eb;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    overflow-x: hidden;
    margin: 0.75rem 0;
    font-family: ui-monospace, monospace;
    font-size: 0.875rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
    word-break: break-word;
  }

  :global(.prosemirror-editor .ProseMirror ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }

  :global(.prosemirror-editor .ProseMirror ol) {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }

  :global(.prosemirror-editor .ProseMirror li) {
    margin: 0.25rem 0;
  }

  :global(.prosemirror-editor .ProseMirror li p) {
    margin: 0;
  }

  :global(.prosemirror-editor .ProseMirror a) {
    color: #8b5cf6;
    text-decoration: underline;
  }

  :global(.dark .prosemirror-editor .ProseMirror a) {
    color: #a78bfa;
  }

  :global(.prosemirror-editor .ProseMirror hr) {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 1rem 0;
  }

  :global(.dark .prosemirror-editor .ProseMirror hr) {
    border-top-color: #3f3f46;
  }

  /* Placeholder styling */
  :global(.prosemirror-editor .ProseMirror .placeholder) {
    position: relative;
  }

  :global(.prosemirror-editor .ProseMirror .placeholder::before) {
    content: attr(data-placeholder);
    position: absolute;
    color: #9ca3af;
    pointer-events: none;
    font-style: italic;
  }

  :global(.dark .prosemirror-editor .ProseMirror .placeholder::before) {
    color: #71717a;
  }

  /* Preview Mode Styles */
  .markdown-preview {
    font-size: 0.9375rem;
    line-height: 1.6;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .markdown-preview :global(h1) {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 1rem 0 0.5rem;
  }

  .markdown-preview :global(h2) {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0.875rem 0 0.5rem;
  }

  .markdown-preview :global(h3) {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0.75rem 0 0.375rem;
  }

  .markdown-preview :global(blockquote) {
    border-left: 3px solid #8b5cf6;
    padding-left: 1rem;
    margin: 0.75rem 0;
    color: #6b7280;
    font-style: italic;
  }

  :global(.dark) .markdown-preview :global(blockquote) {
    color: #a1a1aa;
    border-left-color: #a78bfa;
  }

  .markdown-preview :global(code) {
    background: rgba(139, 92, 246, 0.1);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: ui-monospace, monospace;
    font-size: 0.875em;
  }

  :global(.dark) .markdown-preview :global(code) {
    background: rgba(139, 92, 246, 0.2);
  }

  .markdown-preview :global(pre) {
    background: #1f2937;
    color: #e5e7eb;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    overflow-x: hidden;
    margin: 0.75rem 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    word-break: break-word;
  }

  .markdown-preview :global(pre code) {
    background: transparent;
    padding: 0;
  }

  .markdown-preview :global(ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }

  .markdown-preview :global(ol) {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }

  .markdown-preview :global(a) {
    color: #8b5cf6;
    text-decoration: underline;
  }

  :global(.dark) .markdown-preview :global(a) {
    color: #a78bfa;
  }

  .markdown-preview :global(hr) {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 1rem 0;
  }

  :global(.dark) .markdown-preview :global(hr) {
    border-top-color: #3f3f46;
  }

  .markdown-preview :global(p) {
    margin: 0.5rem 0;
  }
</style>
