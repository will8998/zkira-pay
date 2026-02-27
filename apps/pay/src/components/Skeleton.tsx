'use client';

// SkeletonLine: A single line shimmer
export function SkeletonLine({
  width = '100%',
  height = '16px',
}: {
  width?: string;
  height?: string;
}) {
  return (
    <div
      className="skeleton-shimmer"
      style={{ width, height }}
    />
  );
}

// SkeletonCard: A full card-shaped skeleton
export function SkeletonCard() {
  return (
    <div className="card-base p-6">
      {/* Title */}
      <SkeletonLine width="40%" height="20px" />
      
      {/* Description */}
      <div className="mt-3">
        <SkeletonLine width="70%" height="14px" />
      </div>
      
      {/* Sublabel */}
      <div className="mt-2">
        <SkeletonLine width="55%" height="14px" />
      </div>
    </div>
  );
}

// SkeletonTable: Multiple rows mimicking a data table
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card-base">
      {/* Header row */}
      <div className="flex p-4 space-x-4 border-b border-[var(--color-border)]">
        <SkeletonLine width="15%" height="14px" />
        <SkeletonLine width="30%" height="14px" />
        <SkeletonLine width="25%" height="14px" />
        <SkeletonLine width="20%" height="14px" />
      </div>
      
      {/* Body rows */}
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="flex space-x-4"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <SkeletonLine width="15%" height="14px" />
            <SkeletonLine width="30%" height="14px" />
            <SkeletonLine width="25%" height="14px" />
            <SkeletonLine width="20%" height="14px" />
          </div>
        ))}
      </div>
    </div>
  );
}

// SkeletonMetric: A metric card skeleton (like dashboard stats)
export function SkeletonMetric() {
  return (
    <div className="card-base p-5">
      {/* Label */}
      <SkeletonLine width="40%" height="12px" />
      
      {/* Big number */}
      <div className="mt-3">
        <SkeletonLine width="60%" height="28px" />
      </div>
      
      {/* Sublabel */}
      <div className="mt-2">
        <SkeletonLine width="30%" height="12px" />
      </div>
    </div>
  );
}