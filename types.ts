export enum AssetCategory {
  US_STOCKS = 'US Stocks',
  CN_A_SHARES = 'China A-Shares',
  HK_STOCKS = 'HK Stocks',
  COMMODITIES = 'Commodities',
  CRYPTO = 'Crypto',
  FOREX = 'Forex',
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  category: AssetCategory;
  price: number;
  change24h: number;
  industry?: string; // 行业分类
  marketCap?: string; // 市值情况 (如: "大市值", "中市值", "小市值" 或具体数值)
}

export interface Candle {
  time: string; // ISO date
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorData {
  time: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  
  // Indicator 1: RSI + ATR + EMA
  rsi: number;
  ema20: number;
  atr: number;
  lowerAtrBand: number; // EMA20 - 2.5 * ATR
  upperAtrBand: number; // EMA20 + 2.5 * ATR
  isOversold1: boolean; // RSI < 30 && Price < LowerATR
  isOverbought1: boolean; // RSI > 70 && Price > UpperATR
  // Enhanced RSI levels (based on Pine Script)
  rsiLevel: 'extreme_oversold' | 'oversold' | 'neutral' | 'overbought' | 'extreme_overbought';
  rsiTrend: 'up' | 'down' | 'neutral'; // RSI momentum trend

  // Indicator 2: Aggregated Scores
  aggScore: number;
  aggLowerBand: number;
  aggUpperBand: number;
  isOversold2: boolean; // Score < LowerBand
  isOverbought2: boolean;
  
  // Combined Signals
  buySignal: boolean; // Just entered oversold or confirmed bottom
  strongBuySignal: boolean; // Both indicators oversold
  
  // Indicator 3: Latent Energy Reactor
  latentEnergy: number; // Energy level (0-100)
  rangeTop: number; // Current range top
  rangeBottom: number; // Current range bottom
  rangePhase: 'forming' | 'growth' | 'mature' | 'exhaustion' | 'none'; // Range maturity phase
  breakoutDirection: 'bullish' | 'bearish' | 'neutral' | 'none'; // Predicted breakout direction
  breakoutConfidence: number; // Confidence level (0-100)
  breakoutQuality: number; // Breakout quality score (0-100)
  isNewZone: boolean; // New consolidation zone formed
  isImminentBreakout: boolean; // Breakout is imminent (energy >= 80 && quality >= 70)
  isBreakoutUp: boolean; // Bullish breakout confirmed
  isBreakoutDown: boolean; // Bearish breakout confirmed
  
  // Indicator 4: SCF Orderbook Imbalance (Only available for crypto assets)
  orderbookImbalance?: number; // (bidVol - askVol) / totalVol, range: -1 to 1 (Ratio)
  orderbookDelta?: number; // bidVol - askVol in USD (Delta, like CoinGlass)
  orderbookMaRatio?: number; // MA of imbalance ratio
  orderbookOscillator?: number; // ratioSeries - maRatio (the diffSeries)
  orderbookBaseline?: number; // Always 0
  hasOrderbookData?: boolean; // Whether orderbook data is available for this asset
  // Indicator 4 Buy/Sell Signals
  isOversold4?: boolean; // Buy signal: Oscillator > 0.1 (strong buying pressure, positive delta)
  isOverbought4?: boolean; // Sell signal: Oscillator < -0.1 (strong selling pressure, negative delta)
  
  // Indicator 5: Triple Lines Supertrend
  supertrend1?: number; // Supertrend 1 value (ATR Period=10, Multiplier=3.0)
  supertrend2?: number; // Supertrend 2 value (ATR Period=10, Multiplier=3.6)
  supertrend3?: number; // Supertrend 3 value (ATR Period=10, Multiplier=4.3)
  supertrendTrend1?: 1 | -1; // Trend direction for ST1: 1=up, -1=down
  supertrendTrend2?: 1 | -1; // Trend direction for ST2: 1=up, -1=down
  supertrendTrend3?: 1 | -1; // Trend direction for ST3: 1=up, -1=down
  supertrendAlertLevel?: 0 | 1 | 2 | 3; // Alert level: 0=none, 1=touched ST1, 2=touched ST2, 3=touched ST3 (most important)
  supertrendTouching1?: boolean; // Price touching ST1
  supertrendTouching2?: boolean; // Price touching ST2
  supertrendTouching3?: boolean; // Price touching ST3
}

export type Timeframe = '1D' | '1W' | '15m' | '1m';
