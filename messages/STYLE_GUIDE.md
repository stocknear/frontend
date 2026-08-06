# Stocknear translation guide

Stocknear uses a friendly, concise voice for casual finance users. Address German users
with **du**, Spanish users with **tú**, and French users with **tu**. Chinese should be
friendly and neutral. Prefer plain market language over literal translations or formal bank
copy, but do not weaken the meaning of risk, pricing, or subscription messages.

- `zh-CN` is Simplified Chinese for mainland conventions. `zh-TW` is independently written
  Traditional Chinese using Taiwan finance conventions; it is not a character conversion.
- Japanese uses plain **です・ます**, never plain form and never heavy keigo (no お〜になる,
  no ございます). That register *is* the friendly-but-professional voice the other locales
  get from `du`/`tú`/`tu` — Japanese has no natural informal register for product UI, and
  reaching for one reads as careless rather than warm. Tickers, numerals and percentages
  stay half-width; use the standard market term rather than a katakana transliteration
  where one exists (時価総額 not マーケットキャップ, 出来高 not ボリューム), but keep
  katakana where that is genuinely what the market says (オプションフロー, ダークプール).
- Spanish is neutral international Spanish with `es-ES` formatting. French follows broadly
  understood metropolitan/international terminology with `fr-FR` formatting.
- Preserve tickers, company and product names, exchange/filing codes, formulas, placeholders,
  HTML, and standard acronyms such as ETF, IPO, EPS, EBITDA, P/E, IV, and OI.
- Translate natural headings and concepts consistently. Keep sentences short in dense tables,
  tooltips, and mobile controls. Do not add investment promises or advice that is absent from
  the English source.
- A changed English catalog is considered untranslated until all five target catalogs have
  been reviewed and `npm run i18n:accept-source` records the new source hashes.

