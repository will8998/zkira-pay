'use client';

import { PageHeader } from '@/components/PageHeader';
import { CodeBlock } from '@/components/learn/CodeBlock';

export default function DocsPage() {
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader 
        title="Documentation" 
        description="Complete guide to building with ZKIRA Pay" 
      />

      {/* Section 1: Getting Started */}
      <section id="getting-started" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Getting Started</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">What is ZKIRA Pay?</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              ZKIRA Pay is a stealth payment protocol built on Solana that enables truly private transactions using Ed25519 stealth addresses. 
              Unlike traditional blockchain payments where recipient addresses are publicly visible, ZKIRA Pay allows senders to generate 
              one-time stealth addresses that only the intended recipient can identify and claim, providing unprecedented financial privacy 
              while maintaining the security and speed of Solana.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The protocol leverages cryptographic techniques including elliptic curve Diffie-Hellman (ECDH) key exchange and deterministic 
              key derivation to ensure that each payment creates a unique, unlinkable transaction that cannot be traced back to the recipient's 
              primary identity. This makes ZKIRA Pay ideal for use cases requiring financial privacy such as payroll, donations, and confidential business transactions.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Key Features</h3>
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <ul className="space-y-2">
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>Stealth Addresses:</strong> Generate one-time addresses that only recipients can identify and claim</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>Payment Escrows:</strong> Secure fund holding with stealth address claiming and expiry mechanisms</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>Milestone Escrows:</strong> Conditional fund release based on milestone completion</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>Multi-signature Support:</strong> M-of-N approval mechanisms for enhanced security</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>Batch Payments:</strong> Process multiple payments efficiently in single transactions</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>Shielded Pool:</strong> Fixed-denomination deposits with zero-knowledge proof withdrawals for enhanced privacy</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>ZK Proofs:</strong> Groth16 zero-knowledge proofs for private fund withdrawals without revealing deposit history</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>Privacy Transport:</strong> Tor hidden service and Nym mixnet integration for network-level anonymity</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>Timing Defenses:</strong> Soak times, Poisson batching, and decoy transactions to prevent timing analysis</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">How It Works</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              ZKIRA Pay operates through multiple layers of privacy protection: First, the sender derives a one-time stealth address using the recipient's 
              published meta-address (a pair of public keys). The funds are then locked in an escrow account controlled by this stealth 
              address. For enhanced privacy, users can deposit funds into the shielded pool, which uses zero-knowledge proofs and fixed 
              denominations to break transaction linkability. Finally, the recipient scans for incoming payments using their 
              view key, identifies payments addressed to them, and claims the funds using the derived stealth private key.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              This multi-layered architecture ensures that only the sender and recipient are aware of the payment relationship, while observers see 
              only seemingly random addresses and transactions. The protocol maintains a transparent audit trail for compliance while 
              protecting user privacy through cryptographic unlinkability, network-level anonymity via Tor and Nym mixnet, and timing 
              defenses that prevent correlation attacks.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Prerequisites</h3>
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <ul className="space-y-2">
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span>Solana wallet with SOL for transaction fees</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span>USDC or other SPL tokens for payments</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span>Node.js 18+ for SDK integration</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span>ZKIRA API key for hosted services</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Quick Setup</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Start building with ZKIRA Pay by installing the SDK and initializing a client instance:
            </p>
            
            <CodeBlock 
              code={`import { ZkiraClient } from '@zkira/sdk';
import { Connection } from '@solana/web3.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const client = new ZkiraClient(connection, wallet);`}
              language="typescript"
              title="SDK Initialization"
            />
          </div>
        </div>
      </section>

      {/* Section 2: Stealth Addresses */}
      <section id="stealth-addresses" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Stealth Addresses</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Understanding Stealth Addresses</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Stealth addresses represent one of the most significant privacy innovations in blockchain technology. Unlike traditional 
              cryptocurrency addresses that are reused and publicly linkable to user identities, stealth addresses provide a mechanism 
              for generating unique, one-time addresses for each transaction that maintain the recipient's privacy while ensuring funds 
              can only be claimed by the intended party.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The fundamental insight behind stealth addresses is that privacy requires unlinkability - the ability to break the connection 
              between different transactions involving the same party. Traditional addresses fail this test because they create permanent, 
              public associations. Stealth addresses solve this by generating cryptographically unique addresses for each payment while 
              maintaining the mathematical relationship necessary for the recipient to identify and claim their funds.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Meta-Address Concept</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              At the heart of ZKIRA Pay's stealth address system is the meta-address - a cryptographic construct consisting of two Ed25519 
              public keys that recipients publish to receive private payments. The meta-address contains a spend public key, which derives 
              the mathematical relationship for fund ownership, and a view public key, which enables the scanning and identification of 
              incoming payments without revealing the spend key.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              This dual-key architecture provides elegant separation of concerns: the view key allows recipients to privately monitor the 
              blockchain for payments addressed to them, while the spend key remains secure and is only used during the claiming process. 
              Recipients can safely share their meta-address publicly, similar to how Bitcoin addresses are shared, but with the crucial 
              difference that each payment creates a unique, unlinkable stealth address derived from this meta-address.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Stealth Address Derivation Process</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The process of deriving a stealth address involves sophisticated cryptographic computations that ensure both security and 
              privacy. When a sender wants to create a private payment, they begin by generating an ephemeral Ed25519 keypair that will 
              be used only for this specific transaction. This ephemeral keypair serves as the sender's temporary identity for the purpose 
              of establishing a shared secret with the recipient.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The sender then performs an Elliptic Curve Diffie-Hellman (ECDH) key exchange using their ephemeral private key and the 
              recipient's view public key. This operation produces a shared secret that only the sender and recipient can compute - the 
              sender using their ephemeral private key and the recipient's view public key, and the recipient using their view private 
              key and the sender's ephemeral public key (which is published with the payment announcement).
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              From this shared secret, a stealth scalar is derived using SHA256 hashing with domain separation: 
              stealth_scalar = SHA256("priv_stealth" || shared_secret || 0x00) mod L, where L is the order of the Ed25519 curve. 
              The final stealth public key is computed as: stealth_pubkey = recipient_spend_pubkey + stealth_scalar * G, where G is 
              the Ed25519 base point. This mathematical relationship ensures that only the recipient can derive the corresponding 
              private key needed to claim the funds.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Recipient Scanning Process</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Recipients identify payments addressed to them through a scanning process that leverages their view private key to test 
              each stealth address announcement on the blockchain. For each announcement, the recipient performs the same ECDH computation 
              that the sender used, but from their perspective: computing the shared secret using their view private key and the sender's 
              published ephemeral public key.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The recipient then derives the expected stealth public key using their spend public key and the computed stealth scalar. 
              If this expected public key matches the actual stealth address used in the payment, the recipient knows this payment was 
              intended for them. This scanning process preserves privacy because it doesn't require any on-chain interaction - recipients 
              can scan completely offline by downloading blockchain data.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Fund Claiming Mechanism</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Once a recipient identifies a payment addressed to them, claiming the funds requires deriving the stealth private key 
              corresponding to the stealth address. This is accomplished by computing: stealth_private_key = recipient_spend_private + stealth_scalar. 
              The mathematical elegance of elliptic curve cryptography ensures that this private key corresponds exactly to the public key 
              used to lock the funds, allowing the recipient to prove ownership and transfer the assets to their chosen destination.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The claiming process is designed to be atomic and secure, preventing front-running attacks and ensuring that only the legitimate 
              recipient can access the funds. The protocol includes additional safeguards such as stealth address verification and time-locked refund 
              mechanisms to handle edge cases and provide recourse for failed transactions.
            </p>
          </div>

        </div>
      </section>

      {/* Section 3: Payment Flow */}
      <section id="payment-flow" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Payment Flow</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Creating a Payment</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The payment creation process begins when a sender initiates a private transfer to a recipient's meta-address. The sender 
              specifies the payment amount, token type (such as USDC or SOL), and an expiry time that determines how long the recipient 
              has to claim the funds before they can be refunded. The ZKIRA client handles the complex cryptographic operations automatically, 
              deriving the stealth address and creating the necessary on-chain escrow account.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              During payment creation, the protocol generates several critical components: the ephemeral keypair for ECDH, the derived 
              stealth address, and the escrow account to hold funds. The stealth address cryptographically ensures that funds can only be 
              accessed by the intended recipient who possesses the corresponding stealth private key, providing robust security.
            </p>
            
            <CodeBlock 
              code={`// Create payment
const payment = await client.createPaymentLink({
  recipientMetaAddress: 'zkira1...',
  amount: 1_000_000, // 1 USDC (6 decimals)
  tokenMint: USDC_MINT,
  expirySeconds: 7 * 24 * 60 * 60, // 7 days
});`}
              language="typescript"
              title="Payment Creation"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Payment Link Generation</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Once the payment escrow is created and funds are locked, ZKIRA Pay generates a claim URL that can be safely shared with 
              the recipient through any communication channel. The claim URL contains the escrow address, allowing the recipient to 
              identify and claim their payment using their stealth private key.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              This design allows for flexible payment distribution - senders can share payment links via email, messaging apps, QR codes, 
              or any other communication method. The stealth address system ensures that only the intended recipient can identify and claim 
              the payment, providing privacy without requiring additional secrets or authentication factors.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Claiming a Payment</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Recipients claim payments by accessing the payment link and using their wallet to interact with the ZKIRA client. The 
              claiming process involves deriving the stealth private key from the recipient's spend key and the payment's ephemeral public key, 
              then constructing and submitting a transaction that transfers the escrowed funds to the recipient's chosen destination address.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The claiming transaction includes cryptographic proofs that verify the recipient's ownership of the stealth address 
              through their possession of the corresponding stealth private key. This ensures that funds cannot be claimed by unauthorized 
              parties who do not possess the recipient's private keys.
            </p>
            
            <CodeBlock 
              code={`// Claim payment
const claim = await client.claimStealth({
  escrowAddress: payment.escrowAddress,
});`}
              language="typescript"
              title="Payment Claiming"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Refunding Expired Payments</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              ZKIRA Pay includes built-in safeguards to prevent funds from being permanently locked in escrow accounts. Each payment 
              includes an expiry timestamp that determines when the original sender can reclaim unclaimed funds. This mechanism protects 
              against scenarios where recipients lose access to their keys, claim URLs are not delivered, or technical issues prevent 
              successful claiming.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The refund process can only be initiated by the original payment creator and only after the expiry time has passed. This 
              ensures that recipients have adequate time to claim their payments while providing senders with recourse for unsuccessful 
              transfers. Refunds return funds to the sender's original account, minus any protocol fees that may have been collected.
            </p>
            
            <CodeBlock 
              code={`// Refund expired payment
const refund = await client.refundPayment({
  escrowAddress: payment.escrowAddress,
});`}
              language="typescript"
              title="Payment Refunding"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Payment States and Lifecycle</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Every ZKIRA Pay payment progresses through a defined lifecycle with distinct states that determine available actions. 
              Payments begin in the "Created" state when the escrow is established and funds are locked. They transition to "Claimed" 
              when the recipient successfully extracts the funds, or to "Expired" when the time limit passes without claiming. 
              Expired payments can then be "Refunded" by the original sender.
            </p>
            
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-hover)]">
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">State</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Description</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Available Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Created</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Funds locked in escrow, awaiting claim</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Claim (recipient)</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Claimed</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Successfully claimed by recipient</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">None</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Expired</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Expiry time passed without claim</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Refund (sender)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Refunded</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Funds returned to sender</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">None</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: SDK Reference */}
      <section id="sdk-reference" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">SDK Reference</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">ZkiraClient Class</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The ZkiraClient is the primary interface for interacting with ZKIRA Pay protocols. It provides high-level methods for 
              creating payments, claiming funds, managing stealth addresses, and querying blockchain state.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[var(--color-text)] mb-3">createPaymentLink(params)</h4>
            <p className="text-[var(--color-text-secondary)] text-sm mb-3 leading-relaxed">
              Creates a new payment escrow and returns a claimable URL for the recipient.
            </p>
            
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-hover)]">
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Parameter</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Type</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">recipientMetaAddress</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">string</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Recipient's published meta-address</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">amount</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">bigint</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Payment amount in token base units</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">tokenMint</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">PublicKey</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">SPL token mint address</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">expirySeconds</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">number</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Time until payment can be refunded</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[var(--color-text-secondary)] text-sm mb-3 leading-relaxed">
              <strong>Returns:</strong> Promise&lt;{`{escrowAddress: string, claimUrl: string, stealthAddress: string}`}&gt;
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[var(--color-text)] mb-3">claimStealth(params)</h4>
            <p className="text-[var(--color-text-secondary)] text-sm mb-3 leading-relaxed">
              Claims a payment from an escrow using the recipient's stealth private key.
            </p>
            
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-hover)]">
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Parameter</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Type</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">escrowAddress</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">string</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Payment escrow account address</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">claimerTokenAccount</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">PublicKey (optional)</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Destination token account (auto-derived if not provided)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[var(--color-text-secondary)] text-sm mb-3 leading-relaxed">
              <strong>Returns:</strong> Promise&lt;{`{signature: string, amount: bigint}`}&gt;
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[var(--color-text)] mb-3">refundPayment(params)</h4>
            <p className="text-[var(--color-text-secondary)] text-sm mb-3 leading-relaxed">
              Refunds an expired payment back to the original sender.
            </p>
            
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-hover)]">
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Parameter</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Type</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">escrowAddress</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">string</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Payment escrow account address</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[var(--color-text-secondary)] text-sm mb-3 leading-relaxed">
              <strong>Returns:</strong> Promise&lt;{`{signature: string, refundAmount: bigint}`}&gt;
            </p>
          </div>


          <div>
            <h4 className="text-sm font-medium text-[var(--color-text)] mb-3">scanForPayments(params)</h4>
            <p className="text-[var(--color-text-secondary)] text-sm mb-3 leading-relaxed">
              Scans blockchain announcements for payments addressed to the user.
            </p>
            
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-hover)]">
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Parameter</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Type</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">fromSlot</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">number</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Starting blockchain slot to scan</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">toSlot</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">number</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Ending blockchain slot to scan</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[var(--color-text-secondary)] text-sm mb-3 leading-relaxed">
              <strong>Returns:</strong> Promise&lt;Array&lt;{`{escrowAddress: string, amount: bigint, tokenMint: string}`}&gt;&gt;
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">PDA Helper Functions</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              ZKIRA Pay uses Program Derived Addresses (PDAs) for deterministic account generation. These helper functions 
              compute the correct addresses for various protocol accounts.
            </p>
            
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-hover)]">
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Function</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Purpose</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Parameters</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">findEscrow</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Derives escrow PDA</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">creator: PublicKey, nonce: number</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">findEscrowVault</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Derives escrow vault PDA</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">escrow: PublicKey</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">findConfig</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Derives protocol config PDA</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">None</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">findPoolState</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Derives shielded pool state PDA</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">None</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">findDepositLeaf</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Derives deposit leaf PDA in Merkle tree</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">commitment: PublicKey</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">findWithdrawalQueue</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Derives withdrawal queue PDA</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">batch: number</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Widget Integration */}
      <section id="widget" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Widget Integration</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">React Hook: useZkiraPay</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The useZkiraPay hook provides a simple React interface for integrating ZKIRA Pay into your applications. It handles 
              authentication, API communication, and state management while providing a clean, developer-friendly interface for 
              creating and managing payments.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The hook accepts configuration options including API endpoints and authentication credentials, returning methods for 
              payment creation, status checking, and retrieval operations. It also manages loading states, error handling, and 
              automatic retries for failed operations.
            </p>

            <h4 className="text-sm font-medium text-[var(--color-text)] mb-3 mt-6">Configuration Options</h4>
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-hover)]">
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Option</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Type</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">payAppUrl</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">string</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Base URL for payment UI</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">apiUrl</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">string</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">ZKIRA API endpoint</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">apiKey</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">string</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Authentication API key</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-sm font-medium text-[var(--color-text)] mb-3">Returned Methods</h4>
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-hover)]">
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Method</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Purpose</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Returns</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">createPayment</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Create new payment</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Promise&lt;PaymentResult&gt;</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">checkPaymentStatus</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Check payment status</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Promise&lt;PaymentStatus&gt;</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">getPayment</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Retrieve payment details</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Promise&lt;Payment&gt;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">ZkiraPayButton Component</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The ZkiraPayButton is a drop-in React component that provides a complete payment interface with minimal configuration. 
              It includes built-in styling, loading states, error handling, and success notifications, making it perfect for 
              quick integrations where custom UI is not required.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">HTML Script Integration</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              For non-React applications, ZKIRA Pay provides a vanilla JavaScript widget that can be embedded using standard 
              HTML script tags. This approach requires no build tools or framework dependencies, making it suitable for simple 
              websites, WordPress installations, or legacy applications.
            </p>
            
            <CodeBlock 
              code={`<script src="https://cdn.zkira.xyz/widget.js"></script>
<zkira-pay amount="100" token="USDC"></zkira-pay>`}
              language="html"
              title="HTML Widget Embed"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">React Integration Example</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Here's a complete example showing how to integrate ZKIRA Pay into a React application using the useZkiraPay hook:
            </p>
            
            <CodeBlock 
              code={`import { useZkiraPay } from '@zkira/widget';

function PaymentButton() {
  const { createPayment, status } = useZkiraPay({
    apiUrl: 'https://api.zkira.xyz',
    apiKey: 'zkira_sk_...',
  });

  const handlePay = async () => {
    const result = await createPayment({ 
      amount: 50, 
      token: 'USDC',
      recipient: 'zkira1...' 
    });
    console.log('Payment created:', result.claimUrl);
  };

  return (
    <button 
      onClick={handlePay} 
      disabled={status === 'pending'}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      {status === 'pending' ? 'Processing...' : 'Pay $50'}
    </button>
  );
}`}
              language="tsx"
              title="React Payment Component"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Advanced Configuration</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The widget supports advanced configuration options for customizing appearance, behavior, and integration with existing 
              payment flows. Options include custom styling via CSS variables, webhook endpoints for payment notifications, 
              success/failure callback functions, and integration with analytics platforms.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              For high-volume applications, the widget can be configured to use custom relayer endpoints, implement payment batching, 
              and provide detailed error reporting. These features make it suitable for production e-commerce applications and 
              enterprise payment processing systems.
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: Solana Programs */}
      <section id="programs" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Solana Programs</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Program Architecture Overview</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              ZKIRA Pay's on-chain infrastructure consists of multiple specialized Solana programs that work together to provide 
              secure, private payment capabilities. Each program is designed with a specific purpose and implements distinct 
              functionality while maintaining interoperability through standardized interfaces and shared account structures.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The modular architecture allows for independent upgrades, specialized optimization, and reduced attack surface area 
              compared to monolithic program designs. Programs communicate through Cross-Program Invocations (CPIs) and maintain 
              state consistency through carefully designed account validation and instruction sequencing.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Ghost Registry Program</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The Ghost Registry serves as the foundational layer for ZKIRA Pay's stealth address system. It manages the registration 
              and storage of stealth meta-addresses, maintains announcement records for payment notifications, and provides the 
              cryptographic infrastructure necessary for stealth address derivation and verification.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Key responsibilities include validating meta-address registrations to ensure cryptographic correctness, storing 
              ephemeral public keys and stealth address announcements for recipient scanning, implementing access controls to 
              prevent unauthorized modifications, and providing efficient query mechanisms for payment discovery. The program 
              maintains a registry of all active meta-addresses and their associated metadata while preserving user privacy 
              through careful information disclosure controls.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The Ghost Registry implements several critical security features including replay protection for announcement records, 
              rate limiting to prevent spam attacks, and cryptographic verification of stealth address derivations. It also provides 
              efficient indexing mechanisms that allow recipients to scan for payments without downloading excessive blockchain data.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Payment Escrow Program</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The Payment Escrow program implements the core payment functionality for simple, immediate-settlement transactions. 
              It manages the complete lifecycle of payments from creation through claiming or refunding, implementing security 
              measures to ensure funds can only be accessed by authorized parties while providing mechanisms for recovery in 
              exceptional circumstances.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The program handles payment creation by validating sender credentials, locking funds in secure vault accounts, and 
              recording necessary metadata for claim verification. During claiming operations, it verifies stealth address 
              ownership through cryptographic proofs of the stealth private key, ensuring secure authentication for fund access.
              The refund mechanism provides time-locked recovery for expired payments while preventing abuse through careful validation 
              of refund eligibility.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Advanced features include protocol fee collection for sustainable operation, integration with the Ghost Registry for 
              stealth address validation, support for multiple SPL tokens through standardized interfaces, and comprehensive event 
              logging for payment tracking and analytics. The program implements strict state machine logic to ensure payment 
              integrity and prevent double-spending or other attack vectors.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Shielded Pool Program</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The Shielded Pool program implements zero-knowledge privacy features that provide enhanced anonymity beyond stealth 
              addresses alone. It manages fixed-denomination deposits (10 USDC) that break the link between deposit and withdrawal 
              amounts, using a Poseidon Merkle tree to store cryptographic commitments and Groth16 zero-knowledge proofs for 
              private withdrawals without revealing which specific deposit is being claimed.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The program maintains a 20-level Merkle tree where each leaf represents a deposit commitment computed as 
              Poseidon(nullifier, secret). When users withdraw, they generate a Groth16 proof demonstrating knowledge of valid 
              secret values without revealing which commitment corresponds to their deposit. The on-chain verification process 
              consumes less than 200,000 compute units, making it efficient for Solana's execution environment.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Key security features include mandatory 6-hour soak times to prevent rapid deposit-withdrawal cycles, Poisson-distributed 
              batch processing for withdrawal timing privacy, and integration with the protocol's decoy transaction system. The program 
              also implements nullifier tracking to prevent double-spending and provides efficient tree rebuilding mechanisms for 
              optimal proof generation performance.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Conditional Escrow Program</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The Conditional Escrow program extends ZKIRA Pay's capabilities to support milestone-based payments and complex 
              conditional release mechanisms. This program is essential for business applications such as freelance contracts, 
              project funding, and phased payments where fund release depends on specific conditions being met rather than simple 
              time-based claiming.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Milestone-based escrows allow payers to define specific deliverables or checkpoints that must be completed before 
              funds are released. The program supports both automatic milestone verification through on-chain oracles and manual 
              approval processes where designated parties confirm milestone completion. This flexibility enables a wide range of 
              payment scenarios while maintaining the privacy benefits of stealth addresses.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Key features include configurable milestone structures with partial fund release capabilities, dispute resolution 
              mechanisms through designated arbitrators, integration with external verification systems for automated milestone 
              checking, and comprehensive audit trails for compliance and accountability. The program maintains strict access 
              controls to prevent unauthorized milestone modifications while providing transparency for all authorized parties.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Multisig Escrow Program</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The Multisig Escrow program provides M-of-N signature requirements for high-security payment scenarios such as 
              treasury management, large-value transactions, and organizational payments where multiple approvals are required. 
              This program combines the privacy benefits of stealth addresses with the security guarantees of multi-signature schemes.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The program supports flexible signature threshold configurations, allowing organizations to define exactly how many 
              signatures are required for different types of operations. Signers can be individual users or other programs, 
              enabling complex approval workflows that integrate with existing organizational structures. The system maintains 
              privacy by using stealth addresses for the final payment destination while preserving accountability through the 
              multi-signature approval process.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Advanced features include time-locked signature collection periods, signature weight systems where different signers 
              have different voting power, batch signature processing for operational efficiency, and integration with hardware 
              security modules for enhanced key protection. The program also supports signature delegation mechanisms and 
              emergency override procedures for business continuity scenarios.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Program Derived Address (PDA) Reference</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              ZKIRA Pay programs use deterministic address derivation to create predictable, secure account addresses without 
              requiring explicit private key management. This table shows the seed structures for each PDA type:
            </p>
            
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-hover)]">
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">PDA Type</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Seeds</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Meta-Address</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">["meta", owner.key]</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">User stealth meta-address storage</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Payment Escrow</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">["escrow", creator.key, nonce]</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Simple payment escrow account</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Escrow Vault</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">["vault", escrow.key]</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Token account for escrow funds</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Conditional Escrow</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">["conditional", creator.key, nonce]</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Milestone-based escrow account</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Multisig Escrow</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">["multisig", creator.key, nonce]</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Multi-signature escrow account</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Announcement</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">["announce", stealth.key]</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Stealth address announcement</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Protocol Config</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">["config"]</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Global protocol configuration</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Instruction Reference</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Each program exposes specific instructions for interacting with its functionality. This reference table provides 
              an overview of the key instructions available across all ZKIRA Pay programs:
            </p>
            
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-hover)]">
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Program</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Instruction</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Ghost Registry</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">AnnouncePayment</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Record stealth address announcement</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Payment Escrow</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">CreatePayment</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Create simple payment escrow</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Payment Escrow</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">ClaimPayment</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Claim payment with stealth key</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Payment Escrow</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">RefundPayment</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Refund expired payment</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Conditional Escrow</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">CreateMilestone</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Create milestone-based escrow</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Conditional Escrow</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">CompleteMilestone</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Mark milestone as completed</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Multisig Escrow</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">CreateMultisig</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Create multi-signature escrow</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Multisig Escrow</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">ApproveTransaction</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Add signature approval</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Shielded Pool */}
      <section id="shielded-pool" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Shielded Pool</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Understanding Shielded Deposits</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The Shielded Pool provides an additional layer of privacy beyond stealth addresses by implementing fixed-denomination 
              deposits that break the link between deposit and withdrawal amounts. Users deposit exactly 10 USDC into the pool, 
              receiving an encrypted note that proves their deposit without revealing their identity. This creates a large anonymity 
              set where all deposits look identical, making it impossible to trace specific funds through the pool.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The pool uses a Poseidon Merkle tree to store cryptographic commitments of each deposit. When you deposit, your 
              commitment (a hash of your secret values) is added to the tree, but the actual secret values remain private. This 
              mathematical structure allows you to later prove you made a valid deposit without revealing which specific deposit 
              was yours, providing strong privacy guarantees through zero-knowledge cryptography.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Making a Shielded Deposit</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Creating a shielded deposit is straightforward - simply specify the token you want to deposit (currently USDC) and 
              the SDK handles all the complex cryptography. Behind the scenes, the system generates a random nullifier and secret, 
              computes your commitment using the Poseidon hash function, and submits it to the Merkle tree. You receive an encrypted 
              note containing your secret values that you'll need for withdrawal.
            </p>
            
            <CodeBlock 
              code={`// Create shielded deposit
const poolClient = new ShieldedPoolClient(connection, wallet, poolConfig);

// Deposit 10 USDC into the pool
const { txSignature, note } = await poolClient.deposit(USDC_MINT);

// Save the encrypted note securely - you need this to withdraw!
console.log('Deposit successful:', txSignature);
console.log('Withdrawal note:', note); // Keep this safe!`}
              language="typescript"
              title="Shielded Pool Deposit"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Zero-Knowledge Proof Generation</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              When withdrawing from the shielded pool, you must generate a zero-knowledge proof that demonstrates you made a valid 
              deposit without revealing which deposit was yours. The system uses Groth16 proofs, which are compact and fast to verify 
              on-chain (under 200,000 compute units). The proof generation happens locally in your browser and takes about 3 seconds.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The proof verifies several things: that you know the secret values for a commitment in the Merkle tree, that you 
              haven't already withdrawn these funds (nullifier hasn't been used), and that you're withdrawing to a valid address. 
              All of this verification happens without revealing your original deposit, providing mathematical privacy guarantees.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Private Withdrawals</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Withdrawals from the shielded pool are processed in batches approximately every hour to provide additional timing 
              privacy. When you initiate a withdrawal, your request joins a queue with other users' withdrawals, and they're all 
              processed together. This batching makes it difficult for observers to correlate specific deposits with withdrawals 
              based on timing patterns.
            </p>
            
            <CodeBlock 
              code={`// Withdraw from shielded pool
// Note: This queues the withdrawal for batch processing
const result = await poolClient.withdraw(note, recipientAddress);

console.log('Withdrawal queued:', result.queuePosition);
console.log('Estimated processing time: ~1 hour');

// Check pool statistics
const state = await poolClient.getPoolState();
console.log('Total deposits:', state.totalDeposits);
console.log('Pending withdrawals:', state.pendingWithdrawals);`}
              language="typescript"
              title="Shielded Pool Withdrawal"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Pool Management</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The shielded pool maintains a Merkle tree of all deposits and requires periodic maintenance to ensure optimal 
              performance. The tree can be rebuilt when needed to optimize proof generation times, and the pool tracks various 
              statistics to help users understand anonymity set sizes and processing times.
            </p>
            
            <CodeBlock 
              code={`// Pool maintenance and statistics
// Rebuild Merkle tree for optimal performance
await poolClient.rebuildTree();

// Get detailed pool state
const state = await poolClient.getPoolState();
console.log('Anonymity set size:', state.totalDeposits);
console.log('Tree height:', state.treeHeight);
console.log('Next batch processing:', state.nextBatchTime);`}
              language="typescript"
              title="Pool Management"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Security Considerations</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The shielded pool implements several security measures to protect user privacy and funds. The 6-hour minimum soak 
              time prevents rapid deposit-withdrawal cycles that could be used for timing analysis. The fixed denomination ensures 
              all deposits look identical, and the Groth16 proof system provides cryptographic guarantees that only valid deposit 
              holders can withdraw funds.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Users should securely store their withdrawal notes, as losing the note means losing access to deposited funds. The 
              system cannot recover lost notes since the privacy guarantees depend on the protocol not having access to user secrets. 
              Always backup your notes in multiple secure locations before making deposits.
            </p>
          </div>
        </div>
      </section>

      {/* Section 8: Privacy Transport */}
      <section id="privacy-transport" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Privacy Transport</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Network-Level Privacy</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              While ZKIRA Pay's cryptographic protocols protect transaction content and recipient identity, network-level privacy 
              requires additional measures to prevent observers from correlating IP addresses with blockchain activity. The Privacy 
              Transport system provides multiple layers of network anonymity to ensure your location and identity remain private 
              when interacting with the Solana blockchain.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The system automatically selects the best available privacy transport based on your environment and requirements. 
              For maximum privacy, it uses the Nym mixnet to route traffic through multiple encrypted hops, making it extremely 
              difficult for network observers to trace connections back to your real IP address. When Nym is unavailable, it 
              falls back to Tor hidden services for robust anonymity.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Tor Hidden Service Integration</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              ZKIRA Pay operates a Tor hidden service (.onion address) that provides anonymous access to Solana RPC endpoints. 
              When you connect through Tor, your traffic is encrypted and routed through multiple relays, making it virtually 
              impossible for network observers to determine your real IP address or location. This is particularly important for 
              users in regions with restrictive internet policies or those requiring maximum privacy.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The Tor integration is seamless - simply enable privacy transport in your client configuration and the SDK will 
              automatically route all blockchain interactions through the hidden service. This includes transaction submission, 
              account queries, and payment scanning operations, ensuring comprehensive network-level privacy for all ZKIRA Pay activities.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Nym Mixnet for Browsers</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              For browser-based applications, ZKIRA Pay integrates with the Nym mixnet to provide cutting-edge network privacy. 
              The Nym network uses advanced cryptographic techniques including Sphinx packet format and Poisson mixing to provide 
              stronger anonymity guarantees than traditional proxy networks. Your traffic is encrypted multiple times and mixed 
              with other users' traffic, making timing correlation attacks extremely difficult.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The Nym integration provides metadata protection that goes beyond simple IP address hiding. It protects against 
              traffic analysis, timing correlation, and other sophisticated surveillance techniques that can compromise privacy 
              even when using traditional VPNs or proxy services. This makes it ideal for users requiring the highest levels of 
              network anonymity.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Configuring Privacy Transport</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Setting up privacy transport is simple with the createPrivateTransport() function. The system automatically detects 
              your environment and selects the best available privacy method. In browsers, it prefers Nym mixnet when available, 
              falling back to direct connections if needed. For Node.js applications, it can use Tor SOCKS proxies for enhanced privacy.
            </p>
            
            <CodeBlock 
              code={`// Enable privacy transport
import { createPrivateTransport } from '@zkira/sdk';

// Automatically selects best privacy method
const transport = await createPrivateTransport();

// Use with ZKIRA client
const client = new ZkiraClient(connection, wallet, {
  transport: transport
});

// All operations now use privacy transport
const payment = await client.createPaymentLink({
  recipientMetaAddress: 'zkira1...',
  amount: 1_000_000,
  tokenMint: USDC_MINT,
  expirySeconds: 7 * 24 * 60 * 60
});`}
              language="typescript"
              title="Privacy Transport Setup"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Transport Selection and Fallbacks</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The privacy transport system implements intelligent fallback mechanisms to ensure reliable connectivity while 
              maximizing privacy. It first attempts to connect via Nym mixnet for the strongest anonymity guarantees. If Nym is 
              unavailable or experiencing issues, it falls back to Tor hidden services. As a final fallback, it uses direct 
              connections to ensure your transactions can always be processed.
            </p>
            
            <CodeBlock 
              code={`// Advanced transport configuration
const transport = await createPrivateTransport({
  preferredMethod: 'nym', // 'nym', 'tor', or 'direct'
  timeout: 30000, // Connection timeout in ms
  retries: 3, // Number of retry attempts
  fallbackEnabled: true // Allow fallback to less private methods
});

// Check active transport method
console.log('Active transport:', transport.getActiveMethod());
console.log('Privacy level:', transport.getPrivacyLevel());`}
              language="typescript"
              title="Advanced Transport Configuration"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Privacy vs Performance Trade-offs</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Using privacy transport involves trade-offs between anonymity and performance. Nym mixnet provides the strongest 
              privacy but may have higher latency due to the mixing process. Tor offers good anonymity with moderate latency, 
              while direct connections provide the fastest performance but no network-level privacy. The system allows you to 
              choose the appropriate balance for your use case.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              For most users, the automatic transport selection provides an optimal balance of privacy and usability. High-security 
              applications should explicitly configure Nym or Tor transport, while applications prioritizing speed can use direct 
              connections and rely on ZKIRA Pay's cryptographic privacy features alone.
            </p>
          </div>
        </div>
      </section>

      {/* Section 9: Timing Defenses */}
      <section id="timing-defenses" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Timing Defenses</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Understanding Timing Analysis</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Even with strong cryptographic privacy and network anonymity, transaction timing patterns can reveal information 
              about user behavior and potentially compromise privacy. Timing analysis attacks look for correlations between when 
              deposits and withdrawals occur, the frequency of transactions, and other temporal patterns that might link different 
              activities to the same user or reveal sensitive information about payment flows.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              ZKIRA Pay implements comprehensive timing defenses to protect against these sophisticated attacks. The system uses 
              multiple techniques including mandatory soak times, randomized processing delays, and automated decoy transactions 
              to obscure real user activity within a larger pool of seemingly random blockchain events.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Soak Time Protection</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              All shielded pool deposits must remain in the pool for a minimum of 6 hours before they become eligible for 
              withdrawal. This soak time prevents rapid deposit-withdrawal cycles that could be used to trace funds through the 
              system. During the soak period, your deposit becomes mixed with other users' deposits, making it increasingly 
              difficult to correlate your withdrawal with your original deposit.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The 6-hour minimum was chosen to balance privacy protection with user convenience. It's long enough to ensure 
              meaningful mixing with other deposits while short enough to be practical for most use cases. Users planning to 
              use the shielded pool should factor this delay into their payment timing requirements.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Poisson Batch Processing</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Withdrawals from the shielded pool are processed in batches using Poisson-distributed timing to prevent observers 
              from correlating withdrawal requests with actual withdrawal transactions. Instead of processing withdrawals immediately 
              or at fixed intervals, the system uses random delays that follow a Poisson distribution with an average interval 
              of approximately one hour.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              This randomization makes it extremely difficult for attackers to determine when a specific withdrawal request was 
              submitted based on when the withdrawal transaction appears on the blockchain. The Poisson distribution ensures that 
              batch timing appears natural and unpredictable while maintaining reasonable processing times for users.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Protocol Decoy System</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              To further obscure real user activity, ZKIRA Pay automatically generates decoy deposits and other protocol 
              transactions at regular intervals. These decoy transactions are indistinguishable from real user transactions 
              but are generated by the protocol itself to create background noise that masks genuine user activity patterns.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Decoy deposits occur approximately every 30 minutes with a random variation of ±10 minutes to prevent predictable 
              patterns. These transactions consume real gas fees and interact with the same smart contracts as user transactions, 
              making them cryptographically indistinguishable from genuine deposits. The decoy system ensures that the blockchain 
              always shows consistent activity levels regardless of actual user behavior.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Timing Defense Configuration</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              While timing defenses operate automatically to protect all users, advanced users can configure certain aspects 
              of the timing protection system. This includes setting custom soak times longer than the minimum 6 hours for 
              enhanced privacy, or adjusting withdrawal batch preferences for specific security requirements.
            </p>
            
            <CodeBlock 
              code={`// Configure timing defenses
const poolClient = new ShieldedPoolClient(connection, wallet, {
  minSoakTime: 8 * 60 * 60, // 8 hours instead of default 6
  preferLargerBatches: true, // Wait for larger withdrawal batches
  maxBatchWait: 2 * 60 * 60, // Maximum 2 hour wait for batching
});

// Check timing status
const deposit = await poolClient.deposit(USDC_MINT);
const soakStatus = await poolClient.getSoakStatus(deposit.note);

console.log('Soak time remaining:', soakStatus.remainingTime);
console.log('Eligible for withdrawal:', soakStatus.eligible);
console.log('Next batch estimate:', soakStatus.nextBatchEstimate);`}
              language="typescript"
              title="Timing Defense Configuration"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">User Experience Impact</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The timing defense system is designed to provide strong privacy protection while minimizing impact on user 
              experience. Most users will only notice two changes: a brief 3-second loading spinner during proof generation 
              for shielded pool operations, and a message indicating that funds will arrive within approximately 1 hour for 
              withdrawals due to batch processing.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              All the complex timing protection mechanisms operate transparently in the background. Users don't need to understand 
              Poisson distributions or decoy transactions - they simply experience enhanced privacy with minimal additional 
              friction. The system is designed so that privacy protection feels natural and doesn't require users to change 
              their normal payment workflows.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Advanced Timing Analysis Resistance</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              ZKIRA Pay's timing defenses are designed to resist sophisticated timing analysis attacks including traffic 
              correlation, frequency analysis, and pattern recognition. The combination of soak times, Poisson batching, and 
              decoy transactions creates multiple layers of temporal obfuscation that make it extremely difficult for attackers 
              to extract meaningful information from transaction timing patterns.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The system continuously monitors and adjusts its timing parameters based on network activity and threat models. 
              This adaptive approach ensures that timing defenses remain effective against evolving attack techniques while 
              maintaining optimal user experience. Regular security audits and research collaborations help identify and address 
              new timing-based privacy threats as they emerge.
            </p>
          </div>
        </div>
      </section>

      {/* Section 10: Security Guarantees & Attack Resistance */}
      <section id="security-guarantees" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Section 10: Security Guarantees & Attack Resistance</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Attack Resistance Table</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              ZKIRA Pay provides comprehensive protection against known privacy attacks through multiple defense layers:
            </p>
            
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-hover)]">
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Attack Vector</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">How ZKIRA Defeats It</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Protection Layer</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Transaction graph analysis</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Shielded pool ZK proofs break all on-chain links</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Shielded Pool</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Timing correlation</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">6-hour soak + Poisson batch processing + decoys</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Timing Defenses</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Amount correlation</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Fixed 10 USDC denominations — all deposits identical</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Shielded Pool</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">IP fingerprinting</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Tor hidden service + Nym mixnet</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Privacy Transport</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">RPC metadata leaks</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Blind relaying — relayer never inspects tx data</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Data Hygiene</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Browser fingerprinting</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Client-side proof generation in Web Worker</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">SDK</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Sender-recipient linking</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">One-time stealth addresses via ECDH</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Stealth Addresses</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Balance tracking</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Deposits/withdrawals go through pool, not direct</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Shielded Pool</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Resistance Levels</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              ZKIRA Pay provides quantifiable privacy protection against different classes of adversaries:
            </p>
            <ul className="space-y-2">
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start">
                <span className="text-green-500 mr-2 mt-0.5">•</span>
                <span><strong>~95% resistance</strong> against commercial forensics (Arkham Intelligence, Chainalysis, Solscan)</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start">
                <span className="text-yellow-500 mr-2 mt-0.5">•</span>
                <span><strong>~70-80% resistance</strong> against nation-state adversaries with global network monitoring</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start">
                <span className="text-blue-500 mr-2 mt-0.5">•</span>
                <span><strong>The binding constraint</strong> is anonymity set size, NOT cryptographic weakness</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start">
                <span className="text-purple-500 mr-2 mt-0.5">•</span>
                <span><strong>The cryptography is mathematically unbreakable</strong> — ECDH on Ed25519, Groth16 on BN254, Poseidon hash</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">What's NOT Protected</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Honest disclosure of ZKIRA Pay's limitations and attack vectors that remain outside our protection scope:
            </p>
            <ul className="space-y-2">
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start">
                <span className="text-red-500 mr-2 mt-0.5">•</span>
                <span>Physical coercion / $5 wrench attack</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start">
                <span className="text-red-500 mr-2 mt-0.5">•</span>
                <span>Endpoint compromise (malware on your device)</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start">
                <span className="text-red-500 mr-2 mt-0.5">•</span>
                <span>Behavioral correlation (same amounts at same times repeatedly)</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start">
                <span className="text-red-500 mr-2 mt-0.5">•</span>
                <span>Small anonymity sets during early adoption</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start">
                <span className="text-red-500 mr-2 mt-0.5">•</span>
                <span>Voluntary disclosure by either party</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Comparison to Other Privacy Solutions</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              How ZKIRA Pay compares to other privacy-focused payment systems:
            </p>
            
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-hover)]">
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Feature</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">ZKIRA</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Tornado Cash</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Monero</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">Zcash</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Chain</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Solana</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Ethereum</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Own chain</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Own chain</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Proof system</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Groth16</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Groth16</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Ring signatures</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Groth16</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Timing defenses</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">✓ (Poisson + decoys)</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">✗</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Partial</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">✗</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Network privacy</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">✓ (Tor + Nym)</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">✗</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">✓ (Dandelion++)</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">✗</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Fixed denominations</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">✓ (10 USDC)</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">✓ (0.1/1/10/100 ETH)</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">N/A (all private)</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Optional</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">On-chain verification</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">&lt;200k CU</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">~300k gas</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">N/A</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">~4s</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">UX impact</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">3s spinner + ~1hr withdrawal</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Instant but manual</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Native</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">40s proving</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}