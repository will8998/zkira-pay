'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/components/WalletProvider';
import { PageHeader } from '@/components/PageHeader';

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  points: number;
  tier: string;
  volume?: number;
}

interface UserPosition {
  rank: number;
  points: number;
  percentile: number;
  tier: string;
}

type Period = 'all_time' | 'weekly';
type SortBy = 'points' | 'volume';

const API_URL = '';

function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

function truncateWallet(wallet: string): string {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

function getTierIcon(tier: string): string {
  switch (tier.toLowerCase()) {
    case 'phantom': return '◆◆◆';
    case 'shadow': return '◆◆';
    case 'ghost': return '◆';
    case 'agent': return '▪';
    case 'operative': return '—';
    default: return '—';
  }
}

function formatPercentile(percentile: number): string {
  return `Top ${Math.round(percentile)}%`;
}

export default function LeaderboardPage() {
  const { connected, publicKey } = useWallet();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('all_time');
  const [sortBy, setSortBy] = useState<SortBy>('points');

  const wallet = publicKey?.toString();

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch leaderboard data (public endpoint)
        const leaderboardRes = await fetch(
          `${API_URL}/api/leaderboard?period=${period}&sort=${sortBy}&limit=100`
        );
        
        if (!leaderboardRes.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        
        const leaderboardData = await leaderboardRes.json();
        setLeaderboard(leaderboardData.leaderboard || []);
        
        // If wallet connected, fetch user's position
        if (connected && wallet) {
          try {
            const apiKey = localStorage.getItem('zkira_api_key');
            const positionRes = await fetch(
              `${API_URL}/api/leaderboard/position/${wallet}?period=${period}`,
              { headers: { 'X-API-Key': apiKey || '' } }
            );
            
            if (positionRes.ok) {
              const position = await positionRes.json();
              setUserPosition(position);
            } else {
              setUserPosition(null);
            }
          } catch (err) {
            // User position is optional, don't fail if it errors
            setUserPosition(null);
          }
        } else {
          setUserPosition(null);
        }
        
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [period, sortBy, connected, wallet]);

  return (
    <div className="px-4 md:px-6 py-4 md:py-6 max-w-6xl mx-auto">
      <PageHeader 
        title="Leaderboard" 
        description="Top ZKIRA Pay users by points" 
      />
      
      {loading ? (
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 animate-entrance text-center">
          <div className="text-[var(--color-muted)] text-sm">
            Loading leaderboard...
          </div>
        </div>
      ) : error ? (
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 animate-entrance text-center">
          <div className="text-[var(--color-red)] text-sm">
            {error}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-entrance">
          {/* Controls */}
          <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              {/* Period Toggle */}
              <div className="flex gap-1">
                <button
                  onClick={() => setPeriod('all_time')}
                  className={`px-4 py-2 text-[13px] font-semibold transition-colors ${
                    period === 'all_time'
                      ? 'bg-[var(--color-button)] text-[var(--color-button-text)]'
                      : 'bg-[var(--color-hover)] text-[var(--color-muted)] hover:bg-[var(--color-skeleton)]'
                  }`}
                >
                  All-Time
                </button>
                <button
                  onClick={() => setPeriod('weekly')}
                  className={`px-4 py-2 text-[13px] font-semibold transition-colors ${
                    period === 'weekly'
                      ? 'bg-[var(--color-button)] text-[var(--color-button-text)]'
                      : 'bg-[var(--color-hover)] text-[var(--color-muted)] hover:bg-[var(--color-skeleton)]'
                  }`}
                >
                  Weekly
                </button>
              </div>

              {/* Sort Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-muted)] text-sm">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="bg-[var(--color-surface)] border border-[var(--border-subtle)] px-3 py-1.5 text-[13px] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text)]"
                >
                  <option value="points">Points ▼</option>
                  <option value="volume">Volume ▼</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Position (if connected) */}
          {connected && userPosition && (
            <div className="bg-[var(--color-surface)] border-2 border-[var(--color-green)] rounded-none p-4">
              <div className="text-[var(--color-muted)] text-xs font-medium uppercase tracking-wider mb-2">
                Your Position
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-bold">
                    #{formatNumber(userPosition.rank)}
                  </span>
                  <span className="text-[var(--color-text)]">
                    {getTierIcon(userPosition.tier)}
                  </span>
                  <span className="text-[var(--color-text)] font-medium">
                    You
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[var(--color-green)] font-[family-name:var(--font-mono)] tabular-nums font-semibold">
                    {formatNumber(userPosition.points)} pts
                  </span>
                  <span className="text-[var(--color-muted)] text-sm">
                    {formatPercentile(userPosition.percentile)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-0">
            {leaderboard.length === 0 ? (
              <div className="p-6 text-center text-[var(--color-muted)] text-sm">
                No leaderboard data available
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--color-hover)]">
                      <tr>
                        <th className="text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] px-4 py-3">
                          Rank
                        </th>
                        <th className="text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] px-4 py-3">
                          User
                        </th>
                        <th className="text-right text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] px-4 py-3">
                          Points
                        </th>
                        {sortBy === 'volume' && (
                          <th className="text-right text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] px-4 py-3">
                            Volume
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {leaderboard.map((entry) => {
                        const isCurrentUser = connected && wallet && entry.wallet === wallet;
                        return (
                          <tr 
                            key={`${entry.rank}-${entry.wallet}`}
                            className={isCurrentUser ? 'bg-[var(--color-surface-alt)]' : ''}
                          >
                            <td className="px-4 py-3 text-sm">
                              <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-semibold">
                                #{entry.rank}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-[var(--color-text)]">
                                  {getTierIcon(entry.tier)}
                                </span>
                                <span className={`font-[family-name:var(--font-mono)] ${isCurrentUser ? 'text-[var(--color-green)] font-semibold' : 'text-[var(--color-muted)]'}`}>
                                  {isCurrentUser ? 'You' : truncateWallet(entry.wallet)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-semibold">
                                {formatNumber(entry.points)} pts
                              </span>
                            </td>
                            {sortBy === 'volume' && (
                              <td className="px-4 py-3 text-sm text-right">
                                <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-muted)]">
                                  ${formatNumber(entry.volume || 0)}
                                </span>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-2 p-4">
                  {leaderboard.map((entry) => {
                    const isCurrentUser = connected && wallet && entry.wallet === wallet;
                    return (
                      <div 
                        key={`${entry.rank}-${entry.wallet}`}
                        className={`border border-[var(--border-subtle)] p-3 ${isCurrentUser ? 'bg-[var(--color-surface-alt)] border-[var(--color-green)]' : 'bg-[var(--color-surface)]'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-semibold text-sm">
                              #{entry.rank}
                            </span>
                            <span className="text-[var(--color-text)]">
                              {getTierIcon(entry.tier)}
                            </span>
                            <span className={`font-[family-name:var(--font-mono)] text-sm ${isCurrentUser ? 'text-[var(--color-green)] font-semibold' : 'text-[var(--color-muted)]'}`}>
                              {isCurrentUser ? 'You' : truncateWallet(entry.wallet)}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-semibold text-sm">
                              {formatNumber(entry.points)} pts
                            </div>
                            {sortBy === 'volume' && (
                              <div className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-muted)] text-xs">
                                ${formatNumber(entry.volume || 0)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}