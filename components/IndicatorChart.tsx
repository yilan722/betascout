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

interface OrderbookImbalanceChartProps {
  symbol?: string; // Asset symbol for independent data fetching
  yahooSymbol?: string; // Yahoo Finance symbol format
  data?: IndicatorData[]; // Optional: use provided data if available
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

// Indicator 4: SCF Orderbook Imbalance Chart
export const OrderbookImbalanceChart: React.FC<OrderbookImbalanceChartProps> = ({ symbol, yahooSymbol, data: providedData }) => {
  const { t, language } = useTranslation();
  const [orderbookTimeframe, setOrderbookTimeframe] = React.useState<'15m' | '1m'>('15m');
  const [orderbookData, setOrderbookData] = React.useState<IndicatorData[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // Use provided data if available, otherwise use loaded data
  const data = providedData && providedData.length > 0 ? providedData : orderbookData;
  
  // Filter data that has orderbook data
  const hasOrderbookData = data.some(d => d.hasOrderbookData);
  
  // Calculate time ticks - MUST be before any conditional returns
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
  
  // Prepare chart data with color coding - MUST be before any conditional returns
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      // Color: green if positive delta (more bids), red if negative delta (more asks) - like CoinGlass
      color: d.orderbookDelta !== undefined && d.orderbookDelta > 0 ? '#10b981' : '#ef4444',
    }));
  }, [data]);
  
  // Load orderbook data independently when timeframe or symbol changes
  React.useEffect(() => {
    if (!yahooSymbol || !symbol) return;
    
    const loadOrderbookData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Import analyzeAsset dynamically to avoid circular dependency
        const { analyzeAsset } = await import('../services/dataService');
        const result = await analyzeAsset(symbol, orderbookTimeframe);
        setOrderbookData(result.indicators);
      } catch (err: any) {
        console.error('Failed to load orderbook data:', err);
        
        // Check if it's a K-line data fetch error (network issue)
        // Even if K-line fails, we can still show current orderbook data
        if (err.message?.includes('Failed to fetch') || err.message?.includes('fetch')) {
          // Try to load just the current orderbook snapshot
          try {
            const { loadOrderbookHistory, getAggregatedOrderbookHistory } = await import('../services/orderbookStorage');
            
            // Get historical data from storage
            const history = getAggregatedOrderbookHistory(yahooSymbol, orderbookTimeframe, orderbookTimeframe === '15m' ? 24 : 12);
            
            if (history.length > 0) {
              // We have some historical data
              const minimalData: IndicatorData[] = history.map(entry => ({
                time: new Date(entry.timestamp).toISOString(),
                price: entry.price,
                open: entry.price,
                high: entry.price,
                low: entry.price,
                close: entry.price,
                rsi: 50,
                ema20: entry.price,
                atr: 0,
                lowerAtrBand: entry.price,
                upperAtrBand: entry.price,
                isOversold1: false,
                isOverbought1: false,
                rsiLevel: 'neutral',
                rsiTrend: 'neutral',
                aggScore: 0,
                aggLowerBand: 0,
                aggUpperBand: 0,
                isOversold2: false,
                isOverbought2: false,
                buySignal: false,
                strongBuySignal: false,
                latentEnergy: 0,
                rangeTop: 0,
                rangeBottom: 0,
                rangePhase: 'none',
                breakoutDirection: 'none',
                breakoutConfidence: 0,
                breakoutQuality: 0,
                isNewZone: false,
                isImminentBreakout: false,
                isBreakoutUp: false,
                isBreakoutDown: false,
                orderbookImbalance: entry.imbalance,
                orderbookDelta: entry.delta || 0,
                orderbookMaRatio: entry.imbalance,
                orderbookOscillator: 0,
                orderbookBaseline: 0,
                hasOrderbookData: true,
              }));
              
              // Calculate MA and oscillator if we have enough data
              if (minimalData.length >= 13) {
                const { calculateSMA } = await import('../utils/math');
                const ratios = minimalData.map(d => d.orderbookImbalance || 0);
                const maRatios = calculateSMA(ratios, 13);
                minimalData.forEach((d, i) => {
                  d.orderbookMaRatio = maRatios[i] || d.orderbookImbalance || 0;
                  d.orderbookOscillator = (d.orderbookImbalance || 0) - (maRatios[i] || 0);
                });
              }
              
              setOrderbookData(minimalData);
              setError(null);
            } else {
              // No historical data yet
              const dataCount = loadOrderbookHistory(yahooSymbol).length;
              if (dataCount === 0) {
                setError(`K线数据获取失败，且订单簿历史数据为空。请等待采样服务积累数据（约需${orderbookTimeframe === '15m' ? '15分钟' : '1分钟'}）。`);
              } else {
                setError(`K线数据获取失败，但已有${dataCount}个订单簿快照。数据正在处理中...`);
              }
              setOrderbookData([]);
            }
          } catch (storageErr: any) {
            setError(`K线数据获取失败: ${err.message}。同时无法加载历史订单簿数据。`);
            setOrderbookData([]);
          }
        } else {
          setError(err.message || 'Failed to load orderbook data');
          setOrderbookData([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrderbookData();
  }, [yahooSymbol, symbol, orderbookTimeframe]);
  
  if (!yahooSymbol || !symbol) {
    return (
      <div className="w-full h-[250px] bg-[#0f172a] rounded-lg p-4 border border-slate-800 mt-4 relative">
        <h4 className="text-slate-400 text-xs uppercase font-bold mb-2">
          {language === 'zh' ? '订单簿不平衡 (SCF Orderbook Imbalance)' : 'SCF Orderbook Imbalance'}
        </h4>
        <div className="flex items-center justify-center h-full text-slate-500">
          <p className="text-sm">
            {language === 'zh' 
              ? '订单簿数据仅适用于加密货币标的（BTC/ETH等）' 
              : 'Orderbook data is only available for crypto assets (BTC/ETH, etc.)'}
          </p>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="w-full h-[300px] bg-[#0f172a] rounded-lg p-4 border border-slate-800 mt-4 relative">
        <h4 className="text-slate-400 text-xs uppercase font-bold mb-2">
          {language === 'zh' ? '订单簿不平衡 (SCF Orderbook Imbalance)' : 'SCF Orderbook Imbalance'}
        </h4>
        <div className="flex items-center justify-center h-full text-slate-500">
          <p className="text-sm">{language === 'zh' ? '加载中...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }
  
  if (error || !hasOrderbookData) {
    return (
      <div className="w-full h-[300px] bg-[#0f172a] rounded-lg p-4 border border-slate-800 mt-4 relative">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-slate-400 text-xs uppercase font-bold">
            {language === 'zh' ? '订单簿不平衡 (SCF Orderbook Imbalance)' : 'SCF Orderbook Imbalance'}
          </h4>
          {/* Timeframe selector */}
          <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
            <button 
              onClick={() => setOrderbookTimeframe('15m')}
              className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                orderbookTimeframe === '15m' 
                ? 'bg-blue-600 text-white shadow' 
                : 'text-slate-400 hover:text-white'
              }`}
            >
              15m
            </button>
            <button 
              onClick={() => setOrderbookTimeframe('1m')}
              className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                orderbookTimeframe === '1m' 
                ? 'bg-blue-600 text-white shadow' 
                : 'text-slate-400 hover:text-white'
              }`}
            >
              1m
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <p className="text-sm mb-2 text-center px-4">
            {error 
              ? (language === 'zh' ? `⚠️ ${error}` : `⚠️ ${error}`)
              : (language === 'zh' 
                  ? `请选择15m或1m时间周期查看历史数据。数据正在积累中...` 
                  : 'Please select 15m or 1m timeframe to view historical data. Data is being collected...')}
          </p>
          {!error && (
            <div className="text-xs text-slate-600 space-y-1 text-center px-4">
              <p>
                {language === 'zh' 
                  ? '📊 数据积累时间：' 
                  : '📊 Data accumulation time:'}
              </p>
              <p>
                {language === 'zh' 
                  ? '• 15m周期：约需15-30分钟积累足够数据' 
                  : '• 15m timeframe: ~15-30 minutes to accumulate enough data'}
              </p>
              <p>
                {language === 'zh' 
                  ? '• 1m周期：约需1-5分钟积累足够数据' 
                  : '• 1m timeframe: ~1-5 minutes to accumulate enough data'}
              </p>
              <p className="mt-2 text-slate-500">
                {language === 'zh' 
                  ? '💡 提示：应用会自动每分钟采样订单簿数据' 
                  : '💡 Tip: The app automatically samples orderbook data every minute'}
              </p>
            </div>
          )}
          {error && error.includes('K线数据获取失败') && (
            <div className="text-xs text-slate-600 space-y-1 text-center px-4 mt-2">
              <p>
                {language === 'zh' 
                  ? '可能原因：' 
                  : 'Possible causes:'}
              </p>
              <p>
                {language === 'zh' 
                  ? '1. 网络连接问题 - 请检查网络连接' 
                  : '1. Network issue - Please check your connection'}
              </p>
              <p>
                {language === 'zh' 
                  ? '2. Binance API限制 - 请稍后重试' 
                  : '2. Binance API restriction - Please try again later'}
              </p>
              <p className="mt-2 text-slate-500">
                {language === 'zh' 
                  ? '💡 即使K线数据获取失败，订单簿历史数据仍会继续积累' 
                  : '💡 Even if K-line data fetch fails, orderbook history will continue to accumulate'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-[300px] bg-[#0f172a] rounded-lg p-4 border border-slate-800 mt-4 relative">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-slate-400 text-xs uppercase font-bold">
          {language === 'zh' ? '订单簿不平衡 (SCF Orderbook Imbalance)' : 'SCF Orderbook Imbalance'}
        </h4>
        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
            <button 
              onClick={() => setOrderbookTimeframe('15m')}
              className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                orderbookTimeframe === '15m' 
                ? 'bg-blue-600 text-white shadow' 
                : 'text-slate-400 hover:text-white'
              }`}
            >
              15m
            </button>
            <button 
              onClick={() => setOrderbookTimeframe('1m')}
              className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                orderbookTimeframe === '1m' 
                ? 'bg-blue-600 text-white shadow' 
                : 'text-slate-400 hover:text-white'
              }`}
            >
              1m
            </button>
          </div>
          {/* Status indicator - show Delta like CoinGlass */}
          {data.length > 0 && (() => {
            const latest = data[data.length - 1];
            if (latest.hasOrderbookData && latest.orderbookDelta !== undefined) {
              const isPositive = latest.orderbookDelta > 0;
              const deltaValue = latest.orderbookDelta;
              const absValue = Math.abs(deltaValue);
              // Format as millions if >= 1M, otherwise as thousands
              const formattedValue = absValue >= 1000000 
                ? `${(deltaValue / 1000000).toFixed(2)}M`
                : `${(deltaValue / 1000).toFixed(2)}K`;
              return (
                <div 
                  className="px-3 py-1.5 rounded border-2 text-xs font-bold"
                  style={{ 
                    backgroundColor: isPositive ? '#10b981' : '#ef4444',
                    borderColor: isPositive ? '#10b981' : '#ef4444',
                    color: '#ffffff'
                  }}
                >
                  <div>{language === 'zh' ? 'Delta' : 'Delta'}</div>
                  <div className="text-right">
                    {isPositive ? '+' : '-'}${formattedValue}
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>
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
              // For intraday timeframes, show time with date
              if (orderbookTimeframe === '15m' || orderbookTimeframe === '1m') {
                return date.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
              }
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
              if (!d || !d.hasOrderbookData) return null;
              
              const date = new Date(label);
              const formattedDate = isNaN(date.getTime()) ? label : 
                (orderbookTimeframe === '15m' || orderbookTimeframe === '1m')
                  ? date.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    });
              
              return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
                  <p className="text-slate-400 mb-1">{formattedDate}</p>
                  <div className="space-y-1">
                    {d.orderbookImbalance !== undefined && (
                      <p className="text-cyan-400">
                        {language === 'zh' ? '不平衡比率' : 'Imbalance Ratio'}: {d.orderbookImbalance.toFixed(4)}
                      </p>
                    )}
                    {d.orderbookMaRatio !== undefined && (
                      <p className="text-blue-400">
                        {language === 'zh' ? '移动平均' : 'MA Ratio'}: {d.orderbookMaRatio.toFixed(4)}
                      </p>
                    )}
                    {d.orderbookDelta !== undefined && (
                      <p className={d.orderbookDelta > 0 ? 'text-green-400' : 'text-red-400'}>
                        {language === 'zh' ? 'Delta (美元)' : 'Delta (USD)'}: ${(d.orderbookDelta / 1000000).toFixed(2)}M
                      </p>
                    )}
                    {d.orderbookOscillator !== undefined && (
                      <p className={d.orderbookOscillator > 0 ? 'text-yellow-400' : 'text-orange-400'}>
                        {language === 'zh' ? '振荡器' : 'Oscillator'}: {d.orderbookOscillator.toFixed(4)}
                      </p>
                    )}
                    <p className="text-slate-500 text-xs mt-2">
                      {language === 'zh' 
                        ? `数据来源：Binance订单簿（${orderbookTimeframe}周期，1%深度）` 
                        : `Data source: Binance orderbook (${orderbookTimeframe} timeframe, 1% depth)`}
                    </p>
                  </div>
                </div>
              );
            }}
          />
          
          <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" strokeOpacity={0.5} />
          
          {/* Bar chart for Delta (like CoinGlass) - shows absolute USD value */}
          <Bar
            dataKey="orderbookDelta"
            name={language === 'zh' ? 'Delta (美元)' : 'Delta (USD)'}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.hasOrderbookData && entry.orderbookDelta !== undefined 
                  ? (entry.orderbookDelta > 0 ? '#10b981' : '#ef4444')
                  : 'transparent'
                } 
              />
            ))}
          </Bar>
          
          {/* Baseline (always 0) */}
          <Line 
            type="monotone" 
            dataKey="orderbookBaseline" 
            stroke="#64748b" 
            strokeWidth={1} 
            strokeDasharray="2 2"
            dot={false}
            name={language === 'zh' ? '基准线' : 'Baseline'}
            strokeOpacity={0.5}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Indicator 5: Triple Lines Supertrend Chart
export const SupertrendChart: React.FC<IndicatorChartProps> = ({ data }) => {
  const { t, language } = useTranslation();
  
  // Filter signals - touching any Supertrend line
  const touching1Signals = data.filter(d => d.supertrendTouching1);
  const touching2Signals = data.filter(d => d.supertrendTouching2);
  const touching3Signals = data.filter(d => d.supertrendTouching3);
  
  // Calculate time ticks
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
  
  // Prepare chart data with Supertrend lines and candlesticks
  const chartData = useMemo(() => {
    return data.map((d, index) => ({
      ...d,
      // For drawing candlesticks
      highWickTop: d.high,
      highWickBottom: Math.max(d.open, d.close),
      lowWickTop: Math.min(d.open, d.close),
      lowWickBottom: d.low,
      bodyTop: Math.max(d.open, d.close),
      bodyBottom: Math.min(d.open, d.close),
      bodyHeight: Math.abs(d.open - d.close),
      isGreen: d.close >= d.open,
      // Show ST1, ST2, ST3 values - separate up/down for color coding
      st1Up: d.supertrendTrend1 === 1 && d.supertrend1 !== undefined ? d.supertrend1 : null,
      st1Down: d.supertrendTrend1 === -1 && d.supertrend1 !== undefined ? d.supertrend1 : null,
      st2Up: d.supertrendTrend2 === 1 && d.supertrend2 !== undefined ? d.supertrend2 : null,
      st2Down: d.supertrendTrend2 === -1 && d.supertrend2 !== undefined ? d.supertrend2 : null,
      st3Up: d.supertrendTrend3 === 1 && d.supertrend3 !== undefined ? d.supertrend3 : null,
      st3Down: d.supertrendTrend3 === -1 && d.supertrend3 !== undefined ? d.supertrend3 : null,
    }));
  }, [data]);
  
  // Calculate price range for proper scaling
  const priceRange = useMemo(() => {
    const prices = data.flatMap(d => [d.high, d.low, d.open, d.close]).filter(p => typeof p === 'number' && !isNaN(p));
    if (prices.length === 0) return { min: 0, max: 100, range: 100 };
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max, range: max - min };
  }, [data]);
  
  return (
    <div className="w-full h-[350px] bg-[#0f172a] rounded-lg p-4 border border-slate-800 mt-4 relative">
      <h4 className="text-slate-400 text-xs uppercase font-bold mb-2">
        {language === 'zh' ? '超级趋势 (Triple Lines Supertrend)' : 'Triple Lines Supertrend'}
      </h4>
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
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
                    <p className="text-slate-300">
                      {language === 'zh' ? '价格' : 'Price'}: {d.close.toFixed(2)}
                    </p>
                    {d.supertrend1 !== undefined && (
                      <p className={d.supertrendTrend1 === 1 ? 'text-green-400' : 'text-red-400'}>
                        ST1 ({d.supertrendTrend1 === 1 ? '↑' : '↓'}): {d.supertrend1.toFixed(2)}
                      </p>
                    )}
                    {d.supertrend2 !== undefined && (
                      <p className={d.supertrendTrend2 === 1 ? 'text-green-400' : 'text-orange-400'}>
                        ST2 ({d.supertrendTrend2 === 1 ? '↑' : '↓'}): {d.supertrend2.toFixed(2)}
                      </p>
                    )}
                    {d.supertrend3 !== undefined && (
                      <p className={d.supertrendTrend3 === 1 ? 'text-yellow-400' : 'text-cyan-400'}>
                        ST3 ({d.supertrendTrend3 === 1 ? '↑' : '↓'}): {d.supertrend3.toFixed(2)}
                      </p>
                    )}
                    {d.supertrendAlertLevel !== undefined && d.supertrendAlertLevel > 0 && (
                      <p className={`font-bold ${
                        d.supertrendAlertLevel === 3 ? 'text-red-500' :
                        d.supertrendAlertLevel === 2 ? 'text-orange-500' :
                        'text-yellow-500'
                      }`}>
                        {language === 'zh' ? '预警级别' : 'Alert Level'}: {d.supertrendAlertLevel}
                      </p>
                    )}
                  </div>
                </div>
              );
            }}
          />
          
          {/* Use Line components to set the price range for proper scaling */}
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
          
          {/* Draw candlesticks using Scatter with custom shapes - render first so they appear behind Supertrend lines */}
          <Scatter 
            data={chartData}
            shape={(props: any) => {
              const { cx, cy, payload } = props;
              if (!payload || !cx || !cy || isNaN(cx) || isNaN(cy)) return null;
              
              const { open, high, low, close, isGreen } = payload;
              if (!open || !close || !high || !low) return null;
              if (isNaN(open) || isNaN(close) || isNaN(high) || isNaN(low)) return null;
              
              const color = isGreen ? '#10b981' : '#ef4444';
              const candleWidth = 10; // Increased width for better visibility
              const halfWidth = candleWidth / 2;
              
              // Calculate scale factor based on price range
              const scaleFactor = priceRange.range > 0 ? (300 / priceRange.range) * 0.8 : 1;
              
              // Calculate pixel positions
              const highY = cy - (high - close) * scaleFactor;
              const lowY = cy + (close - low) * scaleFactor;
              const openY = cy - (close - open) * scaleFactor;
              const closeY = cy;
              
              const bodyTop = Math.min(openY, closeY);
              const bodyBottom = Math.max(openY, closeY);
              const bodyHeight = Math.max(3, Math.abs(openY - closeY)); // Minimum height of 3px
              
              return (
                <g key={`candle-${payload.time}`}>
                  {/* Upper wick: from high to max(open, close) */}
                  <line 
                    x1={cx} 
                    y1={highY}
                    x2={cx} 
                    y2={Math.min(openY, closeY)}
                    stroke={color} 
                    strokeWidth={2.5}
                    strokeOpacity={1}
                  />
                  {/* Lower wick: from min(open, close) to low */}
                  <line 
                    x1={cx} 
                    y1={Math.max(openY, closeY)}
                    x2={cx} 
                    y2={lowY}
                    stroke={color} 
                    strokeWidth={2.5}
                    strokeOpacity={1}
                  />
                  {/* Body: rectangle */}
                  <rect 
                    x={cx - halfWidth}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={isGreen ? '#0f172a' : color}
                    stroke={color}
                    strokeWidth={2}
                    strokeOpacity={1}
                    fillOpacity={isGreen ? 0.9 : 1}
                  />
                </g>
              );
            }}
          />
          
          {/* Supertrend 1 - Up trend (green) */}
          <Line 
            type="monotone" 
            dataKey="st1Up" 
            stroke="#10b981" 
            strokeWidth={2} 
            dot={false}
            name="ST1"
            connectNulls={true}
          />
          
          {/* Supertrend 1 - Down trend (red) */}
          <Line 
            type="monotone" 
            dataKey="st1Down" 
            stroke="#ef4444" 
            strokeWidth={2} 
            dot={false}
            name="ST1"
            connectNulls={true}
          />
          
          {/* Supertrend 2 - Up trend (bright green) */}
          <Line 
            type="monotone" 
            dataKey="st2Up" 
            stroke="#1afd06" 
            strokeWidth={2} 
            dot={false}
            name="ST2"
            connectNulls={true}
          />
          
          {/* Supertrend 2 - Down trend (orange) */}
          <Line 
            type="monotone" 
            dataKey="st2Down" 
            stroke="#f97316" 
            strokeWidth={2} 
            dot={false}
            name="ST2"
            connectNulls={true}
          />
          
          {/* Supertrend 3 - Up trend (yellow) */}
          <Line 
            type="monotone" 
            dataKey="st3Up" 
            stroke="#f8f400" 
            strokeWidth={2} 
            dot={false}
            name="ST3"
            connectNulls={true}
          />
          
          {/* Supertrend 3 - Down trend (cyan) */}
          <Line 
            type="monotone" 
            dataKey="st3Down" 
            stroke="#00f7f7" 
            strokeWidth={2} 
            dot={false}
            name="ST3"
            connectNulls={true}
          />
          
          {/* Price line - White line for clear visibility (render on top) */}
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke="#ffffff" 
            strokeWidth={3} 
            dot={false}
            name={language === 'zh' ? '价格' : 'Price'}
            strokeOpacity={1}
            isAnimationActive={false}
          />
          
          {/* Signals - Level 3 (most important) */}
          <Scatter 
            name={language === 'zh' ? '触及ST3' : 'Touch ST3'} 
            data={touching3Signals} 
            shape={(props: any) => {
              const { cx, cy } = props;
              if (!cx || !cy || isNaN(cx) || isNaN(cy)) return null;
              return (
                <g>
                  <rect x={cx - 12} y={cy - 12} width={24} height={24} rx={4} fill="#ef4444" stroke="#fff" strokeWidth={2} />
                  <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">3</text>
                </g>
              );
            }} 
          />
          
          {/* Signals - Level 2 */}
          <Scatter 
            name={language === 'zh' ? '触及ST2' : 'Touch ST2'} 
            data={touching2Signals.filter(d => !d.supertrendTouching3)} 
            shape={(props: any) => {
              const { cx, cy } = props;
              if (!cx || !cy || isNaN(cx) || isNaN(cy)) return null;
              return (
                <g>
                  <rect x={cx - 10} y={cy - 10} width={20} height={20} rx={4} fill="#f97316" stroke="#fff" strokeWidth={1.5} />
                  <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">2</text>
                </g>
              );
            }} 
          />
          
          {/* Signals - Level 1 */}
          <Scatter 
            name={language === 'zh' ? '触及ST1' : 'Touch ST1'} 
            data={touching1Signals.filter(d => !d.supertrendTouching2 && !d.supertrendTouching3)} 
            shape={(props: any) => {
              const { cx, cy } = props;
              if (!cx || !cy || isNaN(cx) || isNaN(cy)) return null;
              return (
                <g>
                  <circle cx={cx} cy={cy} r={6} fill="#fbbf24" stroke="#fff" strokeWidth={1} />
                  <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">1</text>
                </g>
              );
            }} 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
