import React, { useState, useEffect } from 'react';
import { MacroDashboardData, MacroIndicator } from '../services/macroService';
import { fetchMacroIndicators } from '../services/macroService';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Shield, RefreshCw, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export const MacroDashboard: React.FC = () => {
  const { t, language } = useTranslation();
  const [data, setData] = useState<MacroDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [expandedIndicators, setExpandedIndicators] = useState<Set<string>>(new Set());
  const [scoreExplanationExpanded, setScoreExplanationExpanded] = useState(false);

  const loadData = async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const dashboardData = await fetchMacroIndicators(forceRefresh);
      setData(dashboardData);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load macro indicators');
      console.error('Failed to load macro indicators:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load data on mount (will use cache if available and fresh)
    loadData(false);
    // Note: No auto-refresh interval - data is cached for 24 hours
    // Users can manually refresh if needed
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dry_powder':
        return <Shield size={16} className="text-blue-400" />;
      case 'active_exposure':
        return <Activity size={16} className="text-purple-400" />;
      case 'complacency':
        return <AlertTriangle size={16} className="text-yellow-400" />;
      case 'technical':
        return <TrendingUp size={16} className="text-green-400" />;
      default:
        return <Activity size={16} />;
    }
  };

  const getCategoryName = (category: string) => {
    if (language === 'zh') {
      switch (category) {
        case 'dry_powder': return '机构弹药监测';
        case 'active_exposure': return '活跃资金风险敞口';
        case 'complacency': return '市场自满度与对冲需求';
        case 'technical': return '技术性拥挤';
        default: return category;
      }
    } else {
      switch (category) {
        case 'dry_powder': return 'Institutional Dry Powder';
        case 'active_exposure': return 'Active Exposure';
        case 'complacency': return 'Complacency & Hedging';
        case 'technical': return 'Technical Extension';
        default: return category;
      }
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'danger':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'caution':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'safe':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getRiskLevelText = (level: string) => {
    if (language === 'zh') {
      switch (level) {
        case 'danger': return '危险区 (Fully Invested)';
        case 'caution': return '警戒区';
        case 'safe': return '安全区';
        default: return level;
      }
    } else {
      switch (level) {
        case 'danger': return 'Danger Zone (Fully Invested)';
        case 'caution': return 'Caution Zone';
        case 'safe': return 'Safe Zone';
        default: return level;
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-red-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getIndicatorStatusIcon = (status: string) => {
    switch (status) {
      case 'extreme_risk':
        return <XCircle size={14} className="text-red-400" />;
      case 'risk':
        return <AlertCircle size={14} className="text-yellow-400" />;
      case 'normal':
        return <CheckCircle2 size={14} className="text-green-400" />;
      default:
        return null;
    }
  };

  const formatValue = (indicator: MacroIndicator): string => {
    if (indicator.value === null) return 'N/A';
    return `${indicator.value.toFixed(2)}${indicator.unit}`;
  };

  if (loading && !data) {
    return (
      <div className="w-full bg-slate-900/50 rounded-lg p-6 border border-slate-800">
        <div className="flex items-center justify-center h-32">
          <RefreshCw size={20} className="text-slate-400 animate-spin" />
          <span className="ml-2 text-slate-400 text-sm">
            {language === 'zh' ? '加载宏观指标中...' : 'Loading macro indicators...'}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-slate-900/50 rounded-lg p-6 border border-slate-800">
        <div className="text-red-400 text-sm">{error}</div>
          <button
            onClick={() => loadData(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
          {language === 'zh' ? '重试' : 'Retry'}
        </button>
      </div>
    );
  }

  if (!data) return null;

  // Group indicators by category
  const groupedIndicators: Record<string, MacroIndicator[]> = data.indicators.reduce((acc, ind) => {
    if (!acc[ind.category]) {
      acc[ind.category] = [];
    }
    acc[ind.category].push(ind);
    return acc;
  }, {} as Record<string, MacroIndicator[]>);

  return (
    <div className="w-full bg-slate-900/50 rounded-lg border border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-blue-400" />
            <h3 className="text-lg font-bold text-white">
              {language === 'zh' ? '美股资金饱和度监测' : 'US Market Saturation Index'}
            </h3>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 text-xs disabled:opacity-50"
            title={language === 'zh' ? '强制刷新（将调用 Perplexity API）' : 'Force refresh (will call Perplexity API)'}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {language === 'zh' ? '强制刷新' : 'Force Refresh'}
          </button>
        </div>

        {/* Overall Score Card */}
        <div className={`p-4 rounded-lg border ${getRiskLevelColor(data.riskLevel)}`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div>
                  <div className="text-xs opacity-70 mb-1">
                    {language === 'zh' ? '综合风险评分' : 'Total Risk Score'}
                  </div>
                  <div className={`text-3xl font-bold ${getScoreColor(data.totalScore)}`}>
                    {data.totalScore.toFixed(1)} / 10.0
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-xs opacity-70 mb-1">
                    {language === 'zh' ? '风险等级' : 'Risk Level'}
                  </div>
                  <div className="text-lg font-semibold">
                    {getRiskLevelText(data.riskLevel)}
                  </div>
                </div>
              </div>
              
              {/* Score Calculation Explanation Toggle */}
              <button
                onClick={() => setScoreExplanationExpanded(!scoreExplanationExpanded)}
                className="flex items-center gap-1 text-xs text-slate-300 hover:text-white mt-2 transition-colors"
              >
                <Info size={12} />
                <span>{language === 'zh' ? '查看评分计算方法' : 'How is this score calculated?'}</span>
                {scoreExplanationExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              
              {/* Score Calculation Details */}
              {scoreExplanationExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-600/50">
                  <div className="text-xs text-slate-200 space-y-3">
                    <div>
                      <div className="font-semibold mb-1 text-slate-100">
                        {language === 'zh' ? '评分规则' : 'Scoring Rules'}
                      </div>
                      <div className="space-y-1 text-slate-300">
                        <div>• {language === 'zh' ? '每个指标根据当前值给出 0分、1分 或 2分' : 'Each indicator scores 0, 1, or 2 points based on current value'}</div>
                        <div className="ml-4 text-slate-400">
                          {language === 'zh' 
                            ? '0分 = 正常范围 | 1分 = 达到风险线 | 2分 = 达到极值线'
                            : '0 = Normal | 1 = Risk threshold reached | 2 = Extreme threshold reached'}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-semibold mb-1 text-slate-100">
                        {language === 'zh' ? '权重系统' : 'Weight System'}
                      </div>
                      <div className="space-y-1 text-slate-300">
                        {data.indicators.map((ind) => (
                          <div key={ind.id} className="text-[10px]">
                            • {language === 'zh' ? ind.nameZh : ind.name}: {(ind.weight * 100).toFixed(0)}% 
                            {ind.score > 0 && (
                              <span className="ml-2 text-yellow-400">
                                ({ind.score}分 × {(ind.weight * 100).toFixed(0)}% = {((ind.score * ind.weight * 10).toFixed(2))}分)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-semibold mb-1 text-slate-100">
                        {language === 'zh' ? '计算公式' : 'Calculation Formula'}
                      </div>
                      <div className="bg-slate-900/50 p-2 rounded text-[10px] font-mono text-slate-300">
                        {language === 'zh' 
                          ? '总分 = Σ(指标得分 × 指标权重 × 10)'
                          : 'Total Score = Σ(Indicator Score × Indicator Weight × 10)'}
                        <br />
                        <span className="text-slate-400 mt-1 block">
                          {language === 'zh' 
                            ? '例如：BofA现金(2分×20%) + NAAIM(1分×15%) + ... = 总分'
                            : 'Example: BofA Cash(2×20%) + NAAIM(1×15%) + ... = Total'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-semibold mb-1 text-slate-100">
                        {language === 'zh' ? '当前得分明细' : 'Current Score Breakdown'}
                      </div>
                      <div className="space-y-1">
                        {data.indicators
                          .filter(ind => ind.score > 0)
                          .map((ind) => (
                            <div key={ind.id} className="text-[10px] bg-slate-900/30 p-1.5 rounded">
                              <span className="text-slate-300">
                                {language === 'zh' ? ind.nameZh : ind.name}:
                              </span>
                              <span className="ml-2 text-yellow-400">
                                {ind.score}分 × {(ind.weight * 100).toFixed(0)}% = {((ind.score * ind.weight * 10).toFixed(2))}分
                              </span>
                              <span className="ml-2 text-slate-400">
                                ({formatValue(ind)})
                              </span>
                            </div>
                          ))}
                        {data.indicators.filter(ind => ind.score > 0).length === 0 && (
                          <div className="text-[10px] text-slate-400">
                            {language === 'zh' ? '所有指标均在正常范围' : 'All indicators are in normal range'}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-semibold mb-1 text-slate-100">
                        {language === 'zh' ? '风险等级划分' : 'Risk Level Classification'}
                      </div>
                      <div className="space-y-1 text-slate-300 text-[10px]">
                        <div>• <span className="text-green-400">0-4分</span>: {language === 'zh' ? '安全区 - 市场仍有空间，可能是底部区域' : 'Safe Zone - Market has room to grow'}</div>
                        <div>• <span className="text-yellow-400">5-7分</span>: {language === 'zh' ? '警戒区 - 市场开始过热，停止追高' : 'Caution Zone - Market overheating, avoid chasing'}</div>
                        <div>• <span className="text-red-400">8-10分</span>: {language === 'zh' ? '危险区 - 市场已完全满仓，建议止盈或买入保护' : 'Danger Zone - Market fully invested, consider protection'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Score Interpretation */}
          <div className="mt-3 text-xs opacity-80">
            {data.totalScore >= 8 && (
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-red-400 mt-0.5" />
                <span>
                  {language === 'zh' 
                    ? '⚠️ 危险区：市场已完全满仓，建议逐步止盈或买入保护性看跌期权'
                    : '⚠️ Danger Zone: Market is fully invested. Consider taking profits or buying protective puts'}
                </span>
              </div>
            )}
            {data.totalScore >= 5 && data.totalScore < 8 && (
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="text-yellow-400 mt-0.5" />
                <span>
                  {language === 'zh' 
                    ? '⚠️ 警戒区：市场开始过热，停止追高'
                    : '⚠️ Caution Zone: Market is overheating. Avoid chasing highs'}
                </span>
              </div>
            )}
            {data.totalScore < 5 && (
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-green-400 mt-0.5" />
                <span>
                  {language === 'zh' 
                    ? '✅ 安全区：市场仍有空间，可能是底部区域'
                    : '✅ Safe Zone: Market has room to grow, possibly near bottom'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-400">
          {language === 'zh' 
            ? `最后更新: ${new Date(data.lastUpdated).toLocaleString('zh-CN')}`
            : `Last updated: ${new Date(data.lastUpdated).toLocaleString('en-US')}`}
        </div>
      </div>

      {/* Indicators by Category */}
      <div className="p-4 space-y-6 max-h-[600px] overflow-y-auto">
        {Object.entries(groupedIndicators).map(([category, indicators]) => (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              {getCategoryIcon(category)}
              <h4 className="text-sm font-semibold text-slate-300">
                {getCategoryName(category)}
              </h4>
            </div>
            
            <div className="space-y-2">
              {indicators.map((indicator) => {
                const isExpanded = expandedIndicators.has(indicator.id);
                return (
                  <div
                    key={indicator.id}
                    className={`p-3 rounded-lg border ${
                      indicator.status === 'extreme_risk'
                        ? 'bg-red-500/10 border-red-500/20'
                        : indicator.status === 'risk'
                        ? 'bg-yellow-500/10 border-yellow-500/20'
                        : 'bg-slate-800/50 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getIndicatorStatusIcon(indicator.status)}
                          <span className="font-semibold text-white text-sm">
                            {language === 'zh' ? indicator.nameZh : indicator.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({indicator.weight * 100}%)
                          </span>
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedIndicators);
                              if (isExpanded) {
                                newExpanded.delete(indicator.id);
                              } else {
                                newExpanded.add(indicator.id);
                              }
                              setExpandedIndicators(newExpanded);
                            }}
                            className="ml-2 text-slate-400 hover:text-blue-400 transition-colors"
                            title={language === 'zh' ? '查看详细说明' : 'View details'}
                          >
                            <Info size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-4 text-xs mt-2">
                          <div className="text-slate-300">
                            <span className="text-slate-400">
                              {language === 'zh' ? '当前值: ' : 'Value: '}
                            </span>
                            <span className={`font-semibold ${
                              indicator.status === 'extreme_risk' ? 'text-red-400' :
                              indicator.status === 'risk' ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                              {formatValue(indicator)}
                            </span>
                          </div>
                          <div className="text-slate-400">
                            {language === 'zh' ? '风险线: ' : 'Risk: '}
                            <span className="text-yellow-400">{indicator.riskThreshold}{indicator.unit}</span>
                          </div>
                          <div className="text-slate-400">
                            {language === 'zh' ? '极值线: ' : 'Extreme: '}
                            <span className="text-red-400">{indicator.extremeThreshold}{indicator.unit}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] text-slate-500 space-y-1">
                          <div>
                            {language === 'zh' 
                              ? `数据源: ${indicator.dataSource} | 更新频率: ${indicator.updateFrequency}`
                              : `Source: ${indicator.dataSource} | Frequency: ${indicator.updateFrequency}`}
                          </div>
                          <div className={indicator.value === null ? 'text-yellow-400' : 'text-slate-400'}>
                            {language === 'zh' 
                              ? `数据获取时间: ${new Date(indicator.lastUpdate).toLocaleString('zh-CN', { 
                                  year: 'numeric', 
                                  month: '2-digit', 
                                  day: '2-digit', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}`
                              : `Data fetched: ${new Date(indicator.lastUpdate).toLocaleString('en-US', { 
                                  year: 'numeric', 
                                  month: '2-digit', 
                                  day: '2-digit', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}`}
                            {indicator.value === null ? (
                              <span className="ml-2 text-yellow-400">
                                ({language === 'zh' ? '数据不可用 - 请在 macroDataConfig.ts 中更新' : 'Data unavailable - Please update in macroDataConfig.ts'})
                              </span>
                            ) : indicator.dataSource.includes('手动配置') || indicator.dataSource.includes('Manual') ? (
                              <span className="ml-2 text-blue-400">
                                ({language === 'zh' ? '手动配置' : 'Manual config'})
                              </span>
                            ) : null}
                          </div>
                        </div>
                        
                        {/* Detailed Description */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-slate-700">
                            <div className="flex items-start gap-2 mb-2">
                              <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-slate-300 leading-relaxed">
                                {language === 'zh' ? indicator.descriptionZh : indicator.description}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedIndicators);
                                newExpanded.delete(indicator.id);
                                setExpandedIndicators(newExpanded);
                              }}
                              className="mt-2 text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                            >
                              <ChevronUp size={12} />
                              {language === 'zh' ? '收起' : 'Collapse'}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <div className={`text-lg font-bold ${
                          indicator.score === 2 ? 'text-red-400' :
                          indicator.score === 1 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {indicator.score}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {language === 'zh' ? '得分' : 'Score'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

