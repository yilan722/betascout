import React, { useState, useEffect, useMemo } from 'react';
import { Asset, AssetCategory, IndicatorData } from './types';
import { ASSETS_CONFIG, getAllAssets, analyzeAsset, getAssetSummary } from './services/dataService';
import { Timeframe } from './types';
import { testBinanceConnection } from './services/api';
import AssetCard from './components/AssetCard';
import { MainPriceChart, OscillatorChart } from './components/IndicatorChart';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SignalWatchPanel } from './components/SignalWatchPanel';
import { Bell, Activity, Layers, Menu, X, Globe, DollarSign, Cpu, BarChart3, Eye } from 'lucide-react';

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
  const [selectedAssetId, setSelectedAssetId] = useState<string>(ASSETS_CONFIG[0].id);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'ALL'>('ALL');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [marketData, setMarketData] = useState<{ candles: any[], indicators: IndicatorData[] } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [binanceStatus, setBinanceStatus] = useState<{ tested: boolean; available: boolean; message: string } | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [viewMode, setViewMode] = useState<'chart' | 'watch'>('chart');

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

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter(a => selectedCategory === 'ALL' || a.category === selectedCategory);
  }, [assets, selectedCategory]);

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

        {/* Category Tabs */}
        <div className="p-2 grid grid-cols-3 gap-1">
            {['ALL', ...Object.values(AssetCategory)].map((cat) => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat as AssetCategory | 'ALL')}
                    className={`text-[10px] py-1 px-1 rounded truncate transition-colors ${
                        selectedCategory === cat 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                    title={cat}
                >
                    {cat === 'ALL' ? 'All Mkts' : cat}
                </button>
            ))}
        </div>

        {/* Asset List */}
        <div className="flex-1 overflow-y-auto">
            {isLoading ? (
                <div className="p-4 text-center text-slate-500 text-sm">Loading market data...</div>
            ) : filteredAssets.length === 0 ? (
                <div className="p-4 text-center">
                    <p className="text-slate-500 text-sm mb-2">No assets loaded</p>
                    {error && (
                        <p className="text-red-400 text-xs">{error}</p>
                    )}
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                        Retry
                    </button>
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
                        Charts
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
                        Watch Panel
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
                        {latestData.strongBuySignal ? "STRONG BOTTOM DETECTED" : "POTENTIAL ENTRY"}
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
                        Daily
                    </button>
                    <button 
                        onClick={() => setTimeframe('1W')}
                        className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                            timeframe === '1W' 
                            ? 'bg-blue-600 text-white shadow' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Weekly
                    </button>
                </div>
            </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
            {viewMode === 'watch' ? (
                <SignalWatchPanel timeframe={timeframe} />
            ) : (
                <>
            {/* Alert Status Banner */}
            {latestData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                     <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-slate-400 text-xs mb-1">Indicator 1 (RSI+ATR)</p>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-slate-200">
                                {latestData.isOversold1 ? 'OVERSOLD' : latestData.isOverbought1 ? 'OVERBOUGHT' : 'NEUTRAL'}
                            </span>
                            <div className={`h-3 w-3 rounded-full ${latestData.isOversold1 ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-slate-600'}`}></div>
                        </div>
                        <div className="mt-2 text-xs flex gap-2">
                            <span className="bg-slate-900 px-2 py-0.5 rounded text-purple-400">RSI: {typeof latestData.rsi === 'number' ? latestData.rsi.toFixed(1) : 'N/A'}</span>
                            <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-400">Target &lt; 30</span>
                        </div>
                     </div>

                     <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-slate-400 text-xs mb-1">Indicator 2 (Alpha Score)</p>
                        <div className="flex items-center justify-between">
                             <span className="text-2xl font-bold text-slate-200">
                                {latestData.isOversold2 ? 'BOTTOM' : latestData.isOverbought2 ? 'TOP' : 'RANGE'}
                            </span>
                            <div className={`h-3 w-3 rounded-full ${latestData.isOversold2 ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-slate-600'}`}></div>
                        </div>
                        <div className="mt-2 text-xs flex gap-2">
                            <span className="bg-slate-900 px-2 py-0.5 rounded text-orange-400">Score: {typeof latestData.aggScore === 'number' ? latestData.aggScore.toFixed(1) : 'N/A'}</span>
                            <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-400">Band: {typeof latestData.aggLowerBand === 'number' ? latestData.aggLowerBand.toFixed(1) : 'N/A'}</span>
                        </div>
                     </div>
                </div>
            )}

            {/* Charts */}
            {error ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-300 bg-red-900/20 border border-red-800 rounded-lg p-6">
                    <p className="text-red-400 font-bold mb-2">⚠️ Data Loading Failed</p>
                    <p className="text-sm text-center mb-4">{error}</p>
                    <p className="text-xs text-slate-500 text-center">
                        The app is trying to fetch real market data. If this persists, please check your internet connection or try again later.
                    </p>
                </div>
            ) : marketData ? (
                <ErrorBoundary>
                    <div className="space-y-6">
                        <MainPriceChart data={marketData.indicators} />
                        <OscillatorChart data={marketData.indicators} />
                        
                        {/* Data Source Info */}
                        <div className="mt-4 p-3 border border-slate-800 rounded bg-slate-900/30 text-xs text-slate-400">
                            <p className="font-bold text-slate-300 mb-1">📊 Data Source & Calculation:</p>
                            <ul className="list-disc list-inside space-y-1 text-[11px]">
                                <li><strong className="text-green-400">K-Line Data:</strong> Real market data from {currentAsset?.category === AssetCategory.CRYPTO ? 'Binance API' : 'Yahoo Finance API'}</li>
                                <li><strong className="text-blue-400">Indicator 1 (RSI/EMA/ATR):</strong> Calculated from real OHLC prices using standard technical analysis formulas</li>
                                <li><strong className="text-purple-400">Indicator 2 (Alpha Extract):</strong> Calculated from real daily returns using Omega Ratio + Sortino Ratio (Pine Script implementation)</li>
                                <li><strong className="text-slate-300">Data Points:</strong> {marketData.indicators.length} historical candles used for calculations</li>
                            </ul>
                        </div>
                    </div>
                </ErrorBoundary>
            ) : (
                <div className="flex items-center justify-center h-64 text-slate-500">
                    {selectedAssetId ? "Loading real market data..." : "Select an asset to view analysis"}
                </div>
            )}
            
            <div className="mt-8 p-4 border border-slate-800 rounded bg-slate-900/30 text-xs text-slate-500">
                <h4 className="font-bold text-slate-400 mb-2">How to read signals:</h4>
                <ul className="list-disc list-inside space-y-1">
                    <li><strong className="text-green-400">Indicator 1 (Oversold):</strong> Occurs when RSI &lt; 30 AND Price &lt; EMA20 - 2.5*ATR. Represents statistical extension.</li>
                    <li><strong className="text-green-400">Indicator 2 (Bottom):</strong> Occurs when the Aggregated Score drops below the dynamic lower statistical band.</li>
                    <li><strong className="text-green-400 border border-green-500 px-1 rounded">STRONG BOTTOM:</strong> Triggers when BOTH indicators signal simultaneously. High probability reversal zone.</li>
                </ul>
                <p className="mt-4 italic opacity-50">Disclaimer: Market data provided by Yahoo Finance via proxy. Data may be delayed. Not for financial advice or real trading.</p>
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
