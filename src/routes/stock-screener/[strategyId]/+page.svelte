<script lang='ts'>
  import { onMount } from 'svelte';
  import { goto} from '$app/navigation';
  import { screenWidth, strategyId, numberOfUnreadNotification, getCache, setCache} from '$lib/store';
  import toast from 'svelte-french-toast';
  import { abbreviateNumber, formatRuleValue } from '$lib/utils';

    
  //const userConfirmation = confirm('Unsaved changes detected. Leaving now will discard your strategy. Continue?');

  export let data;
  export let form;
  
  $strategyId = data?.getStrategyId;
  let ruleOfList = data?.getStrategy?.rules ?? [];


  const title = data?.getStrategy?.title;

  let stockScreenerData = data?.getStockScreenerData?.filter(item => 
  Object?.values(item)?.every(value => 
    value !== null && value !== undefined && 
    (typeof value !== 'object' || Object?.values(value)?.every(subValue => subValue !== null && subValue !== undefined))
  )
);


const getStockScreenerData = async (rules) => {
  const ruleNames = rules?.map(rule => rule?.name)?.sort()?.join(',');
  const cachedData = getCache(ruleNames, 'getStockScreenerData');
  
  if (cachedData) {
    console.log('Using cached data');
    return cachedData;
  }

  console.log('Fetching new data from API');
  const postData = { ruleOfList: rules?.map(rule => rule.name) };
  const response = await fetch(data?.apiURL + '/stock-screener-data', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json", 
      "X-API-KEY": data?.apiKey
    },
    body: JSON.stringify(postData)
  });
  const output = await response.json();
  
  // Cache the new data
  setCache(ruleNames, output, 'getStockScreenerData');
  
  return output;
};


  let filteredData = [];
  let displayResults = [];
  let isSaved = false;
  let ruleCondition = {
    avgVolume: (ruleOfList?.find(item => item.name === "avgVolume") || { condition: 'above' }).condition,
    priceToBookRatio: (ruleOfList?.find(item => item.name === "priceToBookRati") || { condition: 'above' }).condition,
    priceToSalesRatio: (ruleOfList?.find(item => item.name === "priceToSalesRatio") || { condition: 'above' }).condition,
    rsi: (ruleOfList?.find(item => item.name === "rsi") || { condition: 'above' }).condition,
    stochRSI: (ruleOfList?.find(item => item.name === "stochRSI") || { condition: 'above' }).condition,
    mfi: (ruleOfList?.find(item => item.name === "mfi") || { condition: 'above' }).condition,
    cci: (ruleOfList?.find(item => item.name === "cci") || { condition: 'above' }).condition,
    atr:  (ruleOfList?.find(item => item.name === "atr") || { condition: 'above' }).condition,
    sma50:  (ruleOfList?.find(item => item.name === "sma50") || { condition: 'above' }).condition,
    sma200:  (ruleOfList?.find(item => item.name === "sma200") || { condition: 'above' }).condition,
    ema50:  (ruleOfList?.find(item => item.name === "ema50") || { condition: 'above' }).condition,
    ema200:  (ruleOfList?.find(item => item.name === "ema200") || { condition: 'above' }).condition,
    change1W: (ruleOfList?.find(item => item.name === "change1W") || { condition: 'above' }).condition,
    change1M: (ruleOfList?.find(item => item.name === "change1M") || { condition: 'above' }).condition,
    change3M: (ruleOfList?.find(item => item.name === "change3M") || { condition: 'above' }).condition,
    change6M: (ruleOfList?.find(item => item.name === "change6M") || { condition: 'above' }).condition,
    change1Y: (ruleOfList?.find(item => item.name === "change1Y") || { condition: 'above' }).condition,
    change3Y: (ruleOfList?.find(item => item.name === "change3Y") || { condition: 'above' }).condition,
    payoutRatio:  (ruleOfList?.find(item => item.name === "payoutRatio") || { condition: 'above' }).condition,
    annualDividend:  (ruleOfList?.find(item => item.name === "annualDividend") || { condition: 'above' }).condition,
    dividendYield:  (ruleOfList?.find(item => item.name === "dividendYield") || { condition: 'above' }).condition,
    dividendGrowth:  (ruleOfList?.find(item => item.name === "dividendGrowth") || { condition: 'above' }).condition,
    eps:  (ruleOfList?.find(item => item.name === "eps") || { condition: 'above' }).condition,
    growthEPS:  (ruleOfList?.find(item => item.name === "growthEPS") || { condition: 'above' }).condition,
    pe:  (ruleOfList?.find(item => item.name === "pe") || { condition: 'above' }).condition,
    forwardPE:  (ruleOfList?.find(item => item.name === "forwardPE") || { condition: 'above' }).condition,
    beta:  (ruleOfList?.find(item => item.name === "beta") || { condition: 'above' }).condition,
    ebitda:  (ruleOfList?.find(item => item.name === "ebitda") || { condition: 'above' }).condition,
    growthEBITDA:  (ruleOfList?.find(item => item.name === "growthEBITDA") || { condition: 'above' }).condition,
    revenue:  (ruleOfList?.find(item => item.name === "revenue") || { condition: 'above' }).condition,
    growthRevenue:  (ruleOfList?.find(item => item.name === "growthRevenue") || { condition: 'above' }).condition,
    costOfRevenue:  (ruleOfList?.find(item => item.name === "costOfRevenue") || { condition: 'above' }).condition,
    growthCostOfRevenue:  (ruleOfList?.find(item => item.name === "growthCostOfRevenue") || { condition: 'above' }).condition,
    costAndExpenses:  (ruleOfList?.find(item => item.name === "costAndExpenses") || { condition: 'above' }).condition,
    growthCostAndExpenses:  (ruleOfList?.find(item => item.name === "growthCostAndExpenses") || { condition: 'above' }).condition,
    netIncome:  (ruleOfList?.find(item => item.name === "netIncome") || { condition: 'above' }).condition,
    growthNetIncome:  (ruleOfList?.find(item => item.name === "growthNetIncome") || { condition: 'above' }).condition,
    researchAndDevelopmentExpenses:  (ruleOfList?.find(item => item.name === "researchAndDevelopmentExpenses") || { condition: 'above' }).condition,
    growthResearchAndDevelopmentExpenses:  (ruleOfList?.find(item => item.name === "growthResearchAndDevelopmentExpenses") || { condition: 'above' }).condition,
    grossProfit:  (ruleOfList?.find(item => item.name === "grossProfit") || { condition: 'above' }).condition,
    growthGrossProfit:  (ruleOfList?.find(item => item.name === "growthGrossProfit") || { condition: 'above' }).condition,
    interestIncome:  (ruleOfList?.find(item => item.name === "interestIncome") || { condition: 'above' }).condition,
    interestExpense:  (ruleOfList?.find(item => item.name === "interestExpense") || { condition: 'above' }).condition,
    growthInterestExpense:  (ruleOfList?.find(item => item.name === "growthInterestExpense") || { condition: 'above' }).condition,
    operatingExpenses:  (ruleOfList?.find(item => item.name === "operatingExpense") || { condition: 'above' }).condition,
    growthOperatingExpenses:  (ruleOfList?.find(item => item.name === "growthOperatingExpense") || { condition: 'above' }).condition,
    operatingIncome:  (ruleOfList?.find(item => item.name === "operatingIncome") || { condition: 'above' }).condition,
    growthOperatingIncome:  (ruleOfList?.find(item => item.name === "growthOperatingIncome") || { condition: 'above' }).condition,
    marketCap:  (ruleOfList?.find(item => item.name === "marketCap") || { condition: 'above' }).condition,
    var: (ruleOfList?.find(item => item.name === "var") || { condition: 'above' }).condition,
    trendAnalysis: (ruleOfList?.find(item => item.name === "trendAnalysis") || { condition: 'above' }).condition,
    fundamentalAnalysis: (ruleOfList?.find(item => item.name === "fundamentalAnalysis") || { condition: 'above' }).condition,
    currentRatio:  (ruleOfList?.find(item => item.name === "currentRatio") || { condition: 'above' }).condition,
    quickRatio:  (ruleOfList?.find(item => item.name === "quickRatio") || { condition: 'above' }).condition,
    debtEquityRatio:  (ruleOfList?.find(item => item.name === "debtEquityRatio") || { condition: 'above' }).condition,
    debtRatio:  (ruleOfList?.find(item => item.name === "debtRatio") || { condition: 'above' }).condition,
    returnOnAssets: (ruleOfList?.find(item => item.name === "returnOnAssets") || { condition: 'above' }).condition,
    returnOnEquity: (ruleOfList?.find(item => item.name === "returnOnEquity") || { condition: 'above' }).condition,
    enterpriseValue: (ruleOfList?.find(item => item.name === "enterpriseValue") || { condition: 'above' }).condition,
    freeCashFlowPerShare: (ruleOfList?.find(item => item.name === "freeCashFlowPerShare") || { condition: 'above' }).condition,
    cashPerShare: (ruleOfList?.find(item => item.name === "cashPerShare") || { condition: 'above' }).condition,
    priceToFreeCashFlowsRatio: (ruleOfList?.find(item => item.name === "priceToFreeCashFlowsRatio") || { condition: 'above' }).condition,

  };

  let ruleTrend = {
    ratingRecommendation: 'Hold',
  };
    
    
  let allRows = [
    { rule: 'avgVolume', label: 'Average Volume',category: 'fund' },
    { rule: 'rsi', label: 'Relative Strength Index (RSI)',category: 'ta' },
    { rule: 'stochRSI', label: 'Stochastic RSI Fast',category: 'ta' },
    { rule: 'mfi', label: 'Money Flow Index',category: 'ta' },
    { rule: 'cci', label: 'Commodity Channel Index',category: 'ta' },
    { rule: 'atr', label: 'Average True Range (ATR)',category: 'ta' },
    { rule: 'sma50', label: '50-Day Simple Moving Average (SMA-50)',category: 'ta' },
    { rule: 'sma200', label: '200-Day Simple Moving Average (SMA-200)',category: 'ta' },
    { rule: 'ema50', label: '50-Day Exponential Moving Average (EMA-50)',category: 'ta' },
    { rule: 'ema200', label: '200-Day Exponential Moving Average (EMA-200)',category: 'ta' },
    { rule: 'change1W', label: 'Price Change 1W [%]',category: 'ta' },
    { rule: 'change1M', label: 'Price Change 1M [%]',category: 'ta' },
    { rule: 'change3M', label: 'Price Change 3M [%]',category: 'ta' },
    { rule: 'change6M', label: 'Price Change 6M [%]',category: 'ta' },
    { rule: 'change1Y', label: 'Price Change 1Y [%]',category: 'ta' },
    { rule: 'change3Y', label: 'Price Change 3Y [%]',category: 'ta' },
    { rule: 'marketCap', label: 'Market Capitalization', category: 'fund'},
    { rule: 'revenue', label: 'Revenue',category: 'fund' },
    { rule: 'growthRevenue', label: 'Revenue Growth [%]',category: 'fund' },
    { rule: 'costOfRevenue', label: 'Cost of Revenue',category: 'fund' },
    { rule: 'growthCostOfRevenue', label: 'Cost of Revenue Growth [%]',category: 'fund' },
    { rule: 'costAndExpenses', label: 'Cost & Expenses',category: 'fund' },
    { rule: 'growthCostAndExpenses', label: 'Cost & Expenses Growth [%]',category: 'fund' },
    { rule: 'netIncome', label: 'Net Income', category: 'fund'},
    { rule: 'growthNetIncome', label: 'Net Income Growth [%]', category: 'fund'},
    { rule: 'grossProfit', label: 'Gross Profit', category: 'fund'},
    { rule: 'growthGrossProfit', label: 'Gross Profit Growth [%]', category: 'fund'},
    { rule: 'researchAndDevelopmentExpenses', label: 'Research & Development (R&D) Expenses', category: 'fund'},
    { rule: 'growthResearchAndDevelopmentExpenses', label: 'R&D Expenses Growth [%]', category: 'fund'},
    { rule: 'payoutRatio', label: 'Payout Ratio [%]',category: 'fund' },
    { rule: 'dividendYield', label: 'Dividend Yield [%]',category: 'fund' },
    { rule: 'annualDividend', label: 'Annual Dividend',category: 'fund' },
    { rule: 'dividendGrowth', label: 'Dividend Growth [%]',category: 'fund' },
    { rule: 'eps', label: 'Earnings Per Share (EPS)',category: 'fund' },
    { rule: 'growthEPS', label: 'EPS Growth [%]',category: 'fund' },
    { rule: 'interestIncome', label: 'Interest Income',category: 'fund' },
    { rule: 'interestExpense', label: 'Interest Expenses',category: 'fund' },
    { rule: 'growthInterestExpense', label: 'Interest Expenses Growth [%]',category: 'fund' },
    { rule: 'operatingExpenses', label: 'Operating Expenses',category: 'fund' },
    { rule: 'growthOperatingExpenses', label: 'Operating Expenses Growth [%]',category: 'fund' },
    { rule: 'operatingIncome', label: 'Operating Income',category: 'fund' },
    { rule: 'growthOperatingIncome', label: 'Operating Income Growth [%]',category: 'fund' },
    { rule: 'pe', label: 'Price per Earnings (PE)', category: 'fund'},
    { rule: 'forwardPE', label: 'Forward PE', category: 'fund'},
    { rule: 'priceToBookRatio', label: 'Price to Book Ratio (PB)', category: 'fund'},
    { rule: 'priceToSalesRatio', label: 'Price to Sales Ratio (PS)', category: 'fund'},
    { rule: 'beta', label: 'Beta', category: 'fund'},
    { rule: 'ebitda', label: 'Earnings Before Interests, Taxes, Depreciation & Amortisation (EBITDA)', category: 'fund'},
    { rule: 'growthEBITDA', label: 'EBITDA Growth [%]', category: 'fund'},
    { rule: 'var', label: 'Value at Risk (VaR)', category: 'fund' },
    { rule: 'trendAnalysis', label: 'AI Trend Analysis (Bullish)', category: 'ai' },
    { rule: 'fundamentalAnalysis', label: 'AI Fundamental Analysis (Bullish)', category: 'ai' },
    { rule: 'ratingRecommendation', label: 'Analyst Rating', category: 'fund'},
    { rule: 'currentRatio', label: 'Current Ratio',category: 'fund' },
    { rule: 'quickRatio', label: 'Quick Ratio',category: 'fund' },
    { rule: 'debtEquityRatio', label: 'Debt / Equity',category: 'fund' },
    { rule: 'debtRatio', label: 'Debt Ratio',category: 'fund' },
    { rule: 'returnOnAssets', label: 'Return on Assets',category: 'fund' },
    { rule: 'returnOnEquity', label: 'Return on Equity',category: 'fund' },
    { rule: 'enterpriseValue', label: 'Enterprise Value',category: 'fund' },
    { rule: 'freeCashFlowPerShare', label: 'FCF / Share', category: 'fund' },
    { rule: 'cashPerShare', label: 'Cash / Share', category: 'fund' },
    { rule: 'priceToFreeCashFlowsRatio', label: 'Price / FCF', category: 'fund' },

  ];

  // Creating the ruleMappings object from allRows
  const ruleMappings = allRows.reduce((acc, row) => {
        acc[row.rule] = row.label;
        return acc;
    }, {});
  
    
      allRows?.sort((a, b) => a.label.localeCompare(b.label));
      let filteredRows;
      let searchTerm = '';
      /*
      let taRows = allRows?.filter(row => row.category === 'ta');
      let fundRows = allRows?.filter(row => row.category === 'fund');
    
      taRows?.sort((a, b) => a.label.localeCompare(b.label));
      fundRows?.sort((a, b) => a.label.localeCompare(b.label));
      */

      function changeRuleCondition(state: string) {
        ruleCondition[ruleName] = state;
      }
    
      
  
      let ruleName = '';
      
      // Define your default values

      let valueRevenue = (ruleOfList?.find(item => item.name === "revenue") || { value: 50 }).value;
      let valueGrowthRevenue = (ruleOfList?.find(item => item.name === "growthRevenue") || { value: 10 }).value;
      let valueCostOfRevenue = (ruleOfList?.find(item => item.name === "costOfRevenue") || { value: 30 }).value;
      let valueGrowthCostOfRevenue = (ruleOfList?.find(item => item.name === "growthCostAndExpenses") || { value: 10 }).value;
      let valueCostAndExpenses = (ruleOfList?.find(item => item.name === "costAndExpenses") || { value: 50 }).value;
      let valueGrowthCostAndExpenses= (ruleOfList?.find(item => item.name === "growthCostAndExpenses") || { value: 10 }).value;
      let valueResearchAndDevelopmentExpenses = (ruleOfList?.find(item => item.name === "researchAndDevelopmentExpenses") || { value: 10 }).value;
      let valueGrowthResearchAndDevelopmentExpenses = (ruleOfList?.find(item => item.name === "growthResearchAndDevelopmentExpenses") || { value: 10 }).value;
      let valueInterestIncome = (ruleOfList?.find(item => item.name === "interestIncome") || { value: 500 }).value;
    
      let valueInterestExpenses = (ruleOfList?.find(item => item.name === "interestExpenses") || { value: 500 }).value;
      let valueGrowthInterestExpenses = (ruleOfList?.find(item => item.name === "growthInterestExpenses") || { value: 10 }).value;
      let valueEBITDA = (ruleOfList?.find(item => item.name === "ebitda") || { value: 50 }).value;
      let valueGrowthEBITDA = (ruleOfList?.find(item => item.name === "growthEBITDA") || { value: 10 }).value;
      let valueOperatingExpenses = (ruleOfList?.find(item => item.name === "operatingExpenses") || { value: 50 }).value;
      let valueGrowthOperatingExpenses = (ruleOfList?.find(item => item.name === "growthOperatingExpenses") || { value: 10 }).value;
      let valueOperatingIncome = (ruleOfList?.find(item => item.name === "operatingIncome") || { value: 50 }).value;
      let valueGrowthOperatingIncome = (ruleOfList?.find(item => item.name === "growthOperatingIncome") || { value: 10 }).value;
      let valueNetIncome = (ruleOfList?.find(item => item.name === "netIncome") || { value: 30 }).value;
      let valueGrowthNetIncome = (ruleOfList?.find(item => item.name === "growthNetIncome") || { value: 10 }).value;
      let valueGrossProfit = (ruleOfList?.find(item => item.name === "grossProfit") || { value: 50 }).value;
      let valueGrowthGrossProfit = (ruleOfList?.find(item => item.name === "growthGrossProfit") || { value: 10 }).value;
      let valueDividendYield = (ruleOfList?.find(item => item.name === "dividendYield") || { value: 20 }).value;
      let valueAnnualDividend = (ruleOfList?.find(item => item.name === "annualDividend") || { value: 1 }).value;
      let valueDividendGrowth = (ruleOfList?.find(item => item.name === "dividendGrowth") || { value: 5 }).value;
      let valuePayoutRatio = (ruleOfList?.find(item => item.name === "payoutRatio") || { value: 20 }).value;

      let valueCurrentRatio = (ruleOfList?.find(item => item.name === "currentRatio") || { value: 1 }).value;
      let valueQuickRatio = (ruleOfList?.find(item => item.name === "quickRatio") || { value: 1 }).value;
      let valueDebtEquityRatio = (ruleOfList?.find(item => item.name === "debtEquityRatio") || { value: 1 }).value;
      let valueDebtRatio = (ruleOfList?.find(item => item.name === "debtRatio") || { value: 1 }).value;
      let valueReturnOnAssets = (ruleOfList?.find(item => item.name === "returnOnAssets") || { value: 0 }).value;
      let valueReturnOnEquity = (ruleOfList?.find(item => item.name === "returnOnEquity") || { value: 0 }).value;

      let valueEPS = (ruleOfList?.find(item => item.name === "eps") || { value: 2 }).value;
      let valueGrowthEPS = (ruleOfList?.find(item => item.name === "growthEPS") || { value: 10 }).value;
      let valuePE = (ruleOfList?.find(item => item.name === "pe") || { value: 10 }).value;
      let valueForwardPE = (ruleOfList?.find(item => item.name === "forwardPE") || { value: 10 }).value;

      let valuePriceToBookRatio = (ruleOfList?.find(item => item.name === "priceToBookRatio") || { value: 5 }).value;
      let valuePriceToSalesRatio = (ruleOfList?.find(item => item.name === "priceToSalesRatio") || { value: 10 }).value;
      let valueBeta = (ruleOfList?.find(item => item.name === "beta") || { value: 1 }).value;
      let valueMarketCap = (ruleOfList?.find(item => item.name === "marketCap") || { value: 50 }).value;
      let valueAnalyst = (ruleOfList?.find(item => item.name === "ratingRecommendation") || { value: 1 }).value;
      let valueRSI = (ruleOfList?.find(item => item.name === "rsi") || { value: 40 }).value;
      let valueStochRSI = (ruleOfList?.find(item => item.name === "stochRSI") || { value: 40 }).value;
      let valueMFI = (ruleOfList?.find(item => item.name === "mfi") || { value: 40 }).value;
      let valueCCI = (ruleOfList?.find(item => item.name === "cci") || { value: 0 }).value;
      let valueATR = (ruleOfList?.find(item => item.name === "atr") || { value: 2 }).value;
      let valueSMA50 =  (ruleOfList?.find(item => item.name === "sma50") || { value: 50 }).value;
      let valueSMA200 = (ruleOfList?.find(item => item.name === "sma200") || { value: 100 }).value;
      let valueEMA50 =  (ruleOfList?.find(item => item.name === "ema50") || { value: 50 }).value;
      let valueEMA200 = (ruleOfList?.find(item => item.name === "ema200") || { value: 100 }).value;
      let valueChange1W = (ruleOfList?.find(item => item.name === "change1W") || { value: 0 }).value;
      let valueChange1M = (ruleOfList?.find(item => item.name === "change1M") || { value: 0 }).value;
      let valueChange3M = (ruleOfList?.find(item => item.name === "change3M") || { value: 0 }).value;
      let valueChange6M = (ruleOfList?.find(item => item.name === "change6M") || { value: 0 }).value;
      let valueChange1Y = (ruleOfList?.find(item => item.name === "change1Y") || { value: 0 }).value;
      let valueChange3Y = (ruleOfList?.find(item => item.name === "change3Y") || { value: 0 }).value;
      let valueAvgVolume = (ruleOfList?.find(item => item.name === "avgVolume") || { value: 10 }).value;
      let valueVaR = (ruleOfList?.find(item => item.name === "var") || { value: -10 }).value;
      let valueTrendAnalysis = (ruleOfList?.find(item => item.name === "trendAnalysis") || { value: 50 }).value;
      let valueFundamentalAnalysis = (ruleOfList?.find(item => item.name === "fundamentalAnalysis") || { value: 50 }).value;
      let valueEnterpriseValue = (ruleOfList?.find(item => item.name === "enterpriseValue") || { value: 50 }).value;
      let valueFCFShare = (ruleOfList?.find(item => item.name === "freeCashFlowPerShare") || { value: 1 }).value;
      let valueCashShare = (ruleOfList?.find(item => item.name === "cashPerShare") || { value: 1 }).value;
      let valuePriceFCF = (ruleOfList?.find(item => item.name === "priceToFreeCashFlowsRatio") || { value: 1 }).value;

    
      const ratingRecommendations = [
        'Sell',
        'Hold',
        'Buy',
      ];
    
      $: {
        if (ruleTrend['ratingRecommendation'])
        {
          ruleTrend['ratingRecommendation'] = ratingRecommendations[valueAnalyst];
        }
      }
    
    
      function changeRule(state: string)  
      {
        searchTerm = '';
        ruleName = state;
        handleAddRule()

        //const closePopup = document.getElementById("ruleModal");
        //closePopup?.dispatchEvent(new MouseEvent('click'))
      }

const valueMappings = {
  revenue: valueRevenue,
  growthRevenue: valueGrowthRevenue,
  costOfRevenue: valueCostOfRevenue,
  growthCostOfRevenue: valueGrowthCostOfRevenue,
  costAndExpenses: valueCostAndExpenses,
  growthCostAndExpenses: valueGrowthCostAndExpenses,
  netIncome: valueNetIncome,
  growthNetIncome: valueGrowthNetIncome,
  grossProfit: valueGrossProfit,
  growthGrossProfit: valueGrowthGrossProfit,
  researchAndDevelopmentExpenses: valueResearchAndDevelopmentExpenses,
  growthResearchAndDevelopmentExpenses: valueGrowthResearchAndDevelopmentExpenses,
  eps: valueEPS,
  dividendYield: valueDividendYield,
  annualDividend: valueAnnualDividend,
  dividendGrowth: valueDividendGrowth,
  payoutRatio: valuePayoutRatio,
  growthEPS: valueGrowthEPS,
  interestIncome: valueInterestIncome,
  interestExpense: valueInterestExpenses,
  growthInterestExpense: valueGrowthInterestExpenses,
  operatingExpenses: valueOperatingExpenses,
  growthOperatingExpenses: valueGrowthOperatingExpenses,
  operatingIncome: valueOperatingIncome,
  growthOperatingIncome: valueGrowthOperatingIncome,
  pe: valuePE,
  forwardPE: valueForwardPE,
  priceToBookRatio: valuePriceToBookRatio,
  priceToSalesRatio: valuePriceToSalesRatio,
  beta: valueBeta,
  ebitda: valueEBITDA,
  growthEBITDA: valueGrowthEBITDA,
  marketCap: valueMarketCap,
  rsi: valueRSI,
  stochRSI: valueStochRSI,
  mfi: valueMFI,
  cci: valueCCI,
  atr: valueATR,
  sma50: valueSMA50,
  sma200: valueSMA200,
  ema50: valueEMA50,
  ema200: valueEMA200,
  change1W: valueChange1W,
  change1M: valueChange1M,
  change3M: valueChange3M,
  change6M: valueChange6M,
  change1Y: valueChange1Y,
  change3Y: valueChange3Y,
  avgVolume: valueAvgVolume,
  var: valueVaR,
  trendAnalysis: valueTrendAnalysis,
  fundamentalAnalysis: valueFundamentalAnalysis,
  currentRatio: valueCurrentRatio,
  quickRatio: valueQuickRatio,
  debtEquityRatio: valueDebtEquityRatio,
  debtRatio: valueDebtRatio,
  returnOnAssets: valueReturnOnAssets,
  returnOnEquity: valueReturnOnEquity,
  enterpriseValue: valueEnterpriseValue,
  freeCashFlowPerShare: valueFCFShare,
  cashPerShare: valueCashShare,
  priceToFreeCashFlowsRatio: valuePriceFCF,
};
    
const conditions = {
  revenue: ruleCondition.revenue,
  growthRevenue: ruleCondition.growthRevenue,
  costOfRevenue: ruleCondition.costOfRevenue,
  growthCostOfRevenue: ruleCondition.growthCostOfRevenue,
  costAndExpenses: ruleCondition.costAndExpenses,
  growthCostAndExpenses: ruleCondition.growthCostAndExpenses,
  netIncome: ruleCondition.netIncome,
  growthNetIncome: ruleCondition.growthNetIncome,
  grossProfit: ruleCondition.grossProfit,
  growthGrossProfit: ruleCondition.growthGrossProfit,
  researchAndDevelopmentExpenses: ruleCondition.researchAndDevelopmentExpenses,
  growthResearchAndDevelopmentExpenses: ruleCondition.growthResearchAndDevelopmentExpenses,
  eps: ruleCondition.eps,
  growthEPS: ruleCondition.growthEPS,
  interestIncome: ruleCondition.interestIncome,
  interestExpense: ruleCondition.interestExpense,
  growthInterestExpense: ruleCondition.growthInterestExpense,
  operatingExpenses: ruleCondition.operatingExpenses,
  growthOperatingExpenses: ruleCondition.growthOperatingExpenses,
  operatingIncome: ruleCondition.operatingIncome,
  growthOperatingIncome: ruleCondition.growthOperatingIncome,
  pe: ruleCondition.pe,
  forwardPE: ruleCondition.forwardPE,
  priceToBookRatio: ruleCondition.priceToBookRatio,
  priceToSalesRatio: ruleCondition.priceToSalesRatio,
  beta: ruleCondition.beta,
  ebitda: ruleCondition.ebitda,
  growthEBITDA: ruleCondition.growthEBITDA,
  marketCap: ruleCondition.marketCap,
  rsi: ruleCondition.rsi,
  stochRSI: ruleCondition.stochRSI,
  mfi: ruleCondition.mfi,
  cci: ruleCondition.cci,
  atr: ruleCondition.atr,
  sma50: ruleCondition.sma50,
  sma200: ruleCondition.sma200,
  ema50: ruleCondition.ema50,
  ema200: ruleCondition.ema200,
  change1W: ruleCondition.change1W,
  change1M: ruleCondition.change1M,
  change3M: ruleCondition.change3M,
  change6M: ruleCondition.change6M,
  change1Y: ruleCondition.change1Y,
  change3Y: ruleCondition.change3Y,
  avgVolume: ruleCondition.avgVolume,
  var: ruleCondition.var,
  trendAnalysis: ruleCondition.trendAnalysis,
  fundamentalAnalysis: ruleCondition.fundamentalAnalysis,
  currentRatio: ruleCondition.currentRatio,
  quickRatio: ruleCondition.quickRatio,
  debtEquityRatio: ruleCondition.debtEquityRatio,
  debtRatio: ruleCondition.debtRatio,
  enterpriseValue: ruleCondition.enterpriseValue,
  freeCashFlowPerShare: ruleCondition.freeCashFlowPerShare,
  cashPerShare: ruleCondition.cashPerShare,
  priceToFreeCashFlowsRatio: ruleCondition.priceToFreeCashFlowsRatio,
};    


function handleAddRule() {
    
    if (ruleName === '') {
      toast.error('Please select a rule', {
        style: 'border-radius: 200px; background: #333; color: #fff;'
      });
      return;
    }
  
    let newRule;
  
    switch (ruleName) {
      case 'ratingRecommendation':
        newRule = { name: ruleName, value: valueAnalyst  }; //ruleTrend[ruleName]
        handleRule(newRule);
        break;
      default:
        // Handle other cases if needed
        newRule = { name: ruleName, condition: conditions[ruleName], value: valueMappings[ruleName] };
        handleRule(newRule);
        break;
    }
    
    
    
async function handleRule(newRule) {
  const existingRuleIndex = ruleOfList.findIndex(rule => rule.name === ruleName);
  if (existingRuleIndex !== -1) {
    const existingRule = ruleOfList[existingRuleIndex];
    if (existingRule.value === newRule.value && existingRule.condition === newRule.condition) {
      toast.error('Rule already exists!', {
        style: 'border-radius: 200px; background: #333; color: #fff;'
      });
    } else {
      ruleOfList[existingRuleIndex] = newRule;
      ruleOfList = [...ruleOfList]; // Trigger reactivity
      toast.success('Rule updated', {
        style: 'border-radius: 200px; background: #333; color: #fff;'
      });
      await updateStockScreenerData();
    }
  } else {
    ruleOfList = [...ruleOfList, newRule];
    toast.success('Rule added', {
      style: 'border-radius: 200px; background: #333; color: #fff;'
    });

    await updateStockScreenerData();
    await handleSave(false);
  }
}

async function updateStockScreenerData() {
  try {
    const newData = await getStockScreenerData(ruleOfList);
    stockScreenerData = newData?.filter(item => 
    Object.values(item).every(value => 
      value !== null && value !== undefined && 
      (typeof value !== 'object' || Object.values(value).every(subValue => subValue !== null && subValue !== undefined))
    )
  );

    filteredData = filterStockScreenerData();
    displayResults = filteredData?.slice(0, 50);
  } catch (error) {
    console.error('Error fetching new stock screener data:', error);
    toast.error('Failed to update stock data. Please try again.', {
      style: 'border-radius: 200px; background: #333; color: #fff;'
    });
  }
}

}
    
      
async function handleResetAll() {
  ruleOfList = [];
  ruleOfList = [...ruleOfList];
  ruleName = '';
  filteredData = [];
  displayResults = [];
  await handleSave(false);

}

async function handleDeleteRule(state) {
  for (let i = 0; i < ruleOfList.length; i++) {
    if (ruleOfList[i].name === state) {
      ruleOfList.splice(i, 1); // Remove the element at index i from the ruleOfList
      ruleOfList = [...ruleOfList]
      break; // Exit the loop after deleting the element
    }
  }

  if(ruleOfList?.length === 0)
  {
    ruleName = '';
    filteredData = [];
    displayResults = [];
  }
  else if (state === ruleName)
  {
    ruleName = '';
  }

  await handleSave(false);
}
      


  
async function handleScroll() {
  const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
  const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
  if (isBottom && displayResults?.length !== filteredData?.length) {
      const nextIndex = displayResults?.length;
      const filteredNewResults = filteredData?.slice(nextIndex, nextIndex + 30);
      displayResults = [...displayResults, ...filteredNewResults];
  }
}

/*
const handleKeyDown = (event) => {
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault(); // prevent the browser's default save action
      handleSave();
    }
  };

*/

let LoginPopup;

onMount(async () => {
    
  if(!data?.user) {
    LoginPopup = (await import('$lib/components/LoginPopup.svelte')).default;
  }

});


  
async function handleSave(printToast) {
  if(data?.user)
  {
    if(isSaved === false)
    {
        const postData = {'strategyId': $strategyId, 'rules': ruleOfList}  
                      
        const response = await fetch(data?.fastifyURL+'/save-strategy', {
          method: 'POST',
          headers: {
             "Content-Type": "application/json"
          },
          body: JSON.stringify(postData)
        });
      
      
        const output = (await response.json())?.items
      
        if (printToast === true) {
          if (output?.id && output?.id?.length !== 0) {
          toast.success('Strategy saved!', {
                  style: 'border-radius: 200px; background: #333; color: #fff;'});
          } else {
            toast.error('Something went wrong. Please try again later!', {
              style: 'border-radius: 200px; background: #333; color: #fff;'});
          }
        }
       
      isSaved = true;
    }
   
  }  
}
  
async function handleUpdateRule(rule) {
  ruleName = rule.name;
}


$: {
  if (ruleOfList) {
    const ruleToUpdate = ruleOfList.find(rule => rule.name === ruleName);
    if (ruleToUpdate) {
      const valueMap = {
        payoutRatio: valuePayoutRatio,
        dividendGrowth: valueDividendGrowth,
        dividendYield: valueDividendYield,
        annualDividend: valueAnnualDividend,
        eps: valueEPS,
        growthEPS: valueGrowthEPS,
        marketCap: valueMarketCap,
        beta: valueBeta,
        pe: valuePE,
        forwardPE: valueForwardPE,
        priceToBookRatio: valuePriceToBookRatio,
        priceToSalesRatio: valuePriceToSalesRatio,
        interestIncome: valueInterestIncome,
        ratingRecommendation: valueAnalyst,
        revenue: valueRevenue,
        growthRevenue: valueGrowthRevenue,
        ebitda: valueEBITDA,
        growthEBITDA: valueGrowthEBITDA,
        operatingExpenses: valueOperatingExpenses,
        growthOperatingExpenses: valueGrowthOperatingExpenses,
        costOfRevenue: valueCostOfRevenue,
        growthCostOfRevenue: valueGrowthCostOfRevenue,
        costAndExpenses: valueCostAndExpenses,
        growthCostAndExpenses: valueGrowthCostAndExpenses,
        netIncome: valueNetIncome,
        growthNetIncome: valueGrowthNetIncome,
        grossProfit: valueGrossProfit,
        growthGrossProfit: valueGrowthGrossProfit,
        researchAndDevelopmentExpenses: valueResearchAndDevelopmentExpenses,
        growthResearchAndDevelopmentExpenses: valueGrowthResearchAndDevelopmentExpenses,
        interestExpense: valueInterestExpenses,
        growthInterestExpense: valueGrowthInterestExpenses,
        operatingIncome: valueOperatingIncome,
        growthOperatingIncome: valueGrowthOperatingIncome,
        rsi: valueRSI,
        stochRSI: valueStochRSI,
        mfi: valueMFI,
        cci: valueCCI,
        atr: valueATR,
        sma50: valueSMA50,
        sma200: valueSMA200,
        ema50: valueEMA50,
        ema200: valueEMA200,
        change1W: valueChange1W,
        change1M: valueChange1M,
        change3M: valueChange3M,
        change6M: valueChange6M,
        change1Y: valueChange1Y,
        change3Y: valueChange3Y,
        avgVolume: valueAvgVolume,
        var: valueVaR,
        trendAnalysis: valueTrendAnalysis,
        fundamentalAnalysis: valueFundamentalAnalysis,
        currentRatio: valueCurrentRatio,
        quickRatio: valueQuickRatio,
        debtEquityRatio: valueDebtEquityRatio,
        debtRatio: valueDebtRatio,
        returnOnAssets: valueReturnOnAssets,
        returnOnEquity: valueReturnOnEquity,
        enterpriseValue: valueEnterpriseValue,
        freeCashFlowPerShare: valueFCFShare,
        cashPerShare: valueCashShare,
        priceToFreeCashFlowsRatio: valuePriceFCF,

      };

      ruleToUpdate.value = valueMap[ruleToUpdate.name] ?? ruleToUpdate.value;
      ruleToUpdate.condition = ruleCondition[ruleToUpdate.name];
      ruleOfList = [...ruleOfList];
    }

    filteredData = filterStockScreenerData();
    
    if (ruleOfList?.some(item => item?.name === 'ratingRecommendation')) {
      filteredData = filteredData?.filter(item => item?.ratingRecommendation === valueAnalyst);
    }
  }
}


function filterStockScreenerData() {
  return stockScreenerData?.filter(item => {
    for (const rule of ruleOfList) {
      if ([
          'researchAndDevelopmentExpenses',
          'operatingIncome',
          'operatingExpenses',
          'netIncome',
          'revenue',
          'marketCap',
          'enterpriseValue',
          'costAndExpenses',
          'costOfRevenue',
          'ebitda',
          'grossProfit'
      ]?.includes(rule.name))
      {
        if (rule.condition === "above"  && item[rule.name] !== null && item[rule.name] <= rule.value * 10**(9)) {
          return false;
        }
        else if (rule.condition === "below" && item[rule.name] !== null && item[rule.name] > rule.value * 10**(9)) {
          return false;
        }
      }
      else if (rule.name === 'interestIncome' || rule.name === 'interestExpense') {
        if (rule.condition === "above"  && item[rule.name] !== null && item[rule.name] <= rule.value * 10**(6)) {
          return false;
        }
      else if (rule.condition === "below" && item[rule.name] !== null && item[rule.name] > rule.value * 10**(6)) {
          return false;
        }
      }
      else if (rule.name === 'avgVolume') {
        if (rule.condition === "above"  && item[rule.name] <= rule.value * 10**(6)) {
          return false;
        }
      else if (rule.condition === "below"  && item[rule.name] > rule.value * 10**(6)) {
          return false;
        }
      }
      
      else if (rule.name === 'trendAnalysis') {
        if (rule.condition === "above"  &&  item[rule.name]?.accuracy <= rule.value ) {
          return false;
        }
      else if (rule.condition === "below" && item[rule.name]?.accuracy > rule.value ) {
          return false;
        }
      }

      else if (rule.name === 'fundamentalAnalysis') {
        if (rule.condition === "above"  &&  item[rule.name]?.accuracy <= rule.value ) {
          return false;
        }
      else if (rule.condition === "below" && item[rule.name]?.accuracy > rule.value ) {
          return false;
        }
      }


      else {
        if (rule.condition === "above"  && item[rule.name] !== null && item[rule.name] <= rule.value) {
          return false;
        }
        else if (rule.condition === "below"  && item[rule.name] !== null && item[rule.name] > rule.value) {
          return false;
        }
      }
    
    }
    return true;
  });
}

let order = 'highToLow';
let sortBy = ''; // Default sorting by change percentage

function changeOrder(state:string) {
    if (state === 'highToLow')
    {
      order = 'lowToHigh';
    }
    else {
      order = 'highToLow';
    }
  }

const sortByHighestChange = (tickerList) => {
  return tickerList?.sort(function(a, b) {
    if(order === 'highToLow')
    {
      return b?.changesPercentage - a?.changesPercentage;
    }
    else {
      return a?.changesPercentage - b?.changesPercentage;
    }
      
    });
}

const sortByMarketCap = (tickerList) => {
  return tickerList?.sort(function(a, b) {
    if(order === 'highToLow')
    {
      return b?.marketCap - a?.marketCap;
    }
    else {
      return a?.marketCap - b?.marketCap;
    }
  });
}

$: {
  if(order)
  {
    if(sortBy === 'change')
    {
      displayResults = sortByHighestChange(filteredData)?.slice(0,50);
    }
    else if(sortBy === 'marketCap')
    {
      displayResults = sortByMarketCap(filteredData)?.slice(0,50);
    }
    
  }
}



$: {
  if(searchTerm)
  {
    filteredRows = allRows?.filter((row) => row?.label?.toLowerCase()?.includes(searchTerm?.toLowerCase()));
  }
}

$: displayResults = filteredData?.slice(0, 50);

$: isSaved = !ruleOfList;

$: charNumber = $screenWidth < 640 ? 20 : 40;


</script>
  
  

  <svelte:head>

  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
  <title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ''} Stock Screener · stocknear
  </title>

  <meta name="description" content={`Build your Stock Screener to find profitable stocks.`}>
  <!-- Other meta tags -->
  <meta property="og:title" content={`Stock Screener · stocknear`}/>
  <meta property="og:description" content={`Build your Stock Screener to find profitable stocks.`} />
  <meta property="og:type" content="website"/>
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content={`Stock Screener · stocknear`}/>
  <meta name="twitter:description" content={`Build your Stock Screener to find profitable stocks.`} />
  <!-- Add more Twitter meta tags as needed -->

</svelte:head>
          
<svelte:window on:scroll={handleScroll} />


<section class="w-full max-w-3xl sm:max-w-screen-xl overflow-hidden min-h-screen pt-5 pb-40">

                    
            
    <div class="text-sm sm:text-[1rem] breadcrumbs ml-4">
      <ul>
        <li><a href="/" class="text-gray-300">Home</a></li> 
        <li><a href="/stock-screener" class="text-gray-300">Stock Screener</a></li>
        <li class="text-gray-300">{title ?? 'Demo'}</li>  
      </ul>
    </div>
  

            
            <!--Start Build Strategy-->
            <div class="bg-[#09090B] mt-5 sm:rounded-lg sm:border sm:hover:border-slate-700 sm:border-slate-800 pb-10">
      
              <div class="text-slate-300 font-bold text-2xl flex flex-row justify-center sm:justify-start items-center pt-10 pb-5 ml-3 sm:ml-10">
                Build Strategy


              <label for="userLogin" on:click={() => handleSave(true)} class="hidden sm:inline-flex ml-5 sm:hover:bg-purple-700 bg-purple-600 transition duration-100 cursor-pointer font-medium text-center text-white rounded-lg px-4 py-1 text-sm border border-slate-800">
                Save
              </label>
    
                
              </div>

             
  
                      
              <div class="mt-3 sm:mt-0 m-auto w-5/6 flex flex-col justify-center sm:flex-row sm:justify-between items-center sm:ml-10">
                <label id="step-1" for="ruleModal" class="w-full text-white text-sm bg-[#09090B] border border-slate-800 p-1.5 rounded-lg cursor-pointer">
                  <div class="flex justify-between items-center py-2 px-3">
                    {#if ruleName === ''}
                      Choose a rule
                    {:else}
                      {#each allRows as row}
                        {#if row.rule === ruleName}
                          <p >
                            {row.label}
                          </p>
                        {/if}
                      {/each}
                    {/if}
                  <svg class="w-3 h-3 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><g transform="rotate(180 512 512)"><path fill="white" d="M8.2 751.4c0 8.6 3.4 17.401 10 24.001c13.2 13.2 34.8 13.2 48 0l451.8-451.8l445.2 445.2c13.2 13.2 34.8 13.2 48 0s13.2-34.8 0-48L542 251.401c-13.2-13.2-34.8-13.2-48 0l-475.8 475.8c-6.8 6.8-10 15.4-10 24.2z"/></g></svg>
                  </div>
                  
                </label>
  
        
              </div>
  
                <!--Start Adding Rules-->
                <div class="flex flex-col space-y-2 pt-6 pb-6 justify-center items-center m-auto w-3/4 sm:w-full max-w-xl ">
                  

              <!--Start AI Trend Analysis Rule-->
               {#if ruleName === 'trendAnalysis'}
       
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 AI Trend Analysis (Bullish) {ruleCondition[ruleName]} {valueTrendAnalysis}%
  
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
               </div>

               <div class="w-full pt-5">
                <input type="range" min="0" max="100" step="1" bind:value={valueTrendAnalysis} class="range range-secondary" />
              </div>
          
               {/if}
               <!--End AI Trend Analysis Rule-->

                <!--Start AI Fundamental Analysis Rule-->
                {#if ruleName === 'fundamentalAnalysis'}
       
                <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                  AI Fund. Analysis (Bullish) {ruleCondition[ruleName]} {valueFundamentalAnalysis}%
   
                  <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                    <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                    <span class="label-text text-white">Below</span> 
                  </label>
                  <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                    <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                    <span class="label-text text-white">Above</span> 
                  </label>
                </div>
 
                <div class="w-full pt-5">
                 <input type="range" min="0" max="100" step="1" bind:value={valueFundamentalAnalysis} class="range range-secondary" />
               </div>
           
                {/if}
                <!--End AI Trend Analysis Rule-->

              {#if ruleName === 'freeCashFlowPerShare'}
      
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                FCF / Share {ruleCondition[ruleName]} {valueFCFShare}
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" name="radio-revenue-below" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" name="radio-revenue-above" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="-20" max="20" step="0.5" bind:value={valueFCFShare} class="range range-secondary" />
                </div>
      
              {/if}

              {#if ruleName === 'cashPerShare'}
      
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                Cash / Share {ruleCondition[ruleName]} {valueCashShare}
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" name="radio-revenue-below" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" name="radio-revenue-above" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="-50" max="50" step="1" bind:value={valueCashShare} class="range range-secondary" />
                </div>
      
              {/if}

              {#if ruleName === 'priceToFreeCashFlowsRatio'}
      
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                Price / FCF {ruleCondition[ruleName]} {valuePriceFCF}
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" name="radio-revenue-below" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" name="radio-revenue-above" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="-100" max="100" step="2" bind:value={valuePriceFCF} class="range range-secondary" />
                </div>
      
              {/if}


              {#if ruleName === 'revenue'}
      
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                Revenue {ruleCondition[ruleName]} ${valueRevenue} Bn
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" name="radio-revenue-below" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" name="radio-revenue-above" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="-100" max="800" step="10" bind:value={valueRevenue} class="range range-secondary" />
      
                </div>
      
              {/if}
    
              <!--Start Growth Of Revenue Rule-->
              {#if ruleName === 'growthRevenue'}
      
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                Revenue Growth {ruleCondition[ruleName]} {valueGrowthRevenue} %
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
              </div>
                <div class="w-full pt-5">
                  <input type="range" min="0" max="100" step="5" bind:value={valueGrowthRevenue} class="range range-secondary" />
      
                </div>
              {/if}
              <!--End Growth Of Revenue Rule-->
    
              <!--Start Cost Of Revenue Rule-->
              {#if ruleName === 'costOfRevenue'}
      
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                Cost of Revenue {ruleCondition[ruleName]} ${valueCostOfRevenue} Bn
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio"  class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
                <div class="w-full pt-5">
                  <input type="range" min="-100" max="800" step="10" bind:value={valueCostOfRevenue} class="range range-secondary" />
      
                </div>
              {/if}
              <!--End Cost Of Revenue Rule-->
  
              <!--Start Growth Of Cost Of Revenue Rule-->
              {#if ruleName === 'growthCostOfRevenue'}
      
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                Cost of Revenue Growth {ruleCondition[ruleName]} {valueGrowthCostOfRevenue} %
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
              </div>
                <div class="w-full pt-5">
                  <input type="range" min="0" max="100" step="5" bind:value={valueGrowthCostOfRevenue} class="range range-secondary" />
                </div>
              {/if}
              <!--End Growth Of Cost Of Revenue Rule-->
    
               <!--Start CostAndExpenses Rule-->
               {#if ruleName === 'costAndExpenses'}
       
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 Cost & Expenses {ruleCondition[ruleName]} ${valueCostAndExpenses} Bn
       
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
       
               </div>
       
                 
                 <div class="w-full pt-5">
                   <input type="range" min="-100" max="800" step="10" bind:value={valueCostAndExpenses} class="range range-secondary" />
       
                 </div>
       
               {/if}
               <!--End CostAndExpenses Rule-->
    
              <!--Start Growth Of Cost and Expenses Rule-->
              {#if ruleName === 'growthCostAndExpenses'}

              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                Cost & Expenses Growth {ruleCondition[ruleName]} {valueGrowthCostAndExpenses} %
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="0" max="100" step="5" bind:value={valueGrowthCostAndExpenses} class="range range-secondary" />
      
                </div>
      
              {/if}
              <!--End Growth Of Cost and Expenses Rule-->
    
              <!--Start Net Income Rule-->
              {#if ruleName === 'netIncome'}
      
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                Net Income {ruleCondition[ruleName]} ${valueNetIncome} Bn
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="0" max="100" step="5" bind:value={valueNetIncome} class="range range-secondary" />
      
                </div>
      
              {/if}
              <!--End Net Income Rule-->
  
  
              <!--Start Growth Net Income Rule-->
              {#if ruleName === 'growthNetIncome'}

              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                Net Income Growth {ruleCondition[ruleName]} {valueGrowthNetIncome} %
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="0" max="100" step="5" bind:value={valueGrowthNetIncome} class="range range-secondary" />
      
                </div>
      
              {/if}
              <!--End Growth Net Income Rule-->
    
    
              <!--Start Gross Profit Rule-->
              {#if ruleName === 'grossProfit'}

              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                Gross Profit {ruleCondition[ruleName]} ${valueGrossProfit} Bn
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
              </div>
                <div class="w-full pt-5">
                  <input type="range" min="-100" max="800" step="10" bind:value={valueGrossProfit} class="range range-secondary" />
                </div>    
              {/if}
              <!--End Gross Profit Rule-->
  
  
              <!--Start Growth Of Gross Profit Rule-->
              {#if ruleName === 'growthGrossProfit'}

      
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                Gross Profit Growth {ruleCondition[ruleName]} {valueGrowthGrossProfit} %
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="0" max="100" step="5" bind:value={valueGrowthGrossProfit} class="range range-secondary" />
      
                </div>
              {/if}
              <!--End Growth Of Gross Profit Rule-->
  
  
              <!--Start Research & Development Expenses Rule-->
              {#if ruleName === 'researchAndDevelopmentExpenses'}
      
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                R&D Expenses {ruleCondition[ruleName]} ${valueResearchAndDevelopmentExpenses} Bn
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
       
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="0" max="800" step="10" bind:value={valueResearchAndDevelopmentExpenses} class="range range-secondary" />
      
                </div>
      
              {/if}
              <!--End Research & Development Expenses Rule-->
  
              <!--Start Growth Of R&D Expenses-->
              {#if ruleName === 'growthResearchAndDevelopmentExpenses'}
      
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                R&D Growth {ruleCondition[ruleName]} {valueGrowthResearchAndDevelopmentExpenses} %
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="0" max="100" step="5" bind:value={valueGrowthResearchAndDevelopmentExpenses} class="range range-secondary" />
      
                </div>
              {/if}
              <!--End Growth Of R&D Expenses-->
    
    
  
               <!--Start Interest Income Rule-->
               {#if ruleName === 'interestIncome'}

               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 Interest Income {ruleCondition[ruleName]} ${valueInterestIncome === 1000 ? `${valueInterestIncome / 1000} Bn` : `${valueInterestIncome} Mio`}
  
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
        
               </div>
       
                 
                 <div class="w-full pt-5">
                   <input type="range" min="-500" max="800" step="100" bind:value={valueInterestIncome} class="range range-secondary" />
       
                 </div>
       
               {/if}
               <!--End Interest Income Rule-->
  
  
                <!--Start Interest Expenses Rule-->
                {#if ruleName === 'interestExpense'}

                <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                  Interest Expenses {ruleCondition[ruleName]} ${valueInterestExpenses === 1000 ? `${valueInterestExpenses / 1000} Bn` : `${valueInterestExpenses} Mio`}
   
                  <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                    <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                    <span class="label-text text-white">Below</span> 
                  </label>
                  <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                    <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                    <span class="label-text text-white">Above</span> 
                  </label>
                </div>
        
                  <div class="w-full pt-5">
                    <input type="range" min="-500" max="800" step="100" bind:value={valueInterestExpenses} class="range range-secondary" />
                  </div>      
                {/if}
                <!--End Interest Expenses Rule-->


                <!--Start Avg. Volume Rule-->
                {#if ruleName === 'avgVolume'}

                <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                  Avg. Volume {ruleCondition[ruleName]} {valueAvgVolume} Mio
   
                  <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                    <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                    <span class="label-text text-white">Below</span> 
                  </label>
                  <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                    <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                    <span class="label-text text-white">Above</span> 
                  </label>
                </div>
        
                  <div class="w-full pt-5">
                    <input type="range" min="1" max="50" step="1" bind:value={valueAvgVolume} class="range range-secondary" />
                  </div>      
                {/if}
                <!--End Avg. Volume Rule-->
  
  
                <!--Start Growth Of Interest Expenses-->
              {#if ruleName === 'growthInterestExpense'}
      
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                Interest Expenses Growth {ruleCondition[ruleName]} {valueGrowthInterestExpenses} %
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="-100" max="200" step="10" bind:value={valueGrowthInterestExpenses} class="range range-secondary" />
      
                </div>
              {/if}
              <!--End Growth Of Interest Expenses-->
  
  
  
               <!--Start Operating Expenses Rule-->
               {#if ruleName === 'operatingExpenses'}
               
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 Operating Expenses {ruleCondition[ruleName]} ${valueOperatingExpenses} Bn
  
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
               </div>
       
                 <div class="w-full pt-5">
                   <input type="range" min="-100" max="800" step="10" bind:value={valueOperatingExpenses} class="range range-secondary" />
                 </div>      
               {/if}
               <!--End Operating Expenses Rule-->
  
  
                 <!--Start Growth Of Operating Expenses-->
                {#if ruleName === 'growthOperatingExpenses'}
        
                <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                  Operating Expenses Growth {ruleCondition[ruleName]} {valueGrowthOperatingExpenses} %
        
                  <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                    <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                    <span class="label-text text-white">Below</span> 
                  </label>
                  <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                    <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                    <span class="label-text text-white">Above</span> 
                  </label>
        
                </div>
        
                  
                  <div class="w-full pt-5">
                    <input type="range" min="0" max="100" step="5" bind:value={valueGrowthOperatingExpenses} class="range range-secondary" />
        
                  </div>
                {/if}
                <!--End Growth Of Operating Expenses-->
  
  
  
  
               <!--Start Operating Income Rule-->
               {#if ruleName === 'operatingIncome'}
       
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 Operating Income {ruleCondition[ruleName]} ${valueOperatingIncome} Bn
  
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
               </div>
       
                 <div class="w-full pt-5">
                   <input type="range" min="-100" max="800" step="10" bind:value={valueOperatingIncome} class="range range-secondary" />
                 </div>      
               {/if}
               <!--End Operating Income Rule-->
  
  
  
               <!--Start Growth Of Operating Income-->
               {#if ruleName === 'growthOperatingIncome'}
       
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 Operating Income Growth {ruleCondition[ruleName]} {valueGrowthOperatingIncome} %
       
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
       
               </div>
       
                 
                 <div class="w-full pt-5">
                   <input type="range" min="0" max="100" step="5" bind:value={valueGrowthOperatingIncome} class="range range-secondary" />
       
                 </div>
               {/if}
               <!--End Growth Of Operating Income-->
  
  
               <!--Start Analyst Rule-->
               {#if ruleName === 'ratingRecommendation'}
       
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                Analyst Rating:
                {#if ruleTrend[ruleName] === 'Hold'}
                  <span class="text-[#FF9F00] font-medium ml-1">{ruleTrend[ruleName]}</span>
                {:else if ruleTrend[ruleName].includes('Buy')}
                  <span class="text-[#10DB06] ml-1">{ruleTrend[ruleName]}</span>
                {:else if ruleTrend[ruleName].includes('Sell')}
                  <span class="text-[#FF2F1F] ml-1">{ruleTrend[ruleName]}</span>
                {/if}
              </div>
              
       
                 
                 <div class="w-full pt-5">
                   <input type="range" min="0" max="2" step="1" bind:value={valueAnalyst} class="range range-secondary" />
       
                 </div>
       
               {/if}
               <!--End Analyst Rule-->
                
              {#if ruleName === 'enterpriseValue'}
       
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 Enterprise Val {ruleCondition[ruleName]} ${valueEnterpriseValue} Bn
       
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
       
               </div>
       
                 
                 <div class="w-full pt-5">
                   <input type="range" min="10" max="800" step="10" bind:value={valueEnterpriseValue} class="range range-secondary" />
       
                 </div>
       
               {/if}

    
               {#if ruleName === 'marketCap'}
       
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 Market Cap {ruleCondition[ruleName]} ${valueMarketCap} Bn
       
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
       
               </div>
       
                 
                 <div class="w-full pt-5">
                   <input type="range" min="10" max="800" step="10" bind:value={valueMarketCap} class="range range-secondary" />
       
                 </div>
       
               {/if}
    
               {#if ruleName === 'currentRatio'}
              
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 Current Ratio {ruleCondition[ruleName]} {valueCurrentRatio}
       
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
       
               </div>
       
                 
                 <div class="w-full pt-5">
                   <input type="range" min="0" max="50" step="0.5" bind:value={valueCurrentRatio} class="range range-secondary" />
       
                 </div>
       
               {/if}

               {#if ruleName === 'quickRatio'}
              
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 Quick Ratio {ruleCondition[ruleName]} {valueQuickRatio}
       
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
       
               </div>
       
                 
                 <div class="w-full pt-5">
                   <input type="range" min="0" max="50" step="0.5" bind:value={valueQuickRatio} class="range range-secondary" />
       
                 </div>
       
               {/if}
                
               {#if ruleName === 'returnOnAssets'}
              
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 Return on Assets {ruleCondition[ruleName]} {valueReturnOnAssets}
       
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
       
               </div>
       
                 
                 <div class="w-full pt-5">
                   <input type="range" min="-5" max="5" step="0.1" bind:value={valueReturnOnAssets} class="range range-secondary" />
       
                 </div>
       
               {/if}


               {#if ruleName === 'returnOnEquity'}
              
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 Return on Equity {ruleCondition[ruleName]} {valueReturnOnEquity}
       
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
       
               </div>
       
                 
                 <div class="w-full pt-5">
                   <input type="range" min="-5" max="5" step="0.1" bind:value={valueReturnOnEquity} class="range range-secondary" />
       
                 </div>
       
               {/if}

               {#if ruleName === 'debtRatio'}
              
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 Debt Ratio {ruleCondition[ruleName]} {valueDebtRatio}
       
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
       
               </div>
       
                 
                 <div class="w-full pt-5">
                   <input type="range" min="0" max="50" step="0.5" bind:value={valueDebtRatio} class="range range-secondary" />
       
                 </div>
       
               {/if}


               {#if ruleName === 'debtEquityRatio'}
              
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 Debt Equity Ratio {ruleCondition[ruleName]} {valueDebtEquityRatio}
       
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
       
               </div>
       
                 
                 <div class="w-full pt-5">
                   <input type="range" min="0" max="50" step="0.5" bind:value={valueDebtEquityRatio} class="range range-secondary" />
       
                 </div>
       
               {/if}

              <!--Start Rule-->
              {#if ruleName === 'payoutRatio'}
              
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                Dividend Growth {ruleCondition[ruleName]} {valuePayoutRatio}%
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="-100" max="100" step="1" bind:value={valuePayoutRatio} class="range range-secondary" />
      
                </div>
      
              {/if}
              <!--End Rule-->

                <!--Start Rule-->
              {#if ruleName === 'dividendGrowth'}
              
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                Dividend Growth {ruleCondition[ruleName]} {valueDividendGrowth}%
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="0" max="100" step="1" bind:value={valueDividendGrowth} class="range range-secondary" />
      
                </div>
      
              {/if}
              <!--End Rule-->

               
              <!--Start Rule-->
              {#if ruleName === 'dividendYield'}
              
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                Dividend Yield {ruleCondition[ruleName]} {valueDividendYield}%
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="0" max="100" step="0.5" bind:value={valueDividendYield} class="range range-secondary" />
      
                </div>
      
              {/if}
              <!--End Rule-->


               <!--Start Rule-->
               {#if ruleName === 'annualDividend'}
              
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 Annual Dividend {ruleCondition[ruleName]} ${valueAnnualDividend}
       
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
       
               </div>
       
                 
                 <div class="w-full pt-5">
                   <input type="range" min="0" max="20" step="0.5" bind:value={valueAnnualDividend} class="range range-secondary" />
       
                 </div>
       
               {/if}
               <!--End Rule-->

              <!--Start EPS Rule-->
              {#if ruleName === 'eps'}
              
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                EPS {ruleCondition[ruleName]} ${valueEPS}
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="1" max="10" step="1" bind:value={valueEPS} class="range range-secondary" />
      
                </div>
      
              {/if}
              <!--End EPS Rule-->
    
              <!--Start Growth of EPS Rule-->
              {#if ruleName === 'growthEPS'}
      
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                EPS Growth {ruleCondition[ruleName]} {valueGrowthEPS} %
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="-100" max="200" step="10" bind:value={valueGrowthEPS} class="range range-secondary" />
      
                </div>
      
              {/if}
              <!--End Growth of EPS Rule-->
    
    
               <!--Start PE Rule-->
               {#if ruleName === 'pe'}       
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 PE Ratio {ruleCondition[ruleName]} {valuePE}
       
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
       
               </div>
    
                 <div class="w-full pt-5">
                   <input type="range" min="0" max="100" step="5" bind:value={valuePE} class="range range-secondary" />
       
                 </div>
       
               {/if}
               <!--End PE Rule-->

                <!--Start PE Rule-->
                {#if ruleName === 'forwardPE'}
                <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                  Forward PE {ruleCondition[ruleName]} {valueForwardPE}
        
                  <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                    <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                    <span class="label-text text-white">Below</span> 
                  </label>
                  <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                    <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                    <span class="label-text text-white">Above</span> 
                  </label>
        
                </div>
     
                  <div class="w-full pt-5">
                    <input type="range" min="-100" max="100" step="5" bind:value={valueForwardPE} class="range range-secondary" />
        
                  </div>
        
                {/if}
                <!--End PE Rule-->

               <!--Start Price to Book Ratio Rule-->
               {#if ruleName === 'priceToBookRatio'}       
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 PB Ratio {ruleCondition[ruleName]} {valuePriceToBookRatio}
       
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
       
               </div>
    
                 <div class="w-full pt-5">
                   <input type="range" min="0" max="20" step="1" bind:value={valuePriceToBookRatio} class="range range-secondary" />
       
                 </div>
       
               {/if}
               <!--End Price to Book Ratio Rule-->

               <!--Start Price to Sales Ratio Rule-->
               {#if ruleName === 'priceToSalesRatio'}       
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 PS Ratio {ruleCondition[ruleName]} {valuePriceToSalesRatio}
       
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
       
               </div>
    
                 <div class="w-full pt-5">
                   <input type="range" min="0" max="50" step="1" bind:value={valuePriceToSalesRatio} class="range range-secondary" />
       
                 </div>
       
               {/if}
               <!--Start Price to Sales Ratio Rule-->

               <!--Start Growth Of Gross Profit Rule-->
              {#if ruleName === 'var'}

      
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                VaR {ruleCondition[ruleName]} {valueVaR}%
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="-20" max="0" step="0.5" bind:value={valueVaR} class="range range-secondary" />
      
                </div>
              {/if}
              <!--End Growth Of Gross Profit Rule-->
    
               <!--Start Beta Rule-->
               {#if ruleName === 'beta'}

               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 Beta {ruleCondition[ruleName]} {valueBeta}
       
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
               </div>
                 <div class="w-full pt-5">
                   <input type="range" min="-10" max="10" step="0.1" bind:value={valueBeta} class="range range-secondary" />
                 </div>
               {/if}
               <!--End Beta Rule-->
    
                <!--Start EBITDA Rule-->
                {#if ruleName === 'ebitda'}
                <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                  EBITDA {ruleCondition[ruleName]} ${valueEBITDA} Bn
        
                  <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                    <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                    <span class="label-text text-white">Below</span> 
                  </label>
                  <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                    <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                    <span class="label-text text-white">Above</span> 
                  </label>
        
                </div>
     
                  <div class="w-full pt-5">
                    <input type="range" min="-100" max="800" step="10" bind:value={valueEBITDA} class="range range-secondary" />
        
                  </div>
        
                {/if}
                <!--End EBITDA Rule-->
    
                 <!--Start Growth of EBITDA Rule-->
              {#if ruleName === 'growthEBITDA'}
      
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                EBITDA Growth {ruleCondition[ruleName]} {valueGrowthEBITDA} %
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="0" max="100" step="5" bind:value={valueGrowthEBITDA} class="range range-secondary" />
      
                </div>
      
              {/if}
              <!--End Growth of EBITDA Rule-->
    
    
    
        

                <!--Start RSI Rule-->
                {#if ruleName === 'rsi'}
                <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                  RSI {ruleCondition[ruleName]} {valueRSI}
       
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
               </div>
                 
                 <div class="w-full pt-5">
                   <input type="range" min="0" max="100" step="5" bind:value={valueRSI} class="range range-secondary" />
                 </div>
               {/if}
               <!--End RSI Rule-->


                <!--Start Stoch RSI Rule-->
                {#if ruleName === 'stochRSI'}
                <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                  Stoch RSI {ruleCondition[ruleName]} {valueStochRSI}
       
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
               </div>
                 
                 <div class="w-full pt-5">
                   <input type="range" min="0" max="100" step="5" bind:value={valueStochRSI} class="range range-secondary" />
                 </div>
               {/if}
               <!--End Stoch RSI Rule-->


              <!--Start MFI Rule-->
                {#if ruleName === 'mfi'}
                <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                  MFI {ruleCondition[ruleName]} {valueMFI}
       
                 <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                   <span class="label-text text-white">Below</span> 
                 </label>
                 <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                   <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                   <span class="label-text text-white">Above</span> 
                 </label>
               </div>
                 
                 <div class="w-full pt-5">
                   <input type="range" min="0" max="100" step="5" bind:value={valueMFI} class="range range-secondary" />
                 </div>
               {/if}
               <!--End MFI Rule-->

               <!--Start CCI Rule-->
               {#if ruleName === 'cci'}
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 CCI {ruleCondition[ruleName]} {valueCCI}
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
              </div>
                
                <div class="w-full pt-5">
                  <input type="range" min="-300" max="300" step="10" bind:value={valueCCI} class="range range-secondary" />
                </div>
              {/if}
              <!--End CCI Rule-->

               <!--Start ATR Rule-->
               {#if ruleName === 'atr'}
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 ATR {ruleCondition[ruleName]} {valueATR}
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
              </div>
                
                <div class="w-full pt-5">
                  <input type="range" min="0" max="20" step="1" bind:value={valueATR} class="range range-secondary" />
                </div>
              {/if}
              <!--End ATR Rule-->

               <!--Start SMA-50 Rule-->
               {#if ruleName === 'sma50'}
       
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 SMA-50 {ruleCondition[ruleName]} {valueSMA50}
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="0" max="500" step="10" bind:value={valueSMA50} class="range range-secondary" />
                </div>
      
              {/if}
              <!--End SMA-50 Rule-->

               <!--Start SMA-200 Rule-->
               {#if ruleName === 'sma200'}
       
               <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                 SMA-200 {ruleCondition[ruleName]} {valueSMA200}
      
                <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                  <span class="label-text text-white">Below</span> 
                </label>
                <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                  <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                  <span class="label-text text-white">Above</span> 
                </label>
      
              </div>
      
                
                <div class="w-full pt-5">
                  <input type="range" min="0" max="500" step="10" bind:value={valueSMA200} class="range range-secondary" />
                </div>
      
              {/if}
              <!--End SMA-200 Rule-->


              <!--Start EMA-50 Rule-->
              {#if ruleName === 'ema50'}
       
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                EMA-50 {ruleCondition[ruleName]} {valueEMA50}
     
               <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                 <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                 <span class="label-text text-white">Below</span> 
               </label>
               <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                 <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                 <span class="label-text text-white">Above</span> 
               </label>
     
             </div>
     
               
               <div class="w-full pt-5">
                 <input type="range" min="0" max="500" step="10" bind:value={valueEMA50} class="range range-secondary" />
               </div>
     
             {/if}
             <!--End SMA-50 Rule-->

              <!--Start SMA-200 Rule-->
              {#if ruleName === 'ema200'}
      
              <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
                EMA-200 {ruleCondition[ruleName]} {valueEMA200}
     
               <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                 <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                 <span class="label-text text-white">Below</span> 
               </label>
               <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                 <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                 <span class="label-text text-white">Above</span> 
               </label>
     
             </div>
     
               
               <div class="w-full pt-5">
                 <input type="range" min="0" max="500" step="10" bind:value={valueEMA200} class="range range-secondary" />
               </div>
     
             {/if}
             <!--End SMA-200 Rule-->

             <!--Start Change 1W Rule-->
             {#if ruleName === 'change1W'}
             <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
               Change 1W {ruleCondition[ruleName]} {valueChange1W}%
              <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                <span class="label-text text-white">Below</span> 
              </label>
              <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                <span class="label-text text-white">Above</span> 
              </label>
              </div>
              <div class="w-full pt-5">
                <input type="range" min="-20" max="20" step="1" bind:value={valueChange1W} class="range range-secondary" />
              </div>
            {/if}
            <!--End Change 1W Rule-->

             <!--Start Change 1M Rule-->
             {#if ruleName === 'change1M'}
             <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
               Change 1M {ruleCondition[ruleName]} {valueChange1M}%
              <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                <span class="label-text text-white">Below</span> 
              </label>
              <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                <span class="label-text text-white">Above</span> 
              </label>
              </div>
              <div class="w-full pt-5">
                <input type="range" min="-50" max="50" step="5" bind:value={valueChange1M} class="range range-secondary" />
              </div>
            {/if}
            <!--End Change 1M Rule-->

             <!--Start Change 3M Rule-->
             {#if ruleName === 'change3M'}
             <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
               Change 3M {ruleCondition[ruleName]} {valueChange3M}%
              <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                <span class="label-text text-white">Below</span> 
              </label>
              <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                <span class="label-text text-white">Above</span> 
              </label>
              </div>
              <div class="w-full pt-5">
                <input type="range" min="-100" max="100" step="5" bind:value={valueChange3M} class="range range-secondary" />
              </div>
            {/if}
            <!--End Change 3M Rule-->

             <!--Start Change 6M Rule-->
             {#if ruleName === 'change6M'}
             <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
               Change 6M {ruleCondition[ruleName]} {valueChange6M}%
              <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                <span class="label-text text-white">Below</span> 
              </label>
              <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                <span class="label-text text-white">Above</span> 
              </label>
              </div>
              <div class="w-full pt-5">
                <input type="range" min="-100" max="100" step="5" bind:value={valueChange6M} class="range range-secondary" />
              </div>
            {/if}
            <!--End Change 6M Rule-->

             <!--Start Change 1Y Rule-->
             {#if ruleName === 'change1Y'}
             <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
               Change 1Y {ruleCondition[ruleName]} {valueChange1Y}%
              <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                <span class="label-text text-white">Below</span> 
              </label>
              <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                <span class="label-text text-white">Above</span> 
              </label>
              </div>
              <div class="w-full pt-5">
                <input type="range" min="-300" max="300" step="10" bind:value={valueChange1Y} class="range range-secondary" />
              </div>
            {/if}
            <!--End Change 1Y Rule-->

             <!--Start Change 3Y Rule-->
             {#if ruleName === 'change3Y'}
             <div class="w-full max-w-xl text-white font-medium text-sm sm:text-[1rem] flex flex-row justify-center items-center">
               Change 3Y {ruleCondition[ruleName]} {valueChange3Y}%
              <label on:click={() => changeRuleCondition('below')} class="ml-5 cursor-pointer flex flex-row mr-2 justify-center items-center">
                <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'below'} />
                <span class="label-text text-white">Below</span> 
              </label>
              <label on:click={() => changeRuleCondition('above')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" checked={ruleCondition[ruleName] === 'above'} />
                <span class="label-text text-white">Above</span> 
              </label>
              </div>
              <div class="w-full pt-5">
                <input type="range" min="-500" max="500" step="10" bind:value={valueChange3Y} class="range range-secondary" />
              </div>
            {/if}
            <!--End Change 3Y Rule-->
             
              
              
              
  
                </div>
  
                  <!--End Adding Rules-->
  
                  <!--Start Rules Preview -->
                                
                  
                  <div id="step-3" class="m-auto w-5/6 bg-[#09090B] sm:ml-10 h-auto max-h-[400px] no-scrollbar overflow-hidden overflow-y-scroll p-5 sm:rounded-lg border-b sm:border sm:hover:border-slate-700 border-slate-800 pb-10">
                    <div class="flex flex-row items-center pb-5 sm:pb-0">
                      <div class="text-white font-bold text-xl sm:text-2xl flex justify-start items-center">
                        {ruleOfList.length} Rules Preview
                      </div>
                      <label on:click={handleResetAll} class="ml-auto cursor-pointer transition duration-100 bg-purple-600 sm:hover:bg-purple-700 border border-slate-800 py-2 px-3 rounded-lg text-white text-sm">
                        Reset All
                      </label>
                    </div>
                    {#if ruleOfList.length === 0}
                    <div class="text-slate-300 font-medium text-sm sm:text-md flex flex-row justify-start items-center mt-4">
                      <svg class="w-3 h-3 sm:w-4 sm:h-4 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill="#ffcc4d" d="M19.59 15.86L12.007 1.924C11.515 1.011 10.779.5 9.989.5c-.79 0-1.515.521-2.016 1.434L.409 15.861c-.49.901-.544 1.825-.138 2.53c.405.707 1.216 1.109 2.219 1.109h15.02c1.003 0 1.814-.402 2.22-1.108c.405-.706.351-1.619-.14-2.531ZM10 4.857c.395 0 .715.326.715.728v6.583c0 .402-.32.728-.715.728a.721.721 0 0 1-.715-.728V5.584c0-.391.32-.728.715-.728Zm0 11.624c-.619 0-1.11-.51-1.11-1.14c0-.63.502-1.141 1.11-1.141c.619 0 1.11.51 1.11 1.14c0 .63-.502 1.141-1.11 1.141Z"/></svg>
                      At least 1 rule is required 
                    </div>

                  {:else}
                  
                  {#each ruleOfList as rule}
                      <div class="flex flex-row mt-4">

                      <label on:click={() => handleUpdateRule(rule)} class=" cursor-pointer text-slate-300 sm:font-medium text-sm sm:text-md">

                        <svg class="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 text-green-400 inline-block" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>

                        {ruleMappings[rule.name] || rule.name} · {formatRuleValue(rule)}
                        </label>

                        <label on:click={() => handleDeleteRule(rule.name)} class="text-sm text-[#FF3131] cursor-pointer ml-auto sm:ml-0">
                          <svg class="h-6 w-6 ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M7 21q-.825 0-1.413-.588T5 19V6q-.425 0-.713-.288T4 5q0-.425.288-.713T5 4h4q0-.425.288-.713T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5q0 .425-.288.713T19 6v13q0 .825-.588 1.413T17 21H7ZM7 6v13h10V6H7Zm2 10q0 .425.288.713T10 17q.425 0 .713-.288T11 16V9q0-.425-.288-.713T10 8q-.425 0-.713.288T9 9v7Zm4 0q0 .425.288.713T14 17q.425 0 .713-.288T15 16V9q0-.425-.288-.713T14 8q-.425 0-.713.288T13 9v7ZM7 6v13V6Z"/></svg>  
                        </label>
                      </div>
                    {/each}
                  {/if}
                </div>

                <!--End Rules Preview-->
  
            </div>
            <!--End Build Strategy-->
  
  
             
               <!--Start Running Mode Preview-->    
               <div class="bg-[#09090B] sm:border border-slate-800 sm:hover:border-slate-700 mt-5 sm:rounded-2xl ">
                
                
                 <!--Start Number of Matches-->
  
                  <div class="text-slate-300 font-bold text-xl flex justify-center sm:justify-start items-center ml-3 sm:ml-5 pt-5 pb-5">
                    {ruleOfList?.length !== 0 ? filteredData?.length : 0} Matches Found
                      <label for="modeInfo" class="cursor-pointer">
                        <!--<svg class="w-6 h-6 inline-block ml-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#09090B000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="info-circle"> <g> <circle cx="12" cy="12" data-name="--Circle" fill="none" id="_--Circle" r="10" stroke="#B46266" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></circle> <line fill="none" stroke="#B46266" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="12" y2="16"></line> <line fill="none" stroke="#B46266" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="8" y2="8"></line> </g> </g> </g> </g></svg>-->
                      </label>
                  </div>
  
                <!--End Number of Matches-->
                  
                <!--Start Matching Preview-->
              
                {#if displayResults?.length !== 0 && ruleOfList?.length !== 0}
                
                  <div class="w-full rounded-lg overflow-x-scroll p-0 sm:p-3">
                    <table class="table table-sm table-compact w-full bg-[#09090B] border-bg-[#09090B]">
                      <thead>
                        <tr class="border-b-[#1A1A27]">
                          <th class="text-white bg-[#09090B] text-sm border-b-[#09090B]">Symbol</th>
                          <th class="text-white hidden sm:table-cell bg-[#09090B] text-sm border-b-[#09090B]">Company Name</th>
                          <th on:click={() => { sortBy = 'marketCap'; changeOrder(order); }} class="whitespace-nowrap cursor-pointer text-white font-semibold text-sm text-center">
                            Market Cap
                            <svg class="w-5 h-5 inline-block {order === 'highToLow' && sortBy === 'marketCap' ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor" style="max-width:40px"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                          </th>
                          <th on:click={() => { sortBy = 'change'; changeOrder(order); }} class="whitespace-nowrap cursor-pointer text-white font-semibold text-sm text-center">
                            % Change
                            <svg class="w-5 h-5 inline-block {order === 'highToLow' && sortBy === 'change' ? '' : 'rotate-180'}" viewBox="0 0 20 20" fill="currentColor" style="max-width:40px"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                          </th>
                          <th class="text-white bg-[#09090B] text-end text-sm border-b-[#09090B]">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each displayResults as item}
                        <tr on:click={() => {handleSave(false); goto("/stocks/"+item?.symbol)}} class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] bg-[#09090B] border-b-[#09090B] odd:bg-[#27272A] cursor-pointer">
                          <td class="border-b-[#09090B] whitespace-nowrap">
                            <div class="flex flex-col items-start">
                              <span class="text-blue-400">{item?.symbol}</span>
                              <span class="text-white text-xs sm:hidden">{item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}</span>
                            </div>
                            
                          </td>
                          
                          <td class="hidden sm:table-cell text-white border-b-[#09090B]">
                            {item?.name?.length > charNumber ? item?.name?.slice(0,charNumber) + "..." : item?.name}
                          </td>
                          
                          <td class="text-white text-sm sm:text-[1rem] text-center border-b-[#09090B]">
                              {#if item?.symbol?.includes('.DE') || item?.symbol?.includes('.F')}
                                €{item?.marketCap < 100 ? '< $100' : abbreviateNumber(item?.marketCap)}
                              {:else}
                                {item?.marketCap < 100 ? '< $100' : abbreviateNumber(item?.marketCap,true)}
                              {/if}
                          </td>

                          <td class="text-white text-center text-sm sm:text-[1rem] font-medium border-b-[#09090B]">
                            {#if item?.changesPercentage >=0}
                              <span class="text-[#10DB06]">+{item?.changesPercentage >= 1000 ? abbreviateNumber(item?.changesPercentage) : item?.changesPercentage?.toFixed(2)}%</span>
                            {:else}
                              <span class="text-[#FF2F1F]">{item?.changesPercentage <= -1000 ? abbreviateNumber(item?.changesPercentage) : item?.changesPercentage?.toFixed(2)}% </span> 
                            {/if}
                          </td>

                          <td class="text-white text-sm sm:text-[1rem] text-end border-b-[#09090B]">
                            {item.price < 0.01 ? '< $0.01' :item.price?.toFixed(2)}
                        </td>                   
                        </tr>
                        
                        
                        {/each}
                      </tbody>
                    </table>
                  </div>

                {/if}
              
                  <!--End Matching Preview-->
              </div>
      
      


</section>
          
          
      

    

<div class="sm:hidden fixed z-40 bottom-8 sm:bottom-10 right-8 sm:right-16">
  <label on:click={() => handleSave(true)} class="inline-flex items-center justify-center w-12 h-12 sm:w-full sm:h-10 font-medium bg-purple-600 ml-1 mr-0 sm:mr-2 rounded-full cursor-pointer">
    <svg class="w-6 h-6 text-white inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path fill="white" d="M21 7v12q0 .825-.588 1.413T19 21H5q-.825 0-1.413-.588T3 19V5q0-.825.588-1.413T5 3h12l4 4Zm-9 11q1.25 0 2.125-.875T15 15q0-1.25-.875-2.125T12 12q-1.25 0-2.125.875T9 15q0 1.25.875 2.125T12 18Zm-6-8h9V6H6v4Z"/>
    </svg>
  </label>
</div>


  <!--
  <div class="tabs w-screen mb-5 ">
    <label on:click={() => handleRuleTab('all')} class="tab mr-2 text-white font-medium transition duration-150 ease-out hover:ease-in rounded-md hover:bg-[#333333] {displayTab === 'all' ? 'bg-[#333333]' : ''}">
      All
    </label> 
    <label on:click={() => handleRuleTab('ta')} class="tab mr-2 text-white font-medium transition duration-150 ease-out hover:ease-in rounded-md hover:bg-[#333333] {displayTab === 'ta' ? 'bg-[#333333]' : ''}">
      Technical Indicators
    </label> 
    <label on:click={() => handleRuleTab('fund')} class="tab mr-2 text-white font-medium transition duration-150 ease-out hover:ease-in rounded-md hover:bg-[#333333] {displayTab === 'fund' ? 'bg-[#333333]' : ''}">
      Fundamental Data
    </label> 
  </div>
-->

{#if $screenWidth >= 640}
<!--Start Choose Rule Modal-->
<input type="checkbox" id="ruleModal" class="modal-toggle" />

<dialog id="ruleModal" class="modal modal-bottom sm:modal-middle ">


  <label id="ruleModal" for="ruleModal" on:click={() => searchTerm = ''} class="cursor-pointer modal-backdrop bg-[#000] bg-opacity-[0.5]"></label>
  
  
  <div class="modal-box w-full bg-[#262626] border border-slate-800  h-[800px] overflow-hidden ">


    <div class="flex flex-col w-full mt-10 sm:mt-0">

    
      <div class="text-white text-3xl font-semibold mb-5">
        Choose Rules
      </div>

      <!--Start Search bar-->
      <form class="w-11/12 h-8 mb-8" on:keydown={(e) => e?.key === 'Enter' ? e.preventDefault() : '' }>   
        <label for="search" class="mb-2 text-sm font-medium text-gray-200 sr-only">Search</label>
        <div class="relative">
            <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <svg class="w-4 h-4 text-gray-200 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                </svg>
            </div>
            <input 
              autocomplete="off"
              type="search"
              id="search"
              class="placeholder-gray-300 block w-full p-2 ps-10 text-sm text-gray-200 border border-gray-300 rounded-lg bg-[#404040] border border-blue-500"
              placeholder="Search"
              bind:value={searchTerm}
              />
        </div>
      </form>
      <!-- End Search bar-->

      <div class="text-white text-sm bg-[#262626] bg-opacity-[0.4] overflow-y-scroll scroller pt-3 rounded-lg max-h-[500px] sm:max-h-[420px] md:max-h-[540px] lg:max-h-[600px]">

        <div class="text-white relative">
          
        {#if searchTerm?.length !== 0 && filteredRows?.length === 0}
          <span class="text-lg text-white font-medium flex justify-center items-center m-auto">
            Nothing Found
          </span>
        {:else}

        <table class="table table-sm table-compact">
          <!-- head -->
          <tbody>
            {#each (searchTerm?.length !== 0 ? filteredRows : allRows) as row, index}
              <tr on:click={() => changeRule(row?.rule)} class="hover:bg-[#333333] cursor-pointer">
                <td class="border-b border-[#262626]">{index+1}</td>
                <td class="text-start border-b border-[#262626]">
                  {#if ruleOfList.find((rule) => rule?.name === row?.rule)}
                  <svg class="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 text-green-400 inline-block" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                  {/if}
                </td>
                <td class="text-start border-b border-[#262626]">{row?.label}</td>
              </tr>
            {/each}

          </tbody>
        </table>
        {/if}

    </div>

    </div>

        
      </div>
  </dialog>
<!--End Choose Rule Modal-->
{:else}

<div class="drawer drawer-end z-50">
  <input id="ruleModal" type="checkbox" class="drawer-toggle" />

  <div class="drawer-side overflow-x-hidden">
    
    
    <div class="menu w-screen min-h-full bg-[#000] text-base-content overflow-hidden">
      <div style="top: 0rem;" class="flex flex-row fixed sticky h-14 z-40 bg-[#000] justify-center items-center w-full border-b border-slate-900">
          <label on:click={() => searchTerm = ''} for="ruleModal" class="cursor-pointer mr-auto ml-3">
            <svg class="w-6 h-6 inline-block " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M9.125 21.1L.7 12.7q-.15-.15-.213-.325T.425 12q0-.2.063-.375T.7 11.3l8.425-8.425q.35-.35.875-.35t.9.375q.375.375.375.875t-.375.875L3.55 12l7.35 7.35q.35.35.35.863t-.375.887q-.375.375-.875.375t-.875-.375Z"/></svg>
          </label>

      </div>

          <div class="flex flex-row items-center justify-center w-full m-auto mb-8 mt-5">
            
            <!--Start Search bar-->
            <form class="w-11/12 h-8" on:keydown={(e) => e?.key === 'Enter' ? e.preventDefault() : '' }>   
              <label for="search" class="mb-2 text-sm font-medium text-gray-200 sr-only">Search</label>
              <div class="relative">
                  <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                      <svg class="w-4 h-4 text-gray-200 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                      </svg>
                  </div>
                  <input 
                    autocomplete="off"
                    type="search"
                    id="search"
                    class="placeholder-gray-300 block w-full p-2 ps-10 text-sm text-gray-200 border border-gray-300 rounded-lg bg-[#404040] border border-blue-500"
                    placeholder="Search"
                    bind:value={searchTerm}
                    />
              </div>
            </form>
            <!-- End Search bar-->
          </div>
          
          
      
     
      
          {#if searchTerm?.length !== 0 && filteredRows?.length === 0}
            <span class="text-lg text-white font-medium flex justify-center items-center mt-5">
              Nothing Found
            </span>
          {:else}

          <table class="table table-sm table-compact overflow-y-scroll text-white mb-10">
            <!-- head -->
            <tbody>
              {#each (searchTerm?.length !== 0 ? filteredRows : allRows) as row, index}
                <tr on:click={() => changeRule(row?.rule)} class="hover:bg-[#333333] border-b border-slate-800 cursor-pointer">
                  <td class="w-6">{index+1}</td>
                  <td class="w-3">
                    {#if ruleOfList.find((rule) => rule?.name === row?.rule)}
                    <svg class="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 text-green-400 inline-block" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                    {/if}
                  </td>
                  <td class="text-start">{row?.label}</td>
                </tr>
              {/each}

            </tbody>
          </table>
          {/if}


    </div>
  </div>
</div>

{/if}

      
      
<!--Start Login Modal-->
{#if LoginPopup}
   <LoginPopup form={form}/>    
{/if}
<!--End Login Modal-->



<style>
.scroller {
  scrollbar-width: thin;
}

</style>
