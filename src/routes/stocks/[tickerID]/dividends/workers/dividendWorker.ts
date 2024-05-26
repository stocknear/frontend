// lib/workers/test.ts
const sortDividendsByDate = (dividends) => {
  return dividends.sort(function(a, b) {
    return new Date(a?.date) - new Date(b?.date);
  });
}

function plotDividend(stockDividends) {
        
  let dateList = [];
  let dividendList = [];
  let growthList = [];
  let copyData = structuredClone(stockDividends);
  const reverseData = sortDividendsByDate(copyData);

  for (let i = 0; i < reverseData?.length; i++) {
      const currentDividend = reverseData[i]?.dividend;
      const previousDividend = i === 0 ? 0 : reverseData[i - 1]?.dividend;

      dateList.push(reverseData[i]?.paymentDate);
      dividendList?.push(currentDividend);


      if (currentDividend !== null && previousDividend !== null && previousDividend !== 0) {
          const growthRate = (((currentDividend - previousDividend) / previousDividend) * 100 )?.toFixed(2);
          growthList?.push(growthRate);
      } else {
          growthList?.push(0); // Pushing null if the growth calculation is not possible
      }

      
  }

    return {dividendList, growthList, dateList};
}

  onmessage = async (event: MessageEvent) => {
    const data = event.data?.message;
    const stockDividends = data?.at(0);
    const eps = data?.at(1);
    const currentPrice = data?.at(2);
  
    const payoutFrequency =  stockDividends?.filter(entry => entry.date.includes('2022'))?.length;
    const amount = stockDividends[0]?.adjDividend;
    const annualDividend = (amount * payoutFrequency)?.toFixed(2)
    const dividendYield = ((annualDividend / currentPrice )*100)?.toFixed(2)
    const exDividendDate = stockDividends[0]?.date
    const payoutRatio = ((1 - ( eps - annualDividend)/eps)*100)?.toFixed(2)

    const previousIndex = stockDividends?.findIndex(entry => entry.date.includes('2022'));

    const previousAnnualDividend = stockDividends[previousIndex]?.adjDividend * payoutFrequency;

    const dividendGrowth= (( (annualDividend - previousAnnualDividend) / previousAnnualDividend ) *100)?.toFixed(2);

    const {dividendList, growthList, dateList} = plotDividend(stockDividends)
    
    //Check if the last dividend is older than 12 months
    const dateDistance = new Date(stockDividends?.at(0)?.date) < new Date(new Date().setFullYear(new Date().getFullYear() - 1)) ? true : false;
    
    let finalData = { annualDividend, payoutFrequency, exDividendDate, dividendYield, dividendGrowth, payoutRatio , dateDistance, dividendList, growthList, dateList};
    postMessage({ message: 'success', finalData});

    // Sending data back to the main thread
    //postMessage({ message: 'Data received in the worker', ticker, apiURL });
  };
  
  export {};
  