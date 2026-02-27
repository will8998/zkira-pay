'use client';

import type { TimelineBlock } from '@/types/content';
import { ArrayField } from './ArrayField';

interface Props {
  value: TimelineBlock;
  onChange: (value: TimelineBlock) => void;
}

interface TimelineItem {
  version?: string;
  date: string;
  status: 'shipped' | 'in-progress' | 'planned';
  title: string;
  items: string[];
}

export function TimelineEditor({ value, onChange }: Props) {
  const handleItemsChange = (items: TimelineItem[]) => {
    onChange({
      ...value,
      items
    });
  };

  const renderTimelineItem = (item: TimelineItem, index: number, onItemChange: (item: TimelineItem) => void) => (
    <div className="space-y-4 border border-[var(--color-border)] p-4 bg-[var(--color-hover)]">
      <div className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
        Timeline Item {index + 1}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Version */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Version (Optional)
          </label>
          <input
            type="text"
            value={item.version || ''}
            onChange={(e) => onItemChange({ ...item, version: e.target.value })}
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
            value={item.date || ''}
            onChange={(e) => onItemChange({ ...item, date: e.target.value })}
            placeholder="Q1 2024 or March 2024"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>

        {/* Status */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Status
          </label>
          <select
            value={item.status || 'planned'}
            onChange={(e) => onItemChange({ ...item, status: e.target.value as 'shipped' | 'in-progress' | 'planned' })}
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          >
            <option value="shipped">Shipped</option>
            <option value="in-progress">In Progress</option>
            <option value="planned">Planned</option>
          </select>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Title
        </label>
        <input
          type="text"
          value={item.title || ''}
          onChange={(e) => onItemChange({ ...item, title: e.target.value })}
          placeholder="Major milestone title"
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
        />
      </div>

      {/* Items */}
      <ArrayField
        items={item.items}
        onChange={(items) => onItemChange({ ...item, items })}
        renderItem={renderBulletPoint}
        createEmpty={createEmptyBulletPoint}
        label="Bullet Points"
        addLabel="Add Bullet Point"
      />
    </div>
  );

  const renderBulletPoint = (bulletPoint: string, index: number, onBulletPointChange: (bulletPoint: string) => void) => (
    <div>
      <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
        Bullet Point {index + 1}
      </label>
      <input
        type="text"
        value={bulletPoint}
        onChange={(e) => onBulletPointChange(e.target.value)}
        placeholder="Feature or improvement description"
        className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
      />
    </div>
  );

  const createEmptyTimelineItem = (): TimelineItem => ({
    version: '',
    date: '',
    status: 'planned',
    title: '',
    items: []
  });

  const createEmptyBulletPoint = () => '';

  return (
    <div className="space-y-4">
      <ArrayField
        items={value.items}
        onChange={handleItemsChange}
        renderItem={renderTimelineItem}
        createEmpty={createEmptyTimelineItem}
        label="Timeline Items"
        addLabel="Add Timeline Item"
      />
    </div>
  );
}