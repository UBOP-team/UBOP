import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Filter,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessor?: (row: T) => any;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T) => string | number;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  bulkActions?: (selectedRows: T[]) => React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  emptySubtext?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Filter records...',
  searchFilter,
  bulkActions,
  isLoading = false,
  emptyMessage = 'No records found',
  emptySubtext = 'Try adjusting your filters or search query.',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [density, setDensity] = useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Filtering
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    if (searchFilter) {
      return data.filter((row) => searchFilter(row, searchQuery.toLowerCase()));
    }
    return data.filter((row) =>
      Object.values(row as Record<string, any>).some((val) =>
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery, searchFilter]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    const colDef = columns.find((c) => c.id === sortColumn);
    if (!colDef) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = colDef.accessor ? colDef.accessor(a) : (a as any)[colDef.id];
      const bVal = colDef.accessor ? colDef.accessor(b) : (b as any)[colDef.id];

      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      const comparison = aVal > bVal ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection, columns]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Handle Sort
  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  // Selection
  const allCurrentPageSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedIds.has(keyExtractor(row)));

  const someCurrentPageSelected =
    paginatedData.some((row) => selectedIds.has(keyExtractor(row))) &&
    !allCurrentPageSelected;

  const toggleSelectAll = () => {
    const newSet = new Set(selectedIds);
    if (allCurrentPageSelected) {
      paginatedData.forEach((row) => newSet.delete(keyExtractor(row)));
    } else {
      paginatedData.forEach((row) => newSet.add(keyExtractor(row)));
    }
    setSelectedIds(newSet);
  };

  const toggleSelectRow = (key: string | number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelectedIds(newSet);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (sortedData.length === 0) return;
    const headerRow = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rows = sortedData.map((row) => {
      return columns
        .map((c) => {
          const val = c.accessor ? c.accessor(row) : (row as any)[c.id];
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        })
        .join(',');
    });
    const csvContent = [headerRow, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const densityClasses = {
    compact: 'py-1.5 px-3 text-[11px]',
    standard: 'py-2.5 px-3.5 text-xs',
    relaxed: 'py-3.5 px-4 text-xs',
  };

  const selectedRowsList = useMemo(() => {
    return data.filter((row) => selectedIds.has(keyExtractor(row)));
  }, [data, selectedIds, keyExtractor]);

  return (
    <div className="space-y-3">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Density Selector */}
          <div className="inline-flex bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setDensity('compact')}
              className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                density === 'compact' ? 'bg-slate-800 text-teal-400 font-bold' : 'text-slate-400'
              }`}
              title="Compact density"
            >
              Compact
            </button>
            <button
              onClick={() => setDensity('standard')}
              className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                density === 'standard' ? 'bg-slate-800 text-teal-400 font-bold' : 'text-slate-400'
              }`}
              title="Standard density"
            >
              Standard
            </button>
            <button
              onClick={() => setDensity('relaxed')}
              className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                density === 'relaxed' ? 'bg-slate-800 text-teal-400 font-bold' : 'text-slate-400'
              }`}
              title="Relaxed density"
            >
              Relaxed
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition-colors"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" /> Export CSV
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (when rows selected) */}
      {selectedIds.size > 0 && (
        <div className="p-2.5 bg-teal-950/40 border border-teal-500/40 rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-teal-300 font-medium">
            <CheckSquare className="w-4 h-4 text-teal-400" />
            <span>
              {selectedIds.size} {selectedIds.size === 1 ? 'row' : 'rows'} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {bulkActions && bulkActions(selectedRowsList)}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1 text-slate-400 hover:text-slate-200 text-[11px]"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                {/* Checkbox Column */}
                <th className="p-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    {allCurrentPageSelected ? (
                      <CheckSquare className="w-4 h-4 text-teal-400" />
                    ) : someCurrentPageSelected ? (
                      <MinusSquare className="w-4 h-4 text-teal-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                </th>

                {columns.map((col) => {
                  const isSorted = sortColumn === col.id;
                  const alignClass =
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left';

                  return (
                    <th
                      key={col.id}
                      style={{ width: col.width }}
                      className={`p-3 font-semibold ${alignClass}`}
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          onClick={() => handleSort(col.id)}
                          className="inline-flex items-center gap-1 hover:text-slate-200 transition-colors uppercase font-mono text-[10px]"
                        >
                          <span>{col.header}</span>
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-teal-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-teal-400" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 text-slate-600" />
                          )}
                        </button>
                      ) : (
                        <span>{col.header}</span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-3 text-center">
                      <div className="w-4 h-4 bg-slate-800 rounded mx-auto" />
                    </td>
                    {columns.map((col) => (
                      <td key={col.id} className={densityClasses[density]}>
                        <div className="h-4 bg-slate-800 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center">
                    <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <div className="text-sm font-semibold text-slate-300">{emptyMessage}</div>
                    <div className="text-xs text-slate-500 mt-1">{emptySubtext}</div>
                  </td>
                </tr>
              ) : (
                // Actual Rows
                paginatedData.map((row) => {
                  const rowKey = keyExtractor(row);
                  const isSelected = selectedIds.has(rowKey);

                  return (
                    <tr
                      key={rowKey}
                      className={`hover:bg-slate-900/40 transition-colors ${
                        isSelected ? 'bg-teal-950/20' : ''
                      }`}
                    >
                      <td className="p-3 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(rowKey)}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-teal-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                      </td>

                      {columns.map((col) => {
                        const alignClass =
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left';

                        return (
                          <td
                            key={col.id}
                            className={`${densityClasses[density]} ${alignClass} text-slate-300 align-middle`}
                          >
                            {col.cell
                              ? col.cell(row)
                              : col.accessor
                              ? String(col.accessor(row) ?? '')
                              : String((row as any)[col.id] ?? '')}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Showing {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Page Size */}
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 font-mono text-[11px]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Prev / Next */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="font-mono px-2 text-[11px] text-slate-300">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
