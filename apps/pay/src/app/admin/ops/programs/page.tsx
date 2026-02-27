'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-api';
import { useAdminNetwork, getExplorerUrl } from '@/lib/admin-network';
import { toast } from 'sonner';

interface ProgramInfo {
  name: string;
  programId: string;
  executable: boolean;
  owner?: string;
  dataLength?: number;
  lamports?: number;
  error?: string;
  upgradeAuthority?: string | null;
  programDataAddress?: string;
}

interface ProgramsData {
  programs: ProgramInfo[];
}

export default function ProgramsPage() {
  const { network } = useAdminNetwork();
  const [data, setData] = useState<ProgramsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const result = await adminFetch(`/api/admin/ops/programs?network=${network}`);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch programs data:', error);
      toast.error('Failed to fetch programs data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [network]);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
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

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="mb-6">
            <div className="h-8 bg-[var(--color-skeleton)] rounded w-64 mb-2"></div>
            <div className="h-5 bg-[var(--color-skeleton)] rounded w-96"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 bg-[var(--color-skeleton)]"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Program Status</h1>
          <p className="text-[var(--color-muted)]">Monitor deployed Solana programs</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="bg-[var(--color-button)] text-[var(--color-button-text)] px-4 py-2 hover:bg-[var(--color-button-hover)] transition-colors disabled:opacity-50 min-h-[44px]"
        >
          Refresh
        </button>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data?.programs.map((program) => (
          <div key={program.programId} className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
            {/* Program Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--color-text)]">{program.name}</h3>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                program.executable
                  ? 'bg-[var(--color-green)]/10 text-[var(--color-green)]'
                  : 'bg-[var(--color-red)]/10 text-[var(--color-red)]'
              }`}>
                {program.executable ? 'Executable' : program.error || 'Not Found'}
              </span>
            </div>

            {/* Program Details */}
            <div className="space-y-4">
              {/* Program ID */}
              <div>
                <p className="text-sm font-medium text-[var(--color-muted)] mb-1">Program ID</p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-sm text-[var(--color-text)] bg-[var(--color-hover)] px-2 py-1 rounded flex-1">
                    {truncateAddress(program.programId)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(program.programId)}
                    className="p-1 hover:bg-[var(--color-border)] rounded transition-colors"
                    title="Copy Program ID"
                  >
                    <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Owner */}
              {program.owner && (
                <div>
                  <p className="text-sm font-medium text-[var(--color-muted)] mb-1">Owner</p>
                  <code className="font-mono text-sm text-[var(--color-text)] bg-[var(--color-hover)] px-2 py-1 rounded block">
                    {truncateAddress(program.owner)}
                  </code>
                </div>
              )}

              {/* Upgrade Authority */}
              <div>
                <p className="text-sm font-medium text-[var(--color-muted)] mb-1">Upgrade Authority</p>
                {program.upgradeAuthority === null ? (
                  <span className="px-2 py-1 text-xs font-medium bg-[#3B82F6]/10 text-[#3B82F6] rounded">
                    Immutable
                  </span>
                ) : program.upgradeAuthority ? (
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm text-[var(--color-text)] bg-[var(--color-hover)] px-2 py-1 rounded flex-1">
                      {truncateAddress(program.upgradeAuthority)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(program.upgradeAuthority!)}
                      className="p-1 hover:bg-[var(--color-border)] rounded transition-colors"
                      title="Copy Upgrade Authority"
                    >
                      <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-[var(--color-muted)]">N/A</span>
                )}
              </div>

              {/* Program Data Address */}
              {program.programDataAddress && (
                <div>
                  <p className="text-sm font-medium text-[var(--color-muted)] mb-1">Program Data Address</p>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm text-[var(--color-text)] bg-[var(--color-hover)] px-2 py-1 rounded flex-1">
                      {truncateAddress(program.programDataAddress)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(program.programDataAddress!)}
                      className="p-1 hover:bg-[var(--color-border)] rounded transition-colors"
                      title="Copy Program Data Address"
                    >
                      <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Data Length & Balance */}
              {program.executable && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-muted)] mb-1">Data Length</p>
                    <p className="font-mono text-sm text-[var(--color-text)]">
                      {(program.dataLength ?? 0).toLocaleString()} bytes
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-muted)] mb-1">SOL Balance</p>
                    <p className="font-mono text-sm text-[var(--color-text)]">
                      {formatSOL(program.lamports ?? 0)} SOL
                    </p>
                  </div>
                </div>
              )}

              {/* Explorer Link */}
              <div className="pt-2">
                <a
                  href={getExplorerUrl('address', program.programId, network)}
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
          </div>
        ))}
      </div>

      {/* Empty State */}
      {data?.programs.length === 0 && (
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-8 md:p-12 text-center">
          <svg className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">No Programs Found</h3>
          <p className="text-[var(--color-muted)]">No program data is currently available.</p>
        </div>
      )}
    </div>
  );
}