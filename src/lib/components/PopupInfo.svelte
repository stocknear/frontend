<script lang="ts">
  import { escapeInfoTextHtml, fetchInfoText } from "$lib/i18n/info-text";
  import {
    stock_detail_financials_error_loading,
    stock_detail_financials_loading,
  } from "$lib/paraglide/messages";
  import { onMount } from "svelte";
  import tippy from "tippy.js";
  import "tippy.js/dist/tippy.css";

  export let parameter = "";
  export let label;
  export let value;

  let labelEl: HTMLLabelElement;

  let content = { text: stock_detail_financials_loading() };

  async function getInfoText() {
    try {
      content = (await fetchInfoText(parameter)) ?? {
        text: stock_detail_financials_error_loading(),
      };
    } catch {
      content = { text: stock_detail_financials_error_loading() };
    }
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
            <div class="info-tooltip__title">${escapeInfoTextHtml(label)}</div>
            <div class="info-tooltip__body">${stock_detail_financials_loading()}</div>
          </div>
        `);
        await getInfoText();
        instance.setContent(`
          <div class="info-tooltip">
            <div class="info-tooltip__title">${escapeInfoTextHtml(label)}</div>
            <div class="info-tooltip__body">${escapeInfoTextHtml(content?.text || "n/a")}</div>
            ${
              content?.equation
                ? `<div class="info-tooltip__equation">${escapeInfoTextHtml(content?.equation)}</div>`
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
    class="px-2.5 py-2 text-sm text-muted dark:text-zinc-200 relative flex flex-row items-center"
  >
    <label bind:this={labelEl} for="" class="cursor-text">
      {label}
    </label>
  </td>

  <td
    class="px-2.5 py-2 text-right text-xs sm:text-sm text-muted dark:text-zinc-300 tabular-nums"
  >
    {value}
  </td>
</tr>
