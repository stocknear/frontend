type WorkerDataset = {
  timestamp: Float64Array;
  open: Float64Array;
  high: Float64Array;
  low: Float64Array;
  close: Float64Array;
  volume: Float64Array;
  length: number;
};

type WorkerRequest =
  | {
      type: "setData";
      datasetId: string;
      data: {
        timestamp: Float64Array;
        open: Float64Array;
        high: Float64Array;
        low: Float64Array;
        close: Float64Array;
        volume: Float64Array;
      };
    }
  | {
      id: number;
      type: "compute";
      datasetId: string;
      indicator: string;
      params: number[];
    };

type WorkerResponse =
  | { type: "dataReady"; datasetId: string }
  | { id: number; ok: true; result: unknown[] }
  | { id: number; ok: false; error: string };

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

let dataset: WorkerDataset | null = null;
let datasetId = "empty";

const clampPeriod = (value: number | undefined, fallback: number) => {
  if (!Number.isFinite(value)) return fallback;
  const rounded = Math.round(value as number);
  return Math.max(1, rounded);
};

const normalizePeriods = (params: number[], fallback: number[]) => {
  const source = params && params.length ? params : fallback;
  return source.map((period) => clampPeriod(period, 1));
};

const createEmptyResults = (length: number) =>
  Array.from({ length }, () => ({} as Record<string, number>));

const calcSma = (values: Float64Array, params: number[]) => {
  const periods = normalizePeriods(params, [20, 50, 100, 200]);
  const length = values.length;
  const results = createEmptyResults(length);
  const sums = periods.map(() => 0);

  for (let i = 0; i < length; i += 1) {
    const value = values[i];
    for (let p = 0; p < periods.length; p += 1) {
      const period = periods[p];
      sums[p] += value;
      if (i >= period - 1) {
        results[i][`ma${p + 1}`] = sums[p] / period;
        sums[p] -= values[i - (period - 1)];
      }
    }
  }
  return results;
};

const calcEma = (values: Float64Array, params: number[]) => {
  const periods = normalizePeriods(params, [9, 21, 50]);
  const length = values.length;
  const results = createEmptyResults(length);
  const emaValues = periods.map(() => 0);

  for (let i = 0; i < length; i += 1) {
    const value = values[i];
    for (let p = 0; p < periods.length; p += 1) {
      const period = periods[p];
      const weight = 2 / (period + 1);
      if (i === 0) {
        emaValues[p] = value;
      } else {
        emaValues[p] = value * weight + emaValues[p] * (1 - weight);
      }
      if (i >= period - 1) {
        results[i][`ema${p + 1}`] = emaValues[p];
      }
    }
  }
  return results;
};

const calcBoll = (values: Float64Array, params: number[]) => {
  const period = clampPeriod(params?.[0], 20);
  const multiplier = Number.isFinite(params?.[1]) ? params[1] : 2;
  const length = values.length;
  const results = createEmptyResults(length);
  let sum = 0;
  let sumSquares = 0;

  for (let i = 0; i < length; i += 1) {
    const value = values[i];
    sum += value;
    sumSquares += value * value;

    if (i >= period) {
      const removed = values[i - period];
      sum -= removed;
      sumSquares -= removed * removed;
    }

    if (i >= period - 1) {
      const mean = sum / period;
      const variance = Math.max(sumSquares / period - mean * mean, 0);
      const stdDev = Math.sqrt(variance);
      results[i].upper = mean + multiplier * stdDev;
      results[i].mid = mean;
      results[i].lower = mean - multiplier * stdDev;
    }
  }
  return results;
};

const calcVwap = (
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  volume: Float64Array,
) => {
  const length = close.length;
  const results = createEmptyResults(length);
  let cumulativePV = 0;
  let cumulativeVolume = 0;

  for (let i = 0; i < length; i += 1) {
    const typicalPrice = (high[i] + low[i] + close[i]) / 3;
    const vol = volume[i] ?? 0;
    cumulativePV += typicalPrice * vol;
    cumulativeVolume += vol;
    if (cumulativeVolume === 0) {
      continue;
    }
    results[i].vwap = cumulativePV / cumulativeVolume;
  }
  return results;
};

const calcRsi = (values: Float64Array, params: number[]) => {
  const period = clampPeriod(params?.[0], 14);
  const length = values.length;
  const results = createEmptyResults(length);
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i < length; i += 1) {
    const change = values[i] - values[i - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);

    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
      } else {
        continue;
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    const rs =
      avgLoss === 0
        ? avgGain === 0
          ? 1
          : Number.POSITIVE_INFINITY
        : avgGain / avgLoss;
    results[i].rsi = 100 - 100 / (1 + rs);
  }

  return results;
};

const calcAtr = (
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  params: number[],
) => {
  const period = clampPeriod(params?.[0], 14);
  const length = close.length;
  const results = createEmptyResults(length);
  let atr = 0;
  let trSum = 0;

  for (let i = 1; i < length; i += 1) {
    const prevClose = close[i - 1];
    const tr = Math.max(
      high[i] - low[i],
      Math.abs(high[i] - prevClose),
      Math.abs(low[i] - prevClose),
    );

    if (i <= period) {
      trSum += tr;
      if (i === period) {
        atr = trSum / period;
        results[i].atr = atr;
      }
    } else {
      atr = (atr * (period - 1) + tr) / period;
      results[i].atr = atr;
    }
  }

  return results;
};

const calcMacd = (values: Float64Array, params: number[]) => {
  const shortPeriod = clampPeriod(params?.[0], 12);
  const longPeriod = clampPeriod(params?.[1], 26);
  const signalPeriod = clampPeriod(params?.[2], 9);
  const length = values.length;
  const results = createEmptyResults(length);
  const shortWeight = 2 / (shortPeriod + 1);
  const longWeight = 2 / (longPeriod + 1);
  const signalWeight = 2 / (signalPeriod + 1);
  let emaShort = 0;
  let emaLong = 0;
  let dea = 0;

  for (let i = 0; i < length; i += 1) {
    const close = values[i];
    if (i === 0) {
      emaShort = close;
      emaLong = close;
      dea = 0;
      continue;
    }
    emaShort = close * shortWeight + emaShort * (1 - shortWeight);
    emaLong = close * longWeight + emaLong * (1 - longWeight);
    const dif = emaShort - emaLong;
    dea = dif * signalWeight + dea * (1 - signalWeight);
    const macd = (dif - dea) * 2;
    if (i >= longPeriod - 1) {
      results[i].dif = dif;
      results[i].dea = dea;
      results[i].macd = macd;
    }
  }

  return results;
};

const calcRollingHighLow = (
  high: Float64Array,
  low: Float64Array,
  period: number,
) => {
  const length = high.length;
  const highs = new Float64Array(length);
  const lows = new Float64Array(length);
  const highDeque: number[] = [];
  const lowDeque: number[] = [];

  for (let i = 0; i < length; i += 1) {
    while (highDeque.length && high[i] >= high[highDeque[highDeque.length - 1]]) {
      highDeque.pop();
    }
    highDeque.push(i);
    if (highDeque[0] <= i - period) highDeque.shift();

    while (lowDeque.length && low[i] <= low[lowDeque[lowDeque.length - 1]]) {
      lowDeque.pop();
    }
    lowDeque.push(i);
    if (lowDeque[0] <= i - period) lowDeque.shift();

    if (i >= period - 1) {
      highs[i] = high[highDeque[0]];
      lows[i] = low[lowDeque[0]];
    }
  }

  return { highs, lows };
};

const calcStochValues = (
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  period: number,
  smooth: number,
) => {
  const length = close.length;
  const kValues = new Float64Array(length);
  const dValues = new Float64Array(length);
  kValues.fill(Number.NaN);
  dValues.fill(Number.NaN);
  const { highs, lows } = calcRollingHighLow(high, low, period);
  let kSum = 0;
  const kQueue: number[] = [];

  for (let i = 0; i < length; i += 1) {
    if (i < period - 1) continue;
    const highestHigh = highs[i];
    const lowestLow = lows[i];
    const range = highestHigh - lowestLow;
    const k = range === 0 ? 0 : ((close[i] - lowestLow) / range) * 100;
    kValues[i] = k;
    kQueue.push(k);
    kSum += k;
    if (kQueue.length > smooth) {
      kSum -= kQueue.shift() as number;
    }
    if (kQueue.length === smooth) {
      dValues[i] = kSum / smooth;
    }
  }

  return { kValues, dValues };
};

const calcStoch = (
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  params: number[],
) => {
  const period = clampPeriod(params?.[0], 14);
  const smooth = clampPeriod(params?.[1], 3);
  const length = close.length;
  const results = createEmptyResults(length);
  const { kValues, dValues } = calcStochValues(high, low, close, period, smooth);

  for (let i = 0; i < length; i += 1) {
    if (!Number.isFinite(kValues[i])) continue;
    results[i].k = kValues[i];
    if (Number.isFinite(dValues[i])) {
      results[i].d = dValues[i];
    }
  }

  return results;
};

const calcStochCrossover = (
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  params: number[],
) => {
  const period = clampPeriod(params?.[0], 14);
  const smooth = clampPeriod(params?.[1], 3);
  const length = close.length;
  const results = createEmptyResults(length);
  const { kValues, dValues } = calcStochValues(high, low, close, period, smooth);

  for (let i = 0; i < length; i += 1) {
    if (!Number.isFinite(kValues[i]) || !Number.isFinite(dValues[i])) continue;
    results[i].crossover = kValues[i] - dValues[i];
  }
  return results;
};

const calcObv = (
  close: Float64Array,
  volume: Float64Array,
  params: number[],
) => {
  const length = close.length;
  const results = createEmptyResults(length);
  const periods = normalizePeriods(params, [5, 10, 20, 50]);
  const sums = periods.map(() => 0);
  let obv = 0;

  for (let i = 0; i < length; i += 1) {
    if (i > 0) {
      if (close[i] > close[i - 1]) obv += volume[i];
      else if (close[i] < close[i - 1]) obv -= volume[i];
    }
    results[i].obv = obv;
    for (let p = 0; p < periods.length; p += 1) {
      const period = periods[p];
      sums[p] += obv;
      if (i >= period - 1) {
        results[i][`ma${p + 1}`] = sums[p] / period;
        sums[p] -= results[i - (period - 1)].obv;
      }
    }
  }

  return results;
};

const calcVolume = (
  open: Float64Array,
  close: Float64Array,
  volume: Float64Array,
  params: number[],
) => {
  const periods = normalizePeriods(params, [5, 10, 20]);
  const length = volume.length;
  const results = createEmptyResults(length);
  const sums = periods.map(() => 0);

  for (let i = 0; i < length; i += 1) {
    results[i].volume = volume[i];
    results[i].open = open[i];
    results[i].close = close[i];
    for (let p = 0; p < periods.length; p += 1) {
      const period = periods[p];
      sums[p] += volume[i];
      if (i >= period - 1) {
        results[i][`ma${p + 1}`] = sums[p] / period;
        sums[p] -= volume[i - (period - 1)];
      }
    }
  }

  return results;
};

const calcCci = (
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  params: number[],
) => {
  const period = clampPeriod(params?.[0], 20);
  const length = close.length;
  const results = createEmptyResults(length);
  const tp = new Float64Array(length);

  for (let i = 0; i < length; i += 1) {
    tp[i] = (high[i] + low[i] + close[i]) / 3;
  }

  for (let i = period - 1; i < length; i += 1) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j += 1) {
      sum += tp[j];
    }
    const sma = sum / period;
    let meanDev = 0;
    for (let j = i - period + 1; j <= i; j += 1) {
      meanDev += Math.abs(tp[j] - sma);
    }
    meanDev /= period;
    if (meanDev !== 0) {
      results[i].cci = (tp[i] - sma) / (0.015 * meanDev);
    }
  }

  return results;
};

const calcWilliamsR = (
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  params: number[],
) => {
  const period = clampPeriod(params?.[0], 14);
  const length = close.length;
  const results = createEmptyResults(length);
  const { highs, lows } = calcRollingHighLow(high, low, period);

  for (let i = period - 1; i < length; i += 1) {
    const range = highs[i] - lows[i];
    if (range === 0) {
      results[i].williams = 0;
      continue;
    }
    results[i].williams = ((highs[i] - close[i]) / range) * -100;
  }

  return results;
};

const calcMfi = (
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  volume: Float64Array,
  params: number[],
) => {
  const period = clampPeriod(params?.[0], 14);
  const length = close.length;
  const results = createEmptyResults(length);
  const positiveFlows: number[] = [];
  const negativeFlows: number[] = [];
  let posSum = 0;
  let negSum = 0;

  for (let i = 1; i < length; i += 1) {
    const tp = (high[i] + low[i] + close[i]) / 3;
    const prevTp = (high[i - 1] + low[i - 1] + close[i - 1]) / 3;
    const rawFlow = tp * volume[i];
    const posFlow = tp > prevTp ? rawFlow : 0;
    const negFlow = tp < prevTp ? rawFlow : 0;
    positiveFlows.push(posFlow);
    negativeFlows.push(negFlow);
    posSum += posFlow;
    negSum += negFlow;

    if (positiveFlows.length > period) {
      posSum -= positiveFlows.shift() as number;
      negSum -= negativeFlows.shift() as number;
    }

    if (positiveFlows.length === period) {
      if (negSum === 0) {
        results[i].mfi = 100;
      } else {
        const ratio = posSum / negSum;
        results[i].mfi = 100 - 100 / (1 + ratio);
      }
    }
  }

  return results;
};

const calcSar = (
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
  params: number[],
) => {
  const step = Number.isFinite(params?.[0]) ? params[0] : 0.02;
  const maxStep = Number.isFinite(params?.[1]) ? params[1] : 0.2;
  const length = close.length;
  const results = createEmptyResults(length);
  if (length < 2) return results;

  let isLong = close[1] >= close[0];
  let af = step;
  let ep = isLong ? high[1] : low[1];
  let sar = isLong ? low[0] : high[0];

  for (let i = 1; i < length; i += 1) {
    sar = sar + af * (ep - sar);

    if (isLong) {
      const prevLow = low[i - 1];
      const prevPrevLow = i > 1 ? low[i - 2] : prevLow;
      sar = Math.min(sar, prevLow, prevPrevLow);
      if (low[i] < sar) {
        isLong = false;
        sar = ep;
        ep = low[i];
        af = step;
      } else if (high[i] > ep) {
        ep = high[i];
        af = Math.min(af + step, maxStep);
      }
    } else {
      const prevHigh = high[i - 1];
      const prevPrevHigh = i > 1 ? high[i - 2] : prevHigh;
      sar = Math.max(sar, prevHigh, prevPrevHigh);
      if (high[i] > sar) {
        isLong = true;
        sar = ep;
        ep = high[i];
        af = step;
      } else if (low[i] < ep) {
        ep = low[i];
        af = Math.min(af + step, maxStep);
      }
    }

    results[i].sar = sar;
  }

  return results;
};

const calcDonchian = (
  high: Float64Array,
  low: Float64Array,
  params: number[],
) => {
  const period = clampPeriod(params?.[0], 20);
  const length = high.length;
  const results = createEmptyResults(length);
  const { highs, lows } = calcRollingHighLow(high, low, period);

  for (let i = period - 1; i < length; i += 1) {
    const upper = highs[i];
    const lower = lows[i];
    results[i].upper = upper;
    results[i].lower = lower;
    results[i].middle = (upper + lower) / 2;
  }

  return results;
};

const calcStdDev = (values: Float64Array, params: number[]) => {
  const period = clampPeriod(params?.[0], 20);
  const length = values.length;
  const results = createEmptyResults(length);
  let sum = 0;
  let sumSquares = 0;

  for (let i = 0; i < length; i += 1) {
    const value = values[i];
    sum += value;
    sumSquares += value * value;

    if (i >= period) {
      const removed = values[i - period];
      sum -= removed;
      sumSquares -= removed * removed;
    }

    if (i >= period - 1) {
      const mean = sum / period;
      const variance = Math.max(sumSquares / period - mean * mean, 0);
      results[i].std = Math.sqrt(variance);
    }
  }

  return results;
};

const calcHistoricalVol = (values: Float64Array, params: number[]) => {
  const period = clampPeriod(params?.[0], 20);
  const length = values.length;
  const results = createEmptyResults(length);
  const returns = new Float64Array(length);
  for (let i = 1; i < length; i += 1) {
    returns[i] = Math.log(values[i] / values[i - 1]);
  }

  let sum = 0;
  let sumSquares = 0;
  for (let i = 1; i < length; i += 1) {
    const value = returns[i];
    sum += value;
    sumSquares += value * value;
    if (i > period) {
      const removed = returns[i - period];
      sum -= removed;
      sumSquares -= removed * removed;
    }
    if (i >= period) {
      const mean = sum / period;
      const variance = Math.max(sumSquares / period - mean * mean, 0);
      const std = Math.sqrt(variance);
      results[i].histVol = std * Math.sqrt(252) * 100;
    }
  }

  return results;
};

const calcChaikinVol = (
  high: Float64Array,
  low: Float64Array,
  params: number[],
) => {
  const emaPeriod = clampPeriod(params?.[0], 10);
  const rocPeriod = clampPeriod(params?.[1], 10);
  const length = high.length;
  const results = createEmptyResults(length);
  const emaValues = new Float64Array(length);
  const weight = 2 / (emaPeriod + 1);

  for (let i = 0; i < length; i += 1) {
    const range = high[i] - low[i];
    if (i === 0) {
      emaValues[i] = range;
    } else {
      emaValues[i] = range * weight + emaValues[i - 1] * (1 - weight);
    }
    if (i >= rocPeriod) {
      const prev = emaValues[i - rocPeriod];
      if (prev !== 0) {
        results[i].chaikin = ((emaValues[i] - prev) / prev) * 100;
      }
    }
  }

  return results;
};

const calcPivot = (
  high: Float64Array,
  low: Float64Array,
  close: Float64Array,
) => {
  const length = close.length;
  const results = createEmptyResults(length);
  for (let i = 1; i < length; i += 1) {
    const prevHigh = high[i - 1];
    const prevLow = low[i - 1];
    const prevClose = close[i - 1];
    const pivot = (prevHigh + prevLow + prevClose) / 3;
    const range = prevHigh - prevLow;
    results[i].pivot = pivot;
    results[i].s1 = 2 * pivot - prevHigh;
    results[i].s2 = pivot - range;
    results[i].r1 = 2 * pivot - prevLow;
    results[i].r2 = pivot + range;
  }
  return results;
};

const calcFibonacci = (high: Float64Array, low: Float64Array) => {
  const length = high.length;
  const results = createEmptyResults(length);
  if (!length) return results;
  let highest = Number.NEGATIVE_INFINITY;
  let lowest = Number.POSITIVE_INFINITY;
  for (let i = 0; i < length; i += 1) {
    if (high[i] > highest) highest = high[i];
    if (low[i] < lowest) lowest = low[i];
  }
  const diff = highest - lowest;
  const fib236 = highest - diff * 0.236;
  const fib382 = highest - diff * 0.382;
  const fib500 = highest - diff * 0.5;
  const fib618 = highest - diff * 0.618;
  const fib786 = highest - diff * 0.786;

  for (let i = 0; i < length; i += 1) {
    results[i].fib236 = fib236;
    results[i].fib382 = fib382;
    results[i].fib500 = fib500;
    results[i].fib618 = fib618;
    results[i].fib786 = fib786;
  }
  return results;
};

const calcPsychLevel = (close: Float64Array, params: number[]) => {
  const step = clampPeriod(params?.[0], 10);
  const length = close.length;
  const results = createEmptyResults(length);
  for (let i = 0; i < length; i += 1) {
    const value = close[i];
    results[i].psych = Math.round(value / step) * step;
  }
  return results;
};

const calcRoc = (close: Float64Array, params: number[]) => {
  const period = clampPeriod(params?.[0], 12);
  const length = close.length;
  const results = createEmptyResults(length);
  for (let i = period; i < length; i += 1) {
    const prev = close[i - period];
    if (prev !== 0) {
      results[i].roc = ((close[i] - prev) / prev) * 100;
    }
  }
  return results;
};

const emaArray = (values: Float64Array, period: number) => {
  const length = values.length;
  const output = new Float64Array(length);
  const weight = 2 / (period + 1);
  for (let i = 0; i < length; i += 1) {
    if (i === 0) output[i] = values[i];
    else output[i] = values[i] * weight + output[i - 1] * (1 - weight);
  }
  return output;
};

const calcTsi = (close: Float64Array, params: number[]) => {
  const longPeriod = clampPeriod(params?.[0], 25);
  const shortPeriod = clampPeriod(params?.[1], 13);
  const signalPeriod = clampPeriod(params?.[2], 7);
  const length = close.length;
  const results = createEmptyResults(length);
  const momentum = new Float64Array(length);
  const absMomentum = new Float64Array(length);

  for (let i = 1; i < length; i += 1) {
    const diff = close[i] - close[i - 1];
    momentum[i] = diff;
    absMomentum[i] = Math.abs(diff);
  }

  const ema1 = emaArray(momentum, longPeriod);
  const ema2 = emaArray(ema1, shortPeriod);
  const absEma1 = emaArray(absMomentum, longPeriod);
  const absEma2 = emaArray(absEma1, shortPeriod);
  const tsiValues = new Float64Array(length);

  for (let i = 0; i < length; i += 1) {
    const denom = absEma2[i];
    tsiValues[i] = denom === 0 ? 0 : (ema2[i] / denom) * 100;
  }

  const signalValues = emaArray(tsiValues, signalPeriod);

  for (let i = 0; i < length; i += 1) {
    results[i].tsi = tsiValues[i];
    results[i].signal = signalValues[i];
  }

  return results;
};

const calcAroon = (
  high: Float64Array,
  low: Float64Array,
  params: number[],
) => {
  const period = clampPeriod(params?.[0], 25);
  const length = high.length;
  const results = createEmptyResults(length);
  const highDeque: number[] = [];
  const lowDeque: number[] = [];

  for (let i = 0; i < length; i += 1) {
    while (highDeque.length && high[i] >= high[highDeque[highDeque.length - 1]]) {
      highDeque.pop();
    }
    highDeque.push(i);
    if (highDeque[0] <= i - period) highDeque.shift();

    while (lowDeque.length && low[i] <= low[lowDeque[lowDeque.length - 1]]) {
      lowDeque.pop();
    }
    lowDeque.push(i);
    if (lowDeque[0] <= i - period) lowDeque.shift();

    if (i >= period - 1) {
      const periodsSinceHigh = i - highDeque[0];
      const periodsSinceLow = i - lowDeque[0];
      const up = ((period - periodsSinceHigh) / period) * 100;
      const down = ((period - periodsSinceLow) / period) * 100;
      results[i].up = up;
      results[i].down = down;
      results[i].osc = up - down;
    }
  }

  return results;
};

const computeIndicator = (indicator: string, params: number[]) => {
  if (!dataset) return [];

  switch (indicator) {
    case "ma":
      return calcSma(dataset.close, params);
    case "ema":
      return calcEma(dataset.close, params);
    case "boll":
      return calcBoll(dataset.close, params);
    case "vwap":
      return calcVwap(dataset.high, dataset.low, dataset.close, dataset.volume);
    case "volume":
      return calcVolume(dataset.open, dataset.close, dataset.volume, params);
    case "rsi":
      return calcRsi(dataset.close, params);
    case "macd":
      return calcMacd(dataset.close, params);
    case "atr":
      return calcAtr(dataset.high, dataset.low, dataset.close, params);
    case "stoch":
      return calcStoch(dataset.high, dataset.low, dataset.close, params);
    case "stoch_crossover":
      return calcStochCrossover(dataset.high, dataset.low, dataset.close, params);
    case "obv":
      return calcObv(dataset.close, dataset.volume, params);
    case "cci":
      return calcCci(dataset.high, dataset.low, dataset.close, params);
    case "williams_r":
      return calcWilliamsR(dataset.high, dataset.low, dataset.close, params);
    case "mfi":
      return calcMfi(dataset.high, dataset.low, dataset.close, dataset.volume, params);
    case "parabolic_sar":
      return calcSar(dataset.high, dataset.low, dataset.close, params);
    case "donchian":
      return calcDonchian(dataset.high, dataset.low, params);
    case "std":
      return calcStdDev(dataset.close, params);
    case "hist_vol":
      return calcHistoricalVol(dataset.close, params);
    case "chaikin_vol":
      return calcChaikinVol(dataset.high, dataset.low, params);
    case "pivot":
      return calcPivot(dataset.high, dataset.low, dataset.close);
    case "fibonacci":
      return calcFibonacci(dataset.high, dataset.low);
    case "psych":
      return calcPsychLevel(dataset.close, params);
    case "roc":
      return calcRoc(dataset.close, params);
    case "tsi":
      return calcTsi(dataset.close, params);
    case "aroon":
      return calcAroon(dataset.high, dataset.low, params);
    default:
      return [];
  }
};

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const payload = event.data;
  if (!payload) return;

  if (payload.type === "setData") {
    dataset = {
      timestamp: payload.data.timestamp,
      open: payload.data.open,
      high: payload.data.high,
      low: payload.data.low,
      close: payload.data.close,
      volume: payload.data.volume,
      length: payload.data.close.length,
    };
    datasetId = payload.datasetId;
    const response: WorkerResponse = {
      type: "dataReady",
      datasetId,
    };
    ctx.postMessage(response);
    return;
  }

  if (payload.type === "compute") {
    if (payload.datasetId !== datasetId) {
      const response: WorkerResponse = {
        id: payload.id,
        ok: false,
        error: "Stale dataset",
      };
      ctx.postMessage(response);
      return;
    }

    try {
      const result = computeIndicator(payload.indicator, payload.params ?? []);
      const response: WorkerResponse = {
        id: payload.id,
        ok: true,
        result,
      };
      ctx.postMessage(response);
    } catch (error) {
      const response: WorkerResponse = {
        id: payload.id,
        ok: false,
        error: error instanceof Error ? error.message : "Worker error",
      };
      ctx.postMessage(response);
    }
  }
};
