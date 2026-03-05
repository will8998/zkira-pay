'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/PageHeader';
import { CodeBlock } from '@/components/learn/CodeBlock';

interface BlogPost {
  id: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  content: React.ReactNode;
}

export default function BlogPage() {
  const t = useTranslations('blogPage');
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  const blogPosts: BlogPost[] = [
    {
      id: "casino-gateway",
      title: t('casinoGatewayTitle'),
      date: "Mar 2026",
      category: "PRODUCT",
      excerpt: t('casinoGatewayExcerpt'),
      content: (
        <div className="prose prose-invert max-w-none">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">{t('casinoGatewayProblemTitle')}</h3>
          
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('casinoGatewayProblem1')}
          </p>
          
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('casinoGatewayProblem2')}
          </p>
          
          <blockquote className="border-l-2 border-[#FFFFFF] pl-4 italic text-[var(--color-text-secondary)] text-sm leading-relaxed mt-6">
            {t('casinoGatewayQuote')}
          </blockquote>
        </div>
      )
    },
    {
      id: "multi-chain",
      title: t('multiChainTitle'),
      date: "Mar 2026",
      category: "ENGINEERING",
      excerpt: t('multiChainExcerpt'),
      content: (
        <div className="prose prose-invert max-w-none">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">{t('multiChainWhyTitle')}</h3>
          
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('multiChainWhy1')}
          </p>
          
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('multiChainWhy2')}
          </p>
          
          <blockquote className="border-l-2 border-[#FFFFFF] pl-4 italic text-[var(--color-text-secondary)] text-sm leading-relaxed mt-6">
            {t('multiChainQuote')}
          </blockquote>
        </div>
      )
    }
  ];

  const selectedPostData = selectedPost 
    ? blogPosts.find(post => post.id === selectedPost)
    : null;

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader 
        title={t('title')}
        description={t('description')}
      />

      {selectedPostData ? (
        // Article View
        <div>
          <button 
            onClick={() => setSelectedPost(null)}
            className="text-[13px] text-[var(--color-muted)] hover:text-white transition-colors mb-6 flex items-center gap-2"
          >
            ← {t('backToPosts')}
          </button>
          
          <article className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6">
            <div className="mb-6">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">
                {selectedPostData.category}
              </span>
              <div className="flex items-center gap-2 mt-1 mb-3">
                <span className="text-[11px] text-[var(--color-muted)] font-[family-name:var(--font-mono)]">
                  {selectedPostData.date}
                </span>
              </div>
              <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-4">
                {selectedPostData.title}
              </h1>
            </div>
            
            {selectedPostData.content}
          </article>
        </div>
      ) : (
        // Blog Index View
        <div className="space-y-4">
          {blogPosts.map((post, index) => (
            <article
              key={post.id}
              className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 cursor-pointer hover:border-[var(--border-subtle-hover)] transition-all animate-entrance"
              style={{
                animationDelay: `${index * 100}ms`
              }}
              onClick={() => setSelectedPost(post.id)}
            >
              <div className="mb-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">
                  {post.category}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] text-[var(--color-muted)] font-[family-name:var(--font-mono)]">
                  {post.date}
                </span>
              </div>
              
              <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-2">
                {post.title}
              </h2>
              
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                {post.excerpt}
              </p>
              
              <span className="text-[13px] text-[#FFFFFF] hover:underline">
                Read more →
              </span>
            </article>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}