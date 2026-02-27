'use client';

interface ArrayFieldProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number, onChange: (item: T) => void) => React.ReactNode;
  createEmpty: () => T;
  label?: string;
  addLabel?: string;
}

export function ArrayField<T>({
  items,
  onChange,
  renderItem,
  createEmpty,
  label,
  addLabel = "Add Item"
}: ArrayFieldProps<T>) {
  const handleAdd = () => {
    onChange([...items, createEmpty()]);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onChange(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    onChange(newItems);
  };

  const handleItemChange = (index: number, newItem: T) => {
    const newItems = [...items];
    newItems[index] = newItem;
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      {label && (
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          {label}
        </label>
      )}
      
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 relative">
            {/* Item Controls */}
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="p-1 text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move up"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(index)}
                disabled={index === items.length - 1}
                className="p-1 text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move down"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-1 text-[var(--color-muted)] hover:text-[var(--color-red)]"
                title="Remove"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Item Content */}
            <div className="pr-20">
              {renderItem(item, index, (newItem) => handleItemChange(index, newItem))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Button */}
      <button
        type="button"
        onClick={handleAdd}
        className="w-full border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-text)] text-[var(--color-muted)] hover:text-[var(--color-text)] py-3 px-4 text-sm font-medium transition-colors"
      >
        + {addLabel}
      </button>
    </div>
  );
}