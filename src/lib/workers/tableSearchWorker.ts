import { compareTwoStrings } from "string-similarity";

onmessage = (event: MessageEvent) => {
  const rawData = event.data?.rawData;
  const filterQueryRaw = event.data?.inputValue;


  if (!rawData || !filterQueryRaw) {
    postMessage({ message: "success", output: [] });
    return;
  }

  const filterQuery = filterQueryRaw.toLowerCase();
  const similarityThreshold = 0.8;

  const output = [];
  for (let i = 0; i < rawData.length; i++) {
    const item = rawData[i];
    const name = item?.name?.toLowerCase() || item?.assetDescription?.toLowerCase() || "";
    const symbol = item?.symbol?.toLowerCase() || item?.ticker?.toLowerCase() || "";
    const representative = item?.representative?.toLowerCase()?.replace("_", " ") || "";
    
    // Handle symbolList array if it exists
    const symbolList = item?.symbolList || [];
    const symbolListLower = symbolList.map((s: string) => s?.toLowerCase() || "");

    // Fast includes check (cheap)
    if (name.includes(filterQuery) || symbol.includes(filterQuery) || representative.includes(filterQuery)) {
      output.push(item);
      continue;
    }
    
    // Check symbolList array
    if (symbolListLower.some((s: string) => s.includes(filterQuery))) {
      output.push(item);
      continue;
    }

    // Fuzzy check (expensive) - fallback only if necessary
    const nameSim = compareTwoStrings(name, filterQuery);
    const symbolSim = compareTwoStrings(symbol, filterQuery);
    const representativeSim = compareTwoStrings(representative, filterQuery);
    
    // Check fuzzy match for symbolList
    let symbolListMatch = false;
    for (const sym of symbolListLower) {
      if (sym && compareTwoStrings(sym, filterQuery) > similarityThreshold) {
        symbolListMatch = true;
        break;
      }
    }

    if (nameSim > similarityThreshold || symbolSim > similarityThreshold || representativeSim > similarityThreshold || symbolListMatch) {
      output.push(item);
    }
  }

  postMessage({ message: "success", output });
};

export {};
