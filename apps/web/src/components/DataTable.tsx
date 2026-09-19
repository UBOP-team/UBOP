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
    const next = new Set(selectedIds);
    if (allCurrentPageSelected) {
      paginatedData.forEach((row) => next.delete(keyExtractor(row)));
    } else {
      paginatedData.forEach((row) => next.add(keyExtractor(row)));
    }
    setSelectedIds(next);
  };

  const toggleSelectRow = (id: string | number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectedRowsList = useMemo(() => {
    return data.filter((row) => selectedIds.has(keyExtractor(row)));
  }, [data, selectedIds, keyExtractor]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = columns.map((c) => c.header).join(',');
    const rows = sortedData.map((row) => {
      return columns
        .map((col) => {
          const val = col.accessor
            ? col.accessor(row)
            : (row as any)[col.id];
          const str = String(val ?? '').replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',');
    });
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const densityClasses = {
    compact: 'py-2 px-3 text-xs',
    standard: 'py-3.5 px-4 text-xs',
    relaxed: 'py-5 px-5 text-sm',
  };

  return (
    <div className="space-y-3">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Density Selector */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setDensity('compact')}
              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                density === 'compact' ? 'bg-white text-teal-800 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Compact density"
            >
              Compact
            </button>
            <button
              onClick={() => setDensity('standard')}
              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                density === 'standard' ? 'bg-white text-teal-800 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Standard density"
            >
              Standard
            </button>
            <button
              onClick={() => setDensity('relaxed')}
              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                density === 'relaxed' ? 'bg-white text-teal-800 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Relaxed density"
            >
              Relaxed
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium transition-colors shadow-xs btn-press"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (when rows selected) */}
      {selectedIds.size > 0 && (
        <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between gap-3 text-xs animate-smooth-scale text-teal-900">
          <div className="flex items-center gap-2 font-medium">
            <CheckSquare className="w-4 h-4 text-teal-600" />
            <span>
              {selectedIds.size} {selectedIds.size === 1 ? 'row' : 'rows'} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {bulkActions && bulkActions(selectedRowsList)}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-[11px] font-medium"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                {/* Checkbox Column */}
                <th className="p-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {allCurrentPageSelected ? (
                      <CheckSquare className="w-4 h-4 text-teal-600" />
                    ) : someCurrentPageSelected ? (
                      <MinusSquare className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
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
                          className="inline-flex items-center gap-1 hover:text-slate-800 transition-colors uppercase font-mono text-[10px]"
                        >
                          <span>{col.header}</span>
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-teal-600" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-teal-600" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 text-slate-400" />
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

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-3 text-center">
                      <div className="w-4 h-4 bg-slate-100 rounded mx-auto" />
                    </td>
                    {columns.map((col) => (
                      <td key={col.id} className={densityClasses[density]}>
                        <div className="h-4 bg-slate-100 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center">
                    <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="text-sm font-semibold text-slate-800">{emptyMessage}</div>
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
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-teal-50/50' : ''
                      }`}
                    >
                      <td className="p-3 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(rowKey)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-teal-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
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
                            className={`${densityClasses[density]} ${alignClass} text-slate-700 align-middle`}
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
        <div className="p-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
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
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-mono text-[11px]"
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
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed btn-press shadow-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="font-mono px-2 text-[11px] text-slate-600">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed btn-press shadow-xs"
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
