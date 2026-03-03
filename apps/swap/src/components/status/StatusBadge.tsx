import type { SwapStatusValue } from '@zkira/swap-types';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';

interface StatusBadgeProps {
  status: SwapStatusValue;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = STATUS_LABELS[status] || `Unknown (${status})`;
  const textColor = STATUS_COLORS[status] || 'text-zkira-text-muted';

  const getBgColor = (textColor: string): string => {
    switch (textColor) {
      case 'text-zkira-green':
        return 'bg-zkira-green-dim';
      case 'text-zkira-red':
        return 'bg-zkira-red-dim';
      case 'text-zkira-yellow':
        return 'bg-yellow-500/10';
      case 'text-zkira-blue':
        return 'bg-blue-500/10';
      case 'text-zkira-text-muted':
      default:
        return 'bg-gray-500/10';
    }
  };

  return (
    <span
      className={`
        inline-flex px-3 py-1 rounded-full text-xs font-medium
        ${textColor} ${getBgColor(textColor)}
      `}
    >
      {label}
    </span>
  );
}
