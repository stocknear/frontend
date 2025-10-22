// filterWorker.ts

/**
 * Web Worker message handler that filters incoming data based on party affiliation.
 * filterList can include "Republican", "Democratic", or both (or be empty to return all).
 */
onmessage = async (event: MessageEvent) => {
  // Destructure with defaults
  const { rawData = [], filterList = [] }: { rawData?: any[]; filterList?: string[] } = event.data;
    let output = []  
    
  if (filterList?.length === 0) return postMessage({ message: 'success', output });;

  // Ensure rawData is an array
  if (!Array.isArray(rawData)) {
    output = [];
  } 
  // If no filters provided, return all
  else if (filterList.length === 0) {
    output = rawData;
  } 
  // Otherwise filter by parties in filterList
  else {
    const filterSet = new Set(filterList?.map(String));
    output = rawData?.filter(
      item =>
        item &&
        typeof item.transactionType === 'string' &&
        filterSet.has(item.transactionType)
    );
  }

  // Post the filtered result back
  postMessage({ message: 'success', output });
};

export {};