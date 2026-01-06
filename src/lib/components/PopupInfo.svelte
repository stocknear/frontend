<script lang="ts">
  import { getCache, setCache } from "$lib/store";
  import { onMount } from "svelte";
  import tippy from "tippy.js";
  import "tippy.js/dist/tippy.css";

  export let parameter = "";
  export let label;
  export let value;

  let labelEl: HTMLLabelElement;

  let content = { text: "Loading..." };

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
      theme: "minimal",
      maxWidth: 360,
      appendTo: () => document.body,
      zIndex: 9999,
      interactive: true,
      trigger: "click mouseenter focus",
      hideOnClick: true,
      touch: ["hold", 500],
      onShow: async (instance) => {
        instance.setContent(`
          <div class="info-tooltip">
            <div class="info-tooltip__title">${label || ""}</div>
            <div class="info-tooltip__body">Loading...</div>
          </div>
        `);
        await getInfoText();
        instance.setContent(`
          <div class="info-tooltip">
            <div class="info-tooltip__title">${label || ""}</div>
            <div class="info-tooltip__body">${content?.text || "n/a"}</div>
            ${
              content?.equation
                ? `<div class="info-tooltip__equation">${content?.equation}</div>`
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
