
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { IndianRupee, Eye, MousePointerClick, TrendingUp, BarChart2, Target, LayoutGrid, Info, Download, RefreshCw, Search, FileText } from 'lucide-react';
import { MetricCard } from '../common/MetricCard';
import { extractValidDate, exportToExcel } from '../../utils/dataHelpers';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1C1F26] border border-[#32363F] p-3 rounded-lg shadow-xl">
        <p className="text-[#888] text-[11px] mb-2 font-medium">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <span style={{ color: entry.color }} className="text-[12px] font-semibold">
              {entry.name}:
            </span>
            <span style={{ color: entry.color }} className="text-[12px] font-bold">
              {entry.name.toLowerCase().includes('ctr') ? `${entry.value.toFixed(2)}%` : 
               entry.name.toLowerCase().includes('spend') || entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('cpc') || entry.name.toLowerCase().includes('cpm') ? 
               `₹${Number(entry.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 
               Number(entry.value).toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ProductAds({
  cardMetrics,
  setCardMetrics,
  metrics,
  formatNum,
  timeline,
  handleTimelineChange,
  graphData,
  tableData,
  tableHeaders,
  getHeaderStyle,
  getCellClassName,
  getCellStyle,
  showLowPerforming,
  setShowLowPerforming,
  searchQuery,
  setSearchQuery,
  formatCellValue,
  handleRefresh,
  setSelectedCampaign,
  metricChanges
}) {

  // Compute the actual visible table data (respecting Low Performing filter)
  const visibleTableData = showLowPerforming
    ? tableData.filter(row => {
        const roasVal = parseFloat(row['ROAS'] || row['roas'] || row['Roas'] || 999);
        return roasVal < 2;
      })
    : tableData;

  return (
    <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cardMetrics.map((cm, idx) => {
          const CARD_STYLES = {
            adSpend:     { icon: <IndianRupee className="w-5 h-5" />, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
            impressions: { icon: <Eye className="w-5 h-5" />, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
            clicks:      { icon: <MousePointerClick className="w-5 h-5" />, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
            ctr:         { icon: <TrendingUp className="w-5 h-5" />, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
            cpm:         { icon: <BarChart2 className="w-5 h-5" />, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
            cpc:         { icon: <Target className="w-5 h-5" />, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
            adRevenue:   { icon: <IndianRupee className="w-5 h-5" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            roas:        { icon: <TrendingUp className="w-5 h-5" />, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
            orders:      { icon: <LayoutGrid className="w-5 h-5" />, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          };
          const TOOLTIPS = {
            adSpend: 'The total charges for clicks across all campaigns.',
            impressions: 'The total number of times your ads were shown to users.',
            clicks: 'The total number of clicks your ads received.',
            ctr: 'Click-Through Rate (Clicks / Impressions × 100).',
            cpm: 'Cost Per Mille — cost per 1,000 impressions.',
            cpc: 'Cost Per Click — average cost per click.',
            adRevenue: 'Total revenue generated from your ads.',
            roas: 'Return On Ad Spend — revenue earned per rupee spent.',
            orders: 'Total number of orders attributed to your ads.',
          };
          const style = CARD_STYLES[cm.key] || CARD_STYLES.adSpend;
          return (
            <MetricCard
              key={idx}
              title={cm.label}
              metricKey={cm.key}
              value={formatNum(metrics[cm.key], cm.isCurrency, cm.isPercentage)}
              icon={style.icon}
              color={style.color}
              bg={style.bg}
              border={style.border}
              tooltip={TOOLTIPS[cm.key]}
              allMetrics={metrics}
              formatNum={formatNum}
              usedKeys={cardMetrics.map(c => c.key)}
              change={metricChanges?.[cm.key]}
              onMetricChange={(opt) => {
                setCardMetrics(prev => {
                  const updated = [...prev];
                  updated[idx] = opt;
                  return updated;
                });
              }}
            />
          );
        })}
      </div>

      {/* PERFORMANCE SUMMARY CHART */}
      <div className="mt-5 bg-[#22252B] border border-border rounded-xl p-6 relative">
        <div className="flex justify-between items-center mb-6">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <h3 className="text-[13px] font-bold text-white tracking-widest uppercase">PERFORMANCE SUMMARY</h3>
                <Info className="w-4 h-4 text-text-muted" />
              </div>
              
              {/* TIMELINE TOGGLE */}
              <div className="flex items-center gap-1 bg-[#1C1F26] border border-border p-0.5 rounded-lg">
                {['D', 'W', 'M'].map(t => (
                  <button 
                    key={t}
                    onClick={() => handleTimelineChange(t)}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${timeline === t ? 'bg-blue-600 text-white shadow-md' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
           </div>
           
           <button onClick={() => exportToExcel(graphData, 'ProductAds_Performance_Summary')} className="p-1.5 border border-border rounded-md hover:bg-white/5 text-text-muted transition-colors">
              <Download className="w-4 h-4" />
           </button>
        </div>

        {/* Legend & Info Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f97316]"></div>
              <span className="text-xs text-gray-400">{cardMetrics[0]?.label || 'Ad Spend'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#a855f7]"></div>
              <span className="text-xs text-gray-400">{cardMetrics[1]?.label || 'Ad Impressions'}</span>
            </div>
          </div>
          <div className="text-xs text-text-muted">
            {graphData.length > 0 && (
              <span>{graphData.length} data points · {timeline === 'D' ? 'Daily' : timeline === 'W' ? 'Weekly' : 'Monthly'} view</span>
            )}
          </div>
        </div>

        <div className="h-[300px] w-full">
          {graphData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graphData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid stroke="#3A3F4B" vertical={true} horizontal={true} />
                <XAxis 
                  dataKey="name" 
                  stroke="#ffffff40" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  dy={15}
                />
                <YAxis 
                  stroke="#ffffff40" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => {
                    if (value >= 100000) return `${(value/100000).toFixed(1).replace('.0', '')} L`;
                    if (value >= 1000) return `${(value/1000).toFixed(0)} K`;
                    return Number(value).toFixed(value < 10 ? 2 : 0);
                  }}
                  label={{ value: cardMetrics[0]?.label || 'Ad Spend', angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle', fill: '#f97316', fontWeight: 600, fontSize: 11 } }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#ffffff40" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => {
                    if (value >= 100000) return `${(value/100000).toFixed(1).replace('.0', '')} L`;
                    if (value >= 1000) return `${(value/1000).toFixed(0)} K`;
                    return Number(value).toFixed(value < 10 ? 2 : 0);
                  }}
                  label={{ value: cardMetrics[1]?.label || 'Ad Impressions', angle: 90, position: 'insideRight', offset: 10, style: { textAnchor: 'middle', fill: '#a855f7', fontWeight: 600, fontSize: 11 } }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey={cardMetrics[0]?.key || 'adSpend'} 
                  name={cardMetrics[0]?.label || 'Ad Spend'}
                  stroke="#f97316" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#f97316', stroke: '#1C1F26', strokeWidth: 2 }}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey={cardMetrics[1]?.key || 'impressions'} 
                  name={cardMetrics[1]?.label || 'Impressions'}
                  stroke="#a855f7" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#a855f7', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#a855f7', stroke: '#1C1F26', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
              <BarChart2 className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">No timeline data available</p>
            </div>
          )}
        </div>
      </div>

      {/* PERFORMANCE DATA TABLE */}
      <div className="mt-12 bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Table Header / Filters */}
        <div className="px-6 py-5 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1C1F26]">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-wider">PERFORMANCE DATA</h3>
            <div title="Detailed row-level data. Click a campaign name to view its specific analytics." className="cursor-help flex items-center">
              <Info className="w-4 h-4 text-text-muted hover:text-white transition-colors" />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-white">
              {visibleTableData.length} records
            </span>
            
            <div className="flex items-center gap-2">
               <button onClick={handleRefresh} className="p-2 rounded-md border border-border hover:bg-white/5 text-text-muted hover:text-white transition-colors">
                 <RefreshCw className="w-4 h-4" />
               </button>
               <button onClick={() => exportToExcel(visibleTableData, 'ProductAds_Performance_Data')} className="p-2 rounded-md border border-border hover:bg-white/5 text-text-muted hover:text-white transition-colors">
                 <Download className="w-4 h-4" />
               </button>
            </div>

            {/* Low Performing Toggle integrated inline */}
            <button 
              onClick={() => setShowLowPerforming(!showLowPerforming)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${showLowPerforming ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-500/20' : 'bg-red-950/30 border-red-500/30 text-red-400 hover:bg-red-950/50 hover:border-red-500/50'}`}
            >
              ⚠ Low Performing
            </button>
            
            <div className="relative group">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search Records"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm w-64 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder:text-text-muted"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="overflow-auto w-full max-h-[600px] border-t border-border rounded-b-xl">
            {tableData.length > 0 ? (
              <table className="w-full text-left border-collapse min-w-max">
                <thead className="bg-[#22252B] text-text-muted text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3 border-b border-r border-white/10 bg-[#22252B]" style={{ position: 'sticky', top: 0, left: 0, zIndex: 30, minWidth: 50, maxWidth: 50 }}>
                      <input type="checkbox" className="rounded border-border bg-transparent focus:ring-primary focus:ring-offset-surface cursor-pointer" />
                    </th>
                    {tableHeaders.map((header, idx) => (
                      <th key={idx} className="px-4 py-3 border-b border-r border-white/10 whitespace-nowrap bg-[#22252B]" style={getHeaderStyle(header)}>
                         {header}
                      </th>
                    ))}
                    <th className="px-4 py-3 border-b border-white/10 bg-[#22252B] shadow-[-4px_0_10px_-5px_rgba(0,0,0,0.5)] border-l" style={{ position: 'sticky', top: 0, right: 0, zIndex: 30 }}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-sm text-text-main bg-[#1C1F26]">
                  {tableData.slice(0, 100).map((row, idx) => {
                    const roasVal = parseFloat(row['ROAS'] || row['roas'] || row['Roas'] || 999);
                    const isLowRoas = roasVal < 2;
                    
                    if (showLowPerforming && !isLowRoas) return null;

                    return (
                      <tr key={idx} className={`hover:bg-[#32363F]/40 transition-colors group ${isLowRoas ? 'bg-red-950/40' : ''}`}>
                        <td className="px-4 py-3 border-r border-white/10 whitespace-nowrap bg-[#1C1F26] group-hover:bg-[#2A2D35] transition-colors" style={{ position: 'sticky', left: 0, zIndex: 10, minWidth: 50, maxWidth: 50 }}>
                          <input type="checkbox" className="rounded border-border bg-transparent focus:ring-primary focus:ring-offset-surface cursor-pointer" />
                        </td>
                        
                        {tableHeaders.map((header, colIdx) => {
                          const lowerHeader = header.toLowerCase();
                          const val = row[header];
                          const cClass = getCellClassName(header);
                          const cStyle = getCellStyle(header);

                          if (lowerHeader === 'status') {
                            const statusStr = val ? val.toString() : 'Unknown';
                            const isPaused = statusStr.toLowerCase().includes('pause') || statusStr.toLowerCase().includes('stop');
                            return (
                              <td key={colIdx} className={cClass} style={cStyle}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                                  <span className={`text-xs font-medium ${isPaused ? 'text-red-500' : 'text-emerald-500'}`}>{statusStr}</span>
                                </div>
                              </td>
                            );
                          }

                          if (lowerHeader.includes('campaign') || lowerHeader === 'name') {
                            return (
                              <td key={colIdx} className={cClass} style={cStyle}>
                                <span 
                                  className="text-primary hover:text-blue-400 cursor-pointer hover:underline decoration-blue-400/50 underline-offset-4 transition-all inline-block font-medium"
                                  onClick={() => {
                                    const rawHeaders = Object.keys(row);
                                    const campaignHeader = rawHeaders.find(h => h.toLowerCase().includes('campaign') || h.toLowerCase() === 'name');
                                    const dateHeader = rawHeaders.find(h => h.toLowerCase().includes('date') || h.toLowerCase() === 'day');
                                    const statusHeader = rawHeaders.find(h => h.toLowerCase() === 'status');
                                    
                                    setSelectedCampaign({
                                      name: row[campaignHeader],
                                      rowDate: row[dateHeader],
                                      status: row[statusHeader] || 'Unknown',
                                      campCol: campaignHeader
                                    });
                                  }}
                                >
                                  {val ? val.toString() : 'Unknown'}
                                </span>
                              </td>
                            );
                          }

                          return (
                            <td key={colIdx} className={cClass} style={cStyle}>
                              {formatCellValue(val, header)}
                            </td>
                          );
                        })}

                        <td className="px-4 py-3 whitespace-nowrap text-right bg-[#1C1F26] group-hover:bg-[#2A2D35] transition-colors shadow-[-4px_0_10px_-5px_rgba(0,0,0,0.5)] border-l border-white/10" style={{ position: 'sticky', right: 0, zIndex: 10 }}>
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => {
                                const rawKeys = Object.keys(row);
                                const campHeader = rawKeys.find(h => h.toLowerCase().includes('campaign') || h.toLowerCase() === 'name');
                                const statusHeader = rawKeys.find(h => h.toLowerCase() === 'status');
                                const rowDate = extractValidDate(row);
                                setSelectedCampaign({
                                  name: campHeader ? row[campHeader] : 'Unknown Campaign',
                                  status: statusHeader ? row[statusHeader] : 'Active',
                                  campCol: campHeader,
                                  rowDate
                                });
                              }}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <BarChart2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <FileText className="w-12 h-12 text-text-muted/30 mb-4" />
                <p className="text-text-muted text-sm max-w-sm">
                  No matching records found. 
                  {searchQuery ? " Try adjusting your search." : " Please ensure your date range encompasses the uploaded data."}
                </p>
              </div>
            )}
          </div>
      </div>
    </main>
  );
}
