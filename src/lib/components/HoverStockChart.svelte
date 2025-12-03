<script lang="ts">
  export let symbol: string = "";
  export let assetType: string = "stock";
  export let link: string | null = null;

  const isNumericStart = (s: string) => /^\d/.test(s || "");
  const isBTCorUSD = (s: string) =>
    ["BTC", "USD"].includes((s || "").toUpperCase());

  // Return a symbol that has '^' prefixed when assetType is index and it doesn't already start with '^'
  function symbolWithIndexCaret(s: string) {
    if (!s) return s;
    if (assetType?.toLowerCase() === "index" && !s.startsWith("^")) {
      return `^${s}`;
    }
    return s;
  }

  function getHref(sym: string) {
    const raw = sym || "";
    // if symbol starts with a number -> no href
    if (!raw || isNumericStart(raw)) return "";

    // special-case lowercase/uppercase tolerance
    const lower = raw.toLowerCase();

    // If assetType is index ensure we use caret-prefixed symbol for path
    if (assetType?.toLowerCase() === "index") {
      // special SPXW mapping -> ^SPX
      if (lower === "spxw") {
        const s = "^SPX";
        return `/index/${s}${link ? `/${link}` : ""}`;
      }
      const s = symbolWithIndexCaret(raw).toUpperCase(); // normalize to uppercase for indices
      return `/index/${s}${link ? `/${link}` : ""}`;
    }

    // keep earlier logic for stocks / etf / btc/usd
    if (["stocks", "stock"].includes(assetType?.toLowerCase())) {
      return `/stocks/${raw}${link ? `/${link}` : ""}`;
    }

    if (assetType?.toLowerCase() === "etf") {
      return `/etf/${raw}${link ? `/${link}` : ""}`;
    }

    if (isBTCorUSD(raw)) {
      return "";
    }

    // fallback: index-style path (adds caret if assetType wasn't 'index' but we treat as index fallback)
    const fallback = symbolWithIndexCaret(raw).toUpperCase();
    return `/index/${fallback}${link ? `/${link}` : ""}`;
  }
</script>

<a
  href={getHref(symbol)}
  class="{!/^\d/.test(symbol || '')
    ? 'sm:hover:text-muted dark:sm:hover:text-white text-blue-800 dark:text-blue-400'
    : ''} "
>
  {#if symbol}
    {#if assetType?.toLowerCase() === "index"}
      {symbolWithIndexCaret(symbol)}
    {:else}
      {symbol}
    {/if}
  {:else}
    -
  {/if}
</a>
