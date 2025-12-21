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

// Relative Strength Index (Wilder's Smoothing Method)
export const calculateRSI = (data: number[], window: number = 14): number[] => {
  if (data.length < window + 1) {
    return new Array(data.length).fill(NaN);
  }

  const rsi: number[] = [];
  
  // Fill initial NaNs
  for (let i = 0; i < window; i++) {
    rsi.push(NaN);
  }

  // Calculate initial average gain and loss
  let sumGains = 0;
  let sumLosses = 0;
  
  for (let i = 1; i <= window; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) {
      sumGains += change;
    } else {
      sumLosses += Math.abs(change);
    }
  }
  
  let avgGain = sumGains / window;
  let avgLoss = sumLosses / window;
  
  // Calculate first RSI value
  if (avgLoss === 0) {
    // If no losses, RSI should be 100 (perfect upward movement)
    rsi.push(100);
  } else {
    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }

  // Calculate remaining RSI values using Wilder's smoothing
  for (let i = window + 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    const currentGain = change > 0 ? change : 0;
    const currentLoss = change < 0 ? Math.abs(change) : 0;

    // Wilder's smoothing: newAvg = (oldAvg * (n-1) + currentValue) / n
    avgGain = (avgGain * (window - 1) + currentGain) / window;
    avgLoss = (avgLoss * (window - 1) + currentLoss) / window;

    // Calculate RSI
    if (avgLoss === 0) {
      // If no losses, RSI should be 100
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      const rsiValue = 100 - (100 / (1 + rs));
      // Clamp RSI to valid range [0, 100]
      rsi.push(Math.max(0, Math.min(100, rsiValue)));
    }
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
