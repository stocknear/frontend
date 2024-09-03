<script lang='ts'>
  import { onMount } from 'svelte';
  import { goto} from '$app/navigation';
  import { screenWidth, strategyId, numberOfUnreadNotification, getCache, setCache} from '$lib/store';
  import toast from 'svelte-french-toast';
  import { abbreviateNumber } from '$lib/utils';
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  //const userConfirmation = confirm('Unsaved changes detected. Leaving now will discard your strategy. Continue?');

  export let data;
  export let form;
  
  $strategyId = data?.getStrategyId;
  let ruleOfList = data?.getStrategy?.rules ?? [];
  let displayRules = [];
  let selectedPopularStrategy = ''; 
  const title = data?.getStrategy?.title;

  let stockScreenerData = data?.getStockScreenerData?.filter(item => 
  Object?.values(item)?.every(value => 
    value !== null && value !== undefined && 
    (typeof value !== 'object' || Object?.values(value)?.every(subValue => subValue !== null && subValue !== undefined))
  )
);


// Define all possible rules and their properties
const allRules = {
  avgVolume: { label: 'Avg Volume', step: [100,50,20,10,5,1], unit: 'M', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  rsi: { label: 'RSI', step: [90,80,70,60,50,40,30,20], unit: '', category: 'ta', defaultCondition: 'over', defaultValue: 'any' },
  stochRSI: { label: 'Stoch RSI Fast', step: [90,80,70,60,50,40,30,20], unit: '', category: 'ta', defaultCondition: 'over', defaultValue: 'any' },
  mfi: { label: 'MFI', step: [90,80,70,60,50,40,30,20], unit: '', category: 'ta', defaultCondition: 'over', defaultValue: 'any' },
  cci: { label: 'CCI', step: [250,200,100,50,20,0,-20,-50,-100,-200,-250], unit: '', category: 'ta', defaultCondition: 'over', defaultValue: 'any' },
  atr: { label: 'ATR', step: [20,15,10,5,3,1], unit: '', category: 'ta', defaultCondition: 'over', defaultValue: 'any' },
  sma50: { label: 'SMA-50', step: [500,250,100,50,10,1], unit: '', category: 'ta', defaultCondition: 'over', defaultValue: 'any' },
  sma200: { label: 'SMA-200', step: [500,250,100,50,10,1], unit: '', category: 'ta', defaultCondition: 'over', defaultValue: 'any' },
  ema50: { label: 'EMA-50', step: [500,250,100,50,10,1], unit: '', category: 'ta', defaultCondition: 'over', defaultValue: 'any' },
  ema200: { label: 'EMA-200', step: [500,250,100,50,10,1], unit: '', category: 'ta', defaultCondition: 'over', defaultValue: 'any' },
  change1W: { label: 'Price Change 1W [%]', step: [20,10,5,1], unit: '%', category: 'ta', defaultCondition: 'over', defaultValue: 'any' },
  change1M: { label: 'Price Change 1M [%]', step: [100,50,20,10,5,1], unit: '%', category: 'ta', defaultCondition: 'over', defaultValue: 'any' },
  change3M: { label: 'Price Change 3M [%]', step: [100,50,20,10,5,1], unit: '%', category: 'ta', defaultCondition: 'over', defaultValue: 'any' },
  change6M: { label: 'Price Change 6M [%]', step: [100,50,20,10,5,1], unit: '%', category: 'ta', defaultCondition: 'over', defaultValue: 'any' },
  change1Y: { label: 'Price Change 1Y [%]', step: [100,50,20,10,5,1], unit: '%', category: 'ta', defaultCondition: 'over', defaultValue: 'any' },
  change3Y: { label: 'Price Change 3Y [%]', step: [100,50,20,10,5,1], unit: '%', category: 'ta', defaultCondition: 'over', defaultValue: 'any' },
  marketCap: { label: 'Market Cap', step: [100,50,10,1], unit: 'B', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  revenue: { label: 'Revenue', step: [200,100,50,20,10,1], unit: 'B', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  growthRevenue: { label: 'Revenue Growth [%]', step: [200,100,50,20,10,5,1], unit: '%', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  costOfRevenue: { label: 'Cost of Revenue', step: [200,100,50,20,10,1], unit: 'B', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  growthCostOfRevenue: { label: 'Cost of Revenue Growth [%]', step: [200,100,50,20,10,5,1], unit: '%', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  costAndExpenses: { label: 'Cost & Expenses', step: [200,100,50,20,10,1], unit: 'B', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  growthCostAndExpenses: { label: 'Cost & Expenses Growth [%]', step: [200,100,50,20,10,5,1], unit: '%', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  netIncome: { label: 'Net Income', step: [200,100,50,20,10,1], unit: 'B', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  growthNetIncome: { label: 'Net Income Growth [%]', step: [200,100,50,20,10,5,1], unit: '%', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  grossProfit: { label: 'Gross Profit', step: [200,100,50,20,10,1], unit: 'B', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  growthGrossProfit: { label: 'Gross Profit Growth [%]', step: [200,100,50,20,10,5,1], unit: '%', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  researchAndDevelopmentExpenses: { label: 'R&D Expenses', step: [100,50,10,1], unit: 'B', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  growthResearchAndDevelopmentExpenses: { label: 'R&D Expenses Growth [%]', step: [200,100,50,20,10,5,1], unit: '%', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  payoutRatio: { label: 'Payout Ratio [%]', step: [100,80,60,40,20,0,-20,-40], unit: '%', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  dividendYield: { label: 'Dividend Yield [%]', step: [50,20,10,5,1], unit: '%', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  annualDividend: { label: 'Annual Dividend', step: [10,5,3,2,1,0], unit: '', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  dividendGrowth: { label: 'Dividend Growth [%]', step: [50,20,10,5,3,2,1,0], unit: '%', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  eps: { label: 'EPS', step: [20,15,10,5,3,2,1,0], unit: '', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  growthEPS: { label: 'EPS Growth [%]', step: [200,100,50,20,10,5,1], unit: '%', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  interestIncome: { label: 'Interest Income', step: [200,100,50,20,10,1], unit: 'B', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  interestExpense: { label: 'Interest Expenses', step: [200,100,50,20,10,1], unit: 'B', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  growthInterestExpense: { label: 'Interest Expenses Growth [%]', step: [200,100,50,20,10,5,1], unit: '%', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  operatingExpenses: { label: 'Operating Expenses', step: [200,100,50,20,10,1], unit: 'B', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  growthOperatingExpenses: { label: 'Operating Expenses Growth [%]', step: [200,100,50,20,10,5,1], unit: '%', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  operatingIncome: { label: 'Operating Income', step: [200,100,50,20,10,1], unit: 'B', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  growthOperatingIncome: { label: 'Operating Income Growth [%]', step: [200,100,50,20,10,5,1], unit: '%', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  pe: { label: 'PE Ratio', step: [50,40,30,20,10,5,1], unit: '', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  forwardPE: { label: 'Forward PE', step: [50,20,10,5,1,0,-1,-5,-10,-20,-50], unit: '', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  priceToBookRatio: { label: 'PB Ratio', step: [50,40,30,20,10,5,1], unit: '', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  priceToSalesRatio: { label: 'PS Ratio', step: [50,40,30,20,10,5,1], unit: '', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  beta: { label: 'Beta', step: [10,5,1,-5,-10], unit: '', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  ebitda: { label: 'EBITDA', step: [200,100,50,20,10,1], unit: 'B', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  growthEBITDA: { label: 'EBITDA Growth [%]', step: [200,100,50,20,10,5,1], unit: '%', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  var: { label: 'Value at Risk', step: [-1,-5,-10,-15,-20], unit: '%', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  trendAnalysis: { label: 'AI Trend Analysis (Bullish)', step: [90,80,70,60,50], unit: '%', category: 'ai', defaultCondition: 'over', defaultValue: 'any' },
  fundamentalAnalysis: { label: 'AI Fundamental Analysis (Bullish)', step: [90,80,70,60,50], unit: '%', category: 'ai', defaultCondition: 'over', defaultValue: 'any' },
  analystRating: { label: 'Analyst Rating', step: ['Buy', 'Hold', 'Sell'], unit: '', category: 'fund', defaultCondition: 'equals', defaultValue: 'any' },
  currentRatio: { label: 'Current Ratio', step: [50,40,30,20,10,5,1], unit: '', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  quickRatio: { label: 'Quick Ratio', step: [50,40,30,20,10,5,1], unit: '', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  debtEquityRatio: { label: 'Debt / Equity', step: [50,40,30,20,10,5,1], unit: '', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  debtRatio: { label: 'Debt Ratio', step: [50,40,30,20,10,5,1], unit: '', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  returnOnAssets: { label: 'Return on Assets', step: [10,8,6,4,2,1,0,-2,-4,-6,-8,-10], unit: '', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  returnOnEquity: { label: 'Return on Equity', step: [10,8,6,4,2,1,0,-2,-4,-6,-8,-10], unit: '', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  enterpriseValue: { label: 'Enterprise Value', step: [200,100,50,20,10,1], unit: 'B', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  freeCashFlowPerShare: { label: 'FCF / Share', step: [10,8,6,4,2,1,0], unit: '', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  cashPerShare: { label: 'Cash / Share', step: [50,20,10,5,1,0,-1,-5,-10,-20,-50], unit: '', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
  priceToFreeCashFlowsRatio: { label: 'Price / FCF', step: [50,20,10,5,1,0,-1,-5,-10,-20,-50], unit: '', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  sharesShort: { label: 'Short Interest', step: [50,20,10,5,1,0], unit: 'M', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  shortRatio: { label: 'Short Ratio', step: [10,5,3,2,1,0], unit: '', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  shortFloatPercent: { label: 'Short % Float', step: [50,30,20,10,5,1,0], unit: '%', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  shortOutStandingPercent: { label: 'Short % Shares', step: [50,30,20,10,5,1,0], unit: '%', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  failToDeliver: { label: 'Fail to Deliver', step: [500,200,100,50,20,10,5], unit: 'K', category: 'fund', defaultCondition: 'under', defaultValue: 'any' },
  freeCashFlow: { label: 'Free Cash Flow', step: [500,200,100,20,10,1], unit: 'M', category: 'fund', defaultCondition: 'over', defaultValue: 'any' },
};


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

  // Generate allRows from allRules
$: allRows = Object.entries(allRules).map(([ruleName, ruleProps]) => ({
  rule: ruleName,
  ...ruleProps
}));


      allRows?.sort((a, b) => a.label.localeCompare(b.label));
      let filteredRows;
      let searchTerm = '';
      /*
      let taRows = allRows?.filter(row => row.category === 'ta');
      let fundRows = allRows?.filter(row => row.category === 'fund');
    
      taRows?.sort((a, b) => a.label.localeCompare(b.label));
      fundRows?.sort((a, b) => a.label.localeCompare(b.label));
      */
  
      let ruleName = '';
      
      // Define your default values

      let ruleCondition = {};
      let valueMappings = {};

      Object.keys(allRules).forEach(ruleName => {
        ruleCondition[ruleName] = allRules[ruleName].defaultCondition;
        valueMappings[ruleName] = allRules[ruleName].defaultValue;
      });

      // Update ruleCondition and valueMappings based on existing rules
      ruleOfList.forEach(rule => {
        ruleCondition[rule.name] = rule.condition || allRules[rule.name].defaultCondition;
        valueMappings[rule.name] = rule.value || allRules[rule.name].defaultValue;
      });

    
function changeRule(state: string)  
{
  searchTerm = '';
  selectedPopularStrategy = '';
  ruleName = state;
  handleAddRule()

  //const closePopup = document.getElementById("ruleModal");
  //closePopup?.dispatchEvent(new MouseEvent('click'))
}

 

function handleAddRule() {
  if (ruleName === '') {
    toast.error('Please select a rule', {
      style: 'border-radius: 200px; background: #333; color: #fff;'
    });
    return;
  }

  const newRule = { 
    name: ruleName, 
    condition: ruleCondition[ruleName], 
    value: valueMappings[ruleName] 
  };

  handleRule(newRule);
}

async function handleRule(newRule) {
  const existingRuleIndex = ruleOfList.findIndex(rule => rule.name === newRule.name);
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

    displayRules = allRows?.filter(row => ruleOfList?.some(rule => rule.name === row.rule));
    filteredData = filterStockScreenerData();
    displayResults = filteredData?.slice(0, 50);
  } catch (error) {
    console.error('Error fetching new stock screener data:', error);
    toast.error('Failed to update stock data. Please try again.', {
      style: 'border-radius: 200px; background: #333; color: #fff;'
    });
  }
}
      
async function handleResetAll() {
  selectedPopularStrategy = '';
  ruleOfList = [];
  ruleOfList = [...ruleOfList];
  ruleName = '';
  filteredData = [];
  displayResults = [];
  await handleSave(false);
}

async function handleDeleteRule(state) {
  selectedPopularStrategy = '';
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
  


$: {
  if (ruleOfList) {
    const ruleToUpdate = ruleOfList?.find(rule => rule.name === ruleName);
    if (ruleToUpdate) {
      ruleToUpdate.value = valueMappings[ruleToUpdate.name];
      ruleToUpdate.condition = ruleCondition[ruleToUpdate.name];
      ruleOfList = [...ruleOfList];
    }

    displayRules = allRows?.filter(row => ruleOfList.some(rule => rule.name === row.rule));
    filteredData = filterStockScreenerData();
  }
}
  

      
function filterStockScreenerData() {
  console.log(ruleOfList)
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
      ].includes(rule.name)) {
        if (rule.condition === "over" && item[rule.name] !== null && item[rule.name] <= rule.value * 10**(9)) {
          return false;
        } else if (rule.condition === "under" && item[rule.name] !== null && item[rule.name] > rule.value * 10**(9)) {
          return false;
        }
      } else if (rule.name === 'interestIncome' || rule.name === 'interestExpense') {
        if (rule.condition === "over" && item[rule.name] !== null && item[rule.name] <= rule.value * 10**(6)) {
          return false;
        } else if (rule.condition === "under" && item[rule.name] !== null && item[rule.name] > rule.value * 10**(6)) {
          return false;
        }
      } else if (['avgVolume','sharesShort']?.includes(rule.name)) {
        if (rule.condition === "over" && item[rule.name] <= rule.value * 10**(6)) {
          return false;
        } else if (rule.condition === "under" && item[rule.name] > rule.value * 10**(6)) {
          return false;
        }
      } else if (['failToDeliver']?.includes(rule.name)) {
        if (rule.condition === "over" && item[rule.name] <= rule.value * 10**(3)) {
          return false;
        } else if (rule.condition === "under" && item[rule.name] > rule.value * 10**(3)) {
          return false;
        }
      } else if (rule.name === 'trendAnalysis') {
        if (rule.condition === "over" && item[rule.name]?.accuracy <= rule.value) {
          return false;
        } else if (rule.condition === "under" && item[rule.name]?.accuracy > rule.value) {
          return false;
        }
      } else if (rule.name === 'fundamentalAnalysis') {
        if (rule.condition === "over" && item[rule.name]?.accuracy <= rule.value) {
          return false;
        } else if (rule.condition === "under" && item[rule.name]?.accuracy > rule.value) {
          return false;
        }
      } else {
        if (rule.condition === "over" && item[rule.name] !== null && item[rule.name] <= rule.value) {
          return false;
        } else if (rule.condition === "under" && item[rule.name] !== null && item[rule.name] > rule.value) {
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


function changeRuleCondition(name: string, state: string) {
  ruleName = name;
  ruleCondition[ruleName] = state;
}

function handleChangeValue(value) {
  if (ruleName in valueMappings) {
    valueMappings[ruleName] = value;
  } else {
    console.warn(`Unhandled rule: ${ruleName}`);
  }
}


async function popularStrategy(state: string) {
    const strategies = {
        dividendGrowth: {
            name: 'Dividend Growth',
            rules: [
                { condition: "over", name: "dividendGrowth", value: 5 },
                { condition: "over", name: "dividendYield", value: 1 },
                { condition: "under", name: "payoutRatio", value: 60 },
                { condition: "over", name: "growthRevenue", value: 5 }
            ]
        },
        topGainers1Y: {
            name: 'Top Gainers 1Y',
            rules: [
                { condition: "over", name: "change1Y", value: 50 },
                { condition: "over", name: "marketCap", value: 10 },
                { condition: "over", name: "eps", value: 5 }
            ]
        },
        topShortedStocks: {
            name: 'Top Shorted Stocks',
            rules: [
                { condition: "over", name: "shortFloatPercent", value: 20 },
                { condition: "over", name: "shortRatio", value: 1 },
                { condition: "over", name: "shortOutStandingPercent", value: 10 },
                { condition: "over", name: "sharesShort", value: 20 },
                { condition: "over", name: "marketCap", value: 1 }
            ]
        },
        momentumTAStocks: {
            name: 'Momentum TA Stocks',
            rules: [
                { condition: "under", name: "rsi", value: 40 },
                { condition: "under", name: "stochRSI", value: 40 },
                { condition: "over", name: "marketCap", value: 1 },
                { condition: "under", name: "mfi", value: 40 }
            ]
        },
        topAIStocks: {
            name: 'Top AI Stocks',
            rules: [
                { condition: "over", name: "fundamentalAnalysis", value: 70 },
                { condition: "over", name: "trendAnalysis", value: 60 },
                { condition: "over", name: "marketCap", value: 1 }
            ]
        },
        underValuedStocks: {
            name: 'Undervalued Stocks',
            rules: [
                { condition: "under", name: "marketCap", value: 1 },
                { condition: "over", name: "debtEquityRatio", value: 1 },
                { condition: "over", name: "debtRatio", value: 1 },
                { condition: "over", name: "eps", value: 0 }
            ]
        },
    };

    const strategy = strategies[state];
    if (strategy) {
        selectedPopularStrategy = strategy.name;
        ruleOfList = strategy?.rules;
        ruleOfList?.forEach(row => {
            ruleName = row.name;
            ruleCondition[ruleName] = row.condition;
            handleChangeValue(row.value);
        });
        await updateStockScreenerData();
    }
}


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


<section class="w-full max-w-3xl sm:max-w-screen-xl overflow-hidden min-h-screen pt-5 pb-40 px-5">

                    
            
    <div class="text-sm sm:text-[1rem] breadcrumbs">
      <ul>
        <li><a href="/" class="text-gray-300">Home</a></li> 
        <li><a href="/stock-screener" class="text-gray-300">Stock Screener</a></li>
        <li class="text-gray-300">{title ?? 'Demo'}</li>  
      </ul>
    </div>
  

            
            <!--Start Build Strategy-->
            <div class="mt-5 sm:rounded-lg">
      
              <div class="flex flex-col sm:flex-row items-start sm:items-center mb-5">
                <div class="w-full flex flex-row items-center sm:mt-4">
                <h1 class="text-white text-3xl font-semibold">
                  Stock Screener
                </h1>
                <span class="inline-block text-xs sm:text-sm font-semibold text-white ml-2 mt-3">
                  {ruleOfList?.length !== 0 ? filteredData?.length : 0} Matches Found
                </span>
              </div>
                <div class="flex w-[50%] md:block md:w-auto mt-5 sm:ml-auto">
                      <div class="hidden text-sm sm:text-[1rem] font-semibold sm:font-normal text-white sm:block sm:mb-1">
                          Popular Screens
                      </div>
                      <div class="relative inline-block text-left grow">
                          <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild let:builder>
                                  <Button builders={[builder]}  class="border-gray-600 border bg-[#09090B] flex flex-row justify-between items-center px-3 py-2 text-white rounded-lg truncate">
                                    <span class="truncate text-white">{selectedPopularStrategy?.length !== 0 ? selectedPopularStrategy : 'Select popular'}</span>
                                    <svg class="-mr-1 ml-1 h-5 w-5 xs:ml-2 inline-block" viewBox="0 0 20 20" fill="currentColor" style="max-width:40px" aria-hidden="true">
                                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                    </svg>
                                  </Button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content class="w-56 h-fit max-h-72 overflow-y-auto scroller">
                                  <DropdownMenu.Label class="text-gray-400">
                                    Popular Strategies
                                  </DropdownMenu.Label>
                                  <DropdownMenu.Separator />
                                  <DropdownMenu.Group>
                                      <DropdownMenu.Item on:click={() => popularStrategy('dividendGrowth')} class="cursor-pointer hover:bg-[#27272A]">
                                        Dividend Growth
                                      </DropdownMenu.Item>
                                      <DropdownMenu.Item on:click={() => popularStrategy('topGainers1Y')} class="cursor-pointer hover:bg-[#27272A]">
                                        Top Gainers 1Y
                                      </DropdownMenu.Item>
                                      <DropdownMenu.Item on:click={() => popularStrategy('topShortedStocks')} class="cursor-pointer hover:bg-[#27272A]">
                                        Top Shorted Stocks
                                      </DropdownMenu.Item>
                                      <DropdownMenu.Item on:click={() => popularStrategy('topAIStocks')} class="cursor-pointer hover:bg-[#27272A]">
                                        Top AI Stocks
                                      </DropdownMenu.Item>
                                      <DropdownMenu.Item on:click={() => popularStrategy('momentumTAStocks')} class="cursor-pointer hover:bg-[#27272A]">
                                        Momentum TA Stocks
                                      </DropdownMenu.Item>
                                      <DropdownMenu.Item on:click={() => popularStrategy('underValuedStocks')} class="cursor-pointer hover:bg-[#27272A]">
                                        Undervalued Stocks
                                      </DropdownMenu.Item>  
                                  </DropdownMenu.Group>
                                </DropdownMenu.Content>
                              </DropdownMenu.Root>


                      </div>
                  </div>




              </div>


              <div class="rounded-lg border border-gray-700 bg-[#262626] p-2">
                <div class="items-end border-b border-gray-600">
                    <div class="mr-1 flex items-center justify-between lg:mr-2 mb-1.5">
                        <button class="flex cursor-pointer items-center text-lg sm:text-xl font-semibold text-gray-200" title="Hide Filter Area">
                          <!--  
                          <svg class="-mb-0.5 h-6 w-6" viewBox="0 0 20 20" fill="currentColor" style="max-width:40px">
                                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                            </svg>
                          -->
                            {ruleOfList?.length} Filters
                        </button> 
                    </div>
                </div> 
                <div class="mt-3 flex flex-col gap-y-2.5 sm:flex-row lg:gap-y-2 pb-1">
                    <label for="ruleModal" class="inline-flex cursor-pointer items-center justify-center space-x-1 whitespace-nowrap rounded-md border border-transparent bg-blue-brand_light py-2 pl-3 pr-4 text-base font-semibold text-white shadow-sm bg-[#000] focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-smaller">
                        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" style="max-width:40px" aria-hidden="true">
                            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"></path>
                        </svg> 
                        <div>Add Filters</div>
                    </label>

                    <label for={!data?.user ? 'userLogin' : ''} on:click={() => handleSave(true)} class="sm:ml-3 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-md border border-transparent bg-blue-brand_light py-2 pl-3 pr-4 text-base font-semibold text-white shadow-sm bg-[#000] focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-smaller">
                      <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#fff" d="M5 5v22h22V9.594l-.281-.313l-4-4L22.406 5zm2 2h3v6h12V7.437l3 3V25h-2v-9H9v9H7zm5 0h4v2h2V7h2v4h-8zm-1 11h10v7H11z"/></svg>
                        <div>Save</div>
                    </label>

                    {#if ruleOfList?.length !== 0}
                    <label on:click={handleResetAll} class="sm:ml-3 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-md border border-transparent bg-blue-brand_light py-2 pl-3 pr-4 text-base font-semibold text-white shadow-sm bg-[#000] focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-smaller">
                        <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><g fill="none" fill-rule="evenodd" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"><path d="M3.578 6.487A8 8 0 1 1 2.5 10.5"/><path d="M7.5 6.5h-4v-4"/></g></svg>
                        <div>Reset All</div>
                    </label>
                    {/if}

                    <!--
                    <div class="relative sm:ml-2">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-2.5">
                            <svg class="h-4 w-4 text-gray-400 xs:h-5 xs:w-5" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" stroke="currentColor" viewBox="0 0 24 24" style="max-width: 40px" aria-hidden="true">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                        
                        <input type="text" placeholder="Search {allRows?.length} filters..." class="controls-input rounded-lg w-full py-2 pl-10 placeholder:text-gray-300 bg-[#313131] sm:w-72"> 
                        <div class="absolute inset-y-0 right-0 flex items-center pr-2"></div> 
                      
                    </div> 
                  -->
                </div> 


                <div class="sm:grid sm:grid-cols-2 sm:gap-x-2.5 lg:grid-cols-3 w-full mt-5 border-t border-b border-gray-600">
                  {#each displayRules as row (row?.rule)}
                    <!--Start Added Rules-->
                    <div class="flex items-center justify-between space-x-2 px-1 py-1.5 text-smaller leading-tight text-default">
                      <div class="text-white text-[1rem]">
                          {row?.label?.replace('[%]','')}
                      </div> 
                      <div class="flex items-center">
                          <button on:click={() => handleDeleteRule(row?.rule)} class="mr-1.5 cursor-pointer text-gray-300 sm:hover:text-red-500 focus:outline-none" title="Remove filter">
                              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="CurrentColor" style="max-width:40px">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                          </button> 
                          <div class="relative inline-block text-left">
                            <div on:click={() => ruleName = row?.rule}>
                              <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild let:builder>
                                  <Button builders={[builder]}  class="bg-[#000] h-[40px] flex flex-row justify-between items-center w-[150px] xs:w-[140px] sm:w-[150px] px-3 text-white rounded-lg truncate">
                                    <span class="truncate ml-2 text-sm sm:text-[1rem]">
                                      {#if valueMappings[row?.rule] === 'any'} 
                                      Any
                                      {:else}
                                      {ruleCondition[row?.rule] !== undefined ? ruleCondition[row?.rule] : ''} {valueMappings[row?.rule]}{row?.unit}
                                      {/if}
                                    </span> 
                                    <svg class=" ml-1 h-6 w-6 xs:ml-2 inline-block" viewBox="0 0 20 20" fill="currentColor" style="max-width:40px" aria-hidden="true">
                                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                    </svg>
                                  </Button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content class="w-56 h-fit max-h-72 overflow-y-auto scroller">
                                  {#if row?.rule !== 'analystRating'}
                                  <DropdownMenu.Label>
                                    <div class="flex items-center justify-start gap-x-1">
                                        <div class="relative inline-block flex flex-row items-center justify-center">
                                            <label on:click={() => changeRuleCondition(row?.rule, 'under')} class="cursor-pointer flex flex-row mr-2 justify-center items-center">
                                              <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2" 
                                                  checked={ruleCondition[row?.rule] === 'under'} name={row?.rule} />
                                              <span class="label-text text-white">Under</span> 
                                            </label>
                                            <label on:click={() => changeRuleCondition(row?.rule, 'over')} class="cursor-pointer flex flex-row ml-2 justify-center items-center">
                                              <input type="radio" class="radio checked:bg-purple-600 bg-[#09090B] border border-slate-800 mr-2"
                                                checked={ruleCondition[row?.rule] === 'over'} name={row?.rule} />
                                              <span class="label-text text-white">Over</span> 
                                            </label>
                                        </div>
                                    </div> 
                                  </DropdownMenu.Label>
                                  {/if}
                                  <DropdownMenu.Separator />
                                  <DropdownMenu.Group>
                                    {#each row?.step as newValue}
                                      <DropdownMenu.Item>

                                      <button on:click={() => {handleChangeValue(newValue)}} class="block w-full border-b border-gray-600 px-4 py-1.5 text-left text-sm sm:text-[1rem] rounded text-white last:border-0 sm:hover:bg-[#27272A]
                                                      focus:bg-blue-100 focus:text-gray-900 focus:outline-none">
                                        {ruleCondition[row?.rule] !== undefined ? ruleCondition[row?.rule] : ''} {newValue}{row?.unit}
                                      </button>
                                      </DropdownMenu.Item>      
                                    {/each}                          
                                  </DropdownMenu.Group>
                                </DropdownMenu.Content>
                              </DropdownMenu.Root>
                            </div>
                          </div>
                      </div>
                    </div>
                    <!--End Added Rules-->
                {/each}
                </div>


                
            </div>
  
                  <!--End Adding Rules-->
  
                  <!--Start Rules Preview -->
                                
                  <!--
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
                  -->
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
                          <th class="text-white bg-[#09090B] text-sm sm:text-[1rem] font-semibold border-b-[#09090B]">Symbol</th>
                          <th class="text-white hidden sm:table-cell bg-[#09090B] text-sm sm:text-[1rem] font-semibold border-b-[#09090B]">Company Name</th>
                          <th on:click={() => { sortBy = 'marketCap'; changeOrder(order); }} class="whitespace-nowrap cursor-pointer text-white font-semibold text-sm sm:text-[1rem] font-semibold text-center">
                            Market Cap
                            <svg class="w-5 h-5 inline-block {order === 'highToLow' && sortBy === 'marketCap' ? 'rotate-180' : ''}" viewBox="0 0 20 20" fill="currentColor" style="max-width:40px"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                          </th>
                          <th on:click={() => { sortBy = 'change'; changeOrder(order); }} class="whitespace-nowrap cursor-pointer text-white font-semibold text-sm sm:text-[1rem] font-semibold text-center">
                            % Change
                            <svg class="w-5 h-5 inline-block {order === 'highToLow' && sortBy === 'change' ? '' : 'rotate-180'}" viewBox="0 0 20 20" fill="currentColor" style="max-width:40px"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                          </th>
                          <th class="text-white bg-[#09090B] text-end text-sm sm:text-[1rem] font-semibold border-b-[#09090B]">Price</th>
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
                          
                          <td class="hidden sm:table-cell whitespace-nowrap text-[1rem] text-white border-b-[#09090B]">
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
        Add Filters
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
              placeholder="Search {allRows?.length} filters..."
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

.scrollbar {
    display: grid;
    grid-gap: 90px;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    grid-auto-flow: column;
    overflow-x: auto;
    scrollbar-width: thin; /* Hide the default scrollbar in Firefox */
    scrollbar-color: transparent transparent; /* Hide the default scrollbar in Firefox */
  }

  /* Custom scrollbar for Webkit (Chrome, Safari) */
  .scrollbar::-webkit-scrollbar {
    width: 0; /* Hide the width of the scrollbar */
    height: 0; /* Hide the height of the scrollbar */
  }

  .scrollbar::-webkit-scrollbar-thumb {
    background: transparent; /* Make the thumb transparent */
  }

</style>
