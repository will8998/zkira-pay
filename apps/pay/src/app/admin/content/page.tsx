'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin-api';

interface PageItem {
  slug: string;
  title: string;
  seoTitle?: string;
  seoDescription?: string;
  updatedAt: string;
  publishedAt?: string;
}

export default function ContentListPage() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      const data = await adminFetch('/api/admin/content/pages');
      setPages(data);
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-[var(--color-hover)] min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded-none w-48 mb-2"></div>
          <div className="h-4 bg-[var(--color-skeleton)] rounded-none w-64 mb-8"></div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-none">
            <div className="p-4 border-b border-[var(--color-border)]">
              <div className="h-6 bg-[var(--color-skeleton)] rounded-none w-32"></div>
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 border-b border-[var(--color-border)] last:border-b-0">
                <div className="h-4 bg-[var(--color-skeleton)] rounded-none w-full mb-2"></div>
                <div className="h-3 bg-[var(--color-skeleton)] rounded-none w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-[#FEF2F2] border border-[#FECACA] p-4 md:p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--color-red)] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-[#991B1B]">Failed to load data</h3>
              <p className="text-sm text-[var(--color-red)] mt-1">{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); fetchPages(); }}
                className="mt-3 bg-[var(--color-button)] text-[var(--color-button-text)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-button-hover)] transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-[var(--color-hover)] min-h-screen">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)] mb-2">Website Pages</h1>
        <p className="text-[var(--color-muted)]">Manage marketing website content</p>
      </div>

      {/* Pages Count Badge */}
      <div className="mb-6">
        <span className="inline-flex items-center px-3 py-1 bg-[var(--color-button)] text-[var(--color-button-text)] text-sm font-medium rounded-none">
          {pages.length} Pages
        </span>
      </div>

      {/* Pages Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-none overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-hover)]">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">All Pages</h3>
        </div>
        
        {pages.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[var(--color-muted)]">No pages found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-hover)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Page Slug
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Published At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {pages.map((page) => (
                  <tr key={page.slug} className="hover:bg-[var(--color-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/content/${page.slug}`}
                        className="text-[var(--color-text)] font-medium hover:underline"
                      >
                        {page.slug}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[var(--color-text)]">{page.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[var(--color-muted)] text-sm">
                        {new Date(page.updatedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[var(--color-muted)] text-sm">
                        {page.publishedAt 
                          ? new Date(page.publishedAt).toLocaleDateString()
                          : 'Not published'
                        }
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}