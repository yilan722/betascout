import React, { useState, useEffect, useMemo } from 'react';
import { Asset, AssetCategory, IndicatorData } from './types';
import { ASSETS_CONFIG, getAllAssets, analyzeAsset } from './services/dataService';
import AssetCard from './components/AssetCard';
import { MainPriceChart, OscillatorChart } from './components/IndicatorChart';
import { Bell, Activity, Layers, Menu, X, Globe, DollarSign, Cpu } from 'lucide-react';

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

  // Load initial asset list
  useEffect(() => {
    // In a real app, this would be an async fetch
    const data = getAllAssets();
    setAssets(data);
  }, []);

  // Analyze selected asset
  useEffect(() => {
    if (selectedAssetId) {
      const data = analyzeAsset(selectedAssetId);
      setMarketData(data);
    }
  }, [selectedAssetId]);

  // Determine status for sidebar highlighting
  const getAssetStatus = (id: string) => {
    // Optimization: In a real app, we wouldn't re-analyze everything every render.
    // For this demo, we do it to determine the badge status.
    const { indicators } = analyzeAsset(id);
    const last = indicators[indicators.length - 1];
    
    if (last.strongBuySignal) return 'strong_buy';
    if (last.buySignal) return 'buy';
    if (last.isOverbought1 || last.isOverbought2) return 'sell';
    return 'neutral';
  };

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter(a => selectedCategory === 'ALL' || a.category === selectedCategory);
  }, [assets, selectedCategory]);

  const currentAsset = assets.find(a => a.id === selectedAssetId);
  const latestData = marketData?.indicators[marketData.indicators.length - 1];

  return (
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
                {/* Simulated Alert Box */}
                {latestData?.buySignal && (
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
                    <button className="px-3 py-1 text-xs font-bold rounded bg-blue-600 text-white shadow">Daily</button>
                    <button className="px-3 py-1 text-xs font-bold rounded text-slate-400 hover:text-white" onClick={() => alert("Weekly timeframe would aggregate data here.")}>Weekly</button>
                </div>
            </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
            
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
                            <span className="bg-slate-900 px-2 py-0.5 rounded text-purple-400">RSI: {latestData.rsi?.toFixed(1)}</span>
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
                            <span className="bg-slate-900 px-2 py-0.5 rounded text-orange-400">Score: {latestData.aggScore?.toFixed(1)}</span>
                            <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-400">Band: {latestData.aggLowerBand?.toFixed(1)}</span>
                        </div>
                     </div>
                </div>
            )}

            {/* Charts */}
            {marketData && (
                <div className="space-y-6">
                    <MainPriceChart data={marketData.indicators} />
                    <OscillatorChart data={marketData.indicators} />
                </div>
            )}
            
            <div className="mt-8 p-4 border border-slate-800 rounded bg-slate-900/30 text-xs text-slate-500">
                <h4 className="font-bold text-slate-400 mb-2">How to read signals:</h4>
                <ul className="list-disc list-inside space-y-1">
                    <li><strong className="text-green-400">Indicator 1 (Oversold):</strong> Occurs when RSI &lt; 30 AND Price &lt; EMA20 - 2.5*ATR. Represents statistical extension.</li>
                    <li><strong className="text-green-400">Indicator 2 (Bottom):</strong> Occurs when the Aggregated Score drops below the dynamic lower statistical band.</li>
                    <li><strong className="text-green-400 border border-green-500 px-1 rounded">STRONG BOTTOM:</strong> Triggers when BOTH indicators signal simultaneously. High probability reversal zone.</li>
                </ul>
                <p className="mt-4 italic opacity-50">Disclaimer: Data is simulated for demonstration of algorithmic logic. Real-time API integration required for live trading.</p>
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;
