
onmessage = async (event: MessageEvent) => {
  const rawData = event.data?.rawData;
  const filterList = event.data?.filterList;
  const output =  rawData?.map(subArray =>
    subArray?.filter(item => filterList?.includes(item?.country))
  );

  let finalData = { output};
  postMessage({ message: 'success', finalData});

  // Sending data back to the main thread
  //postMessage({ message: 'Data received in the worker', ticker, apiURL });
};

export {};
    