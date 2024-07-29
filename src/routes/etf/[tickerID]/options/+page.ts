import { getCache, setCache } from '$lib/store';


function daysLeft(targetDate) {
  const targetTime = new Date(targetDate).getTime();
  const currentTime = new Date().getTime();
  const difference = targetTime - currentTime;
  
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math?.ceil(difference / millisecondsPerDay);
  
  return daysLeft;
}


export const load = async ({ parent, params }) => {

  const {apiKey, apiURL} = await parent();

  const getOptionsPlotData = async () => {
    let res;

    const cachedData = getCache(params.tickerID, 'getOptionsPlotData');
    if (cachedData) {
      res = cachedData;
    } else {

    const postData = {
      ticker: params.tickerID
    };

    const response = await fetch(apiURL + '/options-plot-ticker', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData)
      });

    const output = await response.json();

    const totalCallVolume = output?.reduce((acc, obj) => acc + obj?.CALL?.volume, 0);
    const totalPutVolume = output?.reduce((acc, obj) => acc + obj?.PUT?.volume, 0);
    const putCallRatio = (totalPutVolume/totalCallVolume)?.toFixed(2);

    const totalVolume = output?.reduce((acc, obj) => {
      // Summing volume from both CALL and PUT
      return acc + obj?.CALL?.volume + obj?.PUT?.volume;
    }, 0);
    
    const totalOpenInterest = output?.reduce((acc, obj) => {
      // Summing volume from both CALL and PUT
      return acc + obj?.CALL?.open_interest + obj?.PUT?.open_interest;
    }, 0);


    // Summing the total open interest of CALL and PUT options
    const totalCallOpenInterest = output?.reduce((acc, obj) => acc + obj?.CALL.open_interest, 0);
    const totalPutOpenInterest = output?.reduce((acc, obj) => acc + obj?.PUT.open_interest, 0);

    // Computing the put-call ratio for open interest
    const putCallOpenInterestRatio = (totalPutOpenInterest / totalCallOpenInterest)?.toFixed(2);
    
    //Plot Data
    const dateList = output?.map(item => item.date);
    const callVolumeList = output?.map(item => item?.CALL?.volume);
    const putVolumeList = output?.map(item => item?.PUT?.volume);
    const callOpenInterestList = output?.map(item => item?.CALL?.open_interest);
    const putOpenInterestList = output?.map(item => item?.PUT?.open_interest);

    res = {plot: output, 'dateList': dateList, 'callOpenInterestList': callOpenInterestList, 'putOpenInterestList': putOpenInterestList, 'callVolumeList': callVolumeList, 'putVolumeList': putVolumeList, 'putCallRatio': putCallRatio, 'putCallOpenInterestRatio': putCallOpenInterestRatio,'totalVolume': totalVolume, 'totalOpenInterest': totalOpenInterest };
    setCache(params.tickerID, res, 'getOptionsPlotData');

    }

    return res;

  };

  const getOptionsFlowData = async () => {
  
    let output;
    const cachedData = getCache(params.tickerID, 'getOptionsFlowData');
    if (cachedData) {
      output = cachedData;
    } else {

    const postData = {
      ticker: params.tickerID
    };

      // make the POST request to the endpoint
      const response = await fetch(apiURL + '/options-flow-ticker', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json", "X-API-KEY": apiKey
        },
        body: JSON.stringify(postData)
      });

    output = await response.json();

    output?.forEach(item => {
      item.dte = daysLeft(item?.date_expiration);
    });
  
    setCache(params.tickerID, output, 'getOptionsFlowData');
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getOptionsPlotData: await getOptionsPlotData(),
    getOptionsFlowData: await getOptionsFlowData()
  };

};
