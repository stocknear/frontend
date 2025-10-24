/**
 * Portfolio Worker - Efficiently calculates portfolio metrics
 * Calculates: Profit/Loss, Total Return %, Today P&L, and Weight
 */

interface PortfolioItem {
  symbol: string;
  price: string | number;
  shares: string | number;
  avgPrice: string | number;
  changesPercentage: string | number;
  profitLoss?: number | null;
  totalReturn?: number | null;
  todayReturn?: number | null;
  weight?: number | null;
  [key: string]: unknown;
}

interface WorkerMessage {
  data: PortfolioItem[];
}

interface WorkerResponse {
  message: string;
  data: PortfolioItem[];
}

/**
 * Calculate portfolio metrics for each item
 */
function calculatePortfolioMetrics(data: PortfolioItem[]): PortfolioItem[] {
  if (!Array?.isArray(data) || data?.length === 0) {
    return data;
  }

  // First pass: Calculate individual metrics (profit/loss, total return, today return)
  const processedData = data?.map((row) => {
    const avgPrice = parseFloat(String(row.avgPrice)) || 0;
    const shares = parseFloat(String(row.shares)) || 0;
    const currentPrice = parseFloat(String(row.price)) || 0;
    const changesPercentage = parseFloat(String(row.changesPercentage)) || 0;

    // Create a new object to avoid mutating the original
    const updatedRow = { ...row };

    if (shares > 0) {
      // Calculate Today P&L (dollar amount): (changesPercentage / 100) * currentPrice * shares
      const todayPL = (changesPercentage / 100) * currentPrice * shares;
      updatedRow.todayReturn = Math?.round(todayPL * 100) / 100; // Round to 2 decimal places

      // Only calculate profit/loss and total return if avgPrice is provided
      if (avgPrice > 0) {
        // Calculate Profit/Loss: (current price - avg price) * shares
        const profitLoss = (currentPrice - avgPrice) * shares;
        updatedRow.profitLoss = Math?.round(profitLoss * 100) / 100; // Round to 2 decimal places

        // Calculate Total Return %: ((current price - avg price) / avg price) * 100
        const totalReturn = ((currentPrice - avgPrice) / avgPrice) * 100;
        updatedRow.totalReturn = Math?.round(totalReturn * 100) / 100; // Round to 2 decimal places
      } else {
        updatedRow.profitLoss = null;
        updatedRow.totalReturn = null;
      }
    } else {
      updatedRow.profitLoss = null;
      updatedRow.totalReturn = null;
      updatedRow.todayReturn = null;
    }

    return updatedRow;
  });

  // Second pass: Calculate total portfolio value for weight calculation
  let totalValue = 0;
  processedData?.forEach((item) => {
    const price = parseFloat(String(item.price)) || 0;
    const shares = parseFloat(String(item.shares)) || 0;
    totalValue += price * shares;
  });

  // Third pass: Calculate and assign weights
  if (totalValue > 0) {
    processedData?.forEach((item) => {
      const price = parseFloat(String(item.price)) || 0;
      const shares = parseFloat(String(item.shares)) || 0;
      if (shares > 0) {
        const positionValue = price * shares;
        item.weight = (positionValue / totalValue) * 100;
      } else {
        item.weight = null;
      }
    });
  } else {
    processedData?.forEach((item) => {
      item.weight = null;
    });
  }

  return processedData;
}

// Listen for messages from the main thread
onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { data } = event.data || {};

  try {
    // Calculate all portfolio metrics
    const calculatedData = calculatePortfolioMetrics(data);

    // Send the result back to the main thread
    postMessage({
      message: "success",
      data: calculatedData,
    } as WorkerResponse);
  } catch (error) {
    console.error("Portfolio worker error:", error);
    postMessage({
      message: "error",
      data: data,
    } as WorkerResponse);
  }
};

export {};
