'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin-api';
import { PageHeaderEditor } from '@/components/admin/content-editors/PageHeaderEditor';
import { ContentBlockEditor } from '@/components/admin/content-editors/ContentBlockEditor';
import type { PageContent, HomePageContent, ContentBlock } from '@/types/content';

interface PageData {
  slug: string;
  title: string;
  content: PageContent | HomePageContent;
  seoTitle?: string;
  seoDescription?: string;
  updatedAt: string;
  publishedAt?: string;
}

export default function ContentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [seoExpanded, setSeoExpanded] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const data = await adminFetch(`/api/content/pages/${slug}`);
        setPage(data);
      } catch (error) {
        console.error('Failed to fetch page:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug]);

  const handleSave = async () => {
    if (!page) return;
    
    setSaving(true);
    setSaveStatus('saving');
    
    try {
      await adminFetch(`/api/admin/content/pages/${slug}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: isHomePage(page.content) ? 'Home' : page.content.page_header.title,
          content: page.content,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
        }),
      });
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save page:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const isHomePage = (content: PageContent | HomePageContent): content is HomePageContent => {
    return 'hero' in content;
  };

  const addSection = (blockType: ContentBlock['type']) => {
    if (!page || isHomePage(page.content)) return;
    
    const newBlock: ContentBlock = createEmptyBlock(blockType);
    
    setPage({
      ...page,
      content: {
        ...page.content,
        sections: [...page.content.sections, newBlock],
      },
    });
  };

  const createEmptyBlock = (type: ContentBlock['type']): ContentBlock => {
    switch (type) {
      case 'text':
        return { type: 'text', paragraphs: [''] };
      case 'blockquote':
        return { type: 'blockquote', text: '' };
      case 'section_header':
        return { type: 'section_header', title: '' };
      case 'cards':
        return { type: 'cards', items: [] };
      case 'faq':
        return { type: 'faq', categories: [] };
      case 'stats':
        return { type: 'stats', items: [] };
      case 'cta':
        return { type: 'cta', title: '', buttons: [] };
      case 'code':
        return { type: 'code', language: 'javascript', code: '' };
      case 'list':
        return { type: 'list', style: 'bullet', items: [] };
      case 'team':
        return { type: 'team', members: [] };
      case 'timeline':
        return { type: 'timeline', items: [] };
      case 'changelog':
        return { type: 'changelog', entries: [] };
      case 'legal':
        return { type: 'legal', lastUpdated: new Date().toISOString(), sections: [] };
      case 'steps':
        return { type: 'steps', items: [] };
      case 'comparison':
        return { type: 'comparison', headers: { priv: 'ZKIRA Pay', traditional: 'Traditional' }, rows: [] };
      default:
        return { type: 'text', paragraphs: [''] };
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-[var(--color-hover)] min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded-none w-48 mb-8"></div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-none p-6">
            <div className="h-6 bg-[var(--color-skeleton)] rounded-none w-32 mb-4"></div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-[var(--color-skeleton)] rounded-none"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="p-4 md:p-6 bg-[var(--color-hover)] min-h-screen">
        <div className="text-center py-12">
          <p className="text-[var(--color-muted)]">Page not found</p>
          <Link
            href="/admin/content"
            className="inline-block mt-4 text-[var(--color-text)] hover:underline"
          >
            ← Back to pages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-hover)] min-h-screen">
      {/* Top Bar */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/content"
              className="flex items-center gap-2 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to pages
            </Link>
            <h1 className="text-lg font-semibold text-[var(--color-text)]">{slug}</h1>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[var(--color-button)] text-[var(--color-button-text)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-button)]/90 disabled:opacity-50 rounded-none transition-colors"
          >
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'Saved ✓'}
            {saveStatus === 'error' && 'Error saving'}
            {saveStatus === 'idle' && 'Save'}
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* SEO Section */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-none mb-6">
          <button
            onClick={() => setSeoExpanded(!seoExpanded)}
            className="w-full px-4 py-3 text-left flex items-center justify-between border-b border-[var(--color-border)] hover:bg-[var(--color-hover)] transition-colors"
          >
            <span className="text-sm font-medium text-[var(--color-text)]">SEO Settings</span>
            <svg
              className={`w-4 h-4 text-[var(--color-muted)] transition-transform ${seoExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          
          {seoExpanded && (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={page.seoTitle || ''}
                  onChange={(e) => setPage({ ...page, seoTitle: e.target.value })}
                  className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors rounded-none"
                  placeholder="Enter SEO title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  SEO Description
                </label>
                <textarea
                  value={page.seoDescription || ''}
                  onChange={(e) => setPage({ ...page, seoDescription: e.target.value })}
                  rows={3}
                  className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors rounded-none resize-none"
                  placeholder="Enter SEO description..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Content Editor */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-none">
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Page Content</h3>
          </div>
          
          <div className="p-4 space-y-6">
            {isHomePage(page.content) ? (
              // Homepage Editor - Simple JSON textareas for each section
              <div className="space-y-6">
                <div className="text-sm text-[var(--color-muted)] mb-4">
                  Homepage content is complex. Each section below is editable as JSON.
                </div>
                
                {Object.entries(page.content).map(([sectionKey, sectionData]) => (
                  <div key={sectionKey}>
                    <label className="block text-sm font-medium text-[var(--color-text)] mb-2 capitalize">
                      {sectionKey.replace(/_/g, ' ')} Section
                    </label>
                    <textarea
                      value={JSON.stringify(sectionData, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setPage({
                            ...page,
                            content: {
                              ...page.content,
                              [sectionKey]: parsed,
                            },
                          });
                        } catch {
                          // Invalid JSON, don't update
                        }
                      }}
                      rows={8}
                      className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors rounded-none resize-none font-mono"
                    />
                  </div>
                ))}
              </div>
            ) : (
              // Regular Page Editor
              <div className="space-y-6">
                {/* Page Header Editor */}
                <div>
                  <h4 className="text-sm font-medium text-[var(--color-text)] mb-3">Page Header</h4>
                  <PageHeaderEditor
                    value={(page.content as PageContent).page_header}
                    onChange={(header) =>
                      setPage({
                        ...page,
                        content: { ...(page.content as PageContent), page_header: header },
                      })
                    }
                  />
                </div>

                {/* Sections */}
                <div>
                  <h4 className="text-sm font-medium text-[var(--color-text)] mb-3">Content Sections</h4>
                  <div className="space-y-4">
                    {(page.content as PageContent).sections.map((section: ContentBlock, index: number) => (
                      <div key={index} className="border border-[var(--color-border)] rounded-none p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                            {section.type.replace('_', ' ')} Block
                          </span>
                          <button
                            onClick={() => {
                              const newSections = (page.content as PageContent).sections.filter((_: ContentBlock, i: number) => i !== index);
                              setPage({
                                ...page,
                                content: { ...(page.content as PageContent), sections: newSections },
                              });
                            }}
                            className="text-[var(--color-red)] hover:text-[#B91C1C] text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <ContentBlockEditor
                          block={section}
                          onChange={(updatedBlock) => {
                            const newSections = [...(page.content as PageContent).sections];
                            newSections[index] = updatedBlock;
                            setPage({
                              ...page,
                              content: { ...(page.content as PageContent), sections: newSections },
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Section Button */}
                <div className="border-t border-[var(--color-border)] pt-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[var(--color-text)]">Add Section:</span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addSection(e.target.value as ContentBlock['type']);
                          e.target.value = '';
                        }
                      }}
                      className="border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors rounded-none"
                    >
                      <option value="">Choose block type...</option>
                      <option value="text">Text</option>
                      <option value="blockquote">Blockquote</option>
                      <option value="section_header">Section Header</option>
                      <option value="cards">Cards</option>
                      <option value="faq">FAQ</option>
                      <option value="stats">Stats</option>
                      <option value="cta">Call to Action</option>
                      <option value="code">Code Block</option>
                      <option value="list">List</option>
                      <option value="team">Team</option>
                      <option value="timeline">Timeline</option>
                      <option value="changelog">Changelog</option>
                      <option value="legal">Legal</option>
                      <option value="steps">Steps</option>
                      <option value="comparison">Comparison</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}