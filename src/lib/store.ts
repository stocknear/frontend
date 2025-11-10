import { writable } from "svelte/store";

// Cache expiration time in milliseconds (10 minutes - increased for better performance)
const CACHE_EXPIRATION_TIME = 10 * 60 * 1000;
// Maximum cache size to prevent memory issues
const MAX_CACHE_ENTRIES = 50;

export const clientSideCache = writable({});

// Function to set cache data for a specific key with size limits
export const setCache = (key, data, name) => {
  const timestamp = Date.now();
  clientSideCache.update((cache) => {
    // Check cache size and remove oldest entries if needed
    const cacheKeys = Object.keys(cache);
    if (cacheKeys.length > MAX_CACHE_ENTRIES) {
      // Remove oldest 10 entries
      const sortedKeys = cacheKeys.sort((a, b) => {
        const aTime = Object.values(cache[a])[0]?.timestamp || 0;
        const bTime = Object.values(cache[b])[0]?.timestamp || 0;
        return aTime - bTime;
      });
      
      sortedKeys.slice(0, 10).forEach(k => delete cache[k]);
    }
    
    return {
      ...cache,
      [key]: {
        ...cache[key],
        [name]: { data, timestamp },
      },
    };
  });
};

// Function to get cache data for a specific key without subscription leak
export const getCache = (key, name) => {
  let cacheData;
  // Use get() to avoid subscription memory leak
  const unsubscribe = clientSideCache.subscribe((cache) => {
    const entry = cache[key]?.[name];
    if (entry) {
      const { data, timestamp } = entry;
      // Check if the cache has expired
      if (Date.now() - timestamp < CACHE_EXPIRATION_TIME) {
        cacheData = data;
      } else {
        // Cache has expired, so return undefined to fetch new data
        cacheData = undefined;
        // Clean up expired entry
        delete cache[key][name];
      }
    }
  });
  // Immediately unsubscribe to prevent memory leak
  unsubscribe();
  return cacheData;
};

// Function to clear the entire cache
export const clearCache = () => {
  clientSideCache.set({});
};

export const activePopupParameter = writable<string | null>(null);
export const chatReasoning = writable(<boolean>false);

export const showCookieConsent = writable(<boolean>false);
export const shouldUpdatePriceChart = writable(<boolean>false);
export const selectedTimePeriod =  writable(<string>"");
export const coolMode = writable(<boolean>false);

export const timeFrame =writable(<string>"5Y");

export const closedPWA = writable(<boolean>false);

export const executiveClicked = writable(<boolean>false);
export const secFilingsClicked = writable(<boolean>false);

export const displayTitle = writable(<string>"");
export const displayDate = writable(<string>"");

export const displayCompanyName = writable(<string>"");
export const currentPrice = writable(<number>0);
export const currentPortfolioPrice = writable(<number>0);
export const realtimePrice = writable(<number>0);
export const wsBidPrice = writable(null);
export const wsAskPrice = writable(null);
export const wsShares = writable(0);

export const priceIncrease = writable(<boolean>false);
export const isCrosshairMoveActive = writable(<boolean>true);


export const screenWidth = writable(<Number>0);

export const globalForm = writable(<Array<any>>[]);

export const trendingList = writable(<Array<any>>[]);

//export const userRegion = writable(<string>"");

export const loginData = writable({});

export const replyCommentClicked = writable({});
export const editCommentClicked = writable({});
export const priceChartData = writable({});

export const fundamentalAnalysisComponent = writable(<boolean>false);
export const priceAnalysisComponent = writable(<boolean>false);
export const revenueSegmentationComponent = writable(<boolean>false);
export const trendAnalysisComponent = writable(<boolean>false);
export const shareStatisticsComponent = writable(<boolean>false);
export const shareholderComponent = writable(<boolean>false);
export const retailVolumeComponent = writable(<boolean>false);
export const darkPoolComponent = writable(<boolean>false);
export const enterpriseComponent = writable(<boolean>false);
export const varComponent = writable(<boolean>false);
export const sentimentComponent = writable(<boolean>false);
export const analystEstimateComponent = writable(<boolean>false);
export const marketMakerComponent = writable(<boolean>false);
export const optionComponent = writable(<boolean>false);
export const clinicalTrialComponent = writable(<boolean>false);
export const failToDeliverComponent = writable(<boolean>false);
export const borrowedShareComponent = writable(<boolean>false);
export const impliedVolatilityComponent = writable(<boolean>false);
export const optionsNetFlowComponent = writable(<boolean>false);
export const governmentContractComponent = writable(<boolean>false);
export const analystInsightComponent = writable(<boolean>false);
export const swapComponent = writable(<boolean>false);
export const taRatingComponent = writable(<boolean>false);
export const dcfComponent = writable(<boolean>false);
export const correlationComponent = writable(<boolean>false);
export const corporateLobbyingComponent = writable(<boolean>false);
export const fomcImpactComponent = writable(<boolean>false);
export const scoreComponent = writable(<boolean>false);

export const goBackToPostId = writable(<string>"");
export const strategyId = writable(<string>"");

export const traded = writable(<boolean>false);

export const previousPage = writable(<string>"");

export const oauthState = writable(<string>"");
export const oauthVerifier = writable(<string>"");
export const oauthProvider = writable(<string>"");


export const newPriceAlertData = writable(<Array<any>>{});

export const cachedPosts = writable(<Array<any>>{});
export const currentPagePosition = writable(<Number>0);
export const postVote = writable(<Array<any>>{});

export const similarTickerClicked = writable(<boolean>false);

export const isScrollingUp = writable(<boolean>true);
export const isWeekend = writable(<boolean>false);
export const isBeforeMarketOpen = writable(<boolean>false);
export const isAfterMarketClose = writable(<boolean>false);
export const isOpen = writable(<boolean>false);

export const commentIdDeleted = writable(<string>"");
export const postIdDeleted = writable(<string>"");
export const commentAdded = writable(<string>"");
export const commentUpdated = writable(<string>"");
export const scrollToComment = writable(<string>"");

export const searchBarData = writable([]);

export const stockTicker = writable(<string>"");
export const etfTicker = writable(<string>"");
export const indexTicker = writable(<string>"");

export const cryptoTicker = writable(<string>"");
export const assetType = writable(<string>"");

export const hedgeFundsCIK = writable(<string>"");

export const linkTitle = writable(<string>"");

export const numberOfUnreadNotification = writable(<number>0);

export const openPriceAlert = writable(<boolean>false);

export const sidebarOpen = writable(<boolean>false);
export const sidebarExpanded = writable(<boolean>true);
export const sidebarOpenField = writable(<boolean>false);

export const tagList = writable([
  {
    name: "Meme",
    color: "#105488",
  },
  {
    name: "News",
    color: "#c78900",
  },
  {
    name: "Discussion",
    color: "#800080",
  },
  {
    name: "Gain",
    color: "#19c41d",
  },
  {
    name: "Loss",
    color: "#FF0000",
  },
  {
    name: "Chart",
    color: "#FF4500",
  },
  {
    name: "DD",
    color: "#365B8C",
  },
  {
    name: "YOLO",
    color: "#56B6DF",
  },
]);
