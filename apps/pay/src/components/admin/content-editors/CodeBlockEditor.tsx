'use client';

import type { CodeBlock } from '@/types/content';

interface Props {
  value: CodeBlock;
  onChange: (value: CodeBlock) => void;
}

export function CodeBlockEditor({ value, onChange }: Props) {
  const handleChange = (field: keyof CodeBlock, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  return (
    <div className="space-y-4">
      {/* Language and Title */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Language
          </label>
          <input
            type="text"
            value={value.language || ''}
            onChange={(e) => handleChange('language', e.target.value)}
            placeholder="javascript, typescript, bash, etc."
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Title (Optional)
          </label>
          <input
            type="text"
            value={value.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Example usage"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Code */}
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Code
        </label>
        <textarea
          value={value.code || ''}
          onChange={(e) => handleChange('code', e.target.value)}
          placeholder="Enter your code here..."
          rows={12}
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[#8FD46A] bg-[#1a1a1a] focus:border-[var(--color-text)] focus:outline-none transition-colors resize-vertical font-mono"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        />
      </div>
    </div>
  );
}