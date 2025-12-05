import React, { useState, useEffect, useMemo } from 'react';
import { Asset, IndicatorData } from '../types';
import { analyzeAsset } from '../services/dataService';
import { ASSETS_CONFIG } from '../services/dataService';
import { AlertCircle, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';

interface SignalEvent {
  assetId: string;
  symbol: string;
  name: string;
  category: string;
  signalType: 'strong_buy' | 'buy' | 'sell' | 'overbought';
  signalDate: string;
  price: number;
  rsi: number;
  indicator1: boolean;
  indicator2: boolean;
  daysAgo: number;
}

interface SignalWatchPanelProps {
  timeframe: '1D' | '1W';
}

export const SignalWatchPanel: React.FC<SignalWatchPanelProps> = ({ timeframe }) => {
  const [signals, setSignals] = useState<SignalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'1W' | '1M' | '3M'>('1W');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllSignals = async () => {
      setLoading(true);
      setError(null);
      const allSignals: SignalEvent[] = [];

      try {
        // Calculate date thresholds
        const now = new Date();
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(now.getMonth() - 1);
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);

        // Process all assets
        const promises = ASSETS_CONFIG.map(async (config) => {
          try {
            const { indicators } = await analyzeAsset(config.id, timeframe);
            
            // Find all signals in the data
            indicators.forEach((indicator: IndicatorData) => {
              const signalDate = new Date(indicator.time);
              const daysAgo = Math.floor((now.getTime() - signalDate.getTime()) / (1000 * 60 * 60 * 24));
              
              // Check if signal is within selected period
              let isInPeriod = false;
              if (selectedPeriod === '1W' && signalDate >= oneWeekAgo) isInPeriod = true;
              else if (selectedPeriod === '1M' && signalDate >= oneMonthAgo) isInPeriod = true;
              else if (selectedPeriod === '3M' && signalDate >= threeMonthsAgo) isInPeriod = true;

              if (!isInPeriod) return;

              // Determine signal type
              if (indicator.strongBuySignal) {
                allSignals.push({
                  assetId: config.id,
                  symbol: config.symbol,
                  name: config.name,
                  category: config.category,
                  signalType: 'strong_buy',
                  signalDate: indicator.time,
                  price: indicator.close,
                  rsi: indicator.rsi,
                  indicator1: indicator.isOversold1,
                  indicator2: indicator.isOversold2,
                  daysAgo,
                });
              } else if (indicator.buySignal) {
                allSignals.push({
                  assetId: config.id,
                  symbol: config.symbol,
                  name: config.name,
                  category: config.category,
                  signalType: 'buy',
                  signalDate: indicator.time,
                  price: indicator.close,
                  rsi: indicator.rsi,
                  indicator1: indicator.isOversold1,
                  indicator2: indicator.isOversold2,
                  daysAgo,
                });
              } else if (indicator.isOverbought1 || indicator.isOverbought2) {
                allSignals.push({
                  assetId: config.id,
                  symbol: config.symbol,
                  name: config.name,
                  category: config.category,
                  signalType: indicator.isOverbought1 && indicator.isOverbought2 ? 'overbought' : 'sell',
                  signalDate: indicator.time,
                  price: indicator.close,
                  rsi: indicator.rsi,
                  indicator1: indicator.isOverbought1,
                  indicator2: indicator.isOverbought2,
                  daysAgo,
                });
              }
            });
          } catch (err: any) {
            console.warn(`Failed to analyze ${config.symbol}:`, err.message);
            // Continue with other assets
          }
        });

        await Promise.allSettled(promises);

        // Sort by date (most recent first)
        allSignals.sort((a, b) => new Date(b.signalDate).getTime() - new Date(a.signalDate).getTime());

        setSignals(allSignals);
      } catch (err: any) {
        setError(err.message || 'Failed to load signals');
      } finally {
        setLoading(false);
      }
    };

    fetchAllSignals();
  }, [selectedPeriod, timeframe]);

  const groupedSignals = useMemo(() => {
    const groups: Record<string, SignalEvent[]> = {
      'Strong Buy': signals.filter(s => s.signalType === 'strong_buy'),
      'Buy': signals.filter(s => s.signalType === 'buy'),
      'Sell': signals.filter(s => s.signalType === 'sell'),
      'Overbought': signals.filter(s => s.signalType === 'overbought'),
    };
    return groups;
  }, [signals]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'strong_buy': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'buy': return 'text-green-300 bg-green-300/10 border-green-300/20';
      case 'sell': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'overbought': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'strong_buy':
      case 'buy':
        return <TrendingUp size={16} className="text-green-400" />;
      case 'sell':
      case 'overbought':
        return <TrendingDown size={16} className="text-red-400" />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-slate-900/50 rounded-lg p-6 border border-slate-800">
        <div className="flex items-center justify-center h-32">
          <div className="text-slate-400 text-sm">Loading signals...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-slate-900/50 rounded-lg p-6 border border-slate-800">
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/50 rounded-lg border border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertCircle size={20} className="text-blue-400" />
            Signal Watch Panel
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod('1W')}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                selectedPeriod === '1W'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              1 Week
            </button>
            <button
              onClick={() => setSelectedPeriod('1M')}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                selectedPeriod === '1M'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              1 Month
            </button>
            <button
              onClick={() => setSelectedPeriod('3M')}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                selectedPeriod === '3M'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              3 Months
            </button>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          Showing signals from the last {selectedPeriod === '1W' ? 'week' : selectedPeriod === '1M' ? 'month' : '3 months'} ({signals.length} total)
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
        {signals.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No signals found in the selected period
          </div>
        ) : (
          Object.entries(groupedSignals).map(([groupName, groupSignals]) => {
            if (groupSignals.length === 0) return null;
            
            return (
              <div key={groupName} className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                  {groupName} ({groupSignals.length})
                </h4>
                <div className="space-y-2">
                  {groupSignals.map((signal, idx) => (
                    <div
                      key={`${signal.assetId}-${signal.signalDate}-${idx}`}
                      className={`p-3 rounded-lg border ${getSignalColor(signal.signalType)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getSignalIcon(signal.signalType)}
                            <span className="font-bold text-white">{signal.symbol}</span>
                            <span className="text-slate-400 text-xs">({signal.name})</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {signal.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs mt-2">
                            <div className="flex items-center gap-1 text-slate-400">
                              <Clock size={12} />
                              <span>{formatDate(signal.signalDate)}</span>
                              <span className="text-slate-500 ml-1">
                                ({signal.daysAgo === 0 ? 'Today' : signal.daysAgo === 1 ? '1 day ago' : `${signal.daysAgo} days ago`})
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400">
                              <DollarSign size={12} />
                              <span>${signal.price.toFixed(2)}</span>
                            </div>
                            <div className="text-slate-400">
                              RSI: <span className="text-purple-400">{signal.rsi.toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            {signal.indicator1 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                                Indicator 1
                              </span>
                            )}
                            {signal.indicator2 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                                Indicator 2
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

