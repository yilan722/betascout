import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
  Cell,
} from 'recharts';
import { IndicatorData } from '../types';

interface IndicatorChartProps {
  data: IndicatorData[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length && payload[0].payload) {
    const d = payload[0].payload as IndicatorData;
    if (!d) return null;
    
    const color = d.close >= d.open ? '#10b981' : '#ef4444';
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-slate-400">Open: <span style={{color}}>{typeof d.open === 'number' ? d.open.toFixed(2) : 'N/A'}</span></span>
            <span className="text-slate-400">High: <span style={{color}}>{typeof d.high === 'number' ? d.high.toFixed(2) : 'N/A'}</span></span>
            <span className="text-slate-400">Low: <span style={{color}}>{typeof d.low === 'number' ? d.low.toFixed(2) : 'N/A'}</span></span>
            <span className="text-slate-400">Close: <span style={{color}}>{typeof d.close === 'number' ? d.close.toFixed(2) : 'N/A'}</span></span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 border-t border-slate-800 pt-2">
            <span className="text-blue-400">EMA20: {typeof d.ema20 === 'number' ? d.ema20.toFixed(2) : 'N/A'}</span>
            <span className="text-purple-400">RSI: {typeof d.rsi === 'number' ? d.rsi.toFixed(1) : 'N/A'}</span>
            <div className="col-span-2 mt-1 pt-1">
               <span className={d.buySignal ? "text-green-500 font-bold" : "text-slate-600"}>
                  {d.strongBuySignal ? "STRONG BUY" : d.buySignal ? "BUY" : d.isOverbought1 ? "SELL" : "NEUTRAL"}
               </span>
            </div>
            {d.isOversold1 && typeof d.rsi === 'number' && <span className="text-xs text-green-400 col-span-2">Logic: RSI({d.rsi.toFixed(1)}) &lt; 30 & Price &lt; Band</span>}
        </div>
      </div>
    );
  }
  return null;
};

// Custom Candlestick shape component
const CandlestickShape = (props: any) => {
  const { x, y, payload, yAxis } = props;
  if (!payload || x === undefined || y === undefined) return null;
  
  const { open, high, low, close } = payload;
  if (!open || !close || !high || !low) return null;
  if (isNaN(open) || isNaN(close) || isNaN(high) || isNaN(low)) return null;
  
  const isGreen = close >= open;
  const color = isGreen ? '#10b981' : '#ef4444';
  const candleWidth = 8;
  const halfWidth = candleWidth / 2;
  
  // Calculate pixel positions using the Y-axis scale
  // y represents the close price position
  // We need to calculate positions for high, low, open relative to close
  
  // Get Y-axis domain to calculate scale
  // In Recharts, we can access the scale through the chart context
  // For now, we'll use a workaround: calculate based on the data range
  
  // Find the data range (we'll need to pass this or calculate from all data)
  // For simplicity, let's use a fixed scale factor - this is approximate
  // In a real implementation, we'd need access to the Y-axis scale function
  
  return (
    <g>
      {/* Upper wick: from high to max(open, close) */}
      <line 
        x1={x} 
        y1={y - (high - close) * 0.5} // Approximate scaling
        x2={x} 
        y2={y - (Math.max(open, close) - close) * 0.5}
        stroke={color} 
        strokeWidth={1}
      />
      {/* Lower wick: from min(open, close) to low */}
      <line 
        x1={x} 
        y1={y + (close - Math.min(open, close)) * 0.5}
        x2={x} 
        y2={y + (close - low) * 0.5}
        stroke={color} 
        strokeWidth={1}
      />
      {/* Body: rectangle from min(open,close) to max(open,close) */}
      <rect 
        x={x - halfWidth}
        y={y - (Math.max(open, close) - close) * 0.5}
        width={candleWidth}
        height={Math.max(1, Math.abs(open - close) * 0.5)}
        fill={isGreen ? '#0f172a' : color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

export const MainPriceChart: React.FC<IndicatorChartProps> = ({ data }) => {
  // Filter for signals
  const buySignals = data.filter(d => d.isOversold1);
  const sellSignals = data.filter(d => d.isOverbought1);

  // Calculate price range for proper scaling
  const priceRange = useMemo(() => {
    const prices = data.flatMap(d => [d.high, d.low, d.open, d.close]).filter(p => typeof p === 'number' && !isNaN(p));
    if (prices.length === 0) return { min: 0, max: 100, range: 100 };
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max, range: max - min };
  }, [data]);

  // Construct "B" labels
  const buyLabelData = buySignals.map(d => ({
      ...d,
      y: d.low * 0.98
  }));

  const sellLabelData = sellSignals.map(d => ({
    ...d,
    y: d.high * 1.02
  }));

  // Prepare candlestick data - create separate series for high/low wicks and open/close body
  const candlestickData = useMemo(() => {
    return data.map((d, index) => ({
      ...d,
      // For drawing wicks
      highWickTop: d.high,
      highWickBottom: Math.max(d.open, d.close),
      lowWickTop: Math.min(d.open, d.close),
      lowWickBottom: d.low,
      // For drawing body
      bodyTop: Math.max(d.open, d.close),
      bodyBottom: Math.min(d.open, d.close),
      bodyHeight: Math.abs(d.open - d.close),
      isGreen: d.close >= d.open,
    }));
  }, [data]);

  return (
    <div className="flex flex-col gap-1">
      {/* 1. Main Candle/Price Chart (Top) */}
      <div className="w-full h-[350px] bg-slate-900/50 rounded-t-lg p-4 border border-slate-800 relative border-b-0">
          <h4 className="text-slate-400 text-xs uppercase font-bold mb-2">Price Action & Signals (K-Line)</h4>
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
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
              tick={{fontSize: 10, fill: '#94a3b8'}} 
              tickFormatter={(val) => {
                if (!val) return '';
                const date = new Date(val);
                if (isNaN(date.getTime())) return val;
                return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              }}
              minTickGap={60}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              stroke="#475569" 
              tick={{fontSize: 10}}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Draw candlesticks using multiple approaches */}
            {/* Method 1: Use Line for high-low range (shows the full price range) */}
            <Line 
              type="monotone"
              dataKey="high"
              stroke="transparent"
              strokeWidth={0}
              dot={false}
              name="High"
            />
            <Line 
              type="monotone"
              dataKey="low"
              stroke="transparent"
              strokeWidth={0}
              dot={false}
              name="Low"
            />
            
            {/* Method 2: Use Scatter with custom shapes for each candlestick */}
            <Scatter 
              data={candlestickData}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                if (!payload || !cx || !cy || isNaN(cx) || isNaN(cy)) return null;
                
                const { open, high, low, close, isGreen } = payload;
                if (!open || !close || !high || !low) return null;
                if (isNaN(open) || isNaN(close) || isNaN(high) || isNaN(low)) return null;
                
                const color = isGreen ? '#10b981' : '#ef4444';
                const candleWidth = 6;
                const halfWidth = candleWidth / 2;
                
                // Calculate scale factor based on price range
                // cy represents close price position
                // We need to calculate relative positions for high, low, open
                const scaleFactor = priceRange.range > 0 ? (350 / priceRange.range) * 0.8 : 1;
                
                // Calculate pixel positions
                const highY = cy - (high - close) * scaleFactor;
                const lowY = cy + (close - low) * scaleFactor;
                const openY = cy - (close - open) * scaleFactor;
                const closeY = cy;
                
                const bodyTop = Math.min(openY, closeY);
                const bodyBottom = Math.max(openY, closeY);
                const bodyHeight = Math.max(1, Math.abs(openY - closeY));
                
                return (
                  <g key={`candle-${payload.time}`}>
                    {/* Upper wick: from high to max(open, close) */}
                    <line 
                      x1={cx} 
                      y1={highY}
                      x2={cx} 
                      y2={Math.min(openY, closeY)}
                      stroke={color} 
                      strokeWidth={1}
                    />
                    {/* Lower wick: from min(open, close) to low */}
                    <line 
                      x1={cx} 
                      y1={Math.max(openY, closeY)}
                      x2={cx} 
                      y2={lowY}
                      stroke={color} 
                      strokeWidth={1}
                    />
                    {/* Body: rectangle */}
                    <rect 
                      x={cx - halfWidth}
                      y={bodyTop}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={isGreen ? '#0f172a' : color}
                      stroke={color}
                      strokeWidth={1}
                    />
                  </g>
                );
              }}
            />
            
            {/* Close price line for reference */}
            <Line 
              type="monotone"
              dataKey="close"
              stroke="#64748b"
              strokeWidth={0.5}
              dot={false}
              strokeOpacity={0.3}
              name="Close"
            />
            
            {/* EMA 20 */}
            <Line 
              type="monotone" 
              dataKey="ema20" 
              stroke="#3b82f6" 
              strokeWidth={1} 
              dot={false}
              opacity={0.7}
              name="EMA 20"
            />

            {/* Lower ATR Band */}
            <Line 
              type="monotone" 
              dataKey="lowerAtrBand" 
              stroke="#10b981" 
              strokeDasharray="3 3"
              strokeWidth={1} 
              dot={false}
              opacity={0.4}
              name="Lower Band"
            />

            {/* Upper ATR Band */}
            <Line 
              type="monotone" 
              dataKey="upperAtrBand" 
              stroke="#ef4444" 
              strokeDasharray="3 3"
              strokeWidth={1} 
              dot={false}
              opacity={0.4}
              name="Upper Band"
            />

            {/* Signals */}
            <Scatter name="Buy Signal" data={buyLabelData} shape={(props: any) => {
                const { cx, cy } = props;
                if (!cx || !cy || isNaN(cx) || isNaN(cy)) return null;
                return (
                    <g>
                        <rect x={cx - 10} y={cy} width={20} height={16} rx={4} fill="#22c55e" />
                        <text x={cx} y={cy + 11} textAnchor="middle" fill="black" fontSize="10" fontWeight="bold">B</text>
                    </g>
                );
            }} />
            
            <Scatter name="Sell Signal" data={sellLabelData} shape={(props: any) => {
                const { cx, cy } = props;
                if (!cx || !cy || isNaN(cx) || isNaN(cy)) return null;
                return (
                    <g>
                        <rect x={cx - 10} y={cy - 16} width={20} height={16} rx={4} fill="#ef4444" />
                        <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">S</text>
                    </g>
                );
            }} />

          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Indicator 1 Sub-Chart */}
      <div className="w-full h-[150px] bg-slate-900/50 rounded-b-lg p-4 border border-slate-800 border-t-0 relative">
         <h4 className="text-slate-400 text-xs uppercase font-bold mb-0">Indicator 1 Status (RSI/Band Logic)</h4>
         <ResponsiveContainer width="100%" height="100%" minHeight={120}>
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#475569" 
                tick={{fontSize: 10, fill: '#94a3b8'}} 
                tickFormatter={(val) => {
                  if (!val) return '';
                  const date = new Date(val);
                  if (isNaN(date.getTime())) return val;
                  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }}
                minTickGap={60}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="#475569" 
                tick={{fontSize: 10, fill: '#94a3b8'}}
                width={40}
                ticks={[0, 30, 50, 70, 100]}
                tickFormatter={(val) => val.toString()}
              />
              <Tooltip 
                content={({ active, payload, label }: any) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0]?.payload as IndicatorData;
                  if (!data) return null;
                  
                  const date = new Date(label);
                  const formattedDate = isNaN(date.getTime()) ? label : date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  });
                  
                  return (
                    <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
                      <p className="text-slate-400 mb-1">{formattedDate}</p>
                      <p className="text-purple-400">
                        RSI: {typeof data.rsi === 'number' && !isNaN(data.rsi) ? data.rsi.toFixed(1) : 'N/A'}
                      </p>
                      {data.isOversold1 && <p className="text-green-400 text-xs mt-1">Oversold Signal</p>}
                      {data.isOverbought1 && <p className="text-red-400 text-xs mt-1">Overbought Signal</p>}
                    </div>
                  );
                }}
              />

              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "C", position: 'right', fill: '#ef4444', fontSize: 10 }} />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: "C", position: 'right', fill: '#10b981', fontSize: 10 }} />
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" strokeOpacity={0.3} />
              <ReferenceLine y={100} stroke="#64748b" strokeDasharray="2 2" strokeOpacity={0.3} />

              <Line 
                type="monotone" 
                dataKey="rsi" 
                stroke="#a855f7"
                strokeWidth={1.5} 
                dot={false} 
                name="RSI"
                isAnimationActive={false}
              />

               <Scatter 
                 data={buySignals.map(d => ({...d, rsi: d.rsi}))} 
                 shape={(props: any) => {
                  const { cx, cy } = props;
                  if (!cx || !cy || isNaN(cx) || isNaN(cy)) return null;
                  return <circle cx={cx} cy={cy} r={3} fill="#22c55e" />;
               }} 
               name="Oversold" />

               <Scatter 
                 data={sellSignals.map(d => ({...d, rsi: d.rsi}))} 
                 shape={(props: any) => {
                  const { cx, cy } = props;
                  if (!cx || !cy || isNaN(cx) || isNaN(cy)) return null;
                  return <circle cx={cx} cy={cy} r={3} fill="#ef4444" />;
               }} 
               name="Overbought" />

            </ComposedChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};

const OscillatorTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {(typeof entry.value === 'number' && !isNaN(entry.value)) ? entry.value.toFixed(2) : 'N/A'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const OscillatorChart: React.FC<IndicatorChartProps> = ({ data }) => {
  const upperColor = "#ff0066";
  const lowerColor = "#00cc88";

  return (
    <div className="w-full h-[250px] bg-[#0f172a] rounded-lg p-4 border border-slate-800 mt-4 relative">
       <h4 className="text-slate-400 text-xs uppercase font-bold mb-2">Aggregated Scores (Alpha Extract)</h4>
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#475569" 
            tick={{fontSize: 10, fill: '#94a3b8'}} 
            tickFormatter={(val) => {
              if (!val) return '';
              const date = new Date(val);
              if (isNaN(date.getTime())) return val;
              return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }}
            minTickGap={60}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            stroke="#475569" 
            tick={{fontSize: 10}}
            width={40}
          />
          <Tooltip 
            content={({ active, payload, label }: any) => {
              if (!active || !payload || !payload.length) return null;
              
              const date = new Date(label);
              const formattedDate = isNaN(date.getTime()) ? label : date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              });
              
              return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
                  <p className="text-slate-400 mb-1">{formattedDate}</p>
                  {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ color: entry.color }}>
                      {entry.name}: {(typeof entry.value === 'number' && !isNaN(entry.value)) ? entry.value.toFixed(2) : 'N/A'}
                    </p>
                  ))}
                </div>
              );
            }}
          />
          
          <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />

          <Line 
            type="monotone" 
            dataKey="aggUpperBand" 
            name="Upper Band"
            stroke={upperColor} 
            strokeWidth={2} 
            dot={false} 
            activeDot={false}
          />
          
           <Line 
            type="monotone" 
            dataKey="aggLowerBand" 
            name="Lower Band"
            stroke={lowerColor} 
            strokeWidth={2} 
            dot={false} 
            activeDot={false}
          />

          <Line 
            type="monotone" 
            dataKey="aggScore" 
            name="Score"
            stroke="#e2e8f0" 
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
