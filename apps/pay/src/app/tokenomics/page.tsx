'use client'

import { PageHeader } from '@/components/PageHeader'
import { useTranslations } from 'next-intl';
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis } from 'recharts'

const allocationData = [
  { name: 'Community & Ecosystem', value: 40, color: '#FF2828' },
  { name: 'Treasury (DAO)', value: 20, color: '#FF6B6B' },
  { name: 'Team & Advisors', value: 15, color: '#4A4A4A' },
  { name: 'Development Fund', value: 10, color: '#2A2A2A' },
  { name: 'Public Sale', value: 10, color: '#9CDC6A' },
  { name: 'Liquidity', value: 5, color: '#FFD146' }
]

const supplyScheduleData = [
  { year: '2024', supply: 1000 },
  { year: '2025', supply: 960 },
  { year: '2026', supply: 910 },
  { year: '2027', supply: 850 },
  { year: '2028', supply: 780 },
  { year: '2029', supply: 700 }
]

export default function TokenomicsPage() {
  const t = useTranslations('tokenomicsPage');
  return (
    <div className="px-4 md:px-6 py-4 md:py-6 max-w-6xl mx-auto">
      <PageHeader 
        title={t('title')}
        description={t('description')}
      />

      {/* Hero Section */}
      <section className="animate-entrance" style={{ animationDelay: '120ms' }}>
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-8 mb-8">
          <h1 className="text-3xl md:text-5xl font-[family-name:var(--font-sans)] font-bold mb-4">
            <span className="bg-gradient-to-r from-[#FF2828] to-[#FF6B6B] bg-clip-text text-transparent">
              Deflationary by Design
            </span>
          </h1>
          <p className="text-lg text-[var(--color-muted)] max-w-2xl">
            Every stealth payment makes $ZKR scarcer. Built for privacy, designed for value.
          </p>
        </div>
      </section>

      {/* Key Metrics Row */}
      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="animate-entrance" style={{ animationDelay: '180ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4">
              <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2" 
                   style={{ fontFamily: 'var(--font-mono)' }}>
                TOTAL SUPPLY
              </div>
              <div className="text-xl font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)]">
                1,000,000,000
              </div>
              <div className="text-[11px] text-[var(--color-muted)] font-[family-name:var(--font-mono)]">
                ZKR
              </div>
            </div>
          </div>

          <div className="animate-entrance" style={{ animationDelay: '240ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4">
              <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2"
                   style={{ fontFamily: 'var(--font-mono)' }}>
                BURNED TO DATE
              </div>
              <div className="text-xl font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-red)]">
                0
              </div>
              <div className="text-[11px] text-[var(--color-muted)] font-[family-name:var(--font-mono)]">
                Burns begin at TGE
              </div>
            </div>
          </div>

          <div className="animate-entrance" style={{ animationDelay: '300ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4">
              <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2"
                   style={{ fontFamily: 'var(--font-mono)' }}>
                BURN RATE
              </div>
              <div className="text-xl font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)]">
                2%
              </div>
              <div className="text-[11px] text-[var(--color-muted)] font-[family-name:var(--font-mono)]">
                of transaction fees
              </div>
            </div>
          </div>

          <div className="animate-entrance" style={{ animationDelay: '360ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4">
              <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2"
                   style={{ fontFamily: 'var(--font-mono)' }}>
                STAKING APY
              </div>
              <div className="text-xl font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)]">
                —
              </div>
              <div className="text-[11px] text-[var(--color-muted)] font-[family-name:var(--font-mono)]">
                Coming Soon
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deflationary Mechanics */}
      <section className="mb-12">
        <div className="animate-entrance mb-6" style={{ animationDelay: '420ms' }}>
          <h2 className="text-xl font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-2">
            Deflationary Mechanics
          </h2>
          <p className="text-[var(--color-muted)] text-[13px]">
            Multiple burn mechanisms ensure $ZKR becomes scarcer over time
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="animate-entrance" style={{ animationDelay: '480ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6">
              <div className="mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--color-red)]">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-2">
                Transaction Burns
              </h3>
              <p className="text-[13px] text-[var(--color-muted)] leading-relaxed">
                2% of every stealth payment fee is permanently burned. More usage = more scarcity.
              </p>
            </div>
          </div>

          <div className="animate-entrance" style={{ animationDelay: '540ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6">
              <div className="mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--color-red)]">
                  <path d="M14.5 10A4.5 4.5 0 004.5 10A4.5 4.5 0 0014.5 10Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14.5 10A4.5 4.5 0 0024.5 10A4.5 4.5 0 0014.5 10Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9.5 14L11 16L15 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-2">
                Buyback & Burn
              </h3>
              <p className="text-[13px] text-[var(--color-muted)] leading-relaxed">
                Platform revenue used to buy $ZKR from market and burn quarterly.
              </p>
            </div>
          </div>

          <div className="animate-entrance" style={{ animationDelay: '600ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6">
              <div className="mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--color-red)]">
                  <rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="16" r="1" fill="currentColor"/>
                  <path d="M7 11V7A5 5 0 0117 7V11" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="text-lg font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-2">
                Staking Lock-up
              </h3>
              <p className="text-[13px] text-[var(--color-muted)] leading-relaxed">
                Staked $ZKR is removed from circulation, further reducing supply.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Token Utility */}
      <section className="mb-12">
        <div className="animate-entrance mb-6" style={{ animationDelay: '660ms' }}>
          <h2 className="text-xl font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-2">
            What $ZKR Powers
          </h2>
          <p className="text-[var(--color-muted)] text-[13px]">
            Multiple utility mechanisms drive demand and usage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="animate-entrance" style={{ animationDelay: '720ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 h-full">
              <div className="mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[var(--color-red)]">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="text-[13px] font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-sans)]">
                Fee Discounts
              </h3>
              <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                Hold $ZKR to reduce stealth payment fees by up to 50%
              </p>
            </div>
          </div>

          <div className="animate-entrance" style={{ animationDelay: '780ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 h-full">
              <div className="mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[var(--color-red)]">
                  <path d="M12 2V22M17 5H9.5A3.5 3.5 0 006 8.5V8.5A3.5 3.5 0 009.5 12H14.5A3.5 3.5 0 0118 15.5V15.5A3.5 3.5 0 0114.5 19H6" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="text-[13px] font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-sans)]">
                Real Yield Staking
              </h3>
              <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                Stake $ZKR, earn share of platform revenue (not inflationary rewards)
              </p>
            </div>
          </div>

          <div className="animate-entrance" style={{ animationDelay: '840ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 h-full">
              <div className="mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[var(--color-red)]">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="text-[13px] font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-sans)]">
                Governance
              </h3>
              <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                Vote on protocol parameters, fee structures, burn rates
              </p>
            </div>
          </div>

          <div className="animate-entrance" style={{ animationDelay: '900ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 h-full">
              <div className="mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[var(--color-red)]">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="text-[13px] font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-sans)]">
                Priority Processing
              </h3>
              <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                $ZKR holders get faster stealth transaction processing
              </p>
            </div>
          </div>

          <div className="animate-entrance" style={{ animationDelay: '960ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 h-full">
              <div className="mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[var(--color-red)]">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="text-[13px] font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-sans)]">
                Points Multiplier
              </h3>
              <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                Boost your ZKIRA Points earning rate by holding $ZKR
              </p>
            </div>
          </div>

          <div className="animate-entrance" style={{ animationDelay: '1020ms' }}>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 h-full">
              <div className="mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[var(--color-red)]">
                  <path d="M16 4H18A2 2 0 0120 6V18A2 2 0 0118 20H6A2 2 0 014 18V6A2 2 0 016 4H8" stroke="currentColor" strokeWidth="2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="text-[13px] font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-sans)]">
                Relayer Fees
              </h3>
              <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                Pay relayer fees with $ZKR at a discount
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Token Allocation */}
      <section className="mb-12">
        <div className="animate-entrance mb-6" style={{ animationDelay: '1080ms' }}>
          <h2 className="text-xl font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-2">
            Token Allocation
          </h2>
          <p className="text-[var(--color-muted)] text-[13px]">
            Fair distribution designed for long-term ecosystem growth
          </p>
        </div>

        <div className="animate-entrance" style={{ animationDelay: '1140ms' }}>
          <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6">
            <div className="flex flex-col lg:flex-row gap-8 items-center">
              <div className="w-full lg:w-1/2 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '0px',
                        color: 'var(--color-text)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="w-full lg:w-1/2">
                <div className="space-y-4">
                  {allocationData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-none"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-[13px] text-[var(--color-text)] font-[family-name:var(--font-sans)]">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[13px] font-[family-name:var(--font-mono)] tabular-nums text-[var(--color-text)]">
                        {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
                  <p className="text-[11px] text-[var(--color-muted)] font-[family-name:var(--font-mono)]">
                    Team tokens: 1-year cliff, 3-year linear vesting
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supply Schedule */}
      <section className="mb-12">
        <div className="animate-entrance mb-6" style={{ animationDelay: '1200ms' }}>
          <h2 className="text-xl font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-2">
            Supply Schedule
          </h2>
          <p className="text-[var(--color-muted)] text-[13px]">
            Projected $ZKR supply reduction through deflationary mechanisms
          </p>
        </div>

        <div className="animate-entrance" style={{ animationDelay: '1260ms' }}>
          <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={supplyScheduleData}>
                  <defs>
                    <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF2828" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FF2828" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="year" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '0px',
                      color: 'var(--color-text)'
                    }}
                    formatter={(value) => [`${value}M ZKR`, 'Supply']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="supply" 
                    stroke="#FF2828" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorSupply)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Token Details */}
      <section className="mb-12">
        <div className="animate-entrance mb-6" style={{ animationDelay: '1320ms' }}>
          <h2 className="text-xl font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-2">
            Token Details
          </h2>
          <p className="text-[var(--color-muted)] text-[13px]">
            Technical specifications and contract information
          </p>
        </div>

        <div className="animate-entrance" style={{ animationDelay: '1380ms' }}>
          <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2"
                     style={{ fontFamily: 'var(--font-mono)' }}>
                  NETWORK
                </div>
                <div className="text-[13px] text-[var(--color-text)] font-[family-name:var(--font-mono)]">
                  Solana
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2"
                     style={{ fontFamily: 'var(--font-mono)' }}>
                  TOKEN STANDARD
                </div>
                <div className="text-[13px] text-[var(--color-text)] font-[family-name:var(--font-mono)]">
                  SPL Token
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2"
                     style={{ fontFamily: 'var(--font-mono)' }}>
                  TICKER
                </div>
                <div className="text-[13px] text-[var(--color-text)] font-[family-name:var(--font-mono)]">
                  $ZKR
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2"
                     style={{ fontFamily: 'var(--font-mono)' }}>
                  DECIMALS
                </div>
                <div className="text-[13px] text-[var(--color-text)] font-[family-name:var(--font-mono)]">
                  6
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2"
                     style={{ fontFamily: 'var(--font-mono)' }}>
                  MAX SUPPLY
                </div>
                <div className="text-[13px] text-[var(--color-text)] font-[family-name:var(--font-mono)]">
                  1,000,000,000
                </div>
              </div>

              <div>
                <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2"
                     style={{ fontFamily: 'var(--font-mono)' }}>
                  CONTRACT
                </div>
                <div className="text-[13px] text-[var(--color-text)] font-[family-name:var(--font-mono)]">
                  TBA
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="animate-entrance" style={{ animationDelay: '1440ms' }}>
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-8 text-center">
          <h2 className="text-xl font-[family-name:var(--font-sans)] font-semibold text-[var(--color-text)] mb-4">
            Start earning $ZKR by using ZKIRA Pay
          </h2>
          <p className="text-[var(--color-muted)] text-[13px] mb-6 max-w-md mx-auto">
            Every stealth payment contributes to the deflationary ecosystem. The more you use, the scarcer it gets.
          </p>
          <Link 
            href="/"
            className="inline-block bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] px-6 py-2.5 text-[13px] font-semibold transition-colors rounded-none"
          >
            Launch App
          </Link>
        </div>
      </section>
    </div>
  )
}