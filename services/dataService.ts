import { Asset, AssetCategory, Candle, IndicatorData } from '../types';
import { calculateEMA, calculateRSI, calculateATR, avg, stdDev } from '../utils/math';

// --- Configuration ---

export const ASSETS_CONFIG: Omit<Asset, 'price' | 'change24h'>[] = [
  // US Stocks
  { id: 'NVDA', symbol: 'NVDA', name: 'NVIDIA', category: AssetCategory.US_STOCKS },
  { id: 'TSLA', symbol: 'TSLA', name: 'Tesla', category: AssetCategory.US_STOCKS },
  { id: 'AAPL', symbol: 'AAPL', name: 'Apple', category: AssetCategory.US_STOCKS },
  { id: 'MSFT', symbol: 'MSFT', name: 'Microsoft', category: AssetCategory.US_STOCKS },
  { id: 'AMZN', symbol: 'AMZN', name: 'Amazon', category: AssetCategory.US_STOCKS },
  
  // China A-Shares
  { id: '300750', symbol: '300750', name: 'CATL (Ningde)', category: AssetCategory.CN_A_SHARES },
  { id: '600519', symbol: '600519', name: 'Kweichow Moutai', category: AssetCategory.CN_A_SHARES },
  { id: '300059', symbol: '300059', name: 'East Money', category: AssetCategory.CN_A_SHARES },
  
  // HK Stocks
  { id: '00700', symbol: '00700', name: 'Tencent', category: AssetCategory.HK_STOCKS },
  { id: '09988', symbol: '09988', name: 'Alibaba', category: AssetCategory.HK_STOCKS },
  { id: '03690', symbol: '03690', name: 'Meituan', category: AssetCategory.HK_STOCKS },

  // Crypto
  { id: 'BTC', symbol: 'BTC', name: 'Bitcoin', category: AssetCategory.CRYPTO },
  { id: 'ETH', symbol: 'ETH', name: 'Ethereum', category: AssetCategory.CRYPTO },
  { id: 'SOL', symbol: 'SOL', name: 'Solana', category: AssetCategory.CRYPTO },
  { id: 'PEPE', symbol: 'PEPE', name: 'Pepe', category: AssetCategory.CRYPTO },
  
  // Commodities
  { id: 'GOLD', symbol: 'XAU', name: 'Gold', category: AssetCategory.COMMODITIES },
  { id: 'OIL', symbol: 'WTI', name: 'Crude Oil', category: AssetCategory.COMMODITIES },
  
  // Forex
  { id: 'EURUSD', symbol: 'EUR/USD', name: 'Euro', category: AssetCategory.FOREX },
  { id: 'USDJPY', symbol: 'USD/JPY', name: 'Yen', category: AssetCategory.FOREX },
];

// --- Mock Data Generator ---

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

export const analyzeAsset = (assetId: string): { candles: Candle[], indicators: IndicatorData[] } => {
  // 1. Generate Mock Data (Deterministic based on ID for consistency in demo)
  const seed = assetId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const startPrice = seed % 1000 + 50; 
  const volatility = 0.04; // High volatility to ensure signals trigger
  const candles = generateRandomWalk(startPrice, volatility, 730); // Increased from 200 to 730

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);

  // 2. Calculate Indicators
  
  // --- Indicator 1: RSI + ATR + BB ---
  const rsi = calculateRSI(closes, 14);
  const ema20 = calculateEMA(closes, 20);
  const atr = calculateATR(highs, lows, closes, 14);
  
  // --- Indicator 2: Simulated Aggregated Score ---
  // In a real app, this uses Sortino/Omega ratios. 
  // For demo, we simulate a mean-reverting oscillator derived from Normalized RSI + Momentum
  const aggScores: number[] = [];
  const lookback = 20;
  
  for(let i=0; i<closes.length; i++) {
      if(i < lookback) {
          aggScores.push(0);
          continue;
      }
      // Fake complexity: (Close - SMA) / Stdev
      const slice = closes.slice(i-lookback, i+1);
      const mean = avg(slice);
      const std = stdDev(slice);
      const zScore = (closes[i] - mean) / (std || 1);
      
      // Smooth it to look like the indicator provided
      aggScores.push(zScore * 10); // Scale to similar range as description (around +/- 40 max)
  }

  // Calculate Bands for Indicator 2
  const aggUpperBands: number[] = [];
  const aggLowerBands: number[] = [];
  
  // Rolling bands simulation
  const bandWindow = 50;
  for(let i=0; i<aggScores.length; i++) {
      if(i < bandWindow) {
          aggUpperBands.push(20);
          aggLowerBands.push(-20);
          continue;
      }
      const slice = aggScores.slice(i - bandWindow, i);
      const dev = stdDev(slice);
      const mid = avg(slice);
      aggUpperBands.push(mid + dev * 1.8);
      aggLowerBands.push(mid - dev * 1.8);
  }


  // 3. Combine Data Frame
  const indicators: IndicatorData[] = candles.map((c, i) => {
    // Safety check for array bounds
    const curRsi = rsi[i] || 50;
    const curEma = ema20[i] || c.close;
    const curAtr = atr[i] || 0;
    
    // Indicator 1 Logic
    const lowerAtrBand = curEma - (2.5 * curAtr);
    const upperAtrBand = curEma + (2.5 * curAtr);
    const isOversold1 = curRsi < 30 && c.close < lowerAtrBand;
    const isOverbought1 = curRsi > 70 && c.close > upperAtrBand;

    // Indicator 2 Logic
    const curScore = aggScores[i];
    const curAggLower = aggLowerBands[i];
    const curAggUpper = aggUpperBands[i];
    const isOversold2 = curScore < curAggLower;
    const isOverbought2 = curScore > curAggUpper;

    return {
      time: c.time,
      price: c.close,
      rsi: curRsi,
      ema20: curEma,
      atr: curAtr,
      lowerAtrBand,
      upperAtrBand,
      isOversold1,
      isOverbought1,
      aggScore: curScore,
      aggLowerBand: curAggLower,
      aggUpperBand: curAggUpper,
      isOversold2,
      isOverbought2,
      buySignal: isOversold1 || isOversold2,
      strongBuySignal: isOversold1 && isOversold2,
    };
  });

  return { candles, indicators };
};

export const getAssetSummary = (id: string): Asset => {
    const config = ASSETS_CONFIG.find(a => a.id === id);
    if (!config) throw new Error('Asset not found');
    
    // Analyze latest to get current price
    const { indicators } = analyzeAsset(id);
    const latest = indicators[indicators.length - 1];
    const prev = indicators[indicators.length - 2];
    
    return {
        ...config,
        price: latest.price,
        change24h: ((latest.price - prev.price) / prev.price) * 100
    };
};

export const getAllAssets = (): Asset[] => {
    return ASSETS_CONFIG.map(a => getAssetSummary(a.id));
};