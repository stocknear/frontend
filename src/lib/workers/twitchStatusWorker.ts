async function loadTwitchStatus(fastifyURL:string,) {
    // make the GET request to the endpoint
    const response = await fetch(fastifyURL+'/get-twitch-status', {
      method: 'GET',
      headers: {
          "Content-Type": "application/json","X-API-KEY": apiKey
      },
    });
  
    const output = (await response.json())?.items;
    return output;
  }



  onmessage = async (event: MessageEvent) => {
    const data = event.data?.message;
    const fastifyURL = data?.fastifyURL;
    try {
    
        const twitchStatus = await loadTwitchStatus(fastifyURL);
        const output = {twitchStatus};
    
    postMessage({ message: 'success', output});
    } catch(e) {
      postMessage({ message: 'error', e});
    }
    // Sending data back to the main thread
    //postMessage({ message: 'Data received in the worker', ticker, apiURL });
  };
  
  export {};