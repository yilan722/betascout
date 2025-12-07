import { Asset, AssetCategory, Candle, IndicatorData } from '../types';
import { calculateEMA, calculateRSI, calculateATR, avg, stdDev, calculateSMA, calculateRollingStdDev, sum } from '../utils/math';
import { fetchCandles } from './api';

// --- Configuration ---

export const ASSETS_CONFIG: (Omit<Asset, 'price' | 'change24h'> & { yahooSymbol: string; industry?: string; marketCap?: string })[] = [
  // US Stocks - 各板块龙头
  { id: 'NVDA', symbol: 'NVDA', name: 'NVIDIA', category: AssetCategory.US_STOCKS, yahooSymbol: 'NVDA', industry: '半导体/科技', marketCap: '大市值' },
  { id: 'TSLA', symbol: 'TSLA', name: 'Tesla', category: AssetCategory.US_STOCKS, yahooSymbol: 'TSLA', industry: '新能源汽车', marketCap: '大市值' },
  { id: 'AAPL', symbol: 'AAPL', name: 'Apple', category: AssetCategory.US_STOCKS, yahooSymbol: 'AAPL', industry: '消费电子/科技', marketCap: '大市值' },
  { id: 'MSFT', symbol: 'MSFT', name: 'Microsoft', category: AssetCategory.US_STOCKS, yahooSymbol: 'MSFT', industry: '软件/科技', marketCap: '大市值' },
  { id: 'AMZN', symbol: 'AMZN', name: 'Amazon', category: AssetCategory.US_STOCKS, yahooSymbol: 'AMZN', industry: '电商/科技', marketCap: '大市值' },
  { id: 'GOOGL', symbol: 'GOOGL', name: 'Alphabet', category: AssetCategory.US_STOCKS, yahooSymbol: 'GOOGL', industry: '互联网/科技', marketCap: '大市值' },
  { id: 'META', symbol: 'META', name: 'Meta', category: AssetCategory.US_STOCKS, yahooSymbol: 'META', industry: '社交媒体/科技', marketCap: '大市值' },
  { id: 'JPM', symbol: 'JPM', name: 'JPMorgan Chase', category: AssetCategory.US_STOCKS, yahooSymbol: 'JPM', industry: '银行/金融', marketCap: '大市值' },
  { id: 'BAC', symbol: 'BAC', name: 'Bank of America', category: AssetCategory.US_STOCKS, yahooSymbol: 'BAC', industry: '银行/金融', marketCap: '大市值' },
  { id: 'GS', symbol: 'GS', name: 'Goldman Sachs', category: AssetCategory.US_STOCKS, yahooSymbol: 'GS', industry: '投资银行/金融', marketCap: '大市值' },
  { id: 'XOM', symbol: 'XOM', name: 'Exxon Mobil', category: AssetCategory.US_STOCKS, yahooSymbol: 'XOM', industry: '能源/石油', marketCap: '大市值' },
  { id: 'CVX', symbol: 'CVX', name: 'Chevron', category: AssetCategory.US_STOCKS, yahooSymbol: 'CVX', industry: '能源/石油', marketCap: '大市值' },
  { id: 'JNJ', symbol: 'JNJ', name: 'Johnson & Johnson', category: AssetCategory.US_STOCKS, yahooSymbol: 'JNJ', industry: '医药/医疗', marketCap: '大市值' },
  { id: 'UNH', symbol: 'UNH', name: 'UnitedHealth', category: AssetCategory.US_STOCKS, yahooSymbol: 'UNH', industry: '医疗保险', marketCap: '大市值' },
  { id: 'WMT', symbol: 'WMT', name: 'Walmart', category: AssetCategory.US_STOCKS, yahooSymbol: 'WMT', industry: '零售/消费', marketCap: '大市值' },
  { id: 'MCD', symbol: 'MCD', name: 'McDonald\'s', category: AssetCategory.US_STOCKS, yahooSymbol: 'MCD', industry: '餐饮/消费', marketCap: '大市值' },
  { id: 'KO', symbol: 'KO', name: 'Coca-Cola', category: AssetCategory.US_STOCKS, yahooSymbol: 'KO', industry: '饮料/消费', marketCap: '大市值' },
  { id: 'BA', symbol: 'BA', name: 'Boeing', category: AssetCategory.US_STOCKS, yahooSymbol: 'BA', industry: '航空/工业', marketCap: '大市值' },
  { id: 'CAT', symbol: 'CAT', name: 'Caterpillar', category: AssetCategory.US_STOCKS, yahooSymbol: 'CAT', industry: '工业设备', marketCap: '大市值' },
  { id: 'NFLX', symbol: 'NFLX', name: 'Netflix', category: AssetCategory.US_STOCKS, yahooSymbol: 'NFLX', industry: '流媒体/科技', marketCap: '大市值' },
  
  // China A-Shares - 各板块龙头 (包含44个全球第一的标的)
  // 第一张图片中的标的
  { id: '300750', symbol: '300750', name: 'CATL (Ningde)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300750.SZ', industry: '锂电池', marketCap: '大市值' },
  { id: '002812', symbol: '002812', name: '恩捷股份 (Enjie)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002812.SZ', industry: '锂电池', marketCap: '大市值' },
  { id: '688363', symbol: '688363', name: '华熙生物 (Huaxi Bio)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688363.SS', industry: '医美', marketCap: '中市值' },
  { id: '002019', symbol: '002019', name: '亿帆医药 (Yifan Pharma)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002019.SZ', industry: '合成生物学', marketCap: '中市值' },
  { id: '002714', symbol: '002714', name: '牧原股份 (Muyuan)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002714.SZ', industry: '农业/猪周期', marketCap: '大市值' },
  { id: '002475', symbol: '002475', name: '立讯精密 (Luxshare)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002475.SZ', industry: '消费电子', marketCap: '大市值' },
  { id: '603288', symbol: '603288', name: '海天味业 (Haitian)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603288.SS', industry: '调味品', marketCap: '大市值' },
  { id: '002938', symbol: '002938', name: '鹏鼎控股 (Zhen Ding)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002938.SZ', industry: '消费电子', marketCap: '大市值' },
  { id: '002340', symbol: '002340', name: '格林美 (GEM)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002340.SZ', industry: '锂电固废/环保', marketCap: '中市值' },
  { id: '600888', symbol: '600888', name: '新疆众和 (Xinjiang Joinworld)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600888.SS', industry: '工业铝/有色金属', marketCap: '中市值' },
  { id: '000629', symbol: '000629', name: '钒钛股份 (Pangang)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000629.SZ', industry: '小金属', marketCap: '中市值' },
  { id: '600111', symbol: '600111', name: '北方稀土 (Northern Rare Earth)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600111.SS', industry: '稀土', marketCap: '大市值' },
  
  // 第二张图片中的标的
  { id: '600010', symbol: '600010', name: '包钢股份 (Baogang)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600010.SS', industry: '稀土/钢铁', marketCap: '大市值' },
  { id: '603993', symbol: '603993', name: '洛阳钼业 (CMOC)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603993.SS', industry: '能源金属/有色金属', marketCap: '大市值' },
  { id: '601138', symbol: '601138', name: '工业富联 (Foxconn Industrial)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601138.SS', industry: 'AI服务器/消费电子', marketCap: '大市值' },
  { id: '000977', symbol: '000977', name: '浪潮信息 (Inspur)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000977.SZ', industry: '服务器/计算机', marketCap: '大市值' },
  { id: '000651', symbol: '000651', name: '格力电器 (Gree)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000651.SZ', industry: '家电', marketCap: '大市值' },
  { id: '002415', symbol: '002415', name: '海康威视 (Hikvision)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002415.SZ', industry: '安防', marketCap: '大市值' },
  { id: '600066', symbol: '600066', name: '宇通客车 (Yutong)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600066.SS', industry: '汽车/高股息', marketCap: '中市值' },
  { id: '600309', symbol: '600309', name: '万华化学 (Wanhua)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600309.SS', industry: '化工/周期', marketCap: '大市值' },
  { id: '000703', symbol: '000703', name: '恒逸石化 (Hengyi)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000703.SZ', industry: '化工/周期', marketCap: '中市值' },
  { id: '600328', symbol: '600328', name: '中盐化工 (China Salt)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600328.SS', industry: '小金属/化工', marketCap: '中市值' },
  { id: '000063', symbol: '000063', name: '中兴通讯 (ZTE)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000063.SZ', industry: '通讯设备', marketCap: '大市值' },
  { id: '000009', symbol: '000009', name: '中国宝安 (China Baoan)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000009.SZ', industry: '锂电池/房地产', marketCap: '中市值' },
  { id: '300274', symbol: '300274', name: '阳光电源 (Sungrow)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300274.SZ', industry: '光伏', marketCap: '大市值' },
  { id: '603019', symbol: '603019', name: '中科曙光 (Sugon)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603019.SS', industry: '超算/计算机', marketCap: '大市值' },
  { id: '600436', symbol: '600436', name: '片仔癀 (Pien Tze Huang)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600436.SS', industry: '中药', marketCap: '大市值' },
  
  // 第三张图片中的标的
  { id: '002064', symbol: '002064', name: '华峰化学 (Huafeng)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002064.SZ', industry: '化工', marketCap: '中市值' },
  { id: '603806', symbol: '603806', name: '福斯特 (Foster)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603806.SS', industry: '光伏', marketCap: '中市值' },
  { id: '300628', symbol: '300628', name: '亿联网络 (Yealink)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300628.SZ', industry: '通讯设备', marketCap: '中市值' },
  { id: '600486', symbol: '600486', name: '扬农化工 (Yangnong)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600486.SS', industry: '农业/化工', marketCap: '中市值' },
  { id: '002507', symbol: '002507', name: '涪陵榨菜 (Fuling Zhacai)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002507.SZ', industry: '食品', marketCap: '中市值' },
  { id: '603160', symbol: '603160', name: '汇顶科技 (Goodix)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603160.SS', industry: '消费电子', marketCap: '中市值' },
  { id: '600885', symbol: '600885', name: '宏发股份 (Hongfa)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600885.SS', industry: '电力设备', marketCap: '中市值' },
  { id: '603026', symbol: '603026', name: '石大胜华 (Shida Shenghua)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603026.SS', industry: '锂电/化工', marketCap: '中市值' },
  { id: '002050', symbol: '002050', name: '三花智控 (Sanhua)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002050.SZ', industry: '汽车零部件/特斯拉', marketCap: '大市值' },
  { id: '600352', symbol: '600352', name: '浙江龙盛 (Zhejiang Longsheng)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600352.SS', industry: '染料/化工', marketCap: '中市值' },
  { id: '600110', symbol: '600110', name: '诺德股份 (Nord)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600110.SS', industry: '复合铜箔/锂电', marketCap: '中市值' },
  { id: '300207', symbol: '300207', name: '欣旺达 (Sunwoda)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300207.SZ', industry: '消费电子/锂电', marketCap: '中市值' },
  { id: '600438', symbol: '600438', name: '通威股份 (Tongwei)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600438.SS', industry: '光伏', marketCap: '大市值' },
  { id: '001289', symbol: '001289', name: '龙源电力 (Longyuan)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '001289.SZ', industry: '风电', marketCap: '大市值' },
  { id: '603218', symbol: '603218', name: '日月股份 (Riyue)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603218.SS', industry: '风电', marketCap: '中市值' },
  { id: '600900', symbol: '600900', name: '长江电力 (Changjiang Power)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600900.SS', industry: '水电/高股息', marketCap: '大市值' },
  
  // 保留原有的其他重要标的
  { id: '600519', symbol: '600519', name: 'Kweichow Moutai', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600519.SS', industry: '白酒', marketCap: '大市值' },
  { id: '300059', symbol: '300059', name: 'East Money', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300059.SZ', industry: '金融科技', marketCap: '大市值' },
  { id: '600036', symbol: '600036', name: 'China Merchants Bank', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600036.SS', industry: '银行', marketCap: '大市值' },
  { id: '601398', symbol: '601398', name: 'ICBC', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601398.SS', industry: '银行', marketCap: '大市值' },
  { id: '601318', symbol: '601318', name: 'Ping An', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601318.SS', industry: '保险', marketCap: '大市值' },
  { id: '600030', symbol: '600030', name: 'CITIC Securities', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600030.SS', industry: '券商', marketCap: '大市值' },
  { id: '000776', symbol: '000776', name: 'GF Securities', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000776.SZ', industry: '券商', marketCap: '中市值' },
  { id: '000002', symbol: '000002', name: 'Vanke', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000002.SZ', industry: '地产', marketCap: '大市值' },
  { id: '000858', symbol: '000858', name: 'Wuliangye', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000858.SZ', industry: '白酒', marketCap: '大市值' },
  { id: '600887', symbol: '600887', name: 'Yili', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600887.SS', industry: '食品', marketCap: '大市值' },
  { id: '000538', symbol: '000538', name: 'Yunnan Baiyao', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000538.SZ', industry: '中药', marketCap: '大市值' },
  { id: '300015', symbol: '300015', name: 'Aier Eye', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300015.SZ', industry: '医疗', marketCap: '大市值' },
  { id: '002594', symbol: '002594', name: 'BYD', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002594.SZ', industry: '新能源汽车', marketCap: '大市值' },
  { id: '300014', symbol: '300014', name: 'EVE Energy', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300014.SZ', industry: '锂电池', marketCap: '中市值' },
  { id: '600000', symbol: '600000', name: 'Pudong Development Bank', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600000.SS', industry: '银行', marketCap: '大市值' },
  { id: '000001', symbol: '000001', name: 'Ping An Bank', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000001.SZ', industry: '银行', marketCap: '大市值' },
  
  // HK Stocks - 各板块龙头，包括9880.hk
  { id: '00700', symbol: '00700', name: 'Tencent', category: AssetCategory.HK_STOCKS, yahooSymbol: '0700.HK', industry: '互联网/科技', marketCap: '大市值' },
  { id: '09988', symbol: '09988', name: 'Alibaba', category: AssetCategory.HK_STOCKS, yahooSymbol: '9988.HK', industry: '电商/科技', marketCap: '大市值' },
  { id: '03690', symbol: '03690', name: 'Meituan', category: AssetCategory.HK_STOCKS, yahooSymbol: '3690.HK', industry: '本地生活/科技', marketCap: '大市值' },
  { id: '09880', symbol: '09880', name: 'UBTech', category: AssetCategory.HK_STOCKS, yahooSymbol: '9880.HK', industry: '机器人/科技', marketCap: '中市值' },
  { id: '01398', symbol: '01398', name: 'ICBC', category: AssetCategory.HK_STOCKS, yahooSymbol: '1398.HK', industry: '银行/金融', marketCap: '大市值' },
  { id: '03988', symbol: '03988', name: 'Bank of China', category: AssetCategory.HK_STOCKS, yahooSymbol: '3988.HK', industry: '银行/金融', marketCap: '大市值' },
  { id: '01299', symbol: '01299', name: 'AIA', category: AssetCategory.HK_STOCKS, yahooSymbol: '1299.HK', industry: '保险/金融', marketCap: '大市值' },
  { id: '02318', symbol: '02318', name: 'Ping An', category: AssetCategory.HK_STOCKS, yahooSymbol: '2318.HK', industry: '保险/金融', marketCap: '大市值' },
  { id: '02628', symbol: '02628', name: 'China Life', category: AssetCategory.HK_STOCKS, yahooSymbol: '2628.HK', industry: '保险/金融', marketCap: '大市值' },
  { id: '01109', symbol: '01109', name: 'China Resources Land', category: AssetCategory.HK_STOCKS, yahooSymbol: '1109.HK', industry: '地产', marketCap: '大市值' },
  { id: '02020', symbol: '02020', name: 'Ant Group', category: AssetCategory.HK_STOCKS, yahooSymbol: '2020.HK', industry: '金融科技', marketCap: '大市值' },
  { id: '00388', symbol: '00388', name: 'HKEX', category: AssetCategory.HK_STOCKS, yahooSymbol: '0388.HK', industry: '交易所/金融', marketCap: '大市值' },
  { id: '00270', symbol: '00270', name: 'Guangzhou R&F', category: AssetCategory.HK_STOCKS, yahooSymbol: '0270.HK', industry: '地产', marketCap: '中市值' },
  { id: '00857', symbol: '00857', name: 'PetroChina', category: AssetCategory.HK_STOCKS, yahooSymbol: '0857.HK', industry: '能源/石油', marketCap: '大市值' },
  { id: '00386', symbol: '00386', name: 'Sinopec', category: AssetCategory.HK_STOCKS, yahooSymbol: '0386.HK', industry: '能源/石油', marketCap: '大市值' },
  { id: '01093', symbol: '01093', name: 'CSPC Pharma', category: AssetCategory.HK_STOCKS, yahooSymbol: '1093.HK', industry: '医药', marketCap: '中市值' },
  { id: '02269', symbol: '02269', name: 'WuXi Biologics', category: AssetCategory.HK_STOCKS, yahooSymbol: '2269.HK', industry: '医药/生物科技', marketCap: '大市值' },
  { id: '01810', symbol: '01810', name: 'Xiaomi', category: AssetCategory.HK_STOCKS, yahooSymbol: '1810.HK', industry: '消费电子/科技', marketCap: '大市值' },
  { id: '00941', symbol: '00941', name: 'China Mobile', category: AssetCategory.HK_STOCKS, yahooSymbol: '0941.HK', industry: '电信/通信', marketCap: '大市值' },
  { id: '01024', symbol: '01024', name: 'Kuaishou', category: AssetCategory.HK_STOCKS, yahooSymbol: '1024.HK', industry: '短视频/科技', marketCap: '大市值' },

  // Crypto - 按成交量排名
  { id: 'BTC', symbol: 'BTC', name: 'Bitcoin', category: AssetCategory.CRYPTO, yahooSymbol: 'BTC-USD' },
  { id: 'ETH', symbol: 'ETH', name: 'Ethereum', category: AssetCategory.CRYPTO, yahooSymbol: 'ETH-USD' },
  { id: 'SOL', symbol: 'SOL', name: 'Solana', category: AssetCategory.CRYPTO, yahooSymbol: 'SOL-USD' },
  { id: 'PEPE', symbol: 'PEPE', name: 'Pepe', category: AssetCategory.CRYPTO, yahooSymbol: 'PEPE-USD' },
  { id: 'BNB', symbol: 'BNB', name: 'BNB', category: AssetCategory.CRYPTO, yahooSymbol: 'BNB-USD' },
  { id: 'XRP', symbol: 'XRP', name: 'XRP', category: AssetCategory.CRYPTO, yahooSymbol: 'XRP-USD' },
  { id: 'USDT', symbol: 'USDT', name: 'Tether', category: AssetCategory.CRYPTO, yahooSymbol: 'USDT-USD' },
  { id: 'DOGE', symbol: 'DOGE', name: 'Dogecoin', category: AssetCategory.CRYPTO, yahooSymbol: 'DOGE-USD' },
  { id: 'ADA', symbol: 'ADA', name: 'Cardano', category: AssetCategory.CRYPTO, yahooSymbol: 'ADA-USD' },
  { id: 'TRX', symbol: 'TRX', name: 'TRON', category: AssetCategory.CRYPTO, yahooSymbol: 'TRX-USD' },
  { id: 'AVAX', symbol: 'AVAX', name: 'Avalanche', category: AssetCategory.CRYPTO, yahooSymbol: 'AVAX-USD' },
  { id: 'MATIC', symbol: 'MATIC', name: 'Polygon', category: AssetCategory.CRYPTO, yahooSymbol: 'MATIC-USD' },
  { id: 'DOT', symbol: 'DOT', name: 'Polkadot', category: AssetCategory.CRYPTO, yahooSymbol: 'DOT-USD' },
  { id: 'LINK', symbol: 'LINK', name: 'Chainlink', category: AssetCategory.CRYPTO, yahooSymbol: 'LINK-USD' },
  { id: 'SHIB', symbol: 'SHIB', name: 'Shiba Inu', category: AssetCategory.CRYPTO, yahooSymbol: 'SHIB-USD' },
  { id: 'LTC', symbol: 'LTC', name: 'Litecoin', category: AssetCategory.CRYPTO, yahooSymbol: 'LTC-USD' },
  { id: 'BCH', symbol: 'BCH', name: 'Bitcoin Cash', category: AssetCategory.CRYPTO, yahooSymbol: 'BCH-USD' },
  { id: 'UNI', symbol: 'UNI', name: 'Uniswap', category: AssetCategory.CRYPTO, yahooSymbol: 'UNI-USD' },
  { id: 'ATOM', symbol: 'ATOM', name: 'Cosmos', category: AssetCategory.CRYPTO, yahooSymbol: 'ATOM-USD' },
  
  // Commodities - 按成交量排名
  { id: 'GOLD', symbol: 'XAU', name: 'Gold', category: AssetCategory.COMMODITIES, yahooSymbol: 'GC=F' },
  { id: 'OIL', symbol: 'WTI', name: 'Crude Oil', category: AssetCategory.COMMODITIES, yahooSymbol: 'CL=F' },
  { id: 'SILVER', symbol: 'XAG', name: 'Silver', category: AssetCategory.COMMODITIES, yahooSymbol: 'SI=F' },
  { id: 'COPPER', symbol: 'HG', name: 'Copper', category: AssetCategory.COMMODITIES, yahooSymbol: 'HG=F' },
  { id: 'NATGAS', symbol: 'NG', name: 'Natural Gas', category: AssetCategory.COMMODITIES, yahooSymbol: 'NG=F' },
  { id: 'WHEAT', symbol: 'ZW', name: 'Wheat', category: AssetCategory.COMMODITIES, yahooSymbol: 'ZW=F' },
  { id: 'CORN', symbol: 'ZC', name: 'Corn', category: AssetCategory.COMMODITIES, yahooSymbol: 'ZC=F' },
  { id: 'SOYBEAN', symbol: 'ZS', name: 'Soybean', category: AssetCategory.COMMODITIES, yahooSymbol: 'ZS=F' },
  { id: 'SUGAR', symbol: 'SB', name: 'Sugar', category: AssetCategory.COMMODITIES, yahooSymbol: 'SB=F' },
  { id: 'COFFEE', symbol: 'KC', name: 'Coffee', category: AssetCategory.COMMODITIES, yahooSymbol: 'KC=F' },
  { id: 'COTTON', symbol: 'CT', name: 'Cotton', category: AssetCategory.COMMODITIES, yahooSymbol: 'CT=F' },
  { id: 'PLATINUM', symbol: 'PL', name: 'Platinum', category: AssetCategory.COMMODITIES, yahooSymbol: 'PL=F' },
  { id: 'PALLADIUM', symbol: 'PA', name: 'Palladium', category: AssetCategory.COMMODITIES, yahooSymbol: 'PA=F' },
  { id: 'BRENT', symbol: 'BZ', name: 'Brent Crude', category: AssetCategory.COMMODITIES, yahooSymbol: 'BZ=F' },
  { id: 'HEATINGOIL', symbol: 'HO', name: 'Heating Oil', category: AssetCategory.COMMODITIES, yahooSymbol: 'HO=F' },
  
  // Forex - 按成交量排名
  { id: 'EURUSD', symbol: 'EUR/USD', name: 'Euro', category: AssetCategory.FOREX, yahooSymbol: 'EURUSD=X' },
  { id: 'USDJPY', symbol: 'USD/JPY', name: 'Yen', category: AssetCategory.FOREX, yahooSymbol: 'USDJPY=X' },
  { id: 'GBPUSD', symbol: 'GBP/USD', name: 'British Pound', category: AssetCategory.FOREX, yahooSymbol: 'GBPUSD=X' },
  { id: 'USDCHF', symbol: 'USD/CHF', name: 'Swiss Franc', category: AssetCategory.FOREX, yahooSymbol: 'USDCHF=X' },
  { id: 'AUDUSD', symbol: 'AUD/USD', name: 'Australian Dollar', category: AssetCategory.FOREX, yahooSymbol: 'AUDUSD=X' },
  { id: 'USDCAD', symbol: 'USD/CAD', name: 'Canadian Dollar', category: AssetCategory.FOREX, yahooSymbol: 'USDCAD=X' },
  { id: 'NZDUSD', symbol: 'NZD/USD', name: 'New Zealand Dollar', category: AssetCategory.FOREX, yahooSymbol: 'NZDUSD=X' },
  { id: 'EURGBP', symbol: 'EUR/GBP', name: 'Euro/Pound', category: AssetCategory.FOREX, yahooSymbol: 'EURGBP=X' },
  { id: 'EURJPY', symbol: 'EUR/JPY', name: 'Euro/Yen', category: AssetCategory.FOREX, yahooSymbol: 'EURJPY=X' },
  { id: 'GBPJPY', symbol: 'GBP/JPY', name: 'Pound/Yen', category: AssetCategory.FOREX, yahooSymbol: 'GBPJPY=X' },
  { id: 'USDCNH', symbol: 'USD/CNH', name: 'Chinese Yuan', category: AssetCategory.FOREX, yahooSymbol: 'USDCNH=X' },
  { id: 'EURCHF', symbol: 'EUR/CHF', name: 'Euro/Franc', category: AssetCategory.FOREX, yahooSymbol: 'EURCHF=X' },
  { id: 'AUDJPY', symbol: 'AUD/JPY', name: 'Aussie/Yen', category: AssetCategory.FOREX, yahooSymbol: 'AUDJPY=X' },
  { id: 'EURCAD', symbol: 'EUR/CAD', name: 'Euro/Loonie', category: AssetCategory.FOREX, yahooSymbol: 'EURCAD=X' },
  { id: 'GBPCHF', symbol: 'GBP/CHF', name: 'Pound/Franc', category: AssetCategory.FOREX, yahooSymbol: 'GBPCHF=X' },
  { id: 'USDSGD', symbol: 'USD/SGD', name: 'Singapore Dollar', category: AssetCategory.FOREX, yahooSymbol: 'USDSGD=X' },
  { id: 'USDHKD', symbol: 'USD/HKD', name: 'Hong Kong Dollar', category: AssetCategory.FOREX, yahooSymbol: 'USDHKD=X' },
  { id: 'USDKRW', symbol: 'USD/KRW', name: 'Korean Won', category: AssetCategory.FOREX, yahooSymbol: 'USDKRW=X' },
  { id: 'USDMXN', symbol: 'USD/MXN', name: 'Mexican Peso', category: AssetCategory.FOREX, yahooSymbol: 'USDMXN=X' },
];

// --- Mock Data Generator (Fallback) ---

const generateRandomWalk = (startPrice: number, vol: number, steps: number): Candle[] => {
  const candles: Candle[] = [];
  let currentPrice = startPrice;
  const now = new Date();

  // Generate historical data going back 'steps' days
  for (let i = 0; i < steps; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (steps - i));
    
    // Random movement
    const change = (Math.random() - 0.5) * vol * currentPrice;
    const close = currentPrice + change;
    const high = Math.max(currentPrice, close) + Math.random() * vol * currentPrice * 0.5;
    const low = Math.min(currentPrice, close) - Math.random() * vol * currentPrice * 0.5;
    const open = currentPrice;
    
    // Ensure no negative prices
    const safeClose = Math.max(0.01, close);
    const safeHigh = Math.max(safeClose, high);
    const safeLow = Math.max(0.001, low);

    candles.push({
      time: date.toISOString().split('T')[0],
      open: Math.max(0.01, open),
      high: safeHigh,
      low: safeLow,
      close: safeClose,
      volume: Math.floor(Math.random() * 1000000),
    });
    currentPrice = safeClose;
  }
  return candles;
};

// --- Analysis Engine ---

export const analyzeAsset = async (assetId: string, timeframe: '1D' | '1W' = '1D'): Promise<{ candles: Candle[], indicators: IndicatorData[] }> => {
  const config = ASSETS_CONFIG.find(a => a.id === assetId);
  if (!config) throw new Error('Asset not found');

  // Fetch real data directly from API with the requested timeframe
  const candles = await fetchCandles(config.yahooSymbol, timeframe);
  
  if (!candles || candles.length === 0) {
    throw new Error(`No data available for ${config.yahooSymbol}. Please check your internet connection or try again later.`);
  }

  // Ensure data is sorted chronologically (oldest to newest)
  candles.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  // Verify data integrity
  const firstDate = new Date(candles[0]?.time);
  const lastDate = new Date(candles[candles.length - 1]?.time);
  const firstPrice = candles[0]?.close;
  const lastPrice = candles[candles.length - 1]?.close;
  
  // Check for data anomalies
  const priceChanges = candles.slice(1).map((c, i) => {
    const prevClose = candles[i]?.close;
    return prevClose > 0 ? ((c.close - prevClose) / prevClose) * 100 : 0;
  });
  const avgChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
  
  console.log(`📊 Calculating indicators for ${config.yahooSymbol} using ${candles.length} ${timeframe === '1W' ? 'weekly' : 'daily'} data points (directly from API)`);
  console.log(`   📅 Data range: ${candles[0]?.time} ($${firstPrice?.toFixed(2)}) to ${candles[candles.length - 1]?.time} ($${lastPrice?.toFixed(2)})`);
  console.log(`   💰 Price change: ${((lastPrice - firstPrice) / firstPrice * 100).toFixed(2)}% over period`);
  console.log(`   📈 Average daily change: ${avgChange.toFixed(2)}%`);
  
  // Warn if data seems suspicious
  if (isNaN(firstDate.getTime()) || isNaN(lastDate.getTime())) {
    console.error(`   ❌ Invalid date range detected!`);
  }
  if (lastDate < firstDate) {
    console.error(`   ❌ Data is in reverse chronological order!`);
  }

  // Validate minimum data points for indicators
  const minDataPoints = timeframe === '1W' ? 50 : 200; // Weekly needs less, daily needs more
  if (candles.length < minDataPoints) {
    console.warn(`⚠️ Warning: Only ${candles.length} data points available, indicators may be incomplete. Recommended: ${minDataPoints}+ points.`);
  }

  // Extract price arrays and validate
  const closes = candles.map(c => {
    const close = c.close;
    if (isNaN(close) || close <= 0) {
      console.warn(`   ⚠️ Invalid close price: ${close} at ${c.time}`);
    }
    return close;
  });
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  // Log sample prices for verification (first, middle, last)
  if (candles.length >= 3) {
    const midIndex = Math.floor(candles.length / 2);
    console.log(`   🔍 Sample prices: Start=$${closes[0]?.toFixed(2)}, Mid=$${closes[midIndex]?.toFixed(2)}, End=$${closes[closes.length - 1]?.toFixed(2)}`);
  }

  // 2. Calculate Indicators from REAL price data
  
  // --- Indicator 1: RSI + ATR + BB (Standard) ---
  // All calculations are based on REAL market data (OHLC prices from API)
  console.log(`   Calculating Indicator 1 (RSI + EMA20 + ATR) from real price data...`);
  
  // Validate price data before calculation
  const validCloses = closes.filter((c, i) => {
    if (isNaN(c) || c <= 0) {
      console.warn(`   ⚠️ Invalid close price at index ${i}: ${c}`);
      return false;
    }
    return true;
  });
  
  if (validCloses.length < 15) {
    console.error(`   ❌ Not enough valid price data: ${validCloses.length} points (need at least 15)`);
    throw new Error('Insufficient price data for RSI calculation');
  }
  
  const rsi = calculateRSI(closes, 14);
  const ema20 = calculateEMA(closes, 20);
  const atr = calculateATR(highs, lows, closes, 14);
  
  // Validate RSI results
  const validRsi = rsi.filter(r => !isNaN(r) && r >= 0 && r <= 100);
  const rsiStats = {
    min: validRsi.length > 0 ? Math.min(...validRsi) : NaN,
    max: validRsi.length > 0 ? Math.max(...validRsi) : NaN,
    avg: validRsi.length > 0 ? validRsi.reduce((a, b) => a + b, 0) / validRsi.length : NaN,
  };
  
  const latestRsi = rsi[rsi.length - 1];
  const latestEma = ema20[ema20.length - 1];
  const latestAtr = atr[atr.length - 1];
  
  console.log(`   ✅ Indicator 1 calculated: RSI=${latestRsi?.toFixed(1)}, EMA20=${latestEma?.toFixed(2)}, ATR=${latestAtr?.toFixed(2)}`);
  console.log(`   📊 RSI Statistics: Min=${rsiStats.min?.toFixed(1)}, Max=${rsiStats.max?.toFixed(1)}, Avg=${rsiStats.avg?.toFixed(1)}`);
  
  // Warn if RSI seems abnormal
  if (rsiStats.avg > 70) {
    console.warn(`   ⚠️ RSI average is unusually high (${rsiStats.avg.toFixed(1)}), indicating possible data or calculation issue`);
  } else if (rsiStats.avg < 30) {
    console.warn(`   ⚠️ RSI average is unusually low (${rsiStats.avg.toFixed(1)}), indicating possible data or calculation issue`);
  }
  
  // --- Indicator 2: Aggregated Scores Oscillator [Alpha Extract] ---
  // Implementation of the provided Pine Script logic
  // All calculations based on REAL returns from REAL price data
  console.log(`   Calculating Indicator 2 (Omega + Sortino) from real ${timeframe === '1W' ? 'weekly' : 'daily'} returns...`);
  
  // Parameters - adjust based on timeframe
  // For weekly: use smaller period (30 weeks ~= 7.5 months) since we have fewer data points
  // For daily: use original period (150 days ~= 7.5 months)
  const period = timeframe === '1W' ? 30 : 150;
  const targetReturn = 0;
  const rollingWindow = timeframe === '1W' ? 50 : 200;
  const upperMultiplier = 1.75;
  const lowerMultiplier = 1.5;
  const rollingMultiplier = 1.8;
  const upperBandAdjust = 0.90;
  const omegaSma = 5;
  const sortinoSma = 7;

  // Daily Returns
  const dailyReturn: number[] = [];
  for(let i = 0; i < closes.length; i++) {
      if (i === 0) dailyReturn.push(0);
      else dailyReturn.push((closes[i] / closes[i-1]) - 1);
  }

  // Rolling Excess/Deficit Returns
  // Pine Script: math.sum((dailyReturn > targetReturn ? dailyReturn - targetReturn : 0), period)
  const excessReturn: number[] = [];
  const deficitReturn: number[] = [];

  for(let i = 0; i < dailyReturn.length; i++) {
      if (i < period - 1) {
          excessReturn.push(NaN);
          deficitReturn.push(NaN);
          continue;
      }
      let currentExcess = 0;
      let currentDeficit = 0;
      for (let j = i - period + 1; j <= i; j++) {
          const r = dailyReturn[j];
          if (r > targetReturn) currentExcess += (r - targetReturn);
          if (r < targetReturn) currentDeficit += (targetReturn - r);
      }
      excessReturn.push(currentExcess);
      deficitReturn.push(currentDeficit);
  }

  // Omega Ratio
  const omegaRatio = excessReturn.map((exc, i) => {
      const def = deficitReturn[i];
      if (isNaN(exc) || isNaN(def) || def === 0) return NaN;
      return exc / def;
  });

  // Mean Return (Rolling SMA)
  const meanReturn = calculateSMA(dailyReturn, period);

  // Downside Deviation
  const downsideDeviation: number[] = [];
  for(let i = 0; i < dailyReturn.length; i++) {
      if (i < period - 1) {
          downsideDeviation.push(NaN);
          continue;
      }
      let sumSqDownside = 0;
      for (let j = i - period + 1; j <= i; j++) {
          const r = dailyReturn[j];
          const downside = r < targetReturn ? (r - targetReturn) : 0;
          sumSqDownside += (downside * downside);
      }
      downsideDeviation.push(Math.sqrt(sumSqDownside / period));
  }

  // Sortino Ratio
  // Annualization factor: 52 for weekly, 365 for daily
  const annualizationFactor = timeframe === '1W' ? 52 : 365;
  const sortinoRatio = meanReturn.map((mean, i) => {
    const dev = downsideDeviation[i];
    if (isNaN(mean) || isNaN(dev) || dev === 0) return NaN;
    return (mean / dev) * Math.sqrt(annualizationFactor);
  });

  // Smoothed Ratios
  const omegaSmaValue = calculateSMA(omegaRatio.map(v => isNaN(v) ? 0 : v), omegaSma); // Handle NaN for initial bars
  const sortinoSmaValue = calculateSMA(sortinoRatio.map(v => isNaN(v) ? 0 : v), sortinoSma);

  // Aggregated Score
  const aggScores: number[] = [];
  for(let i=0; i<closes.length; i++) {
      const om = omegaSmaValue[i];
      const so = sortinoSmaValue[i];
      if (isNaN(om) || isNaN(so)) aggScores.push(NaN);
      else aggScores.push(om + so);
  }

  // --- Statistical Bands ---

  // Expanding Statistics
  const aggUpperBands: number[] = [];
  const aggLowerBands: number[] = [];
  const adjustedUpperBands: number[] = [];

  let cumulativeSum = 0;
  let cumulativeSquareSum = 0;
  let count = 0;

  // Pre-calculate Rolling Stats
  // We need to handle NaNs in aggScores for rolling calculation
  const validScores = aggScores.map(s => isNaN(s) ? 0 : s); // Treat NaN as 0 for rolling window calc to maintain index alignment or handle strictly
  // Actually, if score is NaN, band is NaN.
  const rollingMeanArr = calculateSMA(validScores, rollingWindow);
  const rollingStdArr = calculateRollingStdDev(validScores, rollingWindow);

  for(let i=0; i<aggScores.length; i++) {
      const score = aggScores[i];
      
      if (isNaN(score)) {
          aggUpperBands.push(NaN);
          aggLowerBands.push(NaN);
          adjustedUpperBands.push(NaN);
          continue;
      }

      // Expanding Stats Update
      cumulativeSum += score;
      cumulativeSquareSum += score * score;
      count += 1;

      const expandingMean = cumulativeSum / count;
      const varianceExpanding = (cumulativeSquareSum / count) - (expandingMean * expandingMean);
      const expandingSTD = Math.sqrt(Math.max(0, varianceExpanding)); // Ensure non-negative

      const expandingUpperBand = expandingMean + (expandingSTD * upperMultiplier);
      const expandingLowerBand = expandingMean - (expandingSTD * lowerMultiplier);

      // Rolling Stats
      const rollingMean = rollingMeanArr[i] || 0;
      const rollingSTD = rollingStdArr[i] || 0;
      
      const rollingUpperBand = rollingMean + (rollingSTD * rollingMultiplier);
      const rollingLowerBand = rollingMean - (rollingSTD * rollingMultiplier);

      // Aggregated Bands
      const aggregatedUpperBand = (expandingUpperBand + rollingUpperBand) / 2;
      const aggregatedLowerBand = (expandingLowerBand + rollingLowerBand) / 2;
      const adjustedUpperBand = aggregatedUpperBand * upperBandAdjust;

      aggUpperBands.push(aggregatedUpperBand);
      aggLowerBands.push(aggregatedLowerBand); // Note: Pine Script uses aggregatedLowerBand for OS check
      adjustedUpperBands.push(adjustedUpperBand);
  }

  const latestScore = aggScores[aggScores.length - 1];
  const latestUpperBand = adjustedUpperBands[adjustedUpperBands.length - 1];
  const latestLowerBand = aggLowerBands[aggLowerBands.length - 1];
  console.log(`   ✅ Indicator 2 calculated: Score=${latestScore?.toFixed(2)}, Upper=${latestUpperBand?.toFixed(2)}, Lower=${latestLowerBand?.toFixed(2)}`);
  console.log(`   📈 All indicators are calculated from ${candles.length} real market data points`);

  // 3. Combine Data Frame
  const indicators: IndicatorData[] = candles.map((c, i) => {
    // Safety check for array bounds
    const curRsi = rsi[i] || 50;
    const curEma = ema20[i] || c.close;
    const curAtr = atr[i] || 0;
    
    // RSI thresholds (based on Pine Script)
    const rsiUpperBandExt = 80; // Extreme overbought
    const rsiUpperBand = 70; // Overbought
    const rsiLowerBand = 30; // Oversold
    const rsiLowerBandExt = 20; // Extreme oversold
    
    // Determine RSI level
    let rsiLevel: 'extreme_oversold' | 'oversold' | 'neutral' | 'overbought' | 'extreme_overbought' = 'neutral';
    if (curRsi <= rsiLowerBandExt) {
      rsiLevel = 'extreme_oversold';
    } else if (curRsi <= rsiLowerBand) {
      rsiLevel = 'oversold';
    } else if (curRsi >= rsiUpperBandExt) {
      rsiLevel = 'extreme_overbought';
    } else if (curRsi >= rsiUpperBand) {
      rsiLevel = 'overbought';
    }
    
    // Determine RSI trend (momentum)
    const prevRsi = rsi[i - 1] || curRsi;
    const prev2Rsi = rsi[i - 2] || prevRsi;
    let rsiTrend: 'up' | 'down' | 'neutral' = 'neutral';
    if (curRsi > prevRsi && prevRsi > prev2Rsi) {
      rsiTrend = 'up';
    } else if (curRsi < prevRsi && prevRsi < prev2Rsi) {
      rsiTrend = 'down';
    }
    
    // Indicator 1 Logic (RSI + ATR) - Enhanced with multiple levels
    const lowerAtrBand = curEma - (2.5 * curAtr);
    const upperAtrBand = curEma + (2.5 * curAtr);
    // Original logic: RSI < 30 && Price < LowerATR for oversold
    // Enhanced: Also check extreme levels
    const isOversold1 = (curRsi <= rsiLowerBand && c.close < lowerAtrBand) || 
                        (curRsi <= rsiLowerBandExt && c.close < lowerAtrBand);
    const isOverbought1 = (curRsi >= rsiUpperBand && c.close > upperAtrBand) || 
                           (curRsi >= rsiUpperBandExt && c.close > upperAtrBand);

    // Indicator 2 Logic (Alpha Extract)
    const curScore = aggScores[i];
    // Use adjusted upper band for Overbought check, and aggregated lower band for Oversold check
    const curAggLower = aggLowerBands[i]; 
    const curAggUpper = adjustedUpperBands[i];
    
    const isOversold2 = !isNaN(curScore) && !isNaN(curAggLower) && curScore < curAggLower;
    const isOverbought2 = !isNaN(curScore) && !isNaN(curAggUpper) && curScore > curAggUpper;

    return {
      time: c.time,
      price: c.close,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      rsi: curRsi,
      ema20: curEma,
      atr: curAtr,
      lowerAtrBand,
      upperAtrBand,
      isOversold1,
      isOverbought1,
      rsiLevel,
      rsiTrend,
      aggScore: isNaN(curScore) ? 0 : curScore,
      aggLowerBand: isNaN(curAggLower) ? 0 : curAggLower,
      aggUpperBand: isNaN(curAggUpper) ? 0 : curAggUpper,
      isOversold2,
      isOverbought2,
      buySignal: isOversold1 || isOversold2,
      strongBuySignal: isOversold1 && isOversold2,
    };
  });

  return { candles, indicators };
};

export const getAssetSummary = async (id: string): Promise<Asset> => {
    const config = ASSETS_CONFIG.find(a => a.id === id);
    if (!config) throw new Error('Asset not found');
    
    // Analyze latest to get current price
    // Note: This fetches the whole history just for the summary, which is inefficient but simple
    const { indicators } = await analyzeAsset(id);
    const latest = indicators[indicators.length - 1] || { price: 0 };
    const prev = indicators[indicators.length - 2] || { price: 1 };
    
    return {
        ...config,
        price: latest.price,
        change24h: ((latest.price - prev.price) / prev.price) * 100
    };
};

export const getAllAssets = async (): Promise<Asset[]> => {
    // Parallelize requests
    return Promise.all(ASSETS_CONFIG.map(a => getAssetSummary(a.id)));
};
