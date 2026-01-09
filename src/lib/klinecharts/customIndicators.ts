import { registerIndicator, utils } from "klinecharts";
import type { IndicatorTemplate, KLineData } from "klinecharts";

let registered = false;

type IndicatorRecord = Record<string, number | undefined>;

function createMaIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return {
    name: "SN_MA",
    shortName: "MA",
    series: "price",
    precision: 2,
    calcParams: [20, 50, 200],
    figures: [
      { key: "ma1", title: "MA20: ", type: "line" },
      { key: "ma2", title: "MA50: ", type: "line" },
      { key: "ma3", title: "MA200: ", type: "line" },
    ],
    regenerateFigures: (params) =>
      params.map((period, index) => ({
        key: `ma${index + 1}`,
        title: `MA${period}: `,
        type: "line",
      })),
    createTooltipDataSource: () => ({
      name: "",
      calcParamsText: "",
      legends: [],
      features: [],
    }),
    calc: (dataList, indicator) => {
      const { calcParams, figures } = indicator;
      const sums = Array(calcParams.length).fill(0);
      return dataList.map((data, index) => {
        const result: IndicatorRecord = {};
        const close = data.close;
        calcParams.forEach((period, paramIndex) => {
          sums[paramIndex] += close;
          if (index >= period - 1) {
            result[figures[paramIndex].key] = sums[paramIndex] / period;
            sums[paramIndex] -= dataList[index - (period - 1)].close;
          }
        });
        return result;
      });
    },
  };
}

function createEmaIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return {
    name: "SN_EMA",
    shortName: "EMA",
    series: "price",
    precision: 2,
    calcParams: [9, 21, 50],
    figures: [
      { key: "ema1", title: "EMA9: ", type: "line" },
      { key: "ema2", title: "EMA21: ", type: "line" },
      { key: "ema3", title: "EMA50: ", type: "line" },
    ],
    regenerateFigures: (params) =>
      params.map((period, index) => ({
        key: `ema${index + 1}`,
        title: `EMA${period}: `,
        type: "line",
      })),
    calc: (dataList, indicator) => {
      const { calcParams, figures } = indicator;
      const emaValues = Array(calcParams.length).fill(0);
      return dataList.map((data, index) => {
        const result: IndicatorRecord = {};
        const close = data.close;
        calcParams.forEach((period, paramIndex) => {
          const periodValue = period ?? 1;
          const weight = 2 / (periodValue + 1);
          if (index === 0) {
            emaValues[paramIndex] = close;
          } else {
            emaValues[paramIndex] =
              close * weight + emaValues[paramIndex] * (1 - weight);
          }
          if (index >= periodValue - 1) {
            result[figures[paramIndex].key] = emaValues[paramIndex];
          }
        });
        return result;
      });
    },
  };
}

function createBollIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return {
    name: "SN_BOLL",
    shortName: "BOLL",
    series: "price",
    precision: 2,
    calcParams: [20, 2],
    figures: [
      { key: "upper", title: "Upper: ", type: "line" },
      { key: "mid", title: "Mid: ", type: "line" },
      { key: "lower", title: "Lower: ", type: "line" },
    ],
    calc: (dataList, indicator) => {
      const period = indicator.calcParams[0] ?? 20;
      const multiplier = indicator.calcParams[1] ?? 2;
      let sum = 0;
      let sumSquares = 0;
      return dataList.map((data, index) => {
        const close = data.close;
        sum += close;
        sumSquares += close * close;
        if (index >= period) {
          const removed = dataList[index - period].close;
          sum -= removed;
          sumSquares -= removed * removed;
        }
        if (index >= period - 1) {
          const mean = sum / period;
          const variance = Math.max(sumSquares / period - mean * mean, 0);
          const stdDev = Math.sqrt(variance);
          return {
            upper: mean + multiplier * stdDev,
            mid: mean,
            lower: mean - multiplier * stdDev,
          };
        }
        return {};
      });
    },
  };
}

function createVwapIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return {
    name: "SN_VWAP",
    shortName: "VWAP",
    series: "price",
    precision: 2,
    figures: [{ key: "vwap", title: "VWAP: ", type: "line" }],
    calc: (dataList) => {
      let cumulativePV = 0;
      let cumulativeVolume = 0;
      return dataList.map((data) => {
        const volume = data.volume ?? 0;
        const high = data.high ?? data.close;
        const low = data.low ?? data.close;
        const typicalPrice = (high + low + data.close) / 3;
        cumulativePV += typicalPrice * volume;
        cumulativeVolume += volume;
        if (cumulativeVolume === 0) {
          return {};
        }
        return { vwap: cumulativePV / cumulativeVolume };
      });
    },
  };
}

function createRsiIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return {
    name: "SN_RSI",
    shortName: "RSI",
    series: "normal",
    precision: 2,
    minValue: 0,
    maxValue: 100,
    calcParams: [14],
    figures: [{ key: "rsi", title: "RSI: ", type: "line" }],
    calc: (dataList, indicator) => {
      const period = indicator.calcParams[0] ?? 14;
      let avgGain = 0;
      let avgLoss = 0;
      return dataList.map((data, index) => {
        if (index === 0) {
          return {};
        }
        const change = data.close - dataList[index - 1].close;
        const gain = Math.max(change, 0);
        const loss = Math.max(-change, 0);
        if (index <= period) {
          avgGain += gain;
          avgLoss += loss;
          if (index === period) {
            avgGain /= period;
            avgLoss /= period;
            const rs =
              avgLoss === 0
                ? avgGain === 0
                  ? 1
                  : Number.POSITIVE_INFINITY
                : avgGain / avgLoss;
            return { rsi: 100 - 100 / (1 + rs) };
          }
          return {};
        }
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        const rs =
          avgLoss === 0
            ? avgGain === 0
              ? 1
              : Number.POSITIVE_INFINITY
            : avgGain / avgLoss;
        return { rsi: 100 - 100 / (1 + rs) };
      });
    },
  };
}

function createAtrIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return {
    name: "SN_ATR",
    shortName: "ATR",
    series: "normal",
    precision: 2,
    minValue: 0,
    calcParams: [14],
    figures: [{ key: "atr", title: "ATR: ", type: "line" }],
    calc: (dataList, indicator) => {
      const period = indicator.calcParams[0] ?? 14;
      let atr = 0;
      let trSum = 0;
      return dataList.map((data, index) => {
        if (index === 0) {
          return {};
        }
        const prevClose = dataList[index - 1].close;
        const high = data.high ?? data.close;
        const low = data.low ?? data.close;
        const tr = Math.max(
          high - low,
          Math.abs(high - prevClose),
          Math.abs(low - prevClose),
        );
        if (index <= period) {
          trSum += tr;
          if (index === period) {
            atr = trSum / period;
            return { atr };
          }
          return {};
        }
        atr = (atr * (period - 1) + tr) / period;
        return { atr };
      });
    },
  };
}

function createMacdIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return {
    name: "SN_MACD",
    shortName: "MACD",
    series: "normal",
    precision: 2,
    calcParams: [12, 26, 9],
    figures: [
      { key: "dif", title: "DIF: ", type: "line" },
      { key: "dea", title: "DEA: ", type: "line" },
      {
        key: "macd",
        title: "MACD: ",
        type: "bar",
        baseValue: 0,
        styles: ({ data, defaultStyles }) => {
          const macdValue = data.current?.macd ?? 0;
          const base =
            macdValue >= 0
              ? defaultStyles?.bars?.[0]?.upColor
              : defaultStyles?.bars?.[0]?.downColor;
          const color = typeof base === "string" ? base : "#6b7280";
          return { color, borderColor: color, style: "fill" };
        },
      },
    ],
    calc: (dataList, indicator) => {
      const shortPeriod = indicator.calcParams[0] ?? 12;
      const longPeriod = indicator.calcParams[1] ?? 26;
      const signalPeriod = indicator.calcParams[2] ?? 9;
      const shortWeight = 2 / (shortPeriod + 1);
      const longWeight = 2 / (longPeriod + 1);
      const signalWeight = 2 / (signalPeriod + 1);
      let emaShort = 0;
      let emaLong = 0;
      let dea = 0;
      return dataList.map((data, index) => {
        const close = data.close;
        if (index === 0) {
          emaShort = close;
          emaLong = close;
          dea = 0;
          return {};
        }
        emaShort = close * shortWeight + emaShort * (1 - shortWeight);
        emaLong = close * longWeight + emaLong * (1 - longWeight);
        const dif = emaShort - emaLong;
        dea = dif * signalWeight + dea * (1 - signalWeight);
        const macd = (dif - dea) * 2;
        if (index < longPeriod - 1) {
          return {};
        }
        return { dif, dea, macd };
      });
    },
  };
}

function createStochIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return {
    name: "SN_STOCH",
    shortName: "STOCH",
    series: "normal",
    precision: 2,
    minValue: 0,
    maxValue: 100,
    calcParams: [14, 3],
    figures: [
      { key: "k", title: "%K: ", type: "line" },
      { key: "d", title: "%D: ", type: "line" },
    ],
    calc: (dataList, indicator) => {
      const period = indicator.calcParams[0] ?? 14;
      const smooth = indicator.calcParams[1] ?? 3;
      const kValues: number[] = [];
      return dataList.map((data, index) => {
        if (index < period - 1) {
          return {};
        }
        let highestHigh = Number.NEGATIVE_INFINITY;
        let lowestLow = Number.POSITIVE_INFINITY;
        for (let i = index - period + 1; i <= index; i += 1) {
          const high = dataList[i].high ?? dataList[i].close;
          const low = dataList[i].low ?? dataList[i].close;
          if (high > highestHigh) highestHigh = high;
          if (low < lowestLow) lowestLow = low;
        }
        const range = highestHigh - lowestLow;
        const k = range === 0 ? 0 : ((data.close - lowestLow) / range) * 100;
        kValues.push(k);
        if (kValues.length >= smooth) {
          const recent = kValues.slice(-smooth);
          const d =
            recent.reduce((sum, value) => sum + value, 0) / smooth;
          return { k, d };
        }
        return { k };
      });
    },
  };
}

function createVolumeIndicator(): IndicatorTemplate<
  IndicatorRecord & Pick<KLineData, "open" | "close" | "volume">,
  number
> {
  const getVolumeFigure = () => ({
    key: "volume",
    title: "VOL: ",
    type: "bar",
    styles: ({ data, indicator, defaultStyles }) => {
      const current = data.current;
      let color = utils.formatValue(
        indicator.styles,
        "bars[0].noChangeColor",
        defaultStyles?.bars?.[0]?.noChangeColor,
      );
      if (current) {
        if (current.close > current.open) {
          color = utils.formatValue(
            indicator.styles,
            "bars[0].upColor",
            defaultStyles?.bars?.[0]?.upColor,
          );
        } else if (current.close < current.open) {
          color = utils.formatValue(
            indicator.styles,
            "bars[0].downColor",
            defaultStyles?.bars?.[0]?.downColor,
          );
        }
      }
      return { color: typeof color === "string" ? color : "#6b7280" };
    },
  });

  return {
    name: "SN_VOL",
    shortName: "VOL",
    series: "volume",
    precision: 0,
    minValue: 0,
    shouldFormatBigNumber: true,
    calcParams: [5, 10, 20],
    figures: [
      { key: "ma1", title: "MA5: ", type: "line" },
      { key: "ma2", title: "MA10: ", type: "line" },
      { key: "ma3", title: "MA20: ", type: "line" },
      getVolumeFigure(),
    ],
    regenerateFigures: (params) => {
      const figures = params.map((period, index) => ({
        key: `ma${index + 1}`,
        title: `MA${period}: `,
        type: "line",
      }));
      figures.push(getVolumeFigure());
      return figures;
    },
    createTooltipDataSource: ({ chart, indicator, crosshair }) => {
      const dataIndex =
        typeof crosshair.dataIndex === "number" ? crosshair.dataIndex : null;
      const result = indicator.result ?? [];
      const data =
        dataIndex !== null && result[dataIndex] ? result[dataIndex] : null;
      const volume = data?.volume;
      const decimalFold = chart.getDecimalFold();
      const thousandsSeparator = chart.getThousandsSeparator();
      const formatter = chart.getFormatter();
      const tooltipLegendColor =
        chart.getStyles()?.indicator?.tooltip?.legend?.color ?? "#e2e8f0";
      const barStyles = chart.getStyles()?.indicator?.bars?.[0];
      let valueColor = tooltipLegendColor;
      if (data?.open !== undefined && data?.close !== undefined) {
        if (data.close > data.open) {
          valueColor = barStyles?.upColor ?? tooltipLegendColor;
        } else if (data.close < data.open) {
          valueColor = barStyles?.downColor ?? tooltipLegendColor;
        } else {
          valueColor = barStyles?.noChangeColor ?? tooltipLegendColor;
        }
      }

      let valueText = "n/a";
      if (typeof volume === "number" && Number.isFinite(volume)) {
        let formatted = utils.formatPrecision(volume, indicator.precision);
        if (indicator.shouldFormatBigNumber) {
          formatted = formatter.formatBigNumber(formatted);
        }
        valueText = decimalFold.format(thousandsSeparator.format(formatted));
      }

      return {
        name: "",
        calcParamsText: "",
        features: [],
        legends: [
          {
            title: { text: "VOL: ", color: tooltipLegendColor },
            value: { text: valueText, color: valueColor },
          },
        ],
      };
    },
    calc: (dataList, indicator) => {
      const { calcParams, figures } = indicator;
      const sums = Array(calcParams.length).fill(0);
      return dataList.map((data, index) => {
        const volume = data.volume ?? 0;
        const result: IndicatorRecord & Pick<KLineData, "open" | "close"> = {
          volume,
          open: data.open,
          close: data.close,
        };
        calcParams.forEach((period, paramIndex) => {
          sums[paramIndex] += volume;
          if (index >= period - 1) {
            result[figures[paramIndex].key] = sums[paramIndex] / period;
            sums[paramIndex] -= dataList[index - (period - 1)].volume ?? 0;
          }
        });
        return result;
      });
    },
  };
}

export function registerCustomIndicators() {
  if (registered) return;
  registerIndicator(createMaIndicator());
  registerIndicator(createEmaIndicator());
  registerIndicator(createBollIndicator());
  registerIndicator(createVwapIndicator());
  registerIndicator(createRsiIndicator());
  registerIndicator(createAtrIndicator());
  registerIndicator(createMacdIndicator());
  registerIndicator(createStochIndicator());
  registerIndicator(createVolumeIndicator());
  registered = true;
}
