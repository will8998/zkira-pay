'use client';

import type { StepsBlock } from '@/types/content';
import { ArrayField } from './ArrayField';

interface Props {
  value: StepsBlock;
  onChange: (value: StepsBlock) => void;
}

interface StepItem {
  number: string;
  title: string;
  description: string;
}

export function StepsEditor({ value, onChange }: Props) {
  const handleChange = (field: keyof StepsBlock, newValue: any) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const handleItemsChange = (items: StepItem[]) => {
    handleChange('items', items);
  };

  const renderStep = (step: StepItem, index: number, onStepChange: (step: StepItem) => void) => (
    <div className="space-y-3 border border-[var(--color-border)] p-3 bg-[var(--color-hover)]">
      <div className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
        Step {index + 1}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Number */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Step Number
          </label>
          <input
            type="text"
            value={step.number || ''}
            onChange={(e) => onStepChange({ ...step, number: e.target.value })}
            placeholder="01, 1, Step 1"
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
            value={step.title || ''}
            onChange={(e) => onStepChange({ ...step, title: e.target.value })}
            placeholder="Step title"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Description
        </label>
        <textarea
          value={step.description || ''}
          onChange={(e) => onStepChange({ ...step, description: e.target.value })}
          placeholder="Detailed description of this step..."
          rows={3}
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors resize-vertical"
        />
      </div>
    </div>
  );

  const createEmptyStep = (): StepItem => ({
    number: '',
    title: '',
    description: ''
  });

  return (
    <div className="space-y-4">
      {/* Heading */}
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Heading (Optional)
        </label>
        <input
          type="text"
          value={value.heading || ''}
          onChange={(e) => handleChange('heading', e.target.value)}
          placeholder="How it works"
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
        />
      </div>

      {/* Steps */}
      <ArrayField
        items={value.items}
        onChange={handleItemsChange}
        renderItem={renderStep}
        createEmpty={createEmptyStep}
        label="Steps"
        addLabel="Add Step"
      />
    </div>
  );
}