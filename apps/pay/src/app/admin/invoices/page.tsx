'use client';

import { useEffect, useState } from 'react';
import { AdminDataTable } from '@/components/admin/AdminDataTable';
import { adminFetch } from '@/lib/admin-api';

interface Invoice {
  id: string;
  creator: string;
  amount: number;
  token: string;
  status: 'pending' | 'paid' | 'expired';
  created: string;
  paidAt: string | null;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
  });

  const fetchInvoices = async () => {
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
      
      const response = await adminFetch(`/api/admin/invoices?${queryParams}`);
      setInvoices(response.invoices || []);
      setPagination(prev => ({ ...prev, total: response.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [pagination.page, pagination.limit, statusFilter]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  const truncateId = (id: string) => {
    return `${id.slice(0, 8)}...${id.slice(-4)}`;
  };

  const truncateWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const styles = {
      pending: 'bg-[#FEF9C3] text-[#854D0E]',
      paid: 'bg-[#E8F5E0] text-[#4D9A2A]',
      expired: 'bg-[var(--color-hover)] text-[var(--color-text)]',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const columns = [
    {
      key: 'id',
      label: 'Invoice ID',
      render: (invoice: Invoice) => (
        <span className="font-mono text-sm">
          {truncateId(invoice.id)}
        </span>
      ),
    },
    {
      key: 'creator',
      label: 'Creator',
      render: (invoice: Invoice) => (
        <span className="font-mono text-sm">
          {truncateWallet(invoice.creator)}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (invoice: Invoice) => `${invoice.amount} ${invoice.token}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (invoice: Invoice) => getStatusBadge(invoice.status),
    },
    {
      key: 'created',
      label: 'Created',
      render: (invoice: Invoice) => formatDate(invoice.created),
    },
    {
      key: 'paidAt',
      label: 'Paid At',
      render: (invoice: Invoice) => formatDate(invoice.paidAt),
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
        <div className="bg-[#FEF2F2] border border-[#FECACA] p-4 md:p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--color-red)] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-[#991B1B]">Failed to load data</h3>
              <p className="text-sm text-[var(--color-red)] mt-1">{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); fetchInvoices(); }}
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

  const filterComponent = (
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm min-h-[44px]"
    >
      <option value="all">All Status</option>
      <option value="pending">Pending</option>
      <option value="paid">Paid</option>
      <option value="expired">Expired</option>
    </select>
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Invoices</h1>
        <p className="text-[var(--color-muted)]">Manage and view all invoices</p>
      </div>

      <AdminDataTable
        data={invoices}
        columns={columns}
        searchPlaceholder="Search by invoice ID..."
        searchKey="id"
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange: handlePageChange,
          onLimitChange: handleLimitChange,
        }}
        filters={filterComponent}
      />
    </div>
  );
}