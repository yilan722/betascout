// Orderbook History Storage Service
// Stores historical orderbook snapshots in localStorage for indicator4 calculation

import { OrderbookSnapshot, calculateOrderbookImbalance } from './api';

export interface OrderbookHistoryEntry {
  timestamp: number; // Unix timestamp in milliseconds
  symbol: string; // e.g., 'BTC-USD'
  price: number; // Price at the time of snapshot
  imbalance: number; // Calculated imbalance ratio (bidVol - askVol) / totalVol
  delta: number; // Delta in USD: bidVol - askVol (like CoinGlass)
  bidVol: number;
  askVol: number;
  totalVol: number;
}

const STORAGE_PREFIX = 'orderbook_history_';
const MAX_ENTRIES_PER_SYMBOL = 10000; // Keep last 10k entries per symbol
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // Cleanup every 24 hours

// Get storage key for a symbol
const getStorageKey = (symbol: string): string => {
  return `${STORAGE_PREFIX}${symbol}`;
};

// Load historical orderbook data for a symbol
export const loadOrderbookHistory = (symbol: string): OrderbookHistoryEntry[] => {
  try {
    const key = getStorageKey(symbol);
    const data = localStorage.getItem(key);
    if (!data) return [];
    
    const entries: OrderbookHistoryEntry[] = JSON.parse(data);
    // Sort by timestamp (oldest first)
    return entries.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error(`Failed to load orderbook history for ${symbol}:`, error);
    return [];
  }
};

// Save orderbook snapshot
export const saveOrderbookSnapshot = async (
  symbol: string,
  orderbook: OrderbookSnapshot | null,
  currentPrice: number,
  depthPct: number = 1 // Default to 1% like CoinGlass
): Promise<void> => {
  if (!orderbook) return;
  
  try {
    const imbalance = calculateOrderbookImbalance(orderbook, currentPrice, depthPct);
    if (!imbalance) return;
    
    const entry: OrderbookHistoryEntry = {
      timestamp: Date.now(),
      symbol,
      price: currentPrice,
      imbalance: imbalance.ratio,
      delta: imbalance.delta || (imbalance.bidVol - imbalance.askVol), // Delta in USD
      bidVol: imbalance.bidVol,
      askVol: imbalance.askVol,
      totalVol: imbalance.totalVol,
    };
    
    const key = getStorageKey(symbol);
    const existing = loadOrderbookHistory(symbol);
    
    // Add new entry
    existing.push(entry);
    
    // Keep only recent entries (last MAX_ENTRIES_PER_SYMBOL)
    const trimmed = existing.slice(-MAX_ENTRIES_PER_SYMBOL);
    
    // Save to localStorage
    localStorage.setItem(key, JSON.stringify(trimmed));
    
    console.log(`💾 Saved orderbook snapshot for ${symbol}: imbalance=${imbalance.ratio.toFixed(4)}`);
  } catch (error) {
    console.error(`Failed to save orderbook snapshot for ${symbol}:`, error);
  }
};

// Get orderbook history for a time range
export const getOrderbookHistory = (
  symbol: string,
  startTime: number,
  endTime: number
): OrderbookHistoryEntry[] => {
  const all = loadOrderbookHistory(symbol);
  return all.filter(entry => 
    entry.timestamp >= startTime && entry.timestamp <= endTime
  );
};

// Get orderbook history aggregated by timeframe
export const getAggregatedOrderbookHistory = (
  symbol: string,
  timeframe: '15m' | '1m',
  lookbackHours: number = 24
): OrderbookHistoryEntry[] => {
  const all = loadOrderbookHistory(symbol);
  if (all.length === 0) return [];
  
  const now = Date.now();
  const startTime = now - (lookbackHours * 60 * 60 * 1000);
  
  // Filter by time range
  const filtered = all.filter(entry => entry.timestamp >= startTime);
  
  if (filtered.length === 0) return [];
  
  // Aggregate by timeframe
  // For 1m: align to minute boundaries (e.g., 09:32:00, 09:33:00)
  // For 15m: align to 15-minute boundaries (e.g., 09:30:00, 09:45:00)
  const intervalMs = timeframe === '15m' ? 15 * 60 * 1000 : 60 * 1000;
  const aggregated: OrderbookHistoryEntry[] = [];
  const buckets: Map<number, OrderbookHistoryEntry[]> = new Map();
  
  // Group entries into time buckets
  // Align to minute boundaries (like CoinGlass)
  for (const entry of filtered) {
    const date = new Date(entry.timestamp);
    // Round down to minute boundary (or 15-minute boundary)
    let bucketTime: number;
    if (timeframe === '15m') {
      // Align to 15-minute boundaries (00, 15, 30, 45)
      const minutes = date.getMinutes();
      const alignedMinutes = Math.floor(minutes / 15) * 15;
      bucketTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                           date.getHours(), alignedMinutes, 0, 0).getTime();
    } else {
      // Align to minute boundaries (00 seconds)
      bucketTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                           date.getHours(), date.getMinutes(), 0, 0).getTime();
    }
    
    if (!buckets.has(bucketTime)) {
      buckets.set(bucketTime, []);
    }
    buckets.get(bucketTime)!.push(entry);
  }
  
  // Aggregate each bucket
  // For Delta: use the LAST value in the bucket (not average) - like CoinGlass shows the delta at the end of the period
  // For Ratio: average the ratios
  for (const [bucketTime, entries] of buckets.entries()) {
    if (entries.length === 0) continue;
    
    // Sort entries by timestamp within bucket (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);
    
    // Use the LAST entry's delta (most recent snapshot in the bucket)
    // This matches CoinGlass behavior - they show the delta at the end of each minute
    const lastEntry = entries[entries.length - 1];
    
    // Average the ratios for smoother display
    const avgImbalance = entries.reduce((sum, e) => sum + e.imbalance, 0) / entries.length;
    
    // Use last entry's delta (not average) - this is what CoinGlass shows
    const delta = lastEntry.delta || (lastEntry.bidVol - lastEntry.askVol);
    
    // Use last entry's price (most recent)
    const price = lastEntry.price;
    
    // Average volumes for reference
    const avgBidVol = entries.reduce((sum, e) => sum + e.bidVol, 0) / entries.length;
    const avgAskVol = entries.reduce((sum, e) => sum + e.askVol, 0) / entries.length;
    const avgTotalVol = entries.reduce((sum, e) => sum + e.totalVol, 0) / entries.length;
    
    aggregated.push({
      timestamp: bucketTime,
      symbol,
      price: price,
      imbalance: avgImbalance,
      delta: delta, // Use last delta, not average
      bidVol: avgBidVol,
      askVol: avgAskVol,
      totalVol: avgTotalVol,
    });
  }
  
  // Sort by timestamp
  return aggregated.sort((a, b) => a.timestamp - b.timestamp);
};

// Cleanup old entries (keep only last 7 days)
export const cleanupOldEntries = (): void => {
  try {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      if (key.startsWith(STORAGE_PREFIX)) {
        const entries: OrderbookHistoryEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = entries.filter(entry => entry.timestamp >= sevenDaysAgo);
        localStorage.setItem(key, JSON.stringify(filtered));
      }
    }
    
    console.log('🧹 Cleaned up old orderbook entries');
  } catch (error) {
    console.error('Failed to cleanup old entries:', error);
  }
};

// Start periodic cleanup
if (typeof window !== 'undefined') {
  // Run cleanup on load
  cleanupOldEntries();
  
  // Schedule periodic cleanup
  setInterval(cleanupOldEntries, CLEANUP_INTERVAL);
}

