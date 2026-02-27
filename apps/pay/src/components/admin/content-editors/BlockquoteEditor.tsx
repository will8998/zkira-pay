'use client';

import type { BlockquoteBlock } from '@/types/content';

interface Props {
  value: BlockquoteBlock;
  onChange: (value: BlockquoteBlock) => void;
}

export function BlockquoteEditor({ value, onChange }: Props) {
  const handleTextChange = (text: string) => {
    onChange({
      ...value,
      text
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Quote Text
        </label>
        <textarea
          value={value.text || ''}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Enter the quote text..."
          rows={4}
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors resize-vertical"
        />
      </div>
    </div>
  );
}