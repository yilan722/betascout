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
const fetchFromBinance = async (symbol: string, interval: '1d' | '1w' | '15m' | '1m' = '1d'): Promise<Candle[]> => {
  try {
    // Skip USDT-USD (stablecoin, no USDT/USDT trading pair exists)
    if (symbol === 'USDT-USD' || symbol === 'USDTUSDT') {
      throw new Error('USDT-USD is a stablecoin and does not have a trading pair on Binance');
    }
    
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
    // For daily: 730 days (2 years), for weekly: 500 weeks (~9.6 years)
    // For 15m: 1000 candles (~10.4 days), for 1m: 1000 candles (~16.7 hours)
    const limit = interval === '1w' ? 500 : 
                  interval === '15m' ? 1000 :
                  interval === '1m' ? 1000 : 730;
    const url = `${BINANCE_BASE}/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`;
    
    // Try direct fetch first (Binance API should work without CORS proxy)
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
    } catch (fetchError: any) {
      // If direct fetch fails (CORS or network), try with CORS proxy
      if (fetchError.name === 'AbortError' || fetchError.message?.includes('Failed to fetch')) {
        console.warn(`⚠️ Direct Binance fetch failed, trying with CORS proxy...`, fetchError.message);
        try {
          // Use CORS proxy as fallback
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
          response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(15000), // 15 second timeout for proxy
          });
        } catch (proxyError: any) {
          throw new Error(`Network error: ${fetchError.message}. Please check your internet connection.`);
        }
      } else {
        throw fetchError;
      }
    }
    
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
        
        // For intraday intervals (15m, 1m), include time in ISO format
        // For daily/weekly, use date only
        const timeStr = (interval === '15m' || interval === '1m')
          ? new Date(openTime).toISOString()
          : new Date(openTime).toISOString().split('T')[0];
        
        return {
          time: timeStr,
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

export const fetchCandles = async (symbol: string, timeframe: '1D' | '1W' | '15m' | '1m' = '1D'): Promise<Candle[]> => {
  // Map timeframe to API intervals
  const interval = timeframe === '1W' ? '1w' : 
                   timeframe === '15m' ? '15m' :
                   timeframe === '1m' ? '1m' : '1d';
  const yahooInterval = timeframe === '1W' ? '1wk' : 
                        timeframe === '15m' ? '15m' :
                        timeframe === '1m' ? '1m' : '1d';
  
  // For intraday intervals, only use Binance (Yahoo Finance doesn't support these well)
  if (timeframe === '15m' || timeframe === '1m') {
    const isCrypto = symbol.includes('-USD') || symbol.includes('USDT');
    if (isCrypto) {
      try {
        const candles = await fetchFromBinance(symbol, interval);
        if (candles.length > 0) {
          return candles;
        }
      } catch (error: any) {
        throw new Error(`Failed to fetch ${timeframe} data for ${symbol}: ${error.message}`);
      }
    } else {
      throw new Error(`${timeframe} timeframe is only available for crypto assets`);
    }
  }
  
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

// Orderbook data interface
export interface OrderbookSnapshot {
  bids: Array<[string, string]>; // [price, quantity]
  asks: Array<[string, string]>; // [price, quantity]
  timestamp: number;
}

// Fetch orderbook depth from Binance
// Note: Orderbook data is real-time only, historical snapshots are not available via public API
export const fetchOrderbookDepth = async (
  symbol: string, 
  limit: number = 100
): Promise<OrderbookSnapshot | null> => {
  try {
    // Skip USDT-USD (stablecoin, no USDT/USDT trading pair exists)
    if (symbol === 'USDT-USD' || symbol === 'USDTUSDT') {
      console.log(`⚠️ Skipping orderbook fetch for ${symbol} (stablecoin, no trading pair)`);
      return null;
    }
    
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
    
    // Check if it's a crypto symbol
    if (!symbol.includes('-USD') && !symbol.includes('USDT')) {
      // Not a crypto symbol, orderbook not available
      return null;
    }
    
    console.log(`🔄 Fetching orderbook depth for ${symbol} (${binanceSymbol})...`);
    
    // Binance API: Get orderbook depth
    // limit: 5, 10, 20, 50, 100, 500, 1000, 5000
    const url = `${BINANCE_BASE}/depth?symbol=${binanceSymbol}&limit=${limit}`;
    
    // Try direct fetch first, fallback to CORS proxy if needed
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout for orderbook
      });
    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError' || fetchError.message?.includes('Failed to fetch') || fetchError.message?.includes('CORS')) {
        console.warn(`⚠️ Direct orderbook fetch failed, trying with CORS proxy...`);
        // Try multiple CORS proxy options
        const proxyOptions = [
          `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
          `https://corsproxy.io/?${encodeURIComponent(url)}`,
        ];
        
        let lastError = fetchError;
        let proxySuccess = false;
        for (const proxyUrl of proxyOptions) {
          try {
            const proxyResponse = await fetch(proxyUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
              signal: AbortSignal.timeout(10000),
            });
            if (proxyResponse.ok) {
              response = proxyResponse;
              proxySuccess = true;
              break; // Success, exit loop
            }
          } catch (proxyError: any) {
            lastError = proxyError;
            continue; // Try next proxy
          }
        }
        
        // If all proxies failed, throw the last error
        if (!proxySuccess) {
          throw new Error(`Network error: ${lastError.message || 'All CORS proxies failed'}`);
        }
      } else {
        throw fetchError;
      }
    }
    
    if (!response.ok) {
      throw new Error(`Binance API HTTP error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for Binance API error response
    if (data.code && data.code !== 0) {
      throw new Error(`Binance API error: ${data.msg || 'Service unavailable'}`);
    }
    
    // Binance returns: { lastUpdateId, bids: [[price, quantity], ...], asks: [[price, quantity], ...] }
    if (!data.bids || !data.asks || !Array.isArray(data.bids) || !Array.isArray(data.asks)) {
      throw new Error(`Binance API returned invalid format`);
    }
    
    return {
      bids: data.bids,
      asks: data.asks,
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error(`❌ Binance orderbook fetch failed for ${symbol}:`, error);
    return null;
  }
};

// Calculate orderbook imbalance ratio
// depthPct: percentage depth from current price (e.g., 10% means ±10% from current price)
export const calculateOrderbookImbalance = (
  orderbook: OrderbookSnapshot | null,
  currentPrice: number,
  depthPct: number = 10
): { bidVol: number; askVol: number; totalVol: number; ratio: number } | null => {
  if (!orderbook || !currentPrice || currentPrice <= 0) {
    return null;
  }
  
  const priceRange = currentPrice * (depthPct / 100);
  const upperBound = currentPrice + priceRange;
  const lowerBound = currentPrice - priceRange;
  
  // Sum bid volumes within depth range
  let bidVol = 0;
  for (const [priceStr, quantityStr] of orderbook.bids) {
    const price = parseFloat(priceStr);
    const quantity = parseFloat(quantityStr);
    if (price >= lowerBound && price <= currentPrice) {
      bidVol += quantity * price; // Volume in quote currency (USDT)
    }
  }
  
  // Sum ask volumes within depth range
  let askVol = 0;
  for (const [priceStr, quantityStr] of orderbook.asks) {
    const price = parseFloat(priceStr);
    const quantity = parseFloat(quantityStr);
    if (price >= currentPrice && price <= upperBound) {
      askVol += quantity * price; // Volume in quote currency (USDT)
    }
  }
  
  const totalVol = bidVol + askVol;
  const ratio = totalVol > 0 ? (bidVol - askVol) / totalVol : 0;
  const delta = bidVol - askVol; // Delta in USD (like CoinGlass)
  
  return { bidVol, askVol, totalVol, ratio, delta };
};
