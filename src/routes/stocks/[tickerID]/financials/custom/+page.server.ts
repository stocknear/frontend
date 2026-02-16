import { mergeAllStatements } from "$lib/financials/mergeStatements";
import { PREMIUM_TIERS, limitStatements, buildLockInfo } from "$lib/financials/statementHelpers";
import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params }) => {
  const ticker = params.tickerID;
  const canViewAllHistory = PREMIUM_TIERS.has(locals.user?.tier);

  // Fetch all 5 sources in parallel — price fetch adds no extra latency
  const [income, balance, cashflow, ratios, priceHistory] = await Promise.all([
    postAPI(locals, "/financial-statement", { ticker, statement: 'income-statement' }),
    postAPI(locals, "/financial-statement", { ticker, statement: 'balance-sheet-statement' }),
    postAPI(locals, "/financial-statement", { ticker, statement: 'cash-flow-statement' }),
    postAPI(locals, "/financial-statement", { ticker, statement: 'ratios' }),
    postAPI(locals, "/historical-adj-price", { ticker }).catch(() => []),
  ]);

  const merged = mergeAllStatements(income, balance, cashflow, ratios);

  // Build date→adjClose map from raw prices (O(n) scan, only keep what we need)
  const priceMap = new Map<string, number>();
  if (Array.isArray(priceHistory)) {
    for (const p of priceHistory) {
      if (p.time && p.adjClose != null) {
        priceMap.set(p.time.split('T')[0], Number(p.adjClose));
      }
    }
  }

  // Match each merged row's date to the closest trading day price
  // Try exact date first, then look back up to 5 days (weekends/holidays)
  if (priceMap.size > 0) {
    for (const period of [merged.annual, merged.quarter, merged.ttm]) {
      for (const row of period) {
        if (!row.date) continue;
        const target = row.date.split('T')[0];
        let price: number | undefined;

        // Exact match
        price = priceMap.get(target);

        // Look back up to 5 days for weekends/holidays
        if (price === undefined) {
          const d = new Date(target);
          for (let i = 1; i <= 5; i++) {
            d.setDate(d.getDate() - 1);
            const key = d.toISOString().split('T')[0];
            price = priceMap.get(key);
            if (price !== undefined) break;
          }
        }

        if (price !== undefined && Number.isFinite(price)) {
          row.stockPrice = parseFloat(price.toFixed(2));
        }
      }
    }
  }

  // Build lock info from full data, then limit for free users
  const financialLockInfo = {
    annual: buildLockInfo(merged.annual, canViewAllHistory),
    quarterly: buildLockInfo(merged.quarter, canViewAllHistory),
    ttm: buildLockInfo(merged.ttm, canViewAllHistory),
  };

  const limitedMerged = canViewAllHistory
    ? merged
    : {
        annual: limitStatements(merged.annual, false),
        quarter: limitStatements(merged.quarter, false),
        ttm: limitStatements(merged.ttm, false),
      };

  return {
    getMergedData: limitedMerged,
    financialLockInfo,
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
