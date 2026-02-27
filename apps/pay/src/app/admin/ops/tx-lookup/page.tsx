'use client';

import { useState } from 'react';
import { adminFetch } from '@/lib/admin-api';
import { useAdminNetwork, getExplorerUrl } from '@/lib/admin-network';
import { toast } from 'sonner';

interface TransactionData {
  signature: string;
  slot: number;
  blockTime: number;
  status: 'success' | 'failed';
  fee: number;
  err: unknown;
  logMessages: string[];
  accounts: string[];
  instructions: Array<{
    programId: string;
    data: string;
  }>;
}

export default function TxLookupPage() {
  const { network } = useAdminNetwork();
  const [signature, setSignature] = useState('');
  const [txData, setTxData] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const handleLookup = async () => {
    if (!signature.trim()) {
      toast.error('Please enter a transaction signature');
      return;
    }

    if (signature.length < 80 || signature.length > 90) {
      toast.error('Invalid transaction signature format');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const result = await adminFetch(`/api/admin/ops/tx-lookup?sig=${encodeURIComponent(signature.trim())}&network=${network}`);
      setTxData(result);
    } catch (error) {
      console.error('Failed to lookup transaction:', error);
      toast.error('Failed to lookup transaction');
      setTxData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLookup();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const truncateAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatSOL = (lamports: number) => {
    return (lamports / 1_000_000_000).toFixed(6);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const isSuccess = txData?.status === 'success';

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Transaction Lookup</h1>
        <p className="text-[var(--color-muted)]">Debug and inspect Solana transactions</p>
      </div>

      {/* Search Section */}
      <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Transaction Signature
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter transaction signature (e.g., 5VfYmHRnKVbawKqNHvb...)"
              className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-text)]/20 focus:border-[var(--color-text)] min-h-[44px] text-[16px]"
            />
          </div>
          <button
            onClick={handleLookup}
            disabled={loading}
            className="bg-[var(--color-button)] text-[var(--color-button-text)] px-8 py-3 hover:bg-[var(--color-button-hover)] transition-colors disabled:opacity-50 min-h-[44px] w-full sm:w-auto"
          >
            {loading ? 'Looking up...' : 'Lookup'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-[var(--color-skeleton)] rounded w-32 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-[var(--color-skeleton)] rounded w-full"></div>
              <div className="h-4 bg-[var(--color-skeleton)] rounded w-3/4"></div>
              <div className="h-4 bg-[var(--color-skeleton)] rounded w-1/2"></div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {!loading && hasSearched && (
        <div className="space-y-6">
          {txData ? (
            <>
              {/* Transaction Status */}
              <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-[var(--color-text)]">Transaction Details</h3>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    isSuccess
                      ? 'bg-[var(--color-green)]/10 text-[var(--color-green)]'
                      : 'bg-[var(--color-red)]/10 text-[var(--color-red)]'
                  }`}>
                    {isSuccess ? 'Success' : 'Failed'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-muted)] mb-2">Signature</p>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm text-[var(--color-text)] bg-[var(--color-hover)] px-2 py-1 rounded flex-1 break-all">
                        {txData.signature}
                      </code>
                      <button
                        onClick={() => copyToClipboard(txData.signature)}
                        className="p-1 hover:bg-[var(--color-border)] rounded transition-colors shrink-0"
                        title="Copy Signature"
                      >
                        <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[var(--color-muted)] mb-2">Slot Number</p>
                    <p className="font-mono text-sm text-[var(--color-text)]">{txData.slot.toLocaleString()}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[var(--color-muted)] mb-2">Block Time</p>
                    <p className="text-sm text-[var(--color-text)]">{formatDate(txData.blockTime)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[var(--color-muted)] mb-2">Fee</p>
                    <p className="font-mono text-sm text-[var(--color-text)]">{formatSOL(txData.fee)} SOL</p>
                  </div>
                </div>

                <div className="mt-6">
                  <a
                    href={getExplorerUrl('tx', txData.signature, network)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[var(--color-green)] hover:text-[var(--color-green-hover)] font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View on Solana Explorer
                  </a>
                </div>
              </div>

              {/* Error Details */}
              {!isSuccess && txData.err && (
                <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
                  <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Error Details</h3>
                  <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-4">
                    <pre className="font-mono text-sm text-[#991B1B] whitespace-pre-wrap">{JSON.stringify(txData.err, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Log Messages */}
              {txData.logMessages && txData.logMessages.length > 0 && (
                <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[var(--color-text)]">Log Messages ({txData.logMessages.length})</h3>
                    <button
                      onClick={() => setShowLogs(!showLogs)}
                      className="text-sm text-[var(--color-green)] hover:text-[var(--color-green-hover)] font-medium transition-colors min-h-[44px]"
                    >
                      {showLogs ? 'Hide Logs' : 'Show Logs'}
                    </button>
                  </div>
                  {showLogs && (
                    <div className="bg-[#1F2937] p-4 max-h-96 overflow-y-auto">
                      {txData.logMessages.map((log, index) => (
                        <div key={index} className="font-mono text-sm text-[#E5E7EB] mb-1">
                          <span className="text-[#9CA3AF] mr-2">{(index + 1).toString().padStart(2, '0')}:</span>
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Accounts Involved */}
              <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
                <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Accounts Involved ({txData.accounts.length})</h3>
                <div className="space-y-2">
                  {txData.accounts.map((account, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-[var(--color-hover)] rounded">
                      <span className="text-xs text-[var(--color-muted)] font-mono w-6">{index}</span>
                      <code className="font-mono text-sm text-[var(--color-text)] flex-1">
                        {truncateAddress(account)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(account)}
                        className="p-1 hover:bg-[var(--color-border)] rounded transition-colors"
                        title="Copy Address"
                      >
                        <svg className="w-3 h-3 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
                <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Instructions ({txData.instructions.length})</h3>
                <div className="space-y-4">
                  {txData.instructions.map((instruction, index) => (
                    <div key={index} className="border border-[var(--color-border)] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-[var(--color-muted)] font-mono bg-[var(--color-hover)] px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-medium text-[var(--color-text)]">Program ID:</span>
                        <code className="font-mono text-sm text-[var(--color-green)]">
                          {truncateAddress(instruction.programId)}
                        </code>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-muted)] mb-2">Data:</p>
                        <code className="font-mono text-xs text-[var(--color-text)] bg-[var(--color-hover)] p-2 rounded block break-all">
                          {instruction.data || 'No data'}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-8 md:p-12 text-center">
              <svg className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">Transaction Not Found</h3>
              <p className="text-[var(--color-muted)]">The transaction signature could not be found or is invalid.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}