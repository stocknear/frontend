import { postAPI } from "$lib/server/api";

export const load = async ({ parent, locals }) => {
  const { getAllPortfolio, activePortfolioId } = await parent();

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
    return dateB - dateA;
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
    const analysisData = await postAPI(locals, "/portfolio-analysis", {
      portfolioId: displayPortfolio.id,
      holdings: displayPortfolio.ticker,
    });

    // Get bullBear data from PocketBase (not FastAPI)
    let bullBearData: any = null;

    if (displayPortfolio?.bullBear) {
      const pbBullBear = typeof displayPortfolio.bullBear === 'string'
        ? JSON.parse(displayPortfolio.bullBear)
        : displayPortfolio.bullBear;

      if (pbBullBear?.sentiment) {
        bullBearData = {
          sentiment: pbBullBear.sentiment,
          sentimentScore: pbBullBear.sentimentScore,
          keyHighlights: pbBullBear.keyHighlights || [],
          risks: pbBullBear.risks || [],
          outlook: pbBullBear.outlook || "",
          date: pbBullBear.date || null,
        };
      } else if (pbBullBear?.bullSay || pbBullBear?.bearSay) {
        bullBearData = {
          bullSays: pbBullBear?.bullSay || "",
          bearSays: pbBullBear?.bearSay || "",
          date: pbBullBear?.date || null,
        };
      }
    }

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
