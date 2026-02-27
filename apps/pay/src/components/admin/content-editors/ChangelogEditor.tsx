'use client';

import type { ChangelogBlock } from '@/types/content';
import { ArrayField } from './ArrayField';

interface Props {
  value: ChangelogBlock;
  onChange: (value: ChangelogBlock) => void;
}

interface ChangelogEntry {
  version: string;
  date: string;
  status: string;
  features: { category: string; items: string[] }[];
}

interface FeatureCategory {
  category: string;
  items: string[];
}

export function ChangelogEditor({ value, onChange }: Props) {
  const handleEntriesChange = (entries: ChangelogEntry[]) => {
    onChange({
      ...value,
      entries
    });
  };

  const renderChangelogEntry = (entry: ChangelogEntry, index: number, onEntryChange: (entry: ChangelogEntry) => void) => (
    <div className="space-y-4 border border-[var(--color-border)] p-4 bg-[var(--color-hover)]">
      <div className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
        Changelog Entry {index + 1}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Version */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Version
          </label>
          <input
            type="text"
            value={entry.version || ''}
            onChange={(e) => onEntryChange({ ...entry, version: e.target.value })}
            placeholder="v1.0.0"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>

        {/* Date */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Date
          </label>
          <input
            type="text"
            value={entry.date || ''}
            onChange={(e) => onEntryChange({ ...entry, date: e.target.value })}
            placeholder="March 15, 2024"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>

        {/* Status */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Status
          </label>
          <input
            type="text"
            value={entry.status || ''}
            onChange={(e) => onEntryChange({ ...entry, status: e.target.value })}
            placeholder="Released, Beta, etc."
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Features */}
      <ArrayField
        items={entry.features}
        onChange={(features) => onEntryChange({ ...entry, features })}
        renderItem={renderFeatureCategory}
        createEmpty={createEmptyFeatureCategory}
        label="Feature Categories"
        addLabel="Add Feature Category"
      />
    </div>
  );

  const renderFeatureCategory = (category: FeatureCategory, index: number, onCategoryChange: (category: FeatureCategory) => void) => (
    <div className="space-y-3 border border-[var(--color-border)] p-3 bg-[var(--color-surface)]">
      <div className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
        Category {index + 1}
      </div>
      
      {/* Category Name */}
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Category
        </label>
        <input
          type="text"
          value={category.category || ''}
          onChange={(e) => onCategoryChange({ ...category, category: e.target.value })}
          placeholder="New Features, Bug Fixes, Improvements"
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
        />
      </div>

      {/* Items */}
      <ArrayField
        items={category.items}
        onChange={(items) => onCategoryChange({ ...category, items })}
        renderItem={renderFeatureItem}
        createEmpty={createEmptyFeatureItem}
        label="Features"
        addLabel="Add Feature"
      />
    </div>
  );

  const renderFeatureItem = (item: string, index: number, onItemChange: (item: string) => void) => (
    <div>
      <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
        Feature {index + 1}
      </label>
      <input
        type="text"
        value={item}
        onChange={(e) => onItemChange(e.target.value)}
        placeholder="Added new payment method support"
        className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
      />
    </div>
  );

  const createEmptyChangelogEntry = (): ChangelogEntry => ({
    version: '',
    date: '',
    status: '',
    features: []
  });

  const createEmptyFeatureCategory = (): FeatureCategory => ({
    category: '',
    items: []
  });

  const createEmptyFeatureItem = () => '';

  return (
    <div className="space-y-4">
      <ArrayField
        items={value.entries}
        onChange={handleEntriesChange}
        renderItem={renderChangelogEntry}
        createEmpty={createEmptyChangelogEntry}
        label="Changelog Entries"
        addLabel="Add Changelog Entry"
      />
    </div>
  );
}