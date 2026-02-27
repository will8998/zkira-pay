'use client';

import { useState } from 'react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface AdminDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKey?: keyof T;
  onSearch?: (query: string) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
  filters?: React.ReactNode;
}

export function AdminDataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchKey,
  onSearch,
  pagination,
  filters
}: AdminDataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (onSearch) {
      onSearch(query);
    }
  };

  const filteredData = searchKey && !onSearch 
    ? data.filter(item => {
        if (!item) return false;
        const value = String(item[searchKey] || '');
        return value.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : data;

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-button)] focus:border-transparent min-h-[44px] text-[16px]"
          />
        </div>
        {filters && (
          <div className="flex items-center gap-2">
            {filters}
          </div>
        )}
      </div>

      {/* Table */}
      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-hover)] border-b border-[var(--color-border)]">
              <tr>
                {columns.map((column, index) => (
                  <th 
                    key={index}
                    className={`px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider ${column.className || ''}`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-[var(--color-hover)]">
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || ''}`}>
                        {column.render 
                          ? column.render(item)
                          : String(item[column.key] || '-')
                        }
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-[var(--color-muted)]">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="px-6 py-3 bg-[var(--color-hover)] border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--color-muted)]">Rows per page:</span>
              <select
                value={pagination.limit}
                onChange={(e) => pagination.onLimitChange(Number(e.target.value))}
                className="border border-[var(--color-border)] rounded px-2 py-1 text-sm min-h-[44px]"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--color-muted)]">
                {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </span>
              
              <div className="flex gap-1">
                <button
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 border border-[var(--color-border)] rounded hover:bg-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  disabled={pagination.page === totalPages}
                  className="p-2 border border-[var(--color-border)] rounded hover:bg-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredData.length > 0 ? (
          filteredData.map((item, index) => (
            <div key={index} className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
              {columns.map((column, colIndex) => (
                <div key={colIndex} className="flex justify-between py-1.5">
                  <span className="text-xs text-[var(--color-muted)]">{column.label}</span>
                  <div className="text-sm text-[var(--color-text)]">
                    {column.render ? column.render(item) : String(item[column.key] || '-')}
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center text-[var(--color-muted)]">
            No data found
          </div>
        )}

        {/* Mobile Pagination */}
        {pagination && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-muted)]">Rows per page:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => pagination.onLimitChange(Number(e.target.value))}
                  className="border border-[var(--color-border)] rounded px-2 py-1 text-sm min-h-[44px]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <span className="text-sm text-[var(--color-muted)]">
                  {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </span>
                
                <div className="flex gap-1">
                  <button
                    onClick={() => pagination.onPageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 border border-[var(--color-border)] rounded hover:bg-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => pagination.onPageChange(pagination.page + 1)}
                    disabled={pagination.page === totalPages}
                    className="p-2 border border-[var(--color-border)] rounded hover:bg-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}