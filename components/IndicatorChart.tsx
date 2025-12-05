import React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
} from 'recharts';
import { IndicatorData } from '../types';

interface IndicatorChartProps {
  data: IndicatorData[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload as IndicatorData;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="text-white font-bold text-sm">Price: ${d.price.toFixed(2)}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            <span className="text-blue-400">EMA20: {d.ema20.toFixed(2)}</span>
            <span className="text-purple-400">RSI: {d.rsi?.toFixed(1)}</span>
            <span className="text-orange-400">Score: {d.aggScore.toFixed(1)}</span>
            <span className={d.buySignal ? "text-green-500 font-bold" : "text-slate-600"}>
                {d.strongBuySignal ? "STRONG BUY" : d.buySignal ? "BUY" : d.isOverbought1 ? "SELL" : "NEUTRAL"}
            </span>
        </div>
      </div>
    );
  }
  return null;
};

export const MainPriceChart: React.FC<IndicatorChartProps> = ({ data }) => {
  // Filter for signals to show dots
  const buySignals = data.filter(d => d.isOversold1);
  const sellSignals = data.filter(d => d.isOverbought1);
  const strongSignals = data.filter(d => d.strongBuySignal);

  return (
    <div className="w-full h-[400px] bg-slate-900/50 rounded-lg p-4 border border-slate-800">
        <h4 className="text-slate-400 text-xs uppercase font-bold mb-2">Price Action & Indicator 1 (EMA/RSI/ATR)</h4>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#475569" 
            tick={{fontSize: 10}} 
            tickFormatter={(val) => val.slice(0, 7)} // Show YYYY-MM
            minTickGap={80}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            stroke="#475569" 
            tick={{fontSize: 10}}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Main Price Line */}
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#e2e8f0" 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          
          {/* EMA 20 */}
          <Line 
            type="monotone" 
            dataKey="ema20" 
            stroke="#3b82f6" 
            strokeWidth={1} 
            dot={false}
            opacity={0.7}
          />

          {/* ATR Bands (Optional visual aid) */}
          <Line 
            type="monotone" 
            dataKey="lowerAtrBand" 
            stroke="#10b981" 
            strokeDasharray="3 3"
            strokeWidth={1} 
            dot={false} 
            opacity={0.3}
          />

          {/* Signals */}
          <Scatter name="Buy" data={buySignals} fill="#10b981" line={false} shape="circle" />
          <Scatter name="Sell" data={sellSignals} fill="#ef4444" line={false} shape="circle" />
          
          {/* Strong Buy Highlight */}
          <Scatter name="Strong Buy" data={strongSignals} fill="#22c55e" line={false} shape="star" r={20} />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export const OscillatorChart: React.FC<IndicatorChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[200px] bg-slate-900/50 rounded-lg p-4 border border-slate-800 mt-4">
       <h4 className="text-slate-400 text-xs uppercase font-bold mb-2">Indicator 2: Aggregated Scores (Alpha Extract)</h4>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="time" 
            hide
          />
          <YAxis 
            domain={['auto', 'auto']} 
            stroke="#475569" 
            tick={{fontSize: 10}}
            width={40}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
            itemStyle={{ fontSize: '12px' }}
            labelStyle={{ display: 'none' }}
          />
          
          <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
          
          {/* Statistical Bands */}
          <Line 
            type="monotone" 
            dataKey="aggUpperBand" 
            stroke="#be185d" 
            strokeWidth={1} 
            dot={false} 
            opacity={0.5} 
          />
           <Line 
            type="monotone" 
            dataKey="aggLowerBand" 
            stroke="#059669" 
            strokeWidth={1} 
            dot={false} 
            opacity={0.5} 
          />

          {/* The Score */}
          <Area 
            type="monotone" 
            dataKey="aggScore" 
            stroke="#8b5cf6" 
            fill="url(#colorScore)" 
            strokeWidth={2}
          />
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};