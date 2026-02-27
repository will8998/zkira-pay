'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import ConfirmDialog from '@/components/ConfirmDialog';

interface ApiKey {
  id: string;
  key: string;
  createdAt: string;
  maskedKey: string;
}

export default function DevelopersPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);


  // Load API keys from localStorage
  useEffect(() => {
    const storedKeys = localStorage.getItem('zkira_api_keys');
    if (storedKeys) {
      setApiKeys(JSON.parse(storedKeys));
    }
  }, []);

  // Generate new API key
  const generateApiKey = () => {
    const randomHex = Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    const newKey = {
      id: Date.now().toString(),
      key: `zkira_sk_${randomHex}`,
      createdAt: new Date().toISOString(),
      maskedKey: `zkira_sk_${'•'.repeat(24)}${randomHex.slice(-8)}`
    };

    const updatedKeys = [...apiKeys, newKey];
    setApiKeys(updatedKeys);
    localStorage.setItem('zkira_api_keys', JSON.stringify(updatedKeys));
    setShowNewKey(newKey.key);
  };

  // Copy key to clipboard
  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    toast.success('Copied to clipboard');
  };

  // Delete API key
  const deleteKey = (id: string) => {
    const updatedKeys = apiKeys.filter(key => key.id !== id);
    setApiKeys(updatedKeys);
    localStorage.setItem('zkira_api_keys', JSON.stringify(updatedKeys));
  };

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader 
        title="Developer API" 
        description="Manage API keys and integrate PRIV payments into your applications"
        actionLabel="Generate New API Key"
        onAction={generateApiKey}
      />
      
      <a href="/developers/docs" className="text-[11px] text-[var(--color-green)] hover:text-[var(--color-green-hover)] -mt-4 mb-4 inline-block transition-colors">View API documentation →</a>
      {/* New Key Banner */}
      {showNewKey && (
        <div className="mb-6 bg-[var(--color-surface-alt)] border border-[var(--color-green)] p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-[var(--color-green)] mb-1">API Key Generated Successfully</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                Save this key securely — you won't be able to see it again.
              </p>
              <div className="bg-[var(--color-button)] border border-[var(--color-border)] rounded p-3 font-[family-name:var(--font-mono)] text-sm break-all text-[var(--color-border)]">
                {showNewKey}
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => copyKey(showNewKey)}
                className="bg-[var(--color-green)] text-[var(--color-button-text)] hover:bg-[var(--color-green-hover)] px-3 py-1 text-xs font-medium transition-colors"
              >
                Copy Key
              </button>
              <button
                onClick={() => setShowNewKey(null)}
                className="text-[var(--color-muted)] hover:text-[var(--color-text-secondary)] px-2 py-1 text-xs"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* API Keys Section */}
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 md:p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">API Keys</h2>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--color-muted)] text-sm mb-4">No API keys generated yet</p>
              <button
                onClick={generateApiKey}
                className="bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] px-4 py-2 text-sm font-medium transition-colors btn-press"
              >
                Generate Your First API Key
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left py-3 text-[var(--color-text-secondary)] text-sm font-medium">Key</th>
                    <th className="text-left py-3 text-[var(--color-text-secondary)] text-sm font-medium">Created</th>
                    <th className="text-right py-3 text-[var(--color-text-secondary)] text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((apiKey) => (
                    <tr key={apiKey.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-text)]">
                        {apiKey.maskedKey}
                      </td>
                      <td className="py-3 text-sm text-[var(--color-muted)]">
                        {new Date(apiKey.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => copyKey(apiKey.key)}
                            className="text-[var(--color-text)] hover:text-[var(--color-button-hover)] text-sm font-medium"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => setPendingDeleteId(apiKey.id)}
                            className="text-[var(--color-red)] hover:text-[var(--color-red)] text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Start Section */}
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 md:p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Quick Start</h2>
          <p className="text-[var(--color-text-secondary)] text-sm mb-4">
            Use the PRIV API to create confidential payments in your application:
          </p>
          <div className="bg-[var(--color-button)] rounded p-4 overflow-x-auto relative group">
            <pre className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-border)] whitespace-pre">
{`curl -X POST https://app.zkira.xyz/api/payments/create \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 100, "tokenMint": "USDC"}'`}
            </pre>
            <button
              onClick={() => copyKey(`curl -X POST https://app.zkira.xyz/api/payments/create \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"amount": 100, "tokenMint": "USDC"}'`)}
              className="absolute top-3 right-3 p-1.5 text-[var(--color-muted)] hover:text-[var(--color-button-text)] hover:bg-[var(--color-surface)]/10 rounded transition-all opacity-0 group-hover:opacity-100"
              title="Copy code"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
            </button>
          </div>
        </div>
        {/* Widget Embed Section */}
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 md:p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Widget Embed</h2>
          <p className="text-[var(--color-text-secondary)] text-sm mb-4">
            Add the PRIV payment widget directly to your HTML:
          </p>
          <div className="bg-[var(--color-button)] rounded p-4 overflow-x-auto relative group">
            <pre className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-border)] whitespace-pre">
{`<script src="https://cdn.zkira.xyz/widget.js"></script>
<zkira-pay amount="100" token="USDC"></zkira-pay>`}
            </pre>
            <button
              onClick={() => copyKey(`<script src="https://cdn.zkira.xyz/widget.js"></script>\n<zkira-pay amount="100" token="USDC"></zkira-pay>`)}
              className="absolute top-3 right-3 p-1.5 text-[var(--color-muted)] hover:text-[var(--color-button-text)] hover:bg-[var(--color-surface)]/10 rounded transition-all opacity-0 group-hover:opacity-100"
              title="Copy embed code"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onConfirm={() => {
          if (pendingDeleteId) {
            deleteKey(pendingDeleteId);
            setPendingDeleteId(null);
          }
        }}
        onCancel={() => setPendingDeleteId(null)}
        title="Delete API Key"
        description="This key will be permanently revoked. Any integrations using it will stop working immediately."
        confirmLabel="Delete Key"
        confirmVariant="danger"
      />
    </div>
  );
}