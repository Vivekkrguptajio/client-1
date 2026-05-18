import { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Info, ChevronDown } from 'lucide-react';
import { METRIC_OPTIONS } from './MetricOptions';



export function MetricCard({ title, value, icon, color, bg, border, tooltip, metricKey, onMetricChange, usedKeys, change }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [ddPos, setDdPos] = useState({ top: 0, left: 0 });
  const infoRef = useRef(null);
  const titleRef = useRef(null);

  const handleMouseEnter = () => {
    if (infoRef.current) {
      const rect = infoRef.current.getBoundingClientRect();
      setTooltipPos({ top: rect.bottom + 8, left: rect.left });
    }
    setShowTooltip(true);
  };

  const toggleDropdown = () => {
    if (titleRef.current) {
      const rect = titleRef.current.getBoundingClientRect();
      setDdPos({ top: rect.bottom + 4, left: rect.left });
    }
    setDropdownOpen(!dropdownOpen);
  };

  // Determine if change is positive, negative, or zero
  const changeVal = change !== undefined && change !== null ? change : null;
  const isPositive = changeVal > 0;
  // For cost metrics (adSpend, cpm, cpc), going UP is bad (red), going DOWN is good (green)
  const invertedMetrics = ['adSpend', 'cpm', 'cpc'];
  const isInverted = invertedMetrics.includes(metricKey);
  const changeColor = changeVal === 0 || changeVal === null
    ? 'text-text-muted'
    : (isInverted ? (isPositive ? 'text-red-400' : 'text-emerald-400') : (isPositive ? 'text-emerald-400' : 'text-red-400'));

  return (
    <div className={`bg-surface border ${border} rounded-xl p-3.5 relative group hover:-translate-y-1 transition-transform duration-300`}>
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className="flex items-center gap-1.5">
          <button 
            ref={titleRef}
            onClick={toggleDropdown}
            className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-white transition-colors cursor-pointer"
          >
            {title} <ChevronDown className={`w-4 h-4 ${color} opacity-70 group-hover:opacity-100 transition-opacity`} />
          </button>
          <div className="relative">
            <Info 
              ref={infoRef}
              className="w-3 h-3 text-text-muted/50 cursor-pointer hover:text-white transition-colors" 
              onMouseEnter={handleMouseEnter} 
              onMouseLeave={() => setShowTooltip(false)} 
            />
          </div>
        </div>
        <div className={`p-1.5 rounded-lg ${bg} ${color}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold tracking-tight text-white relative z-10">{value}</h3>
      
      {/* Week-over-Week Change */}
      {changeVal !== null && changeVal !== 0 && (
        <p className={`text-[10px] mt-1 font-medium ${changeColor} relative z-10`}>
          {isPositive ? '↑' : '↓'} {Math.abs(changeVal).toFixed(1)}% vs last week
        </p>
      )}
      
      {/* Decorative gradient glow */}
      <div className={`absolute -bottom-12 -right-12 w-28 h-28 ${bg} blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl`}></div>

      {/* Fixed Tooltip - renders on top of everything */}
      {showTooltip && tooltip && ReactDOM.createPortal(
        <div 
          className="fixed w-56 bg-[#1C1F26] border border-border rounded-lg p-3 shadow-2xl pointer-events-none"
          style={{ top: tooltipPos.top, left: tooltipPos.left, zIndex: 99999 }}
        >
          <p className="text-xs text-gray-300 leading-relaxed">{tooltip}</p>
          <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-[#1C1F26]"></div>
        </div>,
        document.body
      )}

      {/* Dropdown Menu - renders on top of everything */}
      {dropdownOpen && ReactDOM.createPortal(
        <>
          {/* Invisible backdrop to close dropdown */}
          <div className="fixed inset-0 z-[99998]" onClick={() => setDropdownOpen(false)}></div>
          <div 
            className="fixed w-48 bg-[#1A1D24] border border-white/10 rounded-xl shadow-2xl shadow-black/50 py-2 overflow-hidden"
            style={{ top: ddPos.top, left: ddPos.left, zIndex: 99999 }}
          >
            {METRIC_OPTIONS.filter(opt => opt.key === metricKey || !(usedKeys || []).includes(opt.key)).map(opt => (
              <button
                key={opt.key}
                onClick={() => {
                  if (onMetricChange) onMetricChange(opt);
                  setDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs font-medium transition-all
                  ${opt.key === metricKey 
                    ? 'bg-primary/20 text-white border-l-2 border-primary' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
