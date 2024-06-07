import { writable } from 'svelte/store';
import { write } from 'xlsx';

// Function to set cache data for a specific tickerID
export const setCache = (key, data, name) => {
  clientSideCache.update(cache => {
    return {
      ...cache,
      [key]: {
        ...cache[key],
        [name]: data
      }
    };
  });
};

export const getCache = (key, name) => {
  let cacheData;
  clientSideCache.subscribe(cache => {
    cacheData = cache[key]?.[name];
  });
  return cacheData;
};


export const showCookieConsent = writable(<boolean>(false));


export const executiveClicked = writable(<boolean>(false));
export const secFilingsClicked = writable(<boolean>(false));

export const discordMembers = writable(<Number> (308));

export const newAvatar = writable(<string> (""));

export const displayCompanyName = writable(<string> (""));
export const currentPrice = writable(<number> (0));
export const currentPortfolioPrice = writable(<number> (0));
export const realtimePrice = writable(<number> (0));

export const priceIncrease = writable(<boolean>(false));
export const isCrosshairMoveActive = writable(<boolean>(true));

export const twitchStatus = writable(<boolean>(false));

export const clientSideCache = writable({});
export const screenWidth = writable(<Number> (0));

export const globalForm = writable(<Array<any>> []);


export const trendingList = writable(<Array<any>> []);

export const userRegion =  writable(<string> (""));

export const loginData = writable(({}));

export const replyCommentClicked = writable(({}));
export const editCommentClicked = writable(({}));

export const fundamentalAnalysisComponent = writable(<boolean>(false));


export const strategyId = writable(<string> (""));
export const articleId = writable(<string> (""));

export const traded = writable(<boolean>(false));

export const previousPage = writable(<string> (""));

export const oauthState = writable(<string> (""));
export const oauthVerifier = writable(<string> (""));
export const oauthProvider = writable(<string> (""));


export const switchWatchList = writable(<boolean>(false));

export const cachedPosts = writable(<Array<any>> {});
export const currentPagePosition = writable(<Number> (0));

export const similarTickerClicked = writable(<boolean>(false));

export const isScrollingUp = writable(<boolean>(true));
export const isWeekend = writable(<boolean>(false));
export const isBeforeMarketOpen = writable(<boolean>(false));
export const isAfterMarketClose = writable(<boolean>(false));
export const isOpen = writable(<boolean>(false));


export const commentIdDeleted = writable(<string> (""));
export const postIdDeleted = writable(<string> (""));
export const commentAdded = writable(<string> (""));
export const commentUpdated = writable(<string> (""));
export const scrollToComment = writable(<string> (""));


export const searchBarData = writable([]);

export const stockTicker = writable(<string> (""));
export const etfTicker = writable(<string> (""));
export const cryptoTicker = writable(<string> (""));
export const assetType = writable(<string> (""));

export const hedgeFundsCIK = writable(<string> (""));

export const linkTitle = writable(<string> (""));

export const numberOfUnreadNotification = writable(<number> (0));

export const openPriceAlert = writable(<boolean>(false));

export const sidebarOpen = writable(<boolean>(false));
export const sidebarExpanded = writable(<boolean>(true));
export const sidebarOpenField = writable(<boolean>(false));


export const tagList = writable( [

    {
      name: "Meme",
      color: '#105488',
    },
    {
      name:  "News",
      color: '#c78900',
    },
    {
      name: "Discussion",
      color: '#800080',
    },
    {
      name: "Gain",
      color: '#19c41d',
    },
    {
      name: "Loss",
      color: '#FF0000',
    },
    {
      name: 'Chart',
      color: '#FF4500',
    },
    {
      name: 'DD',
      color: '#365B8C',
    },
    {
      name: 'YOLO',
      color: '#56B6DF',
    }
]);

