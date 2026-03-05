'use client';

import { useState, useEffect } from 'react';
import { getHistory, clearHistory } from '@/lib/history-store';
import type { HistoryEntry } from '@/types/payment';
import type { TokenId } from '@/config/pool-registry';

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

  // Token decimal configuration
  const tokenDecimals: Record<TokenId, number> = {
    usdc: 6,
    usdt: 6,
    dai: 18,
  };

  // Calculate tally by token and type
  const calculateTally = () => {
    const tally: Record<TokenId, { sent: number; received: number; deposited: number; withdrawn: number }> = {
      usdc: { sent: 0, received: 0, deposited: 0, withdrawn: 0 },
      usdt: { sent: 0, received: 0, deposited: 0, withdrawn: 0 },
      dai: { sent: 0, received: 0, deposited: 0, withdrawn: 0 },
    };

    entries.forEach((entry) => {
      if (entry.status !== 'complete') return;
      
      const decimals = tokenDecimals[entry.token];
      const amount = parseFloat(entry.amountRaw) / Math.pow(10, decimals);
      
      switch (entry.type) {
        case 'send':
          tally[entry.token].sent += amount;
          break;
        case 'claim':
          tally[entry.token].received += amount;
          break;
        case 'deposit':
          tally[entry.token].deposited += amount;
          break;
        case 'withdraw':
          tally[entry.token].withdrawn += amount;
          break;
      }
    });

    return tally;
  };

  const tally = calculateTally();
  const hasNonZeroTally = Object.values(tally).some(t => 
    t.sent > 0 || t.received > 0 || t.deposited > 0 || t.withdrawn > 0
  );

  // CSV export function
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Type', 
      'Chain',
      'Token',
      'Amount',
      'Status',
      'ClaimCode',
      'InvoiceId',
      'TxHashes'
    ];

    const csvContent = [
      headers.join(','),
      ...entries.map(entry => [
        new Date(entry.timestamp).toISOString(),
        entry.type,
        entry.chain,
        entry.token,
        entry.amountRaw,
        entry.status,
        entry.claimCode || '',
        entry.invoiceId || '',
        (entry.txHashes || []).join(';')
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `zkira-pay-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        <div className="flex gap-2">
          {entries.length > 0 && (
            <>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 text-sm bg-[var(--color-button)] border border-[var(--color-border)] text-[var(--color-button-text)] hover:bg-[var(--color-hover)] transition-colors"
              >
                EXPORT CSV
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tally Section */}
      {entries.length > 0 && hasNonZeroTally && (
        <div className="mb-8">
          <h2
            className="text-lg font-bold text-[var(--color-text)] uppercase tracking-wide mb-4"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            SUMMARY
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['usdc', 'usdt', 'dai'] as TokenId[]).map((token) => {
              const tokenTally = tally[token];
              const hasActivity = tokenTally.sent > 0 || tokenTally.received > 0 || tokenTally.deposited > 0 || tokenTally.withdrawn > 0;
              
              if (!hasActivity) return null;

              return (
                <div
                  key={token}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-lg"
                >
                  <h3
                    className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wide mb-3"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {token.toUpperCase()}
                  </h3>
                  <div className="space-y-2">
                    {tokenTally.sent > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
                          SENT
                        </span>
                        <span
                          className="text-xs text-[var(--color-text)]"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {tokenTally.sent.toLocaleString(undefined, { maximumFractionDigits: 6 })} {token}
                        </span>
                      </div>
                    )}
                    {tokenTally.received > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
                          RECEIVED
                        </span>
                        <span
                          className="text-xs text-[var(--color-text)]"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {tokenTally.received.toLocaleString(undefined, { maximumFractionDigits: 6 })} {token}
                        </span>
                      </div>
                    )}
                    {tokenTally.deposited > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
                          DEPOSITED
                        </span>
                        <span
                          className="text-xs text-[var(--color-text)]"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {tokenTally.deposited.toLocaleString(undefined, { maximumFractionDigits: 6 })} {token}
                        </span>
                      </div>
                    )}
                    {tokenTally.withdrawn > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
                          WITHDRAWN
                        </span>
                        <span
                          className="text-xs text-[var(--color-text)]"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {tokenTally.withdrawn.toLocaleString(undefined, { maximumFractionDigits: 6 })} {token}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
