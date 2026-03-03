'use client'

import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zkira-bg text-white">
      <div className="pt-12 md:pt-16 lg:pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className="font-orbitron font-normal text-4xl md:text-5xl lg:text-6xl leading-tight mb-8"
            style={{ textShadow: '0 0 30px rgba(255, 23, 68, 0.3)' }}
          >
            PRIVACY IS NOT A CRIME.
          </h1>
          <p className="text-xl md:text-2xl text-zkira-text-secondary max-w-2xl mx-auto">
            Powered by ZKIRA.XYZ — Ultra Private Cross-Chain Swaps
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-16">
        <section className="space-y-6">
          <h2 className="font-orbitron text-2xl md:text-3xl font-normal text-zkira-green">
            The Problem
          </h2>
          <div className="prose prose-lg max-w-none text-zkira-text">
            <p className="text-lg leading-relaxed mb-6">
              ALL blockchain transactions are PUBLIC and TRACKABLE. Every move you make, every token you swap,
              every address you interact with — it's all permanently recorded on the blockchain for anyone to see.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              Forensic companies like Chainalysis, Elliptic, and CipherTrace have sophisticated tools that can
              trace every transaction. Your wallet history, balances, counterparties — all exposed. Even traditional
              "mixing" services leave patterns that can be analyzed and de-anonymized.
            </p>
            <p className="text-lg leading-relaxed text-zkira-red">
              Your financial privacy is being systematically eroded with every transaction.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="font-orbitron text-2xl md:text-3xl font-normal text-zkira-green">
            Our Solution
          </h2>
          <div className="prose prose-lg max-w-none text-zkira-text">
            <p className="text-lg leading-relaxed mb-6">
              ZKIRA uses advanced cryptographic routing through privacy-preserving networks to break the
              on-chain link completely. When you swap through us, your transaction becomes 100% anonymous and private.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              Not even the most advanced blockchain forensic tools can trace the connection between your input
              and output. We don't just obscure your transaction — we make it mathematically impossible to trace.
            </p>
            <div className="bg-zkira-card border border-zkira-border rounded-lg p-6">
              <p className="text-zkira-green font-medium text-lg">
                Zero Knowledge. Zero Traces. Zero Compromise.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="font-orbitron text-2xl md:text-3xl font-normal text-zkira-green">
            How It Works
          </h2>
          <div className="grid gap-8 md:gap-12">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-zkira-green bg-opacity-20 border-2 border-zkira-green rounded-full flex items-center justify-center">
                  <span className="font-orbitron font-bold text-zkira-green">1</span>
                </div>
              </div>
              <div>
                <h3 className="font-orbitron text-xl font-medium text-white mb-3">Send Your Crypto</h3>
                <p className="text-zkira-text leading-relaxed">
                  Send your cryptocurrency to our secure, encrypted address. Your transaction enters our
                  privacy-preserving infrastructure.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-zkira-green bg-opacity-20 border-2 border-zkira-green rounded-full flex items-center justify-center">
                  <span className="font-orbitron font-bold text-zkira-green">2</span>
                </div>
              </div>
              <div>
                <h3 className="font-orbitron text-xl font-medium text-white mb-3">Cryptographic Routing</h3>
                <p className="text-zkira-text leading-relaxed">
                  Your funds are routed through our encrypted, privacy-preserving channels using advanced
                  cryptographic techniques that completely anonymize the transaction flow.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-zkira-green bg-opacity-20 border-2 border-zkira-green rounded-full flex items-center justify-center">
                  <span className="font-orbitron font-bold text-zkira-green">3</span>
                </div>
              </div>
              <div>
                <h3 className="font-orbitron text-xl font-medium text-white mb-3">Receive Clean Crypto</h3>
                <p className="text-zkira-text leading-relaxed">
                  Clean cryptocurrency arrives at your destination wallet — completely untraceable and
                  disconnected from your original transaction.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="text-center py-12">
          <div className="bg-zkira-card border border-zkira-green border-opacity-30 rounded-xl p-8 md:p-12">
            <h2 className="font-orbitron text-2xl md:text-3xl font-normal text-white mb-6">
              Ready to go private?
            </h2>
            <p className="text-zkira-text-secondary text-lg mb-8 max-w-2xl mx-auto">
              Take control of your financial privacy. Start making truly anonymous transactions today.
            </p>
            <Link
              href="/"
              className="inline-block bg-zkira-green hover:bg-opacity-80 text-black font-orbitron font-medium px-8 py-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-zkira-green hover:shadow-opacity-20"
            >
              START SWAPPING PRIVATELY
            </Link>
          </div>
        </section>

        <section className="border-t border-zkira-border pt-16">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="font-orbitron text-xl font-medium text-zkira-green mb-4">
                Enterprise-Grade Security
              </h3>
              <p className="text-zkira-text leading-relaxed">
                Our infrastructure uses military-grade encryption and zero-knowledge protocols to ensure
                your transactions remain completely private and secure.
              </p>
            </div>
            <div>
              <h3 className="font-orbitron text-xl font-medium text-zkira-green mb-4">
                Multi-Chain Support
              </h3>
              <p className="text-zkira-text leading-relaxed">
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
