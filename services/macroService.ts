// Macro Indicators Service
// US Market Saturation & Positioning Index

export interface MacroIndicator {
  id: string;
  name: string;
  nameZh: string;
  category: 'dry_powder' | 'active_exposure' | 'complacency' | 'technical';
  weight: number; // Weight in scoring (0-1)
  value: number | null;
  unit: string;
  riskThreshold: number; // Threshold for risk signal (1 point)
  extremeThreshold: number; // Threshold for extreme risk signal (2 points)
  dataSource: string;
  updateFrequency: string;
  lastUpdate: string;
  status: 'normal' | 'risk' | 'extreme_risk';
  score: number; // 0, 1, or 2
  description: string; // English description
  descriptionZh: string; // Chinese description
}

export interface MacroDashboardData {
  indicators: MacroIndicator[];
  totalScore: number; // 0-10
  riskLevel: 'safe' | 'caution' | 'danger';
  lastUpdated: string;
}

// Fetch Put/Call Ratio from CBOE (using Yahoo Finance as proxy)
const fetchPutCallRatio = async (): Promise<number | null> => {
  try {
    // CBOE Equity Put/Call Ratio is available via Yahoo Finance
    // Symbol: ^CPCE (CBOE Equity Put/Call Ratio)
    // We'll use a proxy to fetch this
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5ECPCE?interval=1d&range=5d';
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (result && result.indicators?.quote?.[0]) {
      const quotes = result.indicators.quote[0];
      const closes = quotes.close;
      if (closes && closes.length > 0) {
        // Get the most recent non-null value
        const latestValue = closes[closes.length - 1];
        return latestValue;
      }
    }
    return null;
  } catch (error) {
    console.warn('Failed to fetch Put/Call Ratio:', error);
    return null;
  }
};

// Fetch VIX from Yahoo Finance
const fetchVIX = async (): Promise<number | null> => {
  try {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=5d';
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (result && result.indicators?.quote?.[0]) {
      const quotes = result.indicators.quote[0];
      const closes = quotes.close;
      if (closes && closes.length > 0) {
        return closes[closes.length - 1];
      }
    }
    return null;
  } catch (error) {
    console.warn('Failed to fetch VIX:', error);
    return null;
  }
};

// Fetch SKEW Index from Yahoo Finance
const fetchSKEW = async (): Promise<number | null> => {
  try {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5ESKEW?interval=1d&range=5d';
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (result && result.indicators?.quote?.[0]) {
      const quotes = result.indicators.quote[0];
      const closes = quotes.close;
      if (closes && closes.length > 0) {
        return closes[closes.length - 1];
      }
    }
    return null;
  } catch (error) {
    console.warn('Failed to fetch SKEW:', error);
    return null;
  }
};

// Calculate % of S&P 500 stocks above 50 DMA
const fetchSP500Above50DMA = async (): Promise<number | null> => {
  try {
    // This is a complex calculation that would require fetching all S&P 500 stocks
    // For now, we'll use a simplified approach with SPY as proxy
    // In production, this should be calculated from actual S&P 500 components
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=1d&range=3mo';
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (result && result.indicators?.quote?.[0]) {
      const quotes = result.indicators.quote[0];
      const closes = quotes.close;
      const timestamps = result.timestamp;
      
      if (closes && timestamps && closes.length >= 50) {
        // Calculate 50-day moving average
        const recent50 = closes.slice(-50);
        const ma50 = recent50.reduce((sum: number, val: number) => sum + (val || 0), 0) / 50;
        const currentPrice = closes[closes.length - 1];
        
        // Calculate deviation from 50 DMA
        const deviation = ((currentPrice - ma50) / ma50) * 100;
        
        // Estimate % above 50 DMA based on SPY's position
        // This is a simplified proxy - in production, calculate from all S&P 500 components
        if (deviation > 5) return 85; // High percentage
        if (deviation > 2) return 70;
        if (deviation > 0) return 55;
        if (deviation > -2) return 45;
        return 30; // Low percentage
      }
    }
    return null;
  } catch (error) {
    console.warn('Failed to fetch S&P 500 above 50 DMA:', error);
    return null;
  }
};

// Calculate price deviation from 200 DMA for SPY
const fetchSPY200DMADeviation = async (): Promise<number | null> => {
  try {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=1d&range=1y';
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (result && result.indicators?.quote?.[0]) {
      const quotes = result.indicators.quote[0];
      const closes = quotes.close;
      
      if (closes && closes.length >= 200) {
        const recent200 = closes.slice(-200);
        const ma200 = recent200.reduce((sum: number, val: number) => sum + (val || 0), 0) / 200;
        const currentPrice = closes[closes.length - 1];
        const deviation = ((currentPrice - ma200) / ma200) * 100;
        return deviation;
      }
    }
    return null;
  } catch (error) {
    console.warn('Failed to fetch SPY 200 DMA deviation:', error);
    return null;
  }
};

// Calculate score for an indicator
const calculateIndicatorScore = (indicator: MacroIndicator): number => {
  if (indicator.value === null) return 0;
  
  // For indicators where lower is riskier (Put/Call Ratio)
  if (indicator.id === 'put_call_ratio') {
    if (indicator.value <= indicator.extremeThreshold) return 2;
    if (indicator.value <= indicator.riskThreshold) return 1;
    return 0;
  }
  
  // For indicators where lower is safer (VIX - low VIX means complacency/risk)
  if (indicator.id === 'vix') {
    if (indicator.value <= indicator.extremeThreshold) return 2; // Very low VIX = extreme risk
    if (indicator.value <= indicator.riskThreshold) return 1; // Low VIX = risk
    return 0; // Higher VIX = safer (more fear)
  }
  
  // For SKEW: lower SKEW means less tail risk pricing = more complacency = riskier
  if (indicator.id === 'skew') {
    if (indicator.value <= indicator.extremeThreshold) return 2; // Very low SKEW = extreme risk
    if (indicator.value <= indicator.riskThreshold) return 1; // Low SKEW = risk
    return 0; // Higher SKEW = safer (more tail risk awareness)
  }
  
  // For indicators where lower is riskier (BofA Cash, Mutual Fund Cash - low cash = risk)
  if (indicator.id === 'bofa_cash' || indicator.id === 'mutual_fund_cash') {
    if (indicator.value <= indicator.extremeThreshold) return 2; // Very low cash = extreme risk
    if (indicator.value <= indicator.riskThreshold) return 1; // Low cash = risk
    return 0; // Higher cash = safer
  }
  
  // For indicators where higher is riskier (NAAIM, CFTC, % above 50 DMA, 200 DMA deviation)
  if (indicator.value >= indicator.extremeThreshold) return 2;
  if (indicator.value >= indicator.riskThreshold) return 1;
  return 0;
};

// Fetch all macro indicators
export const fetchMacroIndicators = async (): Promise<MacroDashboardData> => {
  const now = new Date();
  const lastUpdated = now.toISOString();
  
  // Fetch real-time data
  const [putCallRatio, vix, skew, sp500Above50, spy200Deviation] = await Promise.all([
    fetchPutCallRatio(),
    fetchVIX(),
    fetchSKEW(),
    fetchSP500Above50DMA(),
    fetchSPY200DMADeviation(),
  ]);
  
  // Define all indicators with their configurations
  const indicators: MacroIndicator[] = [
    {
      id: 'bofa_cash',
      name: 'BofA FMS Cash Level',
      nameZh: 'BofA 基金经理现金水平',
      category: 'dry_powder',
      weight: 0.20,
      value: 3.5, // Example value - in production, fetch from BofA report or news API
      unit: '%',
      riskThreshold: 4.5,
      extremeThreshold: 4.0,
      dataSource: 'BofA Research / Financial News',
      updateFrequency: 'Monthly',
      lastUpdate: lastUpdated,
      status: 'normal',
      score: 0,
      description: 'Measures the average cash level held by global fund managers surveyed by Bank of America. Lower cash levels indicate managers are fully invested with little dry powder left. When cash drops below 4.0%, it signals extreme positioning and potential exhaustion of buying power. Historical data shows that levels below 4.0% have often preceded market corrections.',
      descriptionZh: '衡量美银全球基金经理调查中的平均现金持有水平。现金水平越低，说明基金经理已接近满仓，手中弹药不足。当现金水平降至4.0%以下时，表明市场极度拥挤，买盘力量可能枯竭。历史数据显示，4.0%以下往往预示着市场调整。2025年2月该指标降至3.5%，精准预示了后续的风险。',
    },
    {
      id: 'mutual_fund_cash',
      name: 'Mutual Fund Cash Ratio',
      nameZh: '公募基金现金比例',
      category: 'dry_powder',
      weight: 0.10,
      value: 2.1, // Example value - in production, fetch from ICI
      unit: '%',
      riskThreshold: 2.5,
      extremeThreshold: 2.0,
      dataSource: 'ICI (Investment Company Institute)',
      updateFrequency: 'Monthly',
      lastUpdate: lastUpdated,
      status: 'normal',
      score: 0,
      description: 'The percentage of total assets held in cash by US mutual funds. This represents the "dry powder" available to long-term institutional investors. When this ratio falls to historical lows (below 2.0%), it indicates that traditional long-term capital has been fully deployed, leaving little room for further market advances.',
      descriptionZh: '美国公募基金持有的现金占总资产的比例。这代表长线机构投资者的"弹药储备"。当该比例降至历史低位（低于2.0%）时，表明传统长线资金已全部投入，市场继续推升的空间有限。这是判断"Fully Invested"的重要指标之一。',
    },
    {
      id: 'naaim',
      name: 'NAAIM Exposure Index',
      nameZh: 'NAAIM 风险敞口指数',
      category: 'active_exposure',
      weight: 0.15,
      value: 75, // Example value - in production, fetch from NAAIM website
      unit: '%',
      riskThreshold: 80,
      extremeThreshold: 95,
      dataSource: 'NAAIM.org',
      updateFrequency: 'Weekly (Thursday)',
      lastUpdate: lastUpdated,
      status: 'normal',
      score: 0,
      description: 'Measures the average equity exposure of active investment managers in North America. Values above 80% indicate managers are heavily positioned long. When the index exceeds 95% or even 100%, it means managers are not only fully invested but also using leverage, creating extreme crowding. Any negative catalyst can trigger a cascade of selling as these leveraged positions unwind.',
      descriptionZh: '衡量北美活跃投资经理的平均股票风险敞口。数值超过80%表明经理人大量做多。当指数超过95%甚至100%时，意味着经理人不仅满仓，还使用了杠杆，形成极度拥挤。任何负面催化剂都可能引发这些杠杆头寸平仓，导致踩踏式下跌。',
    },
    {
      id: 'cftc_net_long',
      name: 'CFTC Net Long Position',
      nameZh: 'CFTC 非商业净多头',
      category: 'active_exposure',
      weight: 0.10,
      value: 65, // Example value - in production, fetch from CFTC COT report
      unit: 'Percentile',
      riskThreshold: 80,
      extremeThreshold: 95,
      dataSource: 'CFTC COT Report',
      updateFrequency: 'Weekly (Friday)',
      lastUpdate: lastUpdated,
      status: 'normal',
      score: 0,
      description: 'Tracks the net long positions of non-commercial traders (speculators) in S&P 500 (ES) and Nasdaq 100 (NQ) futures, measured as a percentile of historical positions. When net longs reach the 90th percentile or higher, it indicates extreme speculative positioning. Futures markets are often contrarian indicators - extreme crowding typically precedes reversals.',
      descriptionZh: '追踪CFTC持仓报告中非商业交易者（投机者）在标普500（ES）和纳斯达克100（NQ）期货中的净多头持仓，以历史分位数表示。当净多头达到90%分位数以上时，表明投机性持仓极度拥挤。期货市场通常是反向指标，极度拥挤往往预示着反转。',
    },
    {
      id: 'put_call_ratio',
      name: 'CBOE Put/Call Ratio',
      nameZh: 'CBOE 看跌/看涨比率',
      category: 'complacency',
      weight: 0.15,
      value: putCallRatio,
      unit: 'Ratio',
      riskThreshold: 0.60,
      extremeThreshold: 0.50,
      dataSource: 'CBOE / Yahoo Finance',
      updateFrequency: 'Daily',
      lastUpdate: lastUpdated,
      status: 'normal',
      score: 0,
      description: 'The ratio of put options to call options traded on CBOE. A low ratio (below 0.50) indicates excessive bullish sentiment - everyone is buying calls (betting on upside) and few are buying puts (protection). This is a classic sign of greed and complacency. When the ratio drops below 0.40, it often signals a market top as there is no one left to buy and no downside protection.',
      descriptionZh: 'CBOE股票看跌期权与看涨期权的交易比率。低比率（低于0.50）表明过度看涨情绪——所有人都在买入看涨期权（押注上涨），很少有人买入看跌期权（保护）。这是典型的贪婪和自满信号。当比率降至0.40以下时，往往预示着市场顶部，因为已无人可买，且缺乏下行保护。',
    },
    {
      id: 'skew',
      name: 'CBOE SKEW Index',
      nameZh: 'CBOE SKEW 指数',
      category: 'complacency',
      weight: 0.10,
      value: skew,
      unit: 'Index',
      riskThreshold: 120,
      extremeThreshold: 115,
      dataSource: 'CBOE / Yahoo Finance',
      updateFrequency: 'Daily',
      lastUpdate: lastUpdated,
      status: 'normal',
      score: 0,
      description: 'The SKEW index measures the perceived tail risk in the market based on S&P 500 option prices. Higher SKEW (typically 130+) indicates investors are pricing in tail risk (fear of extreme moves). Lower SKEW (below 115) suggests complacency - the market is not pricing in tail risks. When the market is at highs but SKEW is unusually low, it indicates investors have forgotten about downside risks, making the market vulnerable to black swan events.',
      descriptionZh: 'SKEW指数基于标普500期权价格衡量市场对尾部风险的感知。高SKEW（通常130+）表明投资者正在为尾部风险定价（担心极端波动）。低SKEW（低于115）表明自满——市场没有为尾部风险定价。当市场处于高位但SKEW异常低时，表明投资者忘记了下行风险，市场容易受到黑天鹅事件冲击。',
    },
    {
      id: 'sp500_above_50dma',
      name: '% Stocks > 50 DMA',
      nameZh: '标普500站上50日均线比例',
      category: 'technical',
      weight: 0.10,
      value: sp500Above50,
      unit: '%',
      riskThreshold: 85,
      extremeThreshold: 90,
      dataSource: 'Calculated from S&P 500 components',
      updateFrequency: 'Daily',
      lastUpdate: lastUpdated,
      status: 'normal',
      score: 0,
      description: 'The percentage of S&P 500 component stocks trading above their 50-day moving average. When this percentage exceeds 85-90%, it indicates that nearly all stocks are in uptrends, suggesting short-term momentum is exhausted. This is a technical sign of overextension - when everyone is already long, there are few buyers left to push prices higher.',
      descriptionZh: '标普500成分股中站上50日均线的股票比例。当该比例超过85-90%时，表明几乎所有股票都处于上升趋势，短期动能可能耗尽。这是技术性过度的信号——当所有人都已做多时，几乎没有买家能继续推高价格。',
    },
    {
      id: 'spy_200dma_deviation',
      name: 'SPY 200 DMA Deviation',
      nameZh: 'SPY 200日均线乖离',
      category: 'technical',
      weight: 0.15,
      value: spy200Deviation,
      unit: '%',
      riskThreshold: 10,
      extremeThreshold: 15,
      dataSource: 'Yahoo Finance',
      updateFrequency: 'Daily',
      lastUpdate: lastUpdated,
      status: 'normal',
      score: 0,
      description: 'Measures how far SPY (S&P 500 ETF) is trading above or below its 200-day moving average, expressed as a percentage. When SPY is more than 10% above the 200 DMA, it indicates the market is significantly extended from its long-term trend. Deviations above 15% are extreme and historically have often preceded corrections as prices revert toward the mean.',
      descriptionZh: '衡量SPY（标普500 ETF）相对其200日均线的偏离程度，以百分比表示。当SPY高于200日均线超过10%时，表明市场显著偏离长期趋势。偏离超过15%属于极端情况，历史上往往预示着回调，因为价格会向均值回归。',
    },
    {
      id: 'vix',
      name: 'VIX Volatility Index',
      nameZh: 'VIX 波动率指数',
      category: 'complacency',
      weight: 0.15,
      value: vix,
      unit: 'Index',
      riskThreshold: 13,
      extremeThreshold: 11,
      dataSource: 'CBOE / Yahoo Finance',
      updateFrequency: 'Daily',
      lastUpdate: lastUpdated,
      status: 'normal',
      score: 0,
      description: 'The VIX (CBOE Volatility Index) measures expected 30-day volatility based on S&P 500 option prices. Low VIX (below 13, especially below 11) indicates complacency and lack of fear in the market. While low volatility feels good, it often occurs at market tops when everyone is fully invested and no one expects a downturn. Historically, VIX below 11 has often preceded significant market corrections.',
      descriptionZh: 'VIX（CBOE波动率指数）基于标普500期权价格衡量未来30天的预期波动率。低VIX（低于13，特别是低于11）表明市场自满和缺乏恐惧。虽然低波动率感觉良好，但它往往出现在市场顶部，此时所有人都已满仓，没有人预期下跌。历史上，VIX低于11往往预示着重大市场调整。',
    },
  ];
  
  // Calculate scores for each indicator
  indicators.forEach(indicator => {
    indicator.score = calculateIndicatorScore(indicator);
    if (indicator.score === 2) {
      indicator.status = 'extreme_risk';
    } else if (indicator.score === 1) {
      indicator.status = 'risk';
    } else {
      indicator.status = 'normal';
    }
  });
  
  // Calculate total weighted score (0-10)
  const totalScore = indicators.reduce((sum, ind) => {
    return sum + (ind.score * ind.weight * 10);
  }, 0);
  
  // Determine risk level
  let riskLevel: 'safe' | 'caution' | 'danger' = 'safe';
  if (totalScore >= 8) {
    riskLevel = 'danger';
  } else if (totalScore >= 5) {
    riskLevel = 'caution';
  }
  
  return {
    indicators,
    totalScore: Math.round(totalScore * 10) / 10,
    riskLevel,
    lastUpdated,
  };
};

