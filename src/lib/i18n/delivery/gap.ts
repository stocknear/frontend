/**
 * Reporting for translation-delivery gaps.
 *
 * A missing message used to throw, which white-screened the page — one absent
 * string took down /chart/SPCX in production. The generated shims now fall back
 * to the base locale instead, but a silent fallback is its own hazard: a German
 * visitor can end up reading an entirely English page with nothing to show for
 * it. This module makes both failures visible exactly once and distinguishes
 * them, because they have different causes and different fixes.
 *
 * Lives outside `generated/` so the Set is a single module instance shared by
 * every shard; a `warned` set inside the generated modules would warn once per
 * shard instead of once per app.
 */

export type I18nGapKind = "missing-message" | "locale-mismatch";

const reported = new Set<string>();

export function reportI18nGap(
  kind: I18nGapKind,
  name: string,
  requestedLocale: string,
  loadedLocale: string | null,
): void {
  // One line per distinct problem. A locale mismatch affects every string on
  // the page, so it is keyed on the locale pair rather than the message.
  const key =
    kind === "locale-mismatch"
      ? `mismatch:${loadedLocale ?? "none"}->${requestedLocale}`
      : `missing:${requestedLocale}:${name}`;
  if (reported.has(key)) return;
  reported.add(key);

  const message =
    kind === "locale-mismatch"
      ? `[i18n] the loaded payload is for "${loadedLocale ?? "no locale"}" but "${requestedLocale}" was requested — this page is rendering the base locale throughout.`
      : `[i18n] message "${name}" is not in the "${requestedLocale}" route payload — rendering the base locale for it.`;

  console.warn(message);

  // Surface it beyond the console so a wrong-language page is detectable by
  // whatever the app wires up (error reporting, a dev overlay, a test).
  if (typeof window !== "undefined" && typeof CustomEvent === "function") {
    window.dispatchEvent(
      new CustomEvent("stocknear:i18n-gap", {
        detail: { kind, name, requestedLocale, loadedLocale },
      }),
    );
  }
}
