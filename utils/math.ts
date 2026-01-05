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

// Supertrend calculation (based on Pine Script)
// Returns [trend[], supertrend[]] where trend is 1 (up) or -1 (down)
export const calculateSupertrend = (
  high: number[],
  low: number[],
  close: number[],
  multiplier: number,
  periods: number,
  src: number[], // Source (hl2)
  useATR: boolean = true // changeATR parameter
): [number[], number[]] => {
  const n = close.length;
  const trends: number[] = [];
  const supertrends: number[] = [];
  
  // Calculate ATR or SMA of TR
  const atr = useATR 
    ? calculateATR(high, low, close, periods)
    : calculateSMA(
        high.map((h, i) => i === 0 ? h - low[i] : Math.max(h - low[i], Math.abs(h - close[i - 1]), Math.abs(low[i] - close[i - 1]))),
        periods
      );
  
  // Initialize arrays
  const up: number[] = [];
  const dn: number[] = [];
  
  for (let i = 0; i < n; i++) {
    if (isNaN(atr[i]) || atr[i] <= 0) {
      trends.push(NaN);
      supertrends.push(NaN);
      up.push(NaN);
      dn.push(NaN);
      continue;
    }
    
    // Calculate basic bands
    const currentUp = src[i] - (multiplier * atr[i]);
    const currentDn = src[i] + (multiplier * atr[i]);
    
    // Get previous values (nz function: use current if previous is NaN)
    const prevUp = i > 0 && !isNaN(up[i - 1]) ? up[i - 1] : currentUp;
    const prevDn = i > 0 && !isNaN(dn[i - 1]) ? dn[i - 1] : currentDn;
    
    // Adjust bands based on previous close
    let adjustedUp = currentUp;
    let adjustedDn = currentDn;
    
    if (i > 0 && !isNaN(close[i - 1])) {
      if (close[i - 1] > prevUp) {
        adjustedUp = Math.max(currentUp, prevUp);
      }
      if (close[i - 1] < prevDn) {
        adjustedDn = Math.min(currentDn, prevDn);
      }
    }
    
    up.push(adjustedUp);
    dn.push(adjustedDn);
    
    // Determine trend
    let trend = 1; // Default to up
    if (i > 0 && !isNaN(trends[i - 1])) {
      trend = trends[i - 1];
    }
    
    // Trend reversal logic (check current bar's close price)
    // Pine Script: trend := trend == -1 and close > dn1 ? 1 : trend == 1 and close < up1 ? -1 : trend
    if (trend === -1 && close[i] > prevDn) {
      trend = 1;
    } else if (trend === 1 && close[i] < prevUp) {
      trend = -1;
    }
    
    trends.push(trend);
    supertrends.push(trend === 1 ? adjustedUp : adjustedDn);
  }
  
  return [trends, supertrends];
};
