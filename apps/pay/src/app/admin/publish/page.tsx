'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface PageItem {
  slug: string;
  title: string;
  updatedAt: string;
  publishedAt?: string;
}

interface PublishResult {
  success: boolean;
  output?: string;
  error?: string;
}

export default function PublishPage() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [lastPublishTime, setLastPublishTime] = useState<string | null>(null);

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

  const handlePublish = async () => {
    setPublishing(true);
    setPublishResult(null);
    
    try {
      const result = await adminFetch('/api/admin/content/publish', {
        method: 'POST',
      });
      
      setPublishResult(result);
      if (result.success) {
        setLastPublishTime(new Date().toISOString());
      }
    } catch (error) {
      console.error('Failed to publish:', error);
      setPublishResult({
        success: false,
        error: 'Failed to trigger publish. Please try again.',
      });
    } finally {
      setPublishing(false);
    }
  };

  // Find pages that have been modified since last publish
  const getUnpublishedChanges = () => {
    return pages.filter(page => {
      if (!page.publishedAt) return true;
      return new Date(page.updatedAt) > new Date(page.publishedAt);
    });
  };

  const unpublishedChanges = getUnpublishedChanges();

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-[var(--color-hover)] min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded-none w-48 mb-2"></div>
          <div className="h-4 bg-[var(--color-skeleton)] rounded-none w-64 mb-8"></div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-none p-6">
            <div className="h-32 bg-[var(--color-skeleton)] rounded-none mb-4"></div>
            <div className="h-12 bg-[var(--color-skeleton)] rounded-none w-32"></div>
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
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)] mb-2">Publish Website</h1>
        <p className="text-[var(--color-muted)]">Push content changes to the live marketing website</p>
      </div>

      {/* Main Publish Card */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-none mb-6">
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Publish Control</h3>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <p className="text-[var(--color-muted)] mb-4">
              When you publish, the marketing website will rebuild with the latest content from the database. 
              This usually takes about 15-30 seconds.
            </p>
            
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-3 bg-[var(--color-button)] text-[var(--color-button-text)] px-6 py-3 text-sm font-medium hover:bg-[var(--color-button)]/90 disabled:opacity-50 rounded-none transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.58-5.84a14.927 14.927 0 015.84 2.58m-2.58 5.84a6.002 6.002 0 01-5.84-2.58m5.84 2.58a6.002 6.002 0 015.84-2.58" />
              </svg>
              {publishing ? 'Publishing...' : 'Publish Now'}
            </button>
          </div>

          {/* Status Display */}
          {publishing && (
            <div className="flex items-center gap-3 p-4 bg-[var(--color-hover)] border border-[var(--color-border)] rounded-none">
              <div className="animate-spin w-5 h-5 border-2 border-[var(--color-green)] border-t-transparent rounded-full"></div>
              <span className="text-[var(--color-text)] font-medium">Rebuilding website...</span>
            </div>
          )}

          {publishResult && !publishing && (
            <div className={`p-4 border rounded-none ${
              publishResult.success
                ? 'bg-[#E8F5E0] border-[#C5E6B4]'
                : 'bg-[#FEF2F2] border-[#FECACA]'
            }`}>
              <div className="flex items-center gap-3">
                {publishResult.success ? (
                  <svg className="w-5 h-5 text-[var(--color-green)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[var(--color-red)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <div>
                  <p className={`font-medium ${
                    publishResult.success ? 'text-[var(--color-green-hover)]' : 'text-[#B91C1C]'
                  }`}>
                    {publishResult.success 
                      ? 'Website published successfully!' 
                      : 'Publish failed'
                    }
                  </p>
                  {lastPublishTime && publishResult.success && (
                    <p className="text-[var(--color-green)] text-sm mt-1">
                      Published at {new Date(lastPublishTime).toLocaleString()}
                    </p>
                  )}
                  {publishResult.error && (
                    <p className="text-[var(--color-red)] text-sm mt-1">{publishResult.error}</p>
                  )}
                </div>
              </div>
              
              {publishResult.output && (
                <details className="mt-3">
                  <summary className={`cursor-pointer text-sm ${
                    publishResult.success ? 'text-[var(--color-green-hover)]' : 'text-[var(--color-red)]'
                  }`}>
                    View output
                  </summary>
                  <pre className="mt-2 p-3 bg-[var(--color-hover)] text-xs text-[var(--color-text-secondary)] overflow-x-auto font-mono rounded-none">
                    {publishResult.output}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Changes */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-none">
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Recent Changes</h3>
        </div>
        
        <div className="p-4">
          {unpublishedChanges.length === 0 ? (
            <p className="text-[var(--color-muted)] text-sm">No unpublished changes</p>
          ) : (
            <div>
              <p className="text-[var(--color-muted)] text-sm mb-3">
                {unpublishedChanges.length} page(s) have been modified since last publish:
              </p>
              <div className="space-y-2">
                {unpublishedChanges.map((page) => (
                  <div key={page.slug} className="flex items-center justify-between py-2 px-3 bg-[var(--color-hover)] border border-[var(--color-border)] rounded-none">
                    <div>
                      <span className="text-[var(--color-text)] font-medium">{page.slug}</span>
                      <span className="ml-2 inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-none">
                        Modified
                      </span>
                    </div>
                    <span className="text-[var(--color-muted)] text-sm">
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}