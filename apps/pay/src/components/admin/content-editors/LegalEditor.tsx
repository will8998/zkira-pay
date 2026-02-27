'use client';

import type { LegalBlock } from '@/types/content';
import { ArrayField } from './ArrayField';

interface Props {
  value: LegalBlock;
  onChange: (value: LegalBlock) => void;
}

interface LegalSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export function LegalEditor({ value, onChange }: Props) {
  const handleChange = (field: keyof LegalBlock, newValue: any) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const handleSectionsChange = (sections: LegalSection[]) => {
    handleChange('sections', sections);
  };

  const renderSection = (section: LegalSection, index: number, onSectionChange: (section: LegalSection) => void) => (
    <div className="space-y-4 border border-[var(--color-border)] p-4 bg-[var(--color-hover)]">
      <div className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
        Section {index + 1}
      </div>
      
      {/* Section Heading */}
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Section Heading
        </label>
        <input
          type="text"
          value={section.heading || ''}
          onChange={(e) => onSectionChange({ ...section, heading: e.target.value })}
          placeholder="e.g., Terms of Service, Privacy Policy"
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
        />
      </div>

      {/* Paragraphs */}
      <ArrayField
        items={section.paragraphs}
        onChange={(paragraphs) => onSectionChange({ ...section, paragraphs })}
        renderItem={renderParagraph}
        createEmpty={createEmptyParagraph}
        label="Paragraphs"
        addLabel="Add Paragraph"
      />

      {/* List Items (Optional) */}
      <ArrayField
        items={section.list || []}
        onChange={(list) => onSectionChange({ ...section, list })}
        renderItem={renderListItem}
        createEmpty={createEmptyListItem}
        label="List Items (Optional)"
        addLabel="Add List Item"
      />
    </div>
  );

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

  const renderListItem = (item: string, index: number, onItemChange: (item: string) => void) => (
    <div>
      <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
        List Item {index + 1}
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

  const createEmptySection = (): LegalSection => ({
    heading: '',
    paragraphs: [],
    list: []
  });

  const createEmptyParagraph = () => '';
  const createEmptyListItem = () => '';

  return (
    <div className="space-y-4">
      {/* Last Updated */}
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Last Updated
        </label>
        <input
          type="text"
          value={value.lastUpdated || ''}
          onChange={(e) => handleChange('lastUpdated', e.target.value)}
          placeholder="March 15, 2024"
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
        />
      </div>

      {/* Sections */}
      <ArrayField
        items={value.sections}
        onChange={handleSectionsChange}
        renderItem={renderSection}
        createEmpty={createEmptySection}
        label="Legal Sections"
        addLabel="Add Section"
      />
    </div>
  );
}