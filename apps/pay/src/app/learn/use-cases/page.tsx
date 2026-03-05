'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/PageHeader';
import { CodeBlock } from '@/components/learn/CodeBlock';

export default function UseCasesPage() {
  const t = useTranslations('useCasesPage');
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      {/* Use Case 1: Casino/iGaming */}
      <div id="casino" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '100ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('casinoTag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('casinoTitle')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('casinoDesc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorksTitle')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('casinoStep1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('casinoStep2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('casinoStep3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('casinoStep4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('casinoStep5')}</p>
          </div>
        </div>

        <CodeBlock
          language="typescript"
          title="Casino Gateway Integration"
          code={`import { GatewayClient } from '@zkira/gateway-client';

// Initialize casino gateway client
const gateway = new GatewayClient({
  baseUrl: 'https://api.zkira.xyz',
  apiKey: 'your_merchant_api_key'
});

// Create deposit session for player
const session = await gateway.createSession({
  playerId: 'player_123',
  amount: '100',
  token: 'USDC',
  metadata: {
    gameId: 'poker_table_1',
    tableId: 'high_stakes'
  }
});

console.log('Deposit URL:', session.depositUrl);
// Player uses this URL to complete deposit via ZKIRA widget

// Process withdrawal request
const withdrawal = await gateway.createWithdrawal({
  playerId: 'player_123',
  amount: '75',
  token: 'USDC',
  recipientAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
});

// Approve withdrawal after verification
await gateway.approveWithdrawal(withdrawal.id);

// Get volume reports
const report = await gateway.getVolumeReport('24h');
console.log('Daily volume:', report.totalVolume);`}
        />
      </div>

      {/* Use Case 2: Private Payroll */}
      <div id="payroll" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '200ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('payrollTag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('payrollTitle')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('payrollDesc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorksTitle')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('payrollStep1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('payrollStep2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('payrollStep3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('payrollStep4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('payrollStep5')}</p>
          </div>
        </div>

        <CodeBlock
          language="typescript"
          title="Multi-Chain Batch Payroll Payment"
          code={`import { ZkiraClient } from '@zkira/sdk';
import { Connection, PublicKey } from '@solana/web3.js';

// Initialize client with multi-chain support
const client = new ZkiraClient(connection, {
  supportedChains: ['solana', 'arbitrum', 'tron']
});

// Create batch payroll payment
const employees = [
  { metaAddress: 'meta1...', amount: 5000_000000, chain: 'solana' }, // $5,000 USDC on Solana
  { metaAddress: 'meta2...', amount: 7500_000000, chain: 'arbitrum' }, // $7,500 USDC on Arbitrum
  { metaAddress: 'meta3...', amount: 4200_000000, chain: 'tron' }, // $4,200 USDT on TRON
];

const batchPayment = await client.createBatchPayment({
  payments: employees.map(emp => ({
    recipient: emp.metaAddress,
    amount: emp.amount,
    token: emp.chain === 'tron' ? 'USDT' : 'USDC',
    chain: emp.chain,
  })),
  payer: companyWallet.publicKey,
});

console.log('Multi-chain payroll distributed:', batchPayment.signature);`}
        />
      </div>

      {/* Use Case 3: E-commerce Integration */}
      <div id="ecommerce" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '300ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('ecommerceTag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('ecommerceTitle')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('ecommerceDesc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorksTitle')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('ecommerceStep1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('ecommerceStep2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('ecommerceStep3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('ecommerceStep4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('ecommerceStep5')}</p>
          </div>
        </div>

        <CodeBlock
          language="typescript"
          title="Multi-Chain Widget Integration"
          code={`import { useZkiraPay } from '@zkira/widget';

function CheckoutButton({ amount, description }: { 
  amount: number; 
  description: string; 
}) {
  const { createPayment, status, error } = useZkiraPay({
    apiUrl: 'https://api.zkira.xyz',
    apiKey: process.env.NEXT_PUBLIC_ZKIRA_KEY,
    merchantAddress: process.env.NEXT_PUBLIC_MERCHANT_META_ADDRESS,
    supportedChains: ['solana', 'arbitrum', 'tron'], // Multi-chain support
    supportedTokens: ['USDC', 'USDT'], // Cross-chain tokens
  });

  const handlePayment = async () => {
    const payment = await createPayment({ 
      amount, 
      description,
      successUrl: '/success',
      cancelUrl: '/checkout',
      // Widget auto-detects user's preferred chain
    });
    
    if (payment.success) {
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

      {/* Use Case 4: Anonymous Transfers */}
      <div id="anonymous-transfers" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '400ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('anonymousTransfersTag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('anonymousTransfersTitle')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('anonymousTransfersDesc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorksTitle')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('anonymousTransfersStep1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('anonymousTransfersStep2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('anonymousTransfersStep3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('anonymousTransfersStep4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('anonymousTransfersStep5')}</p>
          </div>
        </div>

        <CodeBlock
          language="typescript"
          title="Cross-Chain Anonymous Transfer"
          code={`import { ShieldedPoolClient, createPrivateTransport } from '@zkira/sdk';

// Use privacy transport to hide IP address
const transport = await createPrivateTransport();

// Initialize for cross-chain transfer (Solana -> Arbitrum)
const solanaPool = new ShieldedPoolClient(solanaConnection, wallet, {
  programId: SHIELDED_POOL_PROGRAM_ID,
  tokenMint: USDC_MINT,
  denomination: 10_000_000, // 10 USDC fixed denomination
  chain: 'solana'
}, { transport });

const arbitrumPool = new ShieldedPoolClient(arbitrumConnection, wallet, {
  programId: SHIELDED_POOL_PROGRAM_ID,
  tokenMint: USDC_MINT,
  denomination: 10_000_000,
  chain: 'arbitrum'
}, { transport });

// Split $1,000 into 100 shielded deposits on Solana
const notes: string[] = [];
for (let i = 0; i < 100; i++) {
  const { note } = await solanaPool.deposit(USDC_MINT);
  notes.push(note);
}

// After 6+ hour soak time, withdraw to Arbitrum address
for (const note of notes) {
  await arbitrumPool.withdraw(note, freshArbitrumAddress);
  // Cross-chain privacy bridge handles the transfer
}`}
        />
      </div>

      {/* Use Case 5: Anonymous Donations */}
      <div id="donations" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '500ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('donationsTag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('donationsTitle')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('donationsDesc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorksTitle')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('donationsStep1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('donationsStep2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('donationsStep3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('donationsStep4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('donationsStep5')}</p>
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

      {/* Use Case 6: Escrow Services */}
      <div id="escrow" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '600ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('escrowTag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('escrowTitle')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('escrowDesc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorksTitle')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('escrowStep1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('escrowStep2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('escrowStep3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('escrowStep4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('escrowStep5')}</p>
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
  deadline: new Date('2026-06-30'),
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

      {/* Use Case 7: Multi-sig Treasury */}
      <div id="treasury" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '700ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('treasuryTag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('treasuryTitle')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('treasuryDesc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorksTitle')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('treasuryStep1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('treasuryStep2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('treasuryStep3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('treasuryStep4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('treasuryStep5')}</p>
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

      {/* Use Case 8: Payment Links */}
      <div id="payment-links" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6 animate-entrance" style={{ animationDelay: '800ms' }}>
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFFFFF] font-[family-name:var(--font-mono)]">{t('paymentLinksTag')}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mt-2 mb-3">{t('paymentLinksTitle')}</h2>
        
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('paymentLinksDesc')}
        </p>

        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">{t('howItWorksTitle')}</h3>
        <div className="mb-6">
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">01</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('paymentLinksStep1')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">02</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('paymentLinksStep2')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">03</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('paymentLinksStep3')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">04</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('paymentLinksStep4')}</p>
          </div>
          <div className="flex gap-3 mb-3">
            <span className="text-[#FFFFFF] font-bold font-[family-name:var(--font-mono)] text-sm shrink-0">05</span>
            <p className="text-sm text-[var(--color-text-secondary)]">{t('paymentLinksStep5')}</p>
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
  description: 'Web Development Services - March 2026',
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
    </div>
  );
}