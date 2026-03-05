export default function HistoryLoading() {
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto space-y-4 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 w-32 bg-[var(--color-surface)] rounded" />
          <div className="h-4 w-64 bg-[var(--color-surface)] rounded mt-2" />
        </div>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg" />
        ))}
      </div>
    </div>
  );
}
