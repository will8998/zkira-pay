'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin-api';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  tags: string[];
  readTime?: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BlogEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === 'new';
  
  const [post, setPost] = useState<BlogPost>({
    id: '',
    slug: '',
    title: '',
    excerpt: '',
    content: '',
    author: '',
    tags: [],
    readTime: '',
    published: false,
    createdAt: '',
    updatedAt: '',
  });
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (isNew) return;
    
    const fetchPost = async () => {
      try {
        // Fetch all posts and find the one with matching id
        const allPosts = await adminFetch('/api/admin/blog');
        const foundPost = allPosts.find((p: BlogPost) => p.id === id);
        
        if (foundPost) {
          setPost(foundPost);
          setTagsInput(foundPost.tags.join(', '));
        } else {
          console.error('Post not found');
          router.push('/admin/blog');
        }
      } catch (error) {
        console.error('Failed to fetch post:', error);
        router.push('/admin/blog');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, isNew, router]);

  // Auto-generate slug from title
  useEffect(() => {
    if (isNew && post.title && !post.slug) {
      const slug = post.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setPost(prev => ({ ...prev, slug }));
    }
  }, [post.title, post.slug, isNew]);

  const handleSave = async () => {
    if (!post.title || !post.slug) {
      alert('Title and slug are required');
      return;
    }
    
    setSaving(true);
    setSaveStatus('saving');
    
    try {
      const tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);
      const postData = { ...post, tags };
      
      if (isNew) {
        const newPost = await adminFetch('/api/admin/blog', {
          method: 'POST',
          body: JSON.stringify(postData),
        });
        router.push(`/admin/blog/${newPost.id}`);
      } else {
        await adminFetch(`/api/admin/blog/${id}`, {
          method: 'PUT',
          body: JSON.stringify(postData),
        });
      }
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save post:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    try {
      await adminFetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
      });
      router.push('/admin/blog');
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-[var(--color-hover)] min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded-none w-48 mb-8"></div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-none p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-[var(--color-skeleton)] rounded-none w-24 mb-2"></div>
                  <div className="h-10 bg-[var(--color-skeleton)] rounded-none w-full"></div>
                </div>
              ))}
            </div>
          </div>
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
              href="/admin/blog"
              className="flex items-center gap-2 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to blog
            </Link>
            <h1 className="text-lg font-semibold text-[var(--color-text)]">
              {isNew ? 'New Post' : 'Edit Post'}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {!isNew && (
              <button
                onClick={handleDelete}
                className="text-[var(--color-red)] hover:text-[#B91C1C] px-3 py-2 text-sm font-medium transition-colors"
              >
                Delete
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[var(--color-button)] text-[var(--color-button-text)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-button)]/90 disabled:opacity-50 rounded-none transition-colors"
            >
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && 'Saved ✓'}
              {saveStatus === 'error' && 'Error saving'}
              {saveStatus === 'idle' && (isNew ? 'Create Post' : 'Save')}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-none">
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Post Details</h3>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Title *
              </label>
              <input
                type="text"
                value={post.title}
                onChange={(e) => setPost({ ...post, title: e.target.value })}
                className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors rounded-none"
                placeholder="Enter post title..."
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Slug *
              </label>
              <input
                type="text"
                value={post.slug}
                onChange={(e) => setPost({ ...post, slug: e.target.value })}
                className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors rounded-none font-mono"
                placeholder="post-url-slug"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Excerpt
              </label>
              <textarea
                value={post.excerpt}
                onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
                rows={3}
                className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors rounded-none resize-none"
                placeholder="Brief description of the post..."
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Author
              </label>
              <input
                type="text"
                value={post.author}
                onChange={(e) => setPost({ ...post, author: e.target.value })}
                className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors rounded-none"
                placeholder="Author name..."
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Tags
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors rounded-none"
                placeholder="tag1, tag2, tag3..."
              />
              <p className="text-xs text-[var(--color-muted)] mt-1">Separate tags with commas</p>
            </div>

            {/* Read Time */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Read Time
              </label>
              <input
                type="text"
                value={post.readTime || ''}
                onChange={(e) => setPost({ ...post, readTime: e.target.value })}
                className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors rounded-none"
                placeholder="5 min read"
              />
            </div>

            {/* Published */}
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={post.published}
                  onChange={(e) => setPost({ ...post, published: e.target.checked })}
                  className="w-4 h-4 text-[var(--color-text)] border-[var(--color-border)] rounded-none focus:ring-[var(--color-text)]"
                />
                <span className="text-sm font-medium text-[var(--color-text)]">Published</span>
              </label>
              <p className="text-xs text-[var(--color-muted)] mt-1">Check to make this post visible on the website</p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Content (Markdown)
              </label>
              <textarea
                value={post.content}
                onChange={(e) => setPost({ ...post, content: e.target.value })}
                rows={20}
                className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors rounded-none resize-none font-mono"
                placeholder="Write your post content in Markdown..."
              />
              <p className="text-xs text-[var(--color-muted)] mt-1">
                Use Markdown syntax for formatting. Supports headers, links, code blocks, etc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}