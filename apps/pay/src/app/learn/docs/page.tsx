'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/PageHeader';
import { CodeBlock } from '@/components/learn/CodeBlock';

export default function DocsPage() {
  const t = useTranslations('docsPage');
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader 
        title={t('title')} 
        description={t('description')} 
      />

      {/* Section 1: Getting Started */}
      <section id="getting-started" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('gettingStarted_title')}</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('gettingStarted_whatIs_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('gettingStarted_whatIs_paragraph1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('gettingStarted_whatIs_paragraph2')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('gettingStarted_keyFeatures_title')}</h3>
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <ul className="space-y-2">
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('gettingStarted_feature1_title')}</strong>: {t('gettingStarted_feature1_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('gettingStarted_feature2_title')}</strong>: {t('gettingStarted_feature2_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('gettingStarted_feature3_title')}</strong>: {t('gettingStarted_feature3_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('gettingStarted_feature4_title')}</strong>: {t('gettingStarted_feature4_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('gettingStarted_feature5_title')}</strong>: {t('gettingStarted_feature5_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('gettingStarted_feature6_title')}</strong>: {t('gettingStarted_feature6_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('gettingStarted_feature7_title')}</strong>: {t('gettingStarted_feature7_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('gettingStarted_feature8_title')}</strong>: {t('gettingStarted_feature8_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('gettingStarted_feature9_title')}</strong>: {t('gettingStarted_feature9_desc')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('gettingStarted_howItWorks_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('gettingStarted_howItWorks_paragraph1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('gettingStarted_howItWorks_paragraph2')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('gettingStarted_multiChain_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('gettingStarted_multiChain_desc')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('gettingStarted_prerequisites_title')}</h3>
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <ul className="space-y-2">
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span>{t('gettingStarted_prerequisite1')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span>{t('gettingStarted_prerequisite2')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span>{t('gettingStarted_prerequisite3')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span>{t('gettingStarted_prerequisite4')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('gettingStarted_quickSetup_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('gettingStarted_quickSetup_desc')}
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
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('stealthAddresses_title')}</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('stealthAddresses_understanding_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('stealthAddresses_understanding_paragraph1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('stealthAddresses_understanding_paragraph2')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('stealthAddresses_metaAddress_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('stealthAddresses_metaAddress_paragraph1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('stealthAddresses_metaAddress_paragraph2')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('stealthAddresses_derivation_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('stealthAddresses_derivation_paragraph1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('stealthAddresses_derivation_paragraph2')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('stealthAddresses_derivation_paragraph3')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('stealthAddresses_scanning_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('stealthAddresses_scanning_paragraph1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('stealthAddresses_scanning_paragraph2')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('stealthAddresses_claiming_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('stealthAddresses_claiming_paragraph1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('stealthAddresses_claiming_paragraph2')}
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Payment Flow */}
      <section id="payment-flow" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('paymentFlow_title')}</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('paymentFlow_creating_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('paymentFlow_creating_paragraph1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('paymentFlow_creating_paragraph2')}
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
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('paymentFlow_linkGeneration_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('paymentFlow_linkGeneration_paragraph1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('paymentFlow_linkGeneration_paragraph2')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('paymentFlow_claiming_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('paymentFlow_claiming_paragraph1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('paymentFlow_claiming_paragraph2')}
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
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('paymentFlow_refunding_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('paymentFlow_refunding_paragraph1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('paymentFlow_refunding_paragraph2')}
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
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('paymentFlow_states_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('paymentFlow_states_desc')}
            </p>
            
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-hover)]">
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">{t('paymentFlow_states_table_state')}</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">{t('paymentFlow_states_table_description')}</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">{t('paymentFlow_states_table_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('paymentFlow_states_created')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('paymentFlow_states_created_desc')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('paymentFlow_states_created_actions')}</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('paymentFlow_states_claimed')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('paymentFlow_states_claimed_desc')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('paymentFlow_states_claimed_actions')}</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('paymentFlow_states_expired')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('paymentFlow_states_expired_desc')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('paymentFlow_states_expired_actions')}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('paymentFlow_states_refunded')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('paymentFlow_states_refunded_desc')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('paymentFlow_states_refunded_actions')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Casino Gateway */}
      <section id="casino-gateway" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('casinoGateway_title')}</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('casinoGateway_overview_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('casinoGateway_overview_paragraph1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('casinoGateway_overview_paragraph2')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('casinoGateway_depositFlow_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('casinoGateway_depositFlow_desc')}
            </p>
            
            <CodeBlock 
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
// Player uses this URL to complete deposit via ZKIRA widget`}
              language="typescript"
              title="Deposit Session Creation"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('casinoGateway_withdrawalFlow_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('casinoGateway_withdrawalFlow_desc')}
            </p>
            
            <CodeBlock 
              code={`// Process withdrawal request
const withdrawal = await gateway.createWithdrawal({
  playerId: 'player_123',
  amount: '75',
  token: 'USDC',
  recipientAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
});

// Approve withdrawal after verification
await gateway.approveWithdrawal(withdrawal.id);

// Player-initiated withdrawal via widget
const playerWithdrawal = await gateway.createPlayerWithdrawal({
  playerId: 'player_123',
  amount: '50',
  token: 'USDC'
});

console.log('Withdrawal widget URL:', playerWithdrawal.widgetUrl);`}
              language="typescript"
              title="Withdrawal Processing"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('casinoGateway_disputeResolution_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('casinoGateway_disputeResolution_desc')}
            </p>
            
            <CodeBlock 
              code={`// Create dispute
const dispute = await gateway.createDispute({
  transactionId: 'tx_abc123',
  playerId: 'player_123',
  reason: 'unauthorized_withdrawal',
  description: 'Player claims they did not initiate this withdrawal'
});

// Resolve dispute
await gateway.resolveDispute({
  disputeId: dispute.id,
  resolution: 'refund_player',
  notes: 'Investigation confirmed unauthorized access'
});`}
              language="typescript"
              title="Dispute Resolution"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('casinoGateway_poolManagement_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('casinoGateway_poolManagement_desc')}
            </p>
            
            <CodeBlock 
              code={`// Create liquidity pool
const pool = await gateway.createPool({
  token: 'USDC',
  initialLiquidity: '10000',
  minBalance: '1000',
  maxBalance: '50000'
});

// Monitor pool status
const poolStatus = await gateway.getPoolStatus(pool.id);
console.log('Pool balance:', poolStatus.currentBalance);
console.log('Pool utilization:', poolStatus.utilizationRate);`}
              language="typescript"
              title="Pool Management"
            />
          </div>
        </div>
      </section>

      {/* Section 5: Merchant Dashboard */}
      <section id="merchant-dashboard" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('merchantDashboard_title')}</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('merchantDashboard_access_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('merchantDashboard_access_desc')}
            </p>
            
            <CodeBlock 
              code={`// Access merchant dashboard
// Navigate to: https://app.zkira.xyz/merchant

// Authentication via API key
const headers = {
  'X-API-Key': 'your_merchant_api_key',
  'Content-Type': 'application/json'
};

// Dashboard provides access to:
// - Transaction history
// - Volume reports
// - Player management
// - Dispute resolution
// - Pool monitoring
// - API key management`}
              language="typescript"
              title="Dashboard Access"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('merchantDashboard_pages_title')}</h3>
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <ul className="space-y-2">
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('merchantDashboard_page1_title')}</strong>: {t('merchantDashboard_page1_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('merchantDashboard_page2_title')}</strong>: {t('merchantDashboard_page2_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('merchantDashboard_page3_title')}</strong>: {t('merchantDashboard_page3_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('merchantDashboard_page4_title')}</strong>: {t('merchantDashboard_page4_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('merchantDashboard_page5_title')}</strong>: {t('merchantDashboard_page5_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('merchantDashboard_page6_title')}</strong>: {t('merchantDashboard_page6_desc')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('merchantDashboard_apiKeyAuth_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('merchantDashboard_apiKeyAuth_desc')}
            </p>
            
            <CodeBlock 
              code={`// Generate new API key
POST /api/merchant/keys
{
  "name": "Production Key",
  "permissions": ["read", "write", "admin"]
}

// Rotate existing key
PUT /api/merchant/keys/:keyId/rotate

// Revoke key
DELETE /api/merchant/keys/:keyId

// List all keys
GET /api/merchant/keys`}
              language="http"
              title="API Key Management"
            />
          </div>
        </div>
      </section>

      {/* Section 6: Distributor Hierarchy */}
      <section id="distributor-hierarchy" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('distributorHierarchy_title')}</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('distributorHierarchy_tierSystem_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('distributorHierarchy_tierSystem_desc')}
            </p>
            
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-hover)]">
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">{t('distributorHierarchy_table_tier')}</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">{t('distributorHierarchy_table_role')}</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">{t('distributorHierarchy_table_commission')}</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">{t('distributorHierarchy_table_permissions')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('distributorHierarchy_master')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('distributorHierarchy_master_role')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('distributorHierarchy_master_commission')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('distributorHierarchy_master_permissions')}</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('distributorHierarchy_sub')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('distributorHierarchy_sub_role')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('distributorHierarchy_sub_commission')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('distributorHierarchy_sub_permissions')}</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('distributorHierarchy_agent')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('distributorHierarchy_agent_role')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('distributorHierarchy_agent_commission')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('distributorHierarchy_agent_permissions')}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('distributorHierarchy_merchant')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('distributorHierarchy_merchant_role')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('distributorHierarchy_merchant_commission')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('distributorHierarchy_merchant_permissions')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('distributorHierarchy_commissionCascade_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('distributorHierarchy_commissionCascade_desc')}
            </p>
            
            <CodeBlock 
              code={`// Commission cascade example
// Transaction: $1000 USDC
// Total fees: 2% = $20 USDC

// Distribution:
// Master Distributor: 0.8% = $8 USDC
// Sub Distributor: 0.6% = $6 USDC  
// Agent: 0.4% = $4 USDC
// Merchant: 0.2% = $2 USDC
// Total: 2.0% = $20 USDC

// Create distributor
const distributor = await gateway.createDistributor({
  name: 'Asia Pacific Sub-Distributor',
  tier: 'sub',
  parentId: 'dist_master_001',
  commissionRate: '0.15',
  contactEmail: 'contact@apac-gaming.com'
});`}
              language="typescript"
              title="Commission Structure"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('distributorHierarchy_feeStructure_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('distributorHierarchy_feeStructure_desc')}
            </p>
            
            <CodeBlock 
              code={`// Get distributor downline
const downline = await gateway.getDistributorDownline('dist_sub_001');

// Calculate commissions
const commissions = await gateway.calculateCommissions({
  distributorId: 'dist_sub_001',
  period: '30days'
});

console.log('Total commission earned:', commissions.totalEarned);
console.log('Active merchants:', commissions.activeMerchants);
console.log('Transaction volume:', commissions.totalVolume);`}
              language="typescript"
              title="Commission Tracking"
            />
          </div>
        </div>
      </section>

      {/* Section 7: SDK Reference */}
      <section id="sdk-reference" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('sdkReference_title')}</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('sdkReference_zkiraClient_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('sdkReference_zkiraClient_desc')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('sdkReference_gatewayClient_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('sdkReference_gatewayClient_desc')}
            </p>
            
            <CodeBlock 
              code={`import { GatewayClient } from '@zkira/gateway-client';

// Initialize client
const client = new GatewayClient({
  baseUrl: 'https://api.zkira.xyz',
  apiKey: 'your_merchant_api_key'
});

// Create deposit session
const session = await client.createSession({
  playerId: 'player_123',
  amount: '100',
  token: 'USDC'
});

// Process withdrawal
const withdrawal = await client.createWithdrawal({
  playerId: 'player_123',
  amount: '50',
  token: 'USDC',
  recipientAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
});

// Get volume reports
const report = await client.getVolumeReport('24h');`}
              language="typescript"
              title="@zkira/gateway-client Usage"
            />
          </div>

          <div>
            <h4 className="text-sm font-medium text-[var(--color-text)] mb-3">{t('sdkReference_createPaymentLink_title')}</h4>
            <p className="text-[var(--color-text-secondary)] text-sm mb-3 leading-relaxed">
              {t('sdkReference_createPaymentLink_desc')}
            </p>
            
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-hover)]">
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">{t('sdkReference_table_parameter')}</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">{t('sdkReference_table_type')}</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">{t('sdkReference_table_description')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">recipientMetaAddress</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">string</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('sdkReference_recipientMetaAddress_desc')}</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">amount</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">bigint</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('sdkReference_amount_desc')}</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">tokenMint</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">PublicKey</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('sdkReference_tokenMint_desc')}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">expirySeconds</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">number</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('sdkReference_expirySeconds_desc')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[var(--color-text-secondary)] text-sm mb-3 leading-relaxed">
              <strong>{t('sdkReference_returns')}</strong> Promise&lt;{`{escrowAddress: string, claimUrl: string, stealthAddress: string}`}&gt;
            </p>
          </div>
        </div>
      </section>

      {/* Section 8: Widget Integration */}
      <section id="widget" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('widget_title')}</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('widget_reactHook_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('widget_reactHook_desc1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('widget_reactHook_desc2')}
            </p>
            
            <CodeBlock 
              code={`import { useZkiraPay } from '@zkira/widget';

function PaymentButton() {
  const { createPayment, status, error } = useZkiraPay({
    apiUrl: 'https://api.zkira.xyz',
    apiKey: process.env.NEXT_PUBLIC_ZKIRA_KEY,
    merchantAddress: process.env.NEXT_PUBLIC_MERCHANT_META_ADDRESS,
    supportedChains: ['solana', 'arbitrum', 'tron'],
    supportedTokens: ['USDC', 'USDT'],
  });

  const handlePayment = async () => {
    const payment = await createPayment({ 
      amount: 100_000000, // $100 USDC
      description: 'Premium subscription',
      successUrl: '/success',
      cancelUrl: '/checkout'
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
      {status === 'pending' ? 'Processing...' : 'Pay with ZKIRA'}
    </button>
  );
}`}
              language="typescript"
              title="React Hook Usage"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('widget_htmlIntegration_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('widget_htmlIntegration_desc')}
            </p>
            
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
      amount: 1000000, // $1 USDC
      token: 'USDC',
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
              title="HTML Widget Integration"
            />
          </div>
        </div>
      </section>

      {/* Section 9: Solana Programs */}
      <section id="solana-programs" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('solanaPrograms_title')}</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('solanaPrograms_overview_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('solanaPrograms_overview_desc')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('solanaPrograms_ghostRegistry_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('solanaPrograms_ghostRegistry_desc')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('solanaPrograms_conditionalEscrow_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('solanaPrograms_conditionalEscrow_desc')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('solanaPrograms_multisigEscrow_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('solanaPrograms_multisigEscrow_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Section 10: Shielded Pool */}
      <section id="shielded-pool" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('shieldedPool_title')}</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('shieldedPool_overview_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('shieldedPool_overview_desc1')}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('shieldedPool_overview_desc2')}
            </p>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('shieldedPool_deposits_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('shieldedPool_deposits_desc')}
            </p>
            
            <CodeBlock 
              code={`import { ShieldedPoolClient } from '@zkira/sdk';

// Initialize shielded pool client
const pool = new ShieldedPoolClient(connection, wallet, {
  programId: SHIELDED_POOL_PROGRAM_ID,
  tokenMint: USDC_MINT,
  denomination: 10_000_000, // 10 USDC fixed denomination
});

// Deposit into shielded pool
const { note, commitment } = await pool.deposit(USDC_MINT);
console.log('Deposit note (keep secret):', note);
console.log('Public commitment:', commitment);`}
              language="typescript"
              title="Shielded Pool Deposit"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('shieldedPool_withdrawals_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('shieldedPool_withdrawals_desc')}
            </p>
            
            <CodeBlock 
              code={`// Withdraw from shielded pool (after 6+ hour soak time)
const withdrawal = await pool.withdraw(
  note, // Secret note from deposit
  recipientAddress // Where to send the funds
);

console.log('Withdrawal transaction:', withdrawal.txSignature);

// The zero-knowledge proof ensures:
// 1. You have a valid deposit note
// 2. The note hasn't been spent before
// 3. No link between deposit and withdrawal
// 4. Withdrawal amount matches deposit denomination`}
              language="typescript"
              title="Shielded Pool Withdrawal"
            />
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('shieldedPool_zkProofs_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('shieldedPool_zkProofs_desc')}
            </p>
            
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <ul className="space-y-2">
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('shieldedPool_proof1_title')}</strong>: {t('shieldedPool_proof1_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('shieldedPool_proof2_title')}</strong>: {t('shieldedPool_proof2_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('shieldedPool_proof3_title')}</strong>: {t('shieldedPool_proof3_desc')}</span>
                </li>
                <li className="text-[var(--color-text-secondary)] text-sm flex items-start gap-2">
                  <span className="text-[var(--color-accent)] mt-1">•</span>
                  <span><strong>{t('shieldedPool_proof4_title')}</strong>: {t('shieldedPool_proof4_desc')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('shieldedPool_privacyGuarantees_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('shieldedPool_privacyGuarantees_desc')}
            </p>
            
            <div className="bg-[var(--color-hover)] p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-hover)]">
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">{t('shieldedPool_table_attack')}</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">{t('shieldedPool_table_protection')}</th>
                    <th className="text-left py-2 px-3 text-[var(--color-text)] font-medium">{t('shieldedPool_table_mechanism')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_attack1')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_protection1')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_mechanism1')}</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_attack2')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_protection2')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_mechanism2')}</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_attack3')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_protection3')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_mechanism3')}</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_attack4')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_protection4')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_mechanism4')}</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_attack5')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_protection5')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_mechanism5')}</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_attack6')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_protection6')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_mechanism6')}</td>
                  </tr>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_attack7')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_protection7')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_mechanism7')}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_attack8')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_protection8')}</td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">{t('shieldedPool_mechanism8')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('shieldedPool_resistanceLevels_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('shieldedPool_resistanceLevels_desc')}
            </p>
            <ul className="space-y-2">
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start">
                <span className="text-green-500 mr-2 mt-0.5">•</span>
                <span><strong>{t('shieldedPool_resistance1_title')}</strong> {t('shieldedPool_resistance1_desc')}</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start">
                <span className="text-yellow-500 mr-2 mt-0.5">•</span>
                <span><strong>{t('shieldedPool_resistance2_title')}</strong> {t('shieldedPool_resistance2_desc')}</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start">
                <span className="text-blue-500 mr-2 mt-0.5">•</span>
                <span><strong>{t('shieldedPool_resistance3_title')}</strong> {t('shieldedPool_resistance3_desc')}</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start">
                <span className="text-purple-500 mr-2 mt-0.5">•</span>
                <span><strong>{t('shieldedPool_resistance4_title')}</strong> {t('shieldedPool_resistance4_desc')}</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-medium text-[var(--color-text)] mb-2">{t('shieldedPool_limitations_title')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
              {t('shieldedPool_limitations_desc')}
            </p>
            <ul className="space-y-2">
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start">
                <span className="text-red-500 mr-2 mt-0.5">•</span>
                <span>{t('shieldedPool_limitation1')}</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start">
                <span className="text-red-500 mr-2 mt-0.5">•</span>
                <span>{t('shieldedPool_limitation2')}</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start">
                <span className="text-red-500 mr-2 mt-0.5">•</span>
                <span>{t('shieldedPool_limitation3')}</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start">
                <span className="text-red-500 mr-2 mt-0.5">•</span>
                <span>{t('shieldedPool_limitation4')}</span>
              </li>
              <li className="text-[var(--color-text-secondary)] text-sm flex items-start">
                <span className="text-red-500 mr-2 mt-0.5">•</span>
                <span>{t('shieldedPool_limitation5')}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}