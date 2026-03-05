'use client';

import { useEffect, useState } from 'react';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { adminFetch } from '@/lib/admin-api';
import { useAdminAuth } from '@/components/admin/AdminAuthGate';

interface GatewaySession {
  id: string;
  merchantName?: string;
  type: 'deposit' | 'withdraw';
  playerRef: string;
  amount: number;
  token: string;
  chain: string;
  status: 'pending' | 'completed' | 'expired';
  createdAt: string;
}

export default function SessionsPage() {
  const { isMaster } = useAdminAuth();
  const [sessions, setSessions] = useState<GatewaySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  const fetchSessions = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: filters.status,
        search: filters.search,
      });
      
      const response = await adminFetch(`/api/admin/sessions?${params}`);
      setSessions(response.sessions || []);
      setPagination(prev => ({ ...prev, total: response.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [pagination.page, pagination.limit, filters.status, filters.search]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const truncateId = (id: string) => {
    return id.slice(0, 8);
  };

  const formatAmount = (amount: number, token: string) => {
    return `${amount.toLocaleString()} ${token}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'border border-[var(--color-border)] text-[var(--color-muted)] bg-transparent',
      completed: 'bg-[var(--color-text)] text-[var(--color-bg)]',
      expired: 'bg-[var(--color-hover)] text-[var(--color-muted)]',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-none ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-none border border-[var(--color-border)] text-[var(--color-text)] bg-transparent">
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (session: GatewaySession) => (
        <span className="font-mono text-sm">
          {truncateId(session.id)}
        </span>
      ),
    },
    ...(isMaster ? [{
      key: 'merchantName',
      label: 'Merchant',
      render: (session: GatewaySession) => session.merchantName || '-',
    }] : []),
    {
      key: 'type',
      label: 'Type',
      render: (session: GatewaySession) => getTypeBadge(session.type),
    },
    {
      key: 'playerRef',
      label: 'Player Ref',
      render: (session: GatewaySession) => session.playerRef || '-',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (session: GatewaySession) => formatAmount(session.amount, session.token),
    },
    {
      key: 'chain',
      label: 'Chain',
      render: (session: GatewaySession) => session.chain.charAt(0).toUpperCase() + session.chain.slice(1),
    },
    {
      key: 'status',
      label: 'Status',
      render: (session: GatewaySession) => getStatusBadge(session.status),
    },
    {
      key: 'createdAt',
      label: 'Created At',
      render: (session: GatewaySession) => formatDate(session.createdAt),
    },
  ];

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded w-48 mb-4"></div>
          <div className="h-64 bg-[var(--color-skeleton)] rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-[var(--color-surface)] border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--color-text)] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Failed to load data</h3>
              <p className="text-sm text-[var(--color-muted)] mt-1">{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); fetchSessions(); }}
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
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Gateway Sessions</h1>
        <p className="text-[var(--color-muted)]">View and manage all gateway sessions</p>
      </div>

      <AdminDataTable
        data={sessions}
        columns={columns}
        searchPlaceholder="Search by player ref or session ID..."
        onSearch={handleSearch}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
        }}
        filters={
          <select
            value={filters.status}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="border border-[var(--color-border)] rounded px-3 py-2 text-sm min-h-[44px] bg-[var(--color-surface)]"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
          </select>
        }
      />
    </div>
  );
}