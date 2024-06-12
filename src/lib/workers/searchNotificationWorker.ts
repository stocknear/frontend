// lib/workers/test.ts

async function loadSearchData(apiURL:string) {
    try {

      const response = await fetch(apiURL + '/searchbar-data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      const output = await response.json();
  
      // Set worker status to finished and send chart data
      return output;

    } catch (error) {
      // Set worker status to idle and send error message
      return [];
    }
  }
  
async function loadNotifications(fastifyURL:string, userId:string) {

    const postData = {'userId': userId};

    const response = await fetch(fastifyURL+'/get-notifications', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
    });

    const output  = (await response.json())?.items;
    return output
}

  onmessage = async (event: MessageEvent) => {
    const data = event.data?.message;
    const apiURL = data?.apiURL;
    const fastifyURL = data?.fastifyURL;
    const userId = data?.userId;
    //console.log(ticker, apiURL);
    try {
    
        const [searchBarData, notificationList] = await Promise.all([
            loadSearchData(apiURL),
            loadNotifications(fastifyURL, userId),
          ]);

    const unreadNotificationList = notificationList?.filter(item => item?.readed === false);
    const hasUnreadElement = notificationList?.some(item => item?.readed === false);
    const numberOfUnreadNotification = notificationList?.filter(item => item?.readed === false)?.length;

    const output = {searchBarData, notificationList, hasUnreadElement, numberOfUnreadNotification, unreadNotificationList}
    
    postMessage({ message: 'success', output});
    } catch(e) {
      postMessage({ message: 'error', e});
    }
    // Sending data back to the main thread
    //postMessage({ message: 'Data received in the worker', ticker, apiURL });
  };
  
  export {};