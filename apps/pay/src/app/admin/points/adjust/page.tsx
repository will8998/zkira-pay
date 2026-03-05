'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface WalletInfo {
  wallet: string;
  totalPoints: number;
  tier: string;
  flagged: boolean;
}

interface PointsHistory {
  id: string;
  type: string;
  points: number;
  reason: string;
  timestamp: string;
  adminUser: string;
}

export default function AdjustPointsPage() {
  const [searchWallet, setSearchWallet] = useState('');
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error';
  message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handleSearch = async () => {
    if (!searchWallet.trim()) return;
    
    setLoading(true);
    setFeedback(null);
    
    try {
      const response = await adminFetch(`/api/admin/points/wallet/${searchWallet}`);
      setWalletInfo(response.wallet);
      setPointsHistory(response.history || []);
    } catch (error) {
      console.error('Failed to fetch wallet info:', error);
      setFeedback({ type: 'error', message: 'Failed to fetch wallet information' });
      setWalletInfo(null);
      setPointsHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustment = async () => {
    if (!walletInfo || !adjustmentAmount || !reason.trim()) return;
    
    const points = parseInt(adjustmentAmount);
    if (isNaN(points) || points === 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid non-zero point amount' });
      return;
    }
    
    setSubmitting(true);
    setFeedback(null);
    
    try {
      await adminFetch('/api/admin/points/adjust', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: walletInfo.wallet,
          points: points,
          reason: reason.trim()
        })
      });
      
      setFeedback({ 
        type: 'success', 
        message: `Successfully ${points > 0 ? 'added' : 'deducted'} ${Math.abs(points)} points ${points > 0 ? 'to' : 'from'} wallet` 
      });
      
      // Reset form
      setAdjustmentAmount('');
      setReason('');
      
      // Refresh wallet info
      handleSearch();
    } catch (error) {
      console.error('Failed to adjust points:', error);
      setFeedback({ type: 'error', message: 'Failed to adjust points. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const truncateWallet = (wallet: string) => {
    return `${wallet.slice(0, 8)}...${wallet.slice(-8)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
                onClick={() => { setError(null); }}
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
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Adjust Points</h1>
        <p className="text-[var(--color-muted)]">Manually adjust points for specific wallets</p>
      </div>

      {/* Search Section */}
      <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Search Wallet</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter wallet address..."
            value={searchWallet}
            onChange={(e) => setSearchWallet(e.target.value)}
            className="flex-1 border border-[var(--color-border)] rounded-none px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--color-text)]"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !searchWallet.trim()}
            className="bg-[var(--color-button)] text-[var(--color-bg)] px-4 py-2 text-[13px] font-medium hover:bg-[var(--color-button-hover)] rounded-none disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Wallet Info */}
      {walletInfo && (
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Wallet Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <span className="text-[var(--color-muted)] text-[11px] font-medium uppercase tracking-wider block mb-1">Wallet</span>
              <span className="font-mono text-sm text-[var(--color-text)]">{truncateWallet(walletInfo.wallet)}</span>
            </div>
            <div>
              <span className="text-[var(--color-muted)] text-[11px] font-medium uppercase tracking-wider block mb-1">Total Points</span>
              <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-bold">
                {walletInfo.totalPoints.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[var(--color-muted)] text-[11px] font-medium uppercase tracking-wider block mb-1">Tier</span>
              <span className="text-[var(--color-text)]">{walletInfo.tier}</span>
            </div>
            <div>
              <span className="text-[var(--color-muted)] text-[11px] font-medium uppercase tracking-wider block mb-1">Status</span>
              {walletInfo.flagged ? (
                <span className="bg-[rgba(255,40,40,0.15)] text-[#FFFFFF] px-2 py-1 rounded-none text-[11px] font-medium">
                  FLAGGED
                </span>
              ) : (
                <span className="bg-[rgba(156,220,106,0.15)] text-[#9CDC6A] px-2 py-1 rounded-none text-[11px] font-medium">
                  ACTIVE
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Form */}
      {walletInfo && (
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Point Adjustment</h3>
          
          {feedback && (
            <div className={`p-3 mb-4 rounded-none text-[13px] ${
              feedback.type === 'success' 
                ? 'bg-[rgba(156,220,106,0.15)] text-[#9CDC6A] border border-[#a7f3d0]' 
                : 'bg-[rgba(255,40,40,0.15)] text-[#FFFFFF] border border-[#fecaca]'
            }`}>
              {feedback.message}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[var(--color-muted)] text-[11px] font-medium uppercase tracking-wider block mb-2">
                Amount (can be negative)
              </label>
              <input
                type="number"
                placeholder="e.g. 1000 or -500"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                className="w-full border border-[var(--color-border)] rounded-none px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--color-text)]"
              />
            </div>
            <div>
              <label className="text-[var(--color-muted)] text-[11px] font-medium uppercase tracking-wider block mb-2">
                Reason
              </label>
              <textarea
                placeholder="Explain why this adjustment is being made..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full border border-[var(--color-border)] rounded-none px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--color-text)] resize-none"
              />
            </div>
          </div>
          
          <button
            onClick={handleAdjustment}
            disabled={submitting || !adjustmentAmount || !reason.trim()}
            className="bg-[var(--color-button)] text-[var(--color-bg)] px-4 py-2 text-[13px] font-medium hover:bg-[var(--color-button-hover)] rounded-none disabled:opacity-50"
          >
            {submitting ? 'Adjusting...' : 'Apply Adjustment'}
          </button>
        </div>
      )}

      {/* Recent Admin Adjustments */}
      {walletInfo && pointsHistory.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Recent Admin Adjustments</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-hover)]">
                <tr>
                  <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-left p-3">
                    Date
                  </th>
                  <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-center p-3">
                    Type
                  </th>
                  <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-right p-3">
                    Points
                  </th>
                  <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-left p-3">
                    Reason
                  </th>
                  <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-left p-3">
                    Admin
                  </th>
                </tr>
              </thead>
              <tbody>
                {pointsHistory
                  .filter(entry => entry.type === 'ADMIN_ADJUSTMENT')
                  .map((entry) => (
                    <tr key={entry.id} className="border-t border-[var(--color-border)]">
                      <td className="p-3 text-[13px] text-[var(--color-text)]">
                        {formatDate(entry.timestamp)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-[rgba(255,209,70,0.15)] text-[#FFD146] px-2 py-1 rounded-none text-[11px] font-medium">
                          ADJUSTMENT
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`font-[family-name:var(--font-mono)] tabular-nums font-bold ${
                          entry.points > 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'
                        }`}>
                          {entry.points > 0 ? '+' : ''}{entry.points.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3 text-[13px] text-[var(--color-text)]">
                        {entry.reason}
                      </td>
                      <td className="p-3 text-[13px] text-[var(--color-muted)]">
                        {entry.adminUser || 'System'}
                      </td>
                    </tr>
                  ))}
                {pointsHistory.filter(entry => entry.type === 'ADMIN_ADJUSTMENT').length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-[var(--color-muted)]">
                      No admin adjustments found for this wallet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}