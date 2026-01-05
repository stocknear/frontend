<script lang="ts">
  import {
    groupNews,
    groupEarnings,
    compareTimes,
    formatTime,
    abbreviateNumber,
    removeCompanyStrings,
  } from "$lib/utils";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import Overview from "$lib/components/Portfolio/Overview.svelte";

  import { onMount, afterUpdate } from "svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import Input from "$lib/components/Input.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { Combobox } from "bits-ui";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import Table from "$lib/components/Table/Table.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  export let data;
  let timeoutId;
  let saveTimeoutId; // Timeout for debounced save
  let searchBarData = [];
  let switchPortfolio = false;
  let editMode = false;
  let numberOfChecked = 0;
  let activeIdx = 0;
  let rawTabData = [];
  let originalData = [];

  let deleteTickerList = [];

  let portfolio: any[] = [];

  let news = [];
  let earnings = [];
  let groupedNews = [];
  let groupedEarnings = [];
  let displayList = [];
  let socket;

  const tabs = [
    {
      title: "News",
    },
    {
      title: "Earnings Release",
    },
  ];

  let isLoaded = false;
  let displayPortfolio;
  let allList = [];

  // Parse and sync allList when data changes from server
  $: if (data?.getAllPortfolio) {
    allList =
      data.getAllPortfolio?.map((portfolio) => {
        let ticker = portfolio?.ticker;
        if (ticker && typeof ticker === "string") {
          try {
            ticker = JSON.parse(ticker);
          } catch (e) {
            console.error("Failed to parse ticker:", e);
            ticker = [];
          }
        }
        return { ...portfolio, ticker: ticker || [] };
      }) || [];

    // If displayPortfolio exists, update it from the fresh allList
    if (displayPortfolio?.id && typeof window !== "undefined") {
      const updated = allList?.find(
        (item) => item?.id === displayPortfolio?.id,
      );
      if (updated) {
        displayPortfolio = updated;
      }
    }
  }

  async function getPortfolioData() {
    const postData = {
      portfolioId: displayPortfolio?.id,
      ruleOfList: [{ rule: "price" }, { rule: "changesPercentage" }]?.map(
        (item) => item?.rule,
      ),
    };
    const response = await fetch("/api/get-portfolio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    const output = await response?.json();

    // Merge API data with PocketBase ticker data (shares, avgPrice)
    const tickerMap = new Map();
    const parsedTicker = parseTickerField(displayPortfolio?.ticker);
    parsedTicker.forEach((item) => {
      if (item?.symbol) {
        tickerMap.set(item.symbol, {
          shares: item.shares,
          avgPrice: item.avgPrice,
        });
      }
    });

    // Merge the shares and avgPrice into the API response data
    portfolio =
      output?.data?.map((item) => {
        const tickerData = tickerMap.get(item?.symbol);
        return {
          ...item,
          shares: tickerData?.shares ?? null,
          avgPrice: tickerData?.avgPrice ?? null,
        };
      }) || [];

    originalData = portfolio;

    news = output?.news;
    earnings = output?.earnings;

    news = news?.map((item) => {
      const match = portfolio?.find((w) => w?.symbol === item?.symbol);
      return match ? { ...item, type: match?.type } : { ...item };
    });

    earnings = earnings?.map((item) => {
      const match = portfolio?.find((w) => w?.symbol === item?.symbol);
      return match ? { ...item, name: match?.name } : { ...item };
    });
    if (portfolio?.length > 0) {
      groupedEarnings = groupEarnings(earnings);
      groupedNews = groupNews(news, portfolio);
    } else {
      groupedEarnings = [];
      groupedNews = [];
    }
    changeTab(0);
  }

  async function createPortfolio(event) {
    event.preventDefault(); // Prevent the default form submission behavior

    const formData = new FormData(event.target); // Create a FormData object from the form
    const title = formData.get("title");

    // Validate the title input
    if (!title || title.toString().trim().length === 0) {
      toast.error("Title cannot be empty!", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    if (title.toString().length > 100) {
      toast.error("Title is too long. Keep it simple and concise bruv!", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    // Build the POST data object
    const postData: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      postData[key] = value;
    }

    // Create a promise for the POST request
    const promise = fetch("/api/create-portfolio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    }).then(async (response) => {
      const output = await response.json();
      if (!response.ok) {
        // If the server returned an error (e.g. non‑Pro user already has a portfolio),
        // throw an error to be caught by toast.promise.
        throw new Error(
          output.error || "Something went wrong. Please try again!",
        );
      }
      return output;
    });

    // Use toast.promise to display a loading toast, then a success or error message
    toast.promise(promise, {
      loading: "Creating portfolio...",
      success: "Portfolio created successfully!",
      error: (err) => err.message || "Something went wrong. Please try again!",
    });

    try {
      const output = await promise;

      // Parse the ticker field to ensure it's an array
      const newPortfolio = {
        ...output,
        ticker: parseTickerField(output.ticker),
      };

      // Add the new portfolio to allList
      allList = [...allList, newPortfolio];

      // Set the new portfolio as active
      displayPortfolio = newPortfolio;

      try {
        localStorage.setItem("last-portfolio-id", JSON.stringify(output?.id));

        // Update URL parameter using goto
        if (output?.id) {
          await goto(`/portfolio?id=${output.id}`, {
            replaceState: true,
            noScroll: true,
          });
        }
      } catch (e) {
        console.log("Failed saving portfolio id: ", e);
      }

      // Close the modal
      const clicked = document.getElementById("addPortfolio");
      clicked?.dispatchEvent(new MouseEvent("click"));

      // Refresh portfolio data for the newly created portfolio
      await getPortfolioData();
    } catch (error) {
      console.error("Error creating portfolio:", error);
      // No additional toast.error is needed here since toast.promise already handles errors.
    }
  }

  function handleDeleteModal(event) {
    event?.preventDefault();
    const clicked = document.getElementById("deletePortfolio");
    clicked.dispatchEvent(new MouseEvent("click"));
  }

  async function deletePortfolio(event) {
    event.preventDefault(); // prevent the default form submission behavior

    const postData = {
      portfolioId: displayPortfolio?.id,
    };

    try {
      const response = await fetch("/api/delete-portfolio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      const output = await response.json();

      if (output === "success") {
        toast.success("Portfolio deleted successfully!", {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });

        allList = allList?.filter((item) => item?.id !== displayPortfolio?.id);
        allList = [...allList];

        displayPortfolio = allList[0];

        // Update localStorage and URL with new active portfolio
        if (displayPortfolio?.id) {
          try {
            localStorage.setItem(
              "last-portfolio-id",
              JSON.stringify(displayPortfolio.id),
            );
            await goto(`/portfolio?id=${displayPortfolio.id}`, {
              replaceState: true,
              noScroll: true,
            });
          } catch (e) {
            console.log("Failed updating portfolio id: ", e);
          }
        }

        // Force reload ALL load functions to get fresh data from server
        await invalidateAll();

        // Trigger portfolio data reload
        switchPortfolio = true;

        const clicked = document.getElementById("deletePortfolio");
        clicked.dispatchEvent(new MouseEvent("click"));
      } else {
        toast.error("Something went wrong. Please try again!", {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again later.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    }
  }

  function handleEditMode() {
    if (editMode === true) {
      deleteTickerList = [];
      numberOfChecked = 0;
    }
    editMode = !editMode;
  }

  async function handleFilter(symbol) {
    const filterSet = new Set(deleteTickerList);

    // Check if the new filter already exists in the list
    if (filterSet?.has(symbol)) {
      // If it exists, remove it from the list
      filterSet?.delete(symbol);
    } else {
      // If it doesn't exist, add it to the list
      filterSet?.add(symbol);
    }
    deleteTickerList = Array?.from(filterSet);
    numberOfChecked = deleteTickerList?.length;
  }

  async function handleDeleteTickers() {
    if (numberOfChecked === 0) {
      toast.error(`You need to select symbols before you can delete them`, {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } else {
      portfolio = portfolio?.filter(
        (item) => !deleteTickerList?.includes(item?.symbol),
      );

      originalData = portfolio;

      news = news?.filter((item) => !deleteTickerList?.includes(item?.symbol));
      earnings = earnings?.filter(
        (item) => !deleteTickerList?.includes(item?.symbol),
      );

      deleteTickerList = [...deleteTickerList];
      editMode = false;

      // Prepare ticker data as array of objects with symbol, shares, avgPrice
      const tickerData = portfolio?.map((item) => ({
        symbol: item?.symbol,
        shares: item?.shares ?? null,
        avgPrice: item?.avgPrice ?? null,
      }));

      const postData = {
        ticker: tickerData,
        portfolioId: displayPortfolio?.id,
        mode: "delete",
      };

      const response = await fetch("/api/update-portfolio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      deleteTickerList = [];
      numberOfChecked = 0;

      // Update allList with the tickerData we already prepared
      allList = allList?.map((item) => {
        if (item?.id === displayPortfolio?.id) {
          return { ...item, ticker: tickerData }; // Update ticker with proper structure
        }
        return item; // Return unchanged item if condition doesn't match
      });

      // Update displayPortfolio to reflect the changes
      displayPortfolio = allList?.find(
        (item) => item?.id === displayPortfolio?.id,
      );

      // Force reload ALL load functions to get fresh data from server
      await invalidateAll();

      allList = [...allList];
      if (portfolio?.length > 0) {
        groupedNews = groupNews(news, portfolio);
        groupedEarnings = groupEarnings(earnings);
      } else {
        groupedEarnings = [];
        groupedNews = [];
      }
    }
  }

  // Debounced save function for portfolio updates (shares/avgPrice changes)
  async function savePortfolioData(updatedPortfolio) {
    // Clear any existing timeout
    portfolio = [...updatedPortfolio];

    clearTimeout(saveTimeoutId);

    // Set a new timeout to save after 1 second of no changes
    saveTimeoutId = setTimeout(async () => {
      try {
        // Calculate total portfolio value for weight calculation
        const totalValue = updatedPortfolio?.reduce((sum, item) => {
          const price = parseFloat(item?.price) || 0;
          const shares = parseFloat(item?.shares) || 0;
          return sum + price * shares;
        }, 0);

        // Prepare ticker data with weight calculation and sort by weight (highest to lowest)
        const tickerData = updatedPortfolio
          ?.map((item) => {
            const price = parseFloat(item?.price) || 0;
            const shares = parseFloat(item?.shares) || 0;
            const value = price * shares;
            const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;

            return {
              symbol: item?.symbol,
              shares: item?.shares ?? null,
              avgPrice: item?.avgPrice ?? null,
              _weight: weight, // Temporary field for sorting
            };
          })
          ?.sort((a, b) => (b._weight || 0) - (a._weight || 0)) // Sort by weight descending
          ?.map(({ symbol, shares, avgPrice }) => ({
            symbol,
            shares,
            avgPrice,
          })); // Remove _weight

        const postData = {
          ticker: tickerData,
          portfolioId: displayPortfolio?.id,
          mode: "update",
        };

        const response = await fetch("/api/update-portfolio", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        });

        const output = await response.json();

        if (response.ok) {
          // Update displayPortfolio ticker directly with saved data
          displayPortfolio.ticker = parseTickerField(output.ticker);

          // Also update allList to keep it in sync
          allList = allList?.map((item) => {
            if (item?.id === displayPortfolio?.id) {
              return { ...item, ticker: parseTickerField(output.ticker) };
            }
            return item;
          });

          // Force reload ALL load functions to get fresh data from server
          await invalidateAll();
        } else {
          toast.error(output?.error || "Failed to save portfolio changes", {
            style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
          });
        }
      } catch (error) {
        console.error("Error saving portfolio:", error);
        toast.error("An error occurred while saving", {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
      }
    }, 1000); // 1 second debounce
  }

  function changeTab(i) {
    activeIdx = i;
    if (activeIdx === 0) {
      rawTabData = groupedNews;
    } else {
      rawTabData = groupedEarnings;
    }
    displayList = rawTabData?.slice(0, 3);
  }

  async function handleAddTicker(event, ticker) {
    if (portfolio?.some((item) => item?.symbol === ticker)) {
      toast.error("This symbol is already in your portfolio", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      inputValue = "";
      return;
    }

    // Exit edit mode.
    editMode = false;

    // Prepare the data to send to the API.
    const postData = {
      ticker: ticker,
      portfolioId: displayPortfolio?.id,
    };

    // Create a promise for the fetch request.
    const promise = fetch("/api/update-portfolio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    }).then(async (response) => {
      const output = await response.json();
      // If the response is not OK, throw an error with the message from the API.
      if (!response.ok) {
        throw new Error(output.error || "Failed to update portfolio");
      }
      return output;
    });

    // Use toast.promise to display notifications based on the promise's state.
    toast?.promise(promise, {
      loading: "Updating portfolio...",
      success: "Portfolio updated successfully!",
      error: (err) => err.message || "Failed to update portfolio",
      style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
    });

    try {
      const updatedData = await promise;

      allList = allList?.map((item) => {
        if (item?.id === displayPortfolio?.id) {
          return { ...item, ticker: parseTickerField(updatedData.ticker) };
        }
        return item;
      });

      // Refresh displayPortfolio from the updated list.
      displayPortfolio = allList?.find(
        (item) => item?.id === displayPortfolio?.id,
      );

      // Force reload ALL load functions to get fresh data from server
      await invalidateAll();

      // Refresh the portfolio data (UI or state refresh).
      await getPortfolioData();

      // Reset the input value.
      inputValue = "";
    } catch (error) {
      console.error("Error updating portfolio:", error);
      // Note: The error toast is already displayed by toast.promise.
    }
  }

  function changePortfolio(newportfolio) {
    displayPortfolio = newportfolio;
    switchPortfolio = true;
    try {
      // Save to localStorage
      localStorage?.setItem(
        "last-portfolio-id",
        JSON?.stringify(displayPortfolio?.id),
      );

      // Update URL parameter using goto to trigger reactive updates
      if (displayPortfolio?.id) {
        goto(`/portfolio?id=${displayPortfolio.id}`, {
          replaceState: true,
          noScroll: true,
        });
      }
    } catch (e) {
      console.log("Failed saving indicator rules: ", e);
    }
  }

  async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && displayList?.length !== rawTabData?.length) {
      const nextIndex = displayList?.length;
      const filteredItem = rawTabData?.slice(nextIndex, nextIndex + 3);
      displayList = [...displayList, ...filteredItem];
    }
  }

  async function handleScrollStocks() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && displayList?.length !== rawTabData?.length) {
      const nextIndex = displayList?.length;
      const filteredItem = rawTabData?.slice(nextIndex, nextIndex + 8);
      displayList = [...displayList, ...filteredItem];
    }
  }

  // Helper function to safely parse JSON
  function safeParse(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      // If JSON parsing fails, just return the original value
      return value;
    }
  }

  // Helper function to parse ticker field
  function parseTickerField(ticker) {
    if (!ticker) return [];
    if (Array.isArray(ticker)) return ticker;
    if (typeof ticker === "string") {
      try {
        const parsed = JSON.parse(ticker);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Failed to parse ticker:", e);
        return [];
      }
    }
    return [];
  }

  onMount(async () => {
    try {
      let targetPortfolioId = null;

      // Priority 1: Check URL parameter FIRST
      const urlParams = new URLSearchParams(window.location.search);
      const urlId = urlParams.get("id");
      if (urlId) {
        targetPortfolioId = urlId;
      }
      // Priority 2: Check localStorage if no URL param
      else {
        const savedLastportfolioId = localStorage?.getItem("last-portfolio-id");
        if (savedLastportfolioId && savedLastportfolioId.length > 0) {
          targetPortfolioId = safeParse(savedLastportfolioId);
        }
      }

      // Find portfolio by ID
      if (targetPortfolioId) {
        displayPortfolio = allList?.find(
          (item) => item?.id === targetPortfolioId,
        );
      }

      // Priority 3: Fallback to first portfolio if not found
      if (!displayPortfolio && allList?.length > 0) {
        displayPortfolio = allList.at(0);
      } else if (!displayPortfolio) {
        displayPortfolio = {};
      }

      // Update URL and localStorage with final portfolio ID
      if (displayPortfolio?.id) {
        // Only update URL if it's different from current
        const currentUrlId = urlParams.get("id");
        if (currentUrlId !== displayPortfolio.id) {
          await goto(`/portfolio?id=${displayPortfolio.id}`, {
            replaceState: true,
            noScroll: true,
          });
        }

        // Update localStorage
        try {
          localStorage.setItem(
            "last-portfolio-id",
            JSON.stringify(displayPortfolio.id),
          );
        } catch (e) {
          console.log("Failed to save portfolio id to localStorage:", e);
        }
      }

      await getPortfolioData();

      isLoaded = true;
    } catch (e) {
      console.error("onMount error:", e);
    }

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("scroll", handleScrollStocks);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScrollStocks);
    };
  });

  let previousList = [];

  afterUpdate(async () => {
    // Compare only the symbols to detect changes
    const currentSymbols = portfolio?.map((item) => item?.symbol).sort();
    const previousSymbols = previousList?.map((item) => item?.symbol).sort();

    // Check if symbols have changed
    if (
      JSON.stringify(currentSymbols) !== JSON.stringify(previousSymbols) &&
      typeof socket !== "undefined"
    ) {
      // Update previous list
      previousList = portfolio;
    }
  });

  $: {
    if (switchPortfolio && typeof window !== "undefined") {
      isLoaded = false;
      getPortfolioData();
      isLoaded = true;
      switchPortfolio = false;
    }
  }

  let inputValue = "";
  let touchedInput = false;

  async function search() {
    clearTimeout(timeoutId); // Clear any existing timeout

    if (!inputValue.trim()) {
      // Skip if query is empty or just whitespace
      searchBarData = []; // Clear previous results
      return;
    }

    timeoutId = setTimeout(async () => {
      const response = await fetch(
        `/api/searchbar?query=${encodeURIComponent(inputValue)}&limit=10`,
      );
      searchBarData = await response?.json();
    }, 50); // delay
  }
</script>

<SEO
  title="Portfolio Tracker & AI Stock Analysis"
  description="Track stocks and ETFs in real time, get AI insights and price alerts, and visualize performance, risk, and dividends. A fast, free portfolio tracker for investors."
  keywords="stock portfolio, portfolio tracker, stock tracker, ETF tracker, investment tracker, watchlist, price alerts, performance analytics, dividends, P&L, portfolio management"
  canonical="https://stocknear.com/portfolio/stocks"
  openGraph={{
    type: "website",
    url: "https://stocknear.com/portfolio/stocks",
    title: "Portfolio Tracker & AI Stock Analysis",
    description:
      "Real-time prices, AI insights, alerts, and performance analytics for your stock & ETF portfolio.",
  }}
  twitter={{
    card: "summary",
    title: "Portfolio Tracker & AI Stock Analysis",
    description:
      "Real-time prices, AI insights, alerts, and performance analytics for your stock & ETF portfolio.",
  }}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Portfolio Tracker",
    alternateName: "Stock Portfolio Tracker",
    description:
      "Personal stock and ETF portfolio tracking tool with real-time prices, AI analysis, alerts, and performance analytics.",
    url: "https://stocknear.com/portfolio/stocks",
    isAccessibleForFree: true,
    inLanguage: "en",
    operatingSystem: "Web",
    applicationCategory: "FinanceApplication",
    brand: {
      "@type": "Brand",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    featureList: [
      "Real-time price tracking",
      "AI portfolio insights",
      "Custom price alerts",
      "Performance & P&L analytics",
      "Dividend tracking",
      "Watchlists & holdings import",
    ],
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Portfolio",
          item: "https://stocknear.com/portfolio",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Stocks",
          item: "https://stocknear.com/portfolio/stocks",
        },
      ],
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    mainEntityOfPage: "https://stocknear.com/portfolio/stocks",
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pt-5 pb-40 text-gray-700 dark:text-zinc-200"
>
  <div class="w-full overflow-hidden m-auto">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          {#if isLoaded}
            <div
              class="flex w-full sm:w-[50%] md:w-auto mb-5 {!data?.user
                ? 'hidden'
                : 'md:block'} border-t border-b border-gray-300 dark:border-zinc-700 py-2"
            >
              <div
                class="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-0 sm:flex sm:flex-row sm:items-center"
              >
                <div class="order-0 w-full sm:w-fit">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild let:builder>
                      <Button
                        builders={[builder]}
                        class="min-w-[110px] w-full sm:w-fit transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-zinc-200 bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <span class="truncate font-medium text-sm"
                          >{displayPortfolio?.title !== undefined
                            ? displayPortfolio?.title
                            : "Create Portfolio"}</span
                        >
                        <svg
                          class="-mr-1 ml-1 h-5 w-5 xs:ml-2 inline-block"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style="max-width:40px"
                          aria-hidden="true"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                          ></path>
                        </svg>
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content
                      side="bottom"
                      align="start"
                      sideOffset={10}
                      alignOffset={0}
                      class="w-56 h-fit max-h-72 overflow-y-auto scroller rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 shadow-none"
                    >
                      <DropdownMenu.Label>
                        <DropdownMenu.Trigger asChild let:builder>
                          <Button
                            builders={[builder]}
                            class="p-0 -mb-2 -mt-2 text-sm inline-flex cursor-pointer items-center justify-center space-x-1 bg-transparent whitespace-nowrap focus:outline-hidden text-gray-700 dark:text-zinc-200"
                          >
                            <label
                              for="addPortfolio"
                              class="flex flex-row items-center cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 transition"
                            >
                              <svg
                                class="h-4 w-4 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                style="max-width:40px"
                                aria-hidden="true"
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                  clip-rule="evenodd"
                                ></path>
                              </svg>
                              <div class="text-sm text-start">
                                New Portfolio
                              </div>
                            </label>
                          </Button>
                        </DropdownMenu.Trigger>
                      </DropdownMenu.Label>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Group>
                        {#each allList as item}
                          <DropdownMenu.Item
                            on:click={() => changePortfolio(item)}
                            class="text-sm cursor-pointer {item?.id ===
                            displayPortfolio?.id
                              ? 'text-gray-900 dark:text-white font-semibold'
                              : 'text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400'}"
                          >
                            {item?.title} ({item?.ticker?.length})
                            <label
                              for="deletePortfolio"
                              class="ml-auto inline-block cursor-pointer hover:text-rose-600 dark:hover:text-rose-400 transition"
                              on:click|capture={handleDeleteModal}
                            >
                              <svg
                                class="size-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="2"
                                style="max-width:40px"
                                ><path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                ></path></svg
                              >
                            </label>
                          </DropdownMenu.Item>
                        {/each}
                      </DropdownMenu.Group>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>

                <div
                  class="order-2 sm:order-1 w-full {displayPortfolio?.title ===
                  undefined
                    ? 'hidden'
                    : ''}"
                >
                  <Combobox.Root
                    items={searchBarData}
                    bind:inputValue
                    bind:touchedInput
                  >
                    <div class="relative sm:ml-3 w-full">
                      <Combobox.Input
                        on:input={search}
                        class="py-2 text-[0.85rem] sm:text-sm border bg-white/80 dark:bg-zinc-950/60 border-gray-300 dark:border-zinc-700 rounded-full placeholder:text-gray-500 dark:placeholder:text-zinc-400 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full"
                        placeholder="Add stock..."
                        aria-label="Add stock..."
                      />
                    </div>

                    <Combobox.Content
                      class="w-auto z-10 rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 px-1 py-1.5 outline-hidden shadow-none"
                      sideOffset={8}
                    >
                      {#if inputValue?.length > 0}
                        {#each searchBarData as item}
                          <Combobox.Item
                            class="cursor-pointer border-b border-gray-300 dark:border-zinc-700 last:border-none flex h-fit w-auto select-none items-center rounded-button py-1.5 pl-5 pr-1.5 text-sm capitalize outline-hidden transition-all duration-75 data-[highlighted]:text-violet-600 dark:data-[highlighted]:text-violet-400"
                            value={item?.symbol}
                            label={item?.name}
                            on:click={(e) => handleAddTicker(e, item?.symbol)}
                          >
                            <div class="flex flex-col items-start">
                              <span
                                class="text-sm text-gray-700 dark:text-zinc-200"
                                >{item?.symbol}</span
                              >
                              <span
                                class="text-xs sm:text-sm text-gray-500 dark:text-zinc-400"
                                >{item?.name}</span
                              >
                            </div>
                          </Combobox.Item>
                          <!--This else is related to for loop-->
                        {:else}
                          <span
                            class="block px-5 py-2 text-sm text-gray-500 dark:text-zinc-400"
                          >
                            No results found
                          </span>
                        {/each}
                      {:else}
                        <Combobox.Item
                          class="cursor-pointer border-b border-gray-300 dark:border-zinc-700 last:border-none flex h-fit w-auto select-none items-center rounded-button py-1.5 pl-5 pr-1.5 text-sm capitalize outline-hidden"
                        >
                          <span
                            class=" text-sm text-gray-500 dark:text-zinc-400"
                          >
                            No results found
                          </span>
                        </Combobox.Item>
                      {/if}
                    </Combobox.Content>
                  </Combobox.Root>
                </div>

                <div
                  class="order-1 sm:order-last w-full sm:w-fit flex justify-end sm:ml-3 {displayPortfolio?.title ===
                  undefined
                    ? 'hidden'
                    : ''}"
                >
                  <div class="flex flex-row items-center justify-end w-full">
                    {#if editMode}
                      <label
                        on:click={handleDeleteTickers}
                        class="w-full border text-sm border-gray-300 dark:border-zinc-700 mr-2 sm:ml-3 sm:mr-0 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full py-1.5 pl-3 pr-4 font-semibold bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-rose-600 dark:hover:text-rose-400"
                      >
                        <svg
                          class="inline-block w-5 h-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          ><path
                            fill="currentColor"
                            d="M10 5h4a2 2 0 1 0-4 0M8.5 5a3.5 3.5 0 1 1 7 0h5.75a.75.75 0 0 1 0 1.5h-1.32l-1.17 12.111A3.75 3.75 0 0 1 15.026 22H8.974a3.75 3.75 0 0 1-3.733-3.389L4.07 6.5H2.75a.75.75 0 0 1 0-1.5zm2 4.75a.75.75 0 0 0-1.5 0v7.5a.75.75 0 0 0 1.5 0zM14.25 9a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75m-7.516 9.467a2.25 2.25 0 0 0 2.24 2.033h6.052a2.25 2.25 0 0 0 2.24-2.033L18.424 6.5H5.576z"
                          /></svg
                        >
                        <span class="ml-1 text-sm">
                          {numberOfChecked}
                        </span>
                      </label>
                    {/if}
                    <label
                      on:click={handleEditMode}
                      class=" w-full border text-sm border-gray-300 dark:border-zinc-700 sm:ml-3 cursor-pointer inline-flex items-center justify-start space-x-1 whitespace-nowrap rounded-full py-2 px-3 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 transition hover:text-violet-600 dark:hover:text-violet-400"
                    >
                      <svg
                        class="inline-block w-5 h-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 1024 1024"
                        ><path
                          fill="currentColor"
                          d="M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640z"
                        /><path
                          fill="currentColor"
                          d="m469.952 554.24l52.8-7.552L847.104 222.4a32 32 0 1 0-45.248-45.248L477.44 501.44l-7.552 52.8zm422.4-422.4a96 96 0 0 1 0 135.808l-331.84 331.84a32 32 0 0 1-18.112 9.088L436.8 623.68a32 32 0 0 1-36.224-36.224l15.104-105.6a32 32 0 0 1 9.024-18.112l331.904-331.84a96 96 0 0 1 135.744 0z"
                        /></svg
                      >
                      {#if !editMode}
                        <span class="ml-1 text-[0.85rem] sm:text-sm">
                          Edit Portfolio
                        </span>
                      {:else}
                        <span class="ml-1 text-[0.85rem] sm:text-sm">
                          Cancel
                        </span>
                      {/if}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {#if allList?.length === 0}
              <!--<Overview {data} portfolioData={portfolio} />-->

              <div
                class="flex flex-col justify-center items-center m-auto z-0 pt-10"
              >
                <span class=" font-bold text-xl sm:text-3xl">
                  Empty Portfolio
                </span>

                <span class=" text-sm sm:text-lg m-auto p-4 text-center">
                  Fill it up with your favorite stocks and get realtime data and
                  the latest news in one place!
                </span>
                {#if !data?.user}
                  <a
                    class="w-64 flex mt-3 rounded-full justify-center items-center m-auto border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-zinc-200 transition duration-150 ease-in-out group"
                    href="/register"
                  >
                    Get Started
                    <span
                      class="tracking-normal group-hover:translate-x-0.5 transition-transform duration-150 ease-in-out"
                    >
                      <svg
                        class="w-4 h-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        ><g transform="rotate(90 12 12)"
                          ><g fill="none"
                            ><path
                              d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"
                            /><path
                              fill="black"
                              d="M13.06 3.283a1.5 1.5 0 0 0-2.12 0L5.281 8.939a1.5 1.5 0 0 0 2.122 2.122L10.5 7.965V19.5a1.5 1.5 0 0 0 3 0V7.965l3.096 3.096a1.5 1.5 0 1 0 2.122-2.122L13.06 3.283Z"
                            /></g
                          ></g
                        ></svg
                      >
                    </span>
                  </a>
                {/if}
              </div>
            {:else}
              <!--Start Table of Watchlist-->
              {#key portfolio}
                <Overview {data} portfolioData={portfolio} />

                {#if portfolio?.length > 0}
                  <div class="w-full">
                    <Table
                      {data}
                      rawData={portfolio}
                      title="{portfolio?.length} Stocks"
                      excludedRules={new Set([
                        "volume",
                        "price",
                        "changesPercentage",
                        "marketCap",
                        "eps",
                        "weight",
                      ])}
                      defaultList={[
                        { name: "Price", rule: "price" },
                        {
                          name: "% Change",
                          rule: "changesPercentage",
                        },
                        { name: "Avg. Price", rule: "avgPrice" },
                        { name: "Shares", rule: "shares", type: "decimal" },
                        {
                          name: "Profit/Loss",
                          rule: "profitLoss",
                        },
                        {
                          name: "Total P&L",
                          rule: "totalReturn",
                        },
                        {
                          name: "Today P&L",
                          rule: "todayReturn",
                        },
                        { name: "% Weight", rule: "weight", type: "percent" },
                      ]}
                      specificRows={[
                        { name: "Shares", rule: "shares", type: "decimal" },
                        { name: "Avg. Price", rule: "avgPrice", type: "float" },
                        {
                          name: "Profit / Loss",
                          rule: "profitLoss",
                          type: "decimalSign",
                        },
                        {
                          name: "% Total P/L",
                          rule: "totalReturn",
                          type: "percentSign",
                        },
                        {
                          name: "Today P&L",
                          rule: "todayReturn",
                          type: "decimalSign",
                        },
                        {
                          name: "% Weight",
                          rule: "weight",
                          type: "percent",
                        },
                      ]}
                      {editMode}
                      {deleteTickerList}
                      onToggleDeleteTicker={handleFilter}
                      onPortfolioUpdate={savePortfolioData}
                    />

                    <div
                      class="w-full m-auto border-b border-gray-300 dark:border-zinc-700 mt-10 mb-5"
                    ></div>

                    <div class=" ">
                      <div
                        class="inline-flex justify-center w-full rounded sm:w-auto mb-3"
                      >
                        <div
                          class=" flex flex-col sm:flex-row items-start sm:items-center w-full justify-between"
                        >
                          <div class="">
                            <div class="inline-flex">
                              <div class="inline-flex gap-1">
                                {#each tabs as item, i}
                                  <button
                                    on:click={() => changeTab(i)}
                                    class="cursor-pointer px-3 py-1.5 text-sm font-medium focus:z-10 focus:outline-none transition-colors duration-150 rounded-full border
                          {activeIdx === i
                                      ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-gray-900 dark:text-white'
                                      : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200 dark:hover:border-zinc-800/80'}"
                                  >
                                    {item.title}
                                  </button>
                                {/each}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {#if activeIdx === 0}
                        {#if groupedNews?.length > 0}
                          {#each displayList as [date, titleGroups]}
                            <h3
                              class="mb-1.5 mt-3 font-semibold text-gray-500 dark:text-zinc-400"
                            >
                              {date}
                            </h3>
                            <div
                              class="border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
                            >
                              {#each titleGroups as { title, items, symbols }, index}
                                <div
                                  class="flex border-gray-200 {index > 0
                                    ? 'border-t'
                                    : ''} dark:border-zinc-700 text-sm"
                                >
                                  <div
                                    class="hidden min-w-[100px] items-center justify-center bg-gray-50/80 dark:bg-zinc-900/60 p-1 text-xs text-gray-500 dark:text-zinc-400 lg:flex"
                                  >
                                    {new Date(
                                      items[0].publishedDate,
                                    ).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    })}
                                  </div>
                                  <div class="grow px-3 py-2 lg:py-1">
                                    <h4
                                      class="text-sm font-semibold lg:text-base"
                                    >
                                      {title}
                                    </h4>
                                    <div
                                      class="flex flex-wrap gap-x-2 pt-2 text-sm lg:pt-0.5"
                                    >
                                      <div class=" lg:hidden">
                                        {new Date(
                                          items[0].publishedDate,
                                        ).toLocaleTimeString("en-US", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: true,
                                        })}
                                      </div>
                                      <div class="flex flex-wrap gap-x-2">
                                        {#each symbols as symbol}
                                          <a
                                            href={`/${items[0].type}/${symbol}`}
                                            class="text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                                          >
                                            {symbol}
                                          </a>
                                        {/each}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              {/each}
                            </div>
                          {/each}
                        {:else}
                          <span
                            class="text-sm text-gray-600 dark:text-zinc-300"
                          >
                            No news yet. Add some stocks to the portfolio to see
                            the latest news.
                          </span>
                        {/if}
                      {:else if groupedEarnings?.length > 0}
                        {#each displayList as [date, titleGroups]}
                          <h3
                            class="mb-1.5 mt-3 font-semibold text-gray-500 dark:text-zinc-400"
                          >
                            {date}
                          </h3>
                          <div
                            class="border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
                          >
                            {#each titleGroups as item, index}
                              <div
                                class="flex border-gray-300 dark:border-zinc-700 text-sm"
                              >
                                <div
                                  class="hidden min-w-[100px] items-center justify-center bg-gray-50/80 dark:bg-zinc-900/60 p-1 text-xs text-gray-500 dark:text-zinc-400 lg:flex"
                                >
                                  {formatTime(item?.time)}
                                </div>
                                <div
                                  class="grow px-3 py-2 lg:py-1 break-normal {index >
                                  0
                                    ? 'border-t'
                                    : ''} border-gray-300 dark:border-zinc-700"
                                >
                                  <div>
                                    {removeCompanyStrings(item?.name)}
                                    (<HoverStockChart symbol={item?.symbol} />)
                                    will report

                                    {#if item?.time}
                                      {#if compareTimes(item?.time, "16:00") >= 0}
                                        after market closes.
                                      {:else if compareTimes(item?.time, "09:30") <= 0}
                                        before market opens.
                                      {:else}
                                        during market.
                                      {/if}
                                    {/if}
                                    Analysts estimate
                                    <strong
                                      >{abbreviateNumber(
                                        item?.revenueEst,
                                      )}</strong
                                    >
                                    in revenue ({(
                                      (item?.revenueEst / item?.revenuePrior -
                                        1) *
                                      100
                                    )?.toFixed(2)}% YoY) and
                                    <strong>{item?.epsEst}</strong>
                                    in earnings per share {#if item?.epsPrior !== 0}
                                      ({(
                                        (item?.epsEst / item?.epsPrior - 1) *
                                        100
                                      )?.toFixed(2)}% YoY).
                                    {/if}
                                  </div>

                                  <div
                                    class="flex flex-wrap gap-x-2 pt-2 text-sm lg:pt-0.5"
                                  >
                                    <div class=" lg:hidden">
                                      {formatTime(item?.time)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            {/each}
                          </div>
                        {/each}
                      {:else}
                        <br />
                        <div class="mt-3 sm:mt-0">
                          <Infobox
                            text="No earnings data available. Add some stocks to the portfolio to see
                        the latest earnings data."
                          />
                        </div>
                      {/if}
                    </div>
                  </div>
                {:else}
                  <div
                    class="flex flex-col justify-center items-center m-auto pt-10 z-0"
                  >
                    <span class=" font-bold text-xl sm:text-3xl">
                      Empty Portfolio
                    </span>

                    <span
                      class=" text-sm sm:text-lg pt-5 m-auto p-4 text-center"
                    >
                      Fill it up with your favorite stocks and get realtime data
                      and the latest news in one place!
                    </span>
                  </div>
                {/if}
              {/key}
              <!--End Table of Portfolio-->
            {/if}
          {:else}
            <div class="flex justify-center items-center h-80">
              <div class="relative">
                <label
                  class=" bg-gray-900/80 dark:bg-zinc-900/70 rounded-full h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <span
                    class="loading loading-spinner loading-md text-white dark:text-white"
                  ></span>
                </label>
              </div>
            </div>
          {/if}
        </main>
      </div>
    </div>
  </div>
</section>

<!--Start Create Watchlist Modal-->

<!-- Desktop modal using dialog component -->
<input type="checkbox" id="addPortfolio" class="modal-toggle" />

<dialog id="addPortfolio" class="modal modal-bottom sm:modal-middle">
  <!-- Modal backdrop for desktop -->
  <label for="addPortfolio" class="cursor-pointer modal-backdrop"></label>

  <!-- Desktop modal content -->
  <div
    class="modal-box w-full bg-white dark:bg-zinc-950 rounded-2xl border border-gray-300 shadow dark:border-zinc-700 shadow-none"
  >
    <div class="mb-5">
      <h3 class="font-bold text-2xl mb-5">New Portfolio</h3>

      <form on:submit={createPortfolio} class="space-y-2 w-full m-auto">
        <Input
          id="title"
          type="text"
          label="List Name"
          errors=""
          required={true}
        />

        <input class="hidden" name="user" value={data?.user?.id} />
        <input class="hidden" name="ticker" value={JSON.stringify([])} />

        <button
          type="submit"
          class="cursor-pointer mt-2 py-3 w-full rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold text-md transition hover:bg-gray-800 dark:hover:bg-zinc-200"
        >
          Create Portfolio
        </button>
      </form>
    </div>
  </div>
</dialog>
<!--End Create Watchlist Modal-->

<!--Start Delete Strategy Modal-->

<!--Start Delete Strategy Modal-->
<input type="checkbox" id="deletePortfolio" class="modal-toggle" />

<dialog id="deletePortfolio" class="modal modal-middle p-3 sm:p-0">
  <label for="deletePortfolio" class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box w-full p-6 rounded-2xl border bg-white dark:bg-zinc-950 border-gray-300 dark:border-zinc-700"
  >
    <h3 class="text-lg font-medium mb-2">Delete Portfolio</h3>
    <p class="text-sm mb-6">
      Are you sure you want to delete this portfolio? This action cannot be
      undone.
    </p>
    <div class="flex justify-end space-x-3">
      <label
        for="deletePortfolio"
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors duration-100 border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400"
        tabindex="0">Cancel</label
      ><label
        for="deletePortfolio"
        on:click={deletePortfolio}
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-colors duration-100 flex items-center border border-rose-200/70 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300"
        tabindex="0"
        ><svg
          stroke="currentColor"
          fill="none"
          stroke-width="2"
          viewBox="0 0 24 24"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-4 h-4 mr-2"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
          ><polyline points="3 6 5 6 21 6"></polyline><path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          ></path><line x1="10" y1="11" x2="10" y2="17"></line><line
            x1="14"
            y1="11"
            x2="14"
            y2="17"
          ></line></svg
        >Delete Portfolio</label
      >
    </div>
  </div>
</dialog>

<!--End Delete Strategy Modal-->

<!--End Delete Strategy Modal-->

<style>
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    70% {
      transform: scale(1.1); /* Adjust scale as needed for pulse effect */
      opacity: 0.8;
    }
    100% {
      transform: scale(1); /* End scale */
      opacity: 0;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Apply the animation styles to the element */
  .pulse-animation {
    animation: pulse 500ms ease-out forwards; /* 500ms duration */
    animation-iteration-count: 1;
  }

  @keyframes pulse-enter {
    from {
      transform: scale(0);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  .pulse-dot {
    animation:
      pulse-enter 150ms ease-out,
      pulse 500ms ease-out 150ms forwards;
  }

  .fade-in-row {
    animation: fadeIn 400ms ease-out forwards;
    animation-fill-mode: both;
  }
</style>
