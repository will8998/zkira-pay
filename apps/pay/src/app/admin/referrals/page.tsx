'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface ReferralStats {
  totalReferralCodes: number;
  totalReferrals: number;
  activeReferrals: number;
  totalCommissionPaid: number;
}

interface TopReferrer {
  wallet: string;
  referralCount: number;
  commissionEarned: number;
  code: string;
}

interface ReferralConfig {
  key: string;
  value: string;
  description: string;
}

export default function ReferralsAdminPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [config, setConfig] = useState<ReferralConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [savingConfig, setSavingConfig] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await adminFetch('/api/admin/referrals/stats');
      setStats(response.stats);
      setTopReferrers(response.topReferrers || []);
      setConfig(response.config || []);
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setFeedback({ type: 'error', message: 'Failed to load referral data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfigEdit = (configItem: ReferralConfig) => {
    setEditingConfig(configItem.key);
    setEditValue(configItem.value);
    setFeedback(null);
  };

  const handleConfigCancel = () => {
    setEditingConfig(null);
    setEditValue('');
    setFeedback(null);
  };

  const handleConfigSave = async (key: string) => {
    if (editValue.trim() === '') {
      setFeedback({ type: 'error', message: 'Value cannot be empty' });
      return;
    }

    setSavingConfig(key);
    setFeedback(null);

    try {
      await adminFetch('/api/admin/referrals/config', {
        method: 'PUT',
        body: JSON.stringify({
          key: key,
          value: editValue.trim()
        })
      });

      // Update local config
      setConfig(prev => prev.map(item => 
        item.key === key ? { ...item, value: editValue.trim() } : item
      ));

      setFeedback({ type: 'success', message: `Successfully updated ${key}` });
      setEditingConfig(null);
      setEditValue('');
    } catch (error) {
      console.error('Failed to save config:', error);
      setFeedback({ type: 'error', message: 'Failed to save configuration' });
    } finally {
      setSavingConfig(null);
    }
  };

  const truncateWallet = (wallet: string) => {
    return `${wallet.slice(0, 8)}...${wallet.slice(-8)}`;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded-none w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-[var(--color-skeleton)] rounded-none"></div>
            ))}
          </div>
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
                onClick={() => { setError(null); setLoading(true); fetchData(); }}
                className="mt-3 bg-[var(--color-button)] text-[var(--color-button-text)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-button-hover)] transition-colors"
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
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Referral Admin</h1>
        <p className="text-[var(--color-muted)]">Manage referral system and track performance</p>
      </div>

      {feedback && (
        <div className={`p-3 rounded-none text-[13px] ${
          feedback.type === 'success' 
            ? 'bg-[rgba(156,220,106,0.15)] text-[#9CDC6A] border border-[#a7f3d0]' 
            : 'bg-[rgba(255,40,40,0.15)] text-[#FFFFFF] border border-[#fecaca]'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <div className="flex flex-col">
            <span className="text-[var(--color-muted)] text-[11px] font-medium uppercase tracking-wider">Total Referral Codes</span>
            <span className="text-2xl font-bold text-[var(--color-text)] font-[family-name:var(--font-mono)] tabular-nums">
              {stats?.totalReferralCodes?.toLocaleString() || '0'}
            </span>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <div className="flex flex-col">
            <span className="text-[var(--color-muted)] text-[11px] font-medium uppercase tracking-wider">Total Referrals</span>
            <span className="text-2xl font-bold text-[var(--color-text)] font-[family-name:var(--font-mono)] tabular-nums">
              {stats?.totalReferrals?.toLocaleString() || '0'}
            </span>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <div className="flex flex-col">
            <span className="text-[var(--color-muted)] text-[11px] font-medium uppercase tracking-wider">Active Referrals</span>
            <span className="text-2xl font-bold text-[var(--color-text)] font-[family-name:var(--font-mono)] tabular-nums">
              {stats?.activeReferrals?.toLocaleString() || '0'}
            </span>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <div className="flex flex-col">
            <span className="text-[var(--color-muted)] text-[11px] font-medium uppercase tracking-wider">Total Commission Paid</span>
            <span className="text-2xl font-bold text-[var(--color-text)] font-[family-name:var(--font-mono)] tabular-nums">
              {stats?.totalCommissionPaid?.toLocaleString() || '0'} pts
            </span>
          </div>
        </div>
      </div>

      {/* Top Referrers Table */}
      <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Top Referrers</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-hover)]">
              <tr>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-left p-3">
                  Wallet
                </th>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-right p-3">
                  Referral Count
                </th>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-right p-3">
                  Commission Earned
                </th>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-center p-3">
                  Referral Code
                </th>
              </tr>
            </thead>
            <tbody>
              {topReferrers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-[var(--color-muted)]">
                    No referrers found
                  </td>
                </tr>
              ) : (
                topReferrers.map((referrer, index) => (
                  <tr key={referrer.wallet} className="border-t border-[var(--color-border)]">
                    <td className="p-3">
                      <span className="font-mono text-sm text-[var(--color-text)]">
                        {truncateWallet(referrer.wallet)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)]">
                        {referrer.referralCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-bold">
                        {referrer.commissionEarned.toLocaleString()} pts
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-mono text-sm text-[var(--color-text)] bg-[var(--color-hover)] px-2 py-1 rounded-none">
                        {referrer.code}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Referral Configuration</h3>
          <p className="text-[var(--color-muted)] text-[13px]">Manage referral system settings</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-hover)]">
              <tr>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-left p-3">
                  Setting
                </th>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-left p-3">
                  Value
                </th>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-left p-3">
                  Description
                </th>
                <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-center p-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {config.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-[var(--color-muted)]">
                    No configuration items found
                  </td>
                </tr>
              ) : (
                config.map((item) => (
                  <tr key={item.key} className="border-t border-[var(--color-border)]">
                    <td className="p-3">
                      <span className="font-mono text-sm text-[var(--color-text)]">
                        {item.key}
                      </span>
                    </td>
                    <td className="p-3">
                      {editingConfig === item.key ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="border border-[var(--color-border)] rounded-none px-2 py-1 text-[13px] focus:outline-none focus:border-[var(--color-text)] w-32"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleConfigSave(item.key);
                            if (e.key === 'Escape') handleConfigCancel();
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)]">
                          {item.value}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-[13px] text-[var(--color-muted)]">
                      {item.description}
                    </td>
                    <td className="p-3 text-center">
                      {editingConfig === item.key ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleConfigSave(item.key)}
                            disabled={savingConfig === item.key}
                            className="bg-[var(--color-button)] text-[var(--color-button-text)] px-2 py-1 text-[11px] font-medium hover:bg-[var(--color-button-hover)] rounded-none disabled:opacity-50"
                          >
                            {savingConfig === item.key ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleConfigCancel}
                            disabled={savingConfig === item.key}
                            className="border border-[var(--color-border)] text-[var(--color-text)] px-2 py-1 text-[11px] font-medium hover:bg-[var(--color-hover)] rounded-none disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConfigEdit(item)}
                          className="border border-[var(--color-border)] text-[var(--color-text)] px-2 py-1 text-[11px] font-medium hover:bg-[var(--color-hover)] rounded-none"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}