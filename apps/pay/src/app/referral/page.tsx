'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useWallet } from '@/components/WalletProvider';
import { PageHeader } from '@/components/PageHeader';
interface ReferralData {
  code: string;
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  totalCommissionEarned: number;
  referees: Referee[];
}

interface Referee {
  wallet: string;
  status: 'active' | 'pending';
  joinedAt: string;
  totalPoints?: number;
  commissionEarned?: number;
}

const API_URL = '';

function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

function truncateWallet(wallet: string): string {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

export default function ReferralPage() {
  const t = useTranslations('referralPage');
  const { connected, publicKey } = useWallet();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const wallet = publicKey?.toString();

  const shareLink = referralData?.code ? `https://app.zkira.xyz?ref=${referralData.code}` : '';

  useEffect(() => {
    if (!connected || !wallet) {
      setReferralData(null);
      return;
    }

    async function fetchReferralData() {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`${API_URL}/api/referral/${wallet}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch referral data');
        }
        
        const data = await res.json();
        setReferralData(data);
        
      } catch (err) {
        console.error('Error fetching referral data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load referral data');
      } finally {
        setLoading(false);
      }
    }

    fetchReferralData();
  }, [connected, wallet]);

  const handleCopyCode = async () => {
    if (!referralData?.code) return;
    
    const success = await copyToClipboard(referralData.code);
    if (success) {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    
    const success = await copyToClipboard(shareLink);
    if (success) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  return (
    <div className="px-4 md:px-6 py-4 md:py-6 max-w-6xl mx-auto">
      <PageHeader 
        title={t('title')} 
        description={t('description')} 
      />
      
      {!connected ? (
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 animate-entrance text-center">
          <div className="text-[var(--color-muted)] text-sm">
            Connect your wallet to get your referral code
          </div>
        </div>
      ) : loading ? (
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 animate-entrance text-center">
          <div className="text-[var(--color-muted)] text-sm">
            Loading your referral data...
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
          {/* Referral Code */}
          <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4">
            <div className="text-[var(--color-muted)] text-xs font-medium uppercase tracking-wider mb-3">
              Your Referral Code
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[var(--color-hover)] border border-[var(--border-subtle)] px-4 py-3 font-[family-name:var(--font-mono)] text-[var(--color-text)] font-semibold">
                {referralData?.code || 'LOADING...'}
              </div>
              <button
                onClick={handleCopyCode}
                disabled={!referralData?.code}
                className="flex items-center gap-2 bg-[var(--color-button)] text-[var(--color-button-text)] px-4 py-3 text-[13px] font-semibold hover:bg-[var(--color-button-hover)] transition-colors disabled:opacity-50"
              >
                {codeCopied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Share Link */}
          <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4">
            <div className="text-[var(--color-muted)] text-xs font-medium uppercase tracking-wider mb-3">
              Share Link
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[var(--color-hover)] border border-[var(--border-subtle)] px-4 py-3 font-[family-name:var(--font-mono)] text-[var(--color-text)] text-sm break-all">
                {shareLink || 'Loading...'}
              </div>
              <button
                onClick={handleCopyLink}
                disabled={!shareLink}
                className="flex items-center gap-2 bg-[var(--color-button)] text-[var(--color-button-text)] px-4 py-3 text-[13px] font-semibold hover:bg-[var(--color-button-hover)] transition-colors disabled:opacity-50"
              >
                {linkCopied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4">
            <h3 className="text-[var(--color-text)] text-base font-semibold mb-4">
              How It Works
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[var(--color-button)] text-[var(--color-button-text)] text-xs font-bold flex items-center justify-center">
                  1
                </div>
                <div className="text-[var(--color-muted)] text-sm">
                  Share your link with friends
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[var(--color-button)] text-[var(--color-button-text)] text-xs font-bold flex items-center justify-center">
                  2
                </div>
                <div className="text-[var(--color-muted)] text-sm">
                  They connect wallet & make a transaction
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[var(--color-button)] text-[var(--color-button-text)] text-xs font-bold flex items-center justify-center">
                  3
                </div>
                <div className="text-[var(--color-muted)] text-sm">
                  You earn 50 pts + 10% of their points
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[var(--color-button)] text-[var(--color-button-text)] text-xs font-bold flex items-center justify-center">
                  4
                </div>
                <div className="text-[var(--color-muted)] text-sm">
                  They get 25 bonus welcome points
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4">
              <div className="text-[var(--color-muted)] text-xs font-medium uppercase tracking-wider mb-2">
                Referrals
              </div>
              <div className="text-2xl font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-bold">
                {formatNumber(referralData?.totalReferrals || 0)}
              </div>
            </div>
            
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4">
              <div className="text-[var(--color-muted)] text-xs font-medium uppercase tracking-wider mb-2">
                Active
              </div>
              <div className="text-2xl font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-bold">
                {formatNumber(referralData?.activeReferrals || 0)}
              </div>
            </div>
            
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4">
              <div className="text-[var(--color-muted)] text-xs font-medium uppercase tracking-wider mb-2">
                Commission
              </div>
              <div className="text-2xl font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-bold">
                {formatNumber(referralData?.totalCommissionEarned || 0)}
              </div>
            </div>
          </div>

          {/* Referees */}
          <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-0">
            <div className="p-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-[var(--color-text)] text-base font-semibold">
                Your Referees
              </h2>
            </div>
            
            {!referralData?.referees || referralData.referees.length === 0 ? (
              <div className="p-4 text-center text-[var(--color-muted)] text-sm">
                No referees yet. Share your link to get started!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--color-hover)]">
                    <tr>
                      <th className="text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] px-4 py-3">
                        Wallet
                      </th>
                      <th className="text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] px-4 py-3">
                        Status
                      </th>
                      <th className="text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] px-4 py-3">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {referralData.referees.map((referee, index) => (
                      <tr key={`${referee.wallet}-${index}`}>
                        <td className="px-4 py-3 text-sm">
                          <span className="font-[family-name:var(--font-mono)] text-[var(--color-text)]">
                            {truncateWallet(referee.wallet)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold ${
                            referee.status === 'active' 
                              ? 'bg-[rgba(156,220,106,0.15)] text-[#9CDC6A]' 
                              : 'bg-[rgba(255,209,70,0.15)] text-[#FFD146]'
                          }`}>
                            {referee.status === 'active' ? 'Active' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--color-muted)]">
                          {formatDate(referee.joinedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}