'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/admin-api';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  tags: string[];
  readTime?: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BlogListPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      const data = await adminFetch('/api/admin/blog');
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-[var(--color-hover)] min-h-screen">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-8 bg-[var(--color-skeleton)] rounded-none w-48 mb-2"></div>
              <div className="h-4 bg-[var(--color-skeleton)] rounded-none w-64"></div>
            </div>
            <div className="h-10 bg-[var(--color-skeleton)] rounded-none w-24"></div>
          </div>
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
                onClick={() => { setError(null); setLoading(true); fetchPosts(); }}
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)] mb-2">Blog Posts</h1>
          <p className="text-[var(--color-muted)]">Manage blog content</p>
        </div>
        
        <button
          onClick={() => router.push('/admin/blog/new')}
          className="bg-[var(--color-button)] text-[var(--color-button-text)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-button)]/90 rounded-none transition-colors"
        >
          New Post
        </button>
      </div>

      {/* Blog Posts Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-none overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-hover)]">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">All Posts</h3>
        </div>
        
        {posts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[var(--color-muted)] mb-4">No blog posts found</p>
            <button
              onClick={() => router.push('/admin/blog/new')}
              className="bg-[var(--color-button)] text-[var(--color-button-text)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-button)]/90 rounded-none transition-colors"
            >
              Create your first post
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-hover)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Published
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Updated At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-[var(--color-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="text-[var(--color-text)] font-medium hover:underline"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[var(--color-muted)] text-sm font-mono">{post.slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[var(--color-text)]">{post.author}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-none ${
                          post.published
                            ? 'bg-[#E8F5E0] text-[#4D9A2A]'
                            : 'bg-[var(--color-hover)] text-[var(--color-text)]'
                        }`}
                      >
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[var(--color-muted)] text-sm">
                        {new Date(post.updatedAt).toLocaleDateString()}
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