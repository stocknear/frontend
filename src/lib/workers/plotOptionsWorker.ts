// src/lib/workers/plotOptionsWorker.ts
import { abbreviateNumber, removeCompanyStrings } from '../utils';
import { mode } from 'mode-watcher';

interface DataItem {
  date: string;
  totalVolume?: number;
  shortVolume?: number;
  shortPercent?: number;
  // …other fields you need for computeWithLongVolume & addChangesPercentage
}

interface MessageIn {
  rawData: DataItem[];
  displayCompanyName: string;
}

self.onmessage = (e: MessageEvent<MessageIn>) => {
  const { rawData, displayCompanyName } = e.data;

  // copy & paste your helper fns: computeWithLongVolume, addChangesPercentage,
  // findMonthlyValue, etc., here, but remove imports/UI logic

  // …preprocess rawData, sort, compute volumes…
  const sorted = [...rawData].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  // call your helpers, build dates, totalVolumeList, shortVolumeList…

  // Finally build the options object exactly like in getPlotOptions,
  // but without using any Svelte stores directly—pass mode as a string
  const options = { /* …all your highcharts config…*/ };

  // send it back
  self.postMessage(options);
};
