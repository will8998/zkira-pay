'use client';

import type { ListBlock } from '@/types/content';
import { ArrayField } from './ArrayField';

interface Props {
  value: ListBlock;
  onChange: (value: ListBlock) => void;
}

export function ListEditor({ value, onChange }: Props) {
  const handleChange = (field: keyof ListBlock, newValue: any) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const handleItemsChange = (items: string[]) => {
    handleChange('items', items);
  };

  const renderListItem = (item: string, index: number, onItemChange: (item: string) => void) => (
    <div>
      <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
        Item {index + 1}
      </label>
      <input
        type="text"
        value={item}
        onChange={(e) => onItemChange(e.target.value)}
        placeholder="List item text"
        className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
      />
    </div>
  );

  const createEmptyItem = () => '';

  return (
    <div className="space-y-4">
      {/* List Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Heading (Optional)
          </label>
          <input
            type="text"
            value={value.heading || ''}
            onChange={(e) => handleChange('heading', e.target.value)}
            placeholder="List heading"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            List Style
          </label>
          <select
            value={value.style || 'bullet'}
            onChange={(e) => handleChange('style', e.target.value as 'bullet' | 'numbered' | 'check')}
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          >
            <option value="bullet">Bullet Points</option>
            <option value="numbered">Numbered List</option>
            <option value="check">Checkmarks</option>
          </select>
        </div>
      </div>

      {/* List Items */}
      <ArrayField
        items={value.items}
        onChange={handleItemsChange}
        renderItem={renderListItem}
        createEmpty={createEmptyItem}
        label="List Items"
        addLabel="Add Item"
      />
    </div>
  );
}