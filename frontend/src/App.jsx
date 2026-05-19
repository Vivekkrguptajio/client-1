import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { subDays, subMonths } from 'date-fns';
import { extractValidDate, findVal } from './utils/dataHelpers';
import { formatNum, formatCellValue } from './utils/formatters';
import { CampaignModal } from './components/common/CampaignModal';
import { Navbar } from './components/dashboard/Navbar';
import { ProductAds } from './components/views/ProductAds';
import { DisplayAds } from './components/views/DisplayAds';
import { UploadPage } from './components/views/UploadPage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Helpers imported from utils

// Smart column finder — searches all keys for matching keywords


export default function App() {
  const [campaignType, setCampaignType] = useState('product');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [productData, setProductData] = useState([]);
  const [campaignData, setCampaignData] = useState([]);
  const [timeline, setTimeline] = useState('D');
  const [currentClient, setCurrentClient] = useState('snitch');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);


  const [uploading, setUploading] = useState(false);
  const [productFileName, setProductFileName] = useState('');
  const [campaignFileName, setCampaignFileName] = useState('');
  const [uploadType, setUploadType] = useState(null);
  const fileInputRef = useRef(null);

  // Performance Table State
  const [perfData, setPerfData] = useState([]);
  const [perfFileName, setPerfFileName] = useState('');
  const [perfUploading, setPerfUploading] = useState(false);

  const handlePerfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPerfUploading(true);
    setPerfFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        setPerfData(XLSX.utils.sheet_to_json(ws));
      } catch { alert('Failed to parse file.'); }
      finally { setPerfUploading(false); }
    };
    reader.onerror = () => { setPerfUploading(false); alert('Error reading file.'); };
    reader.readAsArrayBuffer(file);
  };

  // Calendar State
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined
  });
  const [datasetMaxDate, setDatasetMaxDate] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showLowPerforming, setShowLowPerforming] = useState(false);

  const [cardMetrics, setCardMetrics] = useState([
    { key: 'adSpend', label: 'Ad Spend', isCurrency: true },
    { key: 'impressions', label: 'Ad Impressions' },
    { key: 'clicks', label: 'Clicks' },
    { key: 'ctr', label: 'CTR', isPercentage: true },
    { key: 'cpm', label: 'CPM', isCurrency: true },
    { key: 'cpc', label: 'CPC', isCurrency: true },
  ]);
  const calendarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch default data from /default_data/ if no data is uploaded
  const fetchDefaultData = async (client) => {
    try {
      const basePath = `/default_data/${client}`;
      // 1. Fetch Product Ads Data
      const prodRes = await fetch(`${basePath}/snitch.xlsx`);
      if (prodRes.ok) {
        const prodBuf = await prodRes.arrayBuffer();
        const prodWb = XLSX.read(new Uint8Array(prodBuf), { type: 'array', cellDates: true });
        const prodJson = XLSX.utils.sheet_to_json(prodWb.Sheets[prodWb.SheetNames[0]]);
        setProductData(prodJson);
        setProductFileName('snitch.xlsx');

        // Set initial date anchor based on default data
        let maxDate = null;
        prodJson.forEach(row => {
          const d = extractValidDate(row);
          if (d && (!maxDate || d > maxDate)) maxDate = d;
        });
        if (maxDate) {
          setDatasetMaxDate(maxDate);
          setDateRange({ from: subDays(maxDate, 6), to: maxDate });
        }
      }

      // 2. Fetch Campaign Data
      const campRes = await fetch(`${basePath}/campaign_486.xlsx`);
      if (campRes.ok) {
        const campBuf = await campRes.arrayBuffer();
        const campWb = XLSX.read(new Uint8Array(campBuf), { type: 'array', cellDates: true });
        const campJson = XLSX.utils.sheet_to_json(campWb.Sheets[campWb.SheetNames[0]]);
        setCampaignData(campJson);
        setCampaignFileName('campaign_486.xlsx');
      }

      // 3. Fetch Display Ads Data
      const perfRes = await fetch(`${basePath}/Display_Ads_Table.xlsx`);
      if (perfRes.ok) {
        const perfBuf = await perfRes.arrayBuffer();
        const perfWb = XLSX.read(new Uint8Array(perfBuf), { type: 'array', cellDates: true });
        const perfJson = XLSX.utils.sheet_to_json(perfWb.Sheets[perfWb.SheetNames[0]]);
        setPerfData(perfJson);
        setPerfFileName('Display_Ads_Table.xlsx');
      }
    } catch (error) {
      console.error('Error loading default data:', error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDefaultData(currentClient);
  }, [currentClient]);



  // 1. Filter by campaign type ONLY (for metrics and table)
  const filteredData = React.useMemo(() => {
    // Main dashboard uses productData
    const dataToUse = productData;
    if (dataToUse.length === 0) return [];
    return dataToUse.filter(row => {
      const typeStr = (row['Campaign Type'] || row['campaignType'] || row['type'] || row['Type'] || '').toString().toLowerCase();
      let typeMatch = true;
      if (typeStr) {
        if (campaignType === 'product') {
          typeMatch = typeStr.includes('product') || typeStr.includes('sp') || typeStr.includes('search');
        } else if (campaignType === 'display') {
          typeMatch = typeStr.includes('display') || typeStr.includes('sd') || typeStr.includes('video');
        }
      }
      return typeMatch;
    });
  }, [productData, campaignType]);

  // 2. Filter by Date ONLY for the Chart and Table
  const chartFiltered = React.useMemo(() => {
    return filteredData.filter(row => {
      let dateMatch = true;
      const rowDate = extractValidDate(row);
      if (rowDate && dateRange?.from && dateRange?.to) {
        const rd = new Date(rowDate).setHours(0, 0, 0, 0);
        const f = new Date(dateRange.from).setHours(0, 0, 0, 0);
        const t = new Date(dateRange.to).setHours(23, 59, 59, 999);
        dateMatch = rd >= f && rd <= t;
      }
      return dateMatch;
    });
  }, [filteredData, dateRange]);

  // Compute Metrics on Lifetime (chartFiltered)
  const metrics = React.useMemo(() => {
    if (chartFiltered.length === 0) {
      return { adSpend: 0, impressions: 0, clicks: 0, ctr: 0, cpm: 0, cpc: 0, adRevenue: 0, roas: 0, orders: 0 };
    }

    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalRevenue = 0;
    let totalOrders = 0;
    let totalRoasWeighted = 0;

    chartFiltered.forEach(row => {
      const rowSpend = findVal(row, ['ad spend', 'adspend', 'spend', 'cost', 'amount spent'], ['revenue']);
      totalSpend += rowSpend;
      totalImpressions += findVal(row, ['impression', 'impr']);
      totalClicks += findVal(row, ['click'], ['ctr', 'clickthrough']);
      totalOrders += findVal(row, ['order', 'units sold', 'sku', 'conversions'], ['order id']);

      const directRevenue = findVal(row, ['ad revenue', 'adrevenue', 'revenue', 'sale amount'], ['roas']);
      const directRoas = findVal(row, ['roas', 'return on ad spend']);

      if (directRevenue > 0) {
        totalRevenue += directRevenue;
      } else if (directRoas > 0 && rowSpend > 0) {
        totalRevenue += directRoas * rowSpend;
      }
      if (directRoas > 0) {
        totalRoasWeighted += directRoas * rowSpend;
      }
    });

    return {
      adSpend: totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
      cpc: totalClicks > 0 ? (totalSpend / totalClicks) : 0,
      adRevenue: totalRevenue,
      roas: totalSpend > 0 ? (totalRoasWeighted > 0 ? totalRoasWeighted / totalSpend : totalRevenue / totalSpend) : 0,
      orders: totalOrders
    };
  }, [chartFiltered]);

  // 🔄 Week-over-Week Comparison
  const metricChanges = React.useMemo(() => {
    if (filteredData.length === 0) return {};
    const anchor = datasetMaxDate || new Date();
    const thisWeekStart = subDays(anchor, 6);
    const prevWeekStart = subDays(anchor, 13);
    const prevWeekEnd = subDays(anchor, 7);

    const computeWeekMetrics = (rows, start, end) => {
      let s = 0, im = 0, cl = 0, rev = 0, ord = 0, rwt = 0;
      rows.forEach(row => {
        const d = extractValidDate(row);
        if (!d) return;
        const rd = new Date(d).setHours(0, 0, 0, 0);
        const f = new Date(start).setHours(0, 0, 0, 0);
        const t = new Date(end).setHours(23, 59, 59, 999);
        if (rd < f || rd > t) return;
        const sp = findVal(row, ['ad spend', 'adspend', 'spend', 'cost', 'amount spent'], ['revenue']);
        s += sp;
        im += findVal(row, ['impression', 'impr']);
        cl += findVal(row, ['click'], ['ctr', 'clickthrough']);
        ord += findVal(row, ['order', 'units sold', 'sku', 'conversions'], ['order id']);
        const dr = findVal(row, ['ad revenue', 'adrevenue', 'revenue', 'sale amount'], ['roas']);
        const dRoas = findVal(row, ['roas', 'return on ad spend']);
        rev += dr > 0 ? dr : (dRoas > 0 && sp > 0 ? dRoas * sp : 0);
        if (dRoas > 0) rwt += dRoas * sp;
      });
      return {
        adSpend: s, impressions: im, clicks: cl, orders: ord, adRevenue: rev,
        ctr: im > 0 ? (cl / im) * 100 : 0,
        cpm: im > 0 ? (s / im) * 1000 : 0,
        cpc: cl > 0 ? (s / cl) : 0,
        roas: s > 0 ? (rwt > 0 ? rwt / s : rev / s) : 0,
      };
    };

    const thisWeek = computeWeekMetrics(filteredData, thisWeekStart, anchor);
    const prevWeek = computeWeekMetrics(filteredData, prevWeekStart, prevWeekEnd);

    const changes = {};
    Object.keys(thisWeek).forEach(key => {
      if (prevWeek[key] > 0) {
        changes[key] = ((thisWeek[key] - prevWeek[key]) / prevWeek[key]) * 100;
      } else if (thisWeek[key] > 0) {
        changes[key] = 100;
      } else {
        changes[key] = 0;
      }
    });
    return changes;
  }, [filteredData, datasetMaxDate]);



  // Group Data by Date for Chart
  const chartData = React.useMemo(() => {
    const dailyDataMap = {};
    chartFiltered.forEach(row => {
      const d = extractValidDate(row);
      let dateKey = 'Unknown';
      if (d) {
        if (timeline === 'M') {
          dateKey = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else if (timeline === 'W') {
          const startOfWeek = new Date(d);
          startOfWeek.setDate(d.getDate() - d.getDay());
          dateKey = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ' (W)';
        } else {
          dateKey = d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
        }
      } else {
        const fallbackVal = row['Date'] || row['date'] || row['Day'] || row['day'] || '';
        if (fallbackVal) dateKey = fallbackVal.toString().substring(0, 5);
      }

      if (!dailyDataMap[dateKey]) {
        dailyDataMap[dateKey] = { name: dateKey, adSpend: 0, impressions: 0, clicks: 0, adRevenue: 0, orders: 0, roas: 0, sortDate: d || new Date(0), _count: 0, _roasWeighted: 0 };
      }

      const spend = findVal(row, ['ad spend', 'adspend', 'spend', 'cost', 'amount spent'], ['revenue']);
      const impr = findVal(row, ['impression', 'impr']);
      const clk = findVal(row, ['click'], ['ctr', 'clickthrough']);
      const ord = findVal(row, ['order', 'units sold', 'sku', 'conversions'], ['order id']);
      const dr = findVal(row, ['ad revenue', 'adrevenue', 'revenue', 'sale amount'], ['roas']);
      const dRoas = findVal(row, ['roas', 'return on ad spend']);
      const rowRevenue = dr > 0 ? dr : (dRoas > 0 && spend > 0 ? dRoas * spend : 0);

      dailyDataMap[dateKey].adSpend += spend;
      dailyDataMap[dateKey].impressions += impr;
      dailyDataMap[dateKey].clicks += clk;
      dailyDataMap[dateKey].adRevenue += rowRevenue;
      dailyDataMap[dateKey].orders += ord;
      dailyDataMap[dateKey]._count++;
      if (dRoas > 0) dailyDataMap[dateKey]._roasWeighted += dRoas * spend;
    });

    Object.values(dailyDataMap).forEach(entry => {
      entry.ctr = entry.impressions > 0 ? (entry.clicks / entry.impressions) * 100 : 0;
      entry.cpm = entry.impressions > 0 ? (entry.adSpend / entry.impressions) * 1000 : 0;
      entry.cpc = entry.clicks > 0 ? (entry.adSpend / entry.clicks) : 0;
      entry.roas = entry.adSpend > 0 ? (entry._roasWeighted > 0 ? entry._roasWeighted / entry.adSpend : entry.adRevenue / entry.adSpend) : 0;
    });

    const chartDataArray = Object.values(dailyDataMap).sort((a, b) => a.sortDate - b.sortDate);
    const finalChartData = chartDataArray.filter(d => d.name !== 'Unknown');
    return finalChartData.length > 0 ? finalChartData : chartDataArray;
  }, [chartFiltered, timeline]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    // Set the specific file name based on the current upload type
    if (uploadType === 'product') {
      setProductFileName(file.name);
    } else if (uploadType === 'campaign') {
      setCampaignFileName(file.name);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const json = XLSX.utils.sheet_to_json(worksheet);

        // DEBUG: Log first row to see column names
        console.log('📊 Uploaded rows:', json.length);
        console.log('📊 First row keys:', json.length > 0 ? Object.keys(json[0]) : 'NO DATA');
        console.log('📊 First row data:', json[0]);
        console.log('📊 Sample values:', json.length > 0 ? {
          'Ad Spend': json[0]['Ad Spend'],
          'Spend': json[0]['Spend'],
          'Impressions': json[0]['Impressions'],
          'Clicks': json[0]['Clicks'],
        } : 'NO DATA');

        // Find maximum date to store as anchor for timeline toggles
        let maxDate = null;
        json.forEach(row => {
          const d = extractValidDate(row);
          if (d) {
            if (!maxDate || d > maxDate) maxDate = d;
          }
        });
        if (maxDate) setDatasetMaxDate(maxDate);
        console.log('📊 Max date found:', maxDate);

        // Auto-set date range to last 7 days from max date so chart is clean on load
        if (maxDate) {
          setDateRange({ from: subDays(maxDate, 6), to: maxDate });
        } else {
          setDateRange({ from: subDays(new Date(), 6), to: new Date() });
        }

        if (uploadType === 'product') {
          setProductData(json);
        } else if (uploadType === 'campaign') {
          setCampaignData(json);
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Failed to parse Excel file. Ensure it is a valid format.');
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      console.error('FileReader error');
      setUploading(false);
      alert('Error reading file');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleRefresh = () => {
    // Just force a re-render or visual refresh state if needed
    // Since it's local state, it's already up to date.
  };



  const handleTimelineChange = (t) => {
    setTimeline(t);
    const anchorDate = datasetMaxDate || new Date();

    if (t === 'D') {
      // 7 days
      setDateRange({ from: subDays(anchorDate, 6), to: anchorDate });
    } else if (t === 'W') {
      // 4 weeks (28 days)
      setDateRange({ from: subDays(anchorDate, 27), to: anchorDate });
    } else if (t === 'M') {
      // 12 months
      setDateRange({ from: subMonths(anchorDate, 11), to: anchorDate });
    }
  };

  const rawHeaders = productData.length > 0 ? Object.keys(productData[0]) : [];
  const dateCol = rawHeaders.find(h => h.toLowerCase() === 'creation date') || rawHeaders.find(h => h.toLowerCase().includes('date') || h.toLowerCase() === 'day');
  const campCol = rawHeaders.find(h => h.toLowerCase().includes('campaign') || h.toLowerCase() === 'name');
  const statusCol = rawHeaders.find(h => h.toLowerCase() === 'status');
  // Exclude raw 'Date' column since we use 'Creation Date' instead
  const excludedCols = rawHeaders.filter(h => h.toLowerCase() === 'date' && dateCol && dateCol.toLowerCase() === 'creation date');

  const orderedHeaders = [dateCol, campCol, statusCol].filter(Boolean);
  rawHeaders.forEach(h => {
    if (!orderedHeaders.includes(h) && !excludedCols.includes(h)) orderedHeaders.push(h);
  });

  const tableHeaders = orderedHeaders.filter(h => {
    const lh = h.toLowerCase().trim();
    const isRepeatedMetric = 
      lh === 'ad spend' || lh === 'adspend' || lh === 'spend' ||
      lh === 'impressions' || lh === 'impr' ||
      lh === 'clicks' ||
      lh === 'ctr' || lh.includes('click-through') ||
      lh === 'cpm' || lh === 'cpc';
    return !(lh.includes('order') && lh.includes('sku')) && !isRepeatedMetric;
  });

  const stickyColumns = {
    checkbox: { width: 50, left: 0 },
    date: { width: 110 },
    campaign: { width: 220 },
    status: { width: 100 }
  };

  let currentLeft = 50;
  const stickyStyles = {};
  [dateCol, campCol, statusCol].forEach(col => {
    if (col) {
      const type = col === dateCol ? 'date' : col === campCol ? 'campaign' : 'status';
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
    const isLastSticky = header === (statusCol || campCol || dateCol);
    return `px-4 py-3 whitespace-nowrap text-[13px] text-gray-300 transition-colors border-r border-white/10 ${isSticky ? 'bg-[#1C1F26] group-hover:bg-[#2A2D35]' : ''} ${isLastSticky ? 'shadow-[4px_0_10px_-5px_rgba(0,0,0,0.5)] border-r-white/20' : ''}`;
  };

  const getCellStyle = (header) => stickyStyles[header] || {};

  let tableData = filteredData;

  // Apply Date Filter
  if (dateRange?.from && dateRange?.to) {
    tableData = tableData.filter(row => {
      let dateMatch = true;
      const rowDate = extractValidDate(row);
      if (rowDate) {
        const rd = new Date(rowDate).setHours(0, 0, 0, 0);
        const f = new Date(dateRange.from).setHours(0, 0, 0, 0);
        const t = new Date(dateRange.to).setHours(23, 59, 59, 999);
        dateMatch = rd >= f && rd <= t;
      }
      return dateMatch;
    });
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    tableData = tableData.filter(row => {
      return Object.values(row).some(val => val && val.toString().toLowerCase().includes(query));
    });
  }

  // formatCellValue imported from utils

  // 🔔 Compute Low ROAS Alerts — individual records where ROAS < 2
  const lowRoasAlerts = React.useMemo(() => {
    if (filteredData.length === 0) return [];

    const alerts = [];
    filteredData.forEach(row => {
      const directRoas = findVal(row, ['roas', 'return on ad spend']);
      const spend = findVal(row, ['ad spend', 'adspend', 'spend', 'cost', 'amount spent'], ['revenue']);
      const directRevenue = findVal(row, ['ad revenue', 'adrevenue', 'revenue', 'sale amount'], ['roas']);

      // Calculate ROAS for this row
      let roas = directRoas;
      if (!roas && spend > 0 && directRevenue > 0) {
        roas = directRevenue / spend;
      }

      if (roas > 0 && roas < 2 && spend > 0) {
        const campName = row['Campaign Name'] || row['campaign'] || row['Campaign'] || row['name'] || row['Name'] || '';
        const productName = row['Product Name'] || row['product'] || row['Product'] || row['SKU'] || row['sku'] || '';
        const dateVal = extractValidDate(row);
        const dateStr = dateVal ? dateVal.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

        alerts.push({
          name: productName || campName || 'Unknown',
          campaign: campName,
          product: productName,
          date: dateStr,
          roas: roas.toFixed(2),
          spend: spend
        });
      }
    });

    // Sort by ROAS ascending (worst first)
    alerts.sort((a, b) => parseFloat(a.roas) - parseFloat(b.roas));
    return alerts;
  }, [filteredData]);

  // Determine which dataset to pass to the modal
  const modalDataToPass = React.useMemo(() => {
    if (campaignData.length > 0) return campaignData;
    return productData;
  }, [campaignData, productData]);

  const finalModalFileName = React.useMemo(() => {
    if (campaignData.length > 0) return campaignFileName;
    return productFileName;
  }, [campaignData, campaignFileName, productFileName]);

  return (
    <Router>
      <div className="min-h-screen bg-background flex flex-col font-sans text-text-main overflow-x-hidden">
        <Routes>
          <Route path="/" element={
            <>

              {/* NAVBAR */}
              <Navbar
                campaignType={campaignType}
                setCampaignType={setCampaignType}
                dropdownOpen={dropdownOpen}
                setDropdownOpen={setDropdownOpen}
                currentClient={currentClient}
                setCurrentClient={setCurrentClient}
                clientDropdownOpen={clientDropdownOpen}
                setClientDropdownOpen={setClientDropdownOpen}
                uploading={uploading}
                fileInputRef={fileInputRef}
                handleFileUpload={handleFileUpload}
                calendarOpen={calendarOpen}
                setCalendarOpen={setCalendarOpen}
                dateRange={dateRange}
                setDateRange={setDateRange}
                datasetMaxDate={datasetMaxDate}
                calendarRef={calendarRef}
                lowRoasAlerts={lowRoasAlerts}
              />

              {/* MAIN CONTENT */}
              {campaignType === 'product' ? (
                <ProductAds
                  cardMetrics={cardMetrics}
                  setCardMetrics={setCardMetrics}
                  metrics={metrics}
                  formatNum={formatNum}
                  timeline={timeline}
                  handleTimelineChange={handleTimelineChange}
                  graphData={chartData}
                  tableData={tableData}
                  tableHeaders={tableHeaders}
                  getHeaderStyle={getHeaderStyle}
                  getCellClassName={getCellClassName}
                  getCellStyle={getCellStyle}
                  showLowPerforming={showLowPerforming}
                  setShowLowPerforming={setShowLowPerforming}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  formatCellValue={formatCellValue}
                  handleRefresh={handleRefresh}
                  setSelectedCampaign={setSelectedCampaign}
                  metricChanges={metricChanges}
                />
              ) : (
                <DisplayAds
                  cardMetrics={cardMetrics}
                  setCardMetrics={setCardMetrics}
                  metrics={metrics}
                  formatNum={formatNum}
                  timeline={timeline}
                  handleTimelineChange={handleTimelineChange}
                  graphData={chartData}
                  tableData={tableData}
                  tableHeaders={tableHeaders}
                  getHeaderStyle={getHeaderStyle}
                  getCellClassName={getCellClassName}
                  getCellStyle={getCellStyle}
                  showLowPerforming={showLowPerforming}
                  setShowLowPerforming={setShowLowPerforming}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  formatCellValue={formatCellValue}
                  handleRefresh={handleRefresh}
                  setSelectedCampaign={setSelectedCampaign}
                  perfData={perfData}
                  metricChanges={metricChanges}
                />
              )}

              {/* CAMPAIGN ANALYTICS MODAL */}
              {selectedCampaign && (
                <CampaignModal
                  campaign={selectedCampaign}
                  onClose={() => setSelectedCampaign(null)}
                  // Smart fallback: use campaignData only if the campaign exists there, else use productData
                  allData={modalDataToPass}
                  datasetMaxDate={datasetMaxDate}
                  formatNum={formatNum}
                  fileName={finalModalFileName}
                  fileInputRef={fileInputRef}
                />
              )}
            </>
          } />
          <Route path="/upload" element={
            <UploadPage
              uploadingMain={uploading}
              handleMainUpload={handleFileUpload}
              uploadingPerf={perfUploading}
              handlePerfUpload={handlePerfUpload}
              productFileName={productFileName}
              campaignFileName={campaignFileName}
              perfFileName={perfFileName}
              uploadType={uploadType}
              setUploadType={setUploadType}
            />
          } />
        </Routes>
      </div>
    </Router>
  );
}

// Dropdown menu options for metric cards

