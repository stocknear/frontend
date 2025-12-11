export const load = async ({ parent, locals, fetch }) => {
  const { getAllPortfolio, activePortfolioId } = await parent();
  const { apiKey, apiURL } = locals;

  // Helper function to parse ticker field
  function parseTickerField(ticker: any) {
    if (!ticker) return [];
    if (Array.isArray(ticker)) return ticker;
    if (typeof ticker === "string") {
      try {
        const parsed = JSON?.parse(ticker);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Failed to parse ticker:", e);
        return [];
      }
    }
    return [];
  }

  // Parse all portfolios and sort by updated (most recent first)
  const allPortfolios = (getAllPortfolio?.map((portfolio: any) => {
    return {
      ...portfolio,
      ticker: parseTickerField(portfolio?.ticker),
    };
  }) || []).sort((a: any, b: any) => {
    const dateA = new Date(a?.updated || 0)?.getTime();
    const dateB = new Date(b?.updated || 0)?.getTime();
    return dateB - dateA; // Descending order (newest first)
  });

  // Determine active portfolio
  let displayPortfolio = null;

  if (activePortfolioId) {
    displayPortfolio = allPortfolios?.find((p: any) => p.id === activePortfolioId);
  }

  if (!displayPortfolio && allPortfolios?.length > 0) {
    displayPortfolio = allPortfolios[0];
  }

  // If no portfolio, return empty data
  if (!displayPortfolio || !displayPortfolio?.ticker || displayPortfolio?.ticker?.length === 0) {
    return {
      portfolioData: [],
      analysisData: null,
      displayPortfolio,
      allPortfolios,
    };
  }

  try {
    // Call backend API directly to get portfolio analysis (except bullBear)
    const response = await fetch(apiURL + "/portfolio-analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        portfolioId: displayPortfolio.id,
        holdings: displayPortfolio.ticker,
      }),
    });

    const analysisData = response.ok ? await response?.json() : null;

    // Get bullBear data from PocketBase (not FastAPI)
    // Supports both new format (sentiment, keyHighlights, risks, outlook)
    // and old format (bullSay, bearSay) for backward compatibility
    let bullBearData: any = null;

    if (displayPortfolio?.bullBear) {
      const pbBullBear = typeof displayPortfolio.bullBear === 'string'
        ? JSON.parse(displayPortfolio.bullBear)
        : displayPortfolio.bullBear;

      // Check if it's new format (has sentiment field) or old format (has bullSay/bearSay)
      if (pbBullBear?.sentiment) {
        // New format - pass through as-is
        bullBearData = {
          sentiment: pbBullBear.sentiment,
          sentimentScore: pbBullBear.sentimentScore,
          keyHighlights: pbBullBear.keyHighlights || [],
          risks: pbBullBear.risks || [],
          outlook: pbBullBear.outlook || "",
          date: pbBullBear.date || null,
        };
      } else if (pbBullBear?.bullSay || pbBullBear?.bearSay) {
        // Old format - keep for backward compatibility but component won't auto-display
        bullBearData = {
          bullSays: pbBullBear?.bullSay || "",
          bearSays: pbBullBear?.bearSay || "",
          date: pbBullBear?.date || null,
        };
      }
    }

    // Override bullBear from FastAPI with PocketBase data
    if (analysisData) {
      analysisData.bullBear = bullBearData;
    }

    return {
      portfolioData: displayPortfolio.ticker,
      analysisData,
      displayPortfolio,
      allPortfolios,
    };
  } catch (error) {
    console.error("Error loading portfolio analysis:", error);
    return {
      portfolioData: displayPortfolio.ticker,
      analysisData: null,
      displayPortfolio,
      allPortfolios,
    };
  }
};
