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
  
  // US Stocks - 更多龙头标的
  { id: 'NVO', symbol: 'NVO', name: 'Novo Nordisk', category: AssetCategory.US_STOCKS, yahooSymbol: 'NVO', industry: '医药/糖尿病', marketCap: '大市值' },
  { id: 'ASML', symbol: 'ASML', name: 'ASML', category: AssetCategory.US_STOCKS, yahooSymbol: 'ASML', industry: '半导体设备', marketCap: '大市值' },
  { id: 'AVGO', symbol: 'AVGO', name: 'Broadcom', category: AssetCategory.US_STOCKS, yahooSymbol: 'AVGO', industry: '半导体/科技', marketCap: '大市值' },
  { id: 'COST', symbol: 'COST', name: 'Costco', category: AssetCategory.US_STOCKS, yahooSymbol: 'COST', industry: '零售/消费', marketCap: '大市值' },
  { id: 'MA', symbol: 'MA', name: 'Mastercard', category: AssetCategory.US_STOCKS, yahooSymbol: 'MA', industry: '支付/金融科技', marketCap: '大市值' },
  { id: 'V', symbol: 'V', name: 'Visa', category: AssetCategory.US_STOCKS, yahooSymbol: 'V', industry: '支付/金融科技', marketCap: '大市值' },
  { id: 'ADBE', symbol: 'ADBE', name: 'Adobe', category: AssetCategory.US_STOCKS, yahooSymbol: 'ADBE', industry: '软件/科技', marketCap: '大市值' },
  { id: 'CRM', symbol: 'CRM', name: 'Salesforce', category: AssetCategory.US_STOCKS, yahooSymbol: 'CRM', industry: '软件/科技', marketCap: '大市值' },
  { id: 'ORCL', symbol: 'ORCL', name: 'Oracle', category: AssetCategory.US_STOCKS, yahooSymbol: 'ORCL', industry: '软件/科技', marketCap: '大市值' },
  { id: 'INTC', symbol: 'INTC', name: 'Intel', category: AssetCategory.US_STOCKS, yahooSymbol: 'INTC', industry: '半导体/科技', marketCap: '大市值' },
  { id: 'AMD', symbol: 'AMD', name: 'AMD', category: AssetCategory.US_STOCKS, yahooSymbol: 'AMD', industry: '半导体/科技', marketCap: '大市值' },
  { id: 'QCOM', symbol: 'QCOM', name: 'Qualcomm', category: AssetCategory.US_STOCKS, yahooSymbol: 'QCOM', industry: '半导体/科技', marketCap: '大市值' },
  { id: 'TXN', symbol: 'TXN', name: 'Texas Instruments', category: AssetCategory.US_STOCKS, yahooSymbol: 'TXN', industry: '半导体/科技', marketCap: '大市值' },
  { id: 'LLY', symbol: 'LLY', name: 'Eli Lilly', category: AssetCategory.US_STOCKS, yahooSymbol: 'LLY', industry: '医药/医疗', marketCap: '大市值' },
  { id: 'MRK', symbol: 'MRK', name: 'Merck', category: AssetCategory.US_STOCKS, yahooSymbol: 'MRK', industry: '医药/医疗', marketCap: '大市值' },
  { id: 'PFE', symbol: 'PFE', name: 'Pfizer', category: AssetCategory.US_STOCKS, yahooSymbol: 'PFE', industry: '医药/医疗', marketCap: '大市值' },
  { id: 'ABBV', symbol: 'ABBV', name: 'AbbVie', category: AssetCategory.US_STOCKS, yahooSymbol: 'ABBV', industry: '医药/医疗', marketCap: '大市值' },
  { id: 'TMO', symbol: 'TMO', name: 'Thermo Fisher', category: AssetCategory.US_STOCKS, yahooSymbol: 'TMO', industry: '医疗设备/科技', marketCap: '大市值' },
  { id: 'DHR', symbol: 'DHR', name: 'Danaher', category: AssetCategory.US_STOCKS, yahooSymbol: 'DHR', industry: '医疗设备/科技', marketCap: '大市值' },
  { id: 'ISRG', symbol: 'ISRG', name: 'Intuitive Surgical', category: AssetCategory.US_STOCKS, yahooSymbol: 'ISRG', industry: '医疗设备/机器人', marketCap: '大市值' },
  { id: 'ABT', symbol: 'ABT', name: 'Abbott', category: AssetCategory.US_STOCKS, yahooSymbol: 'ABT', industry: '医疗设备/医疗', marketCap: '大市值' },
  { id: 'CVS', symbol: 'CVS', name: 'CVS Health', category: AssetCategory.US_STOCKS, yahooSymbol: 'CVS', industry: '医疗保健/零售', marketCap: '大市值' },
  { id: 'CI', symbol: 'CI', name: 'Cigna', category: AssetCategory.US_STOCKS, yahooSymbol: 'CI', industry: '医疗保险', marketCap: '大市值' },
  { id: 'HUM', symbol: 'HUM', name: 'Humana', category: AssetCategory.US_STOCKS, yahooSymbol: 'HUM', industry: '医疗保险', marketCap: '大市值' },
  { id: 'ELV', symbol: 'ELV', name: 'Elevance Health', category: AssetCategory.US_STOCKS, yahooSymbol: 'ELV', industry: '医疗保险', marketCap: '大市值' },
  { id: 'VZ', symbol: 'VZ', name: 'Verizon', category: AssetCategory.US_STOCKS, yahooSymbol: 'VZ', industry: '电信/通信', marketCap: '大市值' },
  { id: 'T', symbol: 'T', name: 'AT&T', category: AssetCategory.US_STOCKS, yahooSymbol: 'T', industry: '电信/通信', marketCap: '大市值' },
  { id: 'DIS', symbol: 'DIS', name: 'Disney', category: AssetCategory.US_STOCKS, yahooSymbol: 'DIS', industry: '媒体/娱乐', marketCap: '大市值' },
  { id: 'NKE', symbol: 'NKE', name: 'Nike', category: AssetCategory.US_STOCKS, yahooSymbol: 'NKE', industry: '运动服饰/消费', marketCap: '大市值' },
  { id: 'SBUX', symbol: 'SBUX', name: 'Starbucks', category: AssetCategory.US_STOCKS, yahooSymbol: 'SBUX', industry: '餐饮/消费', marketCap: '大市值' },
  { id: 'HD', symbol: 'HD', name: 'Home Depot', category: AssetCategory.US_STOCKS, yahooSymbol: 'HD', industry: '零售/消费', marketCap: '大市值' },
  { id: 'LOW', symbol: 'LOW', name: 'Lowe\'s', category: AssetCategory.US_STOCKS, yahooSymbol: 'LOW', industry: '零售/消费', marketCap: '大市值' },
  { id: 'NEE', symbol: 'NEE', name: 'NextEra Energy', category: AssetCategory.US_STOCKS, yahooSymbol: 'NEE', industry: '新能源/公用事业', marketCap: '大市值' },
  { id: 'DUK', symbol: 'DUK', name: 'Duke Energy', category: AssetCategory.US_STOCKS, yahooSymbol: 'DUK', industry: '公用事业', marketCap: '大市值' },
  { id: 'SO', symbol: 'SO', name: 'Southern Company', category: AssetCategory.US_STOCKS, yahooSymbol: 'SO', industry: '公用事业', marketCap: '大市值' },
  { id: 'AEP', symbol: 'AEP', name: 'American Electric Power', category: AssetCategory.US_STOCKS, yahooSymbol: 'AEP', industry: '公用事业', marketCap: '大市值' },
  { id: 'XEL', symbol: 'XEL', name: 'Xcel Energy', category: AssetCategory.US_STOCKS, yahooSymbol: 'XEL', industry: '公用事业', marketCap: '大市值' },
  { id: 'PG', symbol: 'PG', name: 'Procter & Gamble', category: AssetCategory.US_STOCKS, yahooSymbol: 'PG', industry: '消费品', marketCap: '大市值' },
  { id: 'CL', symbol: 'CL', name: 'Colgate-Palmolive', category: AssetCategory.US_STOCKS, yahooSymbol: 'CL', industry: '消费品', marketCap: '大市值' },
  { id: 'PEP', symbol: 'PEP', name: 'PepsiCo', category: AssetCategory.US_STOCKS, yahooSymbol: 'PEP', industry: '饮料/消费', marketCap: '大市值' },
  
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
  { id: '002415', symbol: '002415', name: '海康威视 (Hikvision)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002415.SZ', industry: '安防', marketCap: '大市值' },
  { id: '600066', symbol: '600066', name: '宇通客车 (Yutong)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600066.SS', industry: '汽车/高股息', marketCap: '中市值' },
  { id: '600309', symbol: '600309', name: '万华化学 (Wanhua)', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600309.SS', industry: '化工/周期', marketCap: '大市值' },
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
  { id: '600887', symbol: '600887', name: 'Yili', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600887.SS', industry: '食品', marketCap: '大市值' },
  { id: '000538', symbol: '000538', name: 'Yunnan Baiyao', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000538.SZ', industry: '中药', marketCap: '大市值' },
  { id: '002594', symbol: '002594', name: 'BYD', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002594.SZ', industry: '新能源汽车', marketCap: '大市值' },
  { id: '300014', symbol: '300014', name: 'EVE Energy', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300014.SZ', industry: '锂电池', marketCap: '中市值' },
  { id: '600000', symbol: '600000', name: 'Pudong Development Bank', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600000.SS', industry: '银行', marketCap: '大市值' },
  { id: '000001', symbol: '000001', name: 'Ping An Bank', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000001.SZ', industry: '银行', marketCap: '大市值' },

  // tushare筛选的优质A股标的（营收>3亿，ROE>10%或净利润增长>0%，按市值排序）
  { id: '600941', symbol: '600941', name: '中国移动', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600941.SS', industry: '电信运营', marketCap: '中市值' },
  { id: '601939', symbol: '601939', name: '建设银行', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601939.SS', industry: '银行', marketCap: '中市值' },
  { id: '601857', symbol: '601857', name: '中国石油', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601857.SS', industry: '石油开采', marketCap: '中市值' },
  { id: '600938', symbol: '600938', name: '中国海油', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600938.SS', industry: '石油开采', marketCap: '中市值' },
  { id: '601628', symbol: '601628', name: '中国人寿', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601628.SS', industry: '保险', marketCap: '中市值' },
  { id: '601088', symbol: '601088', name: '中国神华', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601088.SS', industry: '煤炭开采', marketCap: '中市值' },
  { id: '601728', symbol: '601728', name: '中国电信', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601728.SS', industry: '电信运营', marketCap: '中市值' },
  { id: '601899', symbol: '601899', name: '紫金矿业', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601899.SS', industry: '铜', marketCap: '中市值' },
  { id: '688041', symbol: '688041', name: '海光信息', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688041.SS', industry: '半导体', marketCap: '中市值' },
  { id: '601319', symbol: '601319', name: '中国人保', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601319.SS', industry: '保险', marketCap: '中市值' },
  { id: '601601', symbol: '601601', name: '中国太保', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601601.SS', industry: '保险', marketCap: '中市值' },
  { id: '300760', symbol: '300760', name: '迈瑞医疗', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300760.SZ', industry: '医疗保健', marketCap: '中市值' },
  { id: '601816', symbol: '601816', name: '京沪高铁', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601816.SS', industry: '铁路', marketCap: '中市值' },
  { id: '600276', symbol: '600276', name: '恒瑞医药', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600276.SS', industry: '化学制药', marketCap: '中市值' },
  { id: '600690', symbol: '600690', name: '海尔智家', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600690.SS', industry: '家用电器', marketCap: '中市值' },
  { id: '601668', symbol: '601668', name: '中国建筑', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601668.SS', industry: '建筑工程', marketCap: '中市值' },
  { id: '601919', symbol: '601919', name: '中远海控', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601919.SS', industry: '水运', marketCap: '中市值' },
  { id: '601225', symbol: '601225', name: '陕西煤业', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601225.SS', industry: '煤炭开采', marketCap: '中市值' },
  { id: '601633', symbol: '601633', name: '长城汽车', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601633.SS', industry: '汽车整车', marketCap: '中市值' },
  { id: '600809', symbol: '600809', name: '山西汾酒', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600809.SS', industry: '白酒', marketCap: '中市值' },
  { id: '688235', symbol: '688235', name: '百济神州-U', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688235.SS', industry: '生物制药', marketCap: '中市值' },
  { id: '003816', symbol: '003816', name: '中国广核', category: AssetCategory.CN_A_SHARES, yahooSymbol: '003816.SZ', industry: '新型电力', marketCap: '中市值' },
  { id: '002371', symbol: '002371', name: '北方华创', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002371.SZ', industry: '半导体', marketCap: '中市值' },
  { id: '600406', symbol: '600406', name: '国电南瑞', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600406.SS', industry: '电气设备', marketCap: '中市值' },
  { id: '601127', symbol: '601127', name: '赛力斯', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601127.SS', industry: '汽车整车', marketCap: '中市值' },
  { id: '002352', symbol: '002352', name: '顺丰控股', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002352.SZ', industry: '仓储物流', marketCap: '中市值' },
  { id: '601985', symbol: '601985', name: '中国核电', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601985.SS', industry: '新型电力', marketCap: '中市值' },
  { id: '600919', symbol: '600919', name: '江苏银行', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600919.SS', industry: '银行', marketCap: '中市值' },
  { id: '600025', symbol: '600025', name: '华能水电', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600025.SS', industry: '水力发电', marketCap: '中市值' },
  { id: '600050', symbol: '600050', name: '中国联通', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600050.SS', industry: '电信运营', marketCap: '中市值' },
  { id: '000725', symbol: '000725', name: '京东方A', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000725.SZ', industry: '元器件', marketCap: '中市值' },
  { id: '600660', symbol: '600660', name: '福耀玻璃', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600660.SS', industry: '汽车配件', marketCap: '中市值' },
  { id: '601898', symbol: '601898', name: '中煤能源', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601898.SS', industry: '煤炭开采', marketCap: '中市值' },
  { id: '600150', symbol: '600150', name: '中国船舶', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600150.SS', industry: '船舶', marketCap: '中市值' },
  { id: '002142', symbol: '002142', name: '宁波银行', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002142.SZ', industry: '银行', marketCap: '中市值' },
  { id: '603259', symbol: '603259', name: '药明康德', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603259.SS', industry: '化学制药', marketCap: '中市值' },
  { id: '601688', symbol: '601688', name: '华泰证券', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601688.SS', industry: '证券', marketCap: '中市值' },
  { id: '601390', symbol: '601390', name: '中国中铁', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601390.SS', industry: '建筑工程', marketCap: '中市值' },
  { id: '300124', symbol: '300124', name: '汇川技术', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300124.SZ', industry: '电器仪表', marketCap: '中市值' },
  { id: '601336', symbol: '601336', name: '新华保险', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601336.SS', industry: '保险', marketCap: '中市值' },
  { id: '300033', symbol: '300033', name: '同花顺', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300033.SZ', industry: '软件服务', marketCap: '中市值' },
  { id: '600018', symbol: '600018', name: '上港集团', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600018.SS', industry: '港口', marketCap: '中市值' },
  { id: '600188', symbol: '600188', name: '兖矿能源', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600188.SS', industry: '煤炭开采', marketCap: '中市值' },
  { id: '600760', symbol: '600760', name: '中航沈飞', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600760.SS', industry: '航空', marketCap: '中市值' },
  { id: '600031', symbol: '600031', name: '三一重工', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600031.SS', industry: '工程机械', marketCap: '中市值' },
  { id: '601888', symbol: '601888', name: '中国中免', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601888.SS', industry: '旅游服务', marketCap: '中市值' },
  { id: '300308', symbol: '300308', name: '中际旭创', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300308.SZ', industry: '通信设备', marketCap: '中市值' },
  { id: '601111', symbol: '601111', name: '中国国航', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601111.SS', industry: '空运', marketCap: '中市值' },
  { id: '000166', symbol: '000166', name: '申万宏源', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000166.SZ', industry: '证券', marketCap: '中市值' },
  { id: '688111', symbol: '688111', name: '金山办公', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688111.SS', industry: '软件服务', marketCap: '中市值' },
  { id: '000625', symbol: '000625', name: '长安汽车', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000625.SZ', industry: '汽车整车', marketCap: '中市值' },
  { id: '605499', symbol: '605499', name: '东鹏饮料', category: AssetCategory.CN_A_SHARES, yahooSymbol: '605499.SS', industry: '软饮料', marketCap: '中市值' },
  { id: '603501', symbol: '603501', name: '豪威集团', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603501.SS', industry: '半导体', marketCap: '中市值' },
  { id: '601727', symbol: '601727', name: '上海电气', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601727.SS', industry: '电气设备', marketCap: '中市值' },
  { id: '601600', symbol: '601600', name: '中国铝业', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601600.SS', industry: '铝', marketCap: '中市值' },
  { id: '600886', symbol: '600886', name: '国投电力', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600886.SS', industry: '水力发电', marketCap: '中市值' },
  { id: '600989', symbol: '600989', name: '宝丰能源', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600989.SS', industry: '化工原料', marketCap: '中市值' },
  { id: '000338', symbol: '000338', name: '潍柴动力', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000338.SZ', industry: '汽车配件', marketCap: '中市值' },
  { id: '601012', symbol: '601012', name: '隆基绿能', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601012.SS', industry: '电气设备', marketCap: '中市值' },
  { id: '688012', symbol: '688012', name: '中微公司', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688012.SS', industry: '半导体', marketCap: '中市值' },
  { id: '600029', symbol: '600029', name: '南方航空', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600029.SS', industry: '空运', marketCap: '中市值' },
  { id: '601009', symbol: '601009', name: '南京银行', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601009.SS', industry: '银行', marketCap: '中市值' },
  { id: '600600', symbol: '600600', name: '青岛啤酒', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600600.SS', industry: '啤酒', marketCap: '中市值' },
  { id: '300498', symbol: '300498', name: '温氏股份', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300498.SZ', industry: '农业综合', marketCap: '中市值' },
  { id: '688036', symbol: '688036', name: '传音控股', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688036.SS', industry: '通信设备', marketCap: '中市值' },
  { id: '600346', symbol: '600346', name: '恒力石化', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600346.SS', industry: '石油加工', marketCap: '中市值' },
  { id: '600011', symbol: '600011', name: '华能国际', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600011.SS', industry: '火力发电', marketCap: '中市值' },
  { id: '688271', symbol: '688271', name: '联影医疗', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688271.SS', industry: '医疗保健', marketCap: '中市值' },
  { id: '002625', symbol: '002625', name: '光启技术', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002625.SZ', industry: '航空', marketCap: '中市值' },
  { id: '002027', symbol: '002027', name: '分众传媒', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002027.SZ', industry: '广告包装', marketCap: '中市值' },
  { id: '600547', symbol: '600547', name: '山东黄金', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600547.SS', industry: '黄金', marketCap: '中市值' },
  { id: '001965', symbol: '001965', name: '招商公路', category: AssetCategory.CN_A_SHARES, yahooSymbol: '001965.SZ', industry: '路桥', marketCap: '中市值' },
  { id: '300979', symbol: '300979', name: '华利集团', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300979.SZ', industry: '服饰', marketCap: '中市值' },
  { id: '000596', symbol: '000596', name: '古井贡酒', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000596.SZ', industry: '白酒', marketCap: '中市值' },
  { id: '603195', symbol: '603195', name: '公牛集团', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603195.SS', industry: '家用电器', marketCap: '中市值' },
  { id: '600958', symbol: '600958', name: '东方证券', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600958.SS', industry: '证券', marketCap: '中市值' },
  { id: '002241', symbol: '002241', name: '歌尔股份', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002241.SZ', industry: '元器件', marketCap: '中市值' },
  { id: '300442', symbol: '300442', name: '润泽科技', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300442.SZ', industry: '软件服务', marketCap: '中市值' },
  { id: '600115', symbol: '600115', name: '中国东航', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600115.SS', industry: '空运', marketCap: '中市值' },
  { id: '600926', symbol: '600926', name: '杭州银行', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600926.SS', industry: '银行', marketCap: '中市值' },
  { id: '600009', symbol: '600009', name: '上海机场', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600009.SS', industry: '机场', marketCap: '中市值' },
  { id: '600845', symbol: '600845', name: '宝信软件', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600845.SS', industry: '软件服务', marketCap: '中市值' },
  { id: '600674', symbol: '600674', name: '川投能源', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600674.SS', industry: '水力发电', marketCap: '中市值' },
  { id: '002179', symbol: '002179', name: '中航光电', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002179.SZ', industry: '元器件', marketCap: '中市值' },
  { id: '601689', symbol: '601689', name: '拓普集团', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601689.SS', industry: '汽车配件', marketCap: '中市值' },
  { id: '601825', symbol: '601825', name: '沪农商行', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601825.SS', industry: '银行', marketCap: '中市值' },
  { id: '300502', symbol: '300502', name: '新易盛', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300502.SZ', industry: '通信设备', marketCap: '中市值' },
  { id: '600418', symbol: '600418', name: '江淮汽车', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600418.SS', industry: '汽车整车', marketCap: '中市值' },
  { id: '600795', symbol: '600795', name: '国电电力', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600795.SS', industry: '火力发电', marketCap: '中市值' },
  { id: '002311', symbol: '002311', name: '海大集团', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002311.SZ', industry: '饲料', marketCap: '中市值' },
  { id: '000768', symbol: '000768', name: '中航西飞', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000768.SZ', industry: '航空', marketCap: '中市值' },
  { id: '600377', symbol: '600377', name: '宁沪高速', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600377.SS', industry: '路桥', marketCap: '中市值' },
  { id: '688506', symbol: '688506', name: '百利天恒', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688506.SS', industry: '化学制药', marketCap: '中市值' },
  { id: '600023', symbol: '600023', name: '浙能电力', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600023.SS', industry: '火力发电', marketCap: '中市值' },
  { id: '300408', symbol: '300408', name: '三环集团', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300408.SZ', industry: '元器件', marketCap: '中市值' },
  { id: '600415', symbol: '600415', name: '小商品城', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600415.SS', industry: '商品城', marketCap: '中市值' },
  { id: '600221', symbol: '600221', name: '海航控股', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600221.SS', industry: '空运', marketCap: '中市值' },
  { id: '601808', symbol: '601808', name: '中海油服', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601808.SS', industry: '石油开采', marketCap: '中市值' },
  { id: '601360', symbol: '601360', name: '三六零', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601360.SS', industry: '互联网', marketCap: '中市值' },
  { id: '603296', symbol: '603296', name: '华勤技术', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603296.SS', industry: '元器件', marketCap: '中市值' },
  { id: '688223', symbol: '688223', name: '晶科能源', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688223.SS', industry: '电气设备', marketCap: '中市值' },
  { id: '601100', symbol: '601100', name: '恒立液压', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601100.SS', industry: '工程机械', marketCap: '中市值' },
  { id: '601838', symbol: '601838', name: '成都银行', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601838.SS', industry: '银行', marketCap: '中市值' },
  { id: '601077', symbol: '601077', name: '渝农商行', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601077.SS', industry: '银行', marketCap: '中市值' },
  { id: '002001', symbol: '002001', name: '新和成', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002001.SZ', industry: '化学制药', marketCap: '中市值' },
  { id: '688187', symbol: '688187', name: '时代电气', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688187.SS', industry: '运输设备', marketCap: '中市值' },
  { id: '600803', symbol: '600803', name: '新奥股份', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600803.SS', industry: '供气供热', marketCap: '中市值' },
  { id: '600089', symbol: '600089', name: '特变电工', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600089.SS', industry: '电气设备', marketCap: '中市值' },
  { id: '600039', symbol: '600039', name: '四川路桥', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600039.SS', industry: '建筑工程', marketCap: '中市值' },
  { id: '300122', symbol: '300122', name: '智飞生物', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300122.SZ', industry: '生物制药', marketCap: '中市值' },
  { id: '000564', symbol: '000564', name: '供销大集', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000564.SZ', industry: '百货', marketCap: '中市值' },
  { id: '000963', symbol: '000963', name: '华东医药', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000963.SZ', industry: '化学制药', marketCap: '中市值' },
  { id: '601136', symbol: '601136', name: '首创证券', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601136.SS', industry: '证券', marketCap: '中市值' },
  { id: '600372', symbol: '600372', name: '中航机载', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600372.SS', industry: '航空', marketCap: '中市值' },
  { id: '601298', symbol: '601298', name: '青岛港', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601298.SS', industry: '港口', marketCap: '中市值' },
  { id: '600489', symbol: '600489', name: '中金黄金', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600489.SS', industry: '黄金', marketCap: '中市值' },
  { id: '000708', symbol: '000708', name: '中信特钢', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000708.SZ', industry: '特种钢', marketCap: '中市值' },
  { id: '601933', symbol: '601933', name: '永辉超市', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601933.SS', industry: '超市连锁', marketCap: '中市值' },
  { id: '600027', symbol: '600027', name: '华电国际', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600027.SS', industry: '火力发电', marketCap: '中市值' },
  { id: '000999', symbol: '000999', name: '华润三九', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000999.SZ', industry: '中成药', marketCap: '中市值' },
  { id: '603369', symbol: '603369', name: '今世缘', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603369.SS', industry: '白酒', marketCap: '中市值' },
  { id: '002028', symbol: '002028', name: '思源电气', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002028.SZ', industry: '电气设备', marketCap: '中市值' },
  { id: '601021', symbol: '601021', name: '春秋航空', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601021.SS', industry: '空运', marketCap: '中市值' },
  { id: '002600', symbol: '002600', name: '领益智造', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002600.SZ', industry: '元器件', marketCap: '中市值' },
  { id: '300832', symbol: '300832', name: '新产业', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300832.SZ', industry: '医疗保健', marketCap: '中市值' },
  { id: '600085', symbol: '600085', name: '同仁堂', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600085.SS', industry: '中成药', marketCap: '中市值' },
  { id: '600741', symbol: '600741', name: '华域汽车', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600741.SS', industry: '汽车配件', marketCap: '中市值' },
  { id: '600026', symbol: '600026', name: '中远海能', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600026.SS', industry: '水运', marketCap: '中市值' },
  { id: '300896', symbol: '300896', name: '爱美客', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300896.SZ', industry: '医疗保健', marketCap: '中市值' },
  { id: '600482', symbol: '600482', name: '中国动力', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600482.SS', industry: '船舶', marketCap: '中市值' },
  { id: '605117', symbol: '605117', name: '德业股份', category: AssetCategory.CN_A_SHARES, yahooSymbol: '605117.SS', industry: '电气设备', marketCap: '中市值' },
  { id: '002049', symbol: '002049', name: '紫光国微', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002049.SZ', industry: '半导体', marketCap: '中市值' },
  { id: '600570', symbol: '600570', name: '恒生电子', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600570.SS', industry: '软件服务', marketCap: '中市值' },
  { id: '601991', symbol: '601991', name: '大唐发电', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601991.SS', industry: '火力发电', marketCap: '中市值' },
  { id: '002236', symbol: '002236', name: '大华股份', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002236.SZ', industry: 'IT设备', marketCap: '中市值' },
  { id: '601872', symbol: '601872', name: '招商轮船', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601872.SS', industry: '水运', marketCap: '中市值' },
  { id: '300866', symbol: '300866', name: '安克创新', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300866.SZ', industry: '元器件', marketCap: '中市值' },
  { id: '688303', symbol: '688303', name: '大全能源', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688303.SS', industry: '电气设备', marketCap: '中市值' },
  { id: '000786', symbol: '000786', name: '北新建材', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000786.SZ', industry: '其他建材', marketCap: '中市值' },
  { id: '300394', symbol: '300394', name: '天孚通信', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300394.SZ', industry: '通信设备', marketCap: '中市值' },
  { id: '300413', symbol: '300413', name: '芒果超媒', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300413.SZ', industry: '影视音像', marketCap: '中市值' },
  { id: '002384', symbol: '002384', name: '东山精密', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002384.SZ', industry: '元器件', marketCap: '中市值' },
  { id: '603799', symbol: '603799', name: '华友钴业', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603799.SS', industry: '小金属', marketCap: '中市值' },
  { id: '600233', symbol: '600233', name: '圆通速递', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600233.SS', industry: '仓储物流', marketCap: '中市值' },
  { id: '300782', symbol: '300782', name: '卓胜微', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300782.SZ', industry: '半导体', marketCap: '中市值' },
  { id: '002422', symbol: '002422', name: '科伦药业', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002422.SZ', industry: '化学制药', marketCap: '中市值' },
  { id: '601058', symbol: '601058', name: '赛轮轮胎', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601058.SS', industry: '汽车配件', marketCap: '中市值' },
  { id: '000807', symbol: '000807', name: '云铝股份', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000807.SZ', industry: '铝', marketCap: '中市值' },
  { id: '000983', symbol: '000983', name: '山西焦煤', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000983.SZ', industry: '煤炭开采', marketCap: '中市值' },
  { id: '600642', symbol: '600642', name: '申能股份', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600642.SS', industry: '火力发电', marketCap: '中市值' },
  { id: '688472', symbol: '688472', name: '阿特斯', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688472.SS', industry: '电气设备', marketCap: '中市值' },
  { id: '600332', symbol: '600332', name: '白云山', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600332.SS', industry: '中成药', marketCap: '中市值' },
  { id: '601865', symbol: '601865', name: '福莱特', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601865.SS', industry: '玻璃', marketCap: '中市值' },
  { id: '603893', symbol: '603893', name: '瑞芯微', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603893.SS', industry: '半导体', marketCap: '中市值' },
  { id: '600426', symbol: '600426', name: '华鲁恒升', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600426.SS', industry: '农药化肥', marketCap: '中市值' },
  { id: '300759', symbol: '300759', name: '康龙化成', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300759.SZ', industry: '化学制药', marketCap: '中市值' },
  { id: '600176', symbol: '600176', name: '中国巨石', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600176.SS', industry: '玻璃', marketCap: '中市值' },
  { id: '002459', symbol: '002459', name: '晶澳科技', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002459.SZ', industry: '电气设备', marketCap: '中市值' },
  { id: '600219', symbol: '600219', name: '南山铝业', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600219.SS', industry: '铝', marketCap: '中市值' },
  { id: '002156', symbol: '002156', name: '通富微电', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002156.SZ', industry: '半导体', marketCap: '中市值' },
  { id: '600733', symbol: '600733', name: '北汽蓝谷', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600733.SS', industry: '汽车整车', marketCap: '中市值' },
  { id: '600839', symbol: '600839', name: '四川长虹', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600839.SS', industry: '家用电器', marketCap: '中市值' },
  { id: '601216', symbol: '601216', name: '君正集团', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601216.SS', industry: '化工原料', marketCap: '中市值' },
  { id: '600256', symbol: '600256', name: '广汇能源', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600256.SS', industry: '石油开采', marketCap: '中市值' },
  { id: '002128', symbol: '002128', name: '电投能源', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002128.SZ', industry: '铝', marketCap: '中市值' },
  { id: '688082', symbol: '688082', name: '盛美上海', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688082.SS', industry: '半导体', marketCap: '中市值' },
  { id: '000408', symbol: '000408', name: '藏格矿业', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000408.SZ', industry: '农药化肥', marketCap: '中市值' },
  { id: '000988', symbol: '000988', name: '华工科技', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000988.SZ', industry: '专用机械', marketCap: '中市值' },
  { id: '601567', symbol: '601567', name: '三星医疗', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601567.SS', industry: '电气设备', marketCap: '中市值' },
  { id: '600968', symbol: '600968', name: '海油发展', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600968.SS', industry: '石油开采', marketCap: '中市值' },
  { id: '603198', symbol: '603198', name: '迎驾贡酒', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603198.SS', industry: '白酒', marketCap: '中市值' },
  { id: '601699', symbol: '601699', name: '潞安环能', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601699.SS', industry: '煤炭开采', marketCap: '中市值' },
  { id: '688072', symbol: '688072', name: '拓荆科技', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688072.SS', industry: '半导体', marketCap: '中市值' },
  { id: '000975', symbol: '000975', name: '山金国际', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000975.SZ', industry: '黄金', marketCap: '中市值' },
  { id: '002032', symbol: '002032', name: '苏泊尔', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002032.SZ', industry: '家用电器', marketCap: '中市值' },
  { id: '600487', symbol: '600487', name: '亨通光电', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600487.SS', industry: '通信设备', marketCap: '中市值' },
  { id: '002601', symbol: '002601', name: '龙佰集团', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002601.SZ', industry: '化工原料', marketCap: '中市值' },
  { id: '688599', symbol: '688599', name: '天合光能', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688599.SS', industry: '电气设备', marketCap: '中市值' },
  { id: '603833', symbol: '603833', name: '欧派家居', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603833.SS', industry: '家居用品', marketCap: '中市值' },
  { id: '300316', symbol: '300316', name: '晶盛机电', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300316.SZ', industry: '专用机械', marketCap: '中市值' },
  { id: '002078', symbol: '002078', name: '太阳纸业', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002078.SZ', industry: '造纸', marketCap: '中市值' },
  { id: '600096', symbol: '600096', name: '云天化', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600096.SS', industry: '农药化肥', marketCap: '中市值' },
  { id: '000876', symbol: '000876', name: '新希望', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000876.SZ', industry: '饲料', marketCap: '中市值' },
  { id: '000661', symbol: '000661', name: '长春高新', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000661.SZ', industry: '生物制药', marketCap: '中市值' },
  { id: '600161', symbol: '600161', name: '天坛生物', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600161.SS', industry: '生物制药', marketCap: '中市值' },
  { id: '688169', symbol: '688169', name: '石头科技', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688169.SS', industry: '家用电器', marketCap: '中市值' },
  { id: '000423', symbol: '000423', name: '东阿阿胶', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000423.SZ', industry: '中成药', marketCap: '中市值' },
  { id: '002085', symbol: '002085', name: '万丰奥威', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002085.SZ', industry: '汽车配件', marketCap: '中市值' },
  { id: '002595', symbol: '002595', name: '豪迈科技', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002595.SZ', industry: '专用机械', marketCap: '中市值' },
  { id: '000921', symbol: '000921', name: '海信家电', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000921.SZ', industry: '家用电器', marketCap: '中市值' },
  { id: '601236', symbol: '601236', name: '红塔证券', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601236.SS', industry: '证券', marketCap: '中市值' },
  { id: '688188', symbol: '688188', name: '柏楚电子', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688188.SS', industry: '专用机械', marketCap: '中市值' },
  { id: '300339', symbol: '300339', name: '润和软件', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300339.SZ', industry: '软件服务', marketCap: '中市值' },
  { id: '002456', symbol: '002456', name: '欧菲光', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002456.SZ', industry: '元器件', marketCap: '中市值' },
  { id: '688777', symbol: '688777', name: '中控技术', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688777.SS', industry: '专用机械', marketCap: '中市值' },
  { id: '688608', symbol: '688608', name: '恒玄科技', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688608.SS', industry: '半导体', marketCap: '中市值' },
  { id: '601598', symbol: '601598', name: '中国外运', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601598.SS', industry: '仓储物流', marketCap: '中市值' },
  { id: '601179', symbol: '601179', name: '中国西电', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601179.SS', industry: '电气设备', marketCap: '中市值' },
  { id: '601162', symbol: '601162', name: '天风证券', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601162.SS', industry: '证券', marketCap: '中市值' },
  { id: '601555', symbol: '601555', name: '东吴证券', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601555.SS', industry: '证券', marketCap: '中市值' },
  { id: '600871', symbol: '600871', name: '石化油服', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600871.SS', industry: '石油开采', marketCap: '中市值' },
  { id: '002444', symbol: '002444', name: '巨星科技', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002444.SZ', industry: '轻工机械', marketCap: '中市值' },
  { id: '688120', symbol: '688120', name: '华海清科', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688120.SS', industry: '半导体', marketCap: '中市值' },
  { id: '601168', symbol: '601168', name: '西部矿业', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601168.SS', industry: '铜', marketCap: '中市值' },
  { id: '002074', symbol: '002074', name: '国轩高科', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002074.SZ', industry: '电气设备', marketCap: '中市值' },
  { id: '600079', symbol: '600079', name: '人福医药', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600079.SS', industry: '化学制药', marketCap: '中市值' },
  { id: '601799', symbol: '601799', name: '星宇股份', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601799.SS', industry: '汽车配件', marketCap: '中市值' },
  { id: '000933', symbol: '000933', name: '神火股份', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000933.SZ', industry: '铝', marketCap: '中市值' },
  { id: '600157', symbol: '600157', name: '永泰能源', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600157.SS', industry: '火力发电', marketCap: '中市值' },
  { id: '600985', symbol: '600985', name: '淮北矿业', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600985.SS', industry: '煤炭开采', marketCap: '中市值' },
  { id: '002353', symbol: '002353', name: '杰瑞股份', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002353.SZ', industry: '化工机械', marketCap: '中市值' },
  { id: '688349', symbol: '688349', name: '三一重能', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688349.SS', industry: '电气设备', marketCap: '中市值' },
  { id: '002709', symbol: '002709', name: '天赐材料', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002709.SZ', industry: '化工原料', marketCap: '中市值' },
  { id: '300765', symbol: '300765', name: '新诺威', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300765.SZ', industry: '食品', marketCap: '中市值' },
  { id: '002653', symbol: '002653', name: '海思科', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002653.SZ', industry: '化学制药', marketCap: '中市值' },
  { id: '603568', symbol: '603568', name: '伟明环保', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603568.SS', industry: '环境保护', marketCap: '中市值' },
  { id: '002532', symbol: '002532', name: '天山铝业', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002532.SZ', industry: '铝', marketCap: '中市值' },
  { id: '002223', symbol: '002223', name: '鱼跃医疗', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002223.SZ', industry: '医疗保健', marketCap: '中市值' },
  { id: '600925', symbol: '600925', name: '苏能股份', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600925.SS', industry: '煤炭开采', marketCap: '中市值' },
  { id: '002673', symbol: '002673', name: '西部证券', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002673.SZ', industry: '证券', marketCap: '中市值' },
  { id: '688617', symbol: '688617', name: '惠泰医疗', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688617.SS', industry: '医疗保健', marketCap: '中市值' },
  { id: '603606', symbol: '603606', name: '东方电缆', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603606.SS', industry: '电气设备', marketCap: '中市值' },
  { id: '601231', symbol: '601231', name: '环旭电子', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601231.SS', industry: '元器件', marketCap: '中市值' },
  { id: '600398', symbol: '600398', name: '海澜之家', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600398.SS', industry: '服饰', marketCap: '中市值' },
  { id: '301308', symbol: '301308', name: '江波龙', category: AssetCategory.CN_A_SHARES, yahooSymbol: '301308.SZ', industry: '半导体', marketCap: '中市值' },
  { id: '601577', symbol: '601577', name: '长沙银行', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601577.SS', industry: '银行', marketCap: '中市值' },
  
  // A股 - 更多细分行业龙头和中小市值标的
  // 半导体细分
  { id: '688981', symbol: '688981', name: '中芯国际', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688981.SS', industry: '晶圆代工', marketCap: '大市值' },
  { id: '688012', symbol: '688012', name: '中微公司', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688012.SS', industry: '半导体设备', marketCap: '中市值' },
  { id: '688396', symbol: '688396', name: '华润微', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688396.SS', industry: '功率半导体', marketCap: '中市值' },
  { id: '688536', symbol: '688536', name: '思瑞浦', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688536.SS', industry: '模拟芯片', marketCap: '小市值' },
  { id: '688256', symbol: '688256', name: '寒武纪', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688256.SS', industry: 'AI芯片', marketCap: '中市值' },
  { id: '688037', symbol: '688037', name: '芯源微', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688037.SS', industry: '半导体设备', marketCap: '小市值' },
  { id: '688120', symbol: '688120', name: '华海清科', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688120.SS', industry: '半导体设备', marketCap: '中市值' },
  { id: '688082', symbol: '688082', name: '盛美上海', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688082.SS', industry: '半导体设备', marketCap: '小市值' },
  { id: '688072', symbol: '688072', name: '拓荆科技', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688072.SS', industry: '半导体设备', marketCap: '小市值' },
  
  // 医药细分
  { id: '688111', symbol: '688111', name: '金山办公', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688111.SS', industry: '办公软件', marketCap: '大市值' },
  { id: '300015', symbol: '300015', name: '爱尔眼科', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300015.SZ', industry: '眼科医疗', marketCap: '大市值' },
  { id: '300760', symbol: '300760', name: '迈瑞医疗', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300760.SZ', industry: '医疗设备', marketCap: '大市值' },
  { id: '002007', symbol: '002007', name: '华兰生物', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002007.SZ', industry: '血液制品', marketCap: '中市值' },
  { id: '300347', symbol: '300347', name: '泰格医药', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300347.SZ', industry: 'CRO', marketCap: '中市值' },
  { id: '300142', symbol: '300142', name: '沃森生物', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300142.SZ', industry: '疫苗', marketCap: '中市值' },
  { id: '002821', symbol: '002821', name: '凯莱英', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002821.SZ', industry: 'CDMO', marketCap: '中市值' },
  { id: '688202', symbol: '688202', name: '美迪西', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688202.SS', industry: 'CRO', marketCap: '小市值' },
  { id: '688266', symbol: '688266', name: '泽璟制药', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688266.SS', industry: '创新药', marketCap: '小市值' },
  
  // 消费细分
  { id: '000858', symbol: '000858', name: '五粮液', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000858.SZ', industry: '白酒', marketCap: '大市值' },
  { id: '600519', symbol: '600519', name: '贵州茅台', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600519.SS', industry: '白酒', marketCap: '大市值' },
  { id: '000596', symbol: '000596', name: '古井贡酒', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000596.SZ', industry: '白酒', marketCap: '中市值' },
  { id: '600809', symbol: '600809', name: '山西汾酒', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600809.SS', industry: '白酒', marketCap: '大市值' },
  { id: '000568', symbol: '000568', name: '泸州老窖', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000568.SZ', industry: '白酒', marketCap: '大市值' },
  { id: '603369', symbol: '603369', name: '今世缘', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603369.SS', industry: '白酒', marketCap: '中市值' },
  { id: '000333', symbol: '000333', name: '美的集团', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000333.SZ', industry: '家电', marketCap: '大市值' },
  { id: '000651', symbol: '000651', name: '格力电器', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000651.SZ', industry: '家电', marketCap: '大市值' },
  { id: '002304', symbol: '002304', name: '洋河股份', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002304.SZ', industry: '白酒', marketCap: '大市值' },
  { id: '600887', symbol: '600887', name: '伊利股份', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600887.SS', industry: '乳制品', marketCap: '大市值' },
  { id: '000895', symbol: '000895', name: '双汇发展', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000895.SZ', industry: '食品', marketCap: '大市值' },
  { id: '600600', symbol: '600600', name: '青岛啤酒', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600600.SS', industry: '啤酒', marketCap: '大市值' },
  { id: '603288', symbol: '603288', name: '海天味业', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603288.SS', industry: '调味品', marketCap: '大市值' },
  
  // 化工细分
  { id: '600309', symbol: '600309', name: '万华化学', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600309.SS', industry: 'MDI', marketCap: '大市值' },
  { id: '000792', symbol: '000792', name: '盐湖股份', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000792.SZ', industry: '钾肥', marketCap: '大市值' },
  { id: '002648', symbol: '002648', name: '卫星化学', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002648.SZ', industry: 'C2产业链', marketCap: '中市值' },
  { id: '600346', symbol: '600346', name: '恒力石化', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600346.SS', industry: '炼化', marketCap: '大市值' },
  { id: '000703', symbol: '000703', name: '恒逸石化', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000703.SZ', industry: '炼化', marketCap: '中市值' },
  { id: '002493', symbol: '002493', name: '荣盛石化', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002493.SZ', industry: '炼化', marketCap: '大市值' },
  { id: '600989', symbol: '600989', name: '宝丰能源', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600989.SS', industry: '煤化工', marketCap: '中市值' },
  
  // 有色金属细分
  { id: '600111', symbol: '600111', name: '北方稀土', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600111.SS', industry: '稀土', marketCap: '大市值' },
  { id: '000831', symbol: '000831', name: '五矿稀土', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000831.SZ', industry: '稀土', marketCap: '中市值' },
  { id: '600010', symbol: '600010', name: '包钢股份', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600010.SS', industry: '稀土/钢铁', marketCap: '大市值' },
  { id: '002460', symbol: '002460', name: '赣锋锂业', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002460.SZ', industry: '锂', marketCap: '大市值' },
  { id: '002466', symbol: '002466', name: '天齐锂业', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002466.SZ', industry: '锂', marketCap: '大市值' },
  { id: '603993', symbol: '603993', name: '洛阳钼业', category: AssetCategory.CN_A_SHARES, yahooSymbol: '603993.SS', industry: '能源金属', marketCap: '大市值' },
  { id: '601899', symbol: '601899', name: '紫金矿业', category: AssetCategory.CN_A_SHARES, yahooSymbol: '601899.SS', industry: '黄金/铜', marketCap: '大市值' },
  { id: '000630', symbol: '000630', name: '铜陵有色', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000630.SZ', industry: '铜', marketCap: '中市值' },
  { id: '600547', symbol: '600547', name: '山东黄金', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600547.SS', industry: '黄金', marketCap: '中市值' },
  { id: '600489', symbol: '600489', name: '中金黄金', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600489.SS', industry: '黄金', marketCap: '中市值' },
  
  // 机械设备细分
  { id: '600031', symbol: '600031', name: '三一重工', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600031.SS', industry: '工程机械', marketCap: '大市值' },
  { id: '000157', symbol: '000157', name: '中联重科', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000157.SZ', industry: '工程机械', marketCap: '大市值' },
  { id: '000425', symbol: '000425', name: '徐工机械', category: AssetCategory.CN_A_SHARES, yahooSymbol: '000425.SZ', industry: '工程机械', marketCap: '大市值' },
  { id: '002050', symbol: '002050', name: '三花智控', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002050.SZ', industry: '汽车零部件', marketCap: '大市值' },
  { id: '600660', symbol: '600660', name: '福耀玻璃', category: AssetCategory.CN_A_SHARES, yahooSymbol: '600660.SS', industry: '汽车玻璃', marketCap: '大市值' },
  { id: '002920', symbol: '002920', name: '德赛西威', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002920.SZ', industry: '汽车电子', marketCap: '中市值' },
  
  // 中小市值成长股
  { id: '300782', symbol: '300782', name: '卓胜微', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300782.SZ', industry: '射频芯片', marketCap: '中市值' },
  { id: '300408', symbol: '300408', name: '三环集团', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300408.SZ', industry: '电子陶瓷', marketCap: '中市值' },
  { id: '002916', symbol: '002916', name: '深南电路', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002916.SZ', industry: 'PCB', marketCap: '中市值' },
  { id: '002463', symbol: '002463', name: '沪电股份', category: AssetCategory.CN_A_SHARES, yahooSymbol: '002463.SZ', industry: 'PCB', marketCap: '中市值' },
  { id: '300628', symbol: '300628', name: '亿联网络', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300628.SZ', industry: '统一通信', marketCap: '中市值' },
  { id: '300502', symbol: '300502', name: '新易盛', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300502.SZ', industry: '光模块', marketCap: '中市值' },
  { id: '300308', symbol: '300308', name: '中际旭创', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300308.SZ', industry: '光模块', marketCap: '中市值' },
  { id: '688036', symbol: '688036', name: '传音控股', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688036.SS', industry: '手机', marketCap: '中市值' },
  { id: '688169', symbol: '688169', name: '石头科技', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688169.SS', industry: '扫地机器人', marketCap: '中市值' },
  { id: '300896', symbol: '300896', name: '爱美客', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300896.SZ', industry: '医美', marketCap: '中市值' },
  { id: '688363', symbol: '688363', name: '华熙生物', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688363.SS', industry: '医美', marketCap: '中市值' },
  { id: '300832', symbol: '300832', name: '新产业', category: AssetCategory.CN_A_SHARES, yahooSymbol: '300832.SZ', industry: '体外诊断', marketCap: '中市值' },
  { id: '688617', symbol: '688617', name: '惠泰医疗', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688617.SS', industry: '介入器械', marketCap: '小市值' },
  { id: '688188', symbol: '688188', name: '柏楚电子', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688188.SS', industry: '激光切割', marketCap: '中市值' },
  { id: '688777', symbol: '688777', name: '中控技术', category: AssetCategory.CN_A_SHARES, yahooSymbol: '688777.SS', industry: '工业自动化', marketCap: '中市值' },
  
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

  // --- Indicator 3: Latent Energy Reactor ---
  console.log(`   Calculating Indicator 3 (Latent Energy Reactor)...`);
  
  // Parameters
  const minBarsInRange = 15;
  const rangeATRMult = 2.5;
  const atrPeriod3 = 14;
  const energyCriticalThresh = 80.0;
  const energyHighThresh = 60.0;
  const formingBars = 10;
  const growthBars = 25;
  const matureBars = 50;
  const dirConfidenceMin = 55.0;
  const volAnomalyMult = 2.0;
  
  // Helper functions
  const calcLatentEnergy = (duration: number, rangeHeight: number, atrVal: number): number => {
    if (rangeHeight <= 0 || atrVal <= 0 || duration <= 0) return 0.0;
    const compressionRatio = atrVal / rangeHeight;
    const compressionScore = Math.min(compressionRatio * 50, 40);
    const timeScore = Math.min(duration * 2, 35);
    const maturityBonus = duration >= 30 ? 15 : duration >= 20 ? 10 : duration >= 15 ? 5 : 0;
    const tightnessBonus = rangeHeight < atrVal * 0.5 ? 10 : rangeHeight < atrVal * 0.75 ? 5 : 0;
    const totalEnergy = compressionScore + timeScore + maturityBonus + tightnessBonus;
    return Math.min(Math.max(totalEnergy, 5), 100);
  };
  
  const calcGravityCenter = (top: number, bottom: number, startBar: number, currentBar: number, candles: Candle[]): number => {
    let sumWeightedPrice = 0.0;
    let sumVolume = 0.0;
    const lookback = Math.min(currentBar - startBar, 500);
    if (lookback > 0) {
      for (let i = 0; i < lookback; i++) {
        const idx = currentBar - i;
        if (idx < 0 || idx >= candles.length) continue;
        const c = candles[idx];
        const midPrice = (c.high + c.low + c.close) / 3;
        if (midPrice <= top && midPrice >= bottom) {
          sumWeightedPrice += midPrice * c.volume;
          sumVolume += c.volume;
        }
      }
    }
    return sumVolume > 0 ? sumWeightedPrice / sumVolume : (top + bottom) / 2;
  };
  
  const countTouches = (level: number, tolerance: number, startBar: number, currentBar: number, isTop: boolean, candles: Candle[]): number => {
    let touches = 0;
    const lookback = Math.min(currentBar - startBar, 500);
    if (lookback > 0) {
      for (let i = 0; i < lookback; i++) {
        const idx = currentBar - i;
        if (idx < 0 || idx >= candles.length) continue;
        const c = candles[idx];
        const touched = isTop 
          ? (c.high >= level - tolerance && c.high <= level + tolerance)
          : (c.low >= level - tolerance && c.low <= level + tolerance);
        const rejected = isTop
          ? (c.close < c.high - tolerance)
          : (c.close > c.low + tolerance);
        if (touched && rejected) touches += 1;
      }
    }
    return touches;
  };
  
  const calcBreakoutDirection = (gravityCenter: number, top: number, bottom: number, touchesTop: number, touchesBottom: number): [string, number] => {
    const rangeHeight = top - bottom;
    const midPoint = (top + bottom) / 2;
    const gravityBias = (gravityCenter - midPoint) / (rangeHeight / 2);
    const touchBias = touchesTop > 0 || touchesBottom > 0 
      ? (touchesBottom - touchesTop) / Math.max(touchesTop + touchesBottom, 1) 
      : 0.0;
    const combinedBias = gravityBias * 0.6 + touchBias * 0.4;
    const confidence = Math.abs(combinedBias) * 100;
    const dir = combinedBias > 0.1 ? 'bullish' : combinedBias < -0.1 ? 'bearish' : 'neutral';
    return [dir, Math.min(confidence + 50, 100.0)];
  };
  
  const calcInstitutionalFootprint = (startBar: number, currentBar: number, top: number, bottom: number, candles: Candle[], avgVol: number): number => {
    let instScore = 0.0;
    let anomalyCount = 0;
    let totalAnomalyVol = 0.0;
    const lookback = Math.min(currentBar - startBar, 500);
    if (lookback > 0) {
      for (let i = 0; i < lookback; i++) {
        const idx = currentBar - i;
        if (idx < 0 || idx >= candles.length) continue;
        const c = candles[idx];
        if (c.high <= top && c.low >= bottom) {
          if (c.volume > avgVol * volAnomalyMult) {
            anomalyCount += 1;
            totalAnomalyVol += c.volume;
          }
        }
      }
    }
    const anomalyRatio = lookback > 0 ? anomalyCount / lookback * 100 : 0;
    const volIntensity = avgVol > 0 && anomalyCount > 0 ? totalAnomalyVol / (avgVol * anomalyCount) : 0;
    instScore = anomalyRatio * 0.5 + Math.min(volIntensity * 10, 50);
    return Math.min(instScore, 100.0);
  };
  
  const calcMaturityPhase = (duration: number): 'forming' | 'growth' | 'mature' | 'exhaustion' | 'none' => {
    if (duration < formingBars) return 'forming';
    if (duration < growthBars) return 'growth';
    if (duration < matureBars) return 'mature';
    return 'exhaustion';
  };
  
  const calcBreakoutQuality = (energy: number, instFootprint: number, phase: string, dirConfidence: number): number => {
    const phaseScore = phase === 'forming' ? 20.0 : phase === 'growth' ? 50.0 : phase === 'mature' ? 80.0 : 60.0;
    const quality = energy * 0.3 + instFootprint * 0.25 + phaseScore * 0.25 + dirConfidence * 0.2;
    return Math.min(quality, 100.0);
  };
  
  // Calculate average volume for institutional footprint
  const avgVol = calculateSMA(candles.map(c => c.volume), 20);
  
  // Range detection and energy calculation
  interface RangeZone {
    startBar: number;
    endBar: number;
    top: number;
    bottom: number;
    energy: number;
    phase: 'forming' | 'growth' | 'mature' | 'exhaustion' | 'none';
    direction: 'bullish' | 'bearish' | 'neutral' | 'none';
    dirConfidence: number;
    breakoutQuality: number;
    touchesTop: number;
    touchesBottom: number;
    gravityCenter: number;
    instFootprint: number;
    isActive: boolean;
    isBroken: boolean;
    breakDir: 'bullish' | 'bearish' | 'neutral' | 'none';
  }
  
  const rangeZones: RangeZone[] = [];
  let activeZone: RangeZone | null = null;
  let rangeHigh: number | null = null;
  let rangeLow: number | null = null;
  let rangeStartBar: number | null = null;
  let barsInRange = 0;
  
  // Indicator 3 results arrays
  const latentEnergies: number[] = [];
  const rangeTops: number[] = [];
  const rangeBottoms: number[] = [];
  const rangePhases: Array<'forming' | 'growth' | 'mature' | 'exhaustion' | 'none'> = [];
  const breakoutDirections: Array<'bullish' | 'bearish' | 'neutral' | 'none'> = [];
  const breakoutConfidences: number[] = [];
  const breakoutQualities: number[] = [];
  const isNewZones: boolean[] = [];
  const isImminentBreakouts: boolean[] = [];
  const isBreakoutUps: boolean[] = [];
  const isBreakoutDowns: boolean[] = [];
  
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const curAtr = atr[i] || 0;
    const curAvgVol = avgVol[i] || 0;
    
    // Lookback high/low (5 bars)
    let lookbackHigh = c.high;
    let lookbackLow = c.low;
    for (let j = Math.max(0, i - 4); j <= i; j++) {
      lookbackHigh = Math.max(lookbackHigh, candles[j].high);
      lookbackLow = Math.min(lookbackLow, candles[j].low);
    }
    
    const currentRange = lookbackHigh - lookbackLow;
    const isCompressed = currentRange < curAtr * rangeATRMult;
    
    // Range detection logic
    if (isCompressed) {
      if (rangeHigh === null) {
        rangeHigh = lookbackHigh;
        rangeLow = lookbackLow;
        rangeStartBar = Math.max(0, i - 4);
        barsInRange = 5;
      } else {
        if (c.high <= rangeHigh + curAtr * 0.1 && c.low >= rangeLow - curAtr * 0.1) {
          rangeHigh = Math.max(rangeHigh, c.high);
          rangeLow = Math.min(rangeLow, c.low);
          barsInRange += 1;
        } else {
          rangeHigh = null;
          rangeLow = null;
          barsInRange = 0;
        }
      }
    } else {
      if (rangeHigh !== null && barsInRange >= minBarsInRange) {
        if (activeZone) {
          activeZone.isActive = false;
          activeZone.endBar = i - 1;
        }
      }
      rangeHigh = null;
      rangeLow = null;
      barsInRange = 0;
    }
    
    const newZoneFormed = barsInRange === minBarsInRange && rangeHigh !== null;
    
    if (newZoneFormed && rangeHigh !== null && rangeLow !== null && rangeStartBar !== null) {
      const newZone: RangeZone = {
        startBar: rangeStartBar,
        endBar: i,
        top: rangeHigh,
        bottom: rangeLow,
        energy: 0,
        phase: 'none',
        direction: 'none',
        dirConfidence: 0,
        breakoutQuality: 0,
        touchesTop: 0,
        touchesBottom: 0,
        gravityCenter: (rangeHigh + rangeLow) / 2,
        instFootprint: 0,
        isActive: true,
        isBroken: false,
        breakDir: 'none',
      };
      
      if (activeZone && activeZone.isActive) {
        activeZone.isActive = false;
      }
      
      activeZone = newZone;
      rangeZones.push(newZone);
      
      // Keep only last 10 zones
      if (rangeZones.length > 10) {
        rangeZones.shift();
      }
    }
    
    // Update active zone
    if (activeZone && activeZone.isActive && rangeHigh !== null && rangeLow !== null) {
      const duration = i - activeZone.startBar;
      const rangeHeight = rangeHigh - rangeLow;
      const tolerance = rangeHeight * 0.1;
      
      if (c.high <= rangeHigh + tolerance && c.low >= rangeLow - tolerance) {
        activeZone.endBar = i;
        activeZone.top = rangeHigh;
        activeZone.bottom = rangeLow;
        
        activeZone.energy = calcLatentEnergy(duration, rangeHeight, curAtr);
        activeZone.gravityCenter = calcGravityCenter(rangeHigh, rangeLow, activeZone.startBar, i, candles);
        activeZone.touchesTop = countTouches(rangeHigh, tolerance, activeZone.startBar, i, true, candles);
        activeZone.touchesBottom = countTouches(rangeLow, tolerance, activeZone.startBar, i, false, candles);
        activeZone.instFootprint = calcInstitutionalFootprint(activeZone.startBar, i, rangeHigh, rangeLow, candles, curAvgVol);
        activeZone.phase = calcMaturityPhase(duration);
        
        const [dir, conf] = calcBreakoutDirection(
          activeZone.gravityCenter,
          rangeHigh,
          rangeLow,
          activeZone.touchesTop,
          activeZone.touchesBottom
        );
        activeZone.direction = dir as 'bullish' | 'bearish' | 'neutral';
        activeZone.dirConfidence = conf;
        activeZone.breakoutQuality = calcBreakoutQuality(
          activeZone.energy,
          activeZone.instFootprint,
          activeZone.phase,
          activeZone.dirConfidence
        );
      }
    }
    
    // Breakout detection
    let breakoutUp = false;
    let breakoutDn = false;
    if (activeZone && activeZone.isActive) {
      breakoutUp = c.close > activeZone.top;
      breakoutDn = c.close < activeZone.bottom;
      
      if (breakoutUp || breakoutDn) {
        activeZone.isActive = false;
        activeZone.isBroken = true;
        activeZone.breakDir = breakoutUp ? 'bullish' : 'bearish';
        activeZone.endBar = i;
      }
    }
    
    // Set indicator values
    if (activeZone && activeZone.isActive) {
      latentEnergies.push(activeZone.energy);
      rangeTops.push(activeZone.top);
      rangeBottoms.push(activeZone.bottom);
      rangePhases.push(activeZone.phase);
      breakoutDirections.push(activeZone.direction);
      breakoutConfidences.push(activeZone.dirConfidence);
      breakoutQualities.push(activeZone.breakoutQuality);
      isNewZones.push(false);
      isImminentBreakouts.push(
        activeZone.energy >= energyCriticalThresh && activeZone.breakoutQuality >= 70
      );
      isBreakoutUps.push(false);
      isBreakoutDowns.push(false);
    } else {
      // Check if we just formed a new zone
      const justFormed = newZoneFormed;
      latentEnergies.push(justFormed && activeZone ? activeZone.energy : 0);
      rangeTops.push(activeZone && activeZone.isActive ? activeZone.top : 0);
      rangeBottoms.push(activeZone && activeZone.isActive ? activeZone.bottom : 0);
      rangePhases.push(activeZone && activeZone.isActive ? activeZone.phase : 'none');
      breakoutDirections.push(activeZone && activeZone.isActive ? activeZone.direction : 'none');
      breakoutConfidences.push(activeZone && activeZone.isActive ? activeZone.dirConfidence : 0);
      breakoutQualities.push(activeZone && activeZone.isActive ? activeZone.breakoutQuality : 0);
      isNewZones.push(justFormed);
      isImminentBreakouts.push(false);
      isBreakoutUps.push(breakoutUp);
      isBreakoutDowns.push(breakoutDn);
    }
  }
  
  const latestEnergy = latentEnergies[latentEnergies.length - 1] || 0;
  console.log(`   ✅ Indicator 3 calculated: Energy=${latestEnergy?.toFixed(1)}, Active Zones=${rangeZones.filter(z => z.isActive).length}`);

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
      // Indicator 3: Latent Energy Reactor
      latentEnergy: latentEnergies[i] || 0,
      rangeTop: rangeTops[i] || 0,
      rangeBottom: rangeBottoms[i] || 0,
      rangePhase: rangePhases[i] || 'none',
      breakoutDirection: breakoutDirections[i] || 'none',
      breakoutConfidence: breakoutConfidences[i] || 0,
      breakoutQuality: breakoutQualities[i] || 0,
      isNewZone: isNewZones[i] || false,
      isImminentBreakout: isImminentBreakouts[i] || false,
      isBreakoutUp: isBreakoutUps[i] || false,
      isBreakoutDown: isBreakoutDowns[i] || false,
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
