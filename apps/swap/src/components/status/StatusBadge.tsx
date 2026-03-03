import type { SwapStatusValue } from '@zkira/swap-types';
import { STATUS_LABELS } from '@/lib/constants';

interface StatusBadgeProps {
  status: SwapStatusValue;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = STATUS_LABELS[status] || `Unknown (${status})`;

  const getStyles = (s: SwapStatusValue): { text: string; bg: string } => {
    switch (s) {
      case 'success':
        return { text: 'text-[var(--color-green)]', bg: 'bg-[var(--color-green)]/10' };
      case 'failed':
        return { text: 'text-[var(--color-red)]', bg: 'bg-[var(--color-red)]/10' };
      case 'pending':
      case 'confirming':
      case 'refunded':
        return { text: 'text-[var(--color-warning-text)]', bg: 'bg-[var(--color-warning-text)]/10' };
      case 'exchanging':
        return { text: 'text-blue-400', bg: 'bg-blue-500/10' };
      default:
        return { text: 'text-[var(--color-muted)]', bg: 'bg-gray-500/10' };
    }
  };

  const styles = getStyles(status);

  return (
    <span
      className={`
        inline-flex px-3 py-1 text-xs font-medium font-[family-name:var(--font-mono)] tracking-wider uppercase
        ${styles.text} ${styles.bg}
      `}
    >
      {label}
    </span>
  );
}
