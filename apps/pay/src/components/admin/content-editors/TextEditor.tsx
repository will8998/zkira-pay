'use client';

import type { TextBlock } from '@/types/content';
import { ArrayField } from './ArrayField';

interface Props {
  value: TextBlock;
  onChange: (value: TextBlock) => void;
}

export function TextEditor({ value, onChange }: Props) {
  const handleParagraphsChange = (paragraphs: string[]) => {
    onChange({
      ...value,
      paragraphs
    });
  };

  const renderParagraph = (paragraph: string, index: number, onParagraphChange: (paragraph: string) => void) => (
    <div>
      <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
        Paragraph {index + 1}
      </label>
      <textarea
        value={paragraph}
        onChange={(e) => onParagraphChange(e.target.value)}
        placeholder="Enter paragraph text..."
        rows={4}
        className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors resize-vertical"
      />
    </div>
  );

  const createEmptyParagraph = () => '';

  return (
    <div className="space-y-4">
      <ArrayField
        items={value.paragraphs}
        onChange={handleParagraphsChange}
        renderItem={renderParagraph}
        createEmpty={createEmptyParagraph}
        label="Text Paragraphs"
        addLabel="Add Paragraph"
      />
    </div>
  );
}