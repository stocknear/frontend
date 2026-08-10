<script lang="ts">
  import { WEEKLY_ROOT_UNDERLYING } from "$lib/utils";

  export let symbol: string = "";
  export let optionSymbol: string = "";

  export let assetType: string = "stock";
  export let link: string | null = null;

  const isNumericStart = (s: string) => /^\d/.test(s || "");
  const isBTCorUSD = (s: string) =>
    ["BTC", "USD"].includes((s || "").toUpperCase());

  function symbolWithIndexCaret(s: string) {
    if (!s) return s;
    if (assetType?.toLowerCase() === "index" && !s.startsWith("^")) {
      return `^${s}`;
    }
    return s;
  }

  function symbolDisplay(s: string) {
    if (!s) return s;
    const withoutCaret = s.replace(/^\^/, "");
    if (assetType?.toLowerCase() === "index") {
      return withoutCaret.toUpperCase();
    }
    return withoutCaret;
  }

  function getHref(sym: string) {
    const raw = sym || "";
    const clean = raw.replace(/^\^/, "");

    if (!clean || isNumericStart(clean)) return "";

    const encodedOptionQuery =
      optionSymbol && optionSymbol.length > 0
        ? `/options/contract-lookup?contract=${encodeURIComponent(optionSymbol)}`
        : "";

    if (assetType?.toLowerCase() === "index") {
      // A weekly option root has no index page of its own — SPXW/NDXP/RUTW all
      // redirect to the index they are written on. Driven by the shared map so a
      // new root does not silently produce a link to a route that doesn't exist.
      const upper = clean.toUpperCase();
      if (upper in WEEKLY_ROOT_UNDERLYING) {
        // Ignore optionSymbol: the contract belongs to the weekly root, not to
        // the underlying's own chain, so contract-lookup could not resolve it.
        return `/index/${WEEKLY_ROOT_UNDERLYING[upper]}${link ? `/${link}` : ""}`;
      }

      const s = symbolWithIndexCaret(clean).toUpperCase();

      if (encodedOptionQuery) {
        return `/index/${s}${encodedOptionQuery}`;
      }

      return `/index/${s}${link ? `/${link}` : ""}`;
    }

    if (["stocks", "stock"].includes(assetType?.toLowerCase())) {
      if (encodedOptionQuery) {
        return `/stocks/${clean}${encodedOptionQuery}`;
      }
      return `/stocks/${clean}${link ? `/${link}` : ""}`;
    }

    if (assetType?.toLowerCase() === "etf") {
      if (encodedOptionQuery) {
        return `/etf/${clean}${encodedOptionQuery}`;
      }
      return `/etf/${clean}${link ? `/${link}` : ""}`;
    }

    if (isBTCorUSD(clean)) return "";

    const fallback = symbolWithIndexCaret(clean).toUpperCase();
    if (encodedOptionQuery) {
      return `/index/${fallback}${encodedOptionQuery}`;
    }

    return `/index/${fallback}${link ? `/${link}` : ""}`;
  }
</script>

<a
  href={getHref(symbol)}
  class={!/^\d/.test((symbol || "").replace(/^\^/, ""))
    ? // Tickers are the most repeated element in the product; spending the
      // loudest colour on them left nothing for actual affordances, and
      // violet-800 is the browser's canonical visited-link colour, so every
      // live ticker read as already visited. Accent is a hover reveal now.
      "font-medium text-fg transition-colors hover:text-accent hover:underline hover:underline-offset-2"
    : ""}
>
  {#if symbol}
    {symbolDisplay(symbol)}
  {:else}
    -
  {/if}
</a>
