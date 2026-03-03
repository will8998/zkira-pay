'use client'

import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="pt-20 md:pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className="font-[family-name:var(--font-sans)] font-bold text-4xl md:text-5xl lg:text-6xl tracking-wider leading-tight mb-8"
            style={{ textShadow: '0 0 30px rgba(255, 40, 40, 0.3)' }}
          >
            PRIVACY IS NOT A CRIME.
          </h1>
          <p className="text-xl md:text-2xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Powered by ZKIRA.XYZ — Ultra Private Cross-Chain Swaps
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-16">
        <section className="space-y-6">
          <h2 className="font-[family-name:var(--font-sans)] font-bold text-2xl md:text-3xl tracking-wider text-[var(--color-red)]">
            The Problem
          </h2>
          <div className="prose prose-lg max-w-none text-[var(--color-text)]">
            <p className="text-lg leading-relaxed mb-6">
              ALL blockchain transactions are PUBLIC and TRACKABLE. Every move you make, every token you swap,
              every address you interact with — it's all permanently recorded on the blockchain for anyone to see.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              Forensic companies like Chainalysis, Elliptic, and CipherTrace have sophisticated tools that can
              trace every transaction. Your wallet history, balances, counterparties — all exposed. Even traditional
              "mixing" services leave patterns that can be analyzed and de-anonymized.
            </p>
            <p className="text-lg leading-relaxed text-[var(--color-red)]">
              Your financial privacy is being systematically eroded with every transaction.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="font-[family-name:var(--font-sans)] font-bold text-2xl md:text-3xl tracking-wider text-[var(--color-red)]">
            Our Solution
          </h2>
          <div className="prose prose-lg max-w-none text-[var(--color-text)]">
            <p className="text-lg leading-relaxed mb-6">
              ZKIRA uses advanced cryptographic routing through privacy-preserving networks to break the
              on-chain link completely. When you swap through us, your transaction becomes 100% anonymous and private.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              Not even the most advanced blockchain forensic tools can trace the connection between your input
              and output. We don't just obscure your transaction — we make it mathematically impossible to trace.
            </p>
            <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] p-6">
              <p className="text-[var(--color-red)] font-medium text-lg">
                Zero Knowledge. Zero Traces. Zero Compromise.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="font-[family-name:var(--font-sans)] font-bold text-2xl md:text-3xl tracking-wider text-[var(--color-red)]">
            How It Works
          </h2>
          <div className="grid gap-8 md:gap-12">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[var(--color-red)]/20 border-2 border-[var(--color-red)] flex items-center justify-center">
                  <span className="font-[family-name:var(--font-sans)] font-bold text-[var(--color-red)]">1</span>
                </div>
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-sans)] font-bold text-xl tracking-wide text-[var(--color-text)] mb-3">Send Your Crypto</h3>
                <p className="text-[var(--color-text)] leading-relaxed">
                  Send your cryptocurrency to our secure, encrypted address. Your transaction enters our
                  privacy-preserving infrastructure.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[var(--color-red)]/20 border-2 border-[var(--color-red)] flex items-center justify-center">
                  <span className="font-[family-name:var(--font-sans)] font-bold text-[var(--color-red)]">2</span>
                </div>
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-sans)] font-bold text-xl tracking-wide text-[var(--color-text)] mb-3">Cryptographic Routing</h3>
                <p className="text-[var(--color-text)] leading-relaxed">
                  Your funds are routed through our encrypted, privacy-preserving channels using advanced
                  cryptographic techniques that completely anonymize the transaction flow.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[var(--color-red)]/20 border-2 border-[var(--color-red)] flex items-center justify-center">
                  <span className="font-[family-name:var(--font-sans)] font-bold text-[var(--color-red)]">3</span>
                </div>
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-sans)] font-bold text-xl tracking-wide text-[var(--color-text)] mb-3">Receive Clean Crypto</h3>
                <p className="text-[var(--color-text)] leading-relaxed">
                  Clean cryptocurrency arrives at your destination wallet — completely untraceable and
                  disconnected from your original transaction.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="text-center py-12">
          <div className="bg-[var(--color-surface)] border border-[var(--color-red)]/30 p-8 md:p-12">
            <h2 className="font-[family-name:var(--font-sans)] font-bold text-2xl md:text-3xl tracking-wider text-[var(--color-text)] mb-6">
              Ready to go private?
            </h2>
            <p className="text-[var(--color-text-secondary)] text-lg mb-8 max-w-2xl mx-auto">
              Take control of your financial privacy. Start making truly anonymous transactions today.
            </p>
            <Link
              href="/"
              className="cyberpunk-connect inline-block font-[family-name:var(--font-sans)] font-medium px-8 py-4 transition-all duration-200"
            >
              START SWAPPING PRIVATELY
            </Link>
          </div>
        </section>

        <section className="border-t border-[var(--border-subtle)] pt-16">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="font-[family-name:var(--font-sans)] font-bold text-xl tracking-wide text-[var(--color-red)] mb-4">
                Enterprise-Grade Security
              </h3>
              <p className="text-[var(--color-text)] leading-relaxed">
                Our infrastructure uses military-grade encryption and zero-knowledge protocols to ensure
                your transactions remain completely private and secure.
              </p>
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-sans)] font-bold text-xl tracking-wide text-[var(--color-red)] mb-4">
                Multi-Chain Support
              </h3>
              <p className="text-[var(--color-text)] leading-relaxed">
                Swap between multiple blockchains while maintaining complete privacy. Supporting Ethereum,
                Bitcoin, Tron, BSC, and many more networks.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
