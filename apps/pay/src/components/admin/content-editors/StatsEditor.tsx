'use client';

import type { StatsBlock } from '@/types/content';
import { ArrayField } from './ArrayField';

interface Props {
  value: StatsBlock;
  onChange: (value: StatsBlock) => void;
}

interface StatItem {
  value: string;
  label: string;
}

export function StatsEditor({ value, onChange }: Props) {
  const handleItemsChange = (items: StatItem[]) => {
    onChange({
      ...value,
      items
    });
  };

  const renderStatItem = (item: StatItem, index: number, onItemChange: (item: StatItem) => void) => (
    <div className="space-y-3 border border-[var(--color-border)] p-3 bg-[var(--color-hover)]">
      <div className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
        Stat {index + 1}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Value */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Value
          </label>
          <input
            type="text"
            value={item.value || ''}
            onChange={(e) => onItemChange({ ...item, value: e.target.value })}
            placeholder="99.9%, $1M+, 10K+"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>

        {/* Label */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Label
          </label>
          <input
            type="text"
            value={item.label || ''}
            onChange={(e) => onItemChange({ ...item, label: e.target.value })}
            placeholder="Uptime, Revenue, Users"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
      </div>
    </div>
  );

  const createEmptyStatItem = (): StatItem => ({
    value: '',
    label: ''
  });

  return (
    <div className="space-y-4">
      <ArrayField
        items={value.items}
        onChange={handleItemsChange}
        renderItem={renderStatItem}
        createEmpty={createEmptyStatItem}
        label="Statistics"
        addLabel="Add Statistic"
      />
    </div>
  );
}