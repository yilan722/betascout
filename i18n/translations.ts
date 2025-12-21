export type Language = 'en' | 'zh';

export interface Translations {
  // Common
  common: {
    loading: string;
    error: string;
    retry: string;
    close: string;
    today: string;
    daysAgo: string;
    dayAgo: string;
  };

  // Navigation
  nav: {
    charts: string;
    watchPanel: string;
    daily: string;
    weekly: string;
    allMarkets: string;
  };

  // Categories
  categories: {
    all: string;
    usStocks: string;
    cnAShares: string;
    hkStocks: string;
    crypto: string;
    commodities: string;
    forex: string;
  };

  // Asset Card
  assetCard: {
    price: string;
    change24h: string;
  };

  // Charts
  charts: {
    priceAction: string;
    indicator1Status: string;
    indicator2Title: string;
    rsi: string;
    ema20: string;
    atr: string;
    upperBand: string;
    lowerBand: string;
    score: string;
    oversold: string;
    overbought: string;
    neutral: string;
    bottom: string;
    top: string;
    range: string;
    target: string;
  };

  // Signals
  signals: {
    strongBuy: string;
    buy: string;
    sell: string;
    overbought: string;
    potentialEntry: string;
    strongBottomDetected: string;
    newZone: string;
    imminentBreakout: string;
    breakoutUp: string;
    breakoutDown: string;
  };

  // Watch Panel
  watchPanel: {
    title: string;
    oneWeek: string;
    oneMonth: string;
    threeMonths: string;
    showingSignals: string;
    total: string;
    noSignals: string;
    signalDate: string;
    indicator1: string;
    indicator2: string;
    indicator3: string;
  };

  // Data Source
  dataSource: {
    title: string;
    klineData: string;
    indicator1: string;
    indicator2: string;
    indicator3: string;
    dataPoints: string;
  };

  // Instructions
  instructions: {
    title: string;
    indicator1Oversold: string;
    indicator2Bottom: string;
    strongBottom: string;
    indicator3NewZone: string;
    indicator3Imminent: string;
    indicator3Breakout: string;
    disclaimer: string;
  };

  // Status
  status: {
    loadingMarketData: string;
    noAssetsLoaded: string;
    selectAsset: string;
    loadingRealData: string;
    dataLoadingFailed: string;
    checkConnection: string;
  };

  // Binance Status
  binance: {
    testing: string;
    available: string;
    unavailable: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
      close: 'Close',
      today: 'Today',
      daysAgo: 'days ago',
      dayAgo: '1 day ago',
    },
    nav: {
      charts: 'Charts',
      watchPanel: 'Watch Panel',
      daily: 'Daily',
      weekly: 'Weekly',
      allMarkets: 'All Mkts',
    },
    categories: {
      all: 'ALL',
      usStocks: 'US Stocks',
      cnAShares: 'China A-Shares',
      hkStocks: 'HK Stocks',
      crypto: 'Crypto',
      commodities: 'Commodities',
      forex: 'Forex',
    },
    assetCard: {
      price: 'Price',
      change24h: '24h Change',
    },
    charts: {
      priceAction: 'Price Action & Signals (K-Line)',
      indicator1Status: 'Indicator 1 Status (RSI/Band Logic)',
      indicator2Title: 'Aggregated Scores (Alpha Extract)',
      rsi: 'RSI',
      ema20: 'EMA20',
      atr: 'ATR',
      upperBand: 'Upper Band',
      lowerBand: 'Lower Band',
      score: 'Score',
      oversold: 'OVERSOLD',
      overbought: 'OVERBOUGHT',
      neutral: 'NEUTRAL',
      bottom: 'BOTTOM',
      top: 'TOP',
      range: 'RANGE',
      target: 'Target',
    },
    signals: {
      strongBuy: 'STRONG BOTTOM DETECTED',
      buy: 'POTENTIAL ENTRY',
      sell: 'SELL',
      overbought: 'OVERBOUGHT',
      potentialEntry: 'POTENTIAL ENTRY',
      strongBottomDetected: 'STRONG BOTTOM DETECTED',
      newZone: 'NEW ZONE FORMED',
      imminentBreakout: 'IMMINENT BREAKOUT',
      breakoutUp: 'BULLISH BREAKOUT',
      breakoutDown: 'BEARISH BREAKOUT',
    },
    watchPanel: {
      title: 'Signal Watch Panel',
      oneWeek: '1 Week',
      oneMonth: '1 Month',
      threeMonths: '3 Months',
      showingSignals: 'Showing signals from the last',
      total: 'total',
      noSignals: 'No signals found in the selected period',
      signalDate: 'Signal Date',
      indicator1: 'Indicator 1',
      indicator2: 'Indicator 2',
      indicator3: 'Indicator 3',
    },
    dataSource: {
      title: 'Data Source & Calculation:',
      klineData: 'K-Line Data:',
      indicator1: 'Indicator 1 (RSI/EMA/ATR):',
      indicator2: 'Indicator 2 (Alpha Extract):',
      indicator3: 'Indicator 3 (Energy Reactor):',
      dataPoints: 'Data Points:',
    },
    instructions: {
      title: 'How to read signals:',
      indicator1Oversold: 'Indicator 1 (Oversold):',
      indicator2Bottom: 'Indicator 2 (Bottom):',
      strongBottom: 'STRONG BOTTOM:',
      indicator3NewZone: 'Indicator 3 (New Zone):',
      indicator3Imminent: 'Indicator 3 (Imminent Breakout):',
      indicator3Breakout: 'Indicator 3 (Breakout):',
      disclaimer: 'Disclaimer: Market data provided by Yahoo Finance via proxy. Data may be delayed. Not for financial advice or real trading.',
    },
    status: {
      loadingMarketData: 'Loading market data...',
      noAssetsLoaded: 'No assets loaded',
      selectAsset: 'Select an asset to view analysis',
      loadingRealData: 'Loading real market data...',
      dataLoadingFailed: '⚠️ Data Loading Failed',
      checkConnection: 'The app is trying to fetch real market data. If this persists, please check your internet connection or try again later.',
    },
    binance: {
      testing: 'Testing Binance API connection...',
      available: 'Binance API is available',
      unavailable: 'Binance API unavailable',
    },
  },
  zh: {
    common: {
      loading: '加载中...',
      error: '错误',
      retry: '重试',
      close: '关闭',
      today: '今天',
      daysAgo: '天前',
      dayAgo: '1天前',
    },
    nav: {
      charts: '图表',
      watchPanel: '观察面板',
      daily: '日线',
      weekly: '周线',
      allMarkets: '全部市场',
    },
    categories: {
      all: '全部',
      usStocks: '美股',
      cnAShares: 'A股',
      hkStocks: '港股',
      crypto: '加密货币',
      commodities: '大宗商品',
      forex: '外汇',
    },
    assetCard: {
      price: '价格',
      change24h: '24小时涨跌',
    },
    charts: {
      priceAction: '价格走势与信号 (K线图)',
      indicator1Status: '指标1状态 (RSI/通道逻辑)',
      indicator2Title: '综合评分 (Alpha提取)',
      rsi: 'RSI',
      ema20: 'EMA20',
      atr: 'ATR',
      upperBand: '上轨',
      lowerBand: '下轨',
      score: '评分',
      oversold: '超卖',
      overbought: '超买',
      neutral: '中性',
      bottom: '底部',
      top: '顶部',
      range: '区间',
      target: '目标',
    },
    signals: {
      strongBuy: '检测到强烈底部',
      buy: '潜在买入点',
      sell: '卖出',
      overbought: '超买',
      potentialEntry: '潜在买入点',
      strongBottomDetected: '检测到强烈底部',
      newZone: '新区间形成',
      imminentBreakout: '即将突破',
      breakoutUp: '看涨突破',
      breakoutDown: '看跌突破',
    },
    watchPanel: {
      title: '信号观察面板',
      oneWeek: '1周',
      oneMonth: '1个月',
      threeMonths: '3个月',
      showingSignals: '显示最近',
      total: '条信号',
      noSignals: '所选时间段内未找到信号',
      signalDate: '信号日期',
      indicator1: '指标1',
      indicator2: '指标2',
      indicator3: '指标3',
    },
    dataSource: {
      title: '数据来源与计算:',
      klineData: 'K线数据:',
      indicator1: '指标1 (RSI/EMA/ATR):',
      indicator2: '指标2 (Alpha提取):',
      indicator3: '指标3 (能量反应堆):',
      dataPoints: '数据点:',
    },
    instructions: {
      title: '如何解读信号:',
      indicator1Oversold: '指标1 (超卖):',
      indicator2Bottom: '指标2 (底部):',
      strongBottom: '强烈底部:',
      indicator3NewZone: '指标3 (新区间):',
      indicator3Imminent: '指标3 (即将突破):',
      indicator3Breakout: '指标3 (突破):',
      disclaimer: '免责声明: 市场数据由Yahoo Finance通过代理提供。数据可能有延迟。不构成财务建议或实际交易建议。',
    },
    status: {
      loadingMarketData: '加载市场数据...',
      noAssetsLoaded: '未加载资产',
      selectAsset: '选择资产以查看分析',
      loadingRealData: '加载真实市场数据...',
      dataLoadingFailed: '⚠️ 数据加载失败',
      checkConnection: '应用正在尝试获取真实市场数据。如果持续失败，请检查您的网络连接或稍后重试。',
    },
    binance: {
      testing: '测试币安API连接...',
      available: '币安API可用',
      unavailable: '币安API不可用',
    },
  },
};

