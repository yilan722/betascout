// Simple utility for average
export const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

// Standard Deviation
export const stdDev = (arr: number[]) => {
  if (arr.length === 0) return 0;
  const mean = avg(arr);
  const squareDiffs = arr.map((value) => Math.pow(value - mean, 2));
  const avgSquareDiff = avg(squareDiffs);
  return Math.sqrt(avgSquareDiff);
};

// Sum
export const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

// Simple Moving Average
export const calculateSMA = (data: number[], window: number): number[] => {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      sma.push(NaN);
      continue;
    }
    const slice = data.slice(i - window + 1, i + 1);
    sma.push(avg(slice));
  }
  return sma;
};

// Rolling Standard Deviation
export const calculateRollingStdDev = (data: number[], window: number): number[] => {
    const rollingStd = [];
    for (let i = 0; i < data.length; i++) {
        if (i < window - 1) {
            rollingStd.push(NaN);
            continue;
        }
        const slice = data.slice(i - window + 1, i + 1);
        rollingStd.push(stdDev(slice));
    }
    return rollingStd;
}

// Exponential Moving Average
export const calculateEMA = (data: number[], window: number): number[] => {
  const k = 2 / (window + 1);
  const ema = [data[0]]; // Start with first price (approximation)
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
};

// Relative Strength Index
export const calculateRSI = (data: number[], window: number = 14): number[] => {
  let gains = 0;
  let losses = 0;
  const rsi = [];

  // First calculation
  for (let i = 1; i <= window; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  
  let avgGain = gains / window;
  let avgLoss = losses / window;
  
  // Fill initial NaNs
  for (let i = 0; i < window; i++) rsi.push(NaN);
  
  rsi.push(100 - (100 / (1 + avgGain / (avgLoss === 0 ? 1 : avgLoss))));

  // Smoothed calculation
  for (let i = window + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (window - 1) + gain) / window;
    avgLoss = (avgLoss * (window - 1) + loss) / window;

    const rs = avgGain / (avgLoss === 0 ? 1 : avgLoss);
    rsi.push(100 - 100 / (1 + rs));
  }

  return rsi;
};

// Average True Range
export const calculateATR = (high: number[], low: number[], close: number[], window: number = 14): number[] => {
  const tr = [high[0] - low[0]];
  for (let i = 1; i < close.length; i++) {
    const hl = high[i] - low[i];
    const hc = Math.abs(high[i] - close[i - 1]);
    const lc = Math.abs(low[i] - close[i - 1]);
    tr.push(Math.max(hl, hc, lc));
  }

  // RMA (Rolling Moving Average) for ATR is standard in TradingView
  // ATR = (PrevATR * (n-1) + TR) / n
  const atr = [];
  let currentAtr = avg(tr.slice(0, window)); // First ATR is SMA
  
  for(let i=0; i<window; i++) atr.push(NaN); // padding
  atr.push(currentAtr);

  for (let i = window + 1; i < tr.length; i++) {
    currentAtr = (currentAtr * (window - 1) + tr[i]) / window;
    atr.push(currentAtr);
  }
  return atr;
};
