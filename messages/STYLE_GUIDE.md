# Stocknear translation guide

Stocknear uses a friendly, concise voice for casual finance users. Address German users
with **du**, Spanish users with **tú**, and French users with **tu**. Chinese should be
friendly and neutral. Prefer plain market language over literal translations or formal bank
copy, but do not weaken the meaning of risk, pricing, or subscription messages.

- `zh-CN` is Simplified Chinese for mainland conventions. `zh-TW` is independently written
  Traditional Chinese using Taiwan finance conventions; it is not a character conversion.
- Spanish is neutral international Spanish with `es-ES` formatting. French follows broadly
  understood metropolitan/international terminology with `fr-FR` formatting.
- Preserve tickers, company and product names, exchange/filing codes, formulas, placeholders,
  HTML, and standard acronyms such as ETF, IPO, EPS, EBITDA, P/E, IV, and OI.
- Translate natural headings and concepts consistently. Keep sentences short in dense tables,
  tooltips, and mobile controls. Do not add investment promises or advice that is absent from
  the English source.
- A changed English catalog is considered untranslated until all five target catalogs have
  been reviewed and `npm run i18n:accept-source` records the new source hashes.

