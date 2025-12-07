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
}

export type Timeframe = '1D' | '1W';
