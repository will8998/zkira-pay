'use client';

import { useEffect, useState } from 'react';
import { distributorFetch } from '@/lib/distributor-api';

interface Distributor {
  id: string;
  name: string;
  tier: 'master' | 'sub' | 'agent';
}

interface Merchant {
  id: string;
  name: string;
  walletAddress: string;
  status?: string;
  createdAt?: string;
}

export default function MerchantManagementPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [selectedDistributorId, setSelectedDistributorId] = useState<string>('');
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantsLoading, setMerchantsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [merchantId, setMerchantId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [unassignLoading, setUnassignLoading] = useState<string | null>(null);

  // Fetch all distributors for dropdown
  useEffect(() => {
    const fetchDistributors = async () => {
      try {
        const response = await distributorFetch('/api/gateway/distributors');
        setDistributors(response.distributors || []);
      } catch (error) {
        console.error('Failed to fetch distributors:', error);
        setError(error instanceof Error ? error.message : 'Failed to load distributors');
      } finally {
        setLoading(false);
      }
    };

    fetchDistributors();
  }, []);

  // Fetch merchants when distributor is selected
  useEffect(() => {
    if (!selectedDistributorId) {
      setMerchants([]);
      return;
    }

    const fetchMerchants = async () => {
      setMerchantsLoading(true);

      try {
        const response = await distributorFetch(`/api/gateway/distributors/${selectedDistributorId}/downline`);
        setMerchants(response.downline?.merchants || []);
      } catch (error) {
        console.error('Failed to fetch merchants:', error);
        setError(error instanceof Error ? error.message : 'Failed to load merchants');
      } finally {
        setMerchantsLoading(false);
      }
    };

    fetchMerchants();
  }, [selectedDistributorId]);

  const handleAssignMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId.trim() || !selectedDistributorId) return;

    setAssignLoading(true);

    try {
      await distributorFetch(`/api/gateway/distributors/${selectedDistributorId}/merchants`, {
        method: 'POST',
        body: JSON.stringify({ merchantId: merchantId.trim() }),
      });

      setShowAssignModal(false);
      setMerchantId('');
      
      // Refresh merchant list
      setMerchantsLoading(true);
      const response = await distributorFetch(`/api/gateway/distributors/${selectedDistributorId}/downline`);
      setMerchants(response.downline?.merchants || []);
      setMerchantsLoading(false);
    } catch (error) {
      console.error('Failed to assign merchant:', error);
      alert(error instanceof Error ? error.message : 'Failed to assign merchant');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUnassignMerchant = async (merchantToUnassign: string) => {
    if (!confirm('Are you sure you want to unassign this merchant?')) return;

    setUnassignLoading(merchantToUnassign);

    try {
      await distributorFetch(`/api/gateway/distributors/${selectedDistributorId}/merchants/${merchantToUnassign}`, {
        method: 'DELETE',
      });
      
      // Refresh merchant list
      setMerchantsLoading(true);
      const response = await distributorFetch(`/api/gateway/distributors/${selectedDistributorId}/downline`);
      setMerchants(response.downline?.merchants || []);
      setMerchantsLoading(false);
    } catch (error) {
      console.error('Failed to unassign merchant:', error);
      alert(error instanceof Error ? error.message : 'Failed to unassign merchant');
    } finally {
      setUnassignLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateAddress = (address: string) => {
    return address.length > 16 ? `${address.slice(0, 8)}...${address.slice(-8)}` : address;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded w-48 mb-6"></div>
          <div className="h-10 bg-[var(--color-skeleton)] rounded mb-4"></div>
          <div className="h-64 bg-[var(--color-skeleton)] rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-[#FEF2F2] border border-[#FECACA] p-4 md:p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#991B1B] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-[#991B1B]">Failed to load data</h3>
              <p className="text-sm text-[#991B1B] mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Merchant Management</h1>
        <p className="text-[var(--color-muted)]">Assign and manage merchants under distributors</p>
      </div>

      {/* Distributor Selection */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Select Distributor
            </label>
            <select
              value={selectedDistributorId}
              onChange={(e) => setSelectedDistributorId(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
            >
              <option value="">Choose a distributor...</option>
              {distributors.map(distributor => (
                <option key={distributor.id} value={distributor.id}>
                  {distributor.name} ({distributor.tier})
                </option>
              ))}
            </select>
          </div>

          {selectedDistributorId && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="ml-4 bg-[var(--color-button)] text-[var(--color-button-text)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-button-hover)] transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Assign Merchant
            </button>
          )}
        </div>
      </div>

      {selectedDistributorId && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)]">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h3 className="text-lg font-semibold text-[var(--color-text)]">Assigned Merchants</h3>
          </div>

          {merchantsLoading ? (
            <div className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-[var(--color-skeleton)] rounded mb-3"></div>
                <div className="h-4 bg-[var(--color-skeleton)] rounded mb-3"></div>
                <div className="h-4 bg-[var(--color-skeleton)] rounded"></div>
              </div>
            </div>
          ) : merchants.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[var(--color-muted)]">No merchants assigned to this distributor</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left py-3 px-4 text-[var(--color-muted)] font-medium">Merchant ID</th>
                    <th className="text-left py-3 px-4 text-[var(--color-muted)] font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-[var(--color-muted)] font-medium">Wallet Address</th>
                    <th className="text-left py-3 px-4 text-[var(--color-muted)] font-medium">Status</th>
                    {merchants.some(m => m.createdAt) && (
                      <th className="text-left py-3 px-4 text-[var(--color-muted)] font-medium">Created</th>
                    )}
                    <th className="text-left py-3 px-4 text-[var(--color-muted)] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {merchants.map((merchant) => (
                    <tr key={merchant.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-hover)] transition-colors">
                      <td className="py-3 px-4 text-[var(--color-text)] font-mono text-xs">
                        {merchant.id}
                      </td>
                      <td className="py-3 px-4 text-[var(--color-text)] font-medium">
                        {merchant.name || '-'}
                      </td>
                      <td className="py-3 px-4 text-[var(--color-text)] font-mono text-xs">
                        {truncateAddress(merchant.walletAddress)}
                      </td>
                      <td className="py-3 px-4">
                        {merchant.status ? (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            merchant.status === 'active'
                              ? 'bg-[#E8F5E0] text-[#4D9A2A]'
                              : 'bg-[#FEF2F2] text-[#EF4444]'
                          }`}>
                            {merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1)}
                          </span>
                        ) : (
                          <span className="text-[var(--color-muted)]">-</span>
                        )}
                      </td>
                      {merchants.some(m => m.createdAt) && (
                        <td className="py-3 px-4 text-[var(--color-muted)] text-xs">
                          {merchant.createdAt ? formatDate(merchant.createdAt) : '-'}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleUnassignMerchant(merchant.id)}
                          disabled={unassignLoading === merchant.id}
                          className="text-xs text-[#EF4444] hover:text-[#DC2626] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {unassignLoading === merchant.id ? 'Unassigning...' : 'Unassign'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selectedDistributorId && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 text-center">
          <p className="text-[var(--color-muted)]">Select a distributor to manage their assigned merchants</p>
        </div>
      )}

      {/* Assign Merchant Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Assign Merchant</h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAssignMerchant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Merchant ID
                </label>
                <input
                  type="text"
                  required
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] font-mono text-sm"
                  placeholder="Enter merchant ID"
                />
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  Enter the unique merchant ID to assign to this distributor
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="flex-1 px-4 py-2 text-sm bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {assignLoading ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}