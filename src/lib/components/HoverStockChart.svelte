<script lang="ts">
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

    const lower = clean.toLowerCase();

    const encodedOptionQuery =
      optionSymbol && optionSymbol.length > 0
        ? `/options/contract-lookup?query=${encodeURIComponent(optionSymbol)}`
        : "";

    if (assetType?.toLowerCase() === "index") {
      // SPXW SPECIAL CASE — ALWAYS redirect to plain ^SPX index page
      if (lower === "spxw") {
        const s = "^SPX";

        // ALWAYS ignore optionSymbol for SPXW
        return `/index/${s}${link ? `/${link}` : ""}`;
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
    ? "sm:hover:text-muted dark:sm:hover:text-white text-blue-800 dark:text-blue-400"
    : ""}
>
  {#if symbol}
    {symbolDisplay(symbol)}
  {:else}
    -
  {/if}
</a>
