
// Picks the available strike closest to `targetFactor * anchor`, restricted by `predicate`.
// Falls back to the list extreme on the requested side, or the raw target if the list is empty.
const pickStrikeNear = (
  strikeList: number[],
  anchor: number,
  targetFactor: number,
  predicate: (s: number) => boolean,
  fallbackExtreme: "max" | "min",
): number => {
  const target = anchor * targetFactor;
  if (!strikeList || strikeList.length === 0) return target;
  const candidates = strikeList.filter(predicate);
  if (candidates.length === 0) {
    return fallbackExtreme === "max" ? Math.max(...strikeList) : Math.min(...strikeList);
  }
  return candidates.reduce(
    (closest, s) => (Math.abs(s - target) < Math.abs(closest - target) ? s : closest),
    candidates[0],
  );
};

const getStrategy =  (userStrategy, strikeList, selectedStrategy, selectedAction, selectedDate, selectedOptionPrice, selectedOptionType, selectedQuantity, selectedStrike) => {

 // Set appropriate option type and action based on strategy
    switch (selectedStrategy) {
      case "Long Call":
        selectedOptionType = "Call";
        selectedAction = "Buy";
        break;
      case "Short Call":
        selectedOptionType = "Call";
        selectedAction = "Sell";
        break;
      case "Long Put":
        selectedOptionType = "Put";
        selectedAction = "Buy";
        break;
      case "Short Put":
        selectedOptionType = "Put";
        selectedAction = "Sell";
        break;
      case "Cash Secured Put":
        selectedOptionType = "Put";
        selectedAction = "Sell";
        break;
      default:
        break;
    }
    if ("Bull Call Spread" === selectedStrategy) {
      // Find the lower strike first (for the Buy leg)
      const lowerStrike = selectedStrike;

      // Find a higher strike in the available strikeList for the Sell leg
      // First, calculate the target strike (40% higher)
      const targetHigherStrike = lowerStrike * 1.4;

      // Find the closest available strike price that is higher than the lower strike
      let higherStrike;
      if (strikeList && strikeList.length > 0) {
        // Filter strikes that are higher than the lower strike
        const higherStrikes = strikeList?.filter(
          (strike) => strike > lowerStrike,
        );

        if (higherStrikes.length > 0) {
          // Find the strike closest to our target from the available higher strikes
          higherStrike = higherStrikes?.reduce((closest, strike) => {
            return Math.abs(strike - targetHigherStrike) <
              Math.abs(closest - targetHigherStrike)
              ? strike
              : closest;
          }, higherStrikes[0]);
        } else {
          // If no higher strikes available, use the highest available strike
          higherStrike = Math.max(...strikeList);
        }
      } else {
        // Fallback if strikeList is empty
        higherStrike = lowerStrike * 1.4;
      }

      userStrategy = [
        {
          strike: lowerStrike,
          optionType: "Call",
          date: selectedDate,
          optionPrice: 0, // This will be updated when loadData() is called
          quantity: 1,
          action: "Buy",
        },
        {
          strike: higherStrike,
          optionType: "Call",
          optionPrice: 0, // This will be updated when loadData() is called
          date: selectedDate,
          quantity: 1,
          action: "Sell",
        },
      ];
    } else if (["Bull Put Spread"].includes(selectedStrategy)) {
      // Find the lower strike first (for the Buy leg)
      const lowerStrike = selectedStrike;

      // Find a higher strike in the available strikeList for the Sell leg
      // First, calculate the target strike (40% higher)
      const targetHigherStrike = lowerStrike * 1.4;

      // Find the closest available strike price that is higher than the lower strike
      let higherStrike;
      if (strikeList && strikeList.length > 0) {
        // Filter strikes that are higher than the lower strike
        const higherStrikes = strikeList?.filter(
          (strike) => strike > lowerStrike,
        );

        if (higherStrikes.length > 0) {
          // Find the strike closest to our target from the available higher strikes
          higherStrike = higherStrikes?.reduce((closest, strike) => {
            return Math.abs(strike - targetHigherStrike) <
              Math.abs(closest - targetHigherStrike)
              ? strike
              : closest;
          }, higherStrikes[0]);
        } else {
          // If no higher strikes available, use the highest available strike
          higherStrike = Math.max(...strikeList);
        }
      } else {
        // Fallback if strikeList is empty
        higherStrike = lowerStrike * 1.4;
      }

      userStrategy = [
        {
          strike: higherStrike,
          optionType: "Put",
          date: selectedDate,
          optionPrice: 0, // This will be updated when loadData() is called
          quantity: 1,
          action: "Sell",
        },
        {
          strike: lowerStrike,
          optionType: "Put",
          optionPrice: 0, // This will be updated when loadData() is called
          date: selectedDate,
          quantity: 1,
          action: "Buy",
        },
      ];
    } else if (["Bear Call Spread"].includes(selectedStrategy)) {
      // Find the lower strike first (for the Buy leg)
      const lowerStrike = selectedStrike;

      // Find a higher strike in the available strikeList for the Sell leg
      // First, calculate the target strike (40% higher)
      const targetHigherStrike = lowerStrike * 1.4;

      // Find the closest available strike price that is higher than the lower strike
      let higherStrike;
      if (strikeList && strikeList.length > 0) {
        // Filter strikes that are higher than the lower strike
        const higherStrikes = strikeList?.filter(
          (strike) => strike > lowerStrike,
        );

        if (higherStrikes.length > 0) {
          // Find the strike closest to our target from the available higher strikes
          higherStrike = higherStrikes?.reduce((closest, strike) => {
            return Math.abs(strike - targetHigherStrike) <
              Math.abs(closest - targetHigherStrike)
              ? strike
              : closest;
          }, higherStrikes[0]);
        } else {
          // If no higher strikes available, use the highest available strike
          higherStrike = Math.max(...strikeList);
        }
      } else {
        // Fallback if strikeList is empty
        higherStrike = lowerStrike * 1.4;
      }

      userStrategy = [
        {
          strike: lowerStrike,
          optionType: "Call",
          date: selectedDate,
          optionPrice: 0, // This will be updated when loadData() is called
          quantity: 1,
          action: "Sell",
        },
        {
          strike: higherStrike,
          optionType: "Call",
          optionPrice: 0, // This will be updated when loadData() is called
          date: selectedDate,
          quantity: 1,
          action: "Buy",
        },
      ];
    } else if ("Bear Put Spread" === selectedStrategy) {
      // Find the lower strike first (for the Buy leg)
      const lowerStrike = selectedStrike;

      // Find a higher strike in the available strikeList for the Sell leg
      // First, calculate the target strike (40% higher)
      const targetHigherStrike = lowerStrike * 1.4;

      // Find the closest available strike price that is higher than the lower strike
      let higherStrike;
      if (strikeList && strikeList.length > 0) {
        // Filter strikes that are higher than the lower strike
        const higherStrikes = strikeList?.filter(
          (strike) => strike > lowerStrike,
        );

        if (higherStrikes.length > 0) {
          // Find the strike closest to our target from the available higher strikes
          higherStrike = higherStrikes?.reduce((closest, strike) => {
            return Math.abs(strike - targetHigherStrike) <
              Math.abs(closest - targetHigherStrike)
              ? strike
              : closest;
          }, higherStrikes[0]);
        } else {
          // If no higher strikes available, use the highest available strike
          higherStrike = Math.max(...strikeList);
        }
      } else {
        // Fallback if strikeList is empty
        higherStrike = lowerStrike * 1.4;
      }

      userStrategy = [
        {
          strike: higherStrike,
          optionType: "Put",
          date: selectedDate,
          optionPrice: 0, // This will be updated when loadData() is called
          quantity: 1,
          action: "Buy",
        },
        {
          strike: lowerStrike,
          optionType: "Put",
          optionPrice: 0, // This will be updated when loadData() is called
          date: selectedDate,
          quantity: 1,
          action: "Sell",
        },
      ];
    } else if ("Long Straddle" === selectedStrategy) {
      userStrategy = [
        {
          strike: selectedStrike,
          optionType: "Call",
          date: selectedDate,
          optionPrice: 0,
          quantity: 1,
          action: "Buy",
        },
        {
          strike: selectedStrike,
          optionType: "Put",
          optionPrice: 0,
          date: selectedDate,
          quantity: 1,
          action: "Buy",
        },
      ];
    } else if ("Short Straddle" === selectedStrategy) {
      userStrategy = [
        {
          strike: selectedStrike,
          optionType: "Call",
          date: selectedDate,
          optionPrice: 0,
          quantity: 1,
          action: "Sell",
        },
        {
          strike: selectedStrike,
          optionType: "Put",
          optionPrice: 0,
          date: selectedDate,
          quantity: 1,
          action: "Sell",
        },
      ];
    } else if ("Long Call Butterfly" === selectedStrategy) {
      const lowerStrike = selectedStrike;

      // Define target values relative to the lower strike
      const targetMidStrike = lowerStrike * 1.1;
      const targetHigherStrike = lowerStrike * 1.2;

      // Initialize the strike values that will be used in the strategy
      let higherStrike;
      let midStrike;

      if (strikeList && strikeList.length > 0) {
        // Filter strikes that are higher than the lower strike
        const higherStrikes = strikeList.filter(
          (strike) => strike > lowerStrike,
        );

        // Determine the higher strike leg:
        if (higherStrikes.length > 0) {
          // Choose the strike closest to our targetHigherStrike
          higherStrike = higherStrikes.reduce((closest, strike) => {
            return Math.abs(strike - targetHigherStrike) <
              Math.abs(closest - targetHigherStrike)
              ? strike
              : closest;
          }, higherStrikes[0]);
        } else {
          // If no higher strikes are available, fallback to using the highest strike from the list
          higherStrike = Math.max(...strikeList);
        }

        // For the mid strike, filter strikes that lie between the lowerStrike and the higherStrike
        const midStrikes = strikeList.filter(
          (strike) => strike > lowerStrike && strike < higherStrike,
        );

        // Determine the mid strike leg:
        if (midStrikes.length > 0) {
          // Choose the strike closest to our targetMidStrike
          midStrike = midStrikes.reduce((closest, strike) => {
            return Math.abs(strike - targetMidStrike) <
              Math.abs(closest - targetMidStrike)
              ? strike
              : closest;
          }, midStrikes[0]);
        } else {
          // Fallback if no strike exists in between: you could use the target or any other logic.
          midStrike = lowerStrike * 1.1;
        }
      } else {
        // Fallback if strikeList is empty
        higherStrike = lowerStrike * 1.2;
        midStrike = lowerStrike * 1.1;
      }

      // Build the trading strategy for a Long Call Butterfly
      userStrategy = [
        {
          strike: higherStrike,
          optionType: "Call",
          date: selectedDate,
          optionPrice: 0,
          quantity: 1,
          action: "Buy",
        },
        {
          strike: midStrike,
          optionType: "Call",
          date: selectedDate,
          optionPrice: 0,
          quantity: 2,
          action: "Sell",
        },
        {
          strike: lowerStrike,
          optionType: "Call",
          date: selectedDate,
          optionPrice: 0,
          quantity: 1,
          action: "Buy",
        },
      ];
    } else if ("Iron Condor" === selectedStrategy) {
      const anchor = selectedStrike;
      const shortPutStrike  = pickStrikeNear(strikeList, anchor, 0.95, (s) => s < anchor,        "min");
      const longPutStrike   = pickStrikeNear(strikeList, anchor, 0.90, (s) => s < shortPutStrike, "min");
      const shortCallStrike = pickStrikeNear(strikeList, anchor, 1.05, (s) => s > anchor,        "max");
      const longCallStrike  = pickStrikeNear(strikeList, anchor, 1.10, (s) => s > shortCallStrike, "max");

      userStrategy = [
        { strike: longPutStrike,   optionType: "Put",  date: selectedDate, optionPrice: 0, quantity: 1, action: "Buy"  },
        { strike: shortPutStrike,  optionType: "Put",  date: selectedDate, optionPrice: 0, quantity: 1, action: "Sell" },
        { strike: shortCallStrike, optionType: "Call", date: selectedDate, optionPrice: 0, quantity: 1, action: "Sell" },
        { strike: longCallStrike,  optionType: "Call", date: selectedDate, optionPrice: 0, quantity: 1, action: "Buy"  },
      ];
    } else if ("Iron Butterfly" === selectedStrategy) {
      const anchor = selectedStrike;
      const longPutStrike  = pickStrikeNear(strikeList, anchor, 0.90, (s) => s < anchor, "min");
      const longCallStrike = pickStrikeNear(strikeList, anchor, 1.10, (s) => s > anchor, "max");

      userStrategy = [
        { strike: longPutStrike,  optionType: "Put",  date: selectedDate, optionPrice: 0, quantity: 1, action: "Buy"  },
        { strike: anchor,         optionType: "Put",  date: selectedDate, optionPrice: 0, quantity: 1, action: "Sell" },
        { strike: anchor,         optionType: "Call", date: selectedDate, optionPrice: 0, quantity: 1, action: "Sell" },
        { strike: longCallStrike, optionType: "Call", date: selectedDate, optionPrice: 0, quantity: 1, action: "Buy"  },
      ];
    } else {
      userStrategy = [
        {
          strike: selectedStrike,
          optionType: selectedOptionType,
          date: selectedDate,
          optionPrice: selectedOptionPrice,
          quantity: selectedQuantity,
          action: selectedAction,
        },
      ];
    }

  return userStrategy;
};

onmessage = async (event) => {
  const {
    userStrategy,
    strikeList,
    selectedStrategy,
    selectedAction,
    selectedDate,
    selectedOptionPrice,
    selectedOptionType,
    selectedQuantity,
    selectedStrike,
    requestId,
  } = event.data;

  try {
    const output = getStrategy(
      userStrategy,
      strikeList,
      selectedStrategy,
      selectedAction,
      selectedDate,
      selectedOptionPrice,
      selectedOptionType,
      selectedQuantity,
      selectedStrike,
    );
    postMessage({ requestId, message: "success", output });
  } catch (error) {
    postMessage({
      requestId,
      message: "error",
      error:
        error instanceof Error ? error.message : "Failed to update strategy.",
    });
  }
};

export {};
