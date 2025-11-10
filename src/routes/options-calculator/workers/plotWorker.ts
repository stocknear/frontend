

  // Helper function for currency formatting
  function formatCurrency(value: number): string {
    return Math.abs(value)?.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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

function plotData(userStrategy, currentStockPrice) {
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
  

    return {metrics, breakEvenPrice, totalPremium, dataPoints, xMin, xMax};
  }


  onmessage = async (event) => {
  const { userStrategy, currentStockPrice } = event.data;
 
  const output = plotData(userStrategy, currentStockPrice);

   
  postMessage({ message: "success", output });
};

export {};
