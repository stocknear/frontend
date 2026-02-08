/**
 * Shared server-side helpers for financial statement pages.
 * Used by income, balance-sheet, cash-flow, and ratios page.server.ts files.
 */

export const FREE_COLUMN_LIMIT = 5;
export const PREMIUM_TIERS = new Set(["Plus", "Pro"]);

export const getStatementTimestamp = (statement?: Record<string, any>) => {
  if (!statement) return 0;
  const dateValue = statement.date || statement.fiscalDate || statement.fiscalYear;
  const parsed = Date.parse(dateValue);
  if (!Number.isNaN(parsed)) return parsed;
  const fiscalYear = Number(statement?.fiscalYear);
  if (Number.isFinite(fiscalYear)) return Date.UTC(fiscalYear, 0, 1);
  return 0;
};

export const sortStatementsAscending = (statements: any[] = []) =>
  [...statements].sort(
    (a, b) => getStatementTimestamp(a) - getStatementTimestamp(b),
  );

export const partitionStatements = (statements: any[] = [], canViewAll: boolean) => {
  if (!Array.isArray(statements)) {
    return { visible: [], locked: [] };
  }
  const chronological = sortStatementsAscending(statements);
  if (canViewAll) {
    return { visible: chronological, locked: [] };
  }
  const startIndex = Math.max(chronological.length - FREE_COLUMN_LIMIT, 0);
  return {
    visible: chronological.slice(startIndex),
    locked: chronological.slice(0, startIndex),
  };
};

export const getFiscalYearValue = (statement: any) => {
  const year = Number(statement?.fiscalYear);
  return Number.isFinite(year) ? year : null;
};

export const getPeriodEndingYearValue = (statement: any) => {
  const rawDate = statement?.date || statement?.fiscalDate;
  const parsed = rawDate ? Date.parse(rawDate) : Number.NaN;
  if (!Number.isNaN(parsed)) return new Date(parsed).getFullYear();
  return getFiscalYearValue(statement);
};

export const formatLockedRange = (
  statements: any[] = [],
  extractor: (statement: any) => number | null,
) => {
  const values = statements
    .map(extractor)
    .filter((value): value is number => Number.isFinite(value as number));
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? `${min}` : `${min}-${max}`;
};

export const limitStatements = (statements: any[], canViewAll: boolean) =>
  partitionStatements(statements, canViewAll).visible;

export const buildLockInfo = (statements: any[], canViewAll: boolean) => {
  const { locked } = partitionStatements(statements, canViewAll);
  return {
    hasLockedData: locked.length > 0,
    lockedFiscalYearRange: formatLockedRange(locked, getFiscalYearValue),
    lockedPeriodRange: formatLockedRange(locked, getPeriodEndingYearValue),
  };
};

/**
 * Fetch a financial statement and compute lock info + limiting in one call.
 * Used by all 4 statement page servers.
 */
export async function fetchAndProcessStatement(
  apiURL: string,
  apiKey: string,
  ticker: string,
  statement: string,
  canViewAllHistory: boolean,
) {
  const response = await fetch(apiURL + "/financial-statement", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ ticker, statement }),
  });

  let output = await response.json();

  const financialLockInfo = Array.isArray(output)
    ? {
        annual: buildLockInfo(output, canViewAllHistory),
        quarterly: buildLockInfo(output, canViewAllHistory),
        ttm: buildLockInfo(output, canViewAllHistory),
      }
    : {
        annual: buildLockInfo(output?.annual, canViewAllHistory),
        quarterly: buildLockInfo(output?.quarter, canViewAllHistory),
        ttm: buildLockInfo(output?.ttm, canViewAllHistory),
      };

  if (!canViewAllHistory) {
    if (Array.isArray(output)) {
      output = limitStatements(output, false);
    } else if (output && typeof output === "object") {
      output = {
        ...output,
        annual: limitStatements(output?.annual, false),
        quarter: limitStatements(output?.quarter, false),
        ttm: limitStatements(output?.ttm, false),
      };
    }
  }

  return { getData: output, financialLockInfo };
}
