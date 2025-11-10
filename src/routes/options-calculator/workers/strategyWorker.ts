
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
  const { userStrategy, strikeList, selectedStrategy, selectedAction, selectedDate, selectedOptionPrice, selectedOptionType, selectedQuantity, selectedStrike } = event.data;
  const output = getStrategy(userStrategy, strikeList, selectedStrategy, selectedAction, selectedDate, selectedOptionPrice, selectedOptionType, selectedQuantity, selectedStrike);

   
  postMessage({ message: "success", output });
};

export {};
