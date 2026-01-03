'use client';

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Download, Search, ChevronsUpDown } from 'lucide-react';
import { TableData } from '@/lib/output-types';

interface InteractiveTableProps {
  data: TableData;
  theme: 'light' | 'dark';
  maxRows?: number;
}

type SortDirection = 'asc' | 'desc' | null;

const InteractiveTable: React.FC<InteractiveTableProps> = ({ data, theme, maxRows = 100 }) => {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const isDark = theme === 'dark';

  // Sort and filter data
  const processedData = useMemo(() => {
    let rows = [...data.rows];

    // Filter by search term
    if (searchTerm) {
      rows = rows.filter(row =>
        row.some(cell =>
          String(cell).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort by column
    if (sortColumn !== null && sortDirection) {
      rows.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        // Handle different types
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();

        if (sortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        }
        return bStr.localeCompare(aStr);
      });
    }

    return rows;
  }, [data.rows, searchTerm, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / rowsPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      data.headers.join(','),
      ...data.rows.map(row =>
        row.map(cell => {
          const str = String(cell);
          // Escape quotes and wrap in quotes if contains comma
          if (str.includes(',') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
      {/* Table Controls */}
      <div className={`flex items-center justify-between gap-3 p-3 border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
        }`}>
        <div className="relative flex-1 max-w-xs">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'
            }`} size={14} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={`w-full pl-9 pr-3 py-1.5 text-sm rounded-md border outline-none transition-colors ${isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 placeholder-slate-500 focus:border-blue-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
              }`}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
            {processedData.length} rows
          </span>
          <button
            onClick={exportToCSV}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
              }`}
            title="Export to CSV"
          >
            <Download size={14} />
            CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={`sticky top-0 ${isDark ? 'bg-slate-800' : 'bg-slate-100'
            }`}>
            <tr>
              {data.headers.map((header, index) => (
                <th
                  key={index}
                  onClick={() => handleSort(index)}
                  className={`px-4 py-2 text-left font-semibold cursor-pointer select-none transition-colors ${isDark
                      ? 'text-slate-300 hover:bg-slate-700'
                      : 'text-slate-700 hover:bg-slate-200'
                    } ${sortColumn === index ? (isDark ? 'bg-slate-700' : 'bg-slate-200') : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate">{header}</span>
                    {sortColumn === index ? (
                      sortDirection === 'asc' ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )
                    ) : (
                      <ChevronsUpDown size={14} className="opacity-30" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-t transition-colors ${isDark
                    ? 'border-slate-800 hover:bg-slate-800/50'
                    : 'border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`px-4 py-2 ${isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                  >
                    <div className="max-w-md truncate" title={String(cell)}>
                      {String(cell)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
          }`}>
          <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
                }`}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
                }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveTable;
