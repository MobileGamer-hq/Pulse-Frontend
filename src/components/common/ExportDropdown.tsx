import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, FileCode, ChevronDown } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF, type ExportColumn } from '../../utils/exportUtils';

interface ExportDropdownProps {
  filename: string;
  title: string;
  data: Record<string, any>[];
  columns?: ExportColumn[];
  className?: string;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  filename,
  title,
  data,
  columns,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportCSV = () => {
    exportToCSV(filename, data, columns);
    setIsOpen(false);
  };

  const handleExportExcel = () => {
    exportToExcel(filename, data, columns);
    setIsOpen(false);
  };

  const handleExportPDF = () => {
    exportToPDF(filename, title, data, columns);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-mono text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700 shadow-xs"
        title="Export data to CSV, Excel, or PDF"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-44 rounded-xl shadow-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 z-50 py-1 font-mono text-xs">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-neutral-400 border-b border-neutral-100 dark:border-neutral-800">
            Export Format
          </div>
          <button
            onClick={handleExportCSV}
            className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-500" />
            <span>Export CSV (.csv)</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export Excel (.xlsx)</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-red-500" />
            <span>Export PDF (.pdf)</span>
          </button>
        </div>
      )}
    </div>
  );
};
