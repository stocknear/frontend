
onmessage = async (event: MessageEvent) => {
  const rawData = event.data?.rawData;
  const filterQuery = event.data?.filterQuery;
  
  const output = rawData?.filter(item => item?.name?.toLowerCase()?.includes(filterQuery?.toLowerCase()));

  let finalData = { output};
  postMessage({ message: 'success', finalData});

  // Sending data back to the main thread
  //postMessage({ message: 'Data received in the worker', ticker, apiURL });
};

export {};
    