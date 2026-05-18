import { format } from 'date-fns';

export const formatNum = (num, isCurrency = false, isPercentage = false) => {
  if (num === null || num === undefined) return '0';
  if (isCurrency) {
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(2)} K`;
    return `₹${Number(num).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  }
  if (isPercentage) return `${Number(num).toFixed(2)}%`;
  
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return Number(num).toLocaleString('en-IN');
};

export const formatCellValue = (val, header) => {
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
