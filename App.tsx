import React, { useState, useEffect, useMemo } from 'react';
import { Asset, AssetCategory, IndicatorData } from './types';
import { ASSETS_CONFIG, getAllAssets, analyzeAsset, getAssetSummary } from './services/dataService';
import { Timeframe } from './types';
import { testBinanceConnection } from './services/api';
import AssetCard from './components/AssetCard';
import { MainPriceChart, OscillatorChart, LatentEnergyChart } from './components/IndicatorChart';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SignalWatchPanel } from './components/SignalWatchPanel';
import { MacroDashboard } from './components/MacroDashboard';
import { Bell, Activity, Layers, Menu, X, Globe, DollarSign, Cpu, BarChart3, Eye, Languages, Search, TrendingUp } from 'lucide-react';
import { useTranslation } from './i18n/useTranslation';

// Icons map
const CategoryIcons: Record<AssetCategory, React.ReactNode> = {
  [AssetCategory.US_STOCKS]: <DollarSign size={16} />,
  [AssetCategory.CN_A_SHARES]: <Globe size={16} />,
  [AssetCategory.HK_STOCKS]: <Activity size={16} />,
  [AssetCategory.CRYPTO]: <Cpu size={16} />,
  [AssetCategory.COMMODITIES]: <Layers size={16} />,
  [AssetCategory.FOREX]: <DollarSign size={16} />,
};

const App: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const [selectedAssetId, setSelectedAssetId] = useState<string>(ASSETS_CONFIG[0].id);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [marketData, setMarketData] = useState<{ candles: any[], indicators: IndicatorData[] } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [binanceStatus, setBinanceStatus] = useState<{ tested: boolean; available: boolean; message: string } | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [viewMode, setViewMode] = useState<'chart' | 'watch' | 'macro'>('chart');

  // Test Binance API connection on mount
  useEffect(() => {
    const testConnection = async () => {
      console.log('🔍 Testing Binance API connection...');
      const result = await testBinanceConnection();
      setBinanceStatus({
        tested: true,
        available: result.success,
        message: result.message
      });
      
      if (result.success) {
        console.log('✅ Binance API is available and working!');
      } else {
        console.warn('⚠️ Binance API test result:', result.message);
        console.log('📝 The app will fallback to Yahoo Finance for crypto data.');
      }
    };
    
    testConnection();
  }, []);

  // Load initial asset list
  useEffect(() => {
    const loadAssets = async () => {
      setIsLoading(true);
      try {
        // Load assets one by one, so if some fail, others can still be displayed
        const assetPromises = ASSETS_CONFIG.map(async (config) => {
          try {
            return await getAssetSummary(config.id);
          } catch (error) {
            console.warn(`Failed to load ${config.id}:`, error);
            // Return a placeholder asset so it still appears in the list
            // User can still click it, but will see error when trying to view chart
            return {
              ...config,
              price: 0,
              change24h: 0,
            } as Asset;
          }
        });
        
        const results = await Promise.allSettled(assetPromises);
        const loadedAssets = results
          .map((result) => {
            if (result.status === 'fulfilled') {
              return result.value;
            } else {
              // If promise rejected, create placeholder from config
              const configIndex = results.indexOf(result);
              const config = ASSETS_CONFIG[configIndex];
              return {
                ...config,
                price: 0,
                change24h: 0,
              } as Asset;
            }
          })
          .filter((asset): asset is Asset => asset !== null);
        
        setAssets(loadedAssets);
        
        // Debug: log category distribution
        if (process.env.NODE_ENV === 'development') {
          const categoryCounts = loadedAssets.reduce((acc, asset) => {
            acc[asset.category] = (acc[asset.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          console.log('Loaded assets by category:', categoryCounts);
          console.log('Sample assets:', loadedAssets.slice(0, 5).map(a => ({ id: a.id, category: a.category })));
        }
        
        // Check if any assets have valid prices (not all failed)
        const validAssets = loadedAssets.filter(a => a.price > 0);
        if (validAssets.length === 0 && loadedAssets.length > 0) {
          setError("Some assets failed to load. You can still browse the list, but charts may not work.");
        }
      } catch (error: any) {
        console.error("Failed to load assets", error);
        setError(error?.message || "Failed to load asset list. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };
    loadAssets();
  }, []);

  // When category changes, auto-select first asset in that category if current asset is not in the new category
  useEffect(() => {
    if (assets.length === 0) return;
    
    const currentAsset = assets.find(a => a.id === selectedAssetId);
    
    if (selectedCategory !== 'ALL') {
      // If current asset is not in the selected category, select first asset in that category
      if (!currentAsset || currentAsset.category !== selectedCategory) {
        // Filter assets by category first
        const categoryAssets = assets.filter(a => a.category === selectedCategory);
        if (categoryAssets.length > 0) {
          setSelectedAssetId(categoryAssets[0].id);
        }
      }
    } else {
      // If switching to ALL and no current asset, select first available
      if (!currentAsset && assets.length > 0) {
        setSelectedAssetId(assets[0].id);
      }
    }
  }, [selectedCategory, assets, selectedAssetId]);

  // Analyze selected asset
  useEffect(() => {
    const loadMarketData = async () => {
      if (selectedAssetId) {
        setMarketData(null);
        setError(null);
        try {
          const data = await analyzeAsset(selectedAssetId, timeframe);
          // Verify data integrity before setting state to avoid Recharts crashes
          const validIndicators = data.indicators.map(d => ({
              ...d,
              // Ensure no NaNs pass through for critical fields
              open: isNaN(d.open) ? 0 : d.open,
              high: isNaN(d.high) ? 0 : d.high,
              low: isNaN(d.low) ? 0 : d.low,
              close: isNaN(d.close) ? 0 : d.close,
              price: isNaN(d.price) ? 0 : d.price,
              rsi: isNaN(d.rsi) ? 50 : d.rsi,
              ema20: isNaN(d.ema20) ? d.close : d.ema20,
              lowerAtrBand: isNaN(d.lowerAtrBand) ? d.close : d.lowerAtrBand,
              upperAtrBand: isNaN(d.upperAtrBand) ? d.close : d.upperAtrBand,
              aggScore: isNaN(d.aggScore) ? 0 : d.aggScore,
              aggUpperBand: isNaN(d.aggUpperBand) ? 0 : d.aggUpperBand,
              aggLowerBand: isNaN(d.aggLowerBand) ? 0 : d.aggLowerBand,
          }));
          setMarketData({ ...data, indicators: validIndicators });
        } catch (error: any) {
          console.error("Failed to analyze asset", error);
          setError(error?.message || "Failed to load market data. Please check your internet connection and try again.");
        }
      }
    };
    loadMarketData();
  }, [selectedAssetId, timeframe]);

  // Determine status for sidebar highlighting
  const getAssetStatus = (id: string) => {
    if (id === selectedAssetId && marketData) {
        const last = marketData.indicators[marketData.indicators.length - 1];
        if (last) {
            if (last.strongBuySignal) return 'strong_buy';
            if (last.buySignal) return 'buy';
            if (last.isOverbought1 || last.isOverbought2) return 'sell';
        }
    }
    return 'neutral';
  };

  // Filter assets by category and search query
  const filteredAssets = useMemo(() => {
    let filtered = assets;
    
    // Filter by category - ensure strict comparison
    if (selectedCategory !== 'ALL') {
      const beforeCount = filtered.length;
      filtered = filtered.filter(a => {
        // Ensure we're comparing the same type
        const assetCategory = String(a.category);
        const selectedCat = String(selectedCategory);
        return assetCategory === selectedCat;
      });
      
      // Debug logging
      console.log(`[Filter] Selected category: "${selectedCategory}"`);
      console.log(`[Filter] Total assets: ${beforeCount}, Filtered: ${filtered.length}`);
      if (filtered.length === 0 && beforeCount > 0) {
        // Log sample assets to see what categories we have
        const sampleCategories = assets.slice(0, 10).map(a => `${a.id}: ${a.category}`);
        console.log(`[Filter] Sample asset categories:`, sampleCategories);
      }
    }
    
    // Filter by search query (case-insensitive search in symbol, name, and id)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(a => 
        a.symbol.toLowerCase().includes(query) ||
        a.name.toLowerCase().includes(query) ||
        a.id.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [assets, selectedCategory, searchQuery]);

  const currentAsset = assets.find(a => a.id === selectedAssetId);
  const latestData = marketData?.indicators[marketData.indicators.length - 1];

  return (
    <ErrorBoundary>
    <div className="flex h-screen bg-[#0f172a] overflow-hidden font-sans text-slate-200">
      
      {/* Sidebar - Asset List */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} flex-shrink-0 bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h1 className="font-bold text-xl text-blue-500 tracking-tight flex items-center gap-2">
                <Activity /> AlphaScout
            </h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400">
                <X size={20}/>
            </button>
        </div>
        
        {/* Binance API Status */}
        {binanceStatus && (
          <div className={`px-4 py-2 text-xs border-b border-slate-800 ${
            binanceStatus.available ? 'bg-green-900/20 text-green-400' : 'bg-yellow-900/20 text-yellow-400'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${binanceStatus.available ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span className="font-bold">Binance API:</span>
              <span>{binanceStatus.available ? 'Connected' : 'Unavailable'}</span>
            </div>
            {!binanceStatus.available && (
              <p className="text-[10px] mt-1 text-yellow-300/70">{binanceStatus.message}</p>
            )}
          </div>
        )}

        {/* Search Box */}
        <div className="p-2 border-b border-slate-800">
          <div className="relative">
            <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'zh' ? '搜索代码/名称...' : 'Search ticker/name...'}
              value={searchQuery}
              onChange={(e) => {
                const newQuery = e.target.value;
                setSearchQuery(newQuery);
                
                // Auto-select first result if only one match
                const query = newQuery.trim().toLowerCase();
                if (query) {
                  const matches = assets.filter(a => {
                    const categoryMatch = selectedCategory === 'ALL' || a.category === selectedCategory;
                    const searchMatch = a.symbol.toLowerCase().includes(query) ||
                                      a.name.toLowerCase().includes(query) ||
                                      a.id.toLowerCase().includes(query);
                    return categoryMatch && searchMatch;
                  });
                  if (matches.length === 1) {
                    setSelectedAssetId(matches[0].id);
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredAssets.length > 0) {
                  setSelectedAssetId(filteredAssets[0].id);
                  // On mobile close sidebar after select
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }
              }}
              className="w-full pl-8 pr-3 py-2 bg-slate-800 text-slate-200 text-sm rounded border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="p-2 grid grid-cols-3 gap-1">
            {[
                'ALL',
                AssetCategory.US_STOCKS,
                AssetCategory.CN_A_SHARES,
                AssetCategory.HK_STOCKS,
                AssetCategory.COMMODITIES,
                AssetCategory.CRYPTO,
                AssetCategory.FOREX
            ].map((cat) => (
                <button
                    key={cat}
                    onClick={() => {
                        // Clear search when switching category
                        setSearchQuery('');
                        // Update category - the useEffect will handle auto-selecting the first asset
                        setSelectedCategory(cat as AssetCategory | 'ALL');
                    }}
                    className={`text-[10px] py-1 px-1 rounded truncate transition-colors ${
                        selectedCategory === cat 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                    title={cat}
                >
                    {cat === 'ALL' ? t.nav.allMarkets : 
                     cat === AssetCategory.US_STOCKS ? t.categories.usStocks :
                     cat === AssetCategory.CN_A_SHARES ? t.categories.cnAShares :
                     cat === AssetCategory.HK_STOCKS ? t.categories.hkStocks :
                     cat === AssetCategory.CRYPTO ? t.categories.crypto :
                     cat === AssetCategory.COMMODITIES ? t.categories.commodities :
                     cat === AssetCategory.FOREX ? t.categories.forex : cat}
                </button>
            ))}
        </div>

        {/* Asset List */}
        <div className="flex-1 overflow-y-auto">
            {isLoading ? (
                <div className="p-4 text-center text-slate-500 text-sm">{t.status.loadingMarketData}</div>
            ) : filteredAssets.length === 0 ? (
                <div className="p-4 text-center">
                    <p className="text-slate-500 text-sm mb-2">
                        {searchQuery 
                            ? (language === 'zh' ? `未找到匹配 "${searchQuery}" 的标的` : `No assets found matching "${searchQuery}"`)
                            : t.status.noAssetsLoaded
                        }
                    </p>
                    {error && (
                        <p className="text-red-400 text-xs">{error}</p>
                    )}
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="mt-2 px-3 py-1 bg-slate-700 text-slate-200 text-xs rounded hover:bg-slate-600"
                        >
                            {language === 'zh' ? '清除搜索' : 'Clear Search'}
                        </button>
                    )}
                    {!searchQuery && (
                        <button 
                            onClick={() => window.location.reload()} 
                            className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                            {t.common.retry}
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {filteredAssets.map(asset => (
                        <AssetCard 
                            key={asset.id}
                            asset={asset}
                            isSelected={selectedAssetId === asset.id}
                            onClick={() => {
                                setSelectedAssetId(asset.id);
                                // On mobile close sidebar after select
                                if (window.innerWidth < 1024) setSidebarOpen(false);
                            }}
                            status={getAssetStatus(asset.id)}
                        />
                    ))}
                </>
            )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white">
                    <Menu size={20} />
                </button>
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {currentAsset?.symbol} 
                        <span className="text-sm font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                            {currentAsset?.category}
                        </span>
                    </h2>
                    <p className="text-xs text-slate-500">{currentAsset?.name}</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Language Toggle */}
                <div className="flex bg-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                        className="px-3 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1 text-slate-400 hover:text-white"
                        title={language === 'en' ? '切换到中文' : 'Switch to English'}
                    >
                        <Languages size={14} />
                        {language === 'en' ? '中文' : 'EN'}
                    </button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-slate-800 rounded-lg p-1">
                    <button 
                        onClick={() => setViewMode('chart')}
                        className={`px-3 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1 ${
                            viewMode === 'chart' 
                            ? 'bg-blue-600 text-white shadow' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <BarChart3 size={14} />
                        {t.nav.charts}
                    </button>
                    <button 
                        onClick={() => setViewMode('watch')}
                        className={`px-3 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1 ${
                            viewMode === 'watch' 
                            ? 'bg-blue-600 text-white shadow' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Eye size={14} />
                        {t.nav.watchPanel}
                    </button>
                    <button 
                        onClick={() => setViewMode('macro')}
                        className={`px-3 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1 ${
                            viewMode === 'macro' 
                            ? 'bg-blue-600 text-white shadow' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <TrendingUp size={14} />
                        {language === 'zh' ? '宏观指标' : 'Macro'}
                    </button>
                </div>

                {/* Simulated Alert Box */}
                {viewMode === 'chart' && latestData?.buySignal && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold animate-pulse ${
                        latestData.strongBuySignal 
                        ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.5)]' 
                        : 'bg-emerald-900 text-emerald-400 border border-emerald-700'
                    }`}>
                        <Bell size={14} />
                        {latestData.strongBuySignal ? t.signals.strongBottomDetected : t.signals.potentialEntry}
                    </div>
                )}
                
                <div className="flex bg-slate-800 rounded-lg p-1">
                    <button 
                        onClick={() => setTimeframe('1D')}
                        className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                            timeframe === '1D' 
                            ? 'bg-blue-600 text-white shadow' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {t.nav.daily}
                    </button>
                    <button 
                        onClick={() => setTimeframe('1W')}
                        className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                            timeframe === '1W' 
                            ? 'bg-blue-600 text-white shadow' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {t.nav.weekly}
                    </button>
                </div>
            </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
            {viewMode === 'watch' ? (
                <SignalWatchPanel timeframe={timeframe} />
            ) : viewMode === 'macro' ? (
                <MacroDashboard />
            ) : (
                <>
            {/* Alert Status Banner */}
            {latestData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                     <div className={`bg-slate-800/50 border rounded-xl p-4 ${
                        latestData.rsiLevel === 'extreme_overbought' ? 'border-red-500/50 bg-red-900/10' :
                        latestData.rsiLevel === 'overbought' ? 'border-orange-500/50 bg-orange-900/10' :
                        latestData.rsiLevel === 'extreme_oversold' ? 'border-green-500/50 bg-green-900/10' :
                        latestData.rsiLevel === 'oversold' ? 'border-emerald-500/50 bg-emerald-900/10' :
                        'border-slate-700'
                     }`}>
                        <p className="text-slate-400 text-xs mb-1">Indicator 1 (RSI+ATR)</p>
                        <div className="flex items-center justify-between">
                            <span className={`text-2xl font-bold ${
                                latestData.rsiLevel === 'extreme_overbought' ? 'text-red-400' :
                                latestData.rsiLevel === 'overbought' ? 'text-orange-400' :
                                latestData.rsiLevel === 'extreme_oversold' ? 'text-green-400' :
                                latestData.rsiLevel === 'oversold' ? 'text-emerald-400' :
                                'text-slate-200'
                            }`}>
                                {latestData.rsiLevel === 'extreme_overbought' ? (language === 'zh' ? '极端超买' : 'EXTREME OB') :
                                 latestData.rsiLevel === 'overbought' ? t.charts.overbought :
                                 latestData.rsiLevel === 'extreme_oversold' ? (language === 'zh' ? '极端超卖' : 'EXTREME OS') :
                                 latestData.rsiLevel === 'oversold' ? t.charts.oversold :
                                 t.charts.neutral}
                            </span>
                            <div className={`h-3 w-3 rounded-full ${
                                latestData.isOversold1 || latestData.rsiLevel === 'oversold' || latestData.rsiLevel === 'extreme_oversold' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' :
                                latestData.isOverbought1 || latestData.rsiLevel === 'overbought' || latestData.rsiLevel === 'extreme_overbought' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' :
                                'bg-slate-600'
                            }`}></div>
                        </div>
                        <div className="mt-2 text-xs flex gap-2 flex-wrap">
                            <span className={`bg-slate-900 px-2 py-0.5 rounded font-bold ${
                                latestData.rsiLevel === 'extreme_overbought' ? 'text-red-400' :
                                latestData.rsiLevel === 'overbought' ? 'text-orange-400' :
                                latestData.rsiLevel === 'extreme_oversold' ? 'text-green-400' :
                                latestData.rsiLevel === 'oversold' ? 'text-emerald-400' :
                                'text-purple-400'
                            }`}>
                                RSI {latestData.rsiTrend === 'up' ? '▲' : latestData.rsiTrend === 'down' ? '▼' : '—'} {typeof latestData.rsi === 'number' ? latestData.rsi.toFixed(1) : 'N/A'}
                            </span>
                            <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-400">
                                {latestData.rsiLevel === 'oversold' || latestData.rsiLevel === 'extreme_oversold' ? 'Target < 30' : 
                                 latestData.rsiLevel === 'overbought' || latestData.rsiLevel === 'extreme_overbought' ? 'Target > 70' :
                                 'Neutral'}
                            </span>
                        </div>
                     </div>

                     <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-slate-400 text-xs mb-1">Indicator 2 (Alpha Score)</p>
                        <div className="flex items-center justify-between">
                             <span className="text-2xl font-bold text-slate-200">
                                {latestData.isOversold2 ? t.charts.bottom : latestData.isOverbought2 ? t.charts.top : t.charts.range}
                            </span>
                            <div className={`h-3 w-3 rounded-full ${latestData.isOversold2 ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-slate-600'}`}></div>
                        </div>
                        <div className="mt-2 text-xs flex gap-2">
                            <span className="bg-slate-900 px-2 py-0.5 rounded text-orange-400">{t.charts.score}: {typeof latestData.aggScore === 'number' ? latestData.aggScore.toFixed(1) : 'N/A'}</span>
                            <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-400">{t.charts.lowerBand}: {typeof latestData.aggLowerBand === 'number' ? latestData.aggLowerBand.toFixed(1) : 'N/A'}</span>
                        </div>
                     </div>

                     <div className={`bg-slate-800/50 border rounded-xl p-4 ${
                        latestData.isBreakoutUp ? 'border-blue-500/50 bg-blue-900/10' :
                        latestData.isBreakoutDown ? 'border-red-500/50 bg-red-900/10' :
                        latestData.isImminentBreakout ? 'border-yellow-500/50 bg-yellow-900/10' :
                        latestData.isNewZone ? 'border-purple-500/50 bg-purple-900/10' :
                        'border-slate-700'
                     }`}>
                        <p className="text-slate-400 text-xs mb-1">Indicator 3 (Energy Reactor)</p>
                        <div className="flex items-center justify-between">
                            <span className={`text-2xl font-bold ${
                                latestData.isBreakoutUp ? 'text-blue-400' :
                                latestData.isBreakoutDown ? 'text-red-400' :
                                latestData.isImminentBreakout ? 'text-yellow-400' :
                                latestData.isNewZone ? 'text-purple-400' :
                                'text-slate-200'
                            }`}>
                                {latestData.isBreakoutUp ? (language === 'zh' ? '看涨突破' : 'BREAKOUT ↑') :
                                 latestData.isBreakoutDown ? (language === 'zh' ? '看跌突破' : 'BREAKOUT ↓') :
                                 latestData.isImminentBreakout ? (language === 'zh' ? '即将突破' : 'IMMINENT') :
                                 latestData.isNewZone ? (language === 'zh' ? '新区间' : 'NEW ZONE') :
                                 (language === 'zh' ? '监控中' : 'MONITORING')}
                            </span>
                            <div className={`h-3 w-3 rounded-full ${
                                latestData.isBreakoutUp ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' :
                                latestData.isBreakoutDown ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' :
                                latestData.isImminentBreakout ? 'bg-yellow-500 shadow-[0_0_10px_#f59e0b]' :
                                latestData.isNewZone ? 'bg-purple-500 shadow-[0_0_10px_#a855f7]' :
                                'bg-slate-600'
                            }`}></div>
                        </div>
                        <div className="mt-2 text-xs flex gap-2 flex-wrap">
                            <span className="bg-slate-900 px-2 py-0.5 rounded text-cyan-400">
                                {language === 'zh' ? '能量' : 'Energy'}: {typeof latestData.latentEnergy === 'number' ? latestData.latentEnergy.toFixed(1) : '0'}%
                            </span>
                            {latestData.rangePhase !== 'none' && (
                                <span className="bg-slate-900 px-2 py-0.5 rounded text-purple-400">
                                    {language === 'zh' ? '阶段' : 'Phase'}: {
                                        latestData.rangePhase === 'forming' ? (language === 'zh' ? '形成' : 'Forming') :
                                        latestData.rangePhase === 'growth' ? (language === 'zh' ? '成长' : 'Growth') :
                                        latestData.rangePhase === 'mature' ? (language === 'zh' ? '成熟' : 'Mature') :
                                        (language === 'zh' ? '衰竭' : 'Exhaustion')
                                    }
                                </span>
                            )}
                        </div>
                     </div>
                </div>
            )}

            {/* Charts */}
            {error ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-300 bg-red-900/20 border border-red-800 rounded-lg p-6">
                    <p className="text-red-400 font-bold mb-2">{t.status.dataLoadingFailed}</p>
                    <p className="text-sm text-center mb-4">{error}</p>
                    <p className="text-xs text-slate-500 text-center">
                        {t.status.checkConnection}
                    </p>
                </div>
            ) : marketData ? (
                <ErrorBoundary>
                    <div className="space-y-6">
                        <MainPriceChart data={marketData.indicators} />
                        <OscillatorChart data={marketData.indicators} />
                        <LatentEnergyChart data={marketData.indicators} />
                        
                        {/* Data Source Info */}
                        <div className="mt-4 p-3 border border-slate-800 rounded bg-slate-900/30 text-xs text-slate-400">
                            <p className="font-bold text-slate-300 mb-1">📊 {t.dataSource.title}</p>
                            <ul className="list-disc list-inside space-y-1 text-[11px]">
                                <li><strong className="text-green-400">{t.dataSource.klineData}</strong> {currentAsset?.category === AssetCategory.CRYPTO ? 'Binance API' : 'Yahoo Finance API'}</li>
                                <li><strong className="text-blue-400">{t.dataSource.indicator1}</strong> {language === 'zh' ? '基于真实OHLC价格使用标准技术分析公式计算' : 'Calculated from real OHLC prices using standard technical analysis formulas'}</li>
                                <li><strong className="text-purple-400">{t.dataSource.indicator2}</strong> {language === 'zh' ? '基于真实日收益率使用Omega比率+Sortino比率计算（Pine Script实现）' : 'Calculated from real daily returns using Omega Ratio + Sortino Ratio (Pine Script implementation)'}</li>
                                <li><strong className="text-cyan-400">{t.dataSource.indicator3}</strong> {language === 'zh' ? '基于区间检测和潜在能量计算（Latent Energy Reactor实现）' : 'Calculated from range detection and latent energy analysis (Latent Energy Reactor implementation)'}</li>
                                <li><strong className="text-slate-300">{t.dataSource.dataPoints}</strong> {marketData.indicators.length} {language === 'zh' ? '个历史K线用于计算' : 'historical candles used for calculations'}</li>
                            </ul>
                        </div>
                    </div>
                </ErrorBoundary>
            ) : (
                <div className="flex items-center justify-center h-64 text-slate-500">
                    {selectedAssetId ? t.status.loadingRealData : t.status.selectAsset}
                </div>
            )}
            
            <div className="mt-8 p-4 border border-slate-800 rounded bg-slate-900/30 text-xs text-slate-500">
                <h4 className="font-bold text-slate-400 mb-2">{t.instructions.title}</h4>
                <ul className="list-disc list-inside space-y-1">
                    <li><strong className="text-green-400">{t.instructions.indicator1Oversold}</strong> {language === 'zh' ? '当RSI < 30 且价格 < EMA20 - 2.5*ATR时触发。代表统计延伸。' : 'Occurs when RSI < 30 AND Price < EMA20 - 2.5*ATR. Represents statistical extension.'}</li>
                    <li><strong className="text-green-400">{t.instructions.indicator2Bottom}</strong> {language === 'zh' ? '当综合评分跌破动态下统计带时触发。' : 'Occurs when the Aggregated Score drops below the dynamic lower statistical band.'}</li>
                    <li><strong className="text-green-400 border border-green-500 px-1 rounded">{t.instructions.strongBottom}</strong> {language === 'zh' ? '当两个指标同时发出信号时触发。高概率反转区域。' : 'Triggers when BOTH indicators signal simultaneously. High probability reversal zone.'}</li>
                    <li><strong className="text-cyan-400">{t.instructions.indicator3NewZone}</strong> {language === 'zh' ? '当检测到新的震荡整理区间形成时触发。能量开始积聚。' : 'Triggers when a new consolidation zone is detected. Energy starts accumulating.'}</li>
                    <li><strong className="text-yellow-400">{t.instructions.indicator3Imminent}</strong> {language === 'zh' ? '当能量达到临界值（≥80%）且突破质量高（≥70%）时触发。突破在即。' : 'Triggers when energy reaches critical threshold (≥80%) and breakout quality is high (≥70%). Breakout is imminent.'}</li>
                    <li><strong className="text-blue-400">{t.instructions.indicator3Breakout}</strong> {language === 'zh' ? '当价格突破区间上沿（看涨）或下沿（看跌）时触发。确认突破信号。' : 'Triggers when price breaks above range top (bullish) or below range bottom (bearish). Confirms breakout signal.'}</li>
                </ul>
                <p className="mt-4 italic opacity-50">{t.instructions.disclaimer}</p>
            </div>
                </>
            )}
        </main>
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default App;
