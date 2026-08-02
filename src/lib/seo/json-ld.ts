/**
 * Serialize structured data for an inline JSON-LD script.
 *
 * JSON.stringify does not escape HTML-significant characters. Escaping them
 * prevents values such as `</script>` from terminating the script element and
 * keeps the serialized value identical between SSR and hydration.
 */
export function serializeJsonLd(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) return "null";

  return serialized
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003C")
    .replace(/>/g, "\\u003E")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function jsonLdScript(value: unknown): string {
  return `<script type="application/ld+json">${serializeJsonLd(value)}</script>`;
}
