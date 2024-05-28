import { compareTwoStrings } from 'string-similarity';



onmessage = async (event: MessageEvent) => {
    const rawData = event.data?.rawData;
    const filterQuery = event.data?.filterQuery;

    const output = rawData?.filter(item => {
        const name = item?.name?.toLowerCase();
        // Check if name includes filterQuery
        if (name?.includes(filterQuery)) return true;
        
        // Implement fuzzy search by checking similarity
        // You can adjust the threshold as needed
        const similarityThreshold = 0.5;
        const similarity = compareTwoStrings(name, filterQuery);
        return similarity > similarityThreshold;
    });

    postMessage({ message: 'success', output});
  
    // Sending data back to the main thread
    //postMessage({ message: 'Data received in the worker', ticker, apiURL });
  };
  
  export {};
      