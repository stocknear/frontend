import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
const OUTPUT_FILE = path.join(FIXTURES_DIR, 'mock', 'xom.json');

// CSV header → camelCase property mappings per statement type
const INCOME_MAP = {
  'Revenue': 'revenue',
  'Net Income': 'netIncome',
  'EPS (Basic)': 'eps',
  'EPS (Diluted)': 'epsDiluted',
  'EBITDA': 'ebitda',
  'Gross Profit': 'grossProfit',
  'Operating Income': 'operatingIncome',
  'EBIT': 'ebit',
  'Pretax Income': 'incomeBeforeTax',
  'Cost of Revenue': 'costOfRevenue',
  'Operating Expenses': 'operatingExpenses',
  'Research & Development': 'researchAndDevelopmentExpenses',
  'Selling & General & Admin': 'sellingGeneralAndAdministrativeExpenses',
  'Selling & Marketing Expenses': 'sellingAndMarketingExpenses',
  'Cost & Expenses': 'costAndExpenses',
  'Other Expenses': 'otherExpenses',
  'Interest Income': 'interestIncome',
  'Interest Expense': 'interestExpense',
  'Income Tax Expense': 'incomeTaxExpense',
  'Depreciation & Amortization': 'depreciationAndAmortization',
  'Shares Outstanding (Basic)': 'weightedAverageShsOut',
  'Shares Outstanding (Diluted)': 'weightedAverageShsOutDil',
};

const BALANCE_SHEET_MAP = {
  'Total Assets': 'totalAssets',
  'Total Liabilities': 'totalLiabilities',
  'Shareholders Equity': 'totalStockholdersEquity',
  'Total Debt': 'totalDebt',
  'Net Debt': 'netDebt',
  'Book Value': 'bookValue',
  'Book Value Per Share': 'bookValuePerShare',
  'Cash & Equivalents': 'cashAndCashEquivalents',
  'Short-Term Investments': 'shortTermInvestments',
  'Cash & Short-Term Investments': 'cashAndShortTermInvestments',
  'Long-Term Investments': 'longTermInvestments',
  'Total Investments': 'totalInvestments',
  'Total Current Assets': 'totalCurrentAssets',
  'Receivables': 'netReceivables',
  'Accounts Receivables': 'accountsReceivables',
  'Other Receivables': 'otherReceivables',
  'Inventory': 'inventory',
  'Prepaid Expenses': 'prepaids',
  'Other Current Assets': 'otherCurrentAssets',
  'Total Long-Term Assets': 'totalNonCurrentAssets',
  'Property-Plant & Equipment': 'propertyPlantEquipmentNet',
  'Goodwill & Intangibles': 'goodwillAndIntangibleAssets',
  'Goodwill': 'goodwill',
  'Intangible Assets': 'intangibleAssets',
  'Tax Assets': 'taxAssets',
  'Other Long-Term Assets': 'otherNonCurrentAssets',
  'Other Assets': 'otherAssets',
  'Total Current Liabilities': 'totalCurrentLiabilities',
  'Short-Term Debt': 'shortTermDebt',
  'Total Payables': 'totalPayables',
  'Account Payables': 'accountPayables',
  'Other Payables': 'otherPayables',
  'Accrued Expenses': 'accruedExpenses',
  'Deferred Revenue': 'deferredRevenue',
  'Tax Payables': 'taxPayables',
  'Current Capital Lease Obligations': 'capitalLeaseObligationsCurrent',
  'Other Current Liabilities': 'otherCurrentLiabilities',
  'Total Long-Term Liabilities': 'totalNonCurrentLiabilities',
  'Long-Term Debt': 'longTermDebt',
  'Capital Lease Obligations': 'capitalLeaseObligations',
  'Non-Current Capital Lease Obligations': 'capitalLeaseObligationsNonCurrent',
  'Non-Current Deferred Revenue': 'deferredRevenueNonCurrent',
  'Non-Current Deferred Tax Liabilities': 'deferredTaxLiabilitiesNonCurrent',
  'Other Long-Term Liabilities': 'otherNonCurrentLiabilities',
  'Other Liabilities': 'otherLiabilities',
  'Total Equity': 'totalEquity',
  'Retained Earnings': 'retainedEarnings',
  'Common Stock': 'commonStock',
  'Additional Paid-In Capital': 'additionalPaidInCapital',
  'Treasury Stock': 'treasuryStock',
  'Preferred Stock': 'preferredStock',
  'Comprehensive Income': 'accumulatedOtherComprehensiveIncomeLoss',
  'Other Stockholders Equity': 'otherTotalStockholdersEquity',
  'Minority Interest': 'minorityInterest',
  'Total Liabilities & Equity': 'totalLiabilitiesAndTotalEquity',
};

const CASH_FLOW_MAP = {
  'Free Cash Flow': 'freeCashFlow',
  'Operating Cash Flow': 'operatingCashFlow',
  'Capital Expenditures': 'capitalExpenditure',
  'Net Change in Cash': 'netChangeInCash',
  'Net Income': 'netIncome',
  'Depreciation & Amortization': 'depreciationAndAmortization',
  'Stock-Based Compensation': 'stockBasedCompensation',
  'Deferred Income Tax': 'deferredIncomeTax',
  'Change in Working Capital': 'changeInWorkingCapital',
  'Accounts Receivables': 'accountsReceivables',
  'Inventory': 'inventory',
  'Accounts Payables': 'accountsPayables',
  'Other Working Capital': 'otherWorkingCapital',
  'Other Non-Cash Items': 'otherNonCashItems',
  'Net Cash from Operating Activities': 'netCashProvidedByOperatingActivities',
  'PP&E Investments': 'investmentsInPropertyPlantAndEquipment',
  'Cash Acquisitions': 'acquisitionsNet',
  'Purchase of Investments': 'purchasesOfInvestments',
  'Sales Maturities of Investments': 'salesMaturitiesOfInvestments',
  'Other Investing Activities': 'otherInvestingActivities',
  'Net Cash from Investing Activities': 'netCashProvidedByInvestingActivities',
  'Net Debt Issuance': 'netDebtIssuance',
  'Long-Term Net Debt Issuance': 'longTermNetDebtIssuance',
  'Short-Term Net Debt Issuance': 'shortTermNetDebtIssuance',
  'Net Stock Issuance': 'netStockIssuance',
  'Net Common Stock Issuance': 'netCommonStockIssuance',
  'Common Stock Issuance': 'commonStockIssuance',
  'Common Stock Repurchased': 'commonStockRepurchased',
  'Net Preferred Stock Issuance': 'netPreferredStockIssuance',
  'Net Dividends Paid': 'netDividendsPaid',
  'Common Dividends Paid': 'commonDividendsPaid',
  'Preferred Dividends Paid': 'preferredDividendsPaid',
  'Other Financing Activities': 'otherFinancingActivities',
  'Net Cash from Financing Activities': 'netCashProvidedByFinancingActivities',
  'Effect of Forex Changes on Cash': 'effectOfForexChangesOnCash',
  'Cash at Beginning of Period': 'cashAtBeginningOfPeriod',
  'Cash at End of Period': 'cashAtEndOfPeriod',
  'Income Taxes Paid': 'incomeTaxesPaid',
  'Interest Paid': 'interestPaid',
};

const RATIOS_MAP = {
  'PE Ratio': 'priceToEarningsRatio',
  'PEG Ratio': 'priceToEarningsGrowthRatio',
  'Return on Equity': 'returnOnEquity',
  'Return on Invested Capital': 'returnOnInvestedCapital',
  'Net Profit Margin': 'netProfitMargin',
  'FCF Yield': 'freeCashFlowYield',
  'Debt / Equity Ratio': 'debtToEquityRatio',
  'Current Ratio': 'currentRatio',
  'Forward PE Ratio': 'forwardPE',
  'PS Ratio': 'priceToSalesRatio',
  'PB Ratio': 'priceToBookRatio',
  'P/FCF Ratio': 'priceToFreeCashFlowRatio',
  'P/OCF Ratio': 'priceToOperatingCashFlowRatio',
  'EV/EBITDA': 'enterpriseValueMultiple',
  'Price to Fair Value': 'priceToFairValue',
  'Return on Assets': 'returnOnAssets',
  'Return on Capital Employed': 'returnOnCapitalEmployed',
  'Gross Profit Margin': 'grossProfitMargin',
  'Operating Profit Margin': 'operatingProfitMargin',
  'EBITDA Margin': 'ebitdaMargin',
  'EBIT Margin': 'ebitMargin',
  'Pretax Profit Margin': 'pretaxProfitMargin',
  'FCF Margin': 'freeCashFlowMargin',
  'Bottom Line Profit Margin': 'bottomLineProfitMargin',
  'Continuous Operations Margin': 'continuousOperationsProfitMargin',
  'Free Cash Flow Per Share': 'freeCashFlowPerShare',
  'Revenue Per Share': 'revenuePerShare',
  'Net Income Per Share': 'netIncomePerShare',
  'Operating Cash Flow Per Share': 'operatingCashFlowPerShare',
  'Book Value Per Share': 'bookValuePerShare',
  'Tangible Book Value Per Share': 'tangibleBookValuePerShare',
  'Cash Per Share': 'cashPerShare',
  "Shareholders' Equity Per Share": 'shareholdersEquityPerShare',
  'Interest Debt Per Share': 'interestDebtPerShare',
  'CapEx Per Share': 'capexPerShare',
  'Dividend Yield': 'dividendYield',
  'Dividend Per Share': 'dividendPerShare',
  'Payout Ratio': 'dividendPayoutRatio',
  'Dividend Yield %': 'dividendYieldPercentage',
  'Quick Ratio': 'quickRatio',
  'Cash Ratio': 'cashRatio',
  'Debt to Assets Ratio': 'debtToAssetsRatio',
  'Debt to Capital Ratio': 'debtToCapitalRatio',
  'LT Debt to Capital Ratio': 'longTermDebtToCapitalRatio',
  'Debt to Market Cap': 'debtToMarketCap',
  'Financial Leverage Ratio': 'financialLeverageRatio',
  'Solvency Ratio': 'solvencyRatio',
  'Interest Coverage': 'interestCoverageRatio',
  'OCF Ratio': 'operatingCashFlowRatio',
  'OCF/S Ratio': 'operatingCashFlowSalesRatio',
  'FCF/OCF Ratio': 'freeCashFlowOperatingCashFlowRatio',
  'Debt Service Coverage': 'debtServiceCoverageRatio',
  'OCF Coverage Ratio': 'operatingCashFlowCoverageRatio',
  'CapEx Coverage Ratio': 'capitalExpenditureCoverageRatio',
  'Dividend & CapEx Coverage': 'dividendPaidAndCapexCoverageRatio',
  'ST OCF Coverage': 'shortTermOperatingCashFlowCoverageRatio',
  'Asset Turnover': 'assetTurnover',
  'Inventory Turnover': 'inventoryTurnover',
  'Receivables Turnover': 'receivablesTurnover',
  'Payables Turnover': 'payablesTurnover',
  'Fixed Asset Turnover': 'fixedAssetTurnover',
  'Working Capital Turnover': 'workingCapitalTurnoverRatio',
  'Effective Tax Rate': 'effectiveTaxRate',
  'Net Income / EBT': 'netIncomePerEBT',
  'EBT / EBIT': 'ebtPerEbit',
};

// Statement type configs
const STATEMENTS = [
  {
    key: 'income-statement',
    annualFile: 'xom_annual_income_statement.csv',
    quarterFile: 'xom_quarter_income_statement.csv',
    map: INCOME_MAP,
  },
  {
    key: 'balance-sheet-statement',
    annualFile: 'xom_annual_balance_sheet_statement.csv',
    quarterFile: 'xom_quarter_balance_sheet_statement.csv',
    map: BALANCE_SHEET_MAP,
  },
  {
    key: 'cash-flow-statement',
    annualFile: 'xom_annual_cash_flow_statement.csv',
    quarterFile: 'xom_quarter_cash_flow_statement.csv',
    map: CASH_FLOW_MAP,
  },
  {
    key: 'ratios',
    annualFile: 'xom_annual_ratios_and_metrics.csv',
    quarterFile: 'xom_quarter_ratios_and_metrics.csv',
    map: RATIOS_MAP,
  },
];

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row = {};
    headers.forEach((h, i) => {
      row[h.trim()] = values[i]?.trim() ?? '';
    });
    return row;
  });
}

function parseValue(val) {
  if (val === '' || val === undefined || val === null) return null;
  const num = Number(val);
  return Number.isNaN(num) ? val : num;
}

function getPeriodFromDate(dateStr) {
  const month = parseInt(dateStr.split('-')[1], 10);
  if (month <= 3) return 'Q1';
  if (month <= 6) return 'Q2';
  if (month <= 9) return 'Q3';
  return 'Q4';
}

function convertRow(csvRow, fieldMap, isAnnual) {
  const dateCol = isAnnual ? 'Year' : 'Quarter';
  const rawDate = csvRow[dateCol];
  const result = { symbol: 'XOM', reportedCurrency: 'USD' };

  if (isAnnual) {
    const year = parseInt(rawDate, 10);
    result.date = `${year}-12-31`;
    result.fiscalYear = String(year);
    result.period = 'FY';
  } else {
    result.date = rawDate;
    const [y] = rawDate.split('-');
    result.fiscalYear = y;
    result.period = getPeriodFromDate(rawDate);
  }

  for (const [csvHeader, propName] of Object.entries(fieldMap)) {
    if (csvRow[csvHeader] !== undefined) {
      result[propName] = parseValue(csvRow[csvHeader]);
    }
  }

  return result;
}

function computeTTM(quarterRows, fieldMap) {
  // Take the last 4 quarters and sum numeric fields
  const sorted = [...quarterRows].sort((a, b) => a.date.localeCompare(b.date));
  const last4 = sorted.slice(-4);
  if (last4.length < 4) return [];

  const ttm = {
    symbol: 'XOM',
    reportedCurrency: 'USD',
    date: last4[last4.length - 1].date,
    fiscalYear: String(last4[last4.length - 1].fiscalYear),
    period: 'TTM',
  };

  for (const propName of Object.values(fieldMap)) {
    const values = last4.map(q => q[propName]).filter(v => typeof v === 'number');
    if (values.length === 4) {
      ttm[propName] = values.reduce((sum, v) => sum + v, 0);
    } else if (values.length > 0) {
      ttm[propName] = values[values.length - 1]; // Use latest for non-summable
    }
  }

  return [ttm];
}

function computeRatiosTTM(quarterRows) {
  // For ratios, TTM doesn't sum — use the latest quarter's values
  const sorted = [...quarterRows].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  if (!latest) return [];
  return [{ ...latest, period: 'TTM' }];
}

// Main
const output = {};

for (const stmt of STATEMENTS) {
  const annualCSV = fs.readFileSync(path.join(FIXTURES_DIR, stmt.annualFile), 'utf-8');
  const quarterCSV = fs.readFileSync(path.join(FIXTURES_DIR, stmt.quarterFile), 'utf-8');

  const annualRows = parseCSV(annualCSV).map(r => convertRow(r, stmt.map, true));
  const quarterRows = parseCSV(quarterCSV).map(r => convertRow(r, stmt.map, false));

  // Sort ascending by date
  annualRows.sort((a, b) => a.date.localeCompare(b.date));
  quarterRows.sort((a, b) => a.date.localeCompare(b.date));

  const ttmRows = stmt.key === 'ratios'
    ? computeRatiosTTM(quarterRows)
    : computeTTM(quarterRows, stmt.map);

  output[stmt.key] = {
    annual: annualRows,
    quarter: quarterRows,
    ttm: ttmRows,
  };
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

const stats = {};
for (const [key, val] of Object.entries(output)) {
  stats[key] = {
    annual: val.annual.length,
    quarter: val.quarter.length,
    ttm: val.ttm.length,
  };
}
console.log('Generated fixtures/mock/xom.json');
console.log('Stats:', JSON.stringify(stats, null, 2));
