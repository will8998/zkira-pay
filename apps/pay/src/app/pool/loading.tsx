export default function PoolLoading() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-4 animate-pulse">
      <div className="h-8 w-40 bg-[var(--color-surface)] rounded" />
      <div className="h-4 w-64 bg-[var(--color-surface)] rounded" />
      <div className="flex gap-2 mt-6">
        <div className="h-8 w-24 bg-[var(--color-surface)] rounded" />
        <div className="h-8 w-24 bg-[var(--color-surface)] rounded" />
      </div>
      <div className="flex gap-1 mt-6">
        <div className="flex-1 h-12 bg-[var(--color-surface)] rounded" />
        <div className="flex-1 h-12 bg-[var(--color-surface)] rounded" />
      </div>
      <div className="h-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg mt-6" />
    </div>
  );
}
