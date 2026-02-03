<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto, invalidateAll } from "$app/navigation";
  import { getImageURL } from "$lib/utils";
  import { toast } from "svelte-sonner";
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
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
    chainCommands,
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

  // Icons
  import Undo2 from "lucide-svelte/icons/undo-2";
  import Redo2 from "lucide-svelte/icons/redo-2";
  import Bold from "lucide-svelte/icons/bold";
  import Italic from "lucide-svelte/icons/italic";
  import Strikethrough from "lucide-svelte/icons/strikethrough";
  import Code from "lucide-svelte/icons/code";
  import Link from "lucide-svelte/icons/link";
  import ImageIcon from "lucide-svelte/icons/image";
  import List from "lucide-svelte/icons/list";
  import ListOrdered from "lucide-svelte/icons/list-ordered";
  import Quote from "lucide-svelte/icons/quote";
  import ChevronDown from "lucide-svelte/icons/chevron-down";
  import Settings from "lucide-svelte/icons/settings";
  import Eye from "lucide-svelte/icons/eye";
  import X from "lucide-svelte/icons/x";
  import Plus from "lucide-svelte/icons/plus";
  import ArrowLeft from "lucide-svelte/icons/arrow-left";
  import Upload from "lucide-svelte/icons/upload";
  import Check from "lucide-svelte/icons/check";

  export let data;

  // Form state
  let title = data.article?.title || "";
  let subtitle = data.article?.abstract || "";
  let description = data.article?.description || "";

  // Tags state - predefined options from PocketBase schema
  const availableTags = ["Stocks", "ETF", "Options", "Sentiment"];
  let tags: string[] = (() => {
    const t = data.article?.tags;
    if (!t) return [];
    if (Array.isArray(t)) return t;
    if (typeof t === "string") return t.split(",").filter(Boolean);
    return [];
  })();

  // Cover image state
  let coverFile: File | null = null;
  let coverPreview = data.article?.cover
    ? getImageURL(data.article.collectionId, data.article.id, data.article.cover)
    : "";
  let removeCover = false;
  let showCoverUpload = false;

  // Editor state
  let editorDiv: HTMLDivElement;
  let editorView: EditorView | null = null;
  let isSaving = false;
  let formEl: HTMLFormElement;
  let currentArticleId: string | null = data.article?.id || null;

  // UI state
  let showStyleDropdown = false;
  let showSettingsPanel = false;
  let showPreview = false;
  let showImageUploadModal = false;
  let isUploadingImage = false;
  let imageFileInput: HTMLInputElement;

  // Markdown converter for preview
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

  // Security: Sanitize HTML
  function sanitizeHtml(html: string): string {
    if (typeof window === "undefined" || typeof DOMParser === "undefined") {
      return "";
    }
    const doc = new DOMParser().parseFromString(html, "text/html");
    const dangerousTags = ["script", "iframe", "object", "embed", "form"];
    dangerousTags.forEach((tag) => {
      doc.querySelectorAll(tag).forEach((el) => el.remove());
    });
    
    // Apply saved widths from title attributes to images
    doc.querySelectorAll('img').forEach((img) => {
      const title = img.getAttribute('title') || '';
      const widthMatch = title.match(/^width:(\d+)\|?/);
      if (widthMatch) {
        img.style.width = `${widthMatch[1]}px`;
        img.style.height = 'auto';
        // Clean up title for display
        const cleanTitle = title.replace(/^width:\d+\|?/, '');
        if (cleanTitle) {
          img.setAttribute('title', cleanTitle);
        } else {
          img.removeAttribute('title');
        }
      }
    });
    
    return doc.body.innerHTML;
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

  // Build input rules
  function buildInputRules() {
    const rules: InputRule[] = [];
    rules.push(wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote));
    rules.push(wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bullet_list));
    rules.push(
      wrappingInputRule(/^(\d+)\.\s$/, schema.nodes.ordered_list, (match) => ({
        order: parseInt(match[1], 10),
      })),
    );
    rules.push(textblockTypeInputRule(/^```$/, schema.nodes.code_block));
    rules.push(
      textblockTypeInputRule(/^(#{1,6})\s$/, schema.nodes.heading, (match) => ({
        level: match[1].length,
      })),
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
        placeholderPlugin("Start writing..."),
      ],
    });
  }

  // Initialize editor
  function initEditor() {
    if (!editorDiv || editorView) return;

    editorView = new EditorView(editorDiv, {
      state: createEditorState(description),
      dispatchTransaction(transaction) {
        if (!editorView) return;
        const newState = editorView.state.apply(transaction);
        editorView.updateState(newState);
        description = defaultMarkdownSerializer.serialize(newState.doc);
      },
    });
  }

  // Svelte action to initialize editor when element is mounted
  function initEditorAction(node: HTMLDivElement) {
    editorDiv = node;
    // Destroy any existing editor first
    if (editorView) {
      editorView.destroy();
      editorView = null;
    }
    // Create new editor
    editorView = new EditorView(node, {
      state: createEditorState(description),
      dispatchTransaction(transaction) {
        if (!editorView) return;
        const newState = editorView.state.apply(transaction);
        editorView.updateState(newState);
        description = defaultMarkdownSerializer.serialize(newState.doc);
        
        // Re-apply image widths after DOM updates
        if (transaction.docChanged) {
          setTimeout(() => setupImageResizeHandlers(), 50);
        }
      },
    });
    
    // Initial setup for existing images
    setTimeout(() => setupImageResizeHandlers(), 100);

    return {
      destroy() {
        if (editorView) {
          editorView.destroy();
          editorView = null;
        }
      }
    };
  }

  // Destroy editor
  function destroyEditor() {
    if (editorView) {
      editorView.destroy();
      editorView = null;
    }
  }

  // Toolbar commands
  function execCommand(command: (state: EditorState, dispatch?: any) => boolean) {
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
    showStyleDropdown = false;
  }

  function setParagraph() {
    execCommand(setBlockType(schema.nodes.paragraph));
    showStyleDropdown = false;
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

    const { state, dispatch } = editorView;
    const { from, to, empty } = state.selection;

    if (empty) {
      const linkMark = schema.marks.link.create({ href: url });
      const textNode = schema.text(url, [linkMark]);
      dispatch(state.tr.replaceSelectionWith(textNode));
    } else {
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

  // Image resize state
  let resizingImage: HTMLImageElement | null = null;
  let resizeStartX = 0;
  let resizeStartWidth = 0;

  // Insert image into editor at cursor position
  function insertImageAtCursor(imageUrl: string, altText: string = "image") {
    if (!editorView) return;
    
    const { state, dispatch } = editorView;
    
    // Try to insert as image node first
    if (schema.nodes.image) {
      const imageNode = schema.nodes.image.create({ src: imageUrl, alt: altText });
      const paragraph = schema.nodes.paragraph.create(null, imageNode);
      dispatch(state.tr.replaceSelectionWith(paragraph));
    } else {
      // Fallback: insert markdown syntax as text
      const imageMarkdown = `![${altText}](${imageUrl})`;
      const textNode = schema.text(imageMarkdown);
      dispatch(state.tr.replaceSelectionWith(textNode));
    }
    
    editorView.focus();
    
    // Add resize handlers to newly inserted images after a short delay
    setTimeout(() => setupImageResizeHandlers(), 100);
  }

  // Setup resize handlers for all images in the editor
  function setupImageResizeHandlers() {
    if (!editorDiv) return;
    
    const images = editorDiv.querySelectorAll('.ProseMirror img');
    images.forEach((img) => {
      const imgEl = img as HTMLImageElement;
      
      // Make image resizable via CSS
      imgEl.style.cursor = 'default';
      imgEl.classList.add('resizable-image');
      
      // Apply saved width from title attribute
      const title = imgEl.getAttribute('title') || '';
      const widthMatch = title.match(/^width:(\d+)\|?/);
      if (widthMatch) {
        imgEl.style.width = `${widthMatch[1]}px`;
        imgEl.style.height = 'auto';
      }
    });
  }

  // Handle mouse down on image for resize
  function handleEditorMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      
      // Add resizable class if not present
      if (!img.classList.contains('resizable-image')) {
        img.classList.add('resizable-image');
      }
      
      event.preventDefault();
      resizingImage = img;
      resizeStartX = event.clientX;
      resizeStartWidth = img.offsetWidth || img.naturalWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }
  }

  // Handle mouse move for resize
  function handleMouseMove(event: MouseEvent) {
    if (!resizingImage) return;
    
    const diff = event.clientX - resizeStartX;
    const newWidth = Math.max(100, Math.min(resizeStartWidth + diff, editorDiv?.offsetWidth || 800));
    resizingImage.style.width = `${newWidth}px`;
    resizingImage.style.height = 'auto';
  }

  // Handle mouse up to stop resize
  function handleMouseUp() {
    if (resizingImage && editorView) {
      const img = resizingImage;
      const newWidth = img.offsetWidth;
      
      // Find the image node in ProseMirror and update its title with width info
      const { state } = editorView;
      let imagePos: number | null = null;
      
      state.doc.descendants((node, pos) => {
        if (node.type.name === 'image' && node.attrs.src === img.src) {
          imagePos = pos;
          return false;
        }
        return true;
      });
      
      if (imagePos !== null) {
        // Store width in title attribute as "width:XXX|original title"
        const currentTitle = state.doc.nodeAt(imagePos)?.attrs.title || '';
        const titleWithoutWidth = currentTitle.replace(/^width:\d+\|?/, '');
        const newTitle = `width:${newWidth}|${titleWithoutWidth}`;
        
        const tr = state.tr.setNodeMarkup(imagePos, undefined, {
          ...state.doc.nodeAt(imagePos)?.attrs,
          title: newTitle,
        });
        editorView.dispatch(tr);
        
        // Update description
        description = defaultMarkdownSerializer.serialize(editorView.state.doc);
      }
      
      resizingImage = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }

  // Handle inline image upload
  async function handleInlineImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }

    isUploadingImage = true;
    showImageUploadModal = false;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("?/uploadImage", {
        method: "POST",
        body: formData,
        headers: {
          "x-sveltekit-action": "true",
        },
      });

      const text = await response.text();
      console.log("Upload response:", text);
      
      let result;
      
      try {
        result = JSON.parse(text);
      } catch {
        console.error("Failed to parse response:", text);
        toast.error("Invalid response from server");
        return;
      }
      
      console.log("Parsed result:", result);
      
      // SvelteKit action response format uses "devalue" serialization
      // Format: { type: "success", status: 200, data: "[{schema}, ...values]" }
      let data = result.data;
      let url: string | null = null;
      let error: string | null = null;
      let articleId: string | null = null;
      
      // SvelteKit serializes the data as a JSON string using devalue format
      if (typeof data === "string") {
        try {
          const parsed = JSON.parse(data);
          // Devalue format: [{key: index, ...}, value1, value2, ...]
          // e.g., [{"success":1,"url":2,"articleId":3}, true, "http://...", "articleId"]
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
            const schema = parsed[0];
            // Extract values using the schema indices
            if (schema.url !== undefined) {
              url = parsed[schema.url];
            }
            if (schema.error !== undefined) {
              error = parsed[schema.error];
            }
            if (schema.articleId !== undefined) {
              articleId = parsed[schema.articleId];
            }
          }
        } catch {
          // data is not JSON string, use as is
        }
      }
      
      if (url) {
        insertImageAtCursor(url, file.name.replace(/\.[^/.]+$/, ""));
        toast.success("Image uploaded");
        
        // If a new article was created during image upload, update the URL
        if (articleId && !currentArticleId) {
          currentArticleId = articleId;
          window.history.replaceState({}, "", `/learning-center/editor/${currentArticleId}`);
        }
      } else if (error) {
        console.error("Upload failed:", error);
        toast.error(error);
      } else {
        console.error("Upload failed - no URL in response:", result);
        toast.error("Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      isUploadingImage = false;
      // Reset input
      if (input) input.value = "";
    }
  }

  // Handle image drop in editor
  async function handleImageDrop(event: DragEvent) {
    if (!event.dataTransfer?.files?.length) return;
    
    const file = event.dataTransfer.files[0];
    if (!file.type.startsWith("image/")) return;

    event.preventDefault();
    
    // Create a fake event for reuse
    const fakeInput = { files: [file], value: "" } as unknown as HTMLInputElement;
    const fakeEvent = { target: fakeInput } as unknown as Event;
    await handleInlineImageUpload(fakeEvent);
  }

  // Open image upload
  function openImageUpload() {
    showImageUploadModal = true;
  }

  function handleTagKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  }

  // Cover image handling
  function handleCoverSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      coverFile = input.files[0];
      coverPreview = URL.createObjectURL(coverFile);
      removeCover = false;
      showCoverUpload = false;
    }
  }

  function handleCoverDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        coverFile = file;
        coverPreview = URL.createObjectURL(coverFile);
        removeCover = false;
        showCoverUpload = false;
      }
    }
  }

  function handleRemoveCover() {
    coverFile = null;
    coverPreview = "";
    removeCover = true;
  }

  // Preview HTML
  $: previewHtml = showPreview
    ? sanitizeHtml(getConverter().makeHtml(description || ""))
    : "";

  // Close dropdowns on outside click
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(".style-dropdown")) {
      showStyleDropdown = false;
    }
  }

  // Handle Ctrl+S to save
  function handleKeyboardSave(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === "s") {
      event.preventDefault();
      if (!isSaving && formEl) {
        formEl.requestSubmit();
      }
    }
  }

  // Lifecycle
  onMount(() => {
    document.addEventListener("click", handleClickOutside);
    if (browser) {
      document.addEventListener("keydown", handleKeyboardSave);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
  });

  onDestroy(() => {
    destroyEditor();
    if (typeof document !== "undefined") {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyboardSave);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
  });
</script>

<svelte:head>
  <title>{data.isNew ? "New Article" : "Edit Article"} - Learning Center Editor</title>
</svelte:head>

<div class="min-h-screen bg-white dark:bg-[#09090B]">
  <!-- Top Toolbar -->
  <div class="sticky top-0 z-40 bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-sm border-b border-gray-200 dark:border-zinc-800">
    <div class="max-w-4xl mx-auto px-4 sm:px-6">
      <div class="flex items-center justify-between h-14">
        <!-- Left: Back + Undo/Redo -->
        <div class="flex items-center gap-1">
          <a
            href="/learning-center/editor"
            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
          >
            <ArrowLeft class="w-5 h-5" />
          </a>
          
          <div class="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1"></div>
          
          <button
            type="button"
            on:click={execUndo}
            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
            title="Undo"
          >
            <Undo2 class="w-4 h-4" />
          </button>
          <button
            type="button"
            on:click={execRedo}
            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
            title="Redo"
          >
            <Redo2 class="w-4 h-4" />
          </button>

          <div class="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1"></div>

          <!-- Style Dropdown -->
          <div class="relative style-dropdown">
            <button
              type="button"
              on:click|stopPropagation={() => (showStyleDropdown = !showStyleDropdown)}
              class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
            >
              Style
              <ChevronDown class="w-3 h-3" />
            </button>
            {#if showStyleDropdown}
              <div class="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 py-1 z-50">
                <button
                  type="button"
                  on:click={() => setParagraph()}
                  class="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  Paragraph
                </button>
                <button
                  type="button"
                  on:click={() => setHeading(1)}
                  class="w-full px-3 py-2 text-left text-lg font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  Heading 1
                </button>
                <button
                  type="button"
                  on:click={() => setHeading(2)}
                  class="w-full px-3 py-2 text-left text-base font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  Heading 2
                </button>
                <button
                  type="button"
                  on:click={() => setHeading(3)}
                  class="w-full px-3 py-2 text-left text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  Heading 3
                </button>
              </div>
            {/if}
          </div>

          <div class="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1"></div>

          <!-- Formatting -->
          <button type="button" on:click={toggleBold} class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition" title="Bold">
            <Bold class="w-4 h-4" />
          </button>
          <button type="button" on:click={toggleItalic} class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition" title="Italic">
            <Italic class="w-4 h-4" />
          </button>
          <button type="button" on:click={toggleCode} class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition" title="Code">
            <Code class="w-4 h-4" />
          </button>

          <div class="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1"></div>

          <!-- Media & Links -->
          <button type="button" on:click={insertLink} class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition" title="Link">
            <Link class="w-4 h-4" />
          </button>
          <button type="button" on:click={openImageUpload} class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition {isUploadingImage ? 'opacity-50' : ''}" title="Insert Image" disabled={isUploadingImage}>
            {#if isUploadingImage}
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            {:else}
              <ImageIcon class="w-4 h-4" />
            {/if}
          </button>
          <button type="button" on:click={toggleBlockquote} class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition" title="Quote">
            <Quote class="w-4 h-4" />
          </button>

          <div class="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1"></div>

          <!-- Lists -->
          <button type="button" on:click={toggleBulletList} class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition" title="Bullet List">
            <List class="w-4 h-4" />
          </button>
          <button type="button" on:click={toggleOrderedList} class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition" title="Numbered List">
            <ListOrdered class="w-4 h-4" />
          </button>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            on:click={() => (showPreview = !showPreview)}
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition {showPreview ? 'bg-gray-100 dark:bg-zinc-800' : ''}"
          >
            <Eye class="w-4 h-4" />
            <span class="hidden sm:inline">Preview</span>
          </button>

          <button
            type="button"
            on:click={() => (showSettingsPanel = !showSettingsPanel)}
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition {showSettingsPanel ? 'bg-gray-100 dark:bg-zinc-800' : ''}"
          >
            <Settings class="w-4 h-4" />
            <span class="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="flex">
    <!-- Editor Area -->
    <div class="flex-1 min-h-[calc(100vh-3.5rem)]">
      <form
        bind:this={formEl}
        method="POST"
        action="?/saveArticle"
        enctype="multipart/form-data"
        on:keydown={(e) => e.key === "Enter" && e.target instanceof HTMLInputElement && e.preventDefault()}
        use:enhance={() => {
          isSaving = true;
          return async ({ result, update }) => {
            isSaving = false;
            if (result.type === "success") {
              toast.success("Saved");
              // If this was a new article, update the URL to the new article ID
              if (result.data?.articleId && !currentArticleId) {
                currentArticleId = result.data.articleId;
                // Update URL without full navigation
                window.history.replaceState({}, "", `/learning-center/editor/${currentArticleId}`);
              }
              // Stay on page - just invalidate data
              await invalidateAll();
            } else {
              toast.error("Failed to save article");
            }
          };
        }}
        class="max-w-3xl mx-auto px-6 py-12"
      >
        <!-- Cover Image Area -->
        {#if coverPreview && !removeCover}
          <div class="relative mb-8 group">
            <img
              src={coverPreview}
              alt="Cover"
              class="w-full h-64 object-cover rounded-lg"
            />
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-3">
              <label class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm cursor-pointer transition">
                Change
                <input type="file" accept="image/*" on:change={handleCoverSelect} class="hidden" />
              </label>
              <button
                type="button"
                on:click={handleRemoveCover}
                class="px-4 py-2 bg-white/20 hover:bg-red-500/50 rounded-lg text-white text-sm transition"
              >
                Remove
              </button>
            </div>
          </div>
        {/if}

        <!-- Title -->
        <input
          type="text"
          name="title"
          bind:value={title}
          placeholder="Title"
          required
          on:keydown={(e) => e.key === "Enter" && e.preventDefault()}
          class="w-full text-4xl sm:text-5xl font-serif font-light text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-zinc-600 bg-transparent border-none outline-none mb-4"
        />

        <!-- Subtitle -->
        <input
          type="text"
          name="abstract"
          bind:value={subtitle}
          placeholder="Add a subtitle..."
          on:keydown={(e) => e.key === "Enter" && e.preventDefault()}
          class="w-full text-xl text-gray-500 dark:text-zinc-400 placeholder:text-gray-300 dark:placeholder:text-zinc-600 bg-transparent border-none outline-none mb-6"
        />

        <!-- Tags -->
        <div class="flex flex-wrap items-center gap-2 mb-8">
          {#each availableTags as tag}
            <button
              type="button"
              on:click={() => {
                if (tags.includes(tag)) {
                  tags = tags.filter(t => t !== tag);
                } else if (tags.length < 3) {
                  tags = [...tags, tag];
                }
              }}
              class="px-3 py-1.5 rounded-full text-sm transition {tags.includes(tag) 
                ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700' 
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-transparent hover:border-gray-300 dark:hover:border-zinc-600'}"
            >
              {tag}
            </button>
          {/each}
          <span class="text-xs text-gray-400 dark:text-zinc-500 ml-2">
            {tags.length}/3 selected
          </span>
        </div>

        <!-- Hidden tags input - send as JSON array for PocketBase select field -->
        <input type="hidden" name="tags" value={JSON.stringify(tags)} />

        <!-- Divider -->
        <div class="w-12 h-px bg-gray-200 dark:bg-zinc-700 mb-8"></div>

        <!-- Content Editor -->
        {#if showPreview}
          <div class="prose prose-lg dark:prose-invert max-w-none min-h-[400px]">
            {#if previewHtml}
              {@html previewHtml}
            {:else}
              <p class="text-gray-300 dark:text-zinc-600 italic">No content yet...</p>
            {/if}
          </div>
        {:else}
          {#key showPreview}
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div 
              bind:this={editorDiv} 
              class="minimal-editor"
              use:initEditorAction
              on:mousedown={handleEditorMouseDown}
            ></div>
          {/key}
        {/if}

        <!-- Hidden content input -->
        <input type="hidden" name="description" value={description} />
        <input type="hidden" name="removeCover" value={removeCover.toString()} />

        <!-- Floating Save Button -->
        <div class="fixed bottom-8 right-8 flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            class="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium shadow-lg hover:shadow-xl transition disabled:opacity-50"
          >
            {#if isSaving}
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            {:else}
              <Check class="w-4 h-4" />
              Save
            {/if}
          </button>
        </div>
      </form>
    </div>

    <!-- Settings Panel (Slide-in) -->
    {#if showSettingsPanel}
      <div class="w-80 border-l border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 min-h-[calc(100vh-3.5rem)] p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-semibold text-gray-900 dark:text-white">Settings</h3>
          <button
            type="button"
            on:click={() => (showSettingsPanel = false)}
            class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-6">
          <!-- Cover Image -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
              Cover Image
            </label>
            {#if coverPreview && !removeCover}
              <div class="relative">
                <img src={coverPreview} alt="Cover" class="w-full h-32 object-cover rounded-lg" />
                <button
                  type="button"
                  on:click={handleRemoveCover}
                  class="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            {:else}
              <label
                class="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-zinc-600 transition"
                on:dragover|preventDefault
                on:drop={handleCoverDrop}
              >
                <Upload class="w-6 h-6 text-gray-400 mb-2" />
                <span class="text-sm text-gray-500 dark:text-zinc-400">Upload cover</span>
                <input type="file" name="cover" accept="image/*" on:change={handleCoverSelect} class="hidden" />
              </label>
            {/if}
          </div>

          <!-- Tags Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
              Tags
            </label>
            <div class="flex flex-wrap gap-2">
              {#each availableTags as tag}
                <button
                  type="button"
                  on:click={() => {
                    if (tags.includes(tag)) {
                      tags = tags.filter(t => t !== tag);
                    } else if (tags.length < 3) {
                      tags = [...tags, tag];
                    }
                  }}
                  class="px-3 py-1.5 rounded-full text-sm transition {tags.includes(tag) 
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700' 
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-transparent hover:border-gray-300 dark:hover:border-zinc-600'}"
                >
                  {tag}
                </button>
              {/each}
            </div>
            <p class="text-xs text-gray-400 dark:text-zinc-500 mt-2">
              {tags.length}/3 selected
            </p>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Inline Image Upload Modal -->
{#if showImageUploadModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <button
      on:click={() => (showImageUploadModal = false)}
      class="absolute inset-0 bg-black/50"
    ></button>
    <div class="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl">
      <button
        on:click={() => (showImageUploadModal = false)}
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
      >
        <X class="w-5 h-5" />
      </button>
      
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Insert Image</h3>
      
      <label
        class="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-violet-500 dark:hover:border-violet-500 transition"
        on:dragover|preventDefault
        on:drop={(e) => { showImageUploadModal = false; handleImageDrop(e); }}
      >
        <Upload class="w-10 h-10 text-gray-400 mb-3" />
        <span class="text-gray-600 dark:text-zinc-400">Drag & drop or click to upload</span>
        <span class="text-sm text-gray-400 dark:text-zinc-500 mt-1">PNG, JPG, GIF, WebP up to 5MB</span>
        <input 
          bind:this={imageFileInput}
          type="file" 
          accept="image/jpeg,image/png,image/gif,image/webp" 
          on:change={handleInlineImageUpload} 
          class="hidden" 
        />
      </label>
      
      <p class="text-xs text-gray-400 dark:text-zinc-500 mt-3 text-center">
        Image will be inserted at cursor position
      </p>
    </div>
  </div>
{/if}

<style>
  /* Minimal Editor Styles */
  :global(.minimal-editor) {
    min-height: 400px;
  }

  :global(.minimal-editor .ProseMirror) {
    outline: none;
    min-height: 400px;
    font-size: 1.125rem;
    line-height: 1.8;
    color: #374151;
  }

  :global(.dark .minimal-editor .ProseMirror) {
    color: #d4d4d8;
  }

  :global(.minimal-editor .ProseMirror p) {
    margin: 0.75rem 0;
  }

  :global(.minimal-editor .ProseMirror h1) {
    font-size: 2rem;
    font-weight: 700;
    margin: 2rem 0 1rem;
    color: #111827;
  }

  :global(.dark .minimal-editor .ProseMirror h1) {
    color: #ffffff;
  }

  :global(.minimal-editor .ProseMirror h2) {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 1.75rem 0 0.75rem;
    color: #111827;
  }

  :global(.dark .minimal-editor .ProseMirror h2) {
    color: #ffffff;
  }

  :global(.minimal-editor .ProseMirror h3) {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 1.5rem 0 0.5rem;
    color: #111827;
  }

  :global(.dark .minimal-editor .ProseMirror h3) {
    color: #ffffff;
  }

  :global(.minimal-editor .ProseMirror blockquote) {
    border-left: 3px solid #d1d5db;
    padding-left: 1rem;
    margin: 1.5rem 0;
    color: #6b7280;
    font-style: italic;
  }

  :global(.dark .minimal-editor .ProseMirror blockquote) {
    border-left-color: #52525b;
    color: #a1a1aa;
  }

  :global(.minimal-editor .ProseMirror code) {
    background: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: ui-monospace, monospace;
    font-size: 0.9em;
  }

  :global(.dark .minimal-editor .ProseMirror code) {
    background: #27272a;
  }

  :global(.minimal-editor .ProseMirror pre) {
    background: #1f2937;
    color: #e5e7eb;
    padding: 1rem;
    border-radius: 0.5rem;
    margin: 1.5rem 0;
    overflow-x: auto;
    font-size: 0.9rem;
  }

  :global(.minimal-editor .ProseMirror ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.75rem 0;
  }

  :global(.minimal-editor .ProseMirror ol) {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 0.75rem 0;
  }

  :global(.minimal-editor .ProseMirror li) {
    margin: 0.375rem 0;
  }

  :global(.minimal-editor .ProseMirror a) {
    color: #2563eb;
    text-decoration: underline;
  }

  :global(.dark .minimal-editor .ProseMirror a) {
    color: #60a5fa;
  }

  :global(.minimal-editor .ProseMirror .placeholder::before) {
    content: attr(data-placeholder);
    position: absolute;
    color: #d1d5db;
    pointer-events: none;
    font-size: 1.125rem;
  }

  :global(.dark .minimal-editor .ProseMirror .placeholder::before) {
    color: #52525b;
  }

  :global(.minimal-editor .ProseMirror img) {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 1.5rem 0;
    display: block;
    transition: box-shadow 0.15s ease, transform 0.1s ease;
  }

  :global(.minimal-editor .ProseMirror img.resizable-image) {
    cursor: default;
  }

  :global(.minimal-editor .ProseMirror img.resizable-image:hover) {
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.4);
    cursor: ew-resize;
  }

  :global(.minimal-editor .ProseMirror img.ProseMirror-selectednode) {
    outline: 2px solid #8b5cf6;
    outline-offset: 2px;
  }

  /* Preview styles */
  .prose :global(h1) {
    font-size: 2rem;
    font-weight: 700;
    margin: 2rem 0 1rem;
  }

  .prose :global(h2) {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 1.75rem 0 0.75rem;
  }

  .prose :global(h3) {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 1.5rem 0 0.5rem;
  }

  .prose :global(blockquote) {
    border-left: 3px solid #d1d5db;
    padding-left: 1rem;
    margin: 1.5rem 0;
    color: #6b7280;
    font-style: italic;
  }

  :global(.dark) .prose :global(blockquote) {
    border-left-color: #52525b;
    color: #a1a1aa;
  }

  .prose :global(code) {
    background: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: ui-monospace, monospace;
  }

  :global(.dark) .prose :global(code) {
    background: #27272a;
  }

  .prose :global(pre) {
    background: #1f2937;
    color: #e5e7eb;
    padding: 1rem;
    border-radius: 0.5rem;
    margin: 1.5rem 0;
    overflow-x: auto;
  }

  .prose :global(ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
  }

  .prose :global(ol) {
    list-style-type: decimal;
    padding-left: 1.5rem;
  }

  .prose :global(a) {
    color: #2563eb;
    text-decoration: underline;
  }

  :global(.dark) .prose :global(a) {
    color: #60a5fa;
  }
</style>
