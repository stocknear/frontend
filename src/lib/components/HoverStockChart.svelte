<script lang="ts">
  export let symbol;
  export let assetType = "stock";
  export let link = null;

  function getHref(symbol: string) {
    let path = "";

    if (symbol?.length > 0 && !/^\d/.test(symbol)) {
      // Check if symbol starts with a number
      if (symbol.includes("^")) {
        path = `/index/${symbol}${link ? `/${link}` : ""}`;
      } else if (["stocks", "stock"].includes(assetType?.toLowerCase())) {
        path = `/stocks/${symbol}${link ? `/${link}` : ""}`;
      } else if (assetType?.toLowerCase() === "etf") {
        path = `/etf/${symbol}${link ? `/${link}` : ""}`;
      } else if (["BTC", "USD"].includes(symbol)) {
        path = "";
      } else {
        path = `/index/${symbol}${link ? `/${link}` : ""}`;
      }
    }

    return path;
  }
</script>

<a
  href={getHref(symbol)}
  class="{!/^\d/.test(symbol)
    ? 'sm:hover:text-muted dark:sm:hover:text-white text-blue-800 dark:text-blue-400'
    : ''} ">{symbol?.length !== 0 ? symbol : "-"}</a
>
