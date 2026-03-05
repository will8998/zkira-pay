'use client';

import { useEffect, useState } from 'react';
import { distributorFetch } from '@/lib/distributor-api';

interface Distributor {
  id: string;
  name: string;
  walletAddress: string;
  tier: 'master' | 'sub' | 'agent';
  commissionPercent: string;
  status: 'active' | 'inactive';
}

interface Merchant {
  id: string;
  name: string;
  walletAddress: string;
}

interface DownlineNode {
  distributor: Distributor;
  merchants: Merchant[];
  children: DownlineNode[];
}

interface Commission {
  id: string;
  distributorId: string;
  amount: string;
  sourceAmount: string;
  createdAt: string;
}

export default function CommissionsPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [selectedDistributorId, setSelectedDistributorId] = useState<string>('');
  const [downlineData, setDownlineData] = useState<DownlineNode | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [downlineLoading, setDownlineLoading] = useState(false);
  const [commissionsLoading, setCommissionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

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

  // Fetch downline and commissions when distributor is selected
  useEffect(() => {
    if (!selectedDistributorId) {
      setDownlineData(null);
      setCommissions([]);
      return;
    }

    const fetchDownlineAndCommissions = async () => {
      setDownlineLoading(true);
      setCommissionsLoading(true);

      try {
        const [downlineResponse, commissionsResponse] = await Promise.all([
          distributorFetch(`/api/gateway/distributors/${selectedDistributorId}/downline`),
          distributorFetch(`/api/gateway/distributors/${selectedDistributorId}/commissions?limit=20`),
        ]);

        setDownlineData(downlineResponse.downline);
        setCommissions(commissionsResponse.commissions || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setDownlineLoading(false);
        setCommissionsLoading(false);
      }
    };

    fetchDownlineAndCommissions();
  }, [selectedDistributorId]);

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
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

  const getTierBadge = (tier: string) => {
    const tierColors: Record<string, string> = {
      master: 'bg-[#EEF2FF] text-[#6366F1]',
      sub: 'bg-[#E8F5E0] text-[#4D9A2A]',
      agent: 'bg-[#FEF3C7] text-[#F59E0B]',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${tierColors[tier] || 'bg-gray-100 text-gray-800'}`}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </span>
    );
  };

  const toggleNodeExpansion = (distributorId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(distributorId)) {
        newSet.delete(distributorId);
      } else {
        newSet.add(distributorId);
      }
      return newSet;
    });
  };

  const renderDownlineNode = (node: DownlineNode, level = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.distributor.id);
    const paddingLeft = level * 24;

    return (
      <div key={node.distributor.id} className="text-sm">
        <div 
          className="flex items-center gap-2 py-2 hover:bg-[var(--color-hover)] cursor-pointer"
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => hasChildren && toggleNodeExpansion(node.distributor.id)}
        >
          {/* Expand/Collapse Icon */}
          <div className="w-4 h-4 flex items-center justify-center">
            {hasChildren ? (
              <svg 
                className={`w-3 h-3 text-[var(--color-muted)] transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
              </svg>
            ) : (
              <div className="w-1 h-1 bg-[var(--color-muted)] rounded-full"></div>
            )}
          </div>

          {/* Distributor Info */}
          <div className="flex items-center gap-2 flex-1">
            <span className="font-medium text-[var(--color-text)]">
              {node.distributor.name}
            </span>
            {getTierBadge(node.distributor.tier)}
            <span className="text-[var(--color-muted)]">
              ({parseFloat(node.distributor.commissionPercent).toFixed(1)}% commission)
            </span>
            {node.merchants.length > 0 && (
              <span className="text-[var(--color-muted)] text-xs">
                — {node.merchants.length} merchant{node.merchants.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(childNode => renderDownlineNode(childNode, level + 1))}
          </div>
        )}
      </div>
    );
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
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Commissions & Downline</h1>
        <p className="text-[var(--color-muted)]">View distributor network hierarchy and commission history</p>
      </div>

      {/* Distributor Selection */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
        <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
          Select Distributor
        </label>
        <select
          value={selectedDistributorId}
          onChange={(e) => setSelectedDistributorId(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Downline Tree */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Downline Network</h3>
            
            {downlineLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-[var(--color-skeleton)] rounded mb-3"></div>
                <div className="h-4 bg-[var(--color-skeleton)] rounded mb-3 ml-6"></div>
                <div className="h-4 bg-[var(--color-skeleton)] rounded mb-3 ml-12"></div>
                <div className="h-4 bg-[var(--color-skeleton)] rounded ml-6"></div>
              </div>
            ) : downlineData ? (
              <div className="space-y-1">
                {renderDownlineNode(downlineData)}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[var(--color-muted)]">No downline data available</p>
              </div>
            )}
          </div>

          {/* Commission History */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Commission History</h3>
            
            {commissionsLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-[var(--color-skeleton)] rounded mb-3"></div>
                <div className="h-4 bg-[var(--color-skeleton)] rounded mb-3"></div>
                <div className="h-4 bg-[var(--color-skeleton)] rounded mb-3"></div>
                <div className="h-4 bg-[var(--color-skeleton)] rounded"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {commissions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[var(--color-muted)]">No commission history</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--color-border)]">
                          <th className="text-left py-2 text-[var(--color-muted)] font-medium">Date</th>
                          <th className="text-left py-2 text-[var(--color-muted)] font-medium">Commission</th>
                          <th className="text-left py-2 text-[var(--color-muted)] font-medium">Source</th>
                          <th className="text-left py-2 text-[var(--color-muted)] font-medium">Ratio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissions.map((commission) => {
                          const commissionAmount = parseFloat(commission.amount);
                          const sourceAmount = parseFloat(commission.sourceAmount);
                          const ratio = sourceAmount > 0 ? (commissionAmount / sourceAmount * 100).toFixed(2) : '0.00';
                          
                          return (
                            <tr key={commission.id} className="border-b border-[var(--color-border)]/50">
                              <td className="py-2 text-[var(--color-muted)] text-xs">
                                {formatDate(commission.createdAt)}
                              </td>
                              <td className="py-2 text-[var(--color-text)] font-medium">
                                {formatCurrency(commission.amount)}
                              </td>
                              <td className="py-2 text-[var(--color-text)]">
                                {formatCurrency(commission.sourceAmount)}
                              </td>
                              <td className="py-2 text-[var(--color-muted)]">
                                {ratio}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}