'use client';

import { PageHeader } from '@/components/PageHeader';

export default function UseCasesPage() {
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        title="Use Cases"
        description="How leading betting and iGaming platforms use OMNIPAY for private settlements"
      />

      {/* Use Case 1: Casino & iGaming Settlements */}
      <div id="casino" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '100ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">IGAMING</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">Casino & iGaming Settlements</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          Online casinos process thousands of player deposits and withdrawals daily. OMNIPAY enables private settlement processing where player transaction histories remain confidential. No blockchain trail links player deposits to casino payouts.
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">How It Works</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Casino integrates OMNIPAY gateway API — a simple REST integration similar to Stripe or Paynet</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Player deposits are routed through OMNIPAY's shielded pools automatically</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Funds are settled privately — no on-chain link between player deposit and casino receipt</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Casino initiates player withdrawals through the gateway API</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Players receive funds with complete transaction privacy — no blockchain trail</p>
          </div>
        </div>

      </div>

      {/* Use Case 2: Sportsbook & Betting Payouts */}
      <div id="sportsbook" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '200ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">BETTING</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">Sportsbook & Betting Payouts</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          Sportsbooks handle high-frequency, high-value payouts where settlement privacy is critical. OMNIPAY processes payouts ranging from small bets to million-dollar settlements while maintaining complete transaction unlinkability.
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">How It Works</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Sportsbook connects to OMNIPAY gateway — handles USDC, USDT, and DAI settlements</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Player winnings are processed through privacy-preserving shielded pools</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Payout amounts are split into fixed denominations for maximum privacy</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Winners receive funds at their preferred address — completely unlinkable to the sportsbook</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Settlement reports are available through the merchant dashboard for compliance</p>
          </div>
        </div>

      </div>

      {/* Use Case 3: High-Volume Payment Processing */}
      <div id="enterprise" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '300ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">ENTERPRISE</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">High-Volume Payment Processing</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          Large operators processing millions in daily volume need a settlement layer that scales. OMNIPAY supports multi-chain settlement (Arbitrum, Tron) with denomination pools ranging from $1 to $1,000,000, handling any settlement size privately.
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">How It Works</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Enterprise connects via API with dedicated API key — onboarding handled by OMNIPAY team</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Large settlements are automatically split across optimal denomination pools</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Multi-chain support allows routing through the most cost-effective network</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Real-time volume reporting and balance monitoring through the dashboard</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Automated settlement reconciliation with webhook notifications</p>
          </div>
        </div>

      </div>
    </div>
  );
}