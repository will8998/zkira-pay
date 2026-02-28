'use client';

import type { ComparisonBlock } from '@/types/content';
import { ArrayField } from './ArrayField';

interface Props {
  value: ComparisonBlock;
  onChange: (value: ComparisonBlock) => void;
}

interface ComparisonRow {
  feature: string;
  priv: string | boolean;
  traditional: string | boolean;
}

export function ComparisonEditor({ value, onChange }: Props) {
  const handleChange = (field: keyof ComparisonBlock, newValue: any) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const handleRowsChange = (rows: ComparisonRow[]) => {
    handleChange('rows', rows);
  };

  const handleHeadersChange = (field: 'priv' | 'traditional', newValue: string) => {
    onChange({
      ...value,
      headers: {
        ...value.headers,
        [field]: newValue
      }
    });
  };

  const renderRow = (row: ComparisonRow, index: number, onRowChange: (row: ComparisonRow) => void) => (
    <div className="space-y-3 border border-[var(--color-border)] p-3 bg-[var(--color-hover)]">
      <div className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
        Row {index + 1}
      </div>
      
      {/* Feature */}
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Feature
        </label>
        <input
          type="text"
          value={row.feature || ''}
          onChange={(e) => onRowChange({ ...row, feature: e.target.value })}
          placeholder="Feature name"
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* ZKIRA Value */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            ZKIRA Value
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={typeof row.priv === 'string' ? row.priv : ''}
              onChange={(e) => onRowChange({ ...row, priv: e.target.value })}
              placeholder="Text value or leave empty for boolean"
              className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
            />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                <input
                  type="checkbox"
                  checked={typeof row.priv === 'boolean' ? row.priv : false}
                  onChange={(e) => onRowChange({ ...row, priv: e.target.checked })}
                  className="w-3 h-3"
                />
                Use boolean (checkmark)
              </label>
            </div>
          </div>
        </div>

        {/* Traditional Value */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Traditional Value
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={typeof row.traditional === 'string' ? row.traditional : ''}
              onChange={(e) => onRowChange({ ...row, traditional: e.target.value })}
              placeholder="Text value or leave empty for boolean"
              className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
            />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                <input
                  type="checkbox"
                  checked={typeof row.traditional === 'boolean' ? row.traditional : false}
                  onChange={(e) => onRowChange({ ...row, traditional: e.target.checked })}
                  className="w-3 h-3"
                />
                Use boolean (checkmark)
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const createEmptyRow = (): ComparisonRow => ({
    feature: '',
    priv: '',
    traditional: ''
  });

  return (
    <div className="space-y-4">
      {/* Table Headers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            ZKIRA Column Header
          </label>
          <input
            type="text"
            value={value.headers?.priv || ''}
            onChange={(e) => handleHeadersChange('priv', e.target.value)}
            placeholder="ZKIRA Pay"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Traditional Column Header
          </label>
          <input
            type="text"
            value={value.headers?.traditional || ''}
            onChange={(e) => handleHeadersChange('traditional', e.target.value)}
            placeholder="Traditional Methods"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Comparison Rows */}
      <ArrayField
        items={value.rows}
        onChange={handleRowsChange}
        renderItem={renderRow}
        createEmpty={createEmptyRow}
        label="Comparison Rows"
        addLabel="Add Row"
      />
    </div>
  );
}