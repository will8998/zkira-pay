'use client';

import { useState, useEffect } from 'react';
import { getHistory, clearHistory } from '@/lib/history-store';
import type { HistoryEntry } from '@/types/payment';

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(getHistory());
  }, []);

  const handleClear = () => {
    clearHistory();
    setEntries([]);
  };

  const typeLabel: Record<string, string> = {
    send: 'Sent',
    request: 'Requested',
    claim: 'Claimed',
    invoice_pay: 'Invoice Paid',
    deposit: 'Deposited',
    withdraw: 'Withdrawn',
  };

  const statusColor: Record<string, string> = {
    complete: 'bg-[rgba(156,220,106,0.15)] text-[#9CDC6A]',
    pending: 'bg-[rgba(255,209,70,0.15)] text-[#FFD146]',
    failed: 'bg-[rgba(255,40,40,0.15)] text-[#FFFFFF]',
  };

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            History
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Local transaction history (stored in your browser only)
          </p>
        </div>
        {entries.length > 0 && (
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-12 rounded-xl text-center">
          <div className="text-4xl mb-4">📭</div>
          <h2
            className="text-lg font-bold text-[var(--color-text)] mb-2"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            No Activity Yet
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Your transaction history will appear here after you send, receive, or claim payments.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div>
                  <div
                    className="text-sm font-medium text-[var(--color-text)]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {typeLabel[entry.type] ?? entry.type}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    {entry.chain.toUpperCase()} · {new Date(entry.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-sm font-medium text-[var(--color-text)]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {entry.amountLabel}
                </span>
                <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${statusColor[entry.status] ?? ''}`}>
                  {entry.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
