'use client';

import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';

interface EndpointExample {
  method: string;
  path: string;
  description: string;
  request?: any;
  response: any;
}

const endpoints: EndpointExample[] = [
  {
    method: 'POST',
    path: '/api/payments/create',
    description: 'Create a confidential payment',
    request: {
      amount: 100,
      tokenMint: 'USDC',
      expiryDays: 7
    },
    response: {
      paymentId: 'pay_1234567890',
      claimUrl: 'https://app.zkira.xyz/claim/abc123',
      payUrl: 'https://app.zkira.xyz/pay/xyz789',
      amount: 100,
      tokenMint: 'USDC',
      claimHash: 'hash_abc123',
      metaAddress: 'meta_xyz789',
      expiresAt: '2024-01-15T10:30:00Z'
    }
  },
  {
    method: 'GET',
    path: '/api/payments/:id',
    description: 'Get payment by ID',
    response: {
      payment: {
        paymentId: 'pay_1234567890',
        amount: 100,
        tokenMint: 'USDC',
        claimHash: 'hash_abc123',
        metaAddress: 'meta_xyz789',
        expiresAt: '2024-01-15T10:30:00Z',
        createdAt: '2024-01-08T10:30:00Z'
      }
    }
  },
  {
    method: 'POST',
    path: '/api/payments/status',
    description: 'Check escrow status',
    request: {
      escrowAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
    },
    response: {
      escrow: {
        address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        creator: '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM',
        tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 100000000,
        claimed: false,
        refunded: false,
        expiry: 1705320600,
        createdAt: 1704715800
      }
    }
  },
  {
    method: 'GET',
    path: '/api/escrows/:address',
    description: 'Get escrow by address',
    response: {
      escrow: {
        address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        creator: '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM',
        tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 100000000,
        claimed: false,
        refunded: false,
        expiry: 1705320600
      }
    }
  },
  {
    method: 'GET',
    path: '/api/escrows/creator/:pubkey',
    description: 'List escrows by creator',
    response: {
      escrows: [
        {
          address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          creator: '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM',
          amount: 100000000,
          claimed: false,
          tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        }
      ],
      count: 1
    }
  },
  {
    method: 'GET',
    path: '/api/health',
    description: 'Health check',
    response: {
      status: 'ok',
      timestamp: 1704715800000,
      version: '1.0.0'
    }
  }
];

export default function DeveloperDocsPage() {
  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success('Copied to clipboard');
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'POST':
        return 'bg-[var(--color-button)] text-[var(--color-button-text)] px-2.5 py-0.5 text-[11px] font-medium rounded-full';
      case 'GET':
        return 'bg-[var(--color-green)] text-[var(--color-button-text)] px-2.5 py-0.5 text-[11px] font-medium rounded-full';
      default:
        return 'bg-[var(--color-muted)] text-[var(--color-button-text)] px-2.5 py-0.5 text-[11px] font-medium rounded-full';
    }
  };

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader 
        title="API Documentation" 
        description="Complete reference for the PRIV payment API"
      />

      <div className="space-y-4">
        {/* Authentication Section */}
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Authentication</h2>
          <p className="text-[var(--color-text-secondary)] text-sm mb-4">
            All API requests require authentication using your API key in the Authorization header:
          </p>
          <div className="bg-[var(--color-button)] rounded p-4 overflow-x-auto">
            <pre className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-border)]">
Authorization: Bearer your_api_key_here
            </pre>
          </div>
        </div>

        {/* Base URL Section */}
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Base URL</h2>
          <div className="bg-[var(--color-button)] rounded p-4">
            <code className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-border)]">
              https://api.zkira.xyz
            </code>
          </div>
        </div>

        {/* API Endpoints */}
        {endpoints.map((endpoint, index) => (
          <div key={index} className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className={getMethodBadgeClass(endpoint.method)}>
                {endpoint.method}
              </span>
              <code className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-text)]">
                {endpoint.path}
              </code>
            </div>
            
            <p className="text-[var(--color-text-secondary)] text-sm mb-6">
              {endpoint.description}
            </p>

            {endpoint.request && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">Request Body</h4>
                <div className="bg-[var(--color-button)] rounded p-4 overflow-x-auto relative group">
                  <pre className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-border)]">
                    {JSON.stringify(endpoint.request, null, 2)}
                  </pre>
                  <button
                    onClick={() => copyCode(JSON.stringify(endpoint.request, null, 2))}
                    className="absolute top-3 right-3 p-1.5 text-[var(--color-muted)] hover:text-[var(--color-button-text)] hover:bg-[var(--color-surface)]/10 rounded transition-all opacity-0 group-hover:opacity-100"
                    title="Copy request"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">Response</h4>
              <div className="bg-[var(--color-button)] rounded p-4 overflow-x-auto relative group">
                <pre className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-border)]">
                  {JSON.stringify(endpoint.response, null, 2)}
                </pre>
                <button
                  onClick={() => copyCode(JSON.stringify(endpoint.response, null, 2))}
                  className="absolute top-3 right-3 p-1.5 text-[var(--color-muted)] hover:text-[var(--color-button-text)] hover:bg-[var(--color-surface)]/10 rounded transition-all opacity-0 group-hover:opacity-100"
                  title="Copy response"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Error Responses Section */}
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Error Responses</h2>
          <p className="text-[var(--color-text-secondary)] text-sm mb-4">
            The API uses conventional HTTP response codes to indicate success or failure:
          </p>
          
          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">400 - Bad Request</h4>
              <div className="bg-[var(--color-button)] rounded p-3">
                <pre className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-border)]">
{JSON.stringify({ error: 'Invalid request parameters', code: 'INVALID_PARAMS' }, null, 2)}
                </pre>
              </div>
            </div>

            <div className="border-l-4 border-red-600 pl-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">401 - Unauthorized</h4>
              <div className="bg-[var(--color-button)] rounded p-3">
                <pre className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-border)]">
{JSON.stringify({ error: 'Invalid or missing API key', code: 'UNAUTHORIZED' }, null, 2)}
                </pre>
              </div>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">404 - Not Found</h4>
              <div className="bg-[var(--color-button)] rounded p-3">
                <pre className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-border)]">
{JSON.stringify({ error: 'Resource not found', code: 'NOT_FOUND' }, null, 2)}
                </pre>
              </div>
            </div>

            <div className="border-l-4 border-red-700 pl-4">
              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">500 - Internal Server Error</h4>
              <div className="bg-[var(--color-button)] rounded p-3">
                <pre className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-border)]">
{JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Rate Limiting Section */}
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Rate Limiting</h2>
          <p className="text-[var(--color-text-secondary)] text-sm mb-4">
            The API is rate limited to 1000 requests per hour per API key. Rate limit information is included in response headers:
          </p>
          <div className="bg-[var(--color-button)] rounded p-4 overflow-x-auto">
            <pre className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-border)]">
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}