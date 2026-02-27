'use client';

import type { CTABlock } from '@/types/content';
import { ArrayField } from './ArrayField';

interface Props {
  value: CTABlock;
  onChange: (value: CTABlock) => void;
}

interface CTAButton {
  text: string;
  href: string;
  variant: 'primary' | 'secondary';
  icon?: string;
}

export function CTAEditor({ value, onChange }: Props) {
  const handleChange = (field: keyof CTABlock, newValue: any) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const handleButtonsChange = (buttons: CTAButton[]) => {
    handleChange('buttons', buttons);
  };

  const renderButton = (button: CTAButton, index: number, onButtonChange: (button: CTAButton) => void) => (
    <div className="space-y-3 border border-[var(--color-border)] p-3 bg-[var(--color-hover)]">
      <div className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
        Button {index + 1}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Button Text */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Button Text
          </label>
          <input
            type="text"
            value={button.text || ''}
            onChange={(e) => onButtonChange({ ...button, text: e.target.value })}
            placeholder="Get Started"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>

        {/* Button URL */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Button URL
          </label>
          <input
            type="text"
            value={button.href || ''}
            onChange={(e) => onButtonChange({ ...button, href: e.target.value })}
            placeholder="/signup or https://..."
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Button Variant */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Button Style
          </label>
          <select
            value={button.variant || 'primary'}
            onChange={(e) => onButtonChange({ ...button, variant: e.target.value as 'primary' | 'secondary' })}
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
          </select>
        </div>

        {/* Button Icon */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Icon (Optional)
          </label>
          <input
            type="text"
            value={button.icon || ''}
            onChange={(e) => onButtonChange({ ...button, icon: e.target.value })}
            placeholder="arrow-right, download, etc."
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
      </div>
    </div>
  );

  const createEmptyButton = (): CTAButton => ({
    text: '',
    href: '',
    variant: 'primary',
    icon: ''
  });

  return (
    <div className="space-y-4">
      {/* CTA Settings */}
      <div className="grid grid-cols-1 gap-4">
        {/* Icon */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Icon (Optional)
          </label>
          <input
            type="text"
            value={value.icon || ''}
            onChange={(e) => handleChange('icon', e.target.value)}
            placeholder="Icon name or emoji"
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
            placeholder="Ready to get started?"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Description (Optional)
          </label>
          <textarea
            value={value.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Join thousands of users who trust our platform..."
            rows={3}
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors resize-vertical"
          />
        </div>

        {/* Footnote */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Footnote (Optional)
          </label>
          <input
            type="text"
            value={value.footnote || ''}
            onChange={(e) => handleChange('footnote', e.target.value)}
            placeholder="No credit card required"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Buttons */}
      <ArrayField
        items={value.buttons}
        onChange={handleButtonsChange}
        renderItem={renderButton}
        createEmpty={createEmptyButton}
        label="Buttons"
        addLabel="Add Button"
      />
    </div>
  );
}