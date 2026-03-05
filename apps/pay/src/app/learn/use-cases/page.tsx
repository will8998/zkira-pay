'use client';

import { PageHeader } from '@/components/PageHeader';
import { CodeBlock } from '@/components/learn/CodeBlock';

export default function UseCasesPage() {
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        title="Use Cases"
        description="Real-world applications for private payments on Solana"
      />

      {/* Use Case 1: Private Payroll */}
      <div id="payroll" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '100ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">ENTERPRISE</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">Private Payroll</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          Companies can pay employees without revealing individual salaries on-chain. Each payment goes to a unique stealth address, so even if someone monitors the company's wallet, they cannot link payments to specific employees or determine compensation amounts. This protects employee privacy while maintaining full compliance with labor laws and accounting requirements. Supports batch processing for multiple employees in a single transaction, reducing gas costs and administrative overhead. Perfect for startups, remote teams, and any organization prioritizing financial privacy.
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">How it works</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Company registers meta-addresses for each employee during onboarding</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">HR initiates batch payment with individual amounts for each employee</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Each payment creates a unique stealth escrow with recipient-specific keys</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Employees scan and claim using their view keys from wallet or mobile app</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">No on-chain link between payments and recipients preserves complete privacy</p>
          </div>
        </div>

        <CodeBlock
          language="typescript"
          title="Batch Payroll Payment"
          code={`import { ZkiraClient } from '@zkira/sdk';
import { Connection, PublicKey } from '@solana/web3.js';

// Initialize client
const client = new ZkiraClient(connection);

// Create batch payroll payment
const employees = [
  { metaAddress: 'meta1...', amount: 5000_000000 }, // $5,000 USDC
  { metaAddress: 'meta2...', amount: 7500_000000 }, // $7,500 USDC
  { metaAddress: 'meta3...', amount: 4200_000000 }, // $4,200 USDC
];

const batchPayment = await client.createBatchPayment({
  payments: employees.map(emp => ({
    recipient: emp.metaAddress,
    amount: emp.amount,
    token: 'USDC',
  })),
  payer: companyWallet.publicKey,
});

console.log('Payroll distributed:', batchPayment.signature);`}
        />
      </div>

      {/* Use Case 2: Anonymous Donations */}
      <div id="donations" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '200ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">SOCIAL IMPACT</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">Anonymous Donations</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          Non-profits and charities can accept donations without creating a permanent on-chain link between donors and the organization. Donors get cryptographic proof of their contribution without public exposure, protecting them from unwanted solicitation or political targeting. Especially valuable in politically sensitive contexts, whistleblower support, or when donor privacy is legally required. Organizations can still track total donations for transparency reports while preserving individual donor anonymity. Supports recurring donations and automatic tax receipt generation.
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">How it works</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Organization publishes their meta-address on website and donation pages</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Donor creates stealth payment to the meta-address with chosen amount</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Organization scans for incoming payments using their view key</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Donor receives claim receipt and proof for tax deduction purposes</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">No public ledger link between donor and organization preserves anonymity</p>
          </div>
        </div>

        <CodeBlock
          language="typescript"
          title="Anonymous Donation"
          code={`import { ZkiraClient } from '@zkira/sdk';

const client = new ZkiraClient(connection);

// Create anonymous donation
const donation = await client.createPayment({
  recipient: 'charity_meta_address_here',
  amount: 100_000000, // $100 USDC
  token: 'USDC',
  memo: 'Supporting clean water initiative', // Optional private memo
});

// Generate proof for donor records
const proof = await client.generateDonationProof({
  payment: donation,
  recipientName: 'Clean Water Foundation',
  taxId: '12-3456789',
});

console.log('Anonymous donation sent:', donation.signature);
console.log('Tax receipt proof:', proof.receiptHash);`}
        />
      </div>

      {/* Use Case 3: Escrow Services */}
      <div id="escrow" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '300ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">FREELANCE</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">Escrow Services</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          Milestone-based escrow for freelance and contract work eliminates payment disputes and builds trust between clients and contractors. Clients lock funds that release incrementally as contractors complete agreed milestones, providing security for both parties. The contractor knows funds exist and are guaranteed upon completion, while the client knows they only release for verified work delivery. Built directly on Solana for instant settlement without traditional escrow fees. Supports complex milestone structures, dispute resolution, and partial releases. Perfect for development projects, design work, consulting, and any service-based contracts.
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">How it works</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Client creates milestone escrow with defined deliverables and payment amounts</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Contractor completes first milestone and submits deliverables</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Client reviews work and approves milestone release through the platform</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Funds for that milestone automatically transfer to contractor's stealth address</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Process repeats for each milestone until project completion</p>
          </div>
        </div>

        <CodeBlock
          language="typescript"
          title="Milestone Escrow Creation"
          code={`import { ZkiraClient } from '@zkira/sdk';

const client = new ZkiraClient(connection);

// Create milestone-based escrow
const escrow = await client.createMilestoneEscrow({
  client: clientWallet.publicKey,
  contractor: 'contractor_meta_address',
  milestones: [
    { description: 'UI/UX Design', amount: 2000_000000 }, // $2,000 USDC
    { description: 'Frontend Development', amount: 3500_000000 }, // $3,500 USDC
    { description: 'Backend Integration', amount: 2500_000000 }, // $2,500 USDC
    { description: 'Testing & Deployment', amount: 2000_000000 }, // $2,000 USDC
  ],
  token: 'USDC',
  deadline: new Date('2024-06-30'),
});

// Approve milestone completion
await client.approveMilestone({
  escrow: escrow.address,
  milestoneIndex: 0,
  approver: clientWallet,
});

console.log('Milestone escrow created:', escrow.address);`}
        />
      </div>

      {/* Use Case 4: Multi-sig Treasury */}
      <div id="treasury" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '400ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">DAO / TEAM</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">Multi-sig Treasury</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          Shared treasury management requiring multiple approvals before any payment executes. Teams, DAOs, and partnerships can set M-of-N approval thresholds — for example, requiring 3-of-5 team members to approve any payment over $1,000. Combined with stealth addresses, even approved payments remain private from external observers. Supports complex approval workflows, spending limits, and time-locked releases. Perfect for startup teams managing runway, DAO treasuries distributing grants, investment partnerships, or any shared financial responsibility requiring transparency among stakeholders while maintaining external privacy.
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">How it works</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Create multi-sig escrow with authorized signers and approval threshold</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Any authorized signer proposes a payment with justification</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Required number of signers review and approve the proposed payment</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Once approval threshold is met, payment executes automatically</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">All approvals recorded on-chain for internal auditability</p>
          </div>
        </div>

        <CodeBlock
          language="typescript"
          title="Multi-sig Treasury Setup"
          code={`import { ZkiraClient } from '@zkira/sdk';

const client = new ZkiraClient(connection);

// Create multi-sig escrow
const multisig = await client.createMultisigEscrow({
  signers: [
    founderWallet.publicKey,
    ctoWallet.publicKey, 
    cfoWallet.publicKey,
    advisorWallet.publicKey,
    investorWallet.publicKey,
  ],
  threshold: 3, // Require 3 out of 5 signatures
  spendingLimits: [
    { amount: 10000_000000, timeframe: '30days' }, // $10k/month limit
    { amount: 50000_000000, timeframe: 'quarter' }, // $50k/quarter limit
  ],
});

// Propose payment
const proposal = await client.proposePayment({
  multisig: multisig.address,
  recipient: 'contractor_meta_address',
  amount: 15000_000000, // $15,000 USDC
  justification: 'Q1 development contractor payment',
  proposer: founderWallet,
});

// Approve payment
await client.approvePayment({
  proposal: proposal.id,
  signer: ctoWallet,
});`}
        />
      </div>

      {/* Use Case 5: Payment Links */}
      <div id="payment-links" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '500ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">INVOICING</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">Payment Links</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          Generate shareable payment links for invoicing clients, collecting payments from customers, or requesting funds from anyone. Each link creates a unique escrow — the sender deposits funds, and the recipient claims with a secret embedded in the URL. Perfect for freelancers, small businesses, content creators, and anyone needing simple payment collection. Links can have expiry dates, custom messages, and support any SPL token. No account creation required for payers, making it friction-free for customers. Provides immediate confirmation and receipt generation for both parties.
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">How it works</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Create payment link with amount, token, description, and expiry date</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Share the generated claim URL via email, message, or embed in invoice</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Payer opens link, connects wallet, and reviews payment details</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Payment transaction executes and escrow locks funds</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Recipient claims funds to their stealth address using claim secret</p>
          </div>
        </div>

        <CodeBlock
          language="typescript"
          title="Payment Link Creation"
          code={`import { ZkiraClient } from '@zkira/sdk';

const client = new ZkiraClient(connection);

// Create payment link
const paymentLink = await client.createPaymentLink({
  amount: 2500_000000, // $2,500 USDC
  token: 'USDC',
  description: 'Web Development Services - March 2024',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  recipient: recipientMetaAddress,
});

console.log('Share this link:', paymentLink.url);
// Output: https://zkira.xyz/pay/claim?t=abc123...

// Check payment status
const status = await client.getPaymentStatus({
  paymentId: paymentLink.id,
});

if (status === 'completed') {
  console.log('Payment received! Claiming funds...');
  
  const claim = await client.claimStealth({
    escrowAddress: paymentLink.escrowAddress,
  });
}`}
        />
      </div>

      {/* Use Case 6: E-commerce Integration */}
      <div id="ecommerce" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '600ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">COMMERCE</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">E-commerce Integration</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          Online stores can accept private payments using the ZKIRA widget with minimal integration effort. Drop a single script tag into your HTML or use the React hook for programmatic integration. Customers pay with any supported SPL token, and the merchant receives funds without exposing transaction details to competitors or market analysts. Supports subscription payments, partial payments, refunds, and complex checkout flows. Widget handles wallet connection, network switching, and transaction signing automatically. Perfect for SaaS products, digital goods, physical products, and any online business accepting crypto payments.
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">How it works</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Install widget script tag or React component in your checkout flow</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Configure payment amount, accepted tokens, and completion callback</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Customer clicks pay button and widget handles wallet connection</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Payment processes through stealth escrow for privacy</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Merchant receives webhook confirmation and can fulfill order</p>
          </div>
        </div>

        <CodeBlock
          language="html"
          title="HTML Widget Integration"
          code={`<!-- HTML Embed -->
<script src="https://cdn.zkira.xyz/widget.js"></script>
<zkira-pay 
  amount="49.99" 
  token="USDC"
  description="Premium Subscription - Monthly"
  merchant-address="merchant_meta_address_here"
  callback="https://mystore.com/webhooks/payment"
></zkira-pay>`}
        />

        <div className="mt-4">
          <CodeBlock
            language="typescript"
            title="React Hook Integration"
            code={`import { useZkiraPay } from '@zkira/widget';

function CheckoutButton({ amount, description }: { 
  amount: number; 
  description: string; 
}) {
  const { createPayment, status, error } = useZkiraPay({
    apiUrl: 'https://api.zkira.xyz',
    apiKey: process.env.NEXT_PUBLIC_ZKIRA_KEY,
    merchantAddress: process.env.NEXT_PUBLIC_MERCHANT_META_ADDRESS,
  });

  const handlePayment = async () => {
    const payment = await createPayment({ 
      amount, 
      token: 'USDC',
      description,
      successUrl: '/success',
      cancelUrl: '/checkout',
    });
    
    if (payment.success) {
      // Redirect to success page
      window.location.href = '/order-confirmation';
    }
  };

  return (
    <button 
      onClick={handlePayment}
      disabled={status === 'pending'}
      className="bg-[#FFFFFF] text-black px-6 py-3 rounded-none font-semibold"
    >
      {status === 'pending' ? 'Processing...' : \`Pay $\${amount}\`}
    </button>
  );
}`}
          />
        </div>
      </div>

      {/* Use Case 7: Anonymous Large Transfers */}
      <div id="anonymous-transfers" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '700ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">PRIVACY</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">Anonymous Large Transfers</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          Use the shielded pool for large anonymous transfers by splitting into fixed-denomination deposits, waiting for soak time, then withdrawing to a fresh address. This defeats Arkham Intelligence and on-chain forensics by breaking the transaction graph. Perfect for high-net-worth individuals, institutional transfers, or anyone needing to move significant funds without revealing the source or destination. The protocol automatically generates decoy deposits during soak time, creating plausible deniability. Supports any amount by using multiple fixed denominations and provides cryptographic guarantees of anonymity.
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">How it works</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Connect wallet and initialize the shielded pool client</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Split transfer into fixed 10 USDC deposits, each creating an encrypted note</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Wait for 6-hour soak time — protocol generates decoy deposits automatically</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Generate ZK proof and submit private withdrawal to a fresh recipient address</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Funds arrive within ~1 hour via batched processing — no on-chain link to original deposits</p>
          </div>
        </div>

        <CodeBlock
          language="typescript"
          title="Anonymous Large Transfer"
          code={`import { ShieldedPoolClient, createPrivateTransport } from '@zkira/sdk';

// Use privacy transport to hide IP address
const transport = await createPrivateTransport();

const poolClient = new ShieldedPoolClient(connection, wallet, {
  programId: SHIELDED_POOL_PROGRAM_ID,
  tokenMint: USDC_MINT,
  denomination: 10_000_000, // 10 USDC fixed denomination
}, { transport });

// Split $1,000 into 100 shielded deposits
const notes: string[] = [];
for (let i = 0; i < 100; i++) {
  const { note } = await poolClient.deposit(USDC_MINT);
  notes.push(note);
  // Wait between deposits to avoid timing correlation
}

// After 6+ hour soak time, withdraw to fresh address
for (const note of notes) {
  await poolClient.withdraw(note, freshRecipientAddress);
  // Each withdrawal queued — processed in ~1 hour batches
}`}
        />
      </div>

      {/* Use Case 8: DAO Treasury Privacy */}
      <div id="dao-treasury" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '800ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">GOVERNANCE</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">DAO Treasury Privacy</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          DAOs can use shielded pool + stealth addresses together for truly private treasury operations. This prevents competitors from tracking treasury movements, grant distributions, and strategic fund allocation. Essential for DAOs operating in competitive markets where treasury transparency could reveal strategic plans, upcoming partnerships, or investment strategies. Grant recipients receive funds through stealth addresses, protecting their privacy while maintaining DAO accountability through internal records. Supports complex governance workflows and multi-sig approvals while keeping external observers in the dark.
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">How it works</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">DAO initializes shielded pool with multi-sig authority</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Treasury deposits are split into fixed denominations through the shielded pool</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Grant recipients receive encrypted notes via secure channels</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">Recipients generate ZK proofs and withdraw to their stealth addresses</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">No on-chain link between DAO treasury and grant recipients — competitors cannot track fund flows</p>
          </div>
        </div>

        <CodeBlock
          language="typescript"
          title="DAO Treasury Privacy"
          code={`import { ShieldedPoolClient, ZkiraClient } from '@zkira/sdk';

const poolClient = new ShieldedPoolClient(connection, daoWallet, {
  programId: SHIELDED_POOL_PROGRAM_ID,
  tokenMint: USDC_MINT,
  denomination: 10_000_000,
});

// DAO deposits treasury funds into shielded pool
const grantNotes: string[] = [];
for (let i = 0; i < 50; i++) { // $500 grant
  const { note } = await poolClient.deposit(USDC_MINT);
  grantNotes.push(note);
}

// Securely share notes with grant recipient
// Recipient withdraws to their stealth address:
const recipientPool = new ShieldedPoolClient(
  connection, recipientWallet, poolConfig
);

for (const note of grantNotes) {
  await recipientPool.withdraw(note, recipientStealthAddress);
}`}
        />
      </div>
    </div>
  );
}