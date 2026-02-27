'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface ConfigItem {
  key: string;
  value: string;
  description: string;
  group: string;
}

export default function PointsConfigPage() {
  const [config, setConfig] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      const response = await adminFetch('/api/admin/points/config');
      setConfig(response.config || []);
    } catch (error) {
      console.error('Failed to fetch config:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleEdit = (item: ConfigItem) => {
    setEditingKey(item.key);
    setEditValue(item.value);
    setFeedback(null);
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
    setFeedback(null);
  };

  const handleSave = async (key: string) => {
    if (editValue.trim() === '') {
      setFeedback({ type: 'error', message: 'Value cannot be empty' });
      return;
    }

    setSavingKey(key);
    setFeedback(null);

    try {
      await adminFetch('/api/admin/points/config', {
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
      setEditingKey(null);
      setEditValue('');
    } catch (error) {
      console.error('Failed to save config:', error);
      setFeedback({ type: 'error', message: 'Failed to save configuration' });
    } finally {
      setSavingKey(null);
    }
  };

  const groupedConfig = config.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, ConfigItem[]>);

  const groupOrder = ['Point Rates', 'Multipliers', 'Anti-Gaming', 'Referral'];
  const groupDescriptions = {
    'Point Rates': 'Base point rates for different actions',
    'Multipliers': 'Global and streak multipliers',
    'Anti-Gaming': 'Anti-gaming and velocity limits',
    'Referral': 'Referral system configuration'
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[var(--color-skeleton)] rounded-none w-48 mb-4"></div>
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
                onClick={() => { setError(null); setLoading(true); fetchConfig(); }}
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
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Points Configuration</h1>
        <p className="text-[var(--color-muted)]">Manage points system settings and parameters</p>
      </div>

      {feedback && (
        <div className={`p-3 rounded-none text-[13px] ${
          feedback.type === 'success' 
            ? 'bg-[rgba(156,220,106,0.15)] text-[#9CDC6A] border border-[#a7f3d0]' 
            : 'bg-[rgba(255,40,40,0.15)] text-[#FF2828] border border-[#fecaca]'
        }`}>
          {feedback.message}
        </div>
      )}

      {groupOrder.map(groupName => {
        const groupItems = groupedConfig[groupName] || [];
        if (groupItems.length === 0) return null;

        return (
          <div key={groupName} className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">{groupName}</h3>
              <p className="text-[var(--color-muted)] text-[13px]">{groupDescriptions[groupName as keyof typeof groupDescriptions]}</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--color-hover)]">
                  <tr>
                    <th className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)] text-left p-3">
                      Key
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
                  {groupItems.map((item) => (
                    <tr key={item.key} className="border-t border-[var(--color-border)]">
                      <td className="p-3">
                        <span className="font-mono text-sm text-[var(--color-text)]">
                          {item.key}
                        </span>
                      </td>
                      <td className="p-3">
                        {editingKey === item.key ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="border border-[var(--color-border)] rounded-none px-2 py-1 text-[13px] focus:outline-none focus:border-[var(--color-text)] w-32"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') handleSave(item.key);
                              if (e.key === 'Escape') handleCancel();
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
                        {editingKey === item.key ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleSave(item.key)}
                              disabled={savingKey === item.key}
                              className="bg-[var(--color-button)] text-[var(--color-bg)] px-2 py-1 text-[11px] font-medium hover:bg-[var(--color-button-hover)] rounded-none disabled:opacity-50"
                            >
                              {savingKey === item.key ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancel}
                              disabled={savingKey === item.key}
                              className="border border-[var(--color-border)] text-[var(--color-text)] px-2 py-1 text-[11px] font-medium hover:bg-[var(--color-hover)] rounded-none disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(item)}
                            className="border border-[var(--color-border)] text-[var(--color-text)] px-2 py-1 text-[11px] font-medium hover:bg-[var(--color-hover)] rounded-none"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {groupItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center p-8 text-[var(--color-muted)]">
                        No configuration items found for this group
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {config.length === 0 && !loading && (
        <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6 text-center">
          <p className="text-[var(--color-muted)]">No configuration items found</p>
        </div>
      )}
    </div>
  );
}