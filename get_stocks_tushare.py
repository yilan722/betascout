"""
使用tushare接口筛选A股优质标的
筛选条件：
1. 营收 > 3亿
2. ROE > 10% 或 净利润增长率 > 0%
3. 剔除ST股
4. 按市值排序，取前500
注意：净利润不需要>0
"""
import tushare as ts
import pandas as pd
import time

# 设置token
TUSHARE_TOKEN = "37255ab7622b653af54060333c28848e064585a8bf2ba3a85f8f3fe9"

def get_top_500_stocks():
    print("🚀 正在启动数据获取程序（使用tushare接口），请稍候...")
    
    try:
        # 初始化tushare
        print("正在初始化tushare...")
        ts.set_token(TUSHARE_TOKEN)
        pro = ts.pro_api()
        print("✅ tushare初始化成功\n")
        
        # 1. 获取股票基本信息（包含ST标记）
        print("1/4 正在获取A股股票基本信息...")
        stock_basic = pro.stock_basic(exchange='', list_status='L', fields='ts_code,symbol,name,area,industry,market,list_date')
        print(f"   ✅ 获取到 {len(stock_basic)} 只股票基本信息")
        
        # 剔除ST股
        stock_basic = stock_basic[~stock_basic['name'].str.contains('ST')]
        print(f"   ✅ 剔除ST股后剩余 {len(stock_basic)} 只股票\n")
        
        # 2. 获取最新交易日
        print("2/4 正在获取最新交易日和市值数据...")
        trade_cal = pro.trade_cal(exchange='SSE', start_date='20240101', end_date='20250101')
        trade_cal = trade_cal[trade_cal['is_open'] == 1]
        latest_trade_date = trade_cal['cal_date'].max()
        print(f"   ✅ 最新交易日: {latest_trade_date}")
        
        # 获取每日指标（包含总市值）
        daily_basic = pro.daily_basic(ts_code='', trade_date=latest_trade_date, fields='ts_code,trade_date,total_mv')
        print(f"   ✅ 获取到 {len(daily_basic)} 只股票的市值数据\n")
        
        # 3. 获取财务指标（ROE、营收、净利润等）
        print("3/4 正在获取财务指标数据...")
        # 使用fina_indicator接口，需要传入ts_code列表
        # 由于接口限制，我们分批获取，或者使用其他方法
        
        # 方法：使用利润表(income)和资产负债表(balancesheet)来获取数据
        # 先获取利润表数据（包含营收和净利润）
        print("   正在获取利润表数据（营收、净利润）...")
        income_2023 = pro.income_vip(period='20231231', fields='ts_code,end_date,revenue,n_income')
        print(f"   ✅ 获取到2023年报利润表数据 {len(income_2023)} 条")
        
        # 获取2024年最新季报
        income_2024 = None
        for period in ['20240930', '20240630', '20240331']:
            try:
                income_2024 = pro.income_vip(period=period, fields='ts_code,end_date,revenue,n_income')
                if len(income_2024) > 0:
                    print(f"   ✅ 获取到{period}季报利润表数据 {len(income_2024)} 条")
                    break
            except:
                continue
        
        # 合并利润表数据，优先使用最新数据
        if income_2024 is not None and len(income_2024) > 0:
            income_data = pd.concat([income_2023, income_2024])
            income_data = income_data.sort_values('end_date').drop_duplicates(subset=['ts_code'], keep='last')
        else:
            income_data = income_2023
        
        # 获取2022年利润表数据用于计算增长率
        print("   正在获取2022年利润表数据（计算增长率）...")
        income_2022 = pro.income_vip(period='20221231', fields='ts_code,n_income')
        print(f"   ✅ 获取到2022年报利润表数据 {len(income_2022)} 条")
        
        # 计算净利润增长率
        income_merge = pd.merge(income_data, income_2022, on='ts_code', suffixes=('_2023', '_2022'), how='inner')
        income_merge['net_profit_growth'] = ((income_merge['n_income_2023'] - income_merge['n_income_2022']) / 
                                            income_merge['n_income_2022'].abs() * 100)
        income_merge = income_merge[['ts_code', 'revenue', 'n_income_2023', 'net_profit_growth']]
        income_merge.rename(columns={'n_income_2023': 'net_profit'}, inplace=True)
        
        # 获取财务指标（ROE）
        print("   正在获取财务指标数据（ROE）...")
        # 由于fina_indicator需要ts_code，我们使用批量获取
        # 先获取所有股票的ts_code列表
        ts_codes = stock_basic['ts_code'].tolist()
        
        # 分批获取ROE数据（每批500只）
        fina_indicator_list = []
        batch_size = 500
        for i in range(0, len(ts_codes), batch_size):
            batch_codes = ts_codes[i:i+batch_size]
            try:
                # 尝试获取2023年报的ROE
                batch_data = pro.fina_indicator_vip(ts_code=','.join(batch_codes), period='20231231', fields='ts_code,roe')
                if len(batch_data) > 0:
                    fina_indicator_list.append(batch_data)
                time.sleep(0.3)  # 避免请求过快
            except Exception as e:
                print(f"   警告：批次 {i//batch_size + 1} 获取失败: {e}")
                continue
        
        if fina_indicator_list:
            fina_indicator = pd.concat(fina_indicator_list)
            print(f"   ✅ 获取到ROE数据 {len(fina_indicator)} 条")
        else:
            # 如果批量获取失败，创建一个空的DataFrame
            fina_indicator = pd.DataFrame(columns=['ts_code', 'roe'])
            print(f"   ⚠️ 无法获取ROE数据，将跳过ROE筛选条件")
        
        # 合并所有财务数据
        finance_data = pd.merge(income_merge, fina_indicator, on='ts_code', how='left')
        print(f"   ✅ 合并后财务数据 {len(finance_data)} 条\n")
        
        # 5. 数据合并与筛选
        print("5/5 正在进行数据合并与筛选...")
        
        # 合并所有数据
        # 先合并股票基本信息和市值
        result = pd.merge(stock_basic, daily_basic, left_on='ts_code', right_on='ts_code', how='inner')
        
        # 合并财务数据
        result = pd.merge(result, finance_data, on='ts_code', how='inner')
        
        # 填充缺失值
        result['net_profit_growth'] = result['net_profit_growth'].fillna(0)
        result['roe'] = result['roe'].fillna(0)
        
        # 数据清洗：转换为数值类型
        result['revenue'] = pd.to_numeric(result['revenue'], errors='coerce')
        result['roe'] = pd.to_numeric(result['roe'], errors='coerce')
        result['net_profit_growth'] = pd.to_numeric(result['net_profit_growth'], errors='coerce')
        result['total_mv'] = pd.to_numeric(result['total_mv'], errors='coerce')
        
        # 筛选条件：
        # 1. 营收 > 3亿 (单位：元，3亿 = 300,000,000)
        # 2. ROE > 10 或 净利润增长率 > 0
        # 注意：净利润不需要>0（已去掉此条件）
        
        condition_revenue = result['revenue'] > 300000000
        condition_roe = result['roe'] > 10
        condition_growth = result['net_profit_growth'] > 0
        # 如果ROE数据缺失，只使用增长率条件
        if result['roe'].isna().all():
            condition_filter = condition_revenue & condition_growth
            print("   ⚠️ ROE数据缺失，仅使用净利润增长率条件筛选")
        else:
            condition_filter = condition_revenue & (condition_roe | condition_growth)
        
        filtered = result[condition_filter].copy()
        print(f"   ✅ 筛选后剩余 {len(filtered)} 只股票")
        
        # 按市值排序
        filtered = filtered.sort_values('total_mv', ascending=False)
        
        # 取前500
        top_500 = filtered.head(500)
        
        # 格式化输出
        top_500['total_mv_yi'] = top_500['total_mv'] / 100000000  # 转为亿元
        top_500['revenue_yi'] = top_500['revenue'] / 100000000  # 转为亿元
        
        # 保存到Excel
        output_file = "A股优质筛选Top500_tushare.xlsx"
        columns_to_save = ['ts_code', 'symbol', 'name', 'industry', 'total_mv_yi', 'revenue_yi', 'roe', 'net_profit_growth']
        top_500[columns_to_save].to_excel(output_file, index=False)
        
        print(f"\n✅ 筛选完成！")
        print(f"共筛选出符合条件的优质公司 {len(top_500)} 只。")
        print(f"文件已保存为: {output_file}\n")
        
        # 显示前50名
        print("=" * 100)
        print("前50名标的预览:")
        print("=" * 100)
        display_cols = ['symbol', 'name', 'industry', 'total_mv_yi', 'roe', 'net_profit_growth']
        print(top_500[display_cols].head(50).to_string(index=False))
        
        # 生成用于添加的列表格式
        print("\n" + "=" * 100)
        print("标的列表（用于添加到代码，前100名）:")
        print("=" * 100)
        
        for idx, row in top_500.head(100).iterrows():
            code = str(row['symbol']).zfill(6)
            name = row['name']
            industry = row['industry'] if pd.notna(row['industry']) else '待分类'
            market_cap = '大市值' if row['total_mv_yi'] > 500 else '中市值'
            exchange = 'SS' if code.startswith('6') else 'SZ'
            
            print(f"  {{ id: '{code}', symbol: '{code}', name: '{name}', category: AssetCategory.CN_A_SHARES, yahooSymbol: '{code}.{exchange}', industry: '{industry}', marketCap: '{market_cap}' }},")
        
        return top_500
        
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = get_top_500_stocks()

