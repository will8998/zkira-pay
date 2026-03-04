'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useWallet } from '@/components/WalletProvider';
import { PageHeader } from '@/components/PageHeader';
interface PointsData {
  totalPoints: number;
  weeklyPoints: number;
  rank: number;
  tier: string;
  streakWeeks: number;
  percentile: number;
}

interface PointsEvent {
  id: string;
  type: string;
  points: number;
  timestamp: string;
  txSignature?: string;
  description?: string;
}

const API_URL = '';

function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
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

function formatEventType(type: string): string {
  const typeMap: Record<string, string> = {
    'PAYMENT_SENT': 'Payment Sent',
    'PAYMENT_RECEIVED': 'Payment Received',
    'INVOICE_PAID': 'Invoice Paid',
    'REFERRAL_SIGNUP': 'Referral Signup',
    'REFERRAL_COMMISSION': 'Referral Commission',
    'WEEKLY_DROP': 'Weekly Drop',
    'STREAK_BONUS': 'Streak Bonus',
    'TIER_BONUS': 'Tier Bonus'
  };
  return typeMap[type] || type;
}

function truncateTxSig(sig: string): string {
  return `#${sig.slice(0, 6)}`;
}

export default function PointsPage() {
  const t = useTranslations('pointsPage');
  const { connected, publicKey } = useWallet();
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [pointsHistory, setPointsHistory] = useState<PointsEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wallet = publicKey?.toString();

  useEffect(() => {
    if (!connected || !wallet) {
      setPointsData(null);
      setPointsHistory([]);
      return;
    }

    async function fetchPoints() {
      try {
        setLoading(true);
        setError(null);
        
        const apiKey = localStorage.getItem('zkira_api_key');
        
        // Fetch points data
        const pointsRes = await fetch(`${API_URL}/api/points/${wallet}`, {
          headers: { 'X-API-Key': apiKey || '' }
        });
        
        if (!pointsRes.ok) {
          throw new Error('Failed to fetch points data');
        }
        
        const points = await pointsRes.json();
        setPointsData(points);
        
        // Fetch points history
        const historyRes = await fetch(`${API_URL}/api/points/${wallet}/history?limit=20`, {
          headers: { 'X-API-Key': apiKey || '' }
        });
        
        if (!historyRes.ok) {
          throw new Error('Failed to fetch points history');
        }
        
        const history = await historyRes.json();
        setPointsHistory(history.events || []);
        
      } catch (err) {
        console.error('Error fetching points:', err);
        setError(err instanceof Error ? err.message : 'Failed to load points data');
      } finally {
        setLoading(false);
      }
    }

    fetchPoints();
  }, [connected, wallet]);

  return (
    <div className="px-4 md:px-6 py-4 md:py-6 max-w-6xl mx-auto">
      <PageHeader 
        title={t('title')} 
        description={t('description')} 
      />
      
      {!connected ? (
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 animate-entrance text-center">
          <div className="text-[var(--color-muted)] text-sm">
            Connect your wallet to view your points
          </div>
        </div>
      ) : loading ? (
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 animate-entrance text-center">
          <div className="text-[var(--color-muted)] text-sm">
            Loading your points data...
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4">
              <div className="text-[var(--color-muted)] text-xs font-medium uppercase tracking-wider mb-2">
                Total Points
              </div>
              <div className="text-2xl font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-bold">
                {formatNumber(pointsData?.totalPoints || 0)}
              </div>
            </div>
            
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4">
              <div className="text-[var(--color-muted)] text-xs font-medium uppercase tracking-wider mb-2">
                Rank
              </div>
              <div className="text-2xl font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-bold">
                #{formatNumber(pointsData?.rank || 0)}
              </div>
            </div>
            
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4">
              <div className="text-[var(--color-muted)] text-xs font-medium uppercase tracking-wider mb-2">
                This Week
              </div>
              <div className="text-2xl font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-bold">
                {formatNumber(pointsData?.weeklyPoints || 0)}
              </div>
            </div>
          </div>
          
          {/* Tier and Streak */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4">
              <div className="text-[var(--color-muted)] text-xs font-medium uppercase tracking-wider mb-2">
                Tier
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg text-[var(--color-text)]">
                  {getTierIcon(pointsData?.tier || 'operative')}
                </span>
                <span className="text-lg font-semibold text-[var(--color-text)] capitalize">
                  {pointsData?.tier || 'Operative'}
                </span>
              </div>
            </div>
            
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4">
              <div className="text-[var(--color-muted)] text-xs font-medium uppercase tracking-wider mb-2">
                Streak
              </div>
              <div className="text-2xl font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-bold">
                {pointsData?.streakWeeks || 0} Week{(pointsData?.streakWeeks || 0) !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Points History */}
          <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-0">
            <div className="p-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-[var(--color-text)] text-base font-semibold">
                Point Earning History
              </h2>
            </div>
            
            {pointsHistory.length === 0 ? (
              <div className="p-4 text-center text-[var(--color-muted)] text-sm">
                No point history found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--color-hover)]">
                    <tr>
                      <th className="text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] px-4 py-3">
                        Points
                      </th>
                      <th className="text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] px-4 py-3">
                        Type
                      </th>
                      <th className="text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] px-4 py-3">
                        Time
                      </th>
                      <th className="text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] px-4 py-3">
                        Reference
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {pointsHistory.map((event) => (
                      <tr key={event.id}>
                        <td className="px-4 py-3 text-sm">
                          <span className={`font-[family-name:var(--font-mono)] tabular-nums font-semibold ${
                            event.points > 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'
                          }`}>
                            {event.points > 0 ? '+' : ''}{formatNumber(event.points)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--color-text)]">
                          {formatEventType(event.type)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--color-muted)]">
                          {formatTimeAgo(event.timestamp)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--color-muted)] font-[family-name:var(--font-mono)]">
                          {event.txSignature ? truncateTxSig(event.txSignature) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/leaderboard"
              className="bg-[var(--color-button)] text-[var(--color-button-text)] px-6 py-2.5 text-[13px] font-semibold hover:bg-[#0d2d4a] transition-colors inline-flex items-center justify-center gap-2"
            >
              View Leaderboard
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
            
            <a
              href="/referral"
              className="bg-[var(--color-surface)] border border-[var(--color-text)] text-[var(--color-text)] px-6 py-2.5 text-[13px] font-semibold hover:bg-[var(--color-button)] hover:text-[var(--color-button-text)] transition-colors inline-flex items-center justify-center gap-2"
            >
              Invite Friends
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}