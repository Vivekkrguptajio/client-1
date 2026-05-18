import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronDown, Calendar, Bell, Upload, Shirt, AlertTriangle, TrendingDown, X } from 'lucide-react';
import CustomCalendar from '../../CustomCalendar';
import { Link } from 'react-router-dom';

export function Navbar({
  campaignType,
  setCampaignType,
  dropdownOpen,
  setDropdownOpen,
  currentClient,
  setCurrentClient,
  clientDropdownOpen,
  setClientDropdownOpen,
  calendarOpen,
  setCalendarOpen,
  dateRange,
  setDateRange,
  datasetMaxDate,
  calendarRef,
  lowRoasAlerts = []
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const alertCount = lowRoasAlerts.length;

  return (
    <header className="h-20 border-b border-border bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Left Section: File Name & Campaigns */}
      <div className="flex items-center">
        {/* Client Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
            className="flex items-center justify-between gap-4 bg-[#32363F] hover:bg-[#3f434d] px-4 py-2.5 rounded-lg text-white font-medium min-w-[240px] transition-colors border border-white/5"
          >
            <span className="truncate uppercase tracking-wider">{currentClient}</span>
            <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${clientDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {clientDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-full bg-surface border border-border rounded-xl shadow-xl overflow-hidden py-1 z-50">
              {['snitch', 'redtape', 'tremploline'].map(client => (
                <button
                  key={client}
                  onClick={() => { setCurrentClient(client); setClientDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors uppercase text-sm font-medium ${currentClient === client ? 'text-primary bg-primary/5' : 'text-text-main'}`}
                >
                  {client}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-border mx-4"></div>

        {/* Campaign Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 hover:bg-white/5 pr-4 py-1.5 rounded-lg transition-colors group"
          >
            <div className="w-10 h-10 bg-[#32363F] rounded-lg flex items-center justify-center border border-white/5">
              <Shirt className="w-5 h-5 text-gray-300 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left leading-tight">
              <p className="text-[13px] text-text-muted font-normal">Campaigns</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-semibold text-[15px] text-white">{campaignType === 'product' ? 'Product Ads' : 'Display Ads'}</span>
              </div>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl overflow-hidden py-1 z-50">
              <button
                onClick={() => { setCampaignType('product'); setDropdownOpen(false); }}
                className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors ${campaignType === 'product' ? 'text-primary bg-primary/5' : 'text-text-main'}`}
              >
                Product Ads
              </button>
              <button
                onClick={() => { setCampaignType('display'); setDropdownOpen(false); }}
                className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors ${campaignType === 'display' ? 'text-primary bg-primary/5' : 'text-text-main'}`}
              >
                Display Ads
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spacer to push right actions */}
      <div className="flex-1"></div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Upload Button (Hidden as requested, accessible via direct URL) */}
        <Link
          to="/upload"
          className="hidden items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-primary/25"
        >
          <Upload className="w-4 h-4" />
          <span>Data Center</span>
        </Link>

        {/* Calendar / Date Range */}
        <div className="relative" ref={calendarRef}>
          <button
            onClick={() => setCalendarOpen(!calendarOpen)}
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

          {calendarOpen && (
            <CustomCalendar
              isOpen={calendarOpen}
              onClose={() => setCalendarOpen(false)}
              dateRange={dateRange}
              onDateChange={(range) => setDateRange(range)}
              anchorDate={datasetMaxDate || new Date()}
            />
          )}
        </div>

        {/* 🔔 Notifications Bell with ROAS Alerts */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:bg-white/5 transition-colors relative"
          >
            <Bell className="w-5 h-5 text-text-muted" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-surface">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div className="absolute top-full right-0 mt-2 w-[380px] bg-[#1A1D24] border border-border rounded-xl shadow-2xl shadow-black/50 z-[9999] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">ROAS Alerts</h3>
                  {alertCount > 0 && (
                    <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {alertCount} alert{alertCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <button onClick={() => setNotifOpen(false)} className="text-text-muted hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Alert List */}
              <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                {alertCount === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingDown className="w-6 h-6 text-emerald-400" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">All campaigns healthy!</p>
                    <p className="text-xs text-gray-500 mt-1">No campaigns with ROAS below 2.0</p>
                  </div>
                ) : (
                  lowRoasAlerts.map((alert, i) => (
                    <div
                      key={i}
                      className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-white truncate" title={alert.name}>
                            {alert.name}
                          </p>
                          {alert.date && (
                            <p className="text-[10px] text-gray-500 mt-0.5">{alert.date} {alert.campaign ? `• ${alert.campaign}` : ''}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-red-400 font-semibold">
                              ROAS: {alert.roas}
                            </span>
                            <span className="text-[10px] text-gray-500">•</span>
                            <span className="text-xs text-gray-400">
                              Spend: ₹{Number(alert.spend).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                        <span className="shrink-0 bg-red-500/15 text-red-400 text-[10px] font-bold px-2 py-1 rounded-md mt-0.5">
                          LOW
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {alertCount > 0 && (
                <div className="px-4 py-2.5 border-t border-border bg-[#161920]">
                  <p className="text-[10px] text-gray-500 text-center">
                    Showing campaigns with ROAS below 2.0 threshold
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
