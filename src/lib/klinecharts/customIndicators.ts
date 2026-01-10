import { registerIndicator, utils } from "klinecharts";
import type { IndicatorTemplate, KLineData } from "klinecharts";
import { getIndicatorEngine } from "./indicatorEngine";

let registered = false;

type IndicatorRecord = Record<string, number | undefined>;

const createWorkerIndicator = <D extends IndicatorRecord, C = number>(
  workerKey: string,
  template: IndicatorTemplate<D, C>,
): IndicatorTemplate<D, C> => ({
  ...template,
  calc: async (dataList, indicator) => {
    try {
      return (await getIndicatorEngine().compute(
        workerKey,
        Array.isArray(indicator.calcParams)
          ? (indicator.calcParams as number[])
          : [],
        dataList,
      )) as D[];
    } catch (error) {
      console.error(`Indicator ${workerKey} failed:`, error);
      return [];
    }
  },
});

function createMaIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("ma", {
    name: "SN_MA",
    shortName: "MA",
    series: "price",
    precision: 2,
    calcParams: [20, 50, 100, 200],
    figures: [
      { key: "ma1", title: "MA20: ", type: "line" },
      { key: "ma2", title: "MA50: ", type: "line" },
      { key: "ma3", title: "MA100: ", type: "line" },
      { key: "ma4", title: "MA200: ", type: "line" },
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
  });
}

function createEmaIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("ema", {
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
  });
}

function createBollIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("boll", {
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
  });
}

function createVwapIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("vwap", {
    name: "SN_VWAP",
    shortName: "VWAP",
    series: "price",
    precision: 2,
    figures: [{ key: "vwap", title: "VWAP: ", type: "line" }],
  });
}

function createRsiIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("rsi", {
    name: "SN_RSI",
    shortName: "RSI",
    series: "normal",
    precision: 2,
    minValue: 0,
    maxValue: 100,
    calcParams: [14],
    figures: [{ key: "rsi", title: "RSI: ", type: "line" }],
  });
}

function createAtrIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("atr", {
    name: "SN_ATR",
    shortName: "ATR",
    series: "normal",
    precision: 2,
    minValue: 0,
    calcParams: [14],
    figures: [{ key: "atr", title: "ATR: ", type: "line" }],
  });
}

function createMacdIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("macd", {
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
  });
}

function createStochIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("stoch", {
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
  });
}

function createStochCrossoverIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("stoch_crossover", {
    name: "SN_STOCH_X",
    shortName: "STOCH X",
    series: "normal",
    precision: 2,
    minValue: -100,
    maxValue: 100,
    calcParams: [14, 3],
    figures: [{ key: "crossover", title: "%K-%D: ", type: "line" }],
  });
}

function createObvIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("obv", {
    name: "SN_OBV",
    shortName: "OBV",
    series: "normal",
    precision: 0,
    calcParams: [5, 10, 20, 50],
    figures: [
      { key: "obv", title: "OBV: ", type: "line" },
      { key: "ma1", title: "MA5: ", type: "line" },
      { key: "ma2", title: "MA10: ", type: "line" },
      { key: "ma3", title: "MA20: ", type: "line" },
      { key: "ma4", title: "MA50: ", type: "line" },
    ],
    regenerateFigures: (params) => {
      const figures = params.map((period, index) => ({
        key: `ma${index + 1}`,
        title: `MA${period}: `,
        type: "line",
      }));
      figures.unshift({ key: "obv", title: "OBV: ", type: "line" });
      return figures;
    },
  });
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

  return createWorkerIndicator("volume", {
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
    createTooltipDataSource: () => ({
      name: "",
      calcParamsText: "",
      legends: [],
      features: [],
    }),
    styles: {
      lastValueMark: {
        show: false,
      },
    },
  });
}

function createCciIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("cci", {
    name: "SN_CCI",
    shortName: "CCI",
    series: "normal",
    precision: 2,
    calcParams: [20],
    figures: [{ key: "cci", title: "CCI: ", type: "line" }],
  });
}

function createWilliamsIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("williams_r", {
    name: "SN_WILLIAMS",
    shortName: "%R",
    series: "normal",
    precision: 2,
    minValue: -100,
    maxValue: 0,
    calcParams: [14],
    figures: [{ key: "williams", title: "%R: ", type: "line" }],
  });
}

function createMfiIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("mfi", {
    name: "SN_MFI",
    shortName: "MFI",
    series: "normal",
    precision: 2,
    minValue: 0,
    maxValue: 100,
    calcParams: [14],
    figures: [{ key: "mfi", title: "MFI: ", type: "line" }],
  });
}

function createSarIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("parabolic_sar", {
    name: "SN_SAR",
    shortName: "SAR",
    series: "price",
    precision: 2,
    calcParams: [0.02, 0.2],
    figures: [{ key: "sar", title: "SAR: ", type: "circle" }],
  });
}

function createDonchianIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("donchian", {
    name: "SN_DONCHIAN",
    shortName: "DON",
    series: "price",
    precision: 2,
    calcParams: [20],
    figures: [
      { key: "upper", title: "Upper: ", type: "line" },
      { key: "middle", title: "Middle: ", type: "line" },
      { key: "lower", title: "Lower: ", type: "line" },
    ],
  });
}

function createStdIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("std", {
    name: "SN_STD",
    shortName: "STD",
    series: "normal",
    precision: 3,
    calcParams: [20],
    figures: [{ key: "std", title: "STD: ", type: "line" }],
  });
}

function createHistVolIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("hist_vol", {
    name: "SN_HVOL",
    shortName: "HV",
    series: "normal",
    precision: 2,
    calcParams: [20],
    figures: [{ key: "histVol", title: "HV: ", type: "line" }],
  });
}

function createChaikinVolIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("chaikin_vol", {
    name: "SN_CHAIKIN",
    shortName: "CHV",
    series: "normal",
    precision: 2,
    calcParams: [10, 10],
    figures: [{ key: "chaikin", title: "CHV: ", type: "line" }],
  });
}

function createPivotIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("pivot", {
    name: "SN_PIVOT",
    shortName: "PIVOT",
    series: "price",
    precision: 2,
    figures: [
      { key: "pivot", title: "P: ", type: "line" },
      { key: "s1", title: "S1: ", type: "line" },
      { key: "s2", title: "S2: ", type: "line" },
      { key: "r1", title: "R1: ", type: "line" },
      { key: "r2", title: "R2: ", type: "line" },
    ],
  });
}

function createFibIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("fibonacci", {
    name: "SN_FIB",
    shortName: "FIB",
    series: "price",
    precision: 2,
    figures: [
      { key: "fib236", title: "23.6%: ", type: "line" },
      { key: "fib382", title: "38.2%: ", type: "line" },
      { key: "fib500", title: "50.0%: ", type: "line" },
      { key: "fib618", title: "61.8%: ", type: "line" },
      { key: "fib786", title: "78.6%: ", type: "line" },
    ],
  });
}

function createPsychIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("psych", {
    name: "SN_PSYCH",
    shortName: "PSY",
    series: "price",
    precision: 2,
    calcParams: [10],
    figures: [{ key: "psych", title: "Psych: ", type: "line" }],
  });
}

function createRocIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("roc", {
    name: "SN_ROC",
    shortName: "ROC",
    series: "normal",
    precision: 2,
    calcParams: [12],
    figures: [{ key: "roc", title: "ROC: ", type: "line" }],
  });
}

function createTsiIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("tsi", {
    name: "SN_TSI",
    shortName: "TSI",
    series: "normal",
    precision: 2,
    calcParams: [25, 13, 7],
    figures: [
      { key: "tsi", title: "TSI: ", type: "line" },
      { key: "signal", title: "Signal: ", type: "line" },
    ],
  });
}

function createAroonIndicator(): IndicatorTemplate<IndicatorRecord, number> {
  return createWorkerIndicator("aroon", {
    name: "SN_AROON",
    shortName: "AROON",
    series: "normal",
    precision: 2,
    calcParams: [25],
    figures: [
      { key: "up", title: "Up: ", type: "line" },
      { key: "down", title: "Down: ", type: "line" },
      { key: "osc", title: "Osc: ", type: "line" },
    ],
  });
}


export function registerCustomIndicators() {
  if (registered) return;
  registerIndicator(createMaIndicator());
  registerIndicator(createEmaIndicator());
  registerIndicator(createBollIndicator());
  registerIndicator(createVwapIndicator());
  registerIndicator(createVolumeIndicator());
  registerIndicator(createRsiIndicator());
  registerIndicator(createMacdIndicator());
  registerIndicator(createAtrIndicator());
  registerIndicator(createStochIndicator());
  registerIndicator(createStochCrossoverIndicator());
  registerIndicator(createObvIndicator());
  registerIndicator(createCciIndicator());
  registerIndicator(createWilliamsIndicator());
  registerIndicator(createMfiIndicator());
  registerIndicator(createSarIndicator());
  registerIndicator(createDonchianIndicator());
  registerIndicator(createStdIndicator());
  registerIndicator(createHistVolIndicator());
  registerIndicator(createChaikinVolIndicator());
  registerIndicator(createPivotIndicator());
  registerIndicator(createFibIndicator());
  registerIndicator(createPsychIndicator());
  registerIndicator(createRocIndicator());
  registerIndicator(createTsiIndicator());
  registerIndicator(createAroonIndicator());
  registered = true;
}
