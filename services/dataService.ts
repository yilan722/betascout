import { Asset, AssetCategory, Candle, IndicatorData } from '../types';
import { calculateEMA, calculateRSI, calculateATR, avg, stdDev, calculateSMA, calculateRollingStdDev, sum } from '../utils/math';
import { fetchCandles } from './api';

// --- Configuration ---

export const ASSETS_CONFIG: (Omit<Asset, 'price' | 'change24h'> & { yahooSymbol: string })[] = [
  // US Stocks
  { id: 'NVDA', symbol: 'NVDA', name: 'NVIDIA', category: AssetCategory.US_STOCKS, yahooSymbol: 'NVDA' },
  { id: 'TSLA', symbol: 'TSLA', name: 'Tesla', category: AssetCategory.US_STOCKS, yahooSymbol: 'TSLA' },
  { id: 'AAPL', symbol: 'AAPL', name: 'Apple', category: AssetCategory.US_STOCKS, yahooSymbol: 'AAPL' },
  { id: 'MSFT', symbol: 'MSFT', name: 'Microsoft', category: AssetCategory.US_STOCKS, yahooSymbol: 'MSFT' },
  { id: 'AMZN', symbol: 'AMZN', name: 'Amazon', category: AssetCategory.US_STOCKS, yahooSymbol: 'AMZN' },
  
  // China A-Shares
  { id: '300750', symbol: '300750', name: 'CATL (Ningde)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300750.SZ' },
  { id: '600519', symbol: '600519', name: 'Kweichow Moutai', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600519.SS' },
  { id: '300059', symbol: '300059', name: 'East Money', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300059.SZ' },
  
  // HK Stocks
  { id: '00700', symbol: '00700', name: 'Tencent', category: AssetCategory.HK_STOCKS, yahooSymbol: '0700.HK' },
  { id: '09988', symbol: '09988', name: 'Alibaba', category: AssetCategory.HK_STOCKS, yahooSymbol: '9988.HK' },
  { id: '03690', symbol: '03690', name: 'Meituan', category: AssetCategory.HK_STOCKS, yahooSymbol: '3690.HK' },

  // Crypto
  { id: 'BTC', symbol: 'BTC', name: 'Bitcoin', category: AssetCategory.CRYPTO, yahooSymbol: 'BTC-USD' },
  { id: 'ETH', symbol: 'ETH', name: 'Ethereum', category: AssetCategory.CRYPTO, yahooSymbol: 'ETH-USD' },
  { id: 'SOL', symbol: 'SOL', name: 'Solana', category: AssetCategory.CRYPTO, yahooSymbol: 'SOL-USD' },
  { id: 'PEPE', symbol: 'PEPE', name: 'Pepe', category: AssetCategory.CRYPTO, yahooSymbol: 'PEPE-USD' },
  
  // Commodities
  { id: 'GOLD', symbol: 'XAU', name: 'Gold', category: AssetCategory.COMMODITIES, yahooSymbol: 'GC=F' },
  { id: 'OIL', symbol: 'WTI', name: 'Crude Oil', category: AssetCategory.COMMODITIES, yahooSymbol: 'CL=F' },
  
  // Forex
  { id: 'EURUSD', symbol: 'EUR/USD', name: 'Euro', category: AssetCategory.FOREX, yahooSymbol: 'EURUSD=X' },
  { id: 'USDJPY', symbol: 'USD/JPY', name: 'Yen', category: AssetCategory.FOREX, yahooSymbol: 'USDJPY=X' },
];

// --- Mock Data Generator (Fallback) ---

const generateRandomWalk = (startPrice: number, vol: number, steps: number): Candle[] => {
  const candles: Candle[] = [];
  let currentPrice = startPrice;
  const now = new Date();

  // Generate historical data going back 'steps' days
  for (let i = 0; i < steps; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (steps - i));
    
    // Random movement
    const change = (Math.random() - 0.5) * vol * currentPrice;
    const close = currentPrice + change;
    const high = Math.max(currentPrice, close) + Math.random() * vol * currentPrice * 0.5;
    const low = Math.min(currentPrice, close) - Math.random() * vol * currentPrice * 0.5;
    const open = currentPrice;
    
    // Ensure no negative prices
    const safeClose = Math.max(0.01, close);
    const safeHigh = Math.max(safeClose, high);
    const safeLow = Math.max(0.001, low);

    candles.push({
      time: date.toISOString().split('T')[0],
      open: Math.max(0.01, open),
      high: safeHigh,
      low: safeLow,
      close: safeClose,
      volume: Math.floor(Math.random() * 1000000),
    });
    currentPrice = safeClose;
  }
  return candles;
};

// --- Analysis Engine ---

export const analyzeAsset = async (assetId: string, timeframe: '1D' | '1W' = '1D'): Promise<{ candles: Candle[], indicators: IndicatorData[] }> => {
  const config = ASSETS_CONFIG.find(a => a.id === assetId);
  if (!config) throw new Error('Asset not found');

  // Fetch real data directly from API with the requested timeframe
  const candles = await fetchCandles(config.yahooSymbol, timeframe);
  
  if (!candles || candles.length === 0) {
    throw new Error(`No data available for ${config.yahooSymbol}. Please check your internet connection or try again later.`);
  }

  // Ensure data is sorted chronologically (oldest to newest)
  candles.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  // Verify data integrity
  const firstDate = new Date(candles[0]?.time);
  const lastDate = new Date(candles[candles.length - 1]?.time);
  const firstPrice = candles[0]?.close;
  const lastPrice = candles[candles.length - 1]?.close;
  
  // Check for data anomalies
  const priceChanges = candles.slice(1).map((c, i) => {
    const prevClose = candles[i]?.close;
    return prevClose > 0 ? ((c.close - prevClose) / prevClose) * 100 : 0;
  });
  const avgChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
  
  console.log(`📊 Calculating indicators for ${config.yahooSymbol} using ${candles.length} ${timeframe === '1W' ? 'weekly' : 'daily'} data points (directly from API)`);
  console.log(`   📅 Data range: ${candles[0]?.time} ($${firstPrice?.toFixed(2)}) to ${candles[candles.length - 1]?.time} ($${lastPrice?.toFixed(2)})`);
  console.log(`   💰 Price change: ${((lastPrice - firstPrice) / firstPrice * 100).toFixed(2)}% over period`);
  console.log(`   📈 Average daily change: ${avgChange.toFixed(2)}%`);
  
  // Warn if data seems suspicious
  if (isNaN(firstDate.getTime()) || isNaN(lastDate.getTime())) {
    console.error(`   ❌ Invalid date range detected!`);
  }
  if (lastDate < firstDate) {
    console.error(`   ❌ Data is in reverse chronological order!`);
  }

  // Validate minimum data points for indicators
  const minDataPoints = timeframe === '1W' ? 50 : 200; // Weekly needs less, daily needs more
  if (candles.length < minDataPoints) {
    console.warn(`⚠️ Warning: Only ${candles.length} data points available, indicators may be incomplete. Recommended: ${minDataPoints}+ points.`);
  }

  // Extract price arrays and validate
  const closes = candles.map(c => {
    const close = c.close;
    if (isNaN(close) || close <= 0) {
      console.warn(`   ⚠️ Invalid close price: ${close} at ${c.time}`);
    }
    return close;
  });
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  // Log sample prices for verification (first, middle, last)
  if (candles.length >= 3) {
    const midIndex = Math.floor(candles.length / 2);
    console.log(`   🔍 Sample prices: Start=$${closes[0]?.toFixed(2)}, Mid=$${closes[midIndex]?.toFixed(2)}, End=$${closes[closes.length - 1]?.toFixed(2)}`);
  }

  // 2. Calculate Indicators from REAL price data
  
  // --- Indicator 1: RSI + ATR + BB (Standard) ---
  // All calculations are based on REAL market data (OHLC prices from API)
  console.log(`   Calculating Indicator 1 (RSI + EMA20 + ATR) from real price data...`);
  
  // Validate price data before calculation
  const validCloses = closes.filter((c, i) => {
    if (isNaN(c) || c <= 0) {
      console.warn(`   ⚠️ Invalid close price at index ${i}: ${c}`);
      return false;
    }
    return true;
  });
  
  if (validCloses.length < 15) {
    console.error(`   ❌ Not enough valid price data: ${validCloses.length} points (need at least 15)`);
    throw new Error('Insufficient price data for RSI calculation');
  }
  
  const rsi = calculateRSI(closes, 14);
  const ema20 = calculateEMA(closes, 20);
  const atr = calculateATR(highs, lows, closes, 14);
  
  // Validate RSI results
  const validRsi = rsi.filter(r => !isNaN(r) && r >= 0 && r <= 100);
  const rsiStats = {
    min: validRsi.length > 0 ? Math.min(...validRsi) : NaN,
    max: validRsi.length > 0 ? Math.max(...validRsi) : NaN,
    avg: validRsi.length > 0 ? validRsi.reduce((a, b) => a + b, 0) / validRsi.length : NaN,
  };
  
  const latestRsi = rsi[rsi.length - 1];
  const latestEma = ema20[ema20.length - 1];
  const latestAtr = atr[atr.length - 1];
  
  console.log(`   ✅ Indicator 1 calculated: RSI=${latestRsi?.toFixed(1)}, EMA20=${latestEma?.toFixed(2)}, ATR=${latestAtr?.toFixed(2)}`);
  console.log(`   📊 RSI Statistics: Min=${rsiStats.min?.toFixed(1)}, Max=${rsiStats.max?.toFixed(1)}, Avg=${rsiStats.avg?.toFixed(1)}`);
  
  // Warn if RSI seems abnormal
  if (rsiStats.avg > 70) {
    console.warn(`   ⚠️ RSI average is unusually high (${rsiStats.avg.toFixed(1)}), indicating possible data or calculation issue`);
  } else if (rsiStats.avg < 30) {
    console.warn(`   ⚠️ RSI average is unusually low (${rsiStats.avg.toFixed(1)}), indicating possible data or calculation issue`);
  }
  
  // --- Indicator 2: Aggregated Scores Oscillator [Alpha Extract] ---
  // Implementation of the provided Pine Script logic
  // All calculations based on REAL returns from REAL price data
  console.log(`   Calculating Indicator 2 (Omega + Sortino) from real ${timeframe === '1W' ? 'weekly' : 'daily'} returns...`);
  
  // Parameters - adjust based on timeframe
  // For weekly: use smaller period (30 weeks ~= 7.5 months) since we have fewer data points
  // For daily: use original period (150 days ~= 7.5 months)
  const period = timeframe === '1W' ? 30 : 150;
  const targetReturn = 0;
  const rollingWindow = timeframe === '1W' ? 50 : 200;
  const upperMultiplier = 1.75;
  const lowerMultiplier = 1.5;
  const rollingMultiplier = 1.8;
  const upperBandAdjust = 0.90;
  const omegaSma = 5;
  const sortinoSma = 7;

  // Daily Returns
  const dailyReturn: number[] = [];
  for(let i = 0; i < closes.length; i++) {
      if (i === 0) dailyReturn.push(0);
      else dailyReturn.push((closes[i] / closes[i-1]) - 1);
  }

  // Rolling Excess/Deficit Returns
  // Pine Script: math.sum((dailyReturn > targetReturn ? dailyReturn - targetReturn : 0), period)
  const excessReturn: number[] = [];
  const deficitReturn: number[] = [];

  for(let i = 0; i < dailyReturn.length; i++) {
      if (i < period - 1) {
          excessReturn.push(NaN);
          deficitReturn.push(NaN);
          continue;
      }
      let currentExcess = 0;
      let currentDeficit = 0;
      for (let j = i - period + 1; j <= i; j++) {
          const r = dailyReturn[j];
          if (r > targetReturn) currentExcess += (r - targetReturn);
          if (r < targetReturn) currentDeficit += (targetReturn - r);
      }
      excessReturn.push(currentExcess);
      deficitReturn.push(currentDeficit);
  }

  // Omega Ratio
  const omegaRatio = excessReturn.map((exc, i) => {
      const def = deficitReturn[i];
      if (isNaN(exc) || isNaN(def) || def === 0) return NaN;
      return exc / def;
  });

  // Mean Return (Rolling SMA)
  const meanReturn = calculateSMA(dailyReturn, period);

  // Downside Deviation
  const downsideDeviation: number[] = [];
  for(let i = 0; i < dailyReturn.length; i++) {
      if (i < period - 1) {
          downsideDeviation.push(NaN);
          continue;
      }
      let sumSqDownside = 0;
      for (let j = i - period + 1; j <= i; j++) {
          const r = dailyReturn[j];
          const downside = r < targetReturn ? (r - targetReturn) : 0;
          sumSqDownside += (downside * downside);
      }
      downsideDeviation.push(Math.sqrt(sumSqDownside / period));
  }

  // Sortino Ratio
  // Annualization factor: 52 for weekly, 365 for daily
  const annualizationFactor = timeframe === '1W' ? 52 : 365;
  const sortinoRatio = meanReturn.map((mean, i) => {
    const dev = downsideDeviation[i];
    if (isNaN(mean) || isNaN(dev) || dev === 0) return NaN;
    return (mean / dev) * Math.sqrt(annualizationFactor);
  });

  // Smoothed Ratios
  const omegaSmaValue = calculateSMA(omegaRatio.map(v => isNaN(v) ? 0 : v), omegaSma); // Handle NaN for initial bars
  const sortinoSmaValue = calculateSMA(sortinoRatio.map(v => isNaN(v) ? 0 : v), sortinoSma);

  // Aggregated Score
  const aggScores: number[] = [];
  for(let i=0; i<closes.length; i++) {
      const om = omegaSmaValue[i];
      const so = sortinoSmaValue[i];
      if (isNaN(om) || isNaN(so)) aggScores.push(NaN);
      else aggScores.push(om + so);
  }

  // --- Statistical Bands ---

  // Expanding Statistics
  const aggUpperBands: number[] = [];
  const aggLowerBands: number[] = [];
  const adjustedUpperBands: number[] = [];

  let cumulativeSum = 0;
  let cumulativeSquareSum = 0;
  let count = 0;

  // Pre-calculate Rolling Stats
  // We need to handle NaNs in aggScores for rolling calculation
  const validScores = aggScores.map(s => isNaN(s) ? 0 : s); // Treat NaN as 0 for rolling window calc to maintain index alignment or handle strictly
  // Actually, if score is NaN, band is NaN.
  const rollingMeanArr = calculateSMA(validScores, rollingWindow);
  const rollingStdArr = calculateRollingStdDev(validScores, rollingWindow);

  for(let i=0; i<aggScores.length; i++) {
      const score = aggScores[i];
      
      if (isNaN(score)) {
          aggUpperBands.push(NaN);
          aggLowerBands.push(NaN);
          adjustedUpperBands.push(NaN);
          continue;
      }

      // Expanding Stats Update
      cumulativeSum += score;
      cumulativeSquareSum += score * score;
      count += 1;

      const expandingMean = cumulativeSum / count;
      const varianceExpanding = (cumulativeSquareSum / count) - (expandingMean * expandingMean);
      const expandingSTD = Math.sqrt(Math.max(0, varianceExpanding)); // Ensure non-negative

      const expandingUpperBand = expandingMean + (expandingSTD * upperMultiplier);
      const expandingLowerBand = expandingMean - (expandingSTD * lowerMultiplier);

      // Rolling Stats
      const rollingMean = rollingMeanArr[i] || 0;
      const rollingSTD = rollingStdArr[i] || 0;
      
      const rollingUpperBand = rollingMean + (rollingSTD * rollingMultiplier);
      const rollingLowerBand = rollingMean - (rollingSTD * rollingMultiplier);

      // Aggregated Bands
      const aggregatedUpperBand = (expandingUpperBand + rollingUpperBand) / 2;
      const aggregatedLowerBand = (expandingLowerBand + rollingLowerBand) / 2;
      const adjustedUpperBand = aggregatedUpperBand * upperBandAdjust;

      aggUpperBands.push(aggregatedUpperBand);
      aggLowerBands.push(aggregatedLowerBand); // Note: Pine Script uses aggregatedLowerBand for OS check
      adjustedUpperBands.push(adjustedUpperBand);
  }

  const latestScore = aggScores[aggScores.length - 1];
  const latestUpperBand = adjustedUpperBands[adjustedUpperBands.length - 1];
  const latestLowerBand = aggLowerBands[aggLowerBands.length - 1];
  console.log(`   ✅ Indicator 2 calculated: Score=${latestScore?.toFixed(2)}, Upper=${latestUpperBand?.toFixed(2)}, Lower=${latestLowerBand?.toFixed(2)}`);
  console.log(`   📈 All indicators are calculated from ${candles.length} real market data points`);

  // 3. Combine Data Frame
  const indicators: IndicatorData[] = candles.map((c, i) => {
    // Safety check for array bounds
    const curRsi = rsi[i] || 50;
    const curEma = ema20[i] || c.close;
    const curAtr = atr[i] || 0;
    
    // RSI thresholds (based on Pine Script)
    const rsiUpperBandExt = 80; // Extreme overbought
    const rsiUpperBand = 70; // Overbought
    const rsiLowerBand = 30; // Oversold
    const rsiLowerBandExt = 20; // Extreme oversold
    
    // Determine RSI level
    let rsiLevel: 'extreme_oversold' | 'oversold' | 'neutral' | 'overbought' | 'extreme_overbought' = 'neutral';
    if (curRsi <= rsiLowerBandExt) {
      rsiLevel = 'extreme_oversold';
    } else if (curRsi <= rsiLowerBand) {
      rsiLevel = 'oversold';
    } else if (curRsi >= rsiUpperBandExt) {
      rsiLevel = 'extreme_overbought';
    } else if (curRsi >= rsiUpperBand) {
      rsiLevel = 'overbought';
    }
    
    // Determine RSI trend (momentum)
    const prevRsi = rsi[i - 1] || curRsi;
    const prev2Rsi = rsi[i - 2] || prevRsi;
    let rsiTrend: 'up' | 'down' | 'neutral' = 'neutral';
    if (curRsi > prevRsi && prevRsi > prev2Rsi) {
      rsiTrend = 'up';
    } else if (curRsi < prevRsi && prevRsi < prev2Rsi) {
      rsiTrend = 'down';
    }
    
    // Indicator 1 Logic (RSI + ATR) - Enhanced with multiple levels
    const lowerAtrBand = curEma - (2.5 * curAtr);
    const upperAtrBand = curEma + (2.5 * curAtr);
    // Original logic: RSI < 30 && Price < LowerATR for oversold
    // Enhanced: Also check extreme levels
    const isOversold1 = (curRsi <= rsiLowerBand && c.close < lowerAtrBand) || 
                        (curRsi <= rsiLowerBandExt && c.close < lowerAtrBand);
    const isOverbought1 = (curRsi >= rsiUpperBand && c.close > upperAtrBand) || 
                           (curRsi >= rsiUpperBandExt && c.close > upperAtrBand);

    // Indicator 2 Logic (Alpha Extract)
    const curScore = aggScores[i];
    // Use adjusted upper band for Overbought check, and aggregated lower band for Oversold check
    const curAggLower = aggLowerBands[i]; 
    const curAggUpper = adjustedUpperBands[i];
    
    const isOversold2 = !isNaN(curScore) && !isNaN(curAggLower) && curScore < curAggLower;
    const isOverbought2 = !isNaN(curScore) && !isNaN(curAggUpper) && curScore > curAggUpper;

    return {
      time: c.time,
      price: c.close,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      rsi: curRsi,
      ema20: curEma,
      atr: curAtr,
      lowerAtrBand,
      upperAtrBand,
      isOversold1,
      isOverbought1,
      rsiLevel,
      rsiTrend,
      aggScore: isNaN(curScore) ? 0 : curScore,
      aggLowerBand: isNaN(curAggLower) ? 0 : curAggLower,
      aggUpperBand: isNaN(curAggUpper) ? 0 : curAggUpper,
      isOversold2,
      isOverbought2,
      buySignal: isOversold1 || isOversold2,
      strongBuySignal: isOversold1 && isOversold2,
    };
  });

  return { candles, indicators };
};

export const getAssetSummary = async (id: string): Promise<Asset> => {
    const config = ASSETS_CONFIG.find(a => a.id === id);
    if (!config) throw new Error('Asset not found');
    
    // Analyze latest to get current price
    // Note: This fetches the whole history just for the summary, which is inefficient but simple
    const { indicators } = await analyzeAsset(id);
    const latest = indicators[indicators.length - 1] || { price: 0 };
    const prev = indicators[indicators.length - 2] || { price: 1 };
    
    return {
        ...config,
        price: latest.price,
        change24h: ((latest.price - prev.price) / prev.price) * 100
    };
};

export const getAllAssets = async (): Promise<Asset[]> => {
    // Parallelize requests
    return Promise.all(ASSETS_CONFIG.map(a => getAssetSummary(a.id)));
};
