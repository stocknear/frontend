
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

    const optionLegs = userStrategy.filter((leg) => leg?.legType !== "Share");
    if (optionLegs.length === 0) return 0.3;

    let totalWeight = 0;
    let weightedIV = 0;

    optionLegs.forEach((leg) => {
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

  // Log-normal probability density function (PDF)
  function logNormalPDF(S: number, S0: number, T: number, r: number, sigma: number): number {
    if (S <= 0 || T <= 0 || sigma <= 0) return 0;

    const mu = Math.log(S0) + (r - 0.5 * sigma * sigma) * T;
    const sigmaT = sigma * Math.sqrt(T);

    const logS = Math.log(S);
    const exponent = -((logS - mu) ** 2) / (2 * sigmaT * sigmaT);

    return Math.exp(exponent) / (S * sigmaT * Math.sqrt(2 * Math.PI));
  }

  // Calculate the price range that captures a given percentage of probability mass
  function getPriceQuantile(S0: number, T: number, r: number, sigma: number, percentile: number): number {
    // For log-normal: ln(S_T) ~ N(mu, sigmaT^2)
    // Quantile: S = exp(mu + z * sigmaT) where z is standard normal quantile
    const mu = Math.log(S0) + (r - 0.5 * sigma * sigma) * T;
    const sigmaT = sigma * Math.sqrt(T);

    // Approximate inverse normal CDF for common percentiles
    let z: number;
    if (percentile >= 0.999) z = 3.09;
    else if (percentile >= 0.99) z = 2.33;
    else if (percentile >= 0.95) z = 1.645;
    else if (percentile <= 0.001) z = -3.09;
    else if (percentile <= 0.01) z = -2.33;
    else if (percentile <= 0.05) z = -1.645;
    else z = 0;

    return Math.exp(mu + z * sigmaT);
  }

  // Calculate Expected Value using discrete summation
  function calculateExpectedValue(
    dataPoints: number[][],
    currentStockPrice: number,
    T: number,
    r: number,
    sigma: number
  ): number {
    if (!dataPoints || dataPoints.length === 0 || sigma <= 0 || T <= 0) {
      return 0;
    }

    let ev = 0;
    let totalProbability = 0;
    const step = dataPoints.length > 1 ? dataPoints[1][0] - dataPoints[0][0] : 1;

    for (let i = 0; i < dataPoints.length; i++) {
      const [price, payoff] = dataPoints[i];
      if (price <= 0) continue; // Skip price = 0 (log-normal PDF is 0 there)

      const probability = logNormalPDF(price, currentStockPrice, T, r, sigma) * step;
      ev += payoff * probability;
      totalProbability += probability;
    }

    // Normalize if probability doesn't sum to ~1 (due to truncation)
    // Only normalize if we captured a reasonable amount of probability mass
    if (totalProbability > 0.5 && totalProbability < 1.5) {
      ev = ev / totalProbability;
    }

    return ev;
  }

  // Calculate Risk/Reward metrics
  function calculateRiskRewardMetrics(
    dataPoints: number[][],
    currentStockPrice: number,
    T: number,
    r: number,
    sigma: number,
    maxProfit: number | null,
    maxLoss: number | null,
    hasUnlimitedProfit: boolean,
    hasUnlimitedLoss: boolean
  ): { expectedValue: number; expectedReturn: number | null; rewardRisk: number | null } {

    const expectedValue = calculateExpectedValue(dataPoints, currentStockPrice, T, r, sigma);

    // Expected Return = EV / |Max Loss|
    let expectedReturn: number | null = null;
    if (!hasUnlimitedLoss && maxLoss !== null && maxLoss !== 0) {
      expectedReturn = (expectedValue / Math.abs(maxLoss)) * 100;
    }

    // Reward/Risk = Max Profit / |Max Loss|
    let rewardRisk: number | null = null;
    if (!hasUnlimitedProfit && !hasUnlimitedLoss && maxProfit !== null && maxLoss !== null && maxLoss !== 0) {
      rewardRisk = (maxProfit / Math.abs(maxLoss)) * 100;
    }

    return { expectedValue, expectedReturn, rewardRisk };
  }

  // ============================================
  // GREEKS CALCULATIONS
  // ============================================

  // Calculate individual option Greeks
  function calculateOptionGreeks(
    S: number,      // Stock price
    K: number,      // Strike price
    T: number,      // Time to expiration (years)
    r: number,      // Risk-free rate
    sigma: number,  // Implied volatility
    optionType: string  // "Call" or "Put"
  ): { delta: number; gamma: number; theta: number; vega: number } {

    // Handle edge cases
    if (T <= 0 || sigma <= 0) {
      // At expiration, return intrinsic Greeks
      const isITM = optionType === "Call" ? S > K : S < K;
      return {
        delta: isITM ? (optionType === "Call" ? 1 : -1) : 0,
        gamma: 0,
        theta: 0,
        vega: 0,
      };
    }

    const { d1, d2 } = calculateD1D2(S, K, T, r, sigma);
    const sqrtT = Math.sqrt(T);
    const Nd1 = normalCDF(d1);
    const Nd2 = normalCDF(d2);
    const Npd1 = normalPDF(d1); // N'(d1) - PDF at d1
    const expRT = Math.exp(-r * T);

    let delta: number;
    let theta: number;

    if (optionType === "Call") {
      // Call Delta = N(d1)
      delta = Nd1;

      // Call Theta = -(S * N'(d1) * σ) / (2√T) - r * K * e^(-rT) * N(d2)
      theta = -(S * Npd1 * sigma) / (2 * sqrtT) - r * K * expRT * Nd2;
    } else {
      // Put Delta = N(d1) - 1
      delta = Nd1 - 1;

      // Put Theta = -(S * N'(d1) * σ) / (2√T) + r * K * e^(-rT) * N(-d2)
      theta = -(S * Npd1 * sigma) / (2 * sqrtT) + r * K * expRT * normalCDF(-d2);
    }

    // Gamma = N'(d1) / (S * σ * √T) - same for calls and puts
    const gamma = Npd1 / (S * sigma * sqrtT);

    // Vega = S * N'(d1) * √T - same for calls and puts
    // Divide by 100 to express per 1% change in IV
    const vega = (S * Npd1 * sqrtT) / 100;

    // Convert theta to per-day (divide by 365)
    const thetaPerDay = theta / 365;

    return {
      delta,
      gamma,
      theta: thetaPerDay,
      vega,
    };
  }

  // Calculate position Greeks for the entire strategy
  function calculatePositionGreeks(
    userStrategy: any[],
    currentStockPrice: number,
    T: number,
    r: number
  ): { delta: number; gamma: number; theta: number; vega: number } {

    if (!userStrategy || userStrategy.length === 0) {
      return { delta: 0, gamma: 0, theta: 0, vega: 0 };
    }

    let positionDelta = 0;
    let positionGamma = 0;
    let positionTheta = 0;
    let positionVega = 0;

    const contractMultiplier = 100; // 100 shares per contract

    userStrategy.forEach((leg) => {
      const quantity = leg.quantity || 1;
      const direction = leg.action === "Buy" ? 1 : -1;

      if (leg?.legType === "Share") {
        // Share delta is +/- 1 per share, other greeks are ~0.
        positionDelta += quantity * direction;
        return;
      }

      // Calculate IV for this specific leg
      const legIV = calculateImpliedVolatility(
        leg.optionPrice,
        currentStockPrice,
        leg.strike,
        T,
        r,
        leg.optionType
      );

      // Calculate Greeks for this leg
      const greeks = calculateOptionGreeks(
        currentStockPrice,
        leg.strike,
        T,
        r,
        legIV,
        leg.optionType
      );

      // Add to position Greeks (multiply by quantity, direction, and contract multiplier)
      positionDelta += greeks.delta * quantity * direction * contractMultiplier;
      positionGamma += greeks.gamma * quantity * direction * contractMultiplier;
      positionTheta += greeks.theta * quantity * direction * contractMultiplier;
      positionVega += greeks.vega * quantity * direction * contractMultiplier;
    });

    return {
      delta: positionDelta,
      gamma: positionGamma,
      theta: positionTheta,
      vega: positionVega,
    };
  }

  // Main probability calculation function
  function calculateProbabilities(
    userStrategy: any[],
    currentStockPrice: number,
    _breakEvenPrices: number[],
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

function calculateMetrics(dataPoints: number[][]): {
    maxProfit: string;
    maxLoss: string;
    maxProfitValue: number;
    maxLossValue: number;
    hasUnlimitedProfit: boolean;
    hasUnlimitedLoss: boolean;
  } {
    if (!dataPoints || dataPoints.length === 0) {
      return {
        maxProfit: "$0",
        maxLoss: "$0",
        maxProfitValue: 0,
        maxLossValue: 0,
        hasUnlimitedProfit: false,
        hasUnlimitedLoss: false,
      };
    }

    const profits = dataPoints.map((point) => point[1]);
    const maxProfitValue = Math.max(...profits);
    const minProfitValue = Math.min(...profits);

    const n = dataPoints.length;
    const slopeHigh =
      n > 1
        ? (dataPoints[n - 1][1] - dataPoints[n - 2][1]) /
          Math.max(1, dataPoints[n - 1][0] - dataPoints[n - 2][0])
        : 0;
    const slopeThreshold = 0.001;

    const hasUnlimitedProfit = slopeHigh > slopeThreshold;
    const hasUnlimitedLoss = slopeHigh < -slopeThreshold;
    const maxLossValue = minProfitValue < 0 ? Math.abs(minProfitValue) : 0;

    const formatSignedDollar = (value: number) =>
      `${value >= 0 ? "$" : "-$"}${formatCurrency(value)}`;

    if (hasUnlimitedProfit && !hasUnlimitedLoss) {
      return {
        maxProfit: "Unlimited",
        maxLoss: `$${formatCurrency(maxLossValue)}`,
        maxProfitValue,
        maxLossValue,
        hasUnlimitedProfit: true,
        hasUnlimitedLoss: false,
      };
    }

    if (!hasUnlimitedProfit && hasUnlimitedLoss) {
      return {
        maxProfit: formatSignedDollar(maxProfitValue),
        maxLoss: "Unlimited",
        maxProfitValue,
        maxLossValue,
        hasUnlimitedProfit: false,
        hasUnlimitedLoss: true,
      };
    }

    if (hasUnlimitedProfit && hasUnlimitedLoss) {
      return {
        maxProfit: "Unlimited",
        maxLoss: "Unlimited",
        maxProfitValue,
        maxLossValue,
        hasUnlimitedProfit: true,
        hasUnlimitedLoss: true,
      };
    }

    return {
      maxProfit: formatSignedDollar(maxProfitValue),
      maxLoss: `$${formatCurrency(maxLossValue)}`,
      maxProfitValue,
      maxLossValue,
      hasUnlimitedProfit: false,
      hasUnlimitedLoss: false,
    };
  }

  
function calculateBreakevenPrices(dataPoints: number[][]): number[] {
  const breakEvenPrices: number[] = [];
  const epsilon = 0.0001;

  const pushUnique = (price: number) => {
    if (!Number.isFinite(price)) return;
    const exists = breakEvenPrices.some((p) => Math.abs(p - price) < 0.01);
    if (!exists) {
      breakEvenPrices.push(price);
    }
  };

  for (let i = 1; i < dataPoints.length; i++) {
    const [prevPrice, prevProfitLoss] = dataPoints[i - 1];
    const [currPrice, currProfitLoss] = dataPoints[i];

    if (Math.abs(prevProfitLoss) < epsilon) {
      pushUnique(prevPrice);
    }

    const hasSignChange =
      (prevProfitLoss < 0 && currProfitLoss >= 0) ||
      (prevProfitLoss > 0 && currProfitLoss <= 0);

    if (hasSignChange) {
      const priceDiff = currPrice - prevPrice;
      const profitDiff = currProfitLoss - prevProfitLoss;

      if (Math.abs(profitDiff) < epsilon) {
        pushUnique((prevPrice + currPrice) / 2);
      } else {
        const ratio = (0 - prevProfitLoss) / profitDiff;
        pushUnique(prevPrice + ratio * priceDiff);
      }
    }

    if (i === dataPoints.length - 1 && Math.abs(currProfitLoss) < epsilon) {
      pushUnique(currPrice);
    }
  }

  return breakEvenPrices.sort((a, b) => a - b);
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

    "Buy Share": (s: number, sharePrice: number, quantity: number) =>
      (s - sharePrice) * quantity,

    "Sell Share": (s: number, sharePrice: number, quantity: number) =>
      (sharePrice - s) * quantity,
  };

function plotData(userStrategy, currentStockPrice, expirationDate) {
    // Determine x-axis range based on current stock price and max leg strike
    if (!userStrategy || userStrategy.length === 0) {
      return null;
    }

    const strikeOrEntry = userStrategy
      .map((leg) => (leg?.legType === "Share" ? leg?.sharePrice : leg?.strike))
      .filter((value) => Number.isFinite(value));
    const maxReferencePrice =
      strikeOrEntry.length > 0
        ? Math.max(currentStockPrice, ...strikeOrEntry)
        : currentStockPrice;
    const xMin = 0;
    const xMax = Math.max(50, Math.floor(maxReferencePrice * 3));
    const step = 1; // Use finer step for more accurate breakeven detection

    // Cost of trade: positive for net debit, negative for net credit.
    let totalPremium = userStrategy.reduce((sum, leg) => {
      const quantity = leg.quantity || 0;
      const premium =
        leg?.legType === "Share"
          ? (leg.sharePrice || 0) * quantity
          : (leg.optionPrice || 0) * 100 * quantity;
      return sum + (leg.action === "Buy" ? premium : -premium);
    }, 0);

    // Compute the aggregated payoff at each underlying price
    const dataPoints = [];
    for (let s = xMin; s <= xMax; s += step) {
      let aggregatedPayoff = 0;
      userStrategy.forEach((leg) => {
        const quantity = leg.quantity || 0;
        const scenarioKey =
          leg?.legType === "Share"
            ? `${leg.action} Share`
            : `${leg.action} ${leg.optionType}`;
        if (payoffFunctions[scenarioKey]) {
          if (leg?.legType === "Share") {
            aggregatedPayoff += payoffFunctions[scenarioKey](
              s,
              leg.sharePrice || 0,
              quantity,
            );
          } else {
            const legPremium = (leg.optionPrice || 0) * 100 * quantity;
            aggregatedPayoff += payoffFunctions[scenarioKey](
              s,
              leg.strike,
              legPremium,
              quantity,
            );
          }
        } else {
          console.error(
            "Payoff function not implemented for scenario:",
            scenarioKey,
          );
        }
      });
      dataPoints.push([s, aggregatedPayoff]);
    }

    const metrics = calculateMetrics(dataPoints);
    let breakEvenPrices = calculateBreakevenPrices(dataPoints);

    // Cap breakeven prices - real strategies have at most ~5 breakevens.
    // Degenerate cases (e.g. buy+sell same option) produce near-zero payoff
    // across all prices, yielding hundreds of false breakevens.
    if (breakEvenPrices.length > 10) {
      breakEvenPrices = [];
    }

    // Calculate time to expiration and IV for probability/EV calculations
    const riskFreeRate = 0.05;
    const now = new Date();
    const expDate = new Date(expirationDate + "T16:00:00");
    const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
    const T = Math.max((expDate.getTime() - now.getTime()) / msPerYear, 0.001);
    const sigma = calculateStrategyIV(
      userStrategy,
      currentStockPrice,
      T,
      riskFreeRate,
    );

    // Calculate probabilities using Black-Scholes
    const probabilities = calculateProbabilities(
      userStrategy,
      currentStockPrice,
      breakEvenPrices,
      dataPoints,
      expirationDate
    );

    // Calculate Risk/Reward metrics
    const riskRewardMetrics = calculateRiskRewardMetrics(
      dataPoints,
      currentStockPrice,
      T,
      riskFreeRate,
      sigma,
      metrics.maxProfitValue,
      metrics.maxLossValue,
      metrics.hasUnlimitedProfit,
      metrics.hasUnlimitedLoss
    );

    // Calculate Position Greeks
    const positionGreeks = calculatePositionGreeks(
      userStrategy,
      currentStockPrice,
      T,
      riskFreeRate
    );

    return {metrics, breakEvenPrices, totalPremium, dataPoints, xMin, xMax, probabilities, riskRewardMetrics, positionGreeks};
  }


  onmessage = async (event) => {
  const { userStrategy, currentStockPrice, expirationDate, requestId } = event.data;
  try {
    const output = plotData(userStrategy, currentStockPrice, expirationDate);
    postMessage({ requestId, message: "success", output });
  } catch (error) {
    postMessage({
      requestId,
      message: "error",
      error:
        error instanceof Error
          ? error.message
          : "Failed to calculate options metrics.",
    });
  }
};

export {};
