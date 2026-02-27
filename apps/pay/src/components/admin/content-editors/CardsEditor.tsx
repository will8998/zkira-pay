'use client';

import type { CardsBlock, CardItem } from '@/types/content';
import { ArrayField } from './ArrayField';

interface Props {
  value: CardsBlock;
  onChange: (value: CardsBlock) => void;
}

export function CardsEditor({ value, onChange }: Props) {
  const getLinkObj = (link?: string | { text: string; href: string }): { text: string; href: string } => {
    if (!link) return { text: '', href: '' };
    if (typeof link === 'string') return { text: link, href: link };
    return link;
  };

  const handleChange = (field: keyof CardsBlock, newValue: any) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const handleItemsChange = (items: CardItem[]) => {
    handleChange('items', items);
  };

  const renderCard = (card: CardItem, index: number, onCardChange: (card: CardItem) => void) => (
    <div className="space-y-3 border border-[var(--color-border)] p-3 bg-[var(--color-hover)]">
      <div className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
        Card {index + 1}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Icon */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Icon
          </label>
          <input
            type="text"
            value={card.icon || ''}
            onChange={(e) => onCardChange({ ...card, icon: e.target.value })}
            placeholder="Icon name or emoji"
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
            value={card.label || ''}
            onChange={(e) => onCardChange({ ...card, label: e.target.value })}
            placeholder="Optional label"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Title
        </label>
        <input
          type="text"
          value={card.title || ''}
          onChange={(e) => onCardChange({ ...card, title: e.target.value })}
          placeholder="Card title"
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Description
        </label>
        <textarea
          value={card.description || ''}
          onChange={(e) => onCardChange({ ...card, description: e.target.value })}
          placeholder="Card description"
          rows={3}
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors resize-vertical"
        />
      </div>

      {/* Link */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Link Text
          </label>
          <input
            type="text"
            value={getLinkObj(card.link).text}
            onChange={(e) => onCardChange({ 
              ...card, 
              link: { text: e.target.value, href: getLinkObj(card.link).href }
            })}
            placeholder="Learn more"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Link URL
          </label>
          <input
            type="text"
            value={getLinkObj(card.link).href}
            onChange={(e) => onCardChange({ 
              ...card, 
              link: { text: getLinkObj(card.link).text, href: e.target.value }
            })}
            placeholder="/path or https://..."
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Code */}
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Code (Optional)
        </label>
        <textarea
          value={card.code || ''}
          onChange={(e) => onCardChange({ ...card, code: e.target.value })}
          placeholder="Optional code snippet"
          rows={3}
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors resize-vertical font-mono"
        />
      </div>
    </div>
  );

  const createEmptyCard = (): CardItem => ({
    title: '',
    description: '',
    icon: '',
    label: '',
    link: { text: '', href: '' },
    code: ''
  });

  return (
    <div className="space-y-4">
      {/* Block Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Heading
          </label>
          <input
            type="text"
            value={value.heading || ''}
            onChange={(e) => handleChange('heading', e.target.value)}
            placeholder="Optional section heading"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Subtitle
          </label>
          <input
            type="text"
            value={value.subtitle || ''}
            onChange={(e) => handleChange('subtitle', e.target.value)}
            placeholder="Optional subtitle"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Columns
          </label>
          <select
            value={value.columns || 3}
            onChange={(e) => handleChange('columns', Number(e.target.value))}
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          >
            <option value={1}>1 Column</option>
            <option value={2}>2 Columns</option>
            <option value={3}>3 Columns</option>
            <option value={4}>4 Columns</option>
          </select>
        </div>
      </div>

      {/* Cards */}
      <ArrayField
        items={value.items}
        onChange={handleItemsChange}
        renderItem={renderCard}
        createEmpty={createEmptyCard}
        label="Cards"
        addLabel="Add Card"
      />
    </div>
  );
}