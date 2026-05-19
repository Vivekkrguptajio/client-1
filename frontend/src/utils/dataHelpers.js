export const extractValidDate = (row) => {
  if (!row) return null;
  for (const key of Object.keys(row)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'date' || lowerKey === 'day' || lowerKey.includes('date') || row[key] instanceof Date) {
      const dateVal = row[key];
      if (dateVal === null || dateVal === undefined) continue;
      
      let d;
      if (dateVal instanceof Date) {
        d = dateVal;
      } else if (!isNaN(dateVal) && typeof dateVal === 'number') {
        // Excel serial dates: 30000 = 1982, 60000 = 2064
        if (dateVal > 30000 && dateVal < 60000) {
          d = new Date((dateVal - 25569) * 86400 * 1000);
        } else {
          continue;
        }
      } else if (typeof dateVal === 'string') {
        // Handle DD-MM-YYYY or DD/MM/YYYY format (common in Indian Excel)
        const ddmmyyyy = dateVal.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (ddmmyyyy) {
          const day = parseInt(ddmmyyyy[1], 10);
          const month = parseInt(ddmmyyyy[2], 10);
          const year = parseInt(ddmmyyyy[3], 10);
          if (day > 12) {
            d = new Date(year, month - 1, day);
          } else if (month > 12) {
            d = new Date(year, day - 1, month);
          } else {
            d = new Date(year, month - 1, day);
          }
        } else {
          d = new Date(dateVal);
        }
      } else {
        d = new Date(dateVal);
      }
      
      if (d && d.toString() !== 'Invalid Date') {
        const year = d.getFullYear();
        if (year > 1990 && year < 2100) return d;
      }
    }
  }
  return null;
};

// Smart column finder — searches all keys for matching keywords
export const findVal = (row, keywords, exclude = []) => {
  for (const key of Object.keys(row)) {
    const lk = key.toLowerCase().replace(/[_\s]+/g, '');
    const matchesKeyword = keywords.some(kw => lk.includes(kw.toLowerCase().replace(/[_\s]+/g, '')));
    const matchesExclude = exclude.some(ex => lk.includes(ex.toLowerCase().replace(/[_\s]+/g, '')));
    if (matchesKeyword && !matchesExclude) {
      const v = parseFloat(row[key]);
      if (!isNaN(v)) return v;
    }
  }
  return 0;
};

import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename) => {
  if (!data || data.length === 0) {
    alert("No data available to download");
    return;
  }
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error("Error exporting data:", error);
    alert("Failed to export data");
  }
};
