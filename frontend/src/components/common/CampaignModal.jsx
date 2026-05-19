import React, { useState, useEffect, useRef } from 'react';
import { format, subDays, startOfMonth, subMonths } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Info, Calendar, RefreshCw, Download, Target, Search, FileText, IndianRupee, Eye, MousePointerClick, BarChart2, LayoutGrid, X } from 'lucide-react';
import CustomCalendar from '../../CustomCalendar';
import { extractValidDate, findVal, exportToExcel } from '../../utils/dataHelpers';
import { MetricCard } from './MetricCard';

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

// Campaign Analytics Modal Component
export function CampaignModal({
  campaign,
  onClose,
  allData: initialAllData,
  datasetMaxDate,
  formatNum,
  fileName
}) {

  const modalData = React.useMemo(() => initialAllData || [], [initialAllData]);
  const [timeline, setTimeline] = useState('D');
  const modalAnchorDate = campaign?.rowDate || datasetMaxDate || new Date();

  const [dateRange, setDateRange] = useState({
    from: subDays(modalAnchorDate, 6),
    to: modalAnchorDate
  });
  const [modalCalendarOpen, setModalCalendarOpen] = useState(false);
  const calendarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setModalCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [showLowPerforming, setShowLowPerforming] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  const [cardMetrics, setCardMetrics] = useState([
    { key: 'adSpend', label: 'Ad Spend', isCurrency: true },
    { key: 'impressions', label: 'Ad Impressions' },
    { key: 'clicks', label: 'Clicks' },
    { key: 'ctr', label: 'CTR', isPercentage: true },
    { key: 'cpm', label: 'CPM', isCurrency: true },
    { key: 'cpc', label: 'CPC', isCurrency: true },
  ]);




  const handleRefresh = () => {
    // Optional refresh logic for modal
  };

  const campaignData = React.useMemo(() => {
    const filtered = modalData.filter(row => {
      // Robust column search: try the passed colKey first, then common campaign name keywords
      const colKey = campaign.campCol;
      let rowName = colKey ? row[colKey] : null;
      
      if (!rowName) {
        let foundKey = Object.keys(row).find(k => k.toLowerCase() === 'campaign name' || k.toLowerCase() === 'campaign');
        if (!foundKey) {
          foundKey = Object.keys(row).find(k => k.toLowerCase().includes('campaign'));
        }
        if (!foundKey) {
          foundKey = Object.keys(row).find(k => k.toLowerCase().includes('name') && !k.toLowerCase().includes('product'));
        }
        if (foundKey) rowName = row[foundKey];
      }
      
      return rowName?.toString().trim().toLowerCase() === campaign.name?.toString().trim().toLowerCase();
    });

    // Forgiving fallback: If no rows match (e.g. single-campaign file with mismatched or missing name column),
    // assume the entire dataset is intended for this modal.
    return filtered.length > 0 ? filtered : modalData;
  }, [modalData, campaign]);



  const chartFiltered = React.useMemo(() => {
    if (!dateRange.from || !dateRange.to) return campaignData;
    return campaignData.filter(row => {
      const rowDate = extractValidDate(row);
      if (!rowDate) return false;
      const rd = new Date(rowDate).setHours(0, 0, 0, 0);
      const start = new Date(dateRange.from).setHours(0, 0, 0, 0);
      const end = new Date(dateRange.to).setHours(23, 59, 59, 999);
      return rd >= start && rd <= end;
    });
  }, [campaignData, dateRange]);

  let spend = 0, impressions = 0, clicks = 0, revenue = 0, orders = 0, roasWeighted = 0;
  chartFiltered.forEach(row => {
    const rowSpend = findVal(row, ['ad spend', 'adspend', 'spend', 'cost', 'amount spent'], ['revenue']);
    spend += rowSpend;
    impressions += findVal(row, ['impression', 'impr']);
    clicks += findVal(row, ['click'], ['ctr', 'clickthrough']);
    orders += findVal(row, ['order', 'units sold', 'sku', 'conversions'], ['order id']);

    const directRevenue = findVal(row, ['ad revenue', 'adrevenue', 'revenue', 'sale amount'], ['roas']);
    const directRoas = findVal(row, ['roas', 'return on ad spend']);

    if (directRevenue > 0) {
      revenue += directRevenue;
    } else if (directRoas > 0 && rowSpend > 0) {
      revenue += directRoas * rowSpend;
    }

    if (directRoas > 0) {
      roasWeighted += directRoas * rowSpend;
    }
  });

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cpc = clicks > 0 ? spend / clicks : 0;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const roas = spend > 0 ? (roasWeighted > 0 ? roasWeighted / spend : revenue / spend) : 0;

  const metrics = {
    adSpend: spend,
    impressions,
    clicks,
    ctr,
    cpm,
    cpc,
    adRevenue: revenue,
    roas,
    orders
  };

  const graphDataMap = new Map();
  chartFiltered.forEach(row => {
    const d = extractValidDate(row);
    if (!d) return;
    let key;
    let sortDate;
    if (timeline === 'M') {
      const start = startOfMonth(d);
      key = format(start, 'MMM yyyy');
      sortDate = start.getTime();
    } else if (timeline === 'W') {
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay());
      key = format(start, 'MM/dd') + ' (W)';
      sortDate = start.getTime();
    } else {
      key = format(d, 'MM/dd');
      sortDate = new Date(d).setHours(0, 0, 0, 0);
    }

    if (!graphDataMap.has(key)) {
      graphDataMap.set(key, { name: key, adSpend: 0, impressions: 0, clicks: 0, adRevenue: 0, orders: 0, _roasWeighted: 0, sortDate });
    }
    const curr = graphDataMap.get(key);

    const rowSpend = findVal(row, ['ad spend', 'adspend', 'spend', 'cost', 'amount spent'], ['revenue']);
    curr.adSpend += rowSpend;
    curr.impressions += findVal(row, ['impression', 'impr']);
    curr.clicks += findVal(row, ['click'], ['ctr', 'clickthrough']);
    curr.orders += findVal(row, ['order', 'units sold', 'sku', 'conversions'], ['order id']);

    const directRevenue = findVal(row, ['ad revenue', 'adrevenue', 'revenue', 'sale amount'], ['roas']);
    const directRoas = findVal(row, ['roas', 'return on ad spend']);

    if (directRevenue > 0) curr.adRevenue += directRevenue;
    else if (directRoas > 0 && rowSpend > 0) curr.adRevenue += directRoas * rowSpend;

    if (directRoas > 0) curr._roasWeighted += directRoas * rowSpend;
  });

  const graphData = Array.from(graphDataMap.values()).map(entry => {
    entry.ctr = entry.impressions > 0 ? (entry.clicks / entry.impressions) * 100 : 0;
    entry.cpm = entry.impressions > 0 ? (entry.adSpend / entry.impressions) * 1000 : 0;
    entry.cpc = entry.clicks > 0 ? (entry.adSpend / entry.clicks) : 0;
    entry.roas = entry.adSpend > 0 ? (entry._roasWeighted > 0 ? entry._roasWeighted / entry.adSpend : entry.adRevenue / entry.adSpend) : 0;
    return entry;
  }).sort((a, b) => a.sortDate - b.sortDate);

  const rawHeaders = chartFiltered.length > 0 ? Object.keys(chartFiltered[0]) : [];
  const dateCol = rawHeaders.find(h => h.toLowerCase().includes('date') || h.toLowerCase() === 'day');
  const prodCol = rawHeaders.find(h => h.toLowerCase().includes('product') || h.toLowerCase().includes('item') || h.toLowerCase().includes('sku') || h.toLowerCase().includes('asin'));
  const brandCol = rawHeaders.find(h => h.toLowerCase().includes('brand'));
  const statusCol = rawHeaders.find(h => h.toLowerCase() === 'status');
  const campCol = rawHeaders.find(h => h.toLowerCase().includes('campaign') || h.toLowerCase() === 'name');

  const orderedHeaders = [dateCol, prodCol, brandCol, statusCol].filter(Boolean);
  rawHeaders.forEach(h => {
    if (!orderedHeaders.includes(h) && h !== campCol) orderedHeaders.push(h);
  });

  const tableHeaders = orderedHeaders.filter(h => {
    const lh = h.toLowerCase();
    return !(lh.includes('order') && lh.includes('sku'));
  });

  const stickyColumns = {
    checkbox: { width: 50, left: 0 },
    date: { width: 110 },
    product: { width: 220 },
    brand: { width: 150 },
    status: { width: 100 }
  };

  let currentLeft = 50;
  const stickyStyles = {};
  [dateCol, prodCol, brandCol, statusCol].forEach(col => {
    if (col) {
      const type = col === dateCol ? 'date' : col === prodCol ? 'product' : col === brandCol ? 'brand' : 'status';
      stickyStyles[col] = {
        position: 'sticky',
        left: currentLeft,
        minWidth: stickyColumns[type].width,
        maxWidth: stickyColumns[type].width,
        zIndex: 10
      };
      currentLeft += stickyColumns[type].width;
    }
  });

  const getHeaderStyle = (header) => {
    if (stickyStyles[header]) return { ...stickyStyles[header], backgroundColor: '#22252B', zIndex: 30, top: 0 };
    return { position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#22252B' };
  };

  const getCellClassName = (header) => {
    const isSticky = !!stickyStyles[header];
    const isLastSticky = header === (statusCol || prodCol || dateCol);
    return `px-4 py-3 whitespace-nowrap text-[13px] text-gray-300 transition-colors border-r border-white/10 ${isSticky ? 'bg-[#1C1F26] group-hover:bg-[#2A2D35]' : ''} ${isLastSticky ? 'shadow-[4px_0_10px_-5px_rgba(0,0,0,0.5)] border-r-white/20' : ''}`;
  };

  const getCellStyle = (header) => stickyStyles[header] || {};

  let tableData = chartFiltered;
  if (modalSearchQuery) {
    const query = modalSearchQuery.toLowerCase();
    tableData = tableData.filter(row => {
      return Object.values(row).some(val => val && val.toString().toLowerCase().includes(query));
    });
  }

  // Apply Low Performing filter for download and record count
  const visibleTableData = showLowPerforming
    ? tableData.filter(row => {
        const roasVal = parseFloat(row['ROAS'] || row['roas'] || row['Roas'] || 999);
        return roasVal < 2;
      })
    : tableData;

  const formatCellValue = (val, header) => {
    if (val === null || val === undefined || val === '') return '-';
    if (val instanceof Date) return format(val, 'dd MMM yyyy');

    if (!isNaN(val) && val !== '') {
      const num = Number(val);
      const lowerHeader = header.toLowerCase();

      if ((lowerHeader.includes('date') || lowerHeader.includes('day')) && num > 30000 && num < 60000) {
        const d = new Date((num - 25569) * 86400 * 1000);
        return format(d, 'dd MMM yyyy');
      }

      if (lowerHeader.includes('spend') || lowerHeader.includes('cost') || lowerHeader.includes('revenue') || lowerHeader.includes('cpc') || lowerHeader.includes('cpm') || lowerHeader.includes('budget')) {
        return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
      }
      if (lowerHeader.includes('ctr') || lowerHeader.includes('%')) {
        if (num <= 1 && lowerHeader.includes('ctr')) return `${(num * 100).toFixed(2)}%`;
        return `${num.toFixed(2)}%`;
      }
      return Number.isInteger(num) ? num.toLocaleString('en-IN') : num.toFixed(2);
    }
    return val.toString();
  };

  const handleTimelineChange = (t) => {
    setTimeline(t);
    if (t === 'D') setDateRange({ from: subDays(modalAnchorDate, 6), to: modalAnchorDate });
    else if (t === 'W') setDateRange({ from: subDays(modalAnchorDate, 27), to: modalAnchorDate });
    else if (t === 'M') setDateRange({ from: subMonths(modalAnchorDate, 11), to: modalAnchorDate });
  };

  if (!campaign) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto flex flex-col font-sans text-text-main">
      {/* HEADER */}
      <div className="h-20 border-b border-border bg-surface/80 backdrop-blur-md px-6 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${campaign.status.toLowerCase().includes('pause') ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
          <div className="text-left leading-tight">
            <p className="text-[13px] text-text-muted font-normal truncate max-w-[300px]">
              {fileName ? fileName.replace(/\.[^/.]+$/, "") : 'Select Data Source'}
            </p>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
              {campaign.name} <span className="text-text-muted hover:text-white cursor-pointer ml-1 text-sm">✎</span>
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-white bg-white/5 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-gray-300 font-medium">Campaign Performance for selected date range</h3>

          <div className="flex items-center gap-4">


            {/* Calendar / Date Range from Main Dashboard */}
            <div className="relative" ref={calendarRef}>
              <button
                onClick={() => setModalCalendarOpen(!modalCalendarOpen)}
                className="flex items-center gap-2 bg-surface border border-border px-4 py-2.5 rounded-lg hover:border-text-muted transition-colors text-sm font-medium"
              >
                <Calendar className="w-4 h-4 text-text-muted" />
                <span>
                  {dateRange?.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                    ) : (
                      format(dateRange.from, "MMM d, yyyy")
                    )
                  ) : (
                    <span>All Time</span>
                  )}
                </span>
              </button>
              <CustomCalendar
                isOpen={modalCalendarOpen}
                onClose={() => setModalCalendarOpen(false)}
                dateRange={dateRange}
                onDateChange={(range) => setDateRange(range)}
                anchorDate={modalAnchorDate}
              />
            </div>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:bg-white/5 transition-colors text-text-muted hover:text-white"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {cardMetrics.map((cm, idx) => {
            const CARD_STYLES = {
              adSpend: { icon: <IndianRupee className="w-5 h-5" />, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
              impressions: { icon: <Eye className="w-5 h-5" />, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
              clicks: { icon: <MousePointerClick className="w-5 h-5" />, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
              ctr: { icon: <TrendingUp className="w-5 h-5" />, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
              cpm: { icon: <BarChart2 className="w-5 h-5" />, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
              cpc: { icon: <Target className="w-5 h-5" />, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
              adRevenue: { icon: <IndianRupee className="w-5 h-5" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
              roas: { icon: <TrendingUp className="w-5 h-5" />, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
              orders: { icon: <LayoutGrid className="w-5 h-5" />, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
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
                key={`modal-card-${idx}`}
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

        {/* GRAPH SECTION */}
        <div className="bg-[#22252B] border border-border rounded-xl p-6 relative mt-6">
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
            <button onClick={() => exportToExcel(graphData, 'CampaignModal_Performance_Summary')} className="p-1.5 border border-border rounded-md hover:bg-white/5 text-text-muted transition-colors">
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
                <LineChart data={graphData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
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
                      if (value >= 100000) return `${(value / 100000).toFixed(1).replace('.0', '')} L`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)} K`;
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
                      if (value >= 100000) return `${(value / 100000).toFixed(1).replace('.0', '')} L`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)} K`;
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
          <div className="px-6 py-5 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1C1F26]">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-wider">PERFORMANCE DATA</h3>
              <div title="Detailed row-level data for this specific campaign." className="cursor-help flex items-center">
                <Info className="w-4 h-4 text-text-muted hover:text-white transition-colors" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-white">
                {visibleTableData.length} records
              </span>

              <div className="flex items-center gap-2">
                <button className="p-2 rounded-md border border-border hover:bg-white/5 text-text-muted hover:text-white transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={() => exportToExcel(visibleTableData, 'Campaign_Performance_Data')} className="p-2 rounded-md border border-border hover:bg-white/5 text-text-muted hover:text-white transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>

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
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="bg-transparent border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm w-64 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-white placeholder:text-text-muted"
                />
              </div>
            </div>
          </div>
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
                  {tableData.slice(0, 50).map((row, idx) => {
                    const roasVal = parseFloat(row['ROAS'] || row['roas'] || row['Roas'] || 999);
                    const isLowRoas = roasVal < 2;
                    // If filter is ON, only show low performing rows
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

                          return (
                            <td key={colIdx} className={cClass} style={cStyle}>
                              {formatCellValue(val, header)}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 whitespace-nowrap text-right bg-[#1C1F26] group-hover:bg-[#2A2D35] transition-colors shadow-[-4px_0_10px_-5px_rgba(0,0,0,0.5)] border-l border-white/10" style={{ position: 'sticky', right: 0, zIndex: 10 }}>
                          <div className="flex items-center justify-end gap-3">
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
                </p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}



