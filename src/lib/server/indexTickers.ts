const INDEX_TO_ETF = {
  "^spx": "SPY",
  "^dji": "DIA",
  "^ndx": "QQQ",
  "^rut": "IWM",
  "^vix": "VXX",
  "^gspc": "SPY",
  "^ixic": "QQQ",
  "^nya": "VTI",
} as const;

export function getIndexProxyTicker(ticker: string | null | undefined) {
  if (!ticker) {
    return ticker ?? undefined;
  }

  return INDEX_TO_ETF[ticker.toLowerCase() as keyof typeof INDEX_TO_ETF] ?? ticker;
}

export const INDEX_HOLDINGS_PROXY_TICKERS = INDEX_TO_ETF;
