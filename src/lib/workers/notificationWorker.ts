// lib/workers/test.ts

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
    const fastifyURL = data?.fastifyURL;
    const userId = data?.userId;
    try {
    
        const [notificationList] = await Promise.all([
            loadNotifications(fastifyURL, userId),
          ]);

    const numberOfUnreadNotification = notificationList?.length
    const hasUnreadElement = notificationList?.length !== 0 ? true : false;

    const output = {notificationList, hasUnreadElement, numberOfUnreadNotification}
    
    postMessage({ message: 'success', output});
    } catch(e) {
      postMessage({ message: 'error', e});
    }
    // Sending data back to the main thread
    //postMessage({ message: 'Data received in the worker', ticker, apiURL });
  };
  
  export {};