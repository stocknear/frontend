<script lang="ts">
    import { toast } from "svelte-sonner";
    import { mode } from "mode-watcher";
    import HoverStockChart from "$lib/components/HoverStockChart.svelte";
    import { abbreviateNumber } from "$lib/utils";
    import TableHeader from "$lib/components/Table/TableHeader.svelte";

    import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
    import { Button } from "$lib/components/shadcn/button/index.js";
    import * as Tabs from "$lib/components/shadcn/tabs/index.js";
    import Input from "$lib/components/Input.svelte";

    import SEO from "$lib/components/SEO.svelte";
    import StrategyBuilder from "$lib/components/StrategyBuilder.svelte";
    import { onMount, onDestroy } from "svelte";
    import highcharts from "$lib/highcharts.ts";
    import InfoModal from "$lib/components/InfoModal.svelte";
    import { goto } from "$app/navigation";

    export let data;
    export let form;

    let LoginPopup;

    let strategyList = data?.getAllStrategies;
    let selectedStrategy = strategyList?.at(0)?.id ?? "";
    let strategyData = strategyList?.at(0)?.rules ?? {};

    let selectedTickers = strategyData?.tickers || ["NVDA"];
    let startDate = strategyData?.start_date || "2015-01-01";
    let endDate =
        strategyData?.end_date || new Date().toISOString().split("T")[0];
    let buyConditions = strategyData?.buy_condition || [];
    let sellConditions = strategyData?.sell_condition || [];
    let initialCapital = strategyData?.initial_capital || 100000;
    let commissionFee = strategyData?.commission || 0.5; // Default 0.

    let config = null;
    let activeTab = "buy";

    let rawTradeHistory = [];
    let tradeHistorySource = [];
    let displayTradeHistory = [];

    let tradeCurrentPage = 1;
    let tradeRowsPerPage = 20;
    let tradeRowsPerPageOptions = [20, 50, 100];
    let tradeTotalPages = 0;
    const TRADE_PAGINATION_KEY = "backtesting_trade_history_rows";
    const isBrowser = typeof window !== "undefined";

    let backtestResults = {};
    let isBacktesting = false;
    let backtestError = null;

    // Risk Management
    let stopLossPercentage = 5;
    let profitTakerPercentage = null;

    // Cache system for backtest results
    const backtestCache = new Map();
    const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

    // Generate cache key from strategy parameters
    function generateCacheKey(strategyData) {
        const key = {
            tickers: [...strategyData.tickers].sort(),
            start_date: strategyData.start_date,
            end_date: strategyData.end_date,
            buy_condition: JSON.stringify(strategyData.buy_condition),
            sell_condition: JSON.stringify(strategyData.sell_condition),
            initial_capital: strategyData.initial_capital,
            commission: strategyData.commission,
            profitTakerPercentage: strategyData.profit_taker,
            stopLossPercentage: strategyData.stop_loss,
        };
        return JSON.stringify(key);
    }

    // Check if cache entry is valid
    function isCacheValid(entry) {
        if (!entry) return false;
        const now = Date.now();
        return now - entry.timestamp < CACHE_EXPIRY_MS;
    }

    // Clear expired cache entries
    function clearExpiredCache() {
        const now = Date.now();
        for (const [key, entry] of backtestCache.entries()) {
            if (now - entry.timestamp >= CACHE_EXPIRY_MS) {
                backtestCache.delete(key);
            }
        }
    }

    // Clear all cache
    function clearAllCache() {
        backtestCache.clear();
    }

    // Define all possible indicators and their properties
    const availableIndicators = {
        price: {
            label: "Stock Price",
            category: "Price",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [
                "sma_20",
                "sma_50",
                "sma_100",
                "sma_200",
                "ema_20",
                "ema_50",
                "ema_100",
                "ema_200",
                "vwap",
                "parabolic_sar",
                "donchian_upper",
                "donchian_middle",
                "donchian_lower",
                "pivot",
                "pivot_s1",
                "pivot_r1",
                "fib_618",
                "fib_382",
                "psych_round_25",
                "atr_upper_0.5",
                "atr_upper_1",
                "atr_upper_1.5",
                "atr_upper_2",
                "atr_upper_2.5",
                "atr_upper_3",
                "atr_lower_0.5",
                "atr_lower_1",
                "atr_lower_1.5",
                "atr_lower_2",
                "atr_lower_2.5",
                "atr_lower_3",
                "bb_upper",
                "bb_middle",
                "bb_lower",
            ],
            valueLabels: {
                sma_20: "20-Day SMA",
                sma_50: "50-Day SMA",
                sma_100: "100-Day SMA",
                sma_200: "200-Day SMA",
                ema_20: "20-Day EMA",
                ema_50: "50-Day EMA",
                ema_100: "100-Day EMA",
                ema_200: "200-Day EMA",
                vwap: "VWAP",
                parabolic_sar: "Parabolic SAR",
                donchian_upper: "Donchian Upper Channel",
                donchian_middle: "Donchian Middle Channel",
                donchian_lower: "Donchian Lower Channel",
                pivot: "Pivot Point",
                pivot_s1: "Pivot Support 1",
                pivot_r1: "Pivot Resistance 1",
                fib_618: "Fibonacci 61.8%",
                fib_382: "Fibonacci 38.2%",
                psych_round_25: "Psychological $25 Levels",
                "atr_upper_0.5": "Previous Close + 0.5×ATR",
                atr_upper_1: "Previous Close + 1×ATR",
                "atr_upper_1.5": "Previous Close + 1.5×ATR",
                atr_upper_2: "Previous Close + 2×ATR",
                "atr_upper_2.5": "Previous Close + 2.5×ATR",
                atr_upper_3: "Previous Close + 3×ATR",
                "atr_lower_0.5": "Previous Close - 0.5×ATR",
                atr_lower_1: "Previous Close - 1×ATR",
                "atr_lower_1.5": "Previous Close - 1.5×ATR",
                atr_lower_2: "Previous Close - 2×ATR",
                "atr_lower_2.5": "Previous Close - 2.5×ATR",
                atr_lower_3: "Previous Close - 3×ATR",
                bb_upper: "Bollinger Upper Band",
                bb_middle: "Bollinger Middle Band",
                bb_lower: "Bollinger Lower Band",
            },
        },
        rsi: {
            label: "RSI (Relative Strength Index)",
            category: "Momentum",
            operators: ["above", "below"],
            defaultOperator: "below",
            defaultValue: 30,
            min: 0,
            max: 100,
        },
        sma_20: {
            label: "20-Day Moving Average",
            category: "Moving Averages",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [
                "price",
                "sma_50",
                "sma_100",
                "sma_200",
                "ema_20",
                "ema_50",
                "ema_100",
                "ema_200",
            ],
            valueLabels: {
                price: "Stock Price",
                sma_50: "50-Day Moving Average",
                sma_100: "100-Day Moving Average",
                sma_200: "200-Day Moving Average",
                ema_20: "20-Day Exponential Moving Average",
                ema_50: "50-Day Exponential Moving Average",
                ema_100: "100-Day Exponential Moving Average",
                ema_200: "200-Day Exponential Moving Average",
            },
        },
        sma_50: {
            label: "50-Day Moving Average",
            category: "Moving Averages",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [
                "price",
                "sma_20",
                "sma_100",
                "sma_200",
                "ema_20",
                "ema_50",
                "ema_100",
                "ema_200",
            ],
            valueLabels: {
                price: "Stock Price",
                sma_20: "20-Day SMA",
                sma_100: "100-Day SMA",
                sma_200: "200-Day SMA",
                ema_20: "20-Day EMA",
                ema_50: "50-Day EMA",
                ema_100: "100-Day EMA",
                ema_200: "200-Day EMA",
            },
        },
        sma_100: {
            label: "100-Day Moving Average",
            category: "Moving Averages",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [
                "price",
                "sma_20",
                "sma_50",
                "sma_200",
                "ema_20",
                "ema_50",
                "ema_100",
                "ema_200",
            ],
            valueLabels: {
                price: "Stock Price",
                sma_20: "20-Day SMA",
                sma_50: "50-Day SMA",
                sma_200: "200-Day SMA",
                ema_20: "20-Day EMA",
                ema_50: "50-Day EMA",
                ema_100: "100-Day EMA",
                ema_200: "200-Day EMA",
            },
        },
        sma_200: {
            label: "200-Day Moving Average",
            category: "Moving Averages",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [
                "price",
                "sma_20",
                "sma_50",
                "sma_100",
                "ema_20",
                "ema_50",
                "ema_100",
                "ema_200",
            ],
            valueLabels: {
                price: "Stock Price",
                sma_20: "20-Day SMA",
                sma_50: "50-Day SMA",
                sma_100: "100-Day SMA",
                ema_20: "20-Day EMA",
                ema_50: "50-Day EMA",
                ema_100: "100-Day EMA",
                ema_200: "200-Day EMA",
            },
        },
        ema_20: {
            label: "20-Day Exponential Moving Average",
            category: "Moving Averages",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [
                "price",
                "sma_20",
                "sma_50",
                "sma_100",
                "sma_200",
                "ema_50",
                "ema_100",
                "ema_200",
            ],
            valueLabels: {
                price: "Stock Price",
                sma_20: "20-Day SMA",
                sma_50: "50-Day SMA",
                sma_100: "100-Day SMA",
                sma_200: "200-Day SMA",
                ema_50: "50-Day EMA",
                ema_100: "100-Day EMA",
                ema_200: "200-Day EMA",
            },
        },
        ema_50: {
            label: "50-Day Exponential Moving Average",
            category: "Moving Averages",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [
                "price",
                "sma_20",
                "sma_50",
                "sma_100",
                "sma_200",
                "ema_20",
                "ema_100",
                "ema_200",
            ],
            valueLabels: {
                price: "Stock Price",
                sma_20: "20-Day SMA",
                sma_50: "50-Day SMA",
                sma_100: "100-Day SMA",
                sma_200: "200-Day SMA",
                ema_20: "20-Day EMA",
                ema_100: "100-Day EMA",
                ema_200: "200-Day EMA",
            },
        },
        ema_100: {
            label: "100-Day Exponential Moving Average",
            category: "Moving Averages",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [
                "price",
                "sma_20",
                "sma_50",
                "sma_100",
                "sma_200",
                "ema_20",
                "ema_50",
                "ema_200",
            ],
            valueLabels: {
                price: "Stock Price",
                sma_20: "20-Day SMA",
                sma_50: "50-Day SMA",
                sma_100: "100-Day SMA",
                sma_200: "200-Day SMA",
                ema_20: "20-Day EMA",
                ema_50: "50-Day EMA",
                ema_200: "200-Day EMA",
            },
        },
        ema_200: {
            label: "200-Day Exponential Moving Average",
            category: "Moving Averages",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [
                "price",
                "sma_20",
                "sma_50",
                "sma_100",
                "sma_200",
                "ema_20",
                "ema_50",
                "ema_100",
            ],
            valueLabels: {
                price: "Stock Price",
                sma_20: "20-Day SMA",
                sma_50: "50-Day SMA",
                sma_100: "100-Day SMA",
                sma_200: "200-Day SMA",
                ema_20: "20-Day EMA",
                ema_50: "50-Day EMA",
                ema_100: "100-Day EMA",
            },
        },
        macd: {
            label: "MACD",
            category: "Momentum",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: ["macd_signal", 0],
            valueLabels: {
                macd_signal: "MACD Signal Line",
                0: "Zero Line",
            },
        },
        atr: {
            label: "ATR (Average True Range)",
            category: "Volatility",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: 2,
            min: 0,
            max: 50,
        },
        bb_upper: {
            label: "Bollinger Upper Band",
            category: "Volatility",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: ["price", "bb_middle", "bb_lower"],
            valueLabels: {
                price: "Stock Price",
                bb_middle: "Bollinger Middle Band",
                bb_lower: "Bollinger Lower Band",
            },
        },
        bb_middle: {
            label: "Bollinger Middle Band",
            category: "Volatility",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: ["price", "bb_upper", "bb_lower"],
            valueLabels: {
                price: "Stock Price",
                bb_upper: "Bollinger Upper Band",
                bb_lower: "Bollinger Lower Band",
            },
        },
        bb_lower: {
            label: "Bollinger Lower Band",
            category: "Volatility",
            operators: ["above", "below"],
            defaultOperator: "below",
            defaultValue: ["price", "bb_upper", "bb_middle"],
            valueLabels: {
                price: "Stock Price",
                bb_upper: "Bollinger Upper Band",
                bb_middle: "Bollinger Middle Band",
            },
        },
        stoch_k: {
            label: "Stochastic %K",
            category: "Momentum",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: 20,
            min: 0,
            max: 100,
        },
        stoch_d: {
            label: "Stochastic %D",
            category: "Momentum",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: 20,
            min: 0,
            max: 100,
        },
        stoch_crossover: {
            label: "Stochastic Crossover (%K - %D)",
            category: "Momentum",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: 0,
            min: -100,
            max: 100,
        },
        stoch_k_oversold: {
            label: "Stochastic %K Oversold Level",
            category: "Momentum",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: ["stoch_k"],
            valueLabels: {
                stoch_k: "Stochastic %K",
            },
        },
        stoch_k_overbought: {
            label: "Stochastic %K Overbought Level",
            category: "Momentum",
            operators: ["above", "below"],
            defaultOperator: "below",
            defaultValue: ["stoch_k"],
            valueLabels: {
                stoch_k: "Stochastic %K",
            },
        },
        stoch_d_oversold: {
            label: "Stochastic %D Oversold Level",
            category: "Momentum",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: ["stoch_d"],
            valueLabels: {
                stoch_d: "Stochastic %D",
            },
        },
        stoch_d_overbought: {
            label: "Stochastic %D Overbought Level",
            category: "Momentum",
            operators: ["above", "below"],
            defaultOperator: "below",
            defaultValue: ["stoch_d"],
            valueLabels: {
                stoch_d: "Stochastic %D",
            },
        },
        obv: {
            label: "On-Balance Volume (OBV)",
            category: "Volume",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [
                "obv_sma_5",
                "obv_sma_10",
                "obv_sma_20",
                "obv_sma_50",
            ],
            valueLabels: {
                obv_sma_5: "OBV 5-Day SMA",
                obv_sma_10: "OBV 10-Day SMA",
                obv_sma_20: "OBV 20-Day SMA",
                obv_sma_50: "OBV 50-Day SMA",
            },
        },
        volume: {
            label: "Volume",
            category: "Volume",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: ["volume_ma"],
            valueLabels: {
                volume_ma: "20-Day Volume Average",
            },
        },
        volume_ma: {
            label: "20-Day Volume Average",
            category: "Volume",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: ["volume"],
            valueLabels: {
                volume: "Current Volume",
            },
        },
        cci: {
            label: "Commodity Channel Index (CCI)",
            category: "Momentum",
            operators: ["above", "below"],
            defaultOperator: "below",
            defaultValue: [-200, -100, -50, 0, 50, 100, 200],
            valueLabels: {
                [-200]: "CCI -200 (Extremely Oversold)",
                [-100]: "CCI -100 (Oversold)",
                [-50]: "CCI -50 (Weak)",
                [0]: "CCI Zero Line",
                [50]: "CCI +50 (Strong)",
                [100]: "CCI +100 (Overbought)",
                [200]: "CCI +200 (Extremely Overbought)",
            },
        },
        vwap: {
            label: "Volume Weighted Average Price (VWAP)",
            category: "Volume",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [
                "price",
                "sma_20",
                "sma_50",
                "sma_100",
                "sma_200",
                "ema_20",
                "ema_50",
                "ema_100",
                "ema_200",
            ],
            valueLabels: {
                price: "Current Price",
                sma_20: "20-Day SMA",
                sma_50: "50-Day SMA",
                sma_100: "100-Day SMA",
                sma_200: "200-Day SMA",
                ema_20: "20-Day EMA",
                ema_50: "50-Day EMA",
                ema_100: "100-Day EMA",
                ema_200: "200-Day EMA",
            },
        },
        williams_r: {
            label: "Williams %R",
            category: "Momentum",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [-80, -50, -20, 0],
            valueLabels: {
                "-80": "Oversold Level (-80)",
                "-50": "Midline (-50)",
                "-20": "Overbought Level (-20)",
                "0": "Zero Line",
            },
        },
        mfi: {
            label: "Money Flow Index (MFI)",
            category: "Volume",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [20, 30, 50, 70, 80],
            valueLabels: {
                "20": "Oversold Level (20)",
                "30": "Buy Level (30)",
                "50": "Midline (50)",
                "70": "Sell Level (70)",
                "80": "Overbought Level (80)",
            },
        },
        parabolic_sar: {
            label: "Parabolic SAR",
            category: "Trend",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: ["price"],
            valueLabels: {
                price: "Current Price",
            },
        },
        donchian_upper: {
            label: "Donchian Upper Channel",
            category: "Volatility",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: ["price", "donchian_middle", "donchian_lower"],
            valueLabels: {
                price: "Current Price",
                donchian_middle: "Donchian Middle",
                donchian_lower: "Donchian Lower",
            },
        },
        donchian_middle: {
            label: "Donchian Middle Channel",
            category: "Volatility",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: ["price", "donchian_upper", "donchian_lower"],
            valueLabels: {
                price: "Current Price",
                donchian_upper: "Donchian Upper",
                donchian_lower: "Donchian Lower",
            },
        },
        donchian_lower: {
            label: "Donchian Lower Channel",
            category: "Volatility",
            operators: ["above", "below"],
            defaultOperator: "below",
            defaultValue: ["price", "donchian_upper", "donchian_middle"],
            valueLabels: {
                price: "Current Price",
                donchian_upper: "Donchian Upper",
                donchian_middle: "Donchian Middle",
            },
        },
        std: {
            label: "Price Standard Deviation",
            category: "Volatility",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0],
            valueLabels: {
                "0.5": "Low Volatility (0.5)",
                "1": "Normal Volatility (1.0)",
                "1.5": "Moderate Volatility (1.5)",
                "2": "High Volatility (2.0)",
                "2.5": "Very High Volatility (2.5)",
                "3": "Extreme Volatility (3.0)",
            },
        },
        hist_vol: {
            label: "Historical Volatility",
            category: "Volatility",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5],
            valueLabels: {
                "0.1": "Very Low Volatility (10%)",
                "0.15": "Low Volatility (15%)",
                "0.2": "Normal Volatility (20%)",
                "0.25": "Moderate Volatility (25%)",
                "0.3": "High Volatility (30%)",
                "0.4": "Very High Volatility (40%)",
                "0.5": "Extreme Volatility (50%)",
            },
        },
        chaikin_vol: {
            label: "Chaikin Volatility",
            category: "Volatility",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [-20, -10, 0, 10, 20, 30, 50],
            valueLabels: {
                "-20": "Decreasing Volatility (-20%)",
                "-10": "Slightly Decreasing (-10%)",
                "0": "Neutral (0%)",
                "10": "Slightly Increasing (10%)",
                "20": "Increasing Volatility (20%)",
                "30": "High Increasing (30%)",
                "50": "Very High Increasing (50%)",
            },
        },
        pivot: {
            label: "Pivot Point",
            category: "Support/Resistance",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [
                "price",
                "pivot_s1",
                "pivot_s2",
                "pivot_r1",
                "pivot_r2",
            ],
            valueLabels: {
                price: "Current Price",
                pivot_s1: "Support 1 (S1)",
                pivot_s2: "Support 2 (S2)",
                pivot_r1: "Resistance 1 (R1)",
                pivot_r2: "Resistance 2 (R2)",
            },
        },
        pivot_s1: {
            label: "Pivot Support 1 (S1)",
            category: "Support/Resistance",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: ["price", "pivot", "pivot_s2", "pivot_r1"],
            valueLabels: {
                price: "Current Price",
                pivot: "Pivot Point",
                pivot_s2: "Support 2 (S2)",
                pivot_r1: "Resistance 1 (R1)",
            },
        },
        pivot_r1: {
            label: "Pivot Resistance 1 (R1)",
            category: "Support/Resistance",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: ["price", "pivot", "pivot_s1", "pivot_r2"],
            valueLabels: {
                price: "Current Price",
                pivot: "Pivot Point",
                pivot_s1: "Support 1 (S1)",
                pivot_r2: "Resistance 2 (R2)",
            },
        },
        fib_618: {
            label: "Fibonacci 61.8% Retracement",
            category: "Support/Resistance",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: ["price", "fib_382", "fib_500", "fib_786"],
            valueLabels: {
                price: "Current Price",
                fib_382: "Fibonacci 38.2%",
                fib_500: "Fibonacci 50.0%",
                fib_786: "Fibonacci 78.6%",
            },
        },
        fib_382: {
            label: "Fibonacci 38.2% Retracement",
            category: "Support/Resistance",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: ["price", "fib_236", "fib_500", "fib_618"],
            valueLabels: {
                price: "Current Price",
                fib_236: "Fibonacci 23.6%",
                fib_500: "Fibonacci 50.0%",
                fib_618: "Fibonacci 61.8%",
            },
        },
        psych_round_25: {
            label: "Psychological Levels ($25)",
            category: "Support/Resistance",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: ["price", "psych_round_10", "psych_round_50"],
            valueLabels: {
                price: "Current Price",
                psych_round_10: "Round $10 Levels",
                psych_round_50: "Round $50 Levels",
            },
        },
        psych_round_50: {
            label: "Psychological Levels ($50)",
            category: "Support/Resistance",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: ["price", "psych_round_25", "psych_round_10"],
            valueLabels: {
                price: "Current Price",
                psych_round_25: "Round $25 Levels",
                psych_round_10: "Round $10 Levels",
            },
        },
        roc: {
            label: "ROC (Rate of Change)",
            category: "Momentum",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [-10, -5, -2, 0, 2, 5, 10],
            valueLabels: {
                "-10": "Strong Downtrend (-10%)",
                "-5": "Moderate Downtrend (-5%)",
                "-2": "Weak Downtrend (-2%)",
                "0": "Zero Line (0%)",
                "2": "Weak Uptrend (2%)",
                "5": "Moderate Uptrend (5%)",
                "10": "Strong Uptrend (10%)",
            },
        },
        tsi: {
            label: "TSI (True Strength Index)",
            category: "Momentum",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [-50, -25, -10, 0, 10, 25, 50, "tsi_signal"],
            valueLabels: {
                "-50": "Strong Bearish (-50)",
                "-25": "Bearish (-25)",
                "-10": "Weak Bearish (-10)",
                "0": "Zero Line (0)",
                "10": "Weak Bullish (10)",
                "25": "Bullish (25)",
                "50": "Strong Bullish (50)",
                tsi_signal: "TSI Signal Line",
            },
        },
        tsi_signal: {
            label: "TSI Signal Line",
            category: "Momentum",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: ["tsi", -25, 0, 25],
            valueLabels: {
                tsi: "TSI Line",
                "-25": "Bearish Level (-25)",
                "0": "Zero Line (0)",
                "25": "Bullish Level (25)",
            },
        },
        aroon_up: {
            label: "Aroon Up",
            category: "Trend",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [0, 30, 50, 70, 100, "aroon_down"],
            valueLabels: {
                "0": "No Uptrend (0)",
                "30": "Weak Uptrend (30)",
                "50": "Moderate Uptrend (50)",
                "70": "Strong Uptrend (70)",
                "100": "Very Strong Uptrend (100)",
                aroon_down: "Aroon Down Line",
            },
        },
        aroon_down: {
            label: "Aroon Down",
            category: "Trend",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [0, 30, 50, 70, 100, "aroon_up"],
            valueLabels: {
                "0": "No Downtrend (0)",
                "30": "Weak Downtrend (30)",
                "50": "Moderate Downtrend (50)",
                "70": "Strong Downtrend (70)",
                "100": "Very Strong Downtrend (100)",
                aroon_up: "Aroon Up Line",
            },
        },
        aroon_oscillator: {
            label: "Aroon Oscillator",
            category: "Trend",
            operators: ["above", "below"],
            defaultOperator: "above",
            defaultValue: [-100, -50, -25, 0, 25, 50, 100],
            valueLabels: {
                "-100": "Strong Downtrend (-100)",
                "-50": "Moderate Downtrend (-50)",
                "-25": "Weak Downtrend (-25)",
                "0": "Neutral (0)",
                "25": "Weak Uptrend (25)",
                "50": "Moderate Uptrend (50)",
                "100": "Strong Uptrend (100)",
            },
        },
    };

    const popularStrategyList = [
        { key: "rsiOversold", label: "RSI Oversold" },
        { key: "macdBullish", label: "MACD Bullish Crossover" },
        { key: "goldenCross", label: "Golden Cross (50/200 SMA)" },
        { key: "movingAverageBounce", label: "Moving Average Bounce" },
    ];

    // Strategy definitions for popular strategies
    const strategyDefinitions = {
        rsiOversold: {
            buy: [
                {
                    indicator: "rsi",
                    operator: "below",
                    value: 30,
                    logicOperator: null,
                },
            ],
            sell: [
                {
                    indicator: "rsi",
                    operator: "above",
                    value: 70,
                    logicOperator: null,
                },
            ],
        },
        macdBullish: {
            buy: [
                {
                    indicator: "macd",
                    operator: "above",
                    value: "macd_signal",
                    logicOperator: "AND",
                },
                {
                    indicator: "macd",
                    operator: "above",
                    value: 0,
                    logicOperator: null,
                },
            ],
            sell: [
                {
                    indicator: "macd",
                    operator: "below",
                    value: "macd_signal",
                    logicOperator: null,
                },
            ],
        },

        goldenCross: {
            buy: [
                {
                    indicator: "sma_50",
                    operator: "above",
                    value: "sma_200",
                    logicOperator: "AND",
                },
                {
                    indicator: "price",
                    operator: "above",
                    value: "sma_50",
                    logicOperator: null,
                },
            ],
            sell: [
                {
                    indicator: "sma_50",
                    operator: "below",
                    value: "sma_200",
                    logicOperator: null,
                },
            ],
        },

        movingAverageBounce: {
            buy: [
                {
                    indicator: "price",
                    operator: "above",
                    value: "sma_20",
                    logicOperator: "AND",
                },
                {
                    indicator: "sma_20",
                    operator: "above",
                    value: "sma_50",
                    logicOperator: "AND",
                },
                {
                    indicator: "rsi",
                    operator: "above",
                    value: 50,
                    logicOperator: null,
                },
            ],
            sell: [
                {
                    indicator: "price",
                    operator: "below",
                    value: "sma_20",
                    logicOperator: "OR",
                },
                {
                    indicator: "rsi",
                    operator: "below",
                    value: 30,
                    logicOperator: null,
                },
            ],
        },
        vwapCross: {
            buy: [
                {
                    indicator: "price",
                    operator: "above",
                    value: "vwap",
                    logicOperator: null,
                },
            ],
            sell: [
                {
                    indicator: "price",
                    operator: "below",
                    value: "vwap",
                    logicOperator: null,
                },
            ],
        },
        williamsROversold: {
            buy: [
                {
                    indicator: "williams_r",
                    operator: "above",
                    value: -80,
                    logicOperator: null,
                },
            ],
            sell: [
                {
                    indicator: "williams_r",
                    operator: "below",
                    value: -20,
                    logicOperator: null,
                },
            ],
        },
        mfiMomentum: {
            buy: [
                {
                    indicator: "mfi",
                    operator: "above",
                    value: 30,
                    logicOperator: null,
                },
            ],
            sell: [
                {
                    indicator: "mfi",
                    operator: "above",
                    value: 70,
                    logicOperator: null,
                },
            ],
        },
        parabolicSARTrend: {
            buy: [
                {
                    indicator: "price",
                    operator: "above",
                    value: "parabolic_sar",
                    logicOperator: null,
                },
            ],
            sell: [
                {
                    indicator: "price",
                    operator: "below",
                    value: "parabolic_sar",
                    logicOperator: null,
                },
            ],
        },
        donchianBreakout: {
            buy: [
                {
                    indicator: "price",
                    operator: "above",
                    value: "donchian_upper",
                    logicOperator: null,
                },
            ],
            sell: [
                {
                    indicator: "price",
                    operator: "below",
                    value: "donchian_lower",
                    logicOperator: null,
                },
            ],
        },
        volatilityBreakout: {
            buy: [
                {
                    indicator: "std",
                    operator: "above",
                    value: 2.0,
                    logicOperator: null,
                },
            ],
            sell: [
                {
                    indicator: "std",
                    operator: "below",
                    value: 1.0,
                    logicOperator: null,
                },
            ],
        },
        pivotBounce: {
            buy: [
                {
                    indicator: "price",
                    operator: "above",
                    value: "pivot_s1",
                    logicOperator: null,
                },
            ],
            sell: [
                {
                    indicator: "price",
                    operator: "above",
                    value: "pivot_r1",
                    logicOperator: null,
                },
            ],
        },
        fibonacciRetracement: {
            buy: [
                {
                    indicator: "price",
                    operator: "above",
                    value: "fib_618",
                    logicOperator: null,
                },
            ],
            sell: [
                {
                    indicator: "price",
                    operator: "below",
                    value: "fib_382",
                    logicOperator: null,
                },
            ],
        },
        psychologicalLevels: {
            buy: [
                {
                    indicator: "price",
                    operator: "above",
                    value: "psych_round_25",
                    logicOperator: null,
                },
            ],
            sell: [
                {
                    indicator: "price",
                    operator: "below",
                    value: "psych_round_25",
                    logicOperator: null,
                },
            ],
        },
        lowVolatilityBreakout: {
            buy: [
                {
                    indicator: "hist_vol",
                    operator: "below",
                    value: 0.15,
                    logicOperator: null,
                },
            ],
            sell: [
                {
                    indicator: "hist_vol",
                    operator: "above",
                    value: 0.3,
                    logicOperator: null,
                },
            ],
        },
    };

    // Function to handle popular strategy selection
    function handleStrategySelection(strategyKey) {
        const strategy = strategyDefinitions[strategyKey];
        if (strategy) {
            // Generate unique IDs for each condition
            buyConditionBlocks = strategy.buy.map((condition, index) => ({
                ...condition,
                id: `block_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
                type: "condition",
            }));

            sellConditionBlocks = strategy.sell.map((condition, index) => ({
                ...condition,
                id: `block_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
                type: "condition",
            }));

            // Also update the buyConditions and sellConditions for backward compatibility
            buyConditions = buyConditionBlocks;
            sellConditions = sellConditionBlocks;
        }
    }

    // Function to collect and format all strategy data
    function updateStrategyData() {
        const formattedBuyConditions =
            formatConditionsForBacktesting(buyConditions);
        const formattedSellConditions =
            formatConditionsForBacktesting(sellConditions);

        strategyData = {
            tickers: selectedTickers,
            start_date: startDate,
            end_date: endDate,
            buy_condition: formattedBuyConditions,
            sell_condition: formattedSellConditions,
            initial_capital: initialCapital,
            commission: commissionFee,
            stop_loss: stopLossPercentage,
            profit_taker: profitTakerPercentage,
        };
    }

    // Convert conditions to backtesting format
    function formatConditionsForBacktesting(conditions) {
        return conditions.map((condition, index) => {
            // Ensure we have a name field
            if (!condition.name && !condition.indicator) {
                console.error(
                    "Missing name/indicator field in condition:",
                    condition,
                );
            }

            const formattedCondition = {
                name: condition.name || condition.indicator || "rsi", // Fallback to prevent API errors
                value: condition.value,
                operator: condition.operator,
            };

            // For moving averages comparing to other indicators, we need special handling
            const indicatorName = condition.name || condition.indicator;
            if (
                indicatorName === "sma_20" ||
                indicatorName === "sma_50" ||
                indicatorName === "sma_100" ||
                indicatorName === "sma_200" ||
                indicatorName === "ema_20" ||
                indicatorName === "ema_50" ||
                indicatorName === "ema_100" ||
                indicatorName === "ema_200"
            ) {
                // If the value is a string like "price", "sma_50", etc., keep it as is
                // If it's a number, convert appropriately
                if (typeof condition.value === "string") {
                    // Map the comparison target (e.g., "sma_200" -> "sma_200")
                    if (
                        condition.value.startsWith("sma") ||
                        condition.value.startsWith("ema")
                    ) {
                        formattedCondition.value = condition.value;
                    } else if (condition.value === "price") {
                        formattedCondition.value = "price";
                    } else {
                        formattedCondition.value = condition.value;
                    }
                }
            }

            // Add connector except for the last condition
            if (index < conditions.length - 1) {
                // Check for connector or logic field (might come from different sources)
                formattedCondition.connector =
                    condition.connector?.toUpperCase() ||
                    condition.logic?.toUpperCase() ||
                    "AND";
            }

            return formattedCondition;
        });
    }

    // Function to handle ticker input
    function handleTickerInput(event) {
        const value = event.target.value;
        selectedTickers = value
            .split(",")
            .map((ticker) => ticker.trim().toUpperCase())
            .filter((ticker) => ticker.length > 0);
    }

    // Get ticker string for display
    function getTickerString() {
        return selectedTickers.join(", ");
    }

    // Update strategy data whenever conditions change
    $: if (
        buyConditions ||
        sellConditions ||
        selectedTickers ||
        startDate ||
        endDate ||
        initialCapital ||
        commissionFee
    ) {
        updateStrategyData();
    }

    // Strategy blocks for the new block-based UI
    let buyConditionBlocks = [];
    let sellConditionBlocks = [];

    function updateTradePagination() {
        const dataSource = tradeHistorySource || [];
        const total = Math.ceil(
            (dataSource?.length || 0) / (tradeRowsPerPage || 1),
        );
        tradeTotalPages = total;

        if (total === 0) {
            tradeCurrentPage = 1;
            displayTradeHistory = [];
            return;
        }

        if (tradeCurrentPage > total) {
            tradeCurrentPage = total;
        }

        const startIndex = (tradeCurrentPage - 1) * tradeRowsPerPage;
        const endIndex = startIndex + tradeRowsPerPage;
        displayTradeHistory = dataSource.slice(startIndex, endIndex);
    }

    function goToTradePage(page) {
        if (page >= 1 && page <= tradeTotalPages) {
            tradeCurrentPage = page;
            updateTradePagination();
        }
    }

    function changeTradeRowsPerPage(newRowsPerPage) {
        tradeRowsPerPage = newRowsPerPage;
        tradeCurrentPage = 1;
        updateTradePagination();
        saveTradeRowsPerPage();
    }

    function saveTradeRowsPerPage() {
        if (!isBrowser) return;

        try {
            window.localStorage.setItem(
                TRADE_PAGINATION_KEY,
                String(tradeRowsPerPage),
            );
        } catch (e) {
            console.warn("Failed to save trade rows per page:", e);
        }
    }

    function loadTradeRowsPerPage() {
        if (!isBrowser) return;

        try {
            const savedRows = window.localStorage.getItem(TRADE_PAGINATION_KEY);
            if (
                savedRows &&
                tradeRowsPerPageOptions.includes(Number(savedRows))
            ) {
                tradeRowsPerPage = Number(savedRows);
            }
        } catch (e) {
            console.warn("Failed to load trade rows per page:", e);
        }
    }

    function scrollTradingHistoryToTop() {
        if (!isBrowser) return;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Strategy block handlers for the new block-based UI
    function handleBuyConditionChange(event) {
        buyConditionBlocks = event.detail.blocks;
        // Convert blocks back to legacy format for compatibility
        buyConditions = convertBlocksToConditions(buyConditionBlocks);
    }

    function handleSellConditionChange(event) {
        sellConditionBlocks = event.detail.blocks;
        // Convert blocks back to legacy format for compatibility
        sellConditions = convertBlocksToConditions(sellConditionBlocks);
    }

    function handleRunBacktest() {
        // Check if conditions are set before switching tabs
        if (
            buyConditionBlocks.length === 0 ||
            sellConditionBlocks.length === 0
        ) {
            // Show error toast (same as runBacktest function)
            toast?.error(
                "Please set up both buy and sell conditions before running backtest",
                {
                    style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
                },
            );
            return; // Don't switch tabs if validation fails
        }

        // Run the backtest and switch to results tab
        runBacktest();
        activeTab = "backtest";
    }

    function convertBlocksToConditions(blocks) {
        return blocks.map((block, index) => ({
            indicator: block.indicator,
            operator: block.operator,
            value: block.value,
            logic: block.logicOperator
                ? block.logicOperator.toLowerCase()
                : undefined,
            // Also preserve connector for API formatting
            connector: block.logicOperator
                ? block.logicOperator.toUpperCase()
                : index < blocks.length - 1
                  ? "AND"
                  : undefined,
        }));
    }

    function convertConditionsToBlocks(conditions) {
        if (!conditions || conditions.length === 0) return [];

        return conditions.map((condition, index) => ({
            id: `block_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
            type: "condition",
            indicator: condition.name || condition.indicator || "rsi", // Fallback to 'rsi' if undefined
            operator: condition.operator || "below",
            value: condition.value !== undefined ? condition.value : 30,
            logicOperator: condition.connector
                ? condition.connector.toUpperCase()
                : condition.logic
                  ? condition.logic.toUpperCase()
                  : index < conditions.length - 1
                    ? "AND"
                    : null,
        }));
    }

    // Generate plain English explanations
    function generatePlainEnglishExplanation(blocks, mode) {
        if (!blocks || blocks.length === 0) {
            return `No ${mode} conditions set.`;
        }

        const conditionTexts = blocks.map((block, index) => {
            let text = "";

            // Get readable indicator name
            const indicatorName =
                availableIndicators[block.indicator]?.label || block.indicator;

            // Convert operator to readable text
            let operatorText = "";
            switch (block.operator) {
                case "above":
                    operatorText = "is above";
                    break;
                case "below":
                    operatorText = "is below";
                    break;
                case "equals":
                    operatorText = "equals";
                    break;
                default:
                    operatorText = block.operator;
            }

            // Get readable value name (check if it should be translated using valueLabels)
            let valueText = block.value;
            if (
                typeof block.value === "string" &&
                availableIndicators[block.indicator]?.valueLabels
            ) {
                valueText =
                    availableIndicators[block.indicator].valueLabels[
                        block.value
                    ] || block.value;
            }

            text = `${indicatorName} ${operatorText} ${valueText}`;

            // Add logic connector for next condition
            if (block.logicOperator && index < blocks.length - 1) {
                text += ` ${block.logicOperator.toLowerCase()}`;
            }

            return text;
        });

        const action = mode === "buy" ? "Buy" : "Sell";
        return `${action} when ${conditionTexts.join(" ")}.`;
    }

    // Reactive statements for plain English explanations
    $: buyExplanation = generatePlainEnglishExplanation(
        buyConditionBlocks,
        "buy",
    );
    $: sellExplanation = generatePlainEnglishExplanation(
        sellConditionBlocks,
        "sell",
    );

    async function runBacktest() {
        if (
            buyConditionBlocks.length === 0 ||
            sellConditionBlocks.length === 0
        ) {
            toast?.error(
                "Please set up both buy and sell conditions before running backtest",
                {
                    style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
                },
            );

            return;
        }

        selectedTickers = [...new Set(selectedTickers)];

        // Validate number of symbols
        if (selectedTickers?.length > 10) {
            toast?.error(
                "Maximum 10 symbols allowed. Please remove some symbols.",
                {
                    style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
                },
            );
            return;
        }

        if (selectedTickers?.length === 0) {
            toast?.error("Please enter at least one symbol.", {
                style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
            });
            return;
        }

        // Validate date inputs
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            toast?.error("Please enter valid dates in YYYY-MM-DD format", {
                style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
            });
            return;
        }

        if (end < start) {
            toast?.error("End date cannot be earlier than start date", {
                style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
            });
            backtestResults = {};
            config = null;
            return;
        }

        // Validate initial capital
        if (
            typeof initialCapital !== "number" ||
            isNaN(initialCapital) ||
            initialCapital <= 0
        ) {
            toast?.error("Initial capital should be a positive number", {
                style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
            });
            return;
        }

        // Validate commission fee
        if (
            typeof commissionFee !== "number" ||
            isNaN(commissionFee) ||
            commissionFee < 0
        ) {
            toast?.error("Commission fee should be at least 0", {
                style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
            });
            return;
        }

        // Update strategyData before running backtest
        updateStrategyData();

        // Generate cache key for current strategy
        const cacheKey = generateCacheKey(strategyData);

        // Clear expired cache entries periodically
        clearExpiredCache();

        // Check if we have valid cached results
        const cachedEntry = backtestCache.get(cacheKey);
        if (cachedEntry && isCacheValid(cachedEntry)) {
            // Use cached results
            const output = cachedEntry.data;
            backtestResults = output;
            config = plotData();
            rawTradeHistory = output?.trade_history || [];
            tradeHistorySource = [...rawTradeHistory];
            tradeCurrentPage = 1;
            updateTradePagination();
            backtestError = null;

            return;
        }

        isBacktesting = true;
        backtestError = null;

        try {
            const postData = { strategyData: strategyData };
            const response = await fetch("/api/backtesting", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(postData),
            });

            const output = await response.json();
            if (output?.success) {
                // Store successful result in cache
                backtestCache.set(cacheKey, {
                    data: output,
                    timestamp: Date.now(),
                });

                backtestResults = output;
                config = plotData();
                rawTradeHistory = output?.trade_history || [];
                tradeHistorySource = [...rawTradeHistory];
                tradeCurrentPage = 1;
                updateTradePagination();
                backtestError = null;
            } else {
                backtestResults = {};
                config = null;
                backtestError =
                    output?.error ||
                    output?.message ||
                    "Backtesting failed. Please check your inputs and try again.";
            }
        } catch (error) {
            backtestError = "Failed to run backtest: " + error.message;
        } finally {
            isBacktesting = false;
        }
    }

    function plotData() {
        const dates =
            backtestResults?.plot_data?.spy_benchmark?.map(
                (item) => item.date,
            ) || [];
        const values =
            backtestResults?.plot_data?.strategy?.map(
                (item) => item.return_pct,
            ) || [];

        const benchmarkValues =
            backtestResults?.plot_data?.spy_benchmark?.map(
                (item) => item.return_pct,
            ) || [];
        const fillColorStart = "rgb(70, 129, 244,0.5)";
        const fillColorEnd = "rgb(70, 129, 244,0.001)";

        const options = {
            credits: {
                enabled: false,
            },
            chart: {
                backgroundColor: $mode === "light" ? "#fff" : "#09090B",
                plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
                height: 360,
                width: "auto",
            },
            title: {
                text: null,
                style: {
                    color: $mode === "light" ? "black" : "white",
                    // Using inline CSS for margin-top and margin-bottom
                },
                useHTML: true, // Enable HTML to apply custom class styling
            },
            xAxis: {
                type: "datetime",
                endOnTick: false,
                categories: dates,
                crosshair: {
                    color: $mode === "light" ? "black" : "white", // Set the color of the crosshair line
                    width: 1, // Adjust the line width as needed
                    dashStyle: "Solid",
                },
                labels: {
                    style: {
                        color: $mode === "light" ? "#545454" : "white",
                    },
                    distance: 10, // Increases space between label and axis
                    formatter: function () {
                        const date = new Date(this.value);
                        return date.toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                        });
                    },
                },
                tickPositioner: function () {
                    // Create custom tick positions with wider spacing
                    const positions = [];
                    const info = this.getExtremes();
                    const tickCount = 5; // Reduce number of ticks displayed
                    const interval = Math.floor(
                        (info.max - info.min) / tickCount,
                    );

                    for (let i = 0; i <= tickCount; i++) {
                        positions.push(info.min + i * interval);
                    }
                    return positions;
                },
            },
            yAxis: {
                gridLineWidth: 1,
                gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
                labels: {
                    style: { color: $mode === "light" ? "#545454" : "white" },
                },
                title: { text: null },
                opposite: true,
            },
            tooltip: {
                shared: true,
                useHTML: true,
                backgroundColor: "rgba(0, 0, 0, 1)", // Semi-transparent black
                borderColor: "rgba(255, 255, 255, 0.2)", // Slightly visible white border
                borderWidth: 1,
                style: {
                    color: "#fff",
                    fontSize: "16px",
                    padding: "10px",
                },
                borderRadius: 4,
                formatter: function () {
                    // Format the x value to display time in a custom format
                    let tooltipContent = `<span class="m-auto text-[1rem] font-[501]">${new Date(
                        this?.x,
                    ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                    })}</span><br>`;

                    // Loop through each point in the shared tooltip
                    this.points.forEach((point) => {
                        tooltipContent += `
        <span class="font-semibold text-sm">${point.series.name}:</span> 
        <span class="font-normal text-sm">${point.y?.toLocaleString("en-US")}%</span><br>`;
                    });

                    return tooltipContent;
                },
            },

            plotOptions: {
                series: {
                    color: "white",
                    animation: false, // Disable series animation
                    states: {
                        hover: {
                            enabled: false, // Disable hover effect globally
                        },
                    },
                },
            },
            legend: {
                enabled: false,
            },
            series: [
                {
                    name: "Cumulative Returns",
                    type: "area",
                    data: values,
                    color: "#4681f4",
                    lineWidth: 1.2,
                    marker: {
                        enabled: false,
                    },
                    fillColor: {
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        stops: [
                            [0, fillColorStart],
                            [1, fillColorEnd],
                        ],
                    },
                },
                {
                    name: "SPY Returns",
                    type: "area",
                    data: benchmarkValues,
                    color: "#ff4d4d", // solid red for the line
                    lineWidth: 1.2,
                    marker: {
                        enabled: false,
                    },
                    fillColor: {
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        stops: [
                            [0, "rgba(255, 77, 77, 0.5)"], // soft red start
                            [1, "rgba(255, 77, 77, 0.001)"], // fade to transparent
                        ],
                    },
                },
            ],
        };

        return options;
    }

    $: columns = [
        { key: "date", label: "Transaction Date", align: "left" },
        { key: "symbol", label: "Symbol", align: "right" },
        { key: "action", label: "Action", align: "right" },
        { key: "shares", label: "Shares", align: "right" },
        { key: "price", label: "Price", align: "right" },
        { key: "net_amount", label: "Profit/Loss", align: "right" },
        { key: "commission", label: "Commisssion", align: "right" },
        { key: "return_pct", label: "Trade Return", align: "right" },
        { key: "portfolio_value", label: "Portfolio Value", align: "right" },
    ];

    let sortOrders = {
        date: { order: "none", type: "date" },
        symbol: { order: "none", type: "string" },
        action: { order: "none", type: "string" },
        shares: { order: "none", type: "number" },
        price: { order: "none", type: "number" },
        net_amount: { order: "none", type: "number" },
        commission: { order: "none", type: "number" },
        return_pct: { order: "none", type: "number" },
        portfolio_value: { order: "none", type: "number" },
    };

    const sortData = (key) => {
        // Reset all other keys to 'none' except the current key
        for (const k in sortOrders) {
            if (k !== key) {
                sortOrders[k].order = "none";
            }
        }

        // Cycle through 'none', 'asc', 'desc' for the clicked key
        const orderCycle = ["none", "asc", "desc"];

        const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
        sortOrders[key].order =
            orderCycle[(currentOrderIndex + 1) % orderCycle.length];
        const sortOrder = sortOrders[key].order;

        // Reset to original data when 'none' and stop further sorting
        if (sortOrder === "none") {
            tradeHistorySource = [...rawTradeHistory];
            tradeCurrentPage = 1;
            updateTradePagination();
            return;
        }

        // Define a generic comparison function
        const compareValues = (a, b) => {
            const { type } = sortOrders[key];
            let valueA;
            let valueB;

            switch (type) {
                case "date": {
                    const rawA = a?.[key]
                        ? new Date(a[key]).getTime()
                        : Number.NaN;
                    const rawB = b?.[key]
                        ? new Date(b[key]).getTime()
                        : Number.NaN;
                    const fallbackAsc = Number.POSITIVE_INFINITY;
                    const fallbackDesc = Number.NEGATIVE_INFINITY;
                    valueA = Number.isFinite(rawA)
                        ? rawA
                        : sortOrder === "asc"
                          ? fallbackAsc
                          : fallbackDesc;
                    valueB = Number.isFinite(rawB)
                        ? rawB
                        : sortOrder === "asc"
                          ? fallbackAsc
                          : fallbackDesc;
                    break;
                }
                case "string": {
                    valueA = (a?.[key] ?? "").toString().toUpperCase();
                    valueB = (b?.[key] ?? "").toString().toUpperCase();
                    return sortOrder === "asc"
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);
                }
                case "number":
                default: {
                    const rawA =
                        typeof a?.[key] === "number"
                            ? a[key]
                            : parseFloat(a?.[key]);
                    const rawB =
                        typeof b?.[key] === "number"
                            ? b[key]
                            : parseFloat(b?.[key]);
                    const fallbackAsc = Number.POSITIVE_INFINITY;
                    const fallbackDesc = Number.NEGATIVE_INFINITY;
                    valueA = Number.isFinite(rawA)
                        ? rawA
                        : sortOrder === "asc"
                          ? fallbackAsc
                          : fallbackDesc;
                    valueB = Number.isFinite(rawB)
                        ? rawB
                        : sortOrder === "asc"
                          ? fallbackAsc
                          : fallbackDesc;
                    break;
                }
            }

            if (sortOrder === "asc") {
                return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
            } else {
                return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
            }
        };

        // Sort using the generic comparison function
        tradeHistorySource = [...rawTradeHistory].sort(compareValues);
        tradeCurrentPage = 1;
        updateTradePagination();
    };

    onMount(async () => {
        if (!data?.user) {
            LoginPopup = (await import("$lib/components/LoginPopup.svelte"))
                .default;
        }

        loadTradeRowsPerPage();
        updateTradePagination();

        // Initialize blocks from initial conditions
        if (buyConditions.length > 0) {
            buyConditionBlocks = convertConditionsToBlocks(buyConditions);
        }
        if (sellConditions.length > 0) {
            sellConditionBlocks = convertConditionsToBlocks(sellConditions);
        }

        return () => {};
    });

    onDestroy(() => {
        // Clear all cache when leaving the page
        clearAllCache();
    });

    function initializeToDefaults() {
        // Reset to default values
        selectedTickers = ["NVDA"];
        startDate = "2015-01-01";
        endDate = new Date().toISOString().split("T")[0];
        buyConditions = [];
        sellConditions = [];
        initialCapital = 100000;
        commissionFee = 0.5;

        // Reset blocks to empty - user starts with clean slate
        buyConditionBlocks = [];
        sellConditionBlocks = [];

        // Clear any previous backtest results
        backtestResults = {};
        config = null;
        backtestError = null;
        strategyData = {};
        rawTradeHistory = [];
        tradeHistorySource = [];
        displayTradeHistory = [];
        tradeCurrentPage = 1;
        tradeTotalPages = 0;
        updateTradePagination();

        // Switch to buy tab to start fresh
        activeTab = "buy";
    }

    async function switchStrategy(item) {
        activeTab = "buy";
        selectedStrategy = item?.id ?? "";

        strategyData =
            strategyList?.find((item) => item.id === selectedStrategy)?.rules ??
            [];

        rawTradeHistory = [];
        tradeHistorySource = [];
        displayTradeHistory = [];
        tradeCurrentPage = 1;
        tradeTotalPages = 0;
        updateTradePagination();

        selectedTickers = strategyData?.tickers || ["NVDA"];
        startDate = strategyData?.start_date || "2015-01-01";
        endDate =
            strategyData?.end_date || new Date().toISOString().split("T")[0];
        buyConditions = strategyData?.buy_condition || [];
        sellConditions = strategyData?.sell_condition || [];
        initialCapital = strategyData?.initial_capital || 100000;
        commissionFee = strategyData?.commission || 0.5; // Default 0.

        // Reset and reinitialize the blocks for UI display
        buyConditionBlocks = [];
        sellConditionBlocks = [];

        // Convert conditions to blocks after a short delay to trigger reactive updates
        setTimeout(() => {
            if (buyConditions.length > 0) {
                buyConditionBlocks = convertConditionsToBlocks(buyConditions);
            }
            if (sellConditions.length > 0) {
                sellConditionBlocks = convertConditionsToBlocks(sellConditions);
            }
        }, 10);

        // Clear any previous backtest results
        backtestResults = {};
        config = null;
        backtestError = null;
    }

    async function handleSave(showMessage) {
        if (!data?.user) return;

        if (!["Plus", "Pro"]?.includes(data?.user?.tier)) {
            goto("/pricing");
            return;
        }

        if (strategyList?.length === 0) {
            handleCreateStrategy();
        }

        if (strategyList?.length > 0) {
            // update local strategyList
            strategyList.find((item) => item.id === selectedStrategy).rules =
                strategyData;

            const postData = {
                strategyId: selectedStrategy,
                rules: strategyData,
                type: "backtesting",
            };

            const savePromise = (async () => {
                const response = await fetch("/api/save-strategy", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(postData),
                });
                if (!response.ok) {
                    throw new Error(`Server responded with ${response.status}`);
                }
                return response;
            })();

            if (showMessage) {
                return toast.promise(savePromise, {
                    loading: "Saving backtest...",
                    success: "Backtest saved!",
                    error: "Save failed. Please try again.",
                    style: `
            border-radius: 5px;
            background: #fff;
            color: #000;
            border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"};
            font-size: 15px;
          `,
                });
            } else {
                // just await without toast
                await savePromise;
            }
        }
    }

    async function handleCreateStrategy() {
        if (["Pro", "Plus"]?.includes(data?.user?.tier)) {
            const closePopup = document.getElementById("addStrategy");
            closePopup?.dispatchEvent(new MouseEvent("click"));
        } else {
            goto("/pricing");
        }
    }

    async function createStrategy(event) {
        event.preventDefault();

        const firstStrategy = strategyList?.length === 0;

        const formData = new FormData(event.target);
        formData.append("user", data?.user?.id);
        formData.append("rules", "[]");
        let title = formData.get("title");

        if (!title || title.length === 0) {
            title = "My Backtest";
        }

        if (title?.length > 100) {
            toast.error(
                "Title is too long. Please keep it under 100 characters.",
                {
                    style: `
        border-radius: 5px;
        background: #fff;
        color: #000;
        border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"};
        font-size: 15px;
      `,
                },
            );
            return;
        }

        // build postData object
        const postData = { type: "backtesting" };
        for (const [key, value] of formData.entries()) {
            postData[key] = value;
        }

        // wrap the fetch + response check + state updates in a promise
        const createPromise = (async () => {
            const response = await fetch("/api/create-strategy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(postData),
            });

            if (!response.ok) {
                throw new Error(`Network error: ${response.status}`);
            }

            const output = await response.json();
            if (!output?.id) {
                throw new Error("Server did not return a new strategy ID");
            }

            // ——— SUCCESS: run your existing post-create logic ———
            toast.success("Backtest created successfully!", {
                style: `
        border-radius: 5px;
        background: #fff;
        color: #000;
        border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"};
        font-size: 15px;
      `,
            });

            // close modal
            const closePopup = document.getElementById("addStrategy");
            closePopup?.dispatchEvent(new MouseEvent("click"));

            selectedStrategy = output.id;
            strategyList?.unshift(output);

            if (!firstStrategy) {
                initializeToDefaults();
            }

            await handleSave(false);
            title = "";
            return output;
        })();

        // show loading / success / error around the whole operation
        return toast.promise(createPromise, {
            loading: "Creating backtest...",
            success: () => "", // we already show success inside the promise
            error: "Something went wrong. Please try again later!",
            style: `
        border-radius: 5px;
        background: #fff;
        color: #000;
        border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"};
        font-size: 15px;
      `,
        });
    }

    async function handleDeleteStrategy() {
        const deletePromise = (async () => {
            const postData = {
                strategyId: selectedStrategy,
                type: "backtesting",
            };

            const response = await fetch("/api/delete-strategy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(postData),
            });

            if (!response.ok) {
                throw new Error(`Network error: ${response.status}`);
            }

            const output = await response.json();
            if (output !== "success") {
                throw new Error("Server returned failure");
            }

            // Remove the deleted strategy from the list
            strategyList =
                strategyList?.filter((item) => item.id !== selectedStrategy) ??
                [];

            // Check if there are any strategies left
            console.log(
                "Strategies remaining after deletion:",
                strategyList.length,
            );

            if (strategyList.length > 0) {
                // Switch to the first available strategy
                const nextStrategy = strategyList[0];
                console.log("Switching to next strategy:", nextStrategy);
                switchStrategy(nextStrategy);
            } else {
                // No strategies left, initialize to defaults
                console.log("No strategies left, initializing to defaults");
                selectedStrategy = "";
                initializeToDefaults();
            }

            // return something if you need to chain further
            return true;
        })();

        return toast?.promise(deletePromise, {
            loading: "Deleting backtest…",
            success: "Backtest deleted successfully!",
            error: "Delete failed. Please try again.",
            style: `
        border-radius: 5px;
        background: #fff;
        color: #000;
        border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"};
        font-size: 15px;
      `,
        });
    }
</script>

<SEO
    title="Stock Backtesting Tool"
    description="Build and backtest trading strategies without coding. Create custom strategies with technical indicators, screen stocks, run historical backtests, and optimize entries/exits with our free backtesting platform."
    keywords="stock backtesting, trading strategy backtesting, no-code backtesting, strategy optimizer, trading strategy builder, historical backtesting, stock strategy testing, algorithmic trading, technical indicators backtesting"
    structuredData={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Stock Backtesting Tool",
        description:
            "No-code trading strategy backtesting and optimization platform",
        url: "https://stocknear.com/backtesting",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Any",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
        },
        featureList: [
            "No-code strategy builder",
            "Historical backtesting",
            "Technical indicators",
            "Stock screening",
            "Portfolio optimization",
            "Performance analytics",
            "Risk metrics",
            "Trade history analysis",
        ],
        softwareRequirements: "Web Browser",
    }}
/>

<section
    class="w-full max-w-3xl sm:max-w-(--breakpoint-xl) overflow-hidden min-h-screen pb-40 px-5 pt-4"
>
    <div class="text-sm sm:text-[1rem] breadcrumbs">
        <ul>
            <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
            <li>
                <span class="text-muted dark:text-gray-300">Backtesting</span>
            </li>
        </ul>
    </div>

    <!--Start Build Strategy-->
    <div class="sm:rounded">
        <div class="flex flex-col md:flex-row items-start md:items-center mb-5">
            <div class="w-full flex flex-row items-center sm:mt-4">
                <h1 class=" text-3xl font-semibold">Backtesting Strategy</h1>
            </div>

            <div class="flex flex-row items-center w-full mt-5">
                <div
                    class="flex w-full sm:w-[50%] md:block md:w-auto sm:ml-auto"
                >
                    <div
                        class="hidden text-sm sm:text-[1rem] font-semibold md:block sm:mb-1"
                    >
                        Popular Strategies
                    </div>
                    <div class="relative inline-block text-left grow">
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild let:builder>
                                <Button
                                    builders={[builder]}
                                    class="w-full border border-gray-300 dark:border-gray-600 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary  ease-out flex flex-row justify-between items-center px-3 py-2  rounded truncate"
                                >
                                    <span class="truncate">Select Popular</span>
                                    <svg
                                        class="-mr-1 ml-1 h-5 w-5 xs:ml-2 inline-block"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        style="max-width:40px"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                            clip-rule="evenodd"
                                        ></path>
                                    </svg>
                                </Button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content
                                side="bottom"
                                align="end"
                                sideOffset={10}
                                alignOffset={0}
                                class="w-56 h-fit max-h-72 overflow-y-auto scroller"
                            >
                                <DropdownMenu.Group>
                                    {#each popularStrategyList as item}
                                        <DropdownMenu.Item
                                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                                            on:click={() =>
                                                handleStrategySelection(
                                                    item.key,
                                                )}
                                        >
                                            {item?.label}
                                        </DropdownMenu.Item>
                                    {/each}
                                </DropdownMenu.Group>
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    </div>
                </div>

                <div
                    class="flex w-full sm:w-[50%] sm:ml-3 md:block md:w-auto ml-3"
                >
                    <div
                        class="hidden text-sm sm:text-[1rem] font-semibold md:block sm:mb-1"
                    >
                        Saved Backtest
                    </div>
                    <div class="relative inline-block text-left grow">
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild let:builder>
                                <Button
                                    builders={[builder]}
                                    class="min-w-[110px]  w-full border border-gray-300 dark:border-gray-600 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary ease-out flex flex-row justify-between items-center px-3 py-2  rounded truncate"
                                >
                                    <span class="truncate max-w-48"
                                        >{selectedStrategy?.length !== 0
                                            ? strategyList?.find(
                                                  (item) =>
                                                      item.id ===
                                                      selectedStrategy,
                                              )?.title
                                            : "Select Strategy"}</span
                                    >
                                    <svg
                                        class="-mr-1 ml-1 h-5 w-5 xs:ml-2 inline-block"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        style="max-width:40px"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                            clip-rule="evenodd"
                                        ></path>
                                    </svg>
                                </Button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content
                                side="bottom"
                                align="end"
                                sideOffset={10}
                                alignOffset={0}
                                class="w-full max-w-56 h-fit max-h-72 overflow-y-auto scroller"
                            >
                                <DropdownMenu.Label
                                    class="text-muted dark:text-gray-400 font-normal"
                                >
                                    <DropdownMenu.Trigger asChild let:builder>
                                        <Button
                                            on:click={() => {
                                                handleCreateStrategy();
                                            }}
                                            builders={[builder]}
                                            class="p-0 -mb-2 -mt-2 text-sm inline-flex cursor-pointer items-center justify-center space-x-1 whitespace-nowrap   bg-[#0909B] focus:outline-hidden "
                                        >
                                            <svg
                                                class="h-4 w-4"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                                style="max-width:40px"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    fill-rule="evenodd"
                                                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                                    clip-rule="evenodd"
                                                ></path>
                                            </svg>
                                            <div class="text-sm text-start">
                                                New Backtest
                                            </div>
                                        </Button>
                                    </DropdownMenu.Trigger>
                                </DropdownMenu.Label>
                                <DropdownMenu.Separator />
                                <DropdownMenu.Group>
                                    {#each strategyList as item}
                                        <DropdownMenu.Item
                                            on:click={(e) => {
                                                e.preventDefault();
                                                switchStrategy(item);
                                            }}
                                            class=" {item?.id ===
                                            selectedStrategy
                                                ? 'bg-gray-300 dark:bg-primary'
                                                : ''} cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                                        >
                                            {item?.title?.length > 20
                                                ? item?.title?.slice(0, 20) +
                                                  "..."
                                                : item?.title}

                                            <label
                                                for="deleteStrategy"
                                                class="ml-auto inline-block cursor-pointer sm:hover:text-red-500"
                                            >
                                                <svg
                                                    class="size-5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                    style="max-width:40px"
                                                    ><path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    ></path></svg
                                                >
                                            </label>
                                        </DropdownMenu.Item>
                                    {/each}
                                </DropdownMenu.Group>
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    </div>
                </div>
            </div>
        </div>

        <!--End Adding Rules-->
    </div>

    <!-- Strategy Configuration Tabs -->
    <div class=" bg-white dark:bg-default overflow-hidden">
        <Tabs.Root bind:value={activeTab} class="w-full">
            <!-- Enhanced Tab List with new nav style -->
            <nav
                class="border-[#2C6288] dark:border-white border-b-[2px] overflow-x-auto whitespace-nowrap"
            >
                <ul class="flex flex-row items-center w-full text-[1rem]">
                    <li>
                        <button
                            class="p-2 px-5 cursor-pointer {activeTab === 'buy'
                                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                            on:click={() => (activeTab = "buy")}
                        >
                            Buy Conditions
                        </button>
                    </li>
                    <li>
                        <button
                            class="p-2 px-5 cursor-pointer {activeTab === 'sell'
                                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                            on:click={() => (activeTab = "sell")}
                        >
                            Sell Conditions
                        </button>
                    </li>
                    <li>
                        <button
                            class="p-2 px-5 cursor-pointer {activeTab === 'risk'
                                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                            on:click={() => (activeTab = "risk")}
                        >
                            Risk
                        </button>
                    </li>
                    <li>
                        <button
                            class="p-2 px-5 cursor-pointer {activeTab ===
                            'backtest'
                                ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                                : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                            on:click={() => (activeTab = "backtest")}
                        >
                            Backtesting
                        </button>
                    </li>
                </ul>
            </nav>

            <!-- Tab Content with Enhanced Styling -->
            <div class="mt-6">
                <!-- Buy Conditions Tab Content -->
                <Tabs.Content value="buy" class="outline-none">
                    <div class="space-y-4">
                        <StrategyBuilder
                            bind:strategyBlocks={buyConditionBlocks}
                            {availableIndicators}
                            mode="buy"
                            on:change={handleBuyConditionChange}
                            on:runBacktest={handleRunBacktest}
                        />
                    </div>
                </Tabs.Content>

                <!-- Sell Conditions Tab Content -->
                <Tabs.Content value="sell" class="outline-none">
                    <div class="space-y-4">
                        <StrategyBuilder
                            bind:strategyBlocks={sellConditionBlocks}
                            {availableIndicators}
                            mode="sell"
                            on:change={handleSellConditionChange}
                            on:runBacktest={handleRunBacktest}
                        />
                    </div>
                </Tabs.Content>

                <!-- Risk Management Tab Content -->
                <Tabs.Content value="risk" class="outline-none">
                    <div class="space-y-4">
                        <div class="">
                            <div
                                class="flex flex-col sm:flex-row justify-start w-full sm:justify-between items-start sm:items-center mb-4"
                            >
                                <h3
                                    class="text-lg font-semibold capitalize mb-5 sm:mb-0"
                                >
                                    Risk Management Settings
                                </h3>
                                <div class="flex gap-2 ml-auto sm:ml-0">
                                    <button
                                        class="cursor-pointer inline-flex items-center text-sm gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary ease-out rounded font-medium transition-colors"
                                        on:click={handleRunBacktest}
                                    >
                                        <svg
                                            class="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M13 10V3L4 14h7v7l9-11h-7z"
                                            />
                                        </svg>
                                        Run Backtest
                                    </button>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <!-- Stop Loss Section -->
                                <div class="space-y-3">
                                    <div class="flex items-center gap-2">
                                        <label class="font-medium"
                                            >Stop Loss (%)</label
                                        >
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <input
                                            type="number"
                                            bind:value={stopLossPercentage}
                                            min="0"
                                            max="100"
                                            step="0.5"
                                            placeholder="e.g., 5"
                                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-inherit focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        <span
                                            class="text-sm text-gray-600 dark:text-gray-400"
                                            >%</span
                                        >
                                    </div>
                                    <p
                                        class="text-xs text-gray-500 dark:text-gray-400"
                                    >
                                        Exit position if price drops by this
                                        percentage from entry
                                    </p>
                                </div>

                                <!-- Profit Taker Section -->
                                <div class="space-y-3">
                                    <div class="flex items-center gap-2">
                                        <label class="font-medium"
                                            >Profit Taker (%)</label
                                        >
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <input
                                            type="number"
                                            bind:value={profitTakerPercentage}
                                            min="0"
                                            max="1000"
                                            step="1"
                                            placeholder="e.g., 10"
                                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-inherit focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        <span
                                            class="text-sm text-gray-600 dark:text-gray-400"
                                            >%</span
                                        >
                                    </div>
                                    <p
                                        class="text-xs text-gray-500 dark:text-gray-400"
                                    >
                                        Exit position if price rises by this
                                        percentage from entry
                                    </p>
                                </div>
                            </div>

                            <div class="mt-6">
                                <div class="flex items-start">
                                    <div class="text-sm">
                                        <p class="font-medium mb-1">
                                            How Risk Management Works:
                                        </p>
                                        <ul
                                            class="list-disc space-y-1 text-xs sm:text-sm"
                                        >
                                            <li>
                                                Leave fields empty to disable
                                                risk management
                                            </li>
                                            <li>
                                                Stop loss will trigger when
                                                price falls below entry price
                                                minus percentage
                                            </li>
                                            <li>
                                                Profit taker will trigger when
                                                price rises above entry price
                                                plus percentage
                                            </li>
                                            <li>
                                                Risk management exits override
                                                strategy sell signals
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Tabs.Content>

                <!-- Backtesting Tab Content -->
                <Tabs.Content value="backtest" class="outline-none">
                    <div
                        class="flex flex-col sm:flex-row justify-between items-center mb-4"
                    >
                        <h3
                            class="text-lg font-semibold capitalize w-full mb-4 sm:mb-0"
                        >
                            Define Backtesting Settings
                        </h3>
                        <div class="w-full sm:ml-auto flex justify-end">
                            <label
                                for={!data?.user ? "userLogin" : ""}
                                on:click={() => {
                                    if (data?.user) {
                                        handleSave(true);
                                    }
                                }}
                                class=" cursor-pointer inline-flex items-center text-sm gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary ease-out rounded font-medium transition-colors"
                            >
                                <svg
                                    class="w-3.5 h-3.5 mr-0.5 inline-block cursor-pointer shrink-0"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 16 16"
                                    ><path
                                        fill="currentColor"
                                        d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327l4.898.696c.441.062.612.636.282.95l-3.522 3.356l.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"
                                    /></svg
                                >
                                <div>Save</div>
                            </label>

                            <button
                                on:click={runBacktest}
                                disabled={isBacktesting}
                                class=" cursor-pointer ml-3 inline-flex items-center text-sm gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary ease-out rounded font-medium transition-colors"
                            >
                                {#if isBacktesting}
                                    <svg
                                        class="w-4 h-4 animate-spin"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                    Running Backtest...
                                {:else}
                                    <svg
                                        class="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M13 10V3L4 14h7v7l9-11h-7z"
                                        />
                                    </svg>
                                    Run Backtest
                                {/if}
                            </button>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <!-- Backtest Configuration -->
                        <div class="bg-gray-100 dark:bg-[#2A2E39] p-3">
                            <div
                                class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4"
                            >
                                <div>
                                    <label
                                        class="block text-sm font-medium mb-2"
                                        >Symbols (comma-separated)</label
                                    >
                                    <input
                                        type="text"
                                        value={getTickerString()}
                                        on:input={handleTickerInput}
                                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-inherit focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm uppercase"
                                        placeholder="AAPL, MSFT, GOOGL"
                                    />
                                </div>
                                <div>
                                    <label
                                        class="block text-sm font-medium mb-2"
                                        >Start Date</label
                                    >
                                    <input
                                        type="text"
                                        bind:value={startDate}
                                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-inherit focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="YYYY-MM-DD"
                                    />
                                </div>
                                <div>
                                    <label
                                        class="block text-sm font-medium mb-2"
                                        >End Date</label
                                    >
                                    <input
                                        type="text"
                                        bind:value={endDate}
                                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-inherit focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="YYYY-MM-DD"
                                    />
                                </div>
                                <div>
                                    <label
                                        class="block text-sm font-medium mb-2"
                                        >Initial Capital</label
                                    >
                                    <input
                                        type="number"
                                        bind:value={initialCapital}
                                        min="1000"
                                        step="1000"
                                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-inherit focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label
                                        class="block text-sm font-medium mb-2"
                                        >Commission Fee (%)</label
                                    >
                                    <input
                                        type="number"
                                        bind:value={commissionFee}
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-inherit focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="0.5"
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- Error Display -->
                        {#if backtestError}
                            <div
                                class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4"
                            >
                                <div class="flex items-start gap-3">
                                    <svg
                                        class="w-5 h-5 text-red-500 mt-0.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <p
                                        class="text-red-700 dark:text-red-400 text-sm"
                                    >
                                        {backtestError}
                                    </p>
                                </div>
                            </div>
                        {/if}

                        <!-- Results Display -->
                        <!-- Performance Summary Cards -->
                        <div class="w-full">
                            <!-- Strategy Performance -->
                            {#if backtestResults?.period}
                                <p class="mb-2 text-sm italic">
                                    Trading Period between {backtestResults?.period}
                                </p>
                            {/if}
                            <h4 class="text-xl sm:text-xl font-semibold mb-5">
                                Performance Metrics
                            </h4>
                            <div
                                class="grid grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6"
                            >
                                <div class="">
                                    <h4
                                        class=" flex flex-row items-center w-fit"
                                    >
                                        Total Returns <InfoModal
                                            content={"Cumulative percentage return of your strategy from start to end of the backtest period."}
                                        />
                                    </h4>
                                    <p
                                        class="text-[1rem] sm:text-lg font-semibold"
                                    >
                                        {backtestResults?.total_return
                                            ? backtestResults?.total_return +
                                              "%"
                                            : "n/a"}
                                    </p>
                                </div>

                                <div class="">
                                    <h4
                                        class=" flex flex-row items-center w-fit"
                                    >
                                        Benchmark Returns <InfoModal
                                            content={"The SPY (S&P 500 ETF) return for the same period as your strategy, used as a market performance baseline."}
                                        />
                                    </h4>
                                    <p
                                        class="text-[1rem] sm:text-lg font-semibold"
                                    >
                                        {backtestResults?.spy_benchmark
                                            ?.spy_return
                                            ? backtestResults?.spy_benchmark
                                                  ?.spy_return + "%"
                                            : "n/a"}
                                    </p>
                                </div>

                                <div class="">
                                    <h4
                                        class=" flex flex-row items-center w-fit"
                                    >
                                        Sharpe Ratio <InfoModal
                                            content={"Risk-adjusted return metric. Values > 1 are good, > 2 are very good, > 3 are excellent. Measures return per unit of risk."}
                                        />
                                    </h4>
                                    <p
                                        class="text-[1rem] sm:text-lg font-semibold"
                                    >
                                        {backtestResults?.sharpe_ratio ?? "n/a"}
                                    </p>
                                </div>
                                <div class="">
                                    <h4
                                        class=" flex flex-row items-center w-fit"
                                    >
                                        Alpha <InfoModal
                                            content={"Excess return above the benchmark. Positive alpha indicates outperformance relative to market risk."}
                                        />
                                    </h4>
                                    <p
                                        class="text-[1rem] sm:text-lg font-semibold"
                                    >
                                        {backtestResults?.alpha ?? "n/a"}
                                    </p>
                                </div>
                                <div class="">
                                    <h4
                                        class=" flex flex-row items-center w-fit"
                                    >
                                        Beta <InfoModal
                                            content={"Volatility relative to the market. Beta = 1 moves with market, < 1 is less volatile, > 1 is more volatile."}
                                        />
                                    </h4>
                                    <p
                                        class="text-[1rem] sm:text-lg font-semibold"
                                    >
                                        {backtestResults?.beta ?? "n/a"}
                                    </p>
                                </div>

                                <div class="">
                                    <h4
                                        class=" flex flex-row items-center w-fit"
                                    >
                                        Sortino <InfoModal
                                            content={"Similar to Sharpe ratio but only considers downside volatility. Higher values indicate better risk-adjusted returns."}
                                        />
                                    </h4>
                                    <p
                                        class="text-[1rem] sm:text-lg font-semibold"
                                    >
                                        {backtestResults?.sortino_ratio ??
                                            "n/a"}
                                    </p>
                                </div>

                                <div class="">
                                    <h4
                                        class=" flex flex-row items-center w-fit"
                                    >
                                        Max Drawdown <InfoModal
                                            content={"Largest peak-to-trough decline in portfolio value. Lower values indicate better downside protection."}
                                        />
                                    </h4>
                                    <p
                                        class="text-[1rem] sm:text-lg font-semibold"
                                    >
                                        {backtestResults?.max_drawdown
                                            ? backtestResults?.max_drawdown +
                                              "%"
                                            : "n/a"}
                                    </p>
                                </div>

                                <div class="">
                                    <h4
                                        class=" flex flex-row items-center w-fit"
                                    >
                                        Volatility <InfoModal
                                            content={"Annualized standard deviation of returns. Measures the strategy's price fluctuation intensity."}
                                        />
                                    </h4>
                                    <p
                                        class="text-[1rem] sm:text-lg font-semibold"
                                    >
                                        {backtestResults?.volatility
                                            ? backtestResults?.volatility + "%"
                                            : "n/a"}
                                    </p>
                                </div>
                                <div class="">
                                    <h4
                                        class=" flex flex-row items-center w-fit"
                                    >
                                        Win Rate <InfoModal
                                            content={"Percentage of profitable trades. Higher win rates indicate more consistent trading success."}
                                        />
                                    </h4>
                                    <p
                                        class="text-[1rem] sm:text-lg font-semibold"
                                    >
                                        {backtestResults?.win_rate
                                            ? backtestResults?.win_rate + "%"
                                            : "n/a"}
                                    </p>
                                </div>
                                <div class="">
                                    <h4
                                        class=" flex flex-row items-center w-fit"
                                    >
                                        Profit Factor <InfoModal
                                            content={"Ratio of gross profits to gross losses. Values > 1 indicate profitable strategy, > 1.5 is good."}
                                        />
                                    </h4>
                                    <p
                                        class="text-[1rem] sm:text-lg font-semibold"
                                    >
                                        {backtestResults?.profit_factor ??
                                            "n/a"}
                                    </p>
                                </div>
                                <div class="">
                                    <h4
                                        class=" flex flex-row items-center w-fit"
                                    >
                                        Total Trades <InfoModal
                                            content={"Total number of completed buy and sell transactions during the backtest period."}
                                        />
                                    </h4>
                                    <p
                                        class="text-[1rem] sm:text-lg font-semibold"
                                    >
                                        {backtestResults?.total_trades ?? "n/a"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Performance Chart -->
                        <div class="">
                            <div
                                class="flex flex-col sm:flex-row items-center justify-between mb-6"
                            >
                                <h4
                                    class="text-sm sm:text-[1rem] font-semibold mb-2 sm:mb-0"
                                >
                                    Cumulative Returns
                                </h4>
                                <div class="flex items-center gap-4 text-sm">
                                    <div class="flex items-center gap-2">
                                        <div
                                            class="w-3 h-3 bg-blue-500 rounded-full"
                                        ></div>
                                        <span class="">Your Strategy</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div
                                            class="w-3 h-3 bg-[#ff4d4d] rounded-full"
                                        ></div>
                                        <span class="">SPY Benchmark</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Simplified Chart Display -->
                            {#if config}
                                <div
                                    class="chart-driver border border-gray-300 shadow dark:border-gray-800 rounded"
                                    use:highcharts={config}
                                ></div>
                            {:else}
                                <div
                                    class="shadow-lg h-64 bg-gray-50 dark:bg-default rounded flex items-center justify-center border border-gray-300 dark:border-gray-800"
                                >
                                    <div class="text-center">
                                        <svg
                                            class="w-16 h-16 mx-auto mb-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="1.5"
                                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                            />
                                        </svg>
                                        <p class="text-lg font-medium mb-2">
                                            Performance Chart
                                        </p>
                                        <p class="text-sm">
                                            Your Strategy vs SPY benchmark over
                                            time
                                        </p>
                                        <p class="text-xs mt-2"></p>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                </Tabs.Content>
            </div>

            <!-- Strategy Summary in Plain English -->
            <div class="mt-6 mb-6">
                <div class="">
                    <div class="flex items-start gap-3">
                        <div class="flex-1">
                            <h4 class="font-semibold mb-2 text-xl sm:text-2xl">
                                Strategy Summary
                            </h4>
                            <div class="space-y-2 text-sm">
                                <div class="flex items-start gap-2">
                                    <span
                                        class="inline-block w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"
                                    ></span>
                                    <span class="">{buyExplanation}</span>
                                </div>
                                <div class="flex items-start gap-2">
                                    <span
                                        class="inline-block w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"
                                    ></span>
                                    <span class="">{sellExplanation}</span>
                                </div>
                                {#if stopLossPercentage || profitTakerPercentage}
                                    <div class="flex items-start gap-2 pt-1">
                                        <span
                                            class="inline-block w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"
                                        ></span>
                                        <span class="">
                                            Risk controls:
                                            {#if stopLossPercentage}
                                                Stop loss at {stopLossPercentage}%
                                            {/if}
                                            {#if stopLossPercentage && profitTakerPercentage},
                                            {/if}
                                            {#if profitTakerPercentage}
                                                Take profit at {profitTakerPercentage}%
                                            {/if}
                                        </span>
                                    </div>
                                {/if}
                                <!--
                                {#if riskManagement.stopLoss.enabled || riskManagement.takeProfit.enabled}
                                    <div class="flex items-start gap-2 pt-1">
                                        <span
                                            class="inline-block w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"
                                        ></span>
                                        <span
                                            class=""
                                        >
                                            Risk controls:
                                            {#if riskManagement.stopLoss.enabled}
                                                Stop loss at {riskManagement
                                                    .stopLoss
                                                    .value}{riskManagement
                                                    .stopLoss.type ===
                                                "percentage"
                                                    ? "%"
                                                    : riskManagement.stopLoss
                                                            .type === "atr"
                                                      ? "× ATR"
                                                      : "$"}
                                            {/if}
                                            {#if riskManagement.stopLoss.enabled && riskManagement.takeProfit.enabled},
                                            {/if}
                                            {#if riskManagement.takeProfit.enabled}
                                                Take profit at {riskManagement
                                                    .takeProfit
                                                    .value}{riskManagement
                                                    .takeProfit.type ===
                                                "percentage"
                                                    ? "%"
                                                    : riskManagement.takeProfit
                                                            .type ===
                                                        "riskReward"
                                                      ? ":1 ratio"
                                                      : "$"}
                                            {/if}.
                                        </span>
                                    </div>
                                {/if}
                            -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Live Trading Recommendations -->
            {#if activeTab === "backtest" && backtestResults?.live_recommendations && backtestResults.live_recommendations.length > 0}
                <div class="mt-6 mb-6">
                    <div class="">
                        <h4
                            class="font-semibold mb-4 text-xl sm:text-2xl flex items-center gap-2"
                        >
                            Live Trade Alerts
                        </h4>
                        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {#each backtestResults.live_recommendations as rec}
                                <div
                                    class="bg-gray-100 dark:bg-secondary rounded p-4 border border-gray-300 dark:border-gray-800"
                                >
                                    <!-- Ticker and Recommendation -->
                                    <div
                                        class="flex items-center justify-between mb-3"
                                    >
                                        <div
                                            class="font-semibold text-lg text-gray-900 dark:text-white"
                                        >
                                            {rec.ticker}
                                        </div>
                                        <div class="flex items-center gap-2">
                                            {#if rec.recommendation === "BUY"}
                                                <span
                                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                >
                                                    <svg
                                                        class="w-3 h-3 mr-1"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fill-rule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                                                            clip-rule="evenodd"
                                                        ></path>
                                                    </svg>
                                                    BUY
                                                </span>
                                            {:else if rec.recommendation === "SELL"}
                                                <span
                                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                                >
                                                    <svg
                                                        class="w-3 h-3 mr-1"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fill-rule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                                                            clip-rule="evenodd"
                                                        ></path>
                                                    </svg>
                                                    SELL
                                                </span>
                                            {:else}
                                                <span
                                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300"
                                                >
                                                    <svg
                                                        class="w-3 h-3 mr-1"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fill-rule="evenodd"
                                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                            clip-rule="evenodd"
                                                        ></path>
                                                    </svg>
                                                    HOLD
                                                </span>
                                            {/if}
                                        </div>
                                    </div>

                                    <!-- Price -->
                                    {#if rec.last_price}
                                        <div class="mb-3">
                                            <div
                                                class="text-sm text-gray-600 dark:text-gray-400"
                                            >
                                                Current Price
                                            </div>
                                            <div
                                                class="text-lg font-semibold text-gray-900 dark:text-white"
                                            >
                                                ${rec.last_price.toLocaleString()}
                                            </div>
                                        </div>
                                    {/if}

                                    <!-- Reason -->
                                    <div class="mb-3">
                                        <div
                                            class="text-sm text-gray-600 dark:text-gray-400 mb-1"
                                        >
                                            Signal Reason
                                        </div>
                                        <div
                                            class="text-sm text-gray-800 dark:text-gray-200 leading-relaxed"
                                        >
                                            {rec.reason}
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            {/if}

            {#if activeTab === "backtest" && Object?.keys(backtestResults)?.length > 0}
                <h4
                    class="font-semibold mb-4 text-xl sm:text-2xl flex items-center gap-2"
                >
                    Trading History
                </h4>
                <div
                    class="w-full m-auto rounded-none sm:rounded mb-4 overflow-x-auto mt-5"
                >
                    <table
                        class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
                    >
                        <thead>
                            <TableHeader {columns} {sortOrders} {sortData} />
                        </thead>
                        <tbody>
                            {#each displayTradeHistory as item, index}
                                <tr
                                    class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                                >
                                    <td
                                        class="text-sm sm:text-[1rem] text-start"
                                    >
                                        {new Date(
                                            item?.date,
                                        ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "2-digit",
                                            year: "numeric",
                                            timeZone: "UTC",
                                        })}
                                    </td>

                                    <td class="text-sm sm:text-[1rem] text-end">
                                        <HoverStockChart
                                            symbol={item?.symbol}
                                            assetType={item?.assetType}
                                        />
                                    </td>

                                    <td
                                        class="text-end text-sm sm:text-[1rem] whitespace-nowrap {item?.action ===
                                            'BUY' && item?.action
                                            ? 'text-green-800 dark:text-[#00FC50]'
                                            : item?.action === 'SELL' &&
                                                item?.action
                                              ? 'text-red-800 dark:text-[#FF2F1F]'
                                              : ''}"
                                    >
                                        {item?.action ?? "n/a"}
                                    </td>

                                    <td
                                        class="whitespace-nowrap text-sm sm:text-[1rem] text-end"
                                    >
                                        {item?.shares?.toLocaleString("en-US")}
                                    </td>

                                    <td
                                        class="whitespace-nowrap text-sm sm:text-[1rem] text-end"
                                    >
                                        {item?.price}
                                    </td>

                                    <td
                                        class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                                    >
                                        {item?.net_amount?.toLocaleString(
                                            "en-US",
                                            {
                                                style: "currency",
                                                currency: "USD",
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                            },
                                        ) ?? "$0.00"}
                                    </td>

                                    <td
                                        class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                                    >
                                        {item?.commission?.toLocaleString(
                                            "en-US",
                                            {
                                                style: "currency",
                                                currency: "USD",
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                            },
                                        ) ?? "$0.00"}
                                    </td>

                                    <td
                                        class="text-end text-sm sm:text-[1rem] whitespace-nowrap {item?.return_pct >=
                                            0 && item?.return_pct
                                            ? " before:content-['+'] text-green-800 dark:text-[#00FC50]"
                                            : item?.return_pct < 0 &&
                                                item?.return_pct
                                              ? 'text-red-800 dark:text-[#FF2F1F]'
                                              : ''}"
                                    >
                                        {item?.return_pct
                                            ? abbreviateNumber(
                                                  item?.return_pct,
                                              ) + "%"
                                            : "n/a"}
                                    </td>

                                    <td
                                        class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                                    >
                                        {item?.portfolio_value?.toLocaleString(
                                            "en-US",
                                            {
                                                style: "currency",
                                                currency: "USD",
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                            },
                                        ) ?? "$0.00"}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>

                {#if tradeHistorySource?.length > 0}
                    <div
                        class="flex flex-row items-center justify-between mt-8 sm:mt-5"
                    >
                        <div class="flex items-center gap-2">
                            <Button
                                on:click={() =>
                                    goToTradePage(tradeCurrentPage - 1)}
                                disabled={tradeCurrentPage === 1}
                                class="w-fit transition-all flex flex-row items-center duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary sm:w-auto px-1.5 sm:px-3 rounded truncate"
                            >
                                <svg
                                    class="h-5 w-5 inline-block shrink-0 rotate-90"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    style="max-width:40px"
                                    aria-hidden="true"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                        clip-rule="evenodd"
                                    ></path>
                                </svg>
                                <span class="hidden sm:inline">Previous</span>
                            </Button>
                        </div>

                        <div class="flex flex-row items-center gap-4">
                            <span class="text-sm sm:text-[1rem]">
                                Page {tradeCurrentPage} of {tradeTotalPages}
                            </span>

                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild let:builder>
                                    <Button
                                        builders={[builder]}
                                        class="w-fit transition-all duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row justify-between items-center sm:w-auto px-2 sm:px-3 rounded truncate"
                                    >
                                        <span
                                            class="truncate text-[0.85rem] sm:text-sm"
                                            >{tradeRowsPerPage} Rows</span
                                        >
                                        <svg
                                            class="ml-0.5 mt-1 h-5 w-5 inline-block shrink-0"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            style="max-width:40px"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fill-rule="evenodd"
                                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                clip-rule="evenodd"
                                            ></path>
                                        </svg>
                                    </Button>
                                </DropdownMenu.Trigger>

                                <DropdownMenu.Content
                                    side="bottom"
                                    align="end"
                                    sideOffset={10}
                                    alignOffset={0}
                                    class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative"
                                >
                                    <DropdownMenu.Group class="pb-2">
                                        {#each tradeRowsPerPageOptions as item}
                                            <DropdownMenu.Item
                                                class="sm:hover:bg-gray-200 dark:sm:hover:bg-primary"
                                            >
                                                <label
                                                    on:click={() =>
                                                        changeTradeRowsPerPage(
                                                            item,
                                                        )}
                                                    class="inline-flex justify-between w-full items-center cursor-pointer"
                                                >
                                                    <span class="text-sm"
                                                        >{item} Rows</span
                                                    >
                                                </label>
                                            </DropdownMenu.Item>
                                        {/each}
                                    </DropdownMenu.Group>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </div>

                        <div class="flex items-center gap-2">
                            <Button
                                on:click={() =>
                                    goToTradePage(tradeCurrentPage + 1)}
                                disabled={tradeCurrentPage === tradeTotalPages}
                                class="w-fit transition-all flex flex-row items-center duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary sm:w-auto px-1.5 sm:px-3 rounded truncate"
                            >
                                <span class="hidden sm:inline">Next</span>
                                <svg
                                    class="h-5 w-5 inline-block shrink-0 -rotate-90"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    style="max-width:40px"
                                    aria-hidden="true"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                        clip-rule="evenodd"
                                    ></path>
                                </svg>
                            </Button>
                        </div>
                    </div>

                    <div class="flex justify-center mt-4">
                        <button
                            on:click={scrollTradingHistoryToTop}
                            class="cursor-pointer sm:hover:text-muted text-blue-800 dark:sm:hover:text-white dark:text-blue-400 text-sm sm:text-[1rem] font-medium"
                        >
                            Back to Top
                            <svg
                                class="h-5 w-5 inline-block shrink-0 rotate-180"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                style="max-width:40px"
                                aria-hidden="true"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clip-rule="evenodd"
                                ></path>
                            </svg>
                        </button>
                    </div>
                {:else}
                    <div
                        class="text-sm sm:text-[1rem] text-gray-600 dark:text-gray-300 mt-4"
                    >
                        No trades were generated for this backtest yet.
                    </div>
                {/if}
            {/if}
        </Tabs.Root>
    </div>

    <!--End Build Strategy-->

    <!--End Matching Preview-->
</section>

<!--End Login Modal-->

<!--Start Add Strategy Modal-->
<input type="checkbox" id="addStrategy" class="modal-toggle" />

<dialog id="addStrategy" class="modal modal-bottom sm:modal-middle">
    <label for="addStrategy" class="cursor-pointer modal-backdrop"></label>

    <div
        class="modal-box w-full p-6 rounded border
        bg-white dark:bg-secondary border border-gray-300 dark:border-gray-800"
    >
        <h1 class="text-2xl font-bold">New Backtest</h1>

        <form
            on:submit={createStrategy}
            method="POST"
            class="space-y-2 pt-5 pb-10 sm:pb-5"
        >
            <Input
                id="title"
                type="text"
                errors=""
                label="Backtest Name"
                required={true}
            />

            <button
                type="submit"
                class="cursor-pointer mt-2 py-2.5 bg-black dark:bg-[#fff] dark:sm:hover:bg-gray-300 duration-100 w-full rounded m-auto text-white dark:text-black font-semibold text-md"
            >
                Create Backtest
            </button>
        </form>
    </div>
</dialog>

<!--Start Delete Strategy Modal-->
<input type="checkbox" id="deleteStrategy" class="modal-toggle" />

<dialog id="deleteStrategy" class="modal modal-bottom sm:modal-middle">
    <label for="deleteStrategy" class="cursor-pointer modal-backdrop"></label>

    <div
        class="modal-box w-full p-6 rounded border
        bg-white dark:bg-secondary border border-gray-300 dark:border-gray-800"
    >
        <h3 class="text-lg font-medium mb-2">Delete Backtest</h3>
        <p class="text-sm mb-6">
            Are you sure you want to delete this backtest? This action cannot be
            undone.
        </p>
        <div class="flex justify-end space-x-3">
            <label
                for="deleteStrategy"
                class="cursor-pointer px-4 py-2 rounded text-sm font-medium
            transition-colors duration-100
            bg-gray-600 text-white dark:bg-white dark:text-black"
                tabindex="0">Cancel</label
            ><label
                for="deleteStrategy"
                on:click={handleDeleteStrategy}
                class="cursor-pointer px-4 py-2 rounded text-sm font-medium
            transition-colors duration-100 flex items-center
            bg-red-600 text-white sm:hover:bg-red-700
            "
                tabindex="0"
                ><svg
                    stroke="currentColor"
                    fill="none"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="w-4 h-4 mr-2"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                    ><polyline points="3 6 5 6 21 6"></polyline><path
                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    ></path><line x1="10" y1="11" x2="10" y2="17"></line><line
                        x1="14"
                        y1="11"
                        x2="14"
                        y2="17"
                    ></line></svg
                >Delete Backtest</label
            >
        </div>
    </div>
</dialog>

<!--Start Login Modal-->
{#if LoginPopup}
    <LoginPopup {form} />
{/if}
