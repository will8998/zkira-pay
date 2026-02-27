'use client';

import type { PageHeader } from '@/types/content';

interface Props {
  value: PageHeader;
  onChange: (value: PageHeader) => void;
}

export function PageHeaderEditor({ value, onChange }: Props) {
  const handleChange = (field: keyof PageHeader, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Label
        </label>
        <input
          type="text"
          value={value.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
          placeholder="e.g., FEATURES, ABOUT, PRICING"
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
        />
      </div>

      {/* Title */}
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Title
        </label>
        <input
          type="text"
          value={value.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Main heading text"
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Description
        </label>
        <textarea
          value={value.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Optional description text"
          rows={3}
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors resize-vertical"
        />
      </div>
    </div>
  );
}