import { Candle } from '../types';

// Multiple CORS proxy options as fallback
// Note: CORS proxies can be unreliable. If all fail, consider using a backend proxy server.
const PROXY_OPTIONS = [
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://api.allorigins.win/raw?url=',
];

const BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

// Alternative: Use Alpha Vantage (requires free API key)
// You can get a free key at https://www.alphavantage.co/support/#api-key
const ALPHA_VANTAGE_API_KEY = 'demo'; // Replace with your free API key
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

// Binance API (free, no API key needed for public data)
const BINANCE_BASE = 'https://api.binance.com/api/v3';

// Try fetching with multiple proxy options
export const fetchWithProxy = async (url: string, proxyIndex: number = 0): Promise<Response> => {
  if (proxyIndex >= PROXY_OPTIONS.length) {
    throw new Error('All proxy options failed');
  }
  
  try {
    const proxy = PROXY_OPTIONS[proxyIndex];
    // Different proxies have different URL formats
    let proxyUrl: string;
    if (proxy.includes('corsproxy.io') || proxy.includes('codetabs.com') || proxy.includes('allorigins.win')) {
      proxyUrl = proxy + encodeURIComponent(url);
    } else {
      // Default: append URL directly
      proxyUrl = proxy + url;
    }
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(`Proxy ${proxyIndex} failed: ${response.status} ${response.statusText}`);
      }
      
      // Check if response has valid content (not a CORS error page)
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json') && !contentType.includes('text/html')) {
        throw new Error(`Proxy ${proxyIndex} returned invalid content type: ${contentType}`);
      }
      
      return response;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Check if it's a CORS error, network error, or timeout
      if (fetchError.name === 'AbortError') {
        throw new Error(`Proxy ${proxyIndex} timeout`);
      }
      if (fetchError.message?.includes('CORS') || fetchError.message?.includes('Failed to fetch')) {
        throw new Error(`Proxy ${proxyIndex} CORS/network error`);
      }
      throw fetchError;
    }
  } catch (error: any) {
    // If this is the last proxy, throw the error
    if (proxyIndex >= PROXY_OPTIONS.length - 1) {
      throw error;
    }
    
    // Otherwise, try next proxy
    console.warn(`⚠️ Proxy ${proxyIndex} (${PROXY_OPTIONS[proxyIndex]}) failed, trying next...`, error.message);
    return fetchWithProxy(url, proxyIndex + 1);
  }
};

// Test Binance API connection
export const testBinanceConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const testUrl = `${BINANCE_BASE}/klines?symbol=BTCUSDT&interval=1d&limit=1`;
    const response = await fetch(testUrl);
    const data = await response.json();
    
    // Check if Binance API is restricted in this location
    if (data.code && data.code !== 0) {
      return {
        success: false,
        message: `Binance API restricted: ${data.msg || 'Service unavailable from this location'}`
      };
    }
    
    // Check if we got valid kline data
    if (Array.isArray(data) && data.length > 0) {
      return {
        success: true,
        message: 'Binance API connection successful'
      };
    }
    
    return {
      success: false,
      message: 'Binance API returned unexpected data format'
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Binance API connection failed: ${error.message}`
    };
  }
};

// Fetch from Binance API (for crypto)
const fetchFromBinance = async (symbol: string, interval: '1d' | '1w' = '1d'): Promise<Candle[]> => {
  try {
    // Convert Yahoo Finance crypto format to Binance format
    // BTC-USD -> BTCUSDT, ETH-USD -> ETHUSDT, etc.
    let binanceSymbol = symbol.replace('-USD', 'USDT').toUpperCase();
    
    // Handle special cases
    const symbolMap: Record<string, string> = {
      'PEPE-USD': 'PEPEUSDT',
      // Add more mappings if needed
    };
    
    if (symbolMap[symbol]) {
      binanceSymbol = symbolMap[symbol];
    }
    
    console.log(`🔄 Attempting to fetch ${symbol} from Binance as ${binanceSymbol} (${interval})...`);
    
    // Binance API: Get klines (candles)
    // For daily: 730 days (2 years), for weekly: 500 weeks (~9.6 years) to ensure enough data for indicators
    const limit = interval === '1w' ? 500 : 730;
    const url = `${BINANCE_BASE}/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Binance API HTTP error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for Binance API error response (e.g., location restriction)
    if (data.code && data.code !== 0) {
      throw new Error(`Binance API error: ${data.msg || 'Service unavailable'}`);
    }
    
    // Check if data is an array (valid klines response)
    if (!Array.isArray(data)) {
      throw new Error(`Binance API returned invalid format: ${JSON.stringify(data).substring(0, 100)}`);
    }
    
    // Binance returns array of arrays:
    // [openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, takerBuyBaseVolume, takerBuyQuoteVolume, ignore]
    const candles: Candle[] = data
      .map((kline: any[]) => {
        if (!Array.isArray(kline) || kline.length < 6) return null;
        
        const openTime = kline[0];
        const open = parseFloat(kline[1]);
        const high = parseFloat(kline[2]);
        const low = parseFloat(kline[3]);
        const close = parseFloat(kline[4]);
        const volume = parseFloat(kline[5]);
        
        if (!close || close === 0 || isNaN(close)) return null;
        
        return {
          time: new Date(openTime).toISOString().split('T')[0],
          open: open || close,
          high: high || close,
          low: low || close,
          close: close,
          volume: volume || 0,
        };
      })
      .filter((c: Candle | null): c is Candle => c !== null);
    
    if (candles.length === 0) {
      throw new Error('No valid data returned from Binance');
    }
    
    // Sort by time (oldest first) - Binance returns data in reverse chronological order
    candles.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    
    // Log data range for verification
    const firstDate = candles[0]?.time;
    const lastDate = candles[candles.length - 1]?.time;
    const firstPrice = candles[0]?.close;
    const lastPrice = candles[candles.length - 1]?.close;
    
    console.log(`✅ Binance API: Successfully fetched ${candles.length} candles for ${symbol} (${binanceSymbol})`);
    console.log(`   📅 Data range: ${firstDate} ($${firstPrice?.toFixed(2)}) to ${lastDate} ($${lastPrice?.toFixed(2)})`);
    
    return candles;
  } catch (error: any) {
    console.error(`❌ Binance API fetch failed for ${symbol}:`, error);
    throw error;
  }
};

// Fetch from Alpha Vantage (for stocks)
const fetchFromAlphaVantage = async (symbol: string): Promise<Candle[]> => {
  try {
    // Map symbols to Alpha Vantage format
    const avSymbol = symbol.replace(/[.=]/g, '');
    
    const url = `${ALPHA_VANTAGE_BASE}?function=TIME_SERIES_DAILY&symbol=${avSymbol}&apikey=${ALPHA_VANTAGE_API_KEY}&outputsize=full`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for API error
    if (data['Error Message'] || data['Note']) {
      throw new Error(data['Error Message'] || data['Note']);
    }
    
    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) {
      throw new Error('No time series data found');
    }
    
    const candles: Candle[] = Object.entries(timeSeries)
      .sort(([a], [b]) => a.localeCompare(b)) // Sort by date
      .slice(-730) // Last 730 days (2 years)
      .map(([date, values]: [string, any]) => ({
        time: date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseFloat(values['5. volume']),
      }))
      .filter((c: Candle) => c.close > 0);
    
    return candles;
  } catch (error) {
    console.error(`Alpha Vantage fetch failed for ${symbol}:`, error);
    throw error;
  }
};

export const fetchCandles = async (symbol: string, timeframe: '1D' | '1W' = '1D'): Promise<Candle[]> => {
  // Map timeframe to API intervals
  const interval = timeframe === '1W' ? '1w' : '1d';
  const yahooInterval = timeframe === '1W' ? '1wk' : '1d';
  
  // Strategy 1: For crypto, try Binance API first (free, reliable, no CORS issues)
  const isCrypto = symbol.includes('-USD') || symbol.includes('USDT');
  
  if (isCrypto) {
    try {
      const candles = await fetchFromBinance(symbol, interval);
      if (candles.length > 0) {
        return candles;
      }
    } catch (error: any) {
      console.warn(`⚠️ Binance API failed for ${symbol}, trying Yahoo Finance...`, error.message);
      // Continue to try Yahoo Finance as fallback
    }
  }

  // Strategy 2: Try Yahoo Finance with multiple CORS proxies
  try {
    // For weekly, get more years of data to ensure enough data points for indicators
    const range = timeframe === '1W' ? '10y' : '2y';
    const url = `${BASE_URL}/${symbol}?interval=${yahooInterval}&range=${range}`;
    const response = await fetchWithProxy(url);
    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (result && result.indicators?.quote?.[0]) {
      const quotes = result.indicators.quote[0];
      const timestamps = result.timestamp;

      if (timestamps && quotes && timestamps.length > 0) {
        const candles: Candle[] = timestamps
          .map((ts: number, i: number) => {
            const open = quotes.open?.[i];
            const high = quotes.high?.[i];
            const low = quotes.low?.[i];
            const close = quotes.close?.[i];
            
            if (!close || close === 0) return null;
            
            return {
              time: new Date(ts * 1000).toISOString().split('T')[0],
              open: open || close,
              high: high || close,
              low: low || close,
              close: close,
              volume: quotes.volume?.[i] || 0,
            };
          })
          .filter((c: Candle | null): c is Candle => c !== null);

        if (candles.length > 0) {
          // Sort by time (oldest first) - ensure chronological order
          candles.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
          
          // Log data range for verification
          const firstDate = candles[0]?.time;
          const lastDate = candles[candles.length - 1]?.time;
          const firstPrice = candles[0]?.close;
          const lastPrice = candles[candles.length - 1]?.close;
          
          console.log(`✅ Successfully fetched ${candles.length} candles for ${symbol} via Yahoo Finance`);
          console.log(`   📅 Data range: ${firstDate} ($${firstPrice?.toFixed(2)}) to ${lastDate} ($${lastPrice?.toFixed(2)})`);
          return candles;
        }
      }
    }
  } catch (error) {
    console.warn(`Yahoo Finance with proxies failed for ${symbol}, trying Alpha Vantage...`, error);
  }

  // Strategy 3: Try Alpha Vantage (only for US stocks, not crypto/forex)
  // Alpha Vantage doesn't support crypto or forex in free tier, so skip those
  const isStock = !symbol.includes('-USD') && !symbol.includes('=X') && !symbol.includes('.HK') && !symbol.includes('.SZ') && !symbol.includes('.SS');
  
  if (isStock && ALPHA_VANTAGE_API_KEY !== 'demo') {
    try {
      const candles = await fetchFromAlphaVantage(symbol);
      if (candles.length > 0) {
        console.log(`✅ Successfully fetched ${candles.length} candles for ${symbol} via Alpha Vantage`);
        return candles;
      }
    } catch (error) {
      console.warn(`Alpha Vantage failed for ${symbol}:`, error);
    }
  }

  // If all strategies fail, throw error (don't return empty array)
  throw new Error(`Failed to fetch data for ${symbol} using all available methods. Please check your internet connection or try again later.`);
};
