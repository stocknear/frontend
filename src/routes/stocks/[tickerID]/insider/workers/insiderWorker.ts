function findLatestDateInPast(data) {
  if (!data || !Array?.isArray(data) || data?.length === 0) {
    return null;
  }

  let latestDate = new Date(data?.at(0)?.transactionDate);

  for (let i = 1; i < data?.length; i++) {
    const currentDate = new Date(data[i]?.transactionDate);
    const currentTransactionDate = currentDate.getDate();
    const currentTransactionDay = currentDate.getDay(); // Sunday is 0, Monday is 1, ..., Saturday is 6

    // If the current date is a weekday, reduce it by one month
    if (currentTransactionDay !== 0 && currentTransactionDay !== 6) {
      currentDate.setMonth(currentDate.getMonth() - 1);
    }

    if (currentDate < latestDate) {
      latestDate = currentDate;
    }
  }

  return latestDate?.toISOString()?.split('T')?.at(0); // Format to yyyy-mm-dd
}


function getBarChart(data, dates) {
  let soldList = Array(dates?.length)?.fill(0);
  let boughtList = Array(dates?.length)?.fill(0);
  let grantList = Array(dates?.length)?.fill(0);
  let exerciseList = Array(dates?.length)?.fill(0);
  
  // Group transactions by date and transaction type
  const groupedTransactions = {};
  data?.forEach(item => {
    const { transactionDate, securitiesTransacted, transactionType } = item;
    const key = `${transactionDate}_${transactionType}`;
    
    if (!groupedTransactions[key]) {
      groupedTransactions[key] = 0;
    }
    
    // Update transaction type specific lists
    if (transactionType === "Sold") {
      soldList[dates?.indexOf(transactionDate)] -= securitiesTransacted;
    } else if (transactionType === 'Bought') {
      boughtList[dates?.indexOf(transactionDate)] += securitiesTransacted;
    } else if (transactionType === 'Grant') {
      grantList[dates?.indexOf(transactionDate)] += securitiesTransacted;
    } else if (transactionType === 'Exercise') {
      exerciseList[dates?.indexOf(transactionDate)] += securitiesTransacted;
    }
  });
  
  return { sold: soldList, bought: boughtList, grant: grantList, exercise: exerciseList };
}



  
onmessage = async (event: MessageEvent) => {
  const data = event.data?.message;
  const rawData = data?.sort((a, b) => new Date(b?.transactionDate) - new Date(a?.transactionDate))
  const latestDate = findLatestDateInPast(rawData);

  let historicalPrice = event.data?.historicalPrice?.filter(item => new Date(item?.time) >= new Date(latestDate));

  const dataPoints =  historicalPrice?.map(({ close }) => (close ))
  const dates = historicalPrice?.map(({ time }) => ( time ))
  const barChartData = getBarChart(rawData, dates)

  let finalData = { rawData, dataPoints, dates, barChartData};
  postMessage({ message: 'success', finalData});

  // Sending data back to the main thread
  //postMessage({ message: 'Data received in the worker', ticker, apiURL });
};

export {};
    