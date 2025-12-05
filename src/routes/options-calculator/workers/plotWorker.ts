
  // Helper function for currency formatting
  function formatCurrency(value: number): string {
    return Math.abs(value)?.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // ============================================
  // BLACK-SCHOLES PROBABILITY CALCULATIONS
  // ============================================

  // Standard normal cumulative distribution function (CDF)
  function normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  // Standard normal probability density function (PDF)
  function normalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  // Calculate d1 and d2 for Black-Scholes
  function calculateD1D2(S: number, K: number, T: number, r: number, sigma: number): { d1: number; d2: number } {
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    return { d1, d2 };
  }

  // Black-Scholes call price
  function blackScholesCall(S: number, K: number, T: number, r: number, sigma: number): number {
    if (T <= 0) return Math.max(0, S - K);
    const { d1, d2 } = calculateD1D2(S, K, T, r, sigma);
    return S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
  }

  // Black-Scholes put price
  function blackScholesPut(S: number, K: number, T: number, r: number, sigma: number): number {
    if (T <= 0) return Math.max(0, K - S);
    const { d1, d2 } = calculateD1D2(S, K, T, r, sigma);
    return K * Math.exp(-r * T) * normalCDF(-d2) - S * normalCDF(-d1);
  }

  // Calculate implied volatility using bisection method
  function calculateImpliedVolatility(
    optionPrice: number,
    S: number,
    K: number,
    T: number,
    r: number,
    optionType: string
  ): number {
    if (T <= 0 || optionPrice <= 0) return 0.3; // Default IV of 30%

    const priceFn = optionType === "Call" ? blackScholesCall : blackScholesPut;

    let low = 0.01;
    let high = 3.0; // 300% IV max
    let mid = 0.3;
    const tolerance = 0.0001;
    const maxIterations = 100;

    for (let i = 0; i < maxIterations; i++) {
      mid = (low + high) / 2;
      const price = priceFn(S, K, T, r, mid);
      const diff = price - optionPrice;

      if (Math.abs(diff) < tolerance) {
        return mid;
      }

      if (diff > 0) {
        high = mid;
      } else {
        low = mid;
      }
    }

    return mid;
  }

  // Calculate probability that stock price ends above a target price
  function probabilityAbovePrice(S: number, targetPrice: number, T: number, r: number, sigma: number): number {
    if (T <= 0) return S > targetPrice ? 1 : 0;
    if (sigma <= 0) return S > targetPrice ? 1 : 0;

    // Under log-normal distribution: P(S_T > K) = N(d2) where d2 uses real-world drift
    // For simplicity, we use risk-neutral probability which is more conservative
    const d2 = (Math.log(S / targetPrice) + (r - 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    return normalCDF(d2);
  }

  // Calculate probability that stock price ends below a target price
  function probabilityBelowPrice(S: number, targetPrice: number, T: number, r: number, sigma: number): number {
    return 1 - probabilityAbovePrice(S, targetPrice, T, r, sigma);
  }

  // Calculate probability that stock price ends between two prices
  function probabilityBetweenPrices(S: number, lowPrice: number, highPrice: number, T: number, r: number, sigma: number): number {
    return probabilityAbovePrice(S, lowPrice, T, r, sigma) - probabilityAbovePrice(S, highPrice, T, r, sigma);
  }

  // Calculate weighted average IV from all legs
  function calculateStrategyIV(userStrategy: any[], S: number, T: number, r: number): number {
    if (!userStrategy || userStrategy.length === 0) return 0.3;

    let totalWeight = 0;
    let weightedIV = 0;

    userStrategy.forEach((leg) => {
      const iv = calculateImpliedVolatility(
        leg.optionPrice,
        S,
        leg.strike,
        T,
        r,
        leg.optionType
      );
      const weight = leg.quantity || 1;
      weightedIV += iv * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedIV / totalWeight : 0.3;
  }

  // Main probability calculation function
  function calculateProbabilities(
    userStrategy: any[],
    currentStockPrice: number,
    breakEvenPrice: number | null,
    dataPoints: number[][],
    expirationDate: string
  ): { pop: number; popMaxProfit: number; popMaxLoss: number } {
    const riskFreeRate = 0.05; // 5% risk-free rate

    // Calculate time to expiration in years
    const now = new Date();
    const expDate = new Date(expirationDate + "T16:00:00"); // Market close time
    const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
    const T = Math.max((expDate.getTime() - now.getTime()) / msPerYear, 0.001);

    // Calculate strategy IV
    const sigma = calculateStrategyIV(userStrategy, currentStockPrice, T, riskFreeRate);

    // Find profit and loss zones from dataPoints
    const profitZones: { low: number; high: number }[] = [];
    const lossZones: { low: number; high: number }[] = [];
    let maxProfitZones: { low: number; high: number }[] = [];
    let maxLossZones: { low: number; high: number }[] = [];

    // Find max profit and max loss values
    let maxProfit = -Infinity;
    let maxLoss = Infinity;
    dataPoints.forEach(([price, pl]) => {
      if (pl > maxProfit) maxProfit = pl;
      if (pl < maxLoss) maxLoss = pl;
    });

    // Identify zones
    let currentZone: { type: string; low: number; high: number } | null = null;
    const profitThreshold = 0.01; // Small threshold to handle floating point
    const maxProfitThreshold = maxProfit * 0.99; // Within 1% of max profit
    const maxLossThreshold = maxLoss * 0.99; // Within 1% of max loss (more negative)

    for (let i = 0; i < dataPoints.length; i++) {
      const [price, pl] = dataPoints[i];
      const isProfit = pl > profitThreshold;
      const isMaxProfit = pl >= maxProfitThreshold && maxProfit > 0;
      const isMaxLoss = pl <= maxLossThreshold && maxLoss < 0;

      // Track profit zones
      if (isProfit) {
        if (!currentZone || currentZone.type !== "profit") {
          if (currentZone && currentZone.type === "loss") {
            lossZones.push({ low: currentZone.low, high: currentZone.high });
          }
          currentZone = { type: "profit", low: price, high: price };
        } else {
          currentZone.high = price;
        }
      } else {
        if (!currentZone || currentZone.type !== "loss") {
          if (currentZone && currentZone.type === "profit") {
            profitZones.push({ low: currentZone.low, high: currentZone.high });
          }
          currentZone = { type: "loss", low: price, high: price };
        } else {
          currentZone.high = price;
        }
      }

      // Track max profit zones
      if (isMaxProfit) {
        if (maxProfitZones.length === 0 || maxProfitZones[maxProfitZones.length - 1].high < price - 1) {
          maxProfitZones.push({ low: price, high: price });
        } else {
          maxProfitZones[maxProfitZones.length - 1].high = price;
        }
      }

      // Track max loss zones
      if (isMaxLoss) {
        if (maxLossZones.length === 0 || maxLossZones[maxLossZones.length - 1].high < price - 1) {
          maxLossZones.push({ low: price, high: price });
        } else {
          maxLossZones[maxLossZones.length - 1].high = price;
        }
      }
    }

    // Push the last zone
    if (currentZone) {
      if (currentZone.type === "profit") {
        profitZones.push({ low: currentZone.low, high: currentZone.high });
      } else {
        lossZones.push({ low: currentZone.low, high: currentZone.high });
      }
    }

    // Calculate Probability of Profit (PoP)
    let pop = 0;
    profitZones.forEach((zone) => {
      if (zone.high >= dataPoints[dataPoints.length - 1][0]) {
        // Zone extends to infinity (or max price)
        pop += probabilityAbovePrice(currentStockPrice, zone.low, T, riskFreeRate, sigma);
      } else if (zone.low <= 0) {
        // Zone starts from 0
        pop += probabilityBelowPrice(currentStockPrice, zone.high, T, riskFreeRate, sigma);
      } else {
        pop += probabilityBetweenPrices(currentStockPrice, zone.low, zone.high, T, riskFreeRate, sigma);
      }
    });

    // Calculate Probability of Max Profit
    let popMaxProfit = 0;
    maxProfitZones.forEach((zone) => {
      if (zone.high >= dataPoints[dataPoints.length - 1][0]) {
        popMaxProfit += probabilityAbovePrice(currentStockPrice, zone.low, T, riskFreeRate, sigma);
      } else if (zone.low <= 0) {
        popMaxProfit += probabilityBelowPrice(currentStockPrice, zone.high, T, riskFreeRate, sigma);
      } else {
        popMaxProfit += probabilityBetweenPrices(currentStockPrice, zone.low, zone.high, T, riskFreeRate, sigma);
      }
    });

    // Calculate Probability of Max Loss
    let popMaxLoss = 0;
    maxLossZones.forEach((zone) => {
      if (zone.high >= dataPoints[dataPoints.length - 1][0]) {
        popMaxLoss += probabilityAbovePrice(currentStockPrice, zone.low, T, riskFreeRate, sigma);
      } else if (zone.low <= 0) {
        popMaxLoss += probabilityBelowPrice(currentStockPrice, zone.high, T, riskFreeRate, sigma);
      } else {
        popMaxLoss += probabilityBetweenPrices(currentStockPrice, zone.low, zone.high, T, riskFreeRate, sigma);
      }
    });

    // Clamp probabilities to [0, 1]
    pop = Math.max(0, Math.min(1, pop));
    popMaxProfit = Math.max(0, Math.min(1, popMaxProfit));
    popMaxLoss = Math.max(0, Math.min(1, popMaxLoss));

    return { pop, popMaxProfit, popMaxLoss };
  }

function calculateMetrics(userStrategy) {
    const multiplier = 100;
    let metrics = {};

    // Get all legs in the strategy
    const allLegs = [...userStrategy];

    // Check if strategy is empty
    if (allLegs.length === 0) {
      metrics = {
        maxProfit: "$0",
        maxLoss: "$0",
      };
      return metrics;
    }

    // Consolidate identical strikes with opposite actions (Buy/Sell)
    const consolidatedLegs = [];
    const strikeMap = new Map();

    // Group legs by strike and option type
    allLegs.forEach((leg) => {
      const key = `${leg.strike}-${leg.optionType}`;
      if (!strikeMap.has(key)) {
        strikeMap.set(key, []);
      }
      strikeMap.get(key).push(leg);
    });

    // Consolidate legs with same strike/option type into net positions
    strikeMap.forEach((legs, key) => {
      let netQuantity = 0;
      let netCost = 0;
      legs.forEach((leg) => {
        const quantity = leg.quantity || 1;
        if (leg.action === "Buy") {
          netQuantity += quantity;
          netCost += leg.optionPrice * quantity;
        } else {
          netQuantity -= quantity;
          netCost -= leg.optionPrice * quantity;
        }
      });
      // Only include legs with nonzero positions
      if (netQuantity !== 0) {
        const [strike, optionType] = key.split("-");
        consolidatedLegs.push({
          strike: parseFloat(strike),
          optionType,
          optionPrice: Math.abs(netCost / netQuantity),
          quantity: Math.abs(netQuantity),
          action: netQuantity > 0 ? "Buy" : "Sell",
        });
      }
    });

    // Separate the legs by type and action
    const buyCalls = consolidatedLegs.filter(
      (leg) => leg.action === "Buy" && leg.optionType === "Call",
    );
    const sellCalls = consolidatedLegs.filter(
      (leg) => leg.action === "Sell" && leg.optionType === "Call",
    );
    const buyPuts = consolidatedLegs.filter(
      (leg) => leg.action === "Buy" && leg.optionType === "Put",
    );
    const sellPuts = consolidatedLegs.filter(
      (leg) => leg.action === "Sell" && leg.optionType === "Put",
    );

    // Calculate net premium for the entire strategy.
    let netPremium = 0;
    allLegs.forEach((leg) => {
      const quantity = leg.quantity || 1;
      const premium = leg.optionPrice * multiplier * quantity;
      if (leg.action === "Buy") {
        netPremium -= premium;
      } else {
        netPremium += premium;
      }
    });

    // --- VERTICAL SPREAD HANDLING (UPDATED) ---
    if (buyCalls.length === 1 && sellCalls.length === 1) {
      const buyCall = buyCalls[0];
      const sellCall = sellCalls[0];
      const spreadWidth =
        Math.abs(buyCall.strike - sellCall.strike) * multiplier;

      if (buyCall.strike < sellCall.strike) {
        // Bull call spread: max loss is net debit, max profit is spread width - net debit
        const maxLoss = -netPremium; // Net debit is negative, convert to positive
        const maxProfit = spreadWidth - maxLoss;
        metrics = {
          maxProfit: `$${formatCurrency(maxProfit)}`,
          maxLoss: `$${formatCurrency(maxLoss)}`,
        };
      } else {
        // Bear call spread: max profit is net credit, max loss is spread width - net credit
        const maxProfit = netPremium;
        const maxLoss = spreadWidth - maxProfit;
        metrics = {
          maxProfit: `$${formatCurrency(maxProfit)}`,
          maxLoss: `$${formatCurrency(maxLoss)}`,
        };
      }
      return metrics;
    }
    // --- END VERTICAL SPREAD HANDLING ---

    // Determine unlimited profit/loss flags based on calls only.
    let hasUnlimitedProfit = false;
    let hasUnlimitedLoss = false;
    if (buyCalls.length > 0) {
      const sortedBuyCalls = [...buyCalls].sort((a, b) => a.strike - b.strike);
      const sortedSellCalls = [...sellCalls].sort(
        (a, b) => a.strike - b.strike,
      );
      if (
        sellCalls.length === 0 ||
        sortedBuyCalls[sortedBuyCalls.length - 1].strike >
          sortedSellCalls[sortedSellCalls.length - 1].strike
      ) {
        hasUnlimitedProfit = true;
      }
      const totalBuyCallQuantity = sortedBuyCalls.reduce(
        (sum, leg) => sum + (leg.quantity || 1),
        0,
      );
      const totalSellCallQuantity = sortedSellCalls.reduce(
        (sum, leg) => sum + (leg.quantity || 1),
        0,
      );
      if (totalBuyCallQuantity > totalSellCallQuantity) {
        hasUnlimitedProfit = true;
      }
    }
    if (sellCalls.length > 0) {
      const sortedBuyCalls = [...buyCalls].sort((a, b) => a.strike - b.strike);
      const sortedSellCalls = [...sellCalls].sort(
        (a, b) => a.strike - b.strike,
      );
      if (
        buyCalls.length === 0 ||
        sortedSellCalls[sortedSellCalls.length - 1].strike >
          sortedBuyCalls[sortedBuyCalls.length - 1].strike
      ) {
        hasUnlimitedLoss = true;
      }
      const totalBuyCallQuantity = sortedBuyCalls.reduce(
        (sum, leg) => sum + (leg.quantity || 1),
        0,
      );
      const totalSellCallQuantity = sortedSellCalls.reduce(
        (sum, leg) => sum + (leg.quantity || 1),
        0,
      );
      if (totalSellCallQuantity > totalBuyCallQuantity) {
        hasUnlimitedLoss = true;
      }
    }

    // Check if exactly one put is bought and one sold (vertical spread)
    if (buyPuts.length === 1 && sellPuts.length === 1) {
      const buyStrike = buyPuts[0].strike;
      const sellStrike = sellPuts[0].strike;
      const spreadWidth = Math.abs(buyStrike - sellStrike) * multiplier;

      // Bull Put Spread (sell higher strike, buy lower strike)
      if (sellStrike > buyStrike) {
        const maxProfit = netPremium; // Net credit received
        const maxLoss = spreadWidth - maxProfit;
        metrics = {
          maxProfit: `$${formatCurrency(maxProfit)}`,
          maxLoss: `$${formatCurrency(maxLoss)}`,
        };
        return metrics;
      }
      // Bear Put Spread (buy higher strike, sell lower strike)
      else if (buyStrike > sellStrike) {
        const maxProfit = spreadWidth - Math.abs(netPremium);
        const maxLoss = Math.abs(netPremium); // Net debit paid
        metrics = {
          maxProfit: `$${formatCurrency(maxProfit)}`,
          maxLoss: `$${formatCurrency(maxLoss)}`,
        };
        return metrics;
      }
    }

    // --- RATIO SPREAD HANDLING ---
    // Detect a pattern where two (or more) long calls bracket the short call(s) with balanced quantities.
    if (buyCalls.length >= 2 && sellCalls.length >= 1) {
      const buyStrikes = buyCalls.map((leg) => leg.strike);
      const sellStrikes = sellCalls.map((leg) => leg.strike);
      const lowerBuy = Math.min(...buyStrikes);
      const higherBuy = Math.max(...buyStrikes);
      const minSell = Math.min(...sellStrikes);
      const maxSell = Math.max(...sellStrikes);
      const totalBuyCallQuantity = buyCalls.reduce(
        (sum, leg) => sum + leg.quantity,
        0,
      );
      const totalSellCallQuantity = sellCalls.reduce(
        (sum, leg) => sum + leg.quantity,
        0,
      );

      if (
        lowerBuy < minSell &&
        higherBuy > maxSell &&
        totalBuyCallQuantity === totalSellCallQuantity
      ) {
        hasUnlimitedProfit = false;
        hasUnlimitedLoss = false;
      }
    }
    // --- END RATIO SPREAD HANDLING ---

    // If we haven't returned earlier via a specific branch, then compute profit and loss
    // by simulating across various price points.
    const strikes = allLegs.map((leg) => leg.strike);
    const minStrike = Math.min(...strikes);
    const maxStrike = Math.max(...strikes);
    const pricePoints = [0, minStrike / 2, ...strikes, maxStrike * 1.5];

    let computedMaxProfit = -Infinity;
    let computedMaxLoss = -netPremium; // starting point: net premium paid

    pricePoints.forEach((price) => {
      let profitAtPrice = netPremium;
      allLegs.forEach((leg) => {
        const quantity = leg.quantity || 1;
        if (leg.optionType === "Call") {
          if (price > leg.strike) {
            const intrinsicValue = (price - leg.strike) * multiplier * quantity;
            profitAtPrice +=
              leg.action === "Buy" ? intrinsicValue : -intrinsicValue;
          }
        } else if (leg.optionType === "Put") {
          if (price < leg.strike) {
            const intrinsicValue = (leg.strike - price) * multiplier * quantity;
            profitAtPrice +=
              leg.action === "Buy" ? intrinsicValue : -intrinsicValue;
          }
        }
      });
      computedMaxProfit = Math.max(computedMaxProfit, profitAtPrice);
      if (profitAtPrice < 0) {
        computedMaxLoss = Math.min(computedMaxLoss, profitAtPrice);
      }
    });

    // Adjust final metrics based on unlimited flags:
    if (hasUnlimitedProfit && !hasUnlimitedLoss) {
      metrics = {
        maxProfit: "Unlimited",
        maxLoss: `$${formatCurrency(Math.abs(computedMaxLoss))}`,
      };
    } else if (!hasUnlimitedProfit && hasUnlimitedLoss) {
      metrics = {
        maxProfit: `$${formatCurrency(computedMaxProfit)}`,
        maxLoss: "Unlimited",
      };
    } else if (hasUnlimitedProfit && hasUnlimitedLoss) {
      metrics = {
        maxProfit: "Unlimited",
        maxLoss: "Unlimited",
      };
    } else {
      metrics = {
        maxProfit: `$${formatCurrency(computedMaxProfit)}`,
        maxLoss: `$${formatCurrency(Math.abs(computedMaxLoss))}`,
      };
    }

    return metrics;
  }

  
function calculateBreakevenPrice(dataPoints) {
let breakEvenPrice = null;
// Loop over the dataPoints to find a sign change from loss to profit or vice versa
for (let i = 1; i < dataPoints.length; i++) {
    const [prevPrice, prevProfitLoss] = dataPoints[i - 1];
    const [currPrice, currProfitLoss] = dataPoints[i];

    // Check if there is a sign change between consecutive points
    if (
    (prevProfitLoss < 0 && currProfitLoss >= 0) ||
    (prevProfitLoss > 0 && currProfitLoss <= 0)
    ) {
    // Linear interpolation to estimate the exact crossing point
    const priceDiff = currPrice - prevPrice;
    const profitDiff = currProfitLoss - prevProfitLoss;
    
    // Handle edge case where profit difference is zero or very small
    if (Math.abs(profitDiff) < 0.0001) {
        // If the difference is negligible, use the midpoint
        breakEvenPrice = (prevPrice + currPrice) / 2;
    } else {
        const ratio = Math.abs(prevProfitLoss) / Math.abs(profitDiff);
        breakEvenPrice = prevPrice + ratio * priceDiff;
    }
    break;
    }
    
    // Special case: check if current point is exactly at breakeven (profit/loss = 0)
    if (Math.abs(currProfitLoss) < 0.0001) {
        breakEvenPrice = currPrice;
        break;
    }
}

return breakEvenPrice;
}

  const payoffFunctions = {
    "Buy Call": (
      s: number,
      strike: number,
      premium: number,
      quantity: number,
    ) => (s < strike ? -premium : (s - strike) * 100 * quantity - premium),

    "Sell Call": (
      s: number,
      strike: number,
      premium: number,
      quantity: number,
    ) => (s < strike ? premium : premium - (s - strike) * 100 * quantity),

    "Buy Put": (
      s: number,
      strike: number,
      premium: number,
      quantity: number,
    ) => (s > strike ? -premium : (strike - s) * 100 * quantity - premium),

    "Sell Put": (
      s: number,
      strike: number,
      premium: number,
      quantity: number,
    ) => (s > strike ? premium : premium - (strike - s) * 100 * quantity),
  };

function plotData(userStrategy, currentStockPrice, expirationDate) {
    // Determine x-axis range based on current stock price and max leg strike
    if (!userStrategy || userStrategy.length === 0) {
      return null;
    }

    const maxLegStrike = Math.max(...userStrategy.map((leg) => leg.strike));
    const xMin = 0;
    const xMax = Math.floor(Math.max(currentStockPrice, maxLegStrike) * 3);
    const step = 1; // Use finer step for more accurate breakeven detection

    // Calculate the total premium across all legs
    let totalPremium = userStrategy.reduce((sum, leg) => {
      return sum + leg.optionPrice * 100 * leg.quantity;
    }, 0);

    // Compute the aggregated payoff at each underlying price
    const dataPoints = [];
    for (let s = xMin; s <= xMax; s += step) {
      let aggregatedPayoff = 0;
      userStrategy.forEach((leg) => {
        const legPremium = leg.optionPrice * 100 * leg.quantity;
        const scenarioKey = `${leg.action} ${leg.optionType}`;
        if (payoffFunctions[scenarioKey]) {
          aggregatedPayoff += payoffFunctions[scenarioKey](
            s,
            leg.strike,
            legPremium,
            leg.quantity,
          );
        } else {
          console.error(
            "Payoff function not implemented for scenario:",
            scenarioKey,
          );
        }
      });
      dataPoints.push([s, aggregatedPayoff]);
    }

    const metrics = calculateMetrics(userStrategy);
    let breakEvenPrice = calculateBreakevenPrice(dataPoints);

    // Calculate probabilities using Black-Scholes
    const probabilities = calculateProbabilities(
      userStrategy,
      currentStockPrice,
      breakEvenPrice,
      dataPoints,
      expirationDate
    );

    return {metrics, breakEvenPrice, totalPremium, dataPoints, xMin, xMax, probabilities};
  }


  onmessage = async (event) => {
  const { userStrategy, currentStockPrice, expirationDate } = event.data;

  const output = plotData(userStrategy, currentStockPrice, expirationDate);


  postMessage({ message: "success", output });
};

export {};
