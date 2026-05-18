import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, format, isSameDay, isSameMonth, isWithinInterval, startOfYear } from 'date-fns';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getPresets(anchor) {
  const d = anchor || new Date();
  return [
    { label: 'Last 7 Days', range: { from: subDays(d, 6), to: d } },
    { label: 'Last 14 Days', range: { from: subDays(d, 13), to: d } },
    { label: 'Last 30 Days', range: { from: subDays(d, 29), to: d } },
    { label: 'This Month', range: { from: startOfMonth(d), to: d } },
    { label: 'Last Month', range: { from: startOfMonth(subMonths(d, 1)), to: endOfMonth(subMonths(d, 1)) } },
    { label: 'Last 3 Months', range: { from: subMonths(d, 3), to: d } },
    { label: 'Last 6 Months', range: { from: subMonths(d, 6), to: d } },
    { label: 'This Year', range: { from: startOfYear(d), to: d } },
    { label: 'All Time', range: { from: undefined, to: undefined } },
  ];
}

function MonthGrid({ month, selected, onDayClick, hoveredDay, onDayHover }) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const rows = [];
  let day = calStart;
  while (day <= calEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(day));
      day = addDays(day, 1);
    }
    rows.push(week);
  }

  const isInRange = (d) => {
    if (!selected?.from) return false;
    const end = selected.to || hoveredDay;
    if (!end) return false;
    const start = selected.from < end ? selected.from : end;
    const finish = selected.from < end ? end : selected.from;
    try {
      return isWithinInterval(d, { start, end: finish });
    } catch { return false; }
  };

  const isRangeStart = (d) => selected?.from && isSameDay(d, selected.from);
  const isRangeEnd = (d) => {
    const end = selected?.to || hoveredDay;
    return end && isSameDay(d, end);
  };

  return (
    <div className="w-[280px]">
      {/* Month/Year header */}
      <div className="text-center mb-3">
        <span className="text-white font-semibold text-sm">{format(month, 'MMMM yyyy')}</span>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(wd => (
          <div key={wd} className="text-center text-[11px] font-semibold text-gray-500 uppercase py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* Day grid */}
      {rows.map((week, wIdx) => (
        <div key={wIdx} className="grid grid-cols-7">
          {week.map((d, dIdx) => {
            const inMonth = isSameMonth(d, month);
            const inRange = isInRange(d);
            const isStart = isRangeStart(d);
            const isEnd = isRangeEnd(d);
            const isToday = isSameDay(d, new Date());

            let cellBg = '';
            if (isStart || isEnd) cellBg = 'bg-primary';
            else if (inRange) cellBg = 'bg-primary/15';

            let textColor = inMonth ? 'text-gray-200' : 'text-gray-600';
            if (isStart || isEnd) textColor = 'text-white';

            let rounded = 'rounded-md';
            if (inRange && !isStart && !isEnd) rounded = 'rounded-none';
            if (isStart && !isEnd) rounded = 'rounded-l-md rounded-r-none';
            if (isEnd && !isStart) rounded = 'rounded-r-md rounded-l-none';
            if (isStart && isEnd) rounded = 'rounded-md';

            return (
              <div key={dIdx} className="flex items-center justify-center h-[34px]">
                <button
                  onClick={() => inMonth && onDayClick(d)}
                  onMouseEnter={() => inMonth && onDayHover(d)}
                  className={`w-full h-[32px] flex items-center justify-center text-[13px] font-medium transition-all
                    ${cellBg} ${textColor} ${rounded}
                    ${inMonth ? 'cursor-pointer hover:bg-primary/30' : 'cursor-default'}
                    ${isToday && !isStart && !isEnd ? 'ring-1 ring-primary ring-inset' : ''}
                  `}
                >
                  {format(d, 'd')}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function CustomCalendar({ isOpen, onClose, dateRange, onDateChange, anchorDate }) {
  const presets = useMemo(() => getPresets(anchorDate), [anchorDate]);
  const [leftMonth, setLeftMonth] = useState(dateRange?.from ? startOfMonth(dateRange.from) : startOfMonth(anchorDate || new Date()));
  const [tempRange, setTempRange] = useState(dateRange || { from: undefined, to: undefined });
  const [hoveredDay, setHoveredDay] = useState(null);
  const [activePreset, setActivePreset] = useState(null);



  const rightMonth = addMonths(leftMonth, 1);

  const handleDayClick = (day) => {
    if (!tempRange.from || tempRange.to) {
      // Start new selection
      setTempRange({ from: day, to: undefined });
      setActivePreset(null);
    } else {
      // Complete selection
      if (day < tempRange.from) {
        setTempRange({ from: day, to: tempRange.from });
      } else {
        setTempRange({ from: tempRange.from, to: day });
      }
      setActivePreset(null);
    }
  };

  const handlePreset = (preset, idx) => {
    const range = preset.range;
    setTempRange(range);
    setActivePreset(idx);
    if (range.from) setLeftMonth(startOfMonth(range.from));
  };

  const handleApply = () => {
    onDateChange(tempRange);
    onClose();
  };

  const handleCancel = () => {
    setTempRange(dateRange || { from: undefined, to: undefined });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-2 z-50 animate-in fade-in slide-in-from-top-2">
      <div className="bg-[#1A1D24] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        <div className="flex">
          
          {/* PRESETS SIDEBAR */}
          <div className="w-[160px] bg-[#15171E] border-r border-white/10 p-3 flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold px-2 mb-2">Presets</p>
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handlePreset(preset, idx)}
                className={`text-left text-xs px-3 py-2 rounded-lg transition-all font-medium
                  ${activePreset === idx 
                    ? 'bg-primary text-white shadow-md shadow-primary/25' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* CALENDAR AREA */}
          <div className="p-5">
            {/* Navigation Row */}
            <div className="flex items-center justify-between mb-4 px-1">
              <button 
                onClick={() => setLeftMonth(subMonths(leftMonth, 1))}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Selected range display */}
              <div className="bg-[#22252D] border border-white/10 rounded-lg px-4 py-1.5 text-xs text-white font-medium">
                {tempRange?.from ? (
                  tempRange.to 
                    ? `${format(tempRange.from, 'dd MMM yyyy')} — ${format(tempRange.to, 'dd MMM yyyy')}`
                    : `${format(tempRange.from, 'dd MMM yyyy')} — Select end`
                ) : 'All Time'}
              </div>

              <button 
                onClick={() => setLeftMonth(addMonths(leftMonth, 1))}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Two Month Grids */}
            <div className="flex gap-6">
              <MonthGrid 
                month={leftMonth} 
                selected={tempRange} 
                onDayClick={handleDayClick}
                hoveredDay={hoveredDay}
                onDayHover={setHoveredDay}
              />
              <div className="w-px bg-white/10"></div>
              <MonthGrid 
                month={rightMonth} 
                selected={tempRange} 
                onDayClick={handleDayClick}
                hoveredDay={hoveredDay}
                onDayHover={setHoveredDay}
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10">
              <p className="text-[11px] text-gray-500">
                {tempRange?.from && tempRange?.to 
                  ? `${Math.ceil((tempRange.to - tempRange.from) / (1000 * 60 * 60 * 24)) + 1} days selected`
                  : 'Pick a date range'
                }
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCancel}
                  className="px-4 py-1.5 text-xs font-medium text-gray-400 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleApply}
                  className="px-5 py-1.5 text-xs font-medium bg-primary hover:bg-primary-hover text-white rounded-lg shadow-md shadow-primary/25 transition-all"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
