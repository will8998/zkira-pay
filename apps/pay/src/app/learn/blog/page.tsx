'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { CodeBlock } from '@/components/learn/CodeBlock';

interface BlogPost {
  id: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  content: React.ReactNode;
}

const blogPosts: BlogPost[] = [
  {
    id: "intro",
    title: "Introducing ZKIRA Pay: Private Payments on Solana",
    date: "Feb 2026",
    category: "ANNOUNCEMENT",
    excerpt: "ZKIRA Pay brings stealth address technology to Solana, enabling truly private payments without sacrificing speed or cost.",
    content: (
      <div className="prose prose-invert max-w-none">
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Solana's transparent ledger has enabled revolutionary speed and cost efficiency, but it comes with a significant trade-off: every transaction is publicly visible. When you send SOL or SPL tokens, the entire world can see the sender, recipient, amount, and timing. This transparency creates real problems for businesses, individuals, and organizations who need financial privacy.
        </p>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Consider a startup paying employee salaries on-chain. Competitors can analyze their payroll, identify key hires, and estimate runway. A charity accepting donations might inadvertently expose their donors to political pressure or targeted attacks. An individual investor's entire portfolio becomes public knowledge, creating security risks and social complications.
        </p>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Our Solution: Stealth Addresses</h3>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          ZKIRA Pay solves this privacy problem using stealth address technology built on Ed25519 elliptic curve cryptography. Unlike traditional addresses that are reused, stealth addresses are mathematically derived one-time addresses that are unlinkable to each other or to the recipient's identity.
        </p>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Here's how it works: Instead of publishing a single public address, recipients generate a "meta-address" consisting of two public keys. When someone wants to send a payment, they use the meta-address to derive a unique stealth address for that specific transaction. The recipient can scan for and claim these payments using their private keys, but outside observers cannot link the payments together.
        </p>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Beyond Basic Payments</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          ZKIRA Pay isn't just about simple transfers. We've built a comprehensive suite of privacy-preserving financial primitives on top of stealth addresses:
        </p>

        <ul className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4 pl-4">
          <li className="mb-2">• <strong>Payment Links</strong>: Generate private payment requests with custom amounts and memos</li>
          <li className="mb-2">• <strong>Escrow Services</strong>: Conditional payments that release based on predefined criteria</li>
          <li className="mb-2">• <strong>Multi-signature</strong>: Require multiple parties to authorize private payments</li>
          <li className="mb-2">• <strong>Batch Payments</strong>: Send to multiple stealth addresses efficiently in a single transaction</li>
        </ul>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">How We're Different</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          ZKIRA Pay differs fundamentally from mixers, tumblers, or layer-2 solutions. We don't pool funds or require trusted third parties. There's no waiting period for privacy – settlements are instant. We don't hide on layer 2 – everything happens natively on Solana with the speed and cost you expect.
        </p>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Our approach is also compliance-friendly. Unlike mixers that obscure transaction trails, stealth addresses create legitimate privacy without breaking financial regulations. Each payment has a clear sender and recipient – they're just not publicly linkable.
        </p>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">What's Next</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          We're shipping our developer SDK, embeddable payment widget, and REST API to make private payments accessible to every Solana application. Whether you're building a DeFi protocol, marketplace, or Web3 game, you can now offer your users the privacy they deserve without compromising on performance.
        </p>

        <blockquote className="border-l-2 border-[#FF2828] pl-4 italic text-[var(--color-text-secondary)] text-sm leading-relaxed mt-6">
          "Privacy is not about hiding. It's about autonomy."
        </blockquote>
      </div>
    )
  },
  {
    id: "privacy",
    title: "Why Privacy Matters on Solana",
    date: "Feb 2026",
    category: "RESEARCH",
    excerpt: "A deep look at why on-chain privacy is essential for mainstream blockchain adoption and how stealth addresses solve it.",
    content: (
      <div className="prose prose-invert max-w-none">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">The Transparency Paradox</h3>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Blockchain's transparency is both its greatest strength and its biggest barrier to mainstream adoption. While public ledgers enable trustless verification and eliminate the need for financial intermediaries, they create unprecedented exposure of personal and business financial data.
        </p>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          On Solana, every transaction is recorded permanently and publicly. This means anyone can analyze your complete financial history: how much you earn, where you spend, what tokens you hold, who you transact with, and when. This level of transparency would be unthinkable in traditional finance, yet we've accepted it as the price of decentralization.
        </p>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Business Concerns</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          For businesses operating on-chain, transparency creates competitive vulnerabilities. Competitors can track your supplier payments to identify your sources and negotiate better deals. They can analyze your revenue streams to understand your business model and customer acquisition costs. Employee salaries become public information, creating HR challenges and negotiation disadvantages.
        </p>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Consider a DeFi protocol launching a new product. Their on-chain transactions reveal their go-to-market strategy, partner integrations, and user acquisition tactics. This intelligence gives competitors an unfair advantage and discourages innovation in the space.
        </p>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Personal Risks</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Individual users face even greater risks from financial transparency. Wealth exposure leads to targeted attacks – both digital and physical. A successful NFT trader whose address accumulates millions in assets becomes a target for hackers, scammers, and even violent criminals who can trace their on-chain activity to their real-world identity.
        </p>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Donation history can be politically sensitive. Supporting certain causes, charities, or political movements can have professional or social consequences. In authoritarian regimes, financial support for opposition causes can lead to persecution. Even in democratic societies, cancel culture makes donation privacy essential for free expression.
        </p>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Regulatory Landscape</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Privacy regulations like GDPR recognize financial privacy as a fundamental right. The "right to be forgotten" conflicts directly with blockchain immutability. Traditional financial institutions are required by law to protect customer financial data, yet blockchain applications expose this data by default.
        </p>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          As blockchain adoption grows, regulatory pressure for privacy-preserving solutions will intensify. Projects that can't offer compliant privacy options will face restrictions in major markets. Building privacy into the protocol layer ensures long-term regulatory compatibility.
        </p>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Existing Approaches and Their Limitations</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Current privacy solutions each have significant drawbacks. Mixers require trusted third parties and create regulatory risk by pooling funds with potentially illicit sources. They also introduce delays and additional costs that break the user experience.
        </p>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Zero-knowledge rollups offer theoretical privacy but require complex infrastructure and force users off the main chain. Confidential transactions hide amounts but require heavy computation and still expose sender-recipient relationships. These solutions prioritize perfect privacy over practical usability.
        </p>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Stealth Addresses: The Elegant Middle Ground</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Stealth addresses provide practical privacy that works within existing blockchain architecture. They use sender-side address derivation to create unlinkable one-time addresses without requiring trusted setups or layer-2 complexity. Payments settle instantly at native Solana speed while providing meaningful privacy protection.
        </p>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          This approach balances privacy with transparency in a way that satisfies both user needs and regulatory requirements. Transaction amounts remain visible for compliance purposes, but the sender-recipient relationship is protected. It's privacy that you can actually use in production today.
        </p>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">The Path Forward</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          ZKIRA Pay represents a new paradigm: privacy by design rather than privacy as an afterthought. We're not building theoretical privacy that might work someday – we're building practical privacy that works today. The future of blockchain adoption depends on solving the privacy problem at the protocol level, and stealth addresses are the key to that future.
        </p>
      </div>
    )
  },
  {
    id: "technical",
    title: "How Stealth Addresses Work: A Technical Deep-Dive",
    date: "Feb 2026",
    category: "ENGINEERING",
    excerpt: "Under the hood of ZKIRA's stealth address protocol — Ed25519, ECDH key exchange, and one-time address derivation explained.",
    content: (
      <div className="prose prose-invert max-w-none">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Prerequisites and Foundations</h3>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Stealth addresses leverage Ed25519 elliptic curve cryptography, the same curve used by Solana's native keypairs. Understanding the basics is crucial: each keypair consists of a 32-byte private key (scalar) and a 32-byte public key (point on the curve). The fundamental property we exploit is that elliptic curves support linear operations: if you have point P and scalar s, you can compute s*P, and (s1 + s2)*P = s1*P + s2*P.
        </p>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Solana uses Ed25519 for signatures but X25519 (the corresponding Montgomery curve) for key exchange operations. We leverage both: Ed25519 for the final addresses and X25519 for the elliptic curve Diffie-Hellman (ECDH) key exchange that generates shared secrets.
        </p>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Meta-Address Concept</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Instead of a single public address, recipients generate a "meta-address" consisting of two Ed25519 public keys:
        </p>

        <ul className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4 pl-4">
          <li className="mb-2">• <strong>Spend Key</strong>: Controls the ability to move funds from derived stealth addresses</li>
          <li className="mb-2">• <strong>View Key</strong>: Enables scanning for incoming payments without exposing spending ability</li>
        </ul>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          This separation allows recipients to delegate scanning to watch-only wallets or services without compromising fund security. The meta-address is safe to share publicly – it cannot be used to determine which on-chain addresses belong to the recipient.
        </p>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Sender Flow: Generating Stealth Addresses</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          When sending to a meta-address, the sender performs the following steps:
        </p>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-[var(--color-text)] mb-2">1. Generate Ephemeral Keypair</h4>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-2">
            Create a random Ed25519 keypair that will be used only once:
          </p>
          <CodeBlock 
            code={`const ephemeralKeypair = Keypair.generate();
const ephemeralPrivate = ephemeralKeypair.secretKey.slice(0, 32);
const ephemeralPublic = ephemeralKeypair.publicKey;`}
            language="typescript"
            title="Ephemeral Key Generation"
          />
        </div>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-[var(--color-text)] mb-2">2. Perform ECDH Key Exchange</h4>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-2">
            Compute shared secret using X25519:
          </p>
          <CodeBlock 
            code={`import { x25519 } from '@noble/curves/ed25519';

// Convert Ed25519 keys to X25519 format
const ephemeralX25519 = ed25519ToX25519Private(ephemeralPrivate);
const viewX25519 = ed25519ToX25519Public(recipientViewPublic);

// Perform ECDH
const sharedSecret = x25519(ephemeralX25519, viewX25519);`}
            language="typescript"
            title="ECDH Key Exchange"
          />
        </div>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-[var(--color-text)] mb-2">3. Derive Stealth Scalar</h4>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-2">
            Hash the shared secret to create a scalar:
          </p>
          <CodeBlock 
            code={`import { sha256 } from '@noble/hashes/sha256';

const domainSeparator = new TextEncoder().encode('priv_stealth');
const index = new Uint8Array([0x00]); // Payment index

const hashInput = new Uint8Array([
  ...domainSeparator,
  ...sharedSecret,
  ...index
]);

const hash = sha256(hashInput);
const stealthScalar = mod(hash, CURVE_ORDER);`}
            language="typescript"
            title="Scalar Derivation"
          />
        </div>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-[var(--color-text)] mb-2">4. Compute Stealth Address</h4>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-2">
            Add the scalar to the recipient's spend key:
          </p>
          <CodeBlock 
            code={`import { Point } from '@noble/curves/ed25519';

// Parse recipient spend public key as curve point
const spendPoint = Point.fromHex(recipientSpendPublic);

// Compute stealth point: spend_pubkey + scalar * G
const stealthPoint = spendPoint.add(Point.BASE.multiply(stealthScalar));

// Convert to Solana public key
const stealthAddress = new PublicKey(stealthPoint.toRawBytes());`}
            language="typescript"
            title="Stealth Address Computation"
          />
        </div>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-[var(--color-text)] mb-2">5. Publish Announcement</h4>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-2">
            The ephemeral public key must be announced so the recipient can discover the payment:
          </p>
          <CodeBlock 
            code={`// Include ephemeral public key in transaction
const announcement = {
  ephemeralPublicKey: ephemeralPublic.toBase58(),
  stealthAddress: stealthAddress.toBase58()
};

// Store in transaction memo or dedicated announcement account`}
            language="typescript"
            title="Payment Announcement"
          />
        </div>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Recipient Flow: Scanning and Claiming</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Recipients scan for payments by monitoring announcements and testing whether they can generate the corresponding private key:
        </p>

        <CodeBlock 
          code={`async function scanForPayments(viewPrivate: Uint8Array, spendSeed: Uint8Array) {
  const announcements = await getRecentAnnouncements();
  const detectedPayments = [];

  for (const announcement of announcements) {
    // Recompute shared secret
    const ephemeralPublic = new PublicKey(announcement.ephemeralPublicKey);
    const ephemeralX25519 = ed25519ToX25519Public(ephemeralPublic.toBytes());
    const viewX25519 = ed25519ToX25519Private(viewPrivate);
    
    const sharedSecret = x25519(viewX25519, ephemeralX25519);
    
    // Derive scalar
    const stealthScalar = deriveStealthScalar(sharedSecret, 0);
    
    // Test if we can generate the stealth address
    const spendPublic = derivePublicKey(spendSeed);
    const computedAddress = spendPublic.add(Point.BASE.multiply(stealthScalar));
    
    if (computedAddress.equals(new PublicKey(announcement.stealthAddress))) {
      detectedPayments.push({
        address: announcement.stealthAddress,
        scalar: stealthScalar
      });
    }
  }
  
  return detectedPayments;
}`}
          language="typescript"
          title="Payment Scanning"
        />

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Security Properties</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          This protocol provides several critical security guarantees:
        </p>

        <ul className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4 pl-4">
          <li className="mb-2">• <strong>Forward Secrecy</strong>: Ephemeral keys are discarded after use, so compromising long-term keys doesn't reveal past payments</li>
          <li className="mb-2">• <strong>Unlinkability</strong>: Each stealth address appears random and cannot be linked to the meta-address or other stealth addresses</li>
          <li className="mb-2">• <strong>No Trusted Setup</strong>: The protocol requires no pre-shared secrets or trusted third parties</li>
          <li className="mb-2">• <strong>Quantum Resistance</strong>: While not quantum-proof, the protocol can be upgraded to post-quantum curves</li>
        </ul>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Performance Considerations</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Scanning performance scales linearly with the number of announcements. With optimizations like bloom filters and parallel processing, we achieve scanning rates of over 10,000 announcements per second on modern hardware. On-chain costs are minimal – adding stealth address derivation to a payment adds approximately 0.1ms of computation and 32 bytes of announcement data.
        </p>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          This technical foundation enables ZKIRA Pay to provide practical privacy at Solana scale, proving that cryptographic privacy and performance can coexist in production blockchain applications.
        </p>
      </div>
    )
  },
  {
    id: "building",
    title: "Building with ZKIRA: Developer Experience",
    date: "Feb 2026",
    category: "TUTORIAL",
    excerpt: "A walkthrough of integrating ZKIRA Pay into your application — from API keys to production deployment.",
    content: (
      <div className="prose prose-invert max-w-none">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Getting Started</h3>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          ZKIRA Pay offers three integration paths to fit different development needs. Whether you're building with any programming language, need fine-grained control with TypeScript, or want zero-code integration, we've got you covered.
        </p>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-[var(--color-text)] mb-2">Installation</h4>
          <CodeBlock 
            code={`# TypeScript SDK
npm install @zkira/sdk @solana/web3.js

# Or just use our REST API
curl https://api.zkira.io/v1/health`}
            language="bash"
            title="Quick Install"
          />
        </div>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-[var(--color-text)] mb-2">API Key Generation</h4>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-2">
            Generate your API key at app.zkira.io:
          </p>
          <CodeBlock 
            code={`# Environment setup
ZKIRA_API_KEY=zk_live_abc123...
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
ZKIRA_NETWORK=mainnet-beta`}
            language="bash"
            title=".env Configuration"
          />
        </div>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Integration Path 1: REST API</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Perfect for any programming language. Our REST API handles all the cryptographic complexity while giving you full control over the payment flow.
        </p>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-[var(--color-text)] mb-2">Creating a Payment Request</h4>
          <CodeBlock 
            code={`curl -X POST https://api.zkira.io/v1/payments \\
  -H "Authorization: Bearer zk_live_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 1000000,
    "token": "SOL",
    "recipient_meta_address": "zkira1abc...def",
    "memo": "Invoice #12345",
    "expires_at": "2026-02-01T00:00:00Z"
  }'

# Response
{
  "payment_id": "pay_xyz789",
  "stealth_address": "stealth1ghi...jkl",
  "amount": 1000000,
  "payment_url": "https://pay.zkira.io/pay_xyz789",
  "qr_code": "data:image/png;base64,iVBOR...",
  "expires_at": "2026-02-01T00:00:00Z"
}`}
            language="bash"
            title="Create Payment"
          />
        </div>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-[var(--color-text)] mb-2">Checking Payment Status</h4>
          <CodeBlock 
            code={`curl https://api.zkira.io/v1/payments/pay_xyz789 \\
  -H "Authorization: Bearer zk_live_abc123..."

# Response
{
  "payment_id": "pay_xyz789",
  "status": "completed",
  "transaction_signature": "4KJ2m8...",
  "confirmed_at": "2026-02-01T12:34:56Z",
  "amount_received": 1000000
}`}
            language="bash"
            title="Check Status"
          />
        </div>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Integration Path 2: TypeScript SDK</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          For developers who need full control and want to handle stealth address cryptography directly in their application.
        </p>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-[var(--color-text)] mb-2">SDK Initialization</h4>
          <CodeBlock 
            code={`import { ZkiraClient } from '@zkira/sdk';
import { Connection, clusterApiUrl } from '@solana/web3.js';

const connection = new Connection(clusterApiUrl('mainnet-beta'));
const zkira = new ZkiraClient({
  apiKey: process.env.ZKIRA_API_KEY!,
  connection,
  network: 'mainnet-beta'
});`}
            language="typescript"
            title="Initialize Client"
          />
        </div>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-[var(--color-text)] mb-2">Creating Payments</h4>
          <CodeBlock 
            code={`async function createPrivatePayment() {
  // Generate meta-address for recipient
  const recipientMeta = await zkira.generateMetaAddress();
  
  console.log('Share this meta-address:', recipientMeta.address);
  
  // Create payment to meta-address
  const payment = await zkira.createPayment({
    recipientMetaAddress: recipientMeta.address,
    amount: 1_000_000, // 1 SOL in lamports
    token: 'SOL',
    memo: 'Private payment via ZKIRA'
  });
  
  console.log('Payment URL:', payment.paymentUrl);
  console.log('Stealth address:', payment.stealthAddress);
  
  return payment;
}`}
            language="typescript"
            title="Create Payment"
          />
        </div>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-[var(--color-text)] mb-2">Handling Claims</h4>
          <CodeBlock 
            code={`async function claimPayments(metaAddress: MetaAddress) {
  // Scan for incoming payments
  const scanner = zkira.createScanner(metaAddress);
  const payments = await scanner.scan({
    fromSlot: 250_000_000, // Recent slot
    limit: 100
  });
  
  console.log(\`Found \${payments.length} payments\`);
  
  // Claim each payment
  for (const payment of payments) {
    if (payment.status === 'unclaimed') {
      const signature = await zkira.claimPayment({
        paymentId: payment.id,
        metaAddress: metaAddress,
        destinationAddress: myWallet.publicKey
      });
      
      console.log(\`Claimed payment: \${signature}\`);
    }
  }
}`}
            language="typescript"
            title="Claim Payments"
          />
        </div>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Integration Path 3: Embeddable Widget</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Zero-code integration for websites and React applications. Perfect for e-commerce, donations, or any site that needs to accept private payments.
        </p>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-[var(--color-text)] mb-2">HTML Integration</h4>
          <CodeBlock 
            code={`<!DOCTYPE html>
<html>
<head>
  <script src="https://widget.zkira.io/v1/zkira.js"></script>
</head>
<body>
  <div id="zkira-payment"></div>
  
  <script>
    window.ZkiraWidget.create({
      apiKey: 'zk_live_abc123...',
      amount: 1000000,
      token: 'SOL',
      recipientMetaAddress: 'zkira1abc...def',
      onPayment: (payment) => {
        console.log('Payment completed:', payment.signature);
      },
      onError: (error) => {
        console.error('Payment failed:', error);
      }
    });
  </script>
</body>
</html>`}
            language="html"
            title="HTML Widget"
          />
        </div>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-[var(--color-text)] mb-2">React Hook</h4>
          <CodeBlock 
            code={`import { useZkiraPay } from '@zkira/widget-react';

function PaymentButton() {
  const { createPayment, isLoading, error } = useZkiraPay({
    apiKey: process.env.NEXT_PUBLIC_ZKIRA_API_KEY!,
  });
  
  const handlePayment = async () => {
    const payment = await createPayment({
      amount: 1_000_000,
      token: 'SOL',
      recipientMetaAddress: 'zkira1abc...def',
      memo: 'React payment'
    });
    
    // Show payment UI
    window.open(payment.paymentUrl, '_blank');
  };
  
  return (
    <button 
      onClick={handlePayment}
      disabled={isLoading}
      className="bg-[#FF2828] text-white px-6 py-3"
    >
      {isLoading ? 'Creating...' : 'Pay Privately'}
    </button>
  );
}`}
            language="typescript"
            title="React Integration"
          />
        </div>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Error Handling Best Practices</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Robust error handling is crucial for production applications:
        </p>

        <CodeBlock 
          code={`try {
  const payment = await zkira.createPayment(paymentData);
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    // Handle wallet balance issues
    showError('Insufficient balance for payment');
  } else if (error.code === 'INVALID_META_ADDRESS') {
    // Handle malformed recipient address
    showError('Invalid recipient address');
  } else if (error.code === 'NETWORK_ERROR') {
    // Handle Solana network issues
    showError('Network congestion, please retry');
  } else {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
    showError('Payment failed, please try again');
  }
}`}
          language="typescript"
          title="Error Handling"
        />

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Testing and Deployment</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Always test on devnet before going live. Use our test meta-addresses and ensure your integration handles network switches correctly:
        </p>

        <CodeBlock 
          code={`// Environment-specific configuration
const config = {
  development: {
    apiUrl: 'https://api.devnet.zkira.io',
    network: 'devnet',
    testMetaAddress: 'zkira1test...'
  },
  production: {
    apiUrl: 'https://api.zkira.io',
    network: 'mainnet-beta'
  }
};

// Production checklist
// ✓ API keys secured in environment variables
// ✓ Webhook endpoints verified with HMAC
// ✓ Error monitoring configured
// ✓ Payment confirmations logged
// ✓ Fallback mechanisms for network issues`}
          language="typescript"
          title="Production Configuration"
        />

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          With these integration options, you can add private payments to any application in minutes. Start with the widget for rapid prototyping, then migrate to the SDK for production control, or use the REST API for maximum flexibility across any tech stack.
        </p>
      </div>
    )
  },
  {
    id: "roadmap",
    title: "ZKIRA Roadmap: What's Next",
    date: "Feb 2026",
    category: "ROADMAP",
    excerpt: "Our vision for the future of private payments — from cross-chain bridges to zero-knowledge proofs and beyond.",
    content: (
      <div className="prose prose-invert max-w-none">
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          ZKIRA Pay launched with core stealth address functionality, but this is just the beginning. Our roadmap balances immediate developer needs with long-term vision for blockchain privacy. Each phase builds on the previous foundation while maintaining backward compatibility and our commitment to practical, usable privacy.
        </p>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Phase 1: Foundation (Current)</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          We've established the core protocol infrastructure that makes private payments possible on Solana:
        </p>

        <ul className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4 pl-4">
          <li className="mb-2">• <strong>Stealth Address Protocol</strong>: Complete Ed25519-based implementation with meta-address generation and scanning</li>
          <li className="mb-2">• <strong>Payment Escrow</strong>: Conditional payments that release based on predefined criteria or external oracles</li>
          <li className="mb-2">• <strong>Multi-signature Support</strong>: Private payments requiring multiple parties to authorize transactions</li>
          <li className="mb-2">• <strong>Milestone Escrow</strong>: Progressive payments tied to project deliverables and verification</li>
          <li className="mb-2">• <strong>Developer Tools</strong>: REST API, TypeScript SDK, and embeddable widget for rapid integration</li>
        </ul>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          This foundation provides everything developers need to add private payments to their applications today. Over 200 projects are already integrating ZKIRA Pay across DeFi protocols, marketplaces, and Web3 games.
        </p>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Phase 2: Enhanced Privacy (Q2 2026)</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          While stealth addresses hide sender-recipient relationships, transaction amounts remain visible. Phase 2 introduces zero-knowledge proofs to provide complete transaction privacy:
        </p>

        <ul className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4 pl-4">
          <li className="mb-2">• <strong>Amount Hiding</strong>: Zero-knowledge range proofs that hide payment amounts while proving they're positive and within valid ranges</li>
          <li className="mb-2">• <strong>Groth16 Circuits</strong>: Optimized proving circuits for claim verification without revealing stealth address derivation secrets</li>
          <li className="mb-2">• <strong>Confidential Balances</strong>: Extension to hide accumulated balances in stealth addresses using homomorphic commitments</li>
          <li className="mb-2">• <strong>Batched Claims</strong>: Zero-knowledge proofs for claiming multiple payments simultaneously without revealing individual amounts</li>
        </ul>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          These enhancements will be optional – basic stealth addresses will continue working as before. Developers can choose their privacy level based on application requirements and computational constraints.
        </p>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Phase 3: Cross-Chain Expansion (Q3 2026)</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Privacy shouldn't be confined to a single blockchain. Phase 3 extends ZKIRA Pay across the multi-chain ecosystem:
        </p>

        <ul className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4 pl-4">
          <li className="mb-2">• <strong>Ethereum L2 Integration</strong>: Native stealth address support on Arbitrum, Optimism, and Polygon with shared meta-address format</li>
          <li className="mb-2">• <strong>Cross-Chain Bridges</strong>: Private transfers between Solana and Ethereum ecosystems using atomic swaps and stealth addresses</li>
          <li className="mb-2">• <strong>Universal Meta-Addresses</strong>: Single meta-address that works across multiple chains, enabling unified private payment identity</li>
          <li className="mb-2">• <strong>Interchain Scanning</strong>: Unified SDK that scans for payments across all supported networks from a single interface</li>
        </ul>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Cross-chain functionality opens up new use cases like private DeFi arbitrage, confidential cross-chain DAOs, and unified privacy for multi-chain applications. We're partnering with leading bridge protocols to ensure seamless, secure transfers.
        </p>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Phase 4: Enterprise Ready (Q4 2026)</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Enterprise adoption requires balancing privacy with compliance. Phase 4 introduces optional transparency features for regulated use cases:
        </p>

        <ul className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4 pl-4">
          <li className="mb-2">• <strong>Selective Disclosure</strong>: Recipients can generate view keys that reveal specific payments to auditors or regulators without compromising overall privacy</li>
          <li className="mb-2">• <strong>Compliance Modes</strong>: Optional KYC integration that maintains privacy while satisfying regulatory requirements for covered transactions</li>
          <li className="mb-2">• <strong>Audit Trails</strong>: Cryptographic proof systems that allow businesses to demonstrate compliance without exposing private data</li>
          <li className="mb-2">• <strong>Enterprise API</strong>: Advanced features for high-volume applications including batch processing, priority processing, and dedicated infrastructure</li>
        </ul>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          These compliance tools are entirely optional and work alongside existing privacy features. Businesses can choose their compliance level while maintaining user privacy for routine transactions.
        </p>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Beyond 2026: Decentralized Future</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Long-term, ZKIRA Pay will transition from a centralized service to a fully decentralized protocol:
        </p>

        <ul className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4 pl-4">
          <li className="mb-2">• <strong>Decentralized Relayer Network</strong>: Community-operated nodes that handle payment processing and scanning services</li>
          <li className="mb-2">• <strong>Governance Token</strong>: ZKIRA token for protocol governance, staking, and incentivizing network participants</li>
          <li className="mb-2">• <strong>Protocol Upgrades</strong>: Community-driven improvements to stealth address algorithms, cryptographic primitives, and privacy features</li>
          <li className="mb-2">• <strong>Open Ecosystem</strong>: Third-party tools, wallets, and integrations built on the open ZKIRA protocol</li>
        </ul>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mt-6 mb-3">Open Source Commitment</h3>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          Privacy infrastructure should be transparent and auditable. All ZKIRA Pay code is MIT licensed and available on GitHub. Our cryptographic implementations undergo regular security audits, and we welcome community contributions at every level.
        </p>

        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
          From the foundational stealth address protocol to advanced zero-knowledge features, we're committed to building privacy tools that actually work. Not theoretical privacy that might work someday – practical privacy that developers can deploy and users can trust today.
        </p>

        <blockquote className="border-l-2 border-[#FF2828] pl-4 italic text-[var(--color-text-secondary)] text-sm leading-relaxed mt-6">
          "We're building the privacy layer that Solana deserves."
        </blockquote>
      </div>
    )
  }
];

export default function BlogPage() {
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  const selectedPost = selectedArticle 
    ? blogPosts.find(post => post.id === selectedArticle)
    : null;

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader 
        title="Blog"
        description="Technical deep-dives, protocol updates, and privacy research"
      />

      {selectedPost ? (
        // Article View
        <div>
          <button 
            onClick={() => setSelectedArticle(null)}
            className="text-[13px] text-[var(--color-muted)] hover:text-white transition-colors mb-6 flex items-center gap-2"
          >
            ← Back to all posts
          </button>
          
          <article className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6">
            <div className="mb-6">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#FF2828] font-[family-name:var(--font-mono)]">
                {selectedPost.category}
              </span>
              <div className="flex items-center gap-2 mt-1 mb-3">
                <span className="text-[11px] text-[var(--color-muted)] font-[family-name:var(--font-mono)]">
                  {selectedPost.date}
                </span>
              </div>
              <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-4">
                {selectedPost.title}
              </h1>
            </div>
            
            {selectedPost.content}
          </article>
        </div>
      ) : (
        // Blog Index View
        <div className="space-y-4">
          {blogPosts.map((post, index) => (
            <article
              key={post.id}
              className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 cursor-pointer hover:border-[var(--border-subtle-hover)] transition-all"
              style={{ 
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` 
              }}
              onClick={() => setSelectedArticle(post.id)}
            >
              <div className="mb-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#FF2828] font-[family-name:var(--font-mono)]">
                  {post.category}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] text-[var(--color-muted)] font-[family-name:var(--font-mono)]">
                  {post.date}
                </span>
              </div>
              
              <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-2">
                {post.title}
              </h2>
              
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                {post.excerpt}
              </p>
              
              <span className="text-[13px] text-[#FF2828] hover:underline">
                Read more →
              </span>
            </article>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}