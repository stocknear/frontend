/**
 * Merges financial statement arrays from different sources (income, balance sheet,
 * cash flow, ratios, price) into unified objects keyed by fiscal period.
 */

type StatementRecord = Record<string, any>;

function periodKey(record: StatementRecord): string {
  return `${record.fiscalYear}-${record.period}`;
}

/**
 * Merge arrays from different statement types by matching fiscalYear + period.
 * First source wins on key collisions (except null/undefined values).
 */
export function mergeStatements(...sources: StatementRecord[][]): StatementRecord[] {
  const merged = new Map<string, StatementRecord>();

  for (const source of sources) {
    for (const record of source) {
      const key = periodKey(record);
      if (!merged.has(key)) {
        merged.set(key, { ...record });
      } else {
        const existing = merged.get(key)!;
        for (const [prop, value] of Object.entries(record)) {
          if (!(prop in existing) || existing[prop] === null || existing[prop] === undefined) {
            existing[prop] = value;
          }
        }
      }
    }
  }

  return Array.from(merged.values()).sort((a, b) =>
    (a.date || '').localeCompare(b.date || ''),
  );
}

/**
 * Merge all statement types and price data into { annual, quarter, ttm } structure.
 */
export function mergeAllStatements(
  income: { annual: StatementRecord[]; quarter: StatementRecord[]; ttm: StatementRecord[] },
  balance: { annual: StatementRecord[]; quarter: StatementRecord[]; ttm: StatementRecord[] },
  cashflow: { annual: StatementRecord[]; quarter: StatementRecord[]; ttm: StatementRecord[] },
  ratios: { annual: StatementRecord[]; quarter: StatementRecord[]; ttm: StatementRecord[] },
  price?: { annual: StatementRecord[]; quarter: StatementRecord[]; ttm: StatementRecord[] },
) {
  const allSources = [income, balance, cashflow, ratios];
  if (price) allSources.push(price);

  return {
    annual: mergeStatements(...allSources.map(s => s.annual)),
    quarter: mergeStatements(...allSources.map(s => s.quarter)),
    ttm: mergeStatements(...allSources.map(s => s.ttm)),
  };
}
