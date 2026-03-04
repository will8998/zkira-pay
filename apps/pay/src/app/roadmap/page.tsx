'use client';

import { PageHeader } from '@/components/PageHeader';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function RoadmapPage() {
  const t = useTranslations('roadmapPage');
  return (
    <div className="px-4 md:px-6 py-4 md:py-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader 
        title={t('title')} 
        description={t('description')} 
      />

      {/* Hero Section */}
      <section className="animate-entrance mb-12" style={{ animationDelay: '120ms' }}>
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-8 mb-8">
          <h1 className="text-3xl md:text-5xl font-[family-name:var(--font-sans)] font-bold mb-4">
            <span className="bg-gradient-to-r from-[#FF2828] to-[#FF6B6B] bg-clip-text text-transparent">
              Building the Future of Private Payments
            </span>
          </h1>
          <p className="text-lg text-[var(--color-muted)] max-w-2xl mb-6">
            From stealth devnet testing to mainnet launch and token generation. Every stage brings us closer to truly private, scalable payments on Solana.
          </p>
          <div className="inline-flex items-center gap-2 bg-[rgba(255,40,40,0.15)] border border-[rgba(255,40,40,0.3)] px-4 py-2 rounded-none">
            <div className="w-2 h-2 bg-[#FF2828] rounded-full animate-pulse"></div>
            <span className="text-[13px] font-bold tracking-[0.05em] uppercase text-[#FF2828]" 
                  style={{ fontFamily: 'var(--font-mono)' }}>
              Currently: Devnet
            </span>
          </div>
        </div>
      </section>

      {/* Current Status Card */}
      <section className="animate-entrance mb-12" style={{ animationDelay: '180ms' }}>
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] border-l-2 border-l-[#FF2828] rounded-none p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-2">
                Devnet — Active Development
              </h2>
              <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-[var(--color-muted)] mb-3"
                   style={{ fontFamily: 'var(--font-mono)' }}>
                CURRENT STAGE
              </div>
            </div>
            <div className="bg-[#FF2828] text-white px-3 py-1 text-[11px] font-bold rounded-none">
              LIVE
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-[13px] font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-sans)]">
                What's Live Now
              </h3>
              <ul className="space-y-1">
                <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Stealth address payments</li>
                <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Escrow services</li>
                <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Invoice creation</li>
                <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Points earning system</li>
                <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Shielded pool deposits & withdrawals</li>
                <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Zero-knowledge proof verification (Groth16)</li>
                <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Tor hidden service & Nym privacy network</li>
                <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Batched timing defenses & protocol decoys</li>
              </ul>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-sans)]">
                Status
              </h3>
              <p className="text-[13px] text-[var(--color-muted)] leading-relaxed">
                Active development and testing phase. Early adopters earning maximum point multipliers for future token allocation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stages Section */}
      <section className="mb-12">
        <div className="animate-entrance mb-6" style={{ animationDelay: '240ms' }}>
          <h2 className="text-xl font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-2">
            Development Stages
          </h2>
          <p className="text-[var(--color-muted)] text-[13px]">
            Our progression from private testing to public token launch
          </p>
        </div>

        <div className="relative">
          {/* Vertical line connector */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-[var(--border-subtle)] hidden md:block"></div>
          
          <div className="space-y-6">
            {/* Stage 1: Devnet (Current) */}
            <div className="animate-entrance" style={{ animationDelay: '300ms' }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#FF2828] border-2 border-[#FF2828] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-[13px]">1</span>
                </div>
                <div className="flex-1 bg-[var(--color-surface)] border border-[var(--border-subtle)] border-l-2 border-l-[#FF2828] rounded-none p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)]">
                      Devnet
                    </h3>
                    <span className="bg-[rgba(255,40,40,0.15)] text-[#FF2828] px-3 py-1 text-[11px] font-bold rounded-none">
                      CURRENT
                    </span>
                  </div>
                  <ul className="space-y-1">
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Core protocol testing & development</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Stealth address payments live</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Points programme active — earn rewards for usage</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Community building & early adopter rewards</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Shielded pool with ZK proof verification</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Privacy transport (Tor + Nym mixnet)</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Timing defense system (soak time, batch processing, decoys)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Stage 2: Public Testnet */}
            <div className="animate-entrance" style={{ animationDelay: '360ms' }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[var(--color-surface)] border-2 border-[var(--border-subtle)] rounded-full flex items-center justify-center">
                  <span className="text-[var(--color-muted)] font-bold text-[13px]">2</span>
                </div>
                <div className="flex-1 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6">
                  <h3 className="text-lg font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-4">
                    Public Testnet
                  </h3>
                  <ul className="space-y-1">
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Open testing with community validators</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Stress testing payment infrastructure</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• SDK & API public beta</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Bug bounty programme launch</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Stage 3: Mainnet Beta */}
            <div className="animate-entrance" style={{ animationDelay: '420ms' }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[var(--color-surface)] border-2 border-[var(--border-subtle)] rounded-full flex items-center justify-center">
                  <span className="text-[var(--color-muted)] font-bold text-[13px]">3</span>
                </div>
                <div className="flex-1 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6">
                  <h3 className="text-lg font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-4">
                    Mainnet Beta
                  </h3>
                  <ul className="space-y-1">
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Live on Solana mainnet with limited features</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Real USDC/SOL stealth payments</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Gradual feature rollout</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Security audits & monitoring</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Stage 4: Mainnet */}
            <div className="animate-entrance" style={{ animationDelay: '480ms' }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[var(--color-surface)] border-2 border-[var(--border-subtle)] rounded-full flex items-center justify-center">
                  <span className="text-[var(--color-muted)] font-bold text-[13px]">4</span>
                </div>
                <div className="flex-1 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6">
                  <h3 className="text-lg font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-4">
                    Mainnet
                  </h3>
                  <ul className="space-y-1">
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Full platform launch</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• All features enabled: Send, Request, Escrow, Multi-sig</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Merchant integrations & widget SDK</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Cross-chain bridge exploration</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Stage 5: TGE */}
            <div className="animate-entrance" style={{ animationDelay: '540ms' }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[var(--color-surface)] border-2 border-[var(--border-subtle)] rounded-full flex items-center justify-center">
                  <span className="text-[var(--color-muted)] font-bold text-[13px]">5</span>
                </div>
                <div className="flex-1 bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6">
                  <h3 className="text-lg font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-4">
                    TGE (Token Generation Event)
                  </h3>
                  <ul className="space-y-1">
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• $ZKR token launch on Solana</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Points → $ZKR token conversion</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• DEX liquidity provision</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Staking & governance activation</li>
                    <li className="text-[13px] text-[var(--color-muted)] leading-relaxed">• Deflationary burn mechanics begin</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Points Programme Section */}
      <section className="mb-12">
        <div className="animate-entrance mb-6" style={{ animationDelay: '600ms' }}>
          <h2 className="text-xl font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-2">
            Points Programme
          </h2>
          <p className="text-[var(--color-muted)] text-[13px]">
            Your activity today determines your token allocation tomorrow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* How Points Work */}
          <div className="animate-entrance" style={{ animationDelay: '660ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 h-full">
              <div className="mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--color-red)]">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" stroke="currentColor" />
                </svg>
              </div>
              <h3 className="text-lg font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-3">
                How Points Work
              </h3>
              <p className="text-[13px] text-[var(--color-muted)] leading-relaxed mb-3">
                Every action on ZKIRA Pay earns points
              </p>
              <ul className="space-y-1">
                <li className="text-[11px] text-[var(--color-muted)] leading-relaxed">• Sending payments</li>
                <li className="text-[11px] text-[var(--color-muted)] leading-relaxed">• Receiving payments</li>
                <li className="text-[11px] text-[var(--color-muted)] leading-relaxed">• Creating invoices</li>
                <li className="text-[11px] text-[var(--color-muted)] leading-relaxed">• Referring friends</li>
                <li className="text-[11px] text-[var(--color-muted)] leading-relaxed">• Weekly activity streaks</li>
                <li className="text-[11px] text-[var(--color-muted)] leading-relaxed">• Tier bonuses</li>
              </ul>
            </div>
          </div>

          {/* Tier System */}
          <div className="animate-entrance" style={{ animationDelay: '720ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 h-full">
              <div className="mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--color-red)]">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.228V2.721A48.703 48.703 0 0016.252 2.25c2.291 0 4.545.16 6.75.47v1.516M18.27 9.728a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" stroke="currentColor" />
                </svg>
              </div>
              <h3 className="text-lg font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-3">
                Tier System
              </h3>
              <p className="text-[13px] text-[var(--color-muted)] leading-relaxed mb-3">
                Higher tiers = bonus point multipliers
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--color-muted)]">—</span>
                  <span className="text-[11px] text-[var(--color-muted)]">Operative</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--color-muted)]">▪</span>
                  <span className="text-[11px] text-[var(--color-muted)]">Agent</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--color-muted)]">◆</span>
                  <span className="text-[11px] text-[var(--color-muted)]">Ghost</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--color-muted)]">◆◆</span>
                  <span className="text-[11px] text-[var(--color-muted)]">Shadow</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--color-muted)]">◆◆◆</span>
                  <span className="text-[11px] text-[var(--color-muted)]">Phantom</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Points → Tokens */}
          <div className="animate-entrance" style={{ animationDelay: '780ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 h-full">
              <div className="mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--color-red)]">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" />
                </svg>
              </div>
              <h3 className="text-lg font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-3">
                Points → Tokens
              </h3>
              <div className="space-y-2">
                <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                  • At TGE, your accumulated points convert to $ZKR tokens
                </p>
                <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                  • 40% of total $ZKR supply allocated to community & ecosystem
                </p>
                <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                  • Early participants receive the highest conversion rates
                </p>
                <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                  • The more points you earn now, the more $ZKR you receive
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Earn Points Now Section */}
      <section className="mb-12">
        <div className="animate-entrance mb-6" style={{ animationDelay: '840ms' }}>
          <h2 className="text-xl font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-2">
            Why Earn Points Now
          </h2>
          <p className="text-[var(--color-muted)] text-[13px]">
            Early adopters receive maximum advantages in the token allocation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="animate-entrance" style={{ animationDelay: '900ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 h-full">
              <h3 className="text-[13px] font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-sans)]">
                Early Adopter Advantage
              </h3>
              <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                Fewer participants now = larger share of the allocation pool
              </p>
            </div>
          </div>

          <div className="animate-entrance" style={{ animationDelay: '960ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 h-full">
              <h3 className="text-[13px] font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-sans)]">
                Streak Multipliers
              </h3>
              <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                Consistent weekly usage compounds your earning rate
              </p>
            </div>
          </div>

          <div className="animate-entrance" style={{ animationDelay: '1020ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 h-full">
              <h3 className="text-[13px] font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-sans)]">
                Referral Bonuses
              </h3>
              <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                Invite friends to earn commission on their points
              </p>
            </div>
          </div>

          <div className="animate-entrance" style={{ animationDelay: '1080ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 h-full">
              <h3 className="text-[13px] font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-sans)]">
                Tier Progression
              </h3>
              <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                Advance through tiers for permanent point multipliers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="animate-entrance" style={{ animationDelay: '1140ms' }}>
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-8 text-center">
          <h2 className="text-xl font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-4">
            Start Earning Points Today
          </h2>
          <p className="text-[var(--color-muted)] text-[13px] mb-6 max-w-md mx-auto">
            Every stealth payment, invoice, and referral brings you closer to your $ZKR token allocation. The earlier you start, the more you earn.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/"
              className="inline-block bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] px-6 py-2.5 text-[13px] font-semibold transition-colors rounded-none"
            >
              Launch App
            </Link>
            <Link 
              href="/points"
              className="inline-block bg-[var(--color-surface)] border border-[var(--color-text)] text-[var(--color-text)] hover:bg-[var(--color-button)] hover:text-[var(--color-button-text)] px-6 py-2.5 text-[13px] font-semibold transition-colors rounded-none"
            >
              View Your Points
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}