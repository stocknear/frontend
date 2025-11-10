<script>
  /*
  import { browser } from "$app/environment";
  import { onMount } from "svelte";

  // Returns a promise that resolves once the AdSense script is loaded.
  function loadAdSense() {
    const SRC =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7722951169931877";
    return new Promise((resolve, reject) => {
      let script = document.querySelector(`script[src="${SRC}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = SRC;
        script.async = true;
        script.crossOrigin = "anonymous";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      } else if ((script.getAttribute("data-loaded") || "") === "true") {
        resolve();
      } else {
        script.addEventListener("load", resolve);
        script.addEventListener("error", reject);
      }
    });
  }

  onMount(async () => {
    if (!browser) return;
    try {
      await loadAdSense();
      // Render all <ins class="adsbygoogle"> placeholders
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      // Mark as loaded for future navigations
      document
        .querySelector('script[src*="adsbygoogle.js"]')
        ?.setAttribute("data-loaded", "true");
    } catch (e) {
      console.error("AdSense failed to load:", e);
    }
  });
  */
</script>

<!--
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<div class="max-h-[90px] text-center xl:max-w-screen-xl px-3 sm:px-0 mb-3">
  <h3
    class="uppercase text-[9px] font-semibold text-gray-500 dark:text-gray-300"
  >
    Advertisement
  </h3>

  <div
    class="ad-container mx-auto min-h-[90px] h-fit border border-gray-300 dark:border-gray-800 rounded bg-gray-100 dark:bg-[#2A2E39]"
  >
    <ins
      class="adsbygoogle"
      style="display:inline-block;width:728px;height:90px"
      data-ad-client="ca-pub-7722951169931877"
      data-ad-slot="4890164325"
    ></ins>
  </div>
</div>

<style>
  .ad-container {
    width: 728px;
    height: 90px;
    overflow: hidden;
  }
  @media (max-width: 640px) {
    .ad-container {
      width: 320px;
      height: 90px;
      overflow: hidden;
    }
  }
</style>
-->
