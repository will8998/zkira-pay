'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/PageHeader';
import { BrowserWalletProvider } from '@/components/BrowserWalletProvider';
import { DepositWizard } from '@/components/walletless/DepositWizard';
import { WithdrawWizard } from '@/components/walletless/WithdrawWizard';
import { getAvailableChains, type Chain, CHAIN_CONFIGS } from '@/config/pool-registry';

type TabId = 'deposit' | 'withdraw';

export default function PoolPage() {
  const t = useTranslations('poolPage');
  const [activeTab, setActiveTab] = useState<TabId>('deposit');
  const [selectedChain, setSelectedChain] = useState<Chain>('arbitrum');

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'deposit', label: t('deposit'), icon: '↓' },
    { id: 'withdraw', label: t('withdraw'), icon: '↑' },
  ];

  return (
    <div className="container mx-auto px-4 pb-tab">
      <PageHeader 
        title={t('title')}
        description={t('description')}
      />

      {/* Chain Selector */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mr-2" style={{ fontFamily: 'var(--font-mono)' }}>
          Network
        </span>
        {getAvailableChains().map((chain) => (
          <button
            key={chain}
            onClick={() => setSelectedChain(chain)}
            className={`px-3 py-1.5 text-xs font-medium transition-all ${
              selectedChain === chain
                ? 'bg-[var(--color-button)] text-[var(--color-bg)] btn-press'
                : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
            }`}
          >
            {CHAIN_CONFIGS[chain].name}
          </button>
        ))}
      </div>

      {/* No wallet needed notice */}
      <div className="flex items-center justify-end mb-6">
        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
          No wallet needed
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[var(--color-button)] text-[var(--color-bg)] btn-press'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover)]'
            }`}
          >
            <span className="text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        <BrowserWalletProvider>
          {activeTab === 'deposit' && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4 uppercase tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>
                Deposit to Pool
              </h3>
              <DepositWizard />
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4 uppercase tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>
                Withdraw from Pool
              </h3>
              <WithdrawWizard />
            </div>
          )}
        </BrowserWalletProvider>
      </div>
    </div>
  );
}
