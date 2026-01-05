import React, { useState, useEffect, useMemo } from 'react';
import { Asset, IndicatorData } from '../types';
import { analyzeAsset } from '../services/dataService';
import { ASSETS_CONFIG } from '../services/dataService';
import { AlertCircle, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

interface SignalEvent {
  assetId: string;
  symbol: string;
  name: string;
  category: string;
  signalType: 'strong_buy' | 'buy' | 'sell' | 'overbought' | 'new_zone' | 'imminent_breakout' | 'breakout_up' | 'breakout_down' | 'supertrend_alert1' | 'supertrend_alert2' | 'supertrend_alert3';
  signalDate: string;
  price: number;
  rsi: number;
  indicator1: boolean;
  indicator2: boolean;
  indicator3: boolean;
  indicator5?: boolean;
  alertLevel?: number;
  daysAgo: number;
}

interface SignalWatchPanelProps {
  timeframe: '1D' | '1W';
}

export const SignalWatchPanel: React.FC<SignalWatchPanelProps> = ({ timeframe }) => {
  const { t, language } = useTranslation();
  const [signals, setSignals] = useState<SignalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'1W' | '1M' | '3M'>('1W');
  const [filterMode, setFilterMode] = useState<'all' | 'multi_resonance'>('all');
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
              // Indicator 5 signals (highest priority - Supertrend alerts)
              if (indicator.supertrendAlertLevel === 3) {
                allSignals.push({
                  assetId: config.id,
                  symbol: config.symbol,
                  name: config.name,
                  category: config.category,
                  signalType: 'supertrend_alert3',
                  signalDate: indicator.time,
                  price: indicator.close,
                  rsi: indicator.rsi,
                  indicator1: indicator.isOversold1,
                  indicator2: indicator.isOversold2,
                  indicator3: false,
                  indicator5: true,
                  alertLevel: 3,
                  daysAgo,
                });
              } else if (indicator.supertrendAlertLevel === 2) {
                allSignals.push({
                  assetId: config.id,
                  symbol: config.symbol,
                  name: config.name,
                  category: config.category,
                  signalType: 'supertrend_alert2',
                  signalDate: indicator.time,
                  price: indicator.close,
                  rsi: indicator.rsi,
                  indicator1: indicator.isOversold1,
                  indicator2: indicator.isOversold2,
                  indicator3: false,
                  indicator5: true,
                  alertLevel: 2,
                  daysAgo,
                });
              } else if (indicator.supertrendAlertLevel === 1) {
                allSignals.push({
                  assetId: config.id,
                  symbol: config.symbol,
                  name: config.name,
                  category: config.category,
                  signalType: 'supertrend_alert1',
                  signalDate: indicator.time,
                  price: indicator.close,
                  rsi: indicator.rsi,
                  indicator1: indicator.isOversold1,
                  indicator2: indicator.isOversold2,
                  indicator3: false,
                  indicator5: true,
                  alertLevel: 1,
                  daysAgo,
                });
              }
              // Indicator 3 signals (priority)
              else if (indicator.isBreakoutUp) {
                allSignals.push({
                  assetId: config.id,
                  symbol: config.symbol,
                  name: config.name,
                  category: config.category,
                  signalType: 'breakout_up',
                  signalDate: indicator.time,
                  price: indicator.close,
                  rsi: indicator.rsi,
                  indicator1: indicator.isOversold1,
                  indicator2: indicator.isOversold2,
                  indicator3: true,
                  indicator5: (indicator.supertrendAlertLevel !== undefined && indicator.supertrendAlertLevel > 0),
                  alertLevel: indicator.supertrendAlertLevel,
                  daysAgo,
                });
              } else if (indicator.isBreakoutDown) {
                allSignals.push({
                  assetId: config.id,
                  symbol: config.symbol,
                  name: config.name,
                  category: config.category,
                  signalType: 'breakout_down',
                  signalDate: indicator.time,
                  price: indicator.close,
                  rsi: indicator.rsi,
                  indicator1: indicator.isOversold1,
                  indicator2: indicator.isOversold2,
                  indicator3: true,
                  indicator5: (indicator.supertrendAlertLevel !== undefined && indicator.supertrendAlertLevel > 0),
                  alertLevel: indicator.supertrendAlertLevel,
                  daysAgo,
                });
              } else if (indicator.isImminentBreakout) {
                allSignals.push({
                  assetId: config.id,
                  symbol: config.symbol,
                  name: config.name,
                  category: config.category,
                  signalType: 'imminent_breakout',
                  signalDate: indicator.time,
                  price: indicator.close,
                  rsi: indicator.rsi,
                  indicator1: indicator.isOversold1,
                  indicator2: indicator.isOversold2,
                  indicator3: true,
                  indicator5: (indicator.supertrendAlertLevel !== undefined && indicator.supertrendAlertLevel > 0),
                  alertLevel: indicator.supertrendAlertLevel,
                  daysAgo,
                });
              } else if (indicator.isNewZone) {
                allSignals.push({
                  assetId: config.id,
                  symbol: config.symbol,
                  name: config.name,
                  category: config.category,
                  signalType: 'new_zone',
                  signalDate: indicator.time,
                  price: indicator.close,
                  rsi: indicator.rsi,
                  indicator1: indicator.isOversold1,
                  indicator2: indicator.isOversold2,
                  indicator3: true,
                  indicator5: (indicator.supertrendAlertLevel !== undefined && indicator.supertrendAlertLevel > 0),
                  alertLevel: indicator.supertrendAlertLevel,
                  daysAgo,
                });
              } else if (indicator.strongBuySignal) {
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
                  indicator3: false,
                  indicator5: (indicator.supertrendAlertLevel !== undefined && indicator.supertrendAlertLevel > 0),
                  alertLevel: indicator.supertrendAlertLevel,
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
                  indicator3: false,
                  indicator5: (indicator.supertrendAlertLevel !== undefined && indicator.supertrendAlertLevel > 0),
                  alertLevel: indicator.supertrendAlertLevel,
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
                  indicator3: false,
                  indicator5: (indicator.supertrendAlertLevel !== undefined && indicator.supertrendAlertLevel > 0),
                  alertLevel: indicator.supertrendAlertLevel,
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

  // Filter signals based on filter mode
  const filteredSignals = useMemo(() => {
    if (filterMode === 'multi_resonance') {
      // Filter for signals where indicator 1, 2, 3, and 5 all have signals
      return signals.filter(s => 
        s.indicator1 && s.indicator2 && s.indicator3 && s.indicator5
      );
    }
    return signals;
  }, [signals, filterMode]);

  const groupedSignals = useMemo(() => {
    const groups: Record<string, SignalEvent[]> = {
      // Multi-Indicator Resonance (all indicators signal together)
      [language === 'zh' ? '🔥 多指标共振' : '🔥 Multi-Indicator Resonance']: filteredSignals.filter(s => 
        s.indicator1 && s.indicator2 && s.indicator3 && s.indicator5
      ),
      [language === 'zh' ? 'Supertrend 3级预警' : 'Supertrend Alert 3']: filteredSignals.filter(s => s.signalType === 'supertrend_alert3'),
      [language === 'zh' ? 'Supertrend 2级预警' : 'Supertrend Alert 2']: filteredSignals.filter(s => s.signalType === 'supertrend_alert2'),
      [language === 'zh' ? 'Supertrend 1级预警' : 'Supertrend Alert 1']: filteredSignals.filter(s => s.signalType === 'supertrend_alert1'),
      [t.signals.breakoutUp]: filteredSignals.filter(s => s.signalType === 'breakout_up'),
      [t.signals.breakoutDown]: filteredSignals.filter(s => s.signalType === 'breakout_down'),
      [t.signals.imminentBreakout]: filteredSignals.filter(s => s.signalType === 'imminent_breakout'),
      [t.signals.newZone]: filteredSignals.filter(s => s.signalType === 'new_zone'),
      [t.signals.strongBuy]: filteredSignals.filter(s => s.signalType === 'strong_buy'),
      [t.signals.buy]: filteredSignals.filter(s => s.signalType === 'buy'),
      [t.signals.sell]: filteredSignals.filter(s => s.signalType === 'sell'),
      [t.signals.overbought]: filteredSignals.filter(s => s.signalType === 'overbought'),
    };
    return groups;
  }, [filteredSignals, t, language]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'supertrend_alert3': return 'text-red-500 bg-red-500/20 border-red-500/40';
      case 'supertrend_alert2': return 'text-orange-500 bg-orange-500/20 border-orange-500/40';
      case 'supertrend_alert1': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/40';
      case 'breakout_up': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'breakout_down': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'imminent_breakout': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'new_zone': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'strong_buy': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'buy': return 'text-green-300 bg-green-300/10 border-green-300/20';
      case 'sell': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'overbought': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'supertrend_alert3':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'supertrend_alert2':
        return <AlertCircle size={16} className="text-orange-500" />;
      case 'supertrend_alert1':
        return <AlertCircle size={16} className="text-yellow-500" />;
      case 'breakout_up':
        return <TrendingUp size={16} className="text-blue-400" />;
      case 'breakout_down':
        return <TrendingDown size={16} className="text-red-500" />;
      case 'imminent_breakout':
        return <AlertCircle size={16} className="text-yellow-400" />;
      case 'new_zone':
        return <AlertCircle size={16} className="text-purple-400" />;
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
          <div className="text-slate-400 text-sm">{t.common.loading}</div>
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
      {/* Filter Rules Explanation */}
      <div className="p-4 border-b border-slate-800 bg-slate-800/30">
        <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <AlertCircle size={16} className="text-blue-400" />
          {language === 'zh' ? '筛选规则说明' : 'Filter Rules'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/50 p-2 rounded border border-blue-500/20">
            <div className="font-bold text-blue-400 mb-1">Indicator 1 (RSI+ATR)</div>
            <div className="text-slate-400">
              {language === 'zh' 
                ? 'RSI < 30 且 价格 < EMA20 - 2.5*ATR' 
                : 'RSI < 30 AND Price < EMA20 - 2.5*ATR'}
            </div>
          </div>
          <div className="bg-slate-900/50 p-2 rounded border border-purple-500/20">
            <div className="font-bold text-purple-400 mb-1">Indicator 2 (Alpha Score)</div>
            <div className="text-slate-400">
              {language === 'zh' 
                ? '综合评分 < 动态下统计带' 
                : 'Aggregated Score < Lower Band'}
            </div>
          </div>
          <div className="bg-slate-900/50 p-2 rounded border border-cyan-500/20">
            <div className="font-bold text-cyan-400 mb-1">Indicator 3 (Energy Reactor)</div>
            <div className="text-slate-400">
              {language === 'zh' 
                ? '新区间/即将突破/突破信号' 
                : 'New Zone/Imminent/Breakout'}
            </div>
          </div>
          <div className="bg-slate-900/50 p-2 rounded border border-orange-500/20">
            <div className="font-bold text-orange-400 mb-1">Indicator 5 (Supertrend)</div>
            <div className="text-slate-400">
              {language === 'zh' 
                ? '价格触及ST1/ST2/ST3线' 
                : 'Price touches ST1/ST2/ST3'}
            </div>
          </div>
        </div>
        <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded">
          <div className="font-bold text-yellow-400 text-xs mb-1">
            {language === 'zh' ? '🔥 多指标共振' : '🔥 Multi-Indicator Resonance'}
          </div>
          <div className="text-slate-400 text-xs">
            {language === 'zh' 
              ? '当Indicator 1、2、3、5同时出现信号时触发，表示多个技术指标共振，信号强度最高' 
              : 'Triggers when Indicators 1, 2, 3, and 5 all signal simultaneously. Highest signal strength.'}
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertCircle size={20} className="text-blue-400" />
            {t.watchPanel.title}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                filterMode === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {language === 'zh' ? '全部信号' : 'All Signals'}
            </button>
            <button
              onClick={() => setFilterMode('multi_resonance')}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                filterMode === 'multi_resonance'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {language === 'zh' ? '🔥 多指标共振' : '🔥 Resonance'}
            </button>
            <button
              onClick={() => setSelectedPeriod('1W')}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                selectedPeriod === '1W'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t.watchPanel.oneWeek}
            </button>
            <button
              onClick={() => setSelectedPeriod('1M')}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                selectedPeriod === '1M'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t.watchPanel.oneMonth}
            </button>
            <button
              onClick={() => setSelectedPeriod('3M')}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                selectedPeriod === '3M'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t.watchPanel.threeMonths}
            </button>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          {t.watchPanel.showingSignals} {selectedPeriod === '1W' ? (language === 'zh' ? '1周' : 'week') : selectedPeriod === '1M' ? (language === 'zh' ? '1个月' : 'month') : (language === 'zh' ? '3个月' : '3 months')} 
          {filterMode === 'multi_resonance' 
            ? ` (${language === 'zh' ? '仅显示多指标共振' : 'Multi-Indicator Resonance only'})` 
            : ''} 
          ({filteredSignals.length} {t.watchPanel.total})
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
        {filteredSignals.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            {filterMode === 'multi_resonance' 
              ? (language === 'zh' ? '未找到多指标共振信号' : 'No multi-indicator resonance signals found')
              : t.watchPanel.noSignals}
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
                      className={`p-2 rounded-lg border ${getSignalColor(signal.signalType)}`}
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          {getSignalIcon(signal.signalType)}
                        </div>
                        
                        {/* Symbol and Name */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="font-bold text-white text-sm">{signal.symbol}</span>
                          <span className="text-slate-400 text-xs">({signal.name})</span>
                        </div>
                        
                        {/* Category */}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 flex-shrink-0">
                          {signal.category}
                        </span>
                        
                        {/* Date */}
                        <div className="flex items-center gap-1 text-slate-400 text-xs flex-shrink-0">
                          <Clock size={11} />
                          <span>{formatDate(signal.signalDate)}</span>
                          <span className="text-slate-500">
                            ({signal.daysAgo === 0 ? t.common.today : signal.daysAgo === 1 ? t.common.dayAgo : `${signal.daysAgo} ${t.common.daysAgo}`})
                          </span>
                        </div>
                        
                        {/* Price */}
                        <div className="flex items-center gap-1 text-slate-400 text-xs flex-shrink-0">
                          <DollarSign size={11} />
                          <span>${signal.price.toFixed(2)}</span>
                        </div>
                        
                        {/* RSI */}
                        <div className="text-slate-400 text-xs flex-shrink-0">
                          RSI: <span className="text-purple-400 font-semibold">{signal.rsi.toFixed(1)}</span>
                        </div>
                        
                        {/* Indicator badges */}
                        <div className="flex gap-1.5 flex-shrink-0 ml-auto">
                          {signal.indicator1 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                              {t.watchPanel.indicator1}
                            </span>
                          )}
                          {signal.indicator2 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                              {t.watchPanel.indicator2}
                            </span>
                          )}
                          {signal.indicator3 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                              {t.watchPanel.indicator3}
                            </span>
                          )}
                          {signal.indicator5 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              signal.alertLevel === 3 ? 'bg-red-500/30 text-red-300' :
                              signal.alertLevel === 2 ? 'bg-orange-500/30 text-orange-300' :
                              'bg-yellow-500/30 text-yellow-300'
                            }`}>
                              {language === 'zh' ? '指标5' : 'Ind5'} {signal.alertLevel}
                            </span>
                          )}
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

