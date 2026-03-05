'use client';

import { useState, useEffect } from 'react';
import { getMerchantName } from '@/lib/merchant-api';

export default function MerchantSettingsPage() {
  const [merchantName, setMerchantName] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    setMerchantName(getMerchantName());
    const storedKey = localStorage.getItem('omnipay_merchant_api_key') || '';
    // Mask API key: show first 8 and last 4 chars
    if (storedKey.length > 12) {
      setApiKey(`${storedKey.slice(0, 8)}${'•'.repeat(storedKey.length - 12)}${storedKey.slice(-4)}`);
    } else {
      setApiKey(storedKey);
    }
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Settings</h1>
        <p className="text-[var(--color-muted)]">Manage your merchant account settings</p>
      </div>

      {/* Account Info */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Merchant Name</label>
            <p className="text-sm text-[var(--color-text)] mt-1 font-medium">{merchantName}</p>
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider">API Key</label>
            <p className="font-mono text-sm text-[var(--color-text)] mt-1">{apiKey}</p>
          </div>
        </div>
      </div>

      {/* Integration Guide */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Integration</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider">API Base URL</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-sm bg-[var(--color-hover)] px-3 py-2 border border-[var(--color-border)] font-mono flex-1">
                {typeof window !== 'undefined' ? window.location.origin : ''}/api/gateway
              </code>
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Authentication</label>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              Include your API key in the <code className="text-[var(--color-text)] bg-[var(--color-hover)] px-1.5 py-0.5 text-xs font-mono">X-API-Key</code> header with every request.
            </p>
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)] uppercase tracking-wider">SDK</label>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              Install the TypeScript client: <code className="text-[var(--color-text)] bg-[var(--color-hover)] px-1.5 py-0.5 text-xs font-mono">npm install @omnipay/gateway-client</code>
            </p>
          </div>
        </div>
      </div>

      {/* Webhook Configuration placeholder */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 md:p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Webhooks</h2>
        <p className="text-sm text-[var(--color-muted)]">
          Webhook configuration is managed via the API. Use the <code className="text-[var(--color-text)] bg-[var(--color-hover)] px-1.5 py-0.5 text-xs font-mono">webhookUrl</code> field when creating deposit or withdrawal sessions to receive real-time event notifications.
        </p>
        <div className="mt-4 space-y-2">
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Supported Events</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'deposit.detected',
              'deposit.confirmed',
              'deposit.expired',
              'withdrawal.initiated',
              'withdrawal.confirmed',
              'withdrawal.cancelled',
            ].map((event) => (
              <div key={event} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#4D9A2A]"></div>
                <code className="text-xs font-mono text-[var(--color-text)]">{event}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
