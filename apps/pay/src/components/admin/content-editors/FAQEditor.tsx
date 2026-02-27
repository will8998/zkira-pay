'use client';

import type { FAQBlock } from '@/types/content';
import { ArrayField } from './ArrayField';

interface Props {
  value: FAQBlock;
  onChange: (value: FAQBlock) => void;
}

interface FAQCategory {
  title: string;
  items: { question: string; answer: string }[];
}

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQEditor({ value, onChange }: Props) {
  const handleCategoriesChange = (categories: FAQCategory[]) => {
    onChange({
      ...value,
      categories
    });
  };

  const renderCategory = (category: FAQCategory, index: number, onCategoryChange: (category: FAQCategory) => void) => (
    <div className="space-y-4 border border-[var(--color-border)] p-4 bg-[var(--color-hover)]">
      <div className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
        Category {index + 1}
      </div>
      
      {/* Category Title */}
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Category Title
        </label>
        <input
          type="text"
          value={category.title || ''}
          onChange={(e) => onCategoryChange({ ...category, title: e.target.value })}
          placeholder="e.g., General, Payments, Security"
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
        />
      </div>

      {/* FAQ Items */}
      <ArrayField
        items={category.items}
        onChange={(items) => onCategoryChange({ ...category, items })}
        renderItem={renderFAQItem}
        createEmpty={createEmptyFAQItem}
        label="Questions & Answers"
        addLabel="Add Question"
      />
    </div>
  );

  const renderFAQItem = (item: FAQItem, index: number, onItemChange: (item: FAQItem) => void) => (
    <div className="space-y-3 border border-[var(--color-border)] p-3 bg-[var(--color-surface)]">
      <div className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
        Q&A {index + 1}
      </div>
      
      {/* Question */}
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Question
        </label>
        <input
          type="text"
          value={item.question || ''}
          onChange={(e) => onItemChange({ ...item, question: e.target.value })}
          placeholder="What is your question?"
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
        />
      </div>

      {/* Answer */}
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Answer
        </label>
        <textarea
          value={item.answer || ''}
          onChange={(e) => onItemChange({ ...item, answer: e.target.value })}
          placeholder="Provide a detailed answer..."
          rows={4}
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors resize-vertical"
        />
      </div>
    </div>
  );

  const createEmptyCategory = (): FAQCategory => ({
    title: '',
    items: []
  });

  const createEmptyFAQItem = (): FAQItem => ({
    question: '',
    answer: ''
  });

  return (
    <div className="space-y-4">
      <ArrayField
        items={value.categories}
        onChange={handleCategoriesChange}
        renderItem={renderCategory}
        createEmpty={createEmptyCategory}
        label="FAQ Categories"
        addLabel="Add Category"
      />
    </div>
  );
}