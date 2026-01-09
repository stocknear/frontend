import type { KLineData } from "klinecharts";

type IndicatorComputeRequest = {
  id: number;
  type: "compute";
  indicator: string;
  params: number[];
  datasetId: string;
};

type IndicatorComputeResponse = {
  id: number;
  ok: boolean;
  result?: unknown[];
  error?: string;
};

type IndicatorDataReady = {
  type: "dataReady";
  datasetId: string;
};

type WorkerMessage = IndicatorComputeResponse | IndicatorDataReady;

type WorkerDataPayload = {
  timestamp: Float64Array;
  open: Float64Array;
  high: Float64Array;
  low: Float64Array;
  close: Float64Array;
  volume: Float64Array;
};

const DEFAULT_DATASET_ID = "empty";

const buildDatasetSignature = (data: KLineData[]) => {
  if (!data.length) return DEFAULT_DATASET_ID;
  const first = data[0];
  const last = data[data.length - 1];
  const firstStamp =
    typeof first?.timestamp === "number" ? first.timestamp : 0;
  const lastStamp = typeof last?.timestamp === "number" ? last.timestamp : 0;
  const lastClose = typeof last?.close === "number" ? last.close : 0;
  const lastHigh = typeof last?.high === "number" ? last.high : 0;
  const lastLow = typeof last?.low === "number" ? last.low : 0;
  const lastVolume = typeof last?.volume === "number" ? last.volume : 0;
  return `${data.length}:${firstStamp}:${lastStamp}:${lastClose}:${lastHigh}:${lastLow}:${lastVolume}`;
};

const buildWorkerPayload = (data: KLineData[]): WorkerDataPayload => {
  const length = data.length;
  const timestamp = new Float64Array(length);
  const open = new Float64Array(length);
  const high = new Float64Array(length);
  const low = new Float64Array(length);
  const close = new Float64Array(length);
  const volume = new Float64Array(length);

  for (let i = 0; i < length; i += 1) {
    const bar = data[i];
    timestamp[i] = typeof bar?.timestamp === "number" ? bar.timestamp : i;
    open[i] = typeof bar?.open === "number" ? bar.open : 0;
    high[i] = typeof bar?.high === "number" ? bar.high : 0;
    low[i] = typeof bar?.low === "number" ? bar.low : 0;
    close[i] = typeof bar?.close === "number" ? bar.close : 0;
    volume[i] = typeof bar?.volume === "number" ? bar.volume : 0;
  }

  return { timestamp, open, high, low, close, volume };
};

class IndicatorEngine {
  private worker: Worker;
  private pending = new Map<
    number,
    { resolve: (value: unknown[]) => void; reject: (error: Error) => void }
  >();
  private nextRequestId = 0;
  private datasetId = DEFAULT_DATASET_ID;
  private dataReady: Promise<void> | null = null;
  private dataReadyResolve: (() => void) | null = null;
  private cache = new Map<string, Promise<unknown[]>>();

  constructor() {
    this.worker = new Worker(
      new URL("../workers/taIndicatorWorker.ts", import.meta.url),
      { type: "module" },
    );
    this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;
      if (!message) return;

      if (message.type === "dataReady") {
        if (message.datasetId === this.datasetId && this.dataReadyResolve) {
          this.dataReadyResolve();
          this.dataReadyResolve = null;
          this.dataReady = null;
        }
        return;
      }

      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.ok) {
        pending.resolve(Array.isArray(message.result) ? message.result : []);
      } else {
        pending.reject(new Error(message.error || "Indicator compute failed"));
      }
    };
  }

  private ensureDataset(data: KLineData[]) {
    const signature = buildDatasetSignature(data);
    if (signature === this.datasetId) return;

    this.datasetId = signature;
    this.cache.clear();
    if (this.dataReadyResolve) {
      this.dataReadyResolve();
      this.dataReadyResolve = null;
      this.dataReady = null;
    }
    this.dataReady = new Promise((resolve) => {
      this.dataReadyResolve = resolve;
    });

    const payload = buildWorkerPayload(data);
    this.worker.postMessage(
      {
        type: "setData",
        datasetId: signature,
        data: payload,
      },
      [
        payload.timestamp.buffer,
        payload.open.buffer,
        payload.high.buffer,
        payload.low.buffer,
        payload.close.buffer,
        payload.volume.buffer,
      ],
    );
  }

  private async requestCompute(
    indicator: string,
    params: number[],
  ): Promise<unknown[]> {
    const id = (this.nextRequestId += 1);
    const request: IndicatorComputeRequest = {
      id,
      type: "compute",
      indicator,
      params,
      datasetId: this.datasetId,
    };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage(request);
    });
  }

  async compute(
    indicator: string,
    params: number[],
    data: KLineData[],
  ): Promise<unknown[]> {
    if (!data.length) return [];
    this.ensureDataset(data);
    if (this.dataReady) {
      await this.dataReady;
    }

    const key = `${this.datasetId}:${indicator}:${params.join(",")}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const computePromise = this.requestCompute(indicator, params);
    this.cache.set(key, computePromise);
    return computePromise;
  }
}

let engineInstance: IndicatorEngine | null = null;

export const getIndicatorEngine = () => {
  if (!engineInstance) {
    engineInstance = new IndicatorEngine();
  }
  return engineInstance;
};
