'use client';

interface InfoTooltipProps {
  text: string;
}

export default function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <div className="relative inline-flex items-center group ml-1">
      <svg 
        className="w-3.5 h-3.5 text-[var(--color-section-label)] group-hover:text-[var(--color-muted)] transition-colors cursor-help" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
      </svg>
      
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[var(--color-button)] text-[var(--color-button-text)] text-[11px] leading-relaxed px-3 py-2 rounded-md max-w-[240px] whitespace-normal z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {text}
        {/* Triangle arrow pointing down */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[var(--color-button)]" />
      </div>
    </div>
  );
}