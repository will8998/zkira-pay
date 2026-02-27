interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accentColor: string; // hex color
  change?: string; // e.g., "+12% from last month"
}

export function StatsCard({ title, value, icon, accentColor, change }: StatsCardProps) {
  return (
    <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div 
              className="p-2 md:p-3"
              style={{ 
                backgroundColor: `${accentColor}1A`, // 10% opacity
              }}
            >
              <div style={{ color: accentColor }}>
                {icon}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-muted)] mb-1">{title}</p>
              <p className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">{value}</p>
              {change && (
                <p className="text-xs text-[var(--color-muted)] mt-1">{change}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}