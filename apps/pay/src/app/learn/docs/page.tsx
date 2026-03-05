'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';

export default function DocsPage() {
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader 
        title="How It Works" 
        description="Understanding OMNIPAY's privacy-preserving payment infrastructure" 
      />

      {/* Section 1: What is OMNIPAY */}
      <section id="what-is-omnipay" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">What is OMNIPAY</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              OMNIPAY is a privacy-preserving payment settlement platform designed for businesses that require confidential financial transactions. Built on blockchain technology, OMNIPAY cryptographically severs the link between sender and receiver, ensuring that payment flows cannot be traced or analyzed by external observers.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The platform is specifically designed for industries where transaction privacy is critical, including iGaming, sports betting, payroll processing, and other business-to-business settlements. OMNIPAY supports major stablecoins including USDC, USDT, and DAI across multiple blockchain networks.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Key Benefits</h3>
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <ul className="space-y-2">
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>Transaction Privacy</strong>: Cryptographically break the link between sender and receiver</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>Multi-Chain Support</strong>: Operate across Arbitrum, Tron, and other major networks</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>Stablecoin Focused</strong>: Support for USDC, USDT, and DAI for predictable settlements</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>Business Integration</strong>: Simple API for seamless platform integration</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>Regulatory Compliance</strong>: Designed to meet privacy needs while maintaining compliance frameworks</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: How Privacy Works */}
      <section id="how-privacy-works" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">How Privacy Works</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Shielded Pool Technology</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              When funds are deposited into OMNIPAY, they enter shielded pools where they are mixed with deposits from other users. This creates a large anonymity set where individual transactions become indistinguishable from one another. The larger the pool, the stronger the privacy guarantees.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Each deposit is converted into a cryptographic commitment that proves ownership without revealing the depositor's identity. These commitments are stored on-chain, but the connection between the commitment and the original depositor is mathematically severed.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Zero-Knowledge Proofs</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              When withdrawing funds, recipients generate zero-knowledge proofs that demonstrate they have the right to claim funds from the pool without revealing which specific deposit belongs to them. This cryptographic technique ensures that even if someone monitors all blockchain activity, they cannot link deposits to withdrawals.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The zero-knowledge proof system verifies that the withdrawal is legitimate while maintaining complete privacy about the transaction's origin. This creates a mathematically provable break in the transaction chain.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Anonymity Set Strength</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The privacy strength of OMNIPAY increases with usage. Each additional user who deposits into the shielded pools expands the anonymity set, making it exponentially more difficult to correlate deposits with withdrawals. This network effect means that privacy improves as adoption grows.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: The Payment Flow */}
      <section id="payment-flow" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">The Payment Flow</h2>
        
        <div className="space-y-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-accent)] text-black rounded-full flex items-center justify-center text-sm font-semibold">
              01
            </div>
            <div>
              <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Payment Initiation</h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                The sender initiates a payment through OMNIPAY's interface or API, specifying the amount and recipient details. The system generates the necessary cryptographic parameters for the private transaction.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-accent)] text-black rounded-full flex items-center justify-center text-sm font-semibold">
              02
            </div>
            <div>
              <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Shielded Pool Deposit</h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                Funds are deposited into privacy-preserving shielded pools where they are mixed with other deposits. The deposit creates a cryptographic commitment that proves ownership without revealing the depositor's identity.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-accent)] text-black rounded-full flex items-center justify-center text-sm font-semibold">
              03
            </div>
            <div>
              <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Secure Claim Generation</h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                The recipient receives a secure claim code that contains the cryptographic keys needed to withdraw the funds. This claim code can be shared through any communication channel without compromising privacy.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-accent)] text-black rounded-full flex items-center justify-center text-sm font-semibold">
              04
            </div>
            <div>
              <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Private Withdrawal</h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                The recipient uses their claim code to withdraw funds from the shielded pool. The withdrawal is cryptographically unlinkable to the original deposit, ensuring complete transaction privacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Multi-Chain Support */}
      <section id="multi-chain-support" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Multi-Chain Support</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              OMNIPAY operates across multiple blockchain networks to serve different regional preferences and regulatory requirements. Currently supported networks include Arbitrum and Tron, with additional chains planned based on user demand.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Each supported blockchain maintains the same privacy guarantees and security standards. Users can choose their preferred network based on factors like transaction costs, settlement speed, and regional accessibility.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Supported Assets</h3>
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <ul className="space-y-2">
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>USDC</strong>: USD Coin for stable value transfers</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>USDT</strong>: Tether for widespread compatibility</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>DAI</strong>: Decentralized stablecoin for DeFi integration</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Network Benefits</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Multi-chain support allows businesses to choose the most suitable network for their specific use case while maintaining consistent privacy guarantees. This flexibility ensures that OMNIPAY can adapt to changing regulatory environments and technical requirements across different jurisdictions.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5: Settlement Privacy Guarantees */}
      <section id="privacy-guarantees" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Settlement Privacy Guarantees</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              OMNIPAY provides comprehensive protection against various forms of transaction analysis and surveillance. The system is designed to resist both automated analysis and manual investigation attempts.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Protection Against</h3>
            <ul className="space-y-2">
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                <span className="text-[var(--color-accent)] mt-1">•</span>
                <span><strong>Transaction Graph Analysis</strong>: Cannot trace connections between sender and receiver addresses</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                <span className="text-[var(--color-accent)] mt-1">•</span>
                <span><strong>Amount Correlation</strong>: Fixed denomination pools prevent matching transactions by amount</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                <span className="text-[var(--color-accent)] mt-1">•</span>
                <span><strong>Timing Analysis</strong>: Deposits and withdrawals happen independently with no time correlation</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                <span className="text-[var(--color-accent)] mt-1">•</span>
                <span><strong>Pattern Recognition</strong>: Cryptographic mixing prevents behavioral pattern analysis</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                <span className="text-[var(--color-accent)] mt-1">•</span>
                <span><strong>Metadata Leakage</strong>: No transaction metadata is preserved that could reveal user relationships</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Mathematical Guarantees</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The privacy guarantees are not based on obscurity or operational security, but on mathematical proofs that make transaction correlation computationally infeasible. Even with unlimited computational resources, the cryptographic protections ensure that transaction privacy is maintained.
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: For Businesses */}
      <section id="for-businesses" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">For Businesses</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              OMNIPAY provides a comprehensive gateway integration solution for businesses that need private settlement capabilities. The platform is particularly well-suited for casinos, sportsbooks, and other businesses that handle sensitive financial transactions.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Our API handles all the complex cryptographic operations behind the scenes, allowing businesses to integrate private payments with just a few lines of code. The system manages shielded pools, zero-knowledge proof generation, and multi-chain operations automatically.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Integration Benefits</h3>
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <ul className="space-y-2">
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>Simple API</strong>: Easy integration with existing business systems</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>Automated Operations</strong>: No need to manage complex cryptographic processes</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>Compliance Support</strong>: Built-in features to support regulatory requirements</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>Scalable Infrastructure</strong>: Handles high-volume transaction processing</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Get Started</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Ready to integrate private settlements into your business? Our comprehensive API documentation provides everything you need to get started with OMNIPAY integration.
            </p>
            <Link 
              href="/learn/api" 
              className="inline-block bg-[var(--color-accent)] text-black px-4 py-2 rounded-none text-sm font-semibold hover:bg-[var(--color-hover)] transition-colors"
            >
              View API Reference
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}