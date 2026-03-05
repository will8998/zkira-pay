'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface DropPreview {
  wallet: string;
  volumeSent: number;
  volumeReceived: number;
  txCount: number;
  calculatedPoints: number;
}

interface DropHistory {
  id: string;
  date: string;
  usersAwarded: number;
  totalPoints: number;
  rates: {
    sendRate: number;
    receiveRate: number;
    txBonus: number;
    refBonus: number;
  };
}

export default function WeeklyDropsPage() {
  const [activeTab, setActiveTab] = useState<'execute' | 'history'>('execute');
  
  // Execute Drop Tab
  const [sendRate, setSendRate] = useState('');
  const [receiveRate, setReceiveRate] = useState('');
  const [txBonus, setTxBonus] = useState('');
  const [refBonus, setRefBonus] = useState('');
  const [preview, setPreview] = useState<DropPreview[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Drop History Tab
  const [dropHistory, setDropHistory] = useState<DropHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load default config values
  const loadDefaults = async () => {
    try {
      const response = await adminFetch('/api/admin/points/config');
      const config = response.config || [];
      
      const sendRateConfig = config.find((c: any) => c.key === 'send_rate');
      const receiveRateConfig = config.find((c: any) => c.key === 'receive_rate');
      const txBonusConfig = config.find((c: any) => c.key === 'tx_bonus');
      const refBonusConfig = config.find((c: any) => c.key === 'ref_bonus');
      
      setSendRate(sendRateConfig?.value || '0.001');
      setReceiveRate(receiveRateConfig?.value || '0.001');
      setTxBonus(txBonusConfig?.value || '10');
      setRefBonus(refBonusConfig?.value || '5');
    } catch (error) {
      console.error('Failed to load default config:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    }
  };

  useEffect(() => {
    loadDefaults().catch(console.error);
  }, []);

  // Load drop history when history tab is active
  useEffect(() => {
    if (activeTab === 'history') {
      loadDropHistory();
    }
  }, [activeTab]);

  const loadDropHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await adminFetch('/api/admin/points/drops/history');
      setDropHistory(response.history || []);
    } catch (error) {
      console.error('Failed to load drop history:', error);
      setFeedback({ type: 'error', message: 'Failed to load drop history' });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!sendRate || !receiveRate || !txBonus || !refBonus) {
      setFeedback({ type: 'error', message: 'Please fill in all rate values' });
      return;
    }

    setPreviewLoading(true);
    setFeedback(null);
    
    try {
      const response = await adminFetch(
        `/api/admin/points/drops/preview?sendRate=${sendRate}&receiveRate=${receiveRate}&txBonus=${txBonus}&refBonus=${refBonus}`
      );
      setPreview(response.preview || []);
      
      if (response.preview?.length === 0) {
        setFeedback({ type: 'error', message: 'No eligible users found for this drop' });
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
      setFeedback({ type: 'error', message: 'Failed to generate preview' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExecuteDrop = async () => {
    setExecuting(true);
    setFeedback(null);
    
    try {
      const response = await adminFetch('/api/admin/points/drops/execute', {
        method: 'POST',
        body: JSON.stringify({
          sendRate: parseFloat(sendRate),
          receiveRate: parseFloat(receiveRate),
          txBonus: parseFloat(txBonus),
          refBonus: parseFloat(refBonus)
        })
      });
      
      setFeedback({ 
        type: 'success', 
        message: `Successfully awarded ${response.totalPoints?.toLocaleString()} points to ${response.usersAwarded} users` 
      });
      
      setShowConfirmation(false);
      setPreview([]);
      
      // Reload history if on history tab
      if (activeTab === 'history') {
        loadDropHistory();
      }
    } catch (error) {
      console.error('Failed to execute drop:', error);
      setFeedback({ type: 'error', message: 'Failed to execute drop. Please try again.' });
    } finally {
      setExecuting(false);
    }
  };

  const truncateWallet = (wallet: string) => {
    return `${wallet.slice(0, 8)}...${wallet.slice(-8)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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
                onClick={() => { setError(null); loadDefaults().catch(console.error); }}
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
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Weekly Drops</h1>
        <p className="text-[var(--color-muted)]">Preview and execute weekly point drops</p>
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

      {/* Tabs */}
      <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)]">
        <div className="flex border-b border-[var(--color-border)]">
          <button
            onClick={() => setActiveTab('execute')}
            className={`px-4 py-3 text-[13px] font-medium ${
              activeTab === 'execute'
                ? 'text-[var(--color-text)] border-b-2 border-[var(--color-text)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            Execute Drop
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 text-[13px] font-medium ${
              activeTab === 'history'
                ? 'text-[var(--color-text)] border-b-2 border-[var(--color-text)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            Drop History
          </button>
        </div>

        <div className="p-4 md:p-6">
          {activeTab === 'execute' && (
            <div className="space-y-6">
              {/* Rate Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-[var(--color-muted)] text-[11px] font-medium uppercase tracking-wider block mb-2">
                    Send Rate
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={sendRate}
                    onChange={(e) => setSendRate(e.target.value)}
                    className="w-full border border-[var(--color-border)] rounded-none px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--color-text)]"
                  />
                </div>
                <div>
                  <label className="text-[var(--color-muted)] text-[11px] font-medium uppercase tracking-wider block mb-2">
                    Receive Rate
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={receiveRate}
                    onChange={(e) => setReceiveRate(e.target.value)}
                    className="w-full border border-[var(--color-border)] rounded-none px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--color-text)]"
                  />
                </div>
                <div>
                  <label className="text-[var(--color-muted)] text-[11px] font-medium uppercase tracking-wider block mb-2">
                    TX Bonus
                  </label>
                  <input
                    type="number"
                    value={txBonus}
                    onChange={(e) => setTxBonus(e.target.value)}
                    className="w-full border border-[var(--color-border)] rounded-none px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--color-text)]"
                  />
                </div>
                <div>
                  <label className="text-[var(--color-muted)] text-[11px] font-medium uppercase tracking-wider block mb-2">
                    Ref Bonus
                  </label>
                  <input
                    type="number"
                    value={refBonus}
                    onChange={(e) => setRefBonus(e.target.value)}
                    className="w-full border border-[var(--color-border)] rounded-none px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--color-text)]"
                  />
                </div>
              </div>

              {/* Preview Button */}
              <div>
                <button
                  onClick={handlePreview}
                  disabled={previewLoading}
                  className="border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 text-[13px] font-medium hover:bg-[var(--color-hover)] rounded-none disabled:opacity-50"
                >
                  {previewLoading ? 'Generating Preview...' : 'Generate Preview'}
                </button>
              </div>

              {/* Preview Table */}
              {preview.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-[var(--color-text)]">
                      Drop Preview ({preview.length} users)
                    </h3>
                    <button
                      onClick={() => setShowConfirmation(true)}
                      className="bg-[var(--color-red)] text-[var(--color-bg)] px-4 py-2 text-[13px] font-medium hover:bg-[#B91C1C] rounded-none"
                    >
                      Execute Drop
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[var(--color-hover)]">
                        <tr>
                          <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-left p-3">
                            Wallet
                          </th>
                          <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-right p-3">
                            Volume Sent
                          </th>
                          <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-right p-3">
                            Volume Received
                          </th>
                          <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-right p-3">
                            TX Count
                          </th>
                          <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-right p-3">
                            Points to Award
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.slice(0, 50).map((item, index) => (
                          <tr key={item.wallet} className="border-t border-[var(--color-border)]">
                            <td className="p-3">
                              <span className="font-mono text-sm text-[var(--color-text)]">
                                {truncateWallet(item.wallet)}
                              </span>
                            </td>
                            <td className="p-3 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)]">
                              ${item.volumeSent.toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)]">
                              ${item.volumeReceived.toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)]">
                              {item.txCount}
                            </td>
                            <td className="p-3 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-bold">
                              {item.calculatedPoints.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.length > 50 && (
                      <div className="p-3 text-center text-[var(--color-muted)] text-[13px]">
                        Showing first 50 users. Total: {preview.length} users will receive points.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              {historyLoading ? (
                <div className="animate-pulse">
                  <div className="h-64 bg-[var(--color-skeleton)] rounded-none"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--color-hover)]">
                      <tr>
                        <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-left p-3">
                          Date
                        </th>
                        <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-right p-3">
                          Users Awarded
                        </th>
                        <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-right p-3">
                          Total Points
                        </th>
                        <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-center p-3">
                          Rates Used
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dropHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center p-8 text-[var(--color-muted)]">
                            No drop history found
                          </td>
                        </tr>
                      ) : (
                        dropHistory.map((drop) => (
                          <tr key={drop.id} className="border-t border-[var(--color-border)]">
                            <td className="p-3 text-[13px] text-[var(--color-text)]">
                              {formatDate(drop.date)}
                            </td>
                            <td className="p-3 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)]">
                              {drop.usersAwarded.toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)] font-bold">
                              {drop.totalPoints.toLocaleString()}
                            </td>
                            <td className="p-3 text-center text-[11px] text-[var(--color-muted)]">
                              S:{drop.rates.sendRate} R:{drop.rates.receiveRate} TX:{drop.rates.txBonus} RF:{drop.rates.refBonus}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Confirm Drop Execution</h3>
            <p className="text-[var(--color-muted)] text-[13px] mb-6">
              Are you sure you want to execute this drop? This will award points to {preview.length} users and cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={executing}
                className="border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 text-[13px] font-medium hover:bg-[var(--color-hover)] rounded-none disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDrop}
                disabled={executing}
                className="bg-[var(--color-red)] text-[var(--color-bg)] px-4 py-2 text-[13px] font-medium hover:bg-[#B91C1C] rounded-none disabled:opacity-50"
              >
                {executing ? 'Executing...' : 'Execute Drop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}