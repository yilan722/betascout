import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
  Cell,
  Rectangle,
} from 'recharts';
import { IndicatorData } from '../types';
import { useTranslation } from '../i18n/useTranslation';

interface IndicatorChartProps {
  data: IndicatorData[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  const { t, language } = useTranslation();
  if (active && payload && payload.length && payload[0].payload) {
    const d = payload[0].payload as IndicatorData;
    if (!d) return null;
    
    const color = d.close >= d.open ? '#10b981' : '#ef4444';
    const date = new Date(label);
    const formattedDate = isNaN(date.getTime()) ? label : date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
        <p className="text-slate-400 mb-1">{formattedDate}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-slate-400">{language === 'zh' ? '开盘' : 'Open'}: <span style={{color}}>{typeof d.open === 'number' ? d.open.toFixed(2) : 'N/A'}</span></span>
            <span className="text-slate-400">{language === 'zh' ? '最高' : 'High'}: <span style={{color}}>{typeof d.high === 'number' ? d.high.toFixed(2) : 'N/A'}</span></span>
            <span className="text-slate-400">{language === 'zh' ? '最低' : 'Low'}: <span style={{color}}>{typeof d.low === 'number' ? d.low.toFixed(2) : 'N/A'}</span></span>
            <span className="text-slate-400">{language === 'zh' ? '收盘' : 'Close'}: <span style={{color}}>{typeof d.close === 'number' ? d.close.toFixed(2) : 'N/A'}</span></span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 border-t border-slate-800 pt-2">
            <span className="text-blue-400">{t.charts.ema20}: {typeof d.ema20 === 'number' ? d.ema20.toFixed(2) : 'N/A'}</span>
            <span className="text-purple-400">{t.charts.rsi}: {typeof d.rsi === 'number' ? d.rsi.toFixed(1) : 'N/A'}</span>
            <div className="col-span-2 mt-1 pt-1">
               <span className={d.buySignal ? "text-green-500 font-bold" : "text-slate-600"}>
                  {d.strongBuySignal ? t.signals.strongBuy : d.buySignal ? t.signals.buy : d.isOverbought1 ? t.signals.sell : t.charts.neutral}
               </span>
            </div>
            {d.isOversold1 && typeof d.rsi === 'number' && <span className="text-xs text-green-400 col-span-2">{language === 'zh' ? '逻辑' : 'Logic'}: RSI({d.rsi.toFixed(1)}) &lt; 30 & {language === 'zh' ? '价格' : 'Price'} &lt; {language === 'zh' ? '下轨' : 'Band'}</span>}
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

// Custom Background Component for RSI highlights
const RSIBackground: React.FC<{ data: IndicatorData[]; chartHeight: number }> = ({ data, chartHeight }) => {
  const rsiUpperBandExt = 80;
  const rsiUpperBand = 70;
  const rsiLowerBand = 30;
  const rsiLowerBandExt = 20;
  
  // Calculate bar width based on data length
  const barWidth = data.length > 0 ? (100 / data.length) * 0.8 : 0;
  
  return (
    <g>
      {data.map((d, i) => {
        const rsi = d.rsi;
        if (isNaN(rsi)) return null;
        
        let bgColor = null;
        let bgOpacity = 0;
        
        // Pine Script background highlight logic
        if (rsi >= rsiUpperBandExt) {
          bgColor = '#ff5a00';
          bgOpacity = 0.25; // 75% transparency
        } else if (rsi >= rsiUpperBand && rsi < rsiUpperBandExt) {
          bgColor = '#ff5a00';
          bgOpacity = 0.15; // 85% transparency
        } else if (rsi <= rsiLowerBand && rsi > rsiLowerBandExt) {
          bgColor = '#089981';
          bgOpacity = 0.15; // 85% transparency
        } else if (rsi <= rsiLowerBandExt) {
          bgColor = '#089981';
          bgOpacity = 0.25; // 75% transparency
        }
        
        if (!bgColor) return null;
        
        // Calculate x position (approximate, will be adjusted by Recharts)
        const xPercent = (i / (data.length - 1)) * 100;
        
        return (
          <rect
            key={`bg-${i}`}
            x={`${xPercent}%`}
            y={0}
            width={`${barWidth}%`}
            height="100%"
            fill={bgColor}
            opacity={bgOpacity}
          />
        );
      })}
    </g>
  );
};

export const MainPriceChart: React.FC<IndicatorChartProps> = ({ data }) => {
  const { t, language } = useTranslation();
  // Filter for signals
  const buySignals = data.filter(d => d.isOversold1);
  const sellSignals = data.filter(d => d.isOverbought1);

  // Calculate evenly spaced time ticks for X-axis based on actual time intervals
  const timeTicks = useMemo(() => {
    if (data.length === 0) return [];
    const ticks: string[] = [];
    const totalPoints = data.length;
    
    // Calculate optimal number of ticks (3-8 based on data length)
    const numTicks = Math.min(8, Math.max(3, Math.floor(totalPoints / 40)));
    
    // Use actual time-based spacing instead of index-based
    if (totalPoints > 1) {
      const firstTime = new Date(data[0].time).getTime();
      const lastTime = new Date(data[totalPoints - 1].time).getTime();
      const timeRange = lastTime - firstTime;
      
      // Always include first and last
      ticks.push(data[0].time);
      
      // Add evenly spaced ticks in between
      for (let i = 1; i < numTicks - 1; i++) {
        const targetTime = firstTime + (timeRange * i / (numTicks - 1));
        // Find closest data point to target time
        let closestIndex = 0;
        let minDiff = Infinity;
        for (let j = 0; j < totalPoints; j++) {
          const diff = Math.abs(new Date(data[j].time).getTime() - targetTime);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = j;
          }
        }
        if (data[closestIndex]?.time && !ticks.includes(data[closestIndex].time)) {
          ticks.push(data[closestIndex].time);
        }
      }
      
      // Always include last
      if (data[totalPoints - 1]?.time && !ticks.includes(data[totalPoints - 1].time)) {
        ticks.push(data[totalPoints - 1].time);
      }
    }
    
    // Sort ticks by time to ensure correct order
    ticks.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    return ticks;
  }, [data]);
  
  // Prepare background highlight data (Pine Script logic)
  const backgroundData = useMemo(() => {
    const rsiUpperBandExt = 80;
    const rsiUpperBand = 70;
    const rsiLowerBand = 30;
    const rsiLowerBandExt = 20;
    
    return data.map((d) => {
      const rsi = d.rsi;
      let bgValue = 0;
      let bgColor = 'transparent';
      let bgOpacity = 0;
      
      if (rsi >= rsiUpperBandExt) {
        bgValue = 100;
        bgColor = '#ff5a00';
        bgOpacity = 0.25;
      } else if (rsi >= rsiUpperBand && rsi < rsiUpperBandExt) {
        bgValue = 100;
        bgColor = '#ff5a00';
        bgOpacity = 0.15;
      } else if (rsi <= rsiLowerBand && rsi > rsiLowerBandExt) {
        bgValue = 100;
        bgColor = '#089981';
        bgOpacity = 0.15;
      } else if (rsi <= rsiLowerBandExt) {
        bgValue = 100;
        bgColor = '#089981';
        bgOpacity = 0.25;
      }
      
      return {
        ...d,
        bgValue,
        bgColor,
        bgOpacity,
      };
    });
  }, [data]);

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
          <h4 className="text-slate-400 text-xs uppercase font-bold mb-2">{t.charts.priceAction}</h4>
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
                return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', year: 'numeric' });
              }}
              ticks={timeTicks}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
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

      {/* 2. Indicator 1 Sub-Chart - RSI Overbought/Oversold (Pine Script Implementation) */}
      <div className="w-full h-[200px] bg-slate-900/50 rounded-b-lg p-4 border border-slate-800 border-t-0 relative">
         <div className="flex items-center justify-between mb-2">
           <h4 className="text-slate-400 text-xs uppercase font-bold">{t.charts.indicator1Status}</h4>
           {/* RSI Display Table (Pine Script style) */}
           {data.length > 0 && (() => {
             const latest = data[data.length - 1];
             const prevRsi = data.length > 1 ? data[data.length - 2].rsi : latest.rsi;
             const prev2Rsi = data.length > 2 ? data[data.length - 3].rsi : prevRsi;
             
             // Determine RSI momentum (Pine Script logic)
             let trendArrow = "—";
             if (latest.rsi > prevRsi && prevRsi > prev2Rsi) {
               trendArrow = "▲";
             } else if (latest.rsi < prevRsi && prevRsi < prev2Rsi) {
               trendArrow = "▼";
             }
             
             // Determine background color based on RSI level
             const rsiUpperBand = 70;
             const rsiLowerBand = 30;
             const bgColor = 
               latest.rsi >= rsiUpperBand ? '#ff5a00' :
               latest.rsi <= rsiLowerBand ? '#089981' :
               '#000000';
             
             return (
               <div 
                 className="px-3 py-1.5 rounded border-2 text-xs font-bold"
                 style={{ 
                   backgroundColor: bgColor,
                   borderColor: bgColor,
                   color: '#ffffff'
                 }}
               >
                 <div>RSI {trendArrow}</div>
                 <div className="text-right">{typeof latest.rsi === 'number' ? latest.rsi.toFixed(1) : 'N/A'}</div>
               </div>
             );
           })()}
         </div>
         <ResponsiveContainer width="100%" height="100%" minHeight={160}>
            <ComposedChart data={backgroundData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#475569" 
                tick={{fontSize: 10, fill: '#94a3b8'}} 
                tickFormatter={(val) => {
                  if (!val) return '';
                  const date = new Date(val);
                  if (isNaN(date.getTime())) return val;
                  return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', year: 'numeric' });
                }}
                ticks={timeTicks}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="#475569" 
                tick={{fontSize: 10, fill: '#94a3b8'}}
                width={40}
                ticks={[0, 20, 30, 50, 70, 80, 100]}
                tickFormatter={(val) => val.toString()}
              />
              <Tooltip 
                content={({ active, payload, label }: any) => {
                  if (!active || !payload || !payload.length) return null;
                  const dataPoint = payload[0]?.payload as any;
                  if (!dataPoint) return null;
                  
                  const date = new Date(label);
                  const formattedDate = isNaN(date.getTime()) ? label : date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  });
                  
                  // Calculate trend arrow (Pine Script logic)
                  const currentIndex = backgroundData.findIndex((d: any) => d.time === label);
                  const prevRsi = currentIndex > 0 ? backgroundData[currentIndex - 1]?.rsi : dataPoint.rsi;
                  const prev2Rsi = currentIndex > 1 ? backgroundData[currentIndex - 2]?.rsi : prevRsi;
                  let trendArrow = "—";
                  if (dataPoint.rsi > prevRsi && prevRsi > prev2Rsi) {
                    trendArrow = "▲";
                  } else if (dataPoint.rsi < prevRsi && prevRsi < prev2Rsi) {
                    trendArrow = "▼";
                  }
                  
                  const rsiValue = typeof dataPoint.rsi === 'number' && !isNaN(dataPoint.rsi) ? dataPoint.rsi : 0;
                  const levelText = 
                    rsiValue >= 80 ? (language === 'zh' ? '极端超买' : 'Extreme Overbought') :
                    rsiValue >= 70 ? (language === 'zh' ? '超买' : 'Overbought') :
                    rsiValue <= 20 ? (language === 'zh' ? '极端超卖' : 'Extreme Oversold') :
                    rsiValue <= 30 ? (language === 'zh' ? '超卖' : 'Oversold') :
                    (language === 'zh' ? '中性' : 'Neutral');
                  
                  return (
                    <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
                      <p className="text-slate-400 mb-1">{formattedDate}</p>
                      <p className="text-purple-400 font-bold">
                        RSI {trendArrow}: {rsiValue.toFixed(1)}
                      </p>
                      <p className={`text-xs mt-1 ${
                        rsiValue >= 70 ? 'text-red-400' :
                        rsiValue <= 30 ? 'text-green-400' :
                        'text-slate-400'
                      }`}>
                        {levelText}
                      </p>
                    </div>
                  );
                }}
              />

              {/* Reference Lines (Pine Script style - invisible dashed lines) */}
              <ReferenceLine y={50} stroke="#ffffff" strokeDasharray="2 2" strokeOpacity={0.05} />
              <ReferenceLine y={80} stroke="#ffffff" strokeDasharray="2 2" strokeOpacity={0.05} />
              <ReferenceLine y={70} stroke="#ffffff" strokeDasharray="2 2" strokeOpacity={0.05} />
              <ReferenceLine y={30} stroke="#ffffff" strokeDasharray="2 2" strokeOpacity={0.05} />
              <ReferenceLine y={20} stroke="#ffffff" strokeDasharray="2 2" strokeOpacity={0.05} />

              {/* Dynamic Background Highlights (Pine Script logic) */}
              {/* Use Bar chart for background highlights - render behind RSI line */}
              <Bar
                dataKey="bgValue"
                fill="#000000"
                isAnimationActive={false}
                yAxisId={0}
                radius={0}
                stackId="bg"
              >
                {backgroundData.map((entry, index) => (
                  <Cell 
                    key={`bg-cell-${index}`} 
                    fill={entry.bgColor || 'transparent'} 
                    fillOpacity={entry.bgOpacity || 0}
                  />
                ))}
              </Bar>

              {/* RSI Line (Purple) - render on top */}
              <Line 
                type="monotone" 
                dataKey="rsi" 
                stroke="#a855f7"
                strokeWidth={2} 
                dot={false} 
                name="RSI"
                isAnimationActive={false}
              />

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
  const { t, language } = useTranslation();
  const upperColor = "#ff0066";
  const lowerColor = "#00cc88";

  return (
    <div className="w-full h-[250px] bg-[#0f172a] rounded-lg p-4 border border-slate-800 mt-4 relative">
       <h4 className="text-slate-400 text-xs uppercase font-bold mb-2">{t.charts.indicator2Title}</h4>
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
              const formattedDate = isNaN(date.getTime()) ? label : date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { 
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

// Indicator 3: Latent Energy Reactor Chart
export const LatentEnergyChart: React.FC<IndicatorChartProps> = ({ data }) => {
  const { t, language } = useTranslation();
  
  // Filter signals
  const newZoneSignals = data.filter(d => d.isNewZone);
  const imminentBreakoutSignals = data.filter(d => d.isImminentBreakout);
  const breakoutUpSignals = data.filter(d => d.isBreakoutUp);
  const breakoutDownSignals = data.filter(d => d.isBreakoutDown);
  
  // Calculate time ticks (reuse logic from MainPriceChart)
  const timeTicks = useMemo(() => {
    if (data.length === 0) return [];
    const ticks: string[] = [];
    const totalPoints = data.length;
    const numTicks = Math.min(8, Math.max(3, Math.floor(totalPoints / 40)));
    
    if (totalPoints > 1) {
      const firstTime = new Date(data[0].time).getTime();
      const lastTime = new Date(data[totalPoints - 1].time).getTime();
      const timeRange = lastTime - firstTime;
      
      ticks.push(data[0].time);
      
      for (let i = 1; i < numTicks - 1; i++) {
        const targetTime = firstTime + (timeRange * i / (numTicks - 1));
        let closestIndex = 0;
        let minDiff = Infinity;
        for (let j = 0; j < totalPoints; j++) {
          const diff = Math.abs(new Date(data[j].time).getTime() - targetTime);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = j;
          }
        }
        if (data[closestIndex]?.time && !ticks.includes(data[closestIndex].time)) {
          ticks.push(data[closestIndex].time);
        }
      }
      
      if (data[totalPoints - 1]?.time && !ticks.includes(data[totalPoints - 1].time)) {
        ticks.push(data[totalPoints - 1].time);
      }
    }
    
    ticks.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return ticks;
  }, [data]);
  
  // Prepare data with range visualization
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      // Show range if active
      rangeHeight: d.rangeTop > 0 && d.rangeBottom > 0 ? d.rangeTop - d.rangeBottom : 0,
      rangeMid: d.rangeTop > 0 && d.rangeBottom > 0 ? (d.rangeTop + d.rangeBottom) / 2 : 0,
    }));
  }, [data]);
  
  return (
    <div className="w-full h-[300px] bg-[#0f172a] rounded-lg p-4 border border-slate-800 mt-4 relative">
      <h4 className="text-slate-400 text-xs uppercase font-bold mb-2">
        {language === 'zh' ? '潜在能量反应堆 (Latent Energy Reactor)' : 'Latent Energy Reactor'}
      </h4>
      <ResponsiveContainer width="100%" height="100%" minHeight={250}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#475569" 
            tick={{fontSize: 10, fill: '#94a3b8'}} 
            tickFormatter={(val) => {
              if (!val) return '';
              const date = new Date(val);
              if (isNaN(date.getTime())) return val;
              return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', year: 'numeric' });
            }}
            ticks={timeTicks}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
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
              const d = payload[0]?.payload as IndicatorData;
              if (!d) return null;
              
              const date = new Date(label);
              const formattedDate = isNaN(date.getTime()) ? label : date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              });
              
              return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
                  <p className="text-slate-400 mb-1">{formattedDate}</p>
                  <div className="space-y-1">
                    <p className="text-cyan-400">
                      {language === 'zh' ? '能量' : 'Energy'}: {typeof d.latentEnergy === 'number' ? d.latentEnergy.toFixed(1) : '0'}%
                    </p>
                    {d.rangeTop > 0 && d.rangeBottom > 0 && (
                      <>
                        <p className="text-blue-400">
                          {language === 'zh' ? '区间上沿' : 'Range Top'}: {d.rangeTop.toFixed(2)}
                        </p>
                        <p className="text-blue-400">
                          {language === 'zh' ? '区间下沿' : 'Range Bottom'}: {d.rangeBottom.toFixed(2)}
                        </p>
                      </>
                    )}
                    <p className="text-purple-400">
                      {language === 'zh' ? '阶段' : 'Phase'}: {
                        d.rangePhase === 'forming' ? (language === 'zh' ? '形成中' : 'Forming') :
                        d.rangePhase === 'growth' ? (language === 'zh' ? '成长' : 'Growth') :
                        d.rangePhase === 'mature' ? (language === 'zh' ? '成熟' : 'Mature') :
                        d.rangePhase === 'exhaustion' ? (language === 'zh' ? '衰竭' : 'Exhaustion') :
                        (language === 'zh' ? '无' : 'None')
                      }
                    </p>
                    <p className="text-yellow-400">
                      {language === 'zh' ? '突破方向' : 'Direction'}: {
                        d.breakoutDirection === 'bullish' ? (language === 'zh' ? '看涨' : 'Bullish') :
                        d.breakoutDirection === 'bearish' ? (language === 'zh' ? '看跌' : 'Bearish') :
                        d.breakoutDirection === 'neutral' ? (language === 'zh' ? '中性' : 'Neutral') :
                        (language === 'zh' ? '无' : 'None')
                      } ({d.breakoutConfidence.toFixed(0)}%)
                    </p>
                    <p className="text-orange-400">
                      {language === 'zh' ? '突破质量' : 'Quality'}: {d.breakoutQuality.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            }}
          />
          
          <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" strokeOpacity={0.3} />
          
          {/* Range visualization - show as area when active */}
          {chartData.some(d => d.rangeTop > 0 && d.rangeBottom > 0) && (
            <>
              <Area
                dataKey="rangeTop"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.1}
                strokeWidth={1}
                strokeDasharray="2 2"
                name={language === 'zh' ? '区间上沿' : 'Range Top'}
              />
              <Area
                dataKey="rangeBottom"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.1}
                strokeWidth={1}
                strokeDasharray="2 2"
                name={language === 'zh' ? '区间下沿' : 'Range Bottom'}
              />
            </>
          )}
          
          {/* Price line */}
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke="#64748b" 
            strokeWidth={1.5} 
            dot={false}
            name={language === 'zh' ? '价格' : 'Price'}
            strokeOpacity={0.6}
          />
          
          {/* Energy line */}
          <Line 
            type="monotone" 
            dataKey="latentEnergy" 
            stroke="#06b6d4" 
            strokeWidth={2} 
            dot={false}
            name={language === 'zh' ? '能量' : 'Energy'}
            yAxisId={1}
          />
          
          {/* Energy reference lines */}
          <ReferenceLine y={80} yAxisId={1} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.5} label={{ value: language === 'zh' ? '临界' : 'Critical', position: 'right' }} />
          <ReferenceLine y={60} yAxisId={1} stroke="#f59e0b" strokeDasharray="2 2" strokeOpacity={0.5} label={{ value: language === 'zh' ? '高' : 'High', position: 'right' }} />
          
          {/* Signals */}
          <Scatter 
            name={language === 'zh' ? '新区间' : 'New Zone'} 
            data={newZoneSignals} 
            shape={(props: any) => {
              const { cx, cy } = props;
              if (!cx || !cy || isNaN(cx) || isNaN(cy)) return null;
              return (
                <g>
                  <circle cx={cx} cy={cy} r={6} fill="#a855f7" stroke="#fff" strokeWidth={1} />
                  <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">N</text>
                </g>
              );
            }} 
          />
          
          <Scatter 
            name={language === 'zh' ? '即将突破' : 'Imminent'} 
            data={imminentBreakoutSignals} 
            shape={(props: any) => {
              const { cx, cy } = props;
              if (!cx || !cy || isNaN(cx) || isNaN(cy)) return null;
              return (
                <g>
                  <circle cx={cx} cy={cy} r={6} fill="#f59e0b" stroke="#fff" strokeWidth={1} />
                  <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">!</text>
                </g>
              );
            }} 
          />
          
          <Scatter 
            name={language === 'zh' ? '看涨突破' : 'Breakout Up'} 
            data={breakoutUpSignals} 
            shape={(props: any) => {
              const { cx, cy } = props;
              if (!cx || !cy || isNaN(cx) || isNaN(cy)) return null;
              return (
                <g>
                  <rect x={cx - 8} y={cy - 8} width={16} height={16} rx={3} fill="#10b981" />
                  <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">↑</text>
                </g>
              );
            }} 
          />
          
          <Scatter 
            name={language === 'zh' ? '看跌突破' : 'Breakout Down'} 
            data={breakoutDownSignals} 
            shape={(props: any) => {
              const { cx, cy } = props;
              if (!cx || !cy || isNaN(cx) || isNaN(cy)) return null;
              return (
                <g>
                  <rect x={cx - 8} y={cy - 8} width={16} height={16} rx={3} fill="#ef4444" />
                  <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">↓</text>
                </g>
              );
            }} 
          />
          
          {/* Secondary Y-axis for energy (0-100) */}
          <YAxis 
            yAxisId={1}
            orientation="right"
            domain={[0, 100]}
            stroke="#06b6d4"
            tick={{fontSize: 10, fill: '#06b6d4'}}
            width={50}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
