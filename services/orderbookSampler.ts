// Orderbook Sampling Service
// Periodically samples orderbook data and stores it for historical analysis

import { fetchOrderbookDepth } from './api';
import { saveOrderbookSnapshot } from './orderbookStorage';
import { ASSETS_CONFIG } from './dataService';
import { AssetCategory } from '../types';

// Sampling intervals (in milliseconds)
const SAMPLING_INTERVAL_1M = 60 * 1000; // 1 minute
const SAMPLING_INTERVAL_15M = 15 * 60 * 1000; // 15 minutes

let samplingInterval1m: NodeJS.Timeout | null = null;
let samplingInterval15m: NodeJS.Timeout | null = null;
let isSampling = false;

// Get crypto assets that need sampling
const getCryptoAssets = () => {
  return ASSETS_CONFIG.filter(asset => asset.category === AssetCategory.CRYPTO);
};

// Sample orderbook for a single asset
const sampleAssetOrderbook = async (symbol: string) => {
  try {
    const orderbook = await fetchOrderbookDepth(symbol);
    if (!orderbook) return;
    
    // Get current price from orderbook (mid price)
    const bids = orderbook.bids;
    const asks = orderbook.asks;
    if (bids.length === 0 || asks.length === 0) return;
    
    const bestBid = parseFloat(bids[0][0]);
    const bestAsk = parseFloat(asks[0][0]);
    const midPrice = (bestBid + bestAsk) / 2;
    
    // Save snapshot with 1% depth (like CoinGlass)
    await saveOrderbookSnapshot(symbol, orderbook, midPrice, 1);
  } catch (error: any) {
    console.warn(`Failed to sample orderbook for ${symbol}:`, error.message);
  }
};

// Start sampling for all crypto assets
export const startOrderbookSampling = () => {
  if (isSampling) {
    console.log('📊 Orderbook sampling already running');
    return;
  }
  
  const cryptoAssets = getCryptoAssets();
  if (cryptoAssets.length === 0) {
    console.log('⚠️ No crypto assets found for sampling');
    return;
  }
  
  console.log(`🚀 Starting orderbook sampling for ${cryptoAssets.length} crypto assets...`);
  isSampling = true;
  
  // Sample immediately for all assets
  for (const asset of cryptoAssets) {
    sampleAssetOrderbook(asset.yahooSymbol).catch(console.error);
  }
  
  // Set up 1-minute interval sampling
  samplingInterval1m = setInterval(() => {
    for (const asset of cryptoAssets) {
      sampleAssetOrderbook(asset.yahooSymbol).catch(console.error);
    }
  }, SAMPLING_INTERVAL_1M);
  
  console.log(`✅ Orderbook sampling started (1-minute interval)`);
};

// Stop sampling
export const stopOrderbookSampling = () => {
  if (!isSampling) return;
  
  if (samplingInterval1m) {
    clearInterval(samplingInterval1m);
    samplingInterval1m = null;
  }
  
  if (samplingInterval15m) {
    clearInterval(samplingInterval15m);
    samplingInterval15m = null;
  }
  
  isSampling = false;
  console.log('🛑 Orderbook sampling stopped');
};

// Auto-start sampling when module loads (if in browser)
if (typeof window !== 'undefined') {
  // Start sampling after a short delay to let the app initialize
  setTimeout(() => {
    startOrderbookSampling();
  }, 5000); // Start after 5 seconds
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    stopOrderbookSampling();
  });
}


