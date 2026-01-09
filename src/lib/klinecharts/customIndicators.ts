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
  registerIndicator(createRsiIndicator());
  registerIndicator(createMacdIndicator());
  registerIndicator(createVolumeIndicator());
  registered = true;
}
