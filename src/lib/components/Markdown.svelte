<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { markdownValue, markdownClicked } from "$lib/store";
  import showdown from "showdown";

  export let id;
  export let outputCounter;
  export let name;

  const converter = new showdown.Converter();

  const toolbarOptions = {
    container: [
      ["bold"],
      ["italic"],
      ["link"],
      ["image"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ],
  };

  let quill;
  let html;
  let value;

  async function initializeQuillEditor() {
    const container = document.getElementById(id);

    try {
      const { default: Quill } = await import("quill");

      quill = new Quill(container, {
        modules: {
          toolbar: toolbarOptions,
        },
        theme: "snow",
        placeholder: "Markdown your code here...",
        keepFocus: true,
      });
    } catch (e) {
      console.log(e);
    }

    quill.on("editor-change", function () {
      const editor = quill.root;
      // Add text-4xl class to all h1 elements
      editor.querySelectorAll("h1").forEach((h1) => {
        h1.classList.add("text-4xl");
      });
      editor.querySelectorAll("h2").forEach((h2) => {
        h2.classList.add("text-3xl");
      });
      editor.querySelectorAll("h3").forEach((h3) => {
        h3.classList.add("text-xl");
      });
      editor.querySelectorAll("h4").forEach((h4) => {
        h4.classList.add("text-md");
      });
      editor.querySelectorAll("h5").forEach((h5) => {
        h5.classList.add("text-sm");
      });
      editor.querySelectorAll("h6").forEach((h6) => {
        h6.classList.add("text-xs");
      });

      editor.querySelectorAll("a").forEach((a) => {
        a.classList.add("text-blue-400", "hover:text-white", "underline");
      });

      editor.querySelectorAll("ol").forEach((ol) => {
        ol.classList.add("list-decimal", "ml-10", "mt-3");
      });

      editor.querySelectorAll("ul").forEach((ul) => {
        ul.classList.add("list-disc", "ml-10", "mt-3");
      });

      $: value = editor.innerHTML;

      const contents = editor.innerHTML;
      markdownValue.update((value) => [
        ...value.filter((item) => item.id !== id),
        { id: id, name: name, input: contents },
      ]);

      console.log($markdownValue);

      // Force Svelte to update the DOM
      $: {
      }
    });

    // Convert the markdown value to HTML and set it as the content of the Quill editor
    html = converter.makeHtml($markdownValue[id]?.input || "");
    quill.setContents(quill.clipboard.convert(html));
  }

  onMount(async () => {
    await initializeQuillEditor();
  });

  onDestroy(() => {
    if (quill) {
      quill.off("text-change");
      quill = null;
    }
  });

  /** Dispatch event on click outside of node */
  function clickOutside(node) {
    const handleClick = (event) => {
      if (node && !node.contains(event.target) && !event.defaultPrevented) {
        node.dispatchEvent(new CustomEvent("click_outside", node));
      }
    };

    document.addEventListener("click", handleClick, true);

    return {
      destroy() {
        document.removeEventListener("click", handleClick, true);
      },
    };
  }

  function handleClickOutside(event) {
    $markdownClicked[id] = false;
  }

  function handleClick() {
    $markdownClicked[id] = true;
  }

  function hasContent(html) {
    const el = document.createElement("div");
    el.innerHTML = html;
    let content = el.firstChild.innerHTML.trim();
    // Remove <br> tags
    content = content.replace(/<br\s*\/?>/gi, "");

    return content !== "";
  }

  function keyCombination(event) {
    if (event.key === "Enter" && event.shiftKey) {
      $markdownClicked[id] = false;
      event.preventDefault();
    }
  }

  $: {
    if ($markdownClicked) {
      console.log($markdownClicked);
    }
  }
</script>

<div
  on:keydown={keyCombination}
  on:click={handleClick}
  use:clickOutside
  on:click_outside={handleClickOutside}
  class="text-gray-100 w-full sm:w-3/4 max-w-2xl mt-3 rounded"
>
  <div
    class="{$markdownClicked[id] === false
      ? 'hidden'
      : ''} text-gray-100 w-full sm:w-3/4 max-w-2xl mb-4 rounded"
  >
    <textarea bind:value {id} class="bg-[#1A1A27] min-h-12 w-full" />
  </div>

  <div
    class="{$markdownClicked[id] === true
      ? 'hidden'
      : ''} text-white mt-3 cursor-pointer w-full sm:w-3/4 max-w-2xl text-sm p-2"
  >
    {#each $markdownValue as mk}
      {#if mk?.id === id}
        <div class="flex flex-col">
          <span class="text-gray-400 mb-4">[{outputCounter}] : </span>
          <div class="border-b border-gray-600 rounded">
            {#if hasContent(value)}
              {@html value}
            {:else}
              <p class="italic text-gray-400">Markdown your code here...</p>
            {/if}
          </div>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  @import "/src/lib/assets/style_quill.css";
</style>
