import React from 'react';
import { Asset } from '../types';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

interface AssetCardProps {
  asset: Asset;
  isSelected: boolean;
  onClick: () => void;
  status: 'strong_buy' | 'buy' | 'sell' | 'neutral';
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, isSelected, onClick, status }) => {
  const { t } = useTranslation();
  return (
    <div
      onClick={onClick}
      className={`p-3 cursor-pointer border-l-4 transition-all duration-200 hover:bg-slate-800 ${
        isSelected
          ? 'bg-slate-800 border-blue-500'
          : 'bg-slate-900 border-transparent'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
            <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100">{asset.symbol}</h3>
                {status === 'strong_buy' && <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>}
            </div>
          <p className="text-xs text-slate-400 truncate w-24">{asset.name}</p>
          {/* 行业分类和市值信息 - 显示所有有信息的标的 */}
          {(asset.industry || asset.marketCap) && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {asset.industry && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-700/30">
                  {asset.industry}
                </span>
              )}
              {asset.marketCap && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-700/30">
                  {asset.marketCap}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-mono text-slate-200">${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className={`text-xs flex items-center justify-end gap-1 ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {asset.change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {typeof asset.change24h === 'number' ? Math.abs(asset.change24h).toFixed(2) : '0.00'}%
          </div>
        </div>
      </div>
      
      {/* Status Badge */}
      <div className="mt-2 flex items-center gap-2">
         {status === 'strong_buy' && (
             <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-900/50 text-green-400 border border-green-700/50 flex items-center gap-1">
                 <CheckCircle2 size={10} /> {t.signals.strongBuy}
             </span>
         )}
         {status === 'buy' && (
             <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400 border border-emerald-800/50">
                 {t.signals.buy}
             </span>
         )}
         {status === 'sell' && (
             <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-900/40 text-red-400 border border-red-800/50">
                 {t.signals.sell}
             </span>
         )}
         {status === 'neutral' && (
             <span className="text-[10px] text-slate-600">{t.charts.neutral}</span>
         )}
      </div>
    </div>
  );
};

export default AssetCard;
