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
                  <span><strong>Payment Escrows:</strong> Secure fund holding with claim secrets and expiry mechanisms</span>
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
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">How It Works</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              ZKIRA Pay operates through a three-step process: First, the sender derives a one-time stealth address using the recipient's 
              published meta-address (a pair of public keys). The funds are then locked in an escrow account controlled by this stealth 
              address, with a claim secret embedded in the payment link. Finally, the recipient scans for incoming payments using their 
              view key, identifies payments addressed to them, and claims the funds using the derived stealth private key.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              This architecture ensures that only the sender and recipient are aware of the payment relationship, while observers see 
              only seemingly random addresses and transactions. The protocol maintains a transparent audit trail for compliance while 
              protecting user privacy through cryptographic unlinkability.
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
              recipient can access the funds. The protocol includes additional safeguards such as claim secrets and time-locked refund 
              mechanisms to handle edge cases and provide recourse for failed transactions.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Meta-Address Registration</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Register your stealth meta-address to receive private payments:
            </p>
            
            <CodeBlock 
              code={`const result = await client.registerMetaAddress({
  spendPubkey: spendKeypair.publicKey.toBytes(),
  viewPubkey: viewKeypair.publicKey.toBytes(),
  label: 'My Stealth Address',
});`}
              language="typescript"
              title="Meta-Address Registration"
            />
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
              stealth address, the escrow account to hold funds, and a claim secret that serves as an additional authentication factor. 
              These components work together to ensure that funds can only be accessed by someone with knowledge of both the recipient's 
              private keys and the claim secret, providing defense-in-depth security.
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
              the recipient through any communication channel. The claim URL contains the escrow address in the path and the claim secret 
              in the URL fragment (after the # symbol), ensuring that the secret is never transmitted to servers and remains client-side only.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              This design allows for flexible payment distribution - senders can share payment links via email, messaging apps, QR codes, 
              or any other communication method. The URL structure ensures that even if communication channels are monitored, the claim 
              secret remains protected through browser security mechanisms that prevent URL fragments from being included in HTTP requests.
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">Claiming a Payment</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              Recipients claim payments by accessing the payment link and using their wallet to interact with the ZKIRA client. The 
              claiming process involves several verification steps: first, the client extracts the claim secret from the URL fragment; 
              second, it identifies the stealth address and derives the corresponding private key using the recipient's spend key; 
              finally, it constructs and submits a transaction that transfers the escrowed funds to the recipient's chosen destination address.
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              The claiming transaction includes cryptographic proofs that verify both the recipient's ownership of the stealth address 
              and their knowledge of the claim secret. This dual-factor authentication ensures that funds cannot be claimed by unauthorized 
              parties even if they gain access to either the claim URL or the recipient's keys independently.
            </p>
            
            <CodeBlock 
              code={`// Claim payment
const claim = await client.claimPayment({
  escrowAddress: payment.escrowAddress,
  claimSecret: payment.claimSecret,
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
              <strong>Returns:</strong> Promise&lt;{`{escrowAddress: string, claimUrl: string, claimSecret: string}`}&gt;
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[var(--color-text)] mb-3">claimPayment(params)</h4>
            <p className="text-[var(--color-text-secondary)] text-sm mb-3 leading-relaxed">
              Claims a payment from an escrow using the recipient's private keys and claim secret.
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
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">claimSecret</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">string</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Secret from payment URL fragment</td>
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
            <h4 className="text-sm font-medium text-[var(--color-text)] mb-3">registerMetaAddress(params)</h4>
            <p className="text-[var(--color-text-secondary)] text-sm mb-3 leading-relaxed">
              Registers a stealth meta-address on-chain for receiving private payments.
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
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">spendPubkey</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Uint8Array</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Public key for spending funds</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">viewPubkey</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Uint8Array</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Public key for scanning payments</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">label</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">string</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Human-readable label</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[var(--color-text-secondary)] text-sm mb-3 leading-relaxed">
              <strong>Returns:</strong> Promise&lt;{`{signature: string, metaAddress: string}`}&gt;
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
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">findMetaAddress</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Derives meta-address PDA</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">owner: PublicKey</td>
                  </tr>
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
                  <tr>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">findConfig</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Derives protocol config PDA</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">None</td>
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
              recording necessary metadata for claim verification. During claiming operations, it verifies both stealth address 
              ownership and claim secret knowledge through cryptographic proofs, ensuring dual-factor authentication for fund access. 
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
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">RegisterMetaAddress</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">Register stealth meta-address</td>
                  </tr>
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
    </div>
  );
}