'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  totalPoints: number;
  weeklyPoints: number;
  tier: string;
  streak: number;
  flagged: boolean;
}

export default function LeaderboardAdminPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchWallet, setSearchWallet] = useState('');
  const [filteredData, setFilteredData] = useState<LeaderboardEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [flaggingWallet, setFlaggingWallet] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      const response = await adminFetch('/api/admin/leaderboard?limit=100');
      setLeaderboard(response.leaderboard || []);
      setFilteredData(response.leaderboard || []);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setFeedback({ type: 'error', message: 'Failed to load leaderboard data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Filter data based on search
  useEffect(() => {
    if (!searchWallet.trim()) {
      setFilteredData(leaderboard);
    } else {
      const filtered = leaderboard.filter(entry => 
        entry.wallet.toLowerCase().includes(searchWallet.toLowerCase())
      );
      setFilteredData(filtered);
    }
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchWallet, leaderboard]);

  const handleFlagToggle = async (wallet: string, currentFlagged: boolean) => {
    setFlaggingWallet(wallet);
    setFeedback(null);

    try {
      await adminFetch(`/api/admin/leaderboard/flag/${wallet}`, {
        method: 'POST',
        body: JSON.stringify({ flagged: !currentFlagged })
      });

      // Update local data
      const updateData = (data: LeaderboardEntry[]) => 
        data.map(entry => 
          entry.wallet === wallet 
            ? { ...entry, flagged: !currentFlagged }
            : entry
        );

      setLeaderboard(prev => updateData(prev));
      setFilteredData(prev => updateData(prev));

      setFeedback({ 
        type: 'success', 
        message: `Successfully ${!currentFlagged ? 'flagged' : 'unflagged'} wallet` 
      });
    } catch (error) {
      console.error('Failed to toggle flag:', error);
      setFeedback({ type: 'error', message: 'Failed to update flag status' });
    } finally {
      setFlaggingWallet(null);
    }
  };

  const truncateWallet = (wallet: string) => {
    return `${wallet.slice(0, 8)}...${wallet.slice(-8)}`;
  };

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded-none w-48 mb-4"></div>
          <div className="h-64 bg-[var(--color-skeleton)] rounded-none"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-[#FEF2F2] border border-[#FECACA] p-4 md:p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--color-red)] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-[#991B1B]">Failed to load data</h3>
              <p className="text-sm text-[var(--color-red)] mt-1">{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); fetchLeaderboard(); }}
                className="mt-3 bg-[var(--color-button)] text-[var(--color-bg)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-button-hover)] transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Leaderboard Admin</h1>
        <p className="text-[var(--color-muted)]">Manage leaderboard entries and flag suspicious accounts</p>
      </div>

      {feedback && (
        <div className={`p-3 rounded-none text-[13px] ${
          feedback.type === 'success' 
            ? 'bg-[rgba(156,220,106,0.15)] text-[#9CDC6A] border border-[#a7f3d0]' 
            : 'bg-[rgba(255,40,40,0.15)] text-[#FF2828] border border-[#fecaca]'
        }`}>
          {feedback.message}
        </div>
      )}

      <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
        {/* Search and Filter */}
        <div className="mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by wallet address..."
                value={searchWallet}
                onChange={(e) => setSearchWallet(e.target.value)}
                className="w-full border border-[var(--color-border)] rounded-none px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--color-text)]"
              />
            </div>
            <div className="text-[13px] text-[var(--color-muted)]">
              Showing {currentData.length} of {filteredData.length} entries
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-hover)]">
              <tr>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-left p-3">
                  Rank
                </th>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-left p-3">
                  Wallet
                </th>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-right p-3">
                  Total Points
                </th>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-right p-3">
                  Weekly Points
                </th>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-center p-3">
                  Tier
                </th>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-center p-3">
                  Streak
                </th>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-center p-3">
                  Status
                </th>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-center p-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-[var(--color-muted)]">
                    {searchWallet ? 'No matching wallets found' : 'No leaderboard data available'}
                  </td>
                </tr>
              ) : (
                currentData.map((entry) => (
                  <tr 
                    key={entry.wallet} 
                    className={`border-t border-[var(--color-border)] ${
                      entry.flagged ? 'bg-[#FEF2F2]' : ''
                    }`}
                  >
                    <td className="p-3">
                      <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)]">
                        #{entry.rank}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-sm text-[var(--color-text)]">
                        {truncateWallet(entry.wallet)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-bold">
                        {entry.totalPoints.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)]">
                        {entry.weeklyPoints.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-[13px] text-[var(--color-muted)]">
                        {entry.tier}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)]">
                        {entry.streak}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {entry.flagged ? (
                        <span className="bg-[rgba(255,40,40,0.15)] text-[#FF2828] px-2 py-1 rounded-none text-[11px] font-medium">
                          FLAGGED
                        </span>
                      ) : (
                        <span className="bg-[rgba(156,220,106,0.15)] text-[#9CDC6A] px-2 py-1 rounded-none text-[11px] font-medium">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleFlagToggle(entry.wallet, entry.flagged)}
                        disabled={flaggingWallet === entry.wallet}
                        className={`px-2 py-1 text-[11px] font-medium rounded-none disabled:opacity-50 ${
                          entry.flagged
                            ? 'bg-[var(--color-green)] text-[var(--color-bg)] hover:bg-[var(--color-green-hover)]'
                            : 'bg-[var(--color-red)] text-[var(--color-bg)] hover:bg-[#B91C1C]'
                        }`}
                      >
                        {flaggingWallet === entry.wallet 
                          ? 'Updating...' 
                          : entry.flagged 
                          ? 'Unflag' 
                          : 'Flag'
                        }
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-[13px] text-[var(--color-muted)]">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="border border-[var(--color-border)] text-[var(--color-text)] px-3 py-1 text-[11px] font-medium hover:bg-[var(--color-hover)] rounded-none disabled:opacity-50"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-[11px] font-medium rounded-none ${
                      currentPage === pageNum
                        ? 'bg-[var(--color-button)] text-[var(--color-bg)]'
                        : 'border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border border-[var(--color-border)] text-[var(--color-text)] px-3 py-1 text-[11px] font-medium hover:bg-[var(--color-hover)] rounded-none disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}