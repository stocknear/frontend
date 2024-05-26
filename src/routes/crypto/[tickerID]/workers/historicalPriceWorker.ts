// lib/workers/test.ts


async function getOneDayPrice(ticker: string, apiURL:string) {

  let oneDayPrice = [];

  try {
    const postData = { ticker: ticker };
    const response = await fetch(apiURL + '/one-day-price', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });

    oneDayPrice = await response.json();

    oneDayPrice = oneDayPrice?.map(item => ({ time: Date.parse(item?.time), open: item?.open !== null ? item?.open : NaN, high: item?.high !== null ? item?.high : NaN, low: item?.low !== null ? item?.low : NaN, close: item?.close !== null ? item?.close : NaN}));

    // Set worker status to finished and send chart data
    return oneDayPrice
  } catch (error) {
    // Set worker status to idle and send error message
    return oneDayPrice;
  }
}


async function getHistoricalPrice(ticker: string, apiURL:string) {

  let oneWeekPrice;
  let oneMonthPrice;
  let sixMonthPrice;
  let oneYearPrice;
  let threeYearPrice;

  try {
    const postData = { ticker: ticker };
    const response = await fetch(apiURL + '/historical-price', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });

    const pastPriceList = await response.json();

    oneWeekPrice = pastPriceList['1W']?.map(({ time, open, high, low, close }) => ({ time: Date.parse(time), open, high, low, close }));
    oneMonthPrice = pastPriceList['1M']?.map(({ time, open, high, low, close }) => ({ time: Date.parse(time), open, high, low, close }));
    sixMonthPrice = pastPriceList['6M']?.map(({ time, open, high, low, close }) => ({ time: Date.parse(time), open, high, low, close }));
    oneYearPrice = pastPriceList['1Y']?.map(({ time, open, high, low, close }) => ({ time: Date.parse(time), open, high, low, close }));
    threeYearPrice = pastPriceList['MAX']?.map(({ time, open, high, low, close }) => ({ time: Date.parse(time), open, high, low, close }));

    // Set worker status to finished and send chart data
    return { oneWeekPrice, oneMonthPrice, sixMonthPrice, oneYearPrice, threeYearPrice, pastPriceList};
  } catch (error) {
    // Set worker status to idle and send error message
    return {};
  }
}


onmessage = async (event: MessageEvent) => {
  const ticker = event.data?.message?.ticker;
  const apiURL = event.data?.message?.apiURL;
  //console.log(ticker, apiURL);
  try {


    const [output, oneDayPrice] = await Promise.all([
      getHistoricalPrice(ticker, apiURL),
      getOneDayPrice(ticker, apiURL)
    ]);
    
    const oneWeekPrice = output?.oneWeekPrice;
    const oneMonthPrice = output?.oneMonthPrice;
    const sixMonthPrice = output?.sixMonthPrice;
    const oneYearPrice = output?.oneYearPrice;
    const threeYearPrice = output?.threeYearPrice;
    const pastPriceList = output?.pastPriceList

    const chartData = {oneDayPrice, oneWeekPrice, oneMonthPrice, sixMonthPrice, oneYearPrice, threeYearPrice, pastPriceList}
    //console.log(pastPriceList)
    postMessage({ message: 'success', chartData});
  } catch(e) {
    postMessage({ message: 'error', e});
  }
  // Sending data back to the main thread
  //postMessage({ message: 'Data received in the worker'});
};

export {};
