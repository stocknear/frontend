<script lang="ts">
  import { getCache, setCache } from "$lib/store";
  import { onMount } from "svelte";
  import tippy from "tippy.js";
  import "tippy.js/dist/tippy.css";

  export let parameter = "";
  export let label;
  export let value;

  let labelEl: HTMLLabelElement;

  let content = { text: "Loading…" };

  async function getInfoText() {
    const cachedData = getCache(parameter, "getInfoText");
    if (cachedData) {
      content = cachedData;
      return;
    }

    const postData = { parameter };
    const response = await fetch("/api/info-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData),
    });

    content = (await response.json()) ?? { text: "n/a" };
    setCache(parameter, content, "getInfoText");
  }

  onMount(() => {
    if (!labelEl) return;

    tippy(labelEl, {
      allowHTML: true,
      placement: "bottom",
      theme: "light-border",
      maxWidth: 500,
      interactive: true,
      trigger: "click mouseenter focus",
      hideOnClick: true,
      touch: ["hold", 500],
      onShow: async (instance) => {
        instance.setContent("Loading…");
        await getInfoText();
        instance.setContent(`
           <div class="text-xs sm:text-sm text-white p-2 min-w-72">
            <p>${content?.text}</p>
            ${
              content?.equation
                ? `<div class="mt-4 pt-2 text-sm border-t border-gray-600 w-fit">${content?.equation}</div>`
                : ""
            }
          </div>
        `);
      },
    });
  });
</script>

<tr class="border-b border-gray-300 dark:border-zinc-700 last:border-b-0">
  <td
    class="px-2.5 py-2 text-xs sm:text-sm text-gray-700 dark:text-zinc-200 relative flex flex-row items-center"
  >
    <label bind:this={labelEl} for="" class="cursor-text">
      {label}
    </label>
  </td>

  <td
    class="px-2.5 py-2 text-right text-xs sm:text-sm text-gray-600 dark:text-zinc-300 tabular-nums"
  >
    {value}
  </td>
</tr>
