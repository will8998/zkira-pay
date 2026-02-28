import { LearnSidebar } from '@/components/learn/LearnSidebar';

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)]">
      <LearnSidebar />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
