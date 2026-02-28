'use client';

import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodeBlock({ code, language, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      {title && (
        <div className="bg-[#1A1A1A] border border-[var(--border-subtle)] border-b-0 px-4 py-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-[var(--color-muted)] uppercase tracking-wider font-[family-name:var(--font-mono)]">
            {title}
          </span>
          {language && (
            <span className="text-[10px] text-[var(--color-muted)] font-[family-name:var(--font-mono)] uppercase">
              {language}
            </span>
          )}
        </div>
      )}
      <div className={`bg-[#0A0A0A] border border-[var(--border-subtle)] p-4 overflow-x-auto ${title ? '' : 'rounded-none'}`}>
        <pre className="font-[family-name:var(--font-mono)] text-[13px] leading-relaxed text-[rgba(255,255,255,0.75)] whitespace-pre">
          {code}
        </pre>
        <button
          onClick={copyCode}
          className="absolute top-3 right-3 p-1.5 text-[var(--color-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-all opacity-0 group-hover:opacity-100"
          title="Copy code"
        >
          {copied ? (
            <svg className="w-4 h-4 text-[var(--color-green)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
