'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/PageHeader';
import { CodeBlock } from '@/components/learn/CodeBlock';
import Link from 'next/link';

export default function APIReferencePage() {
  const t = useTranslations('apiReferencePage');
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />
      
      <a 
        href="/developers" 
        className="text-[11px] text-[var(--color-green)] hover:text-[var(--color-green-hover)] -mt-4 mb-6 inline-block transition-colors"
      >
        {t('manageApiKeys')} →
      </a>

      {/* Authentication */}
      <section id="authentication" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">{t('authenticationTitle')}</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('authenticationDesc')}
          </p>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-3">{t('merchantAuthTitle')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
              {t('merchantAuthDesc')}
            </p>
            <CodeBlock 
              code="X-API-Key: merchant_api_key_here" 
              language="http"
              title="Merchant Authentication Header"
            />
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-3">{t('adminAuthTitle')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
              {t('adminAuthDesc')}
            </p>
            <CodeBlock 
              code="X-Admin-Password: admin_password_here" 
              language="http"
              title="Admin Authentication Header"
            />
          </div>

          <p className="text-[var(--color-text-secondary)] text-[11px] mt-3">
            {t('generateApiKeysDesc')} <a href="/developers" className="text-[var(--color-green)] hover:text-[var(--color-green-hover)] transition-colors">/developers</a>
          </p>
        </div>
      </section>

      {/* Base URL */}
      <section id="base-url" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">{t('baseUrlTitle')}</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('baseUrlDesc')}
          </p>
          <CodeBlock 
            code="https://api.zkira.xyz" 
            language="url"
            title="Production Base URL"
          />
        </div>
      </section>

      {/* Gateway Endpoints */}
      <section id="gateway-endpoints" className="mb-8">
        <h2 className="text-2xl font-medium text-[var(--color-text-primary)] mb-6">{t('gatewayEndpointsTitle')}</h2>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          {t('gatewayEndpointsDesc')}
        </p>

        {/* Gateway Sessions */}
        <div id="gateway-sessions" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">{t('gatewaySessionsTitle')}</h3>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('gatewaySessionsDesc')}
          </p>
          
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[#FFFFFF] text-black px-2.5 py-0.5 text-[11px] font-medium">POST</span>
              <code className="text-[var(--color-text-primary)] font-mono">/api/gateway/sessions</code>
            </div>
            <CodeBlock 
              code={JSON.stringify({
                "playerId": "player_123",
                "amount": "100",
                "token": "USDC",
                "metadata": {
                  "gameId": "poker_table_1"
                }
              }, null, 2)} 
              language="json"
              title="Create Session Request"
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[var(--color-green)] text-white px-2.5 py-0.5 text-[11px] font-medium">GET</span>
              <code className="text-[var(--color-text-primary)] font-mono">/api/gateway/sessions/:id</code>
            </div>
            <CodeBlock 
              code={JSON.stringify({
                "sessionId": "sess_abc123",
                "playerId": "player_123",
                "amount": "100",
                "token": "USDC",
                "status": "pending",
                "depositUrl": "https://app.zkira.xyz/deposit/sess_abc123",
                "expiresAt": "2026-03-06T15:30:00Z"
              }, null, 2)} 
              language="json"
              title="Get Session Response"
            />
          </div>
        </div>

        {/* Gateway Withdrawals */}
        <div id="gateway-withdrawals" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">{t('gatewayWithdrawalsTitle')}</h3>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('gatewayWithdrawalsDesc')}
          </p>
          
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[#FFFFFF] text-black px-2.5 py-0.5 text-[11px] font-medium">POST</span>
              <code className="text-[var(--color-text-primary)] font-mono">/api/gateway/withdrawals</code>
            </div>
            <CodeBlock 
              code={JSON.stringify({
                "playerId": "player_123",
                "amount": "50",
                "token": "USDC",
                "recipientAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
              }, null, 2)} 
              language="json"
              title="Create Withdrawal Request"
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[#FFA500] text-white px-2.5 py-0.5 text-[11px] font-medium">PUT</span>
              <code className="text-[var(--color-text-primary)] font-mono">/api/gateway/withdrawals/:id/approve</code>
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-2">
              {t('approveWithdrawalDesc')}
            </p>
          </div>
        </div>

        {/* Gateway Reports */}
        <div id="gateway-reports" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">{t('gatewayReportsTitle')}</h3>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('gatewayReportsDesc')}
          </p>
          
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[var(--color-green)] text-white px-2.5 py-0.5 text-[11px] font-medium">GET</span>
              <code className="text-[var(--color-text-primary)] font-mono">/api/gateway/reports/volume</code>
            </div>
            <CodeBlock 
              code={JSON.stringify({
                "period": "24h",
                "totalVolume": "15420.50",
                "totalTransactions": 342,
                "averageAmount": "45.09",
                "byToken": {
                  "USDC": "12340.25",
                  "USDT": "3080.25"
                }
              }, null, 2)} 
              language="json"
              title="Volume Report Response"
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[var(--color-green)] text-white px-2.5 py-0.5 text-[11px] font-medium">GET</span>
              <code className="text-[var(--color-text-primary)] font-mono">/api/gateway/reports/balances</code>
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-2">
              {t('balanceReportDesc')}
            </p>
          </div>
        </div>

        {/* Gateway Disputes */}
        <div id="gateway-disputes" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">{t('gatewayDisputesTitle')}</h3>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('gatewayDisputesDesc')}
          </p>
          
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[#FFFFFF] text-black px-2.5 py-0.5 text-[11px] font-medium">POST</span>
              <code className="text-[var(--color-text-primary)] font-mono">/api/gateway/disputes</code>
            </div>
            <CodeBlock 
              code={JSON.stringify({
                "transactionId": "tx_abc123",
                "playerId": "player_123",
                "reason": "unauthorized_withdrawal",
                "description": "Player claims they did not initiate this withdrawal"
              }, null, 2)} 
              language="json"
              title="Create Dispute Request"
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[#FFA500] text-white px-2.5 py-0.5 text-[11px] font-medium">PUT</span>
              <code className="text-[var(--color-text-primary)] font-mono">/api/gateway/disputes/:id/resolve</code>
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-2">
              {t('resolveDisputeDesc')}
            </p>
          </div>
        </div>

        {/* Gateway Pools */}
        <div id="gateway-pools" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">{t('gatewayPoolsTitle')}</h3>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('gatewayPoolsDesc')}
          </p>
          
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[#FFFFFF] text-black px-2.5 py-0.5 text-[11px] font-medium">POST</span>
              <code className="text-[var(--color-text-primary)] font-mono">/api/gateway/pools</code>
            </div>
            <CodeBlock 
              code={JSON.stringify({
                "token": "USDC",
                "initialLiquidity": "10000",
                "minBalance": "1000",
                "maxBalance": "50000"
              }, null, 2)} 
              language="json"
              title="Create Pool Request"
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[var(--color-green)] text-white px-2.5 py-0.5 text-[11px] font-medium">GET</span>
              <code className="text-[var(--color-text-primary)] font-mono">/api/gateway/pools/:id</code>
            </div>
            <CodeBlock 
              code={JSON.stringify({
                "poolId": "pool_usdc_001",
                "token": "USDC",
                "currentBalance": "25430.75",
                "minBalance": "1000",
                "maxBalance": "50000",
                "status": "active"
              }, null, 2)} 
              language="json"
              title="Get Pool Response"
            />
          </div>
        </div>

        {/* Distributor Management */}
        <div id="distributor-management" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">{t('distributorManagementTitle')}</h3>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('distributorManagementDesc')}
          </p>
          
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[#FFFFFF] text-black px-2.5 py-0.5 text-[11px] font-medium">POST</span>
              <code className="text-[var(--color-text-primary)] font-mono">/api/gateway/distributors</code>
            </div>
            <CodeBlock 
              code={JSON.stringify({
                "name": "Asia Pacific Sub-Distributor",
                "tier": "sub",
                "parentId": "dist_master_001",
                "commissionRate": "0.15",
                "contactEmail": "contact@apac-gaming.com"
              }, null, 2)} 
              language="json"
              title="Create Distributor Request"
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[var(--color-green)] text-white px-2.5 py-0.5 text-[11px] font-medium">GET</span>
              <code className="text-[var(--color-text-primary)] font-mono">/api/gateway/distributors/:id/downline</code>
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-2">
              {t('distributorDownlineDesc')}
            </p>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 mb-6">
          <p className="text-[var(--color-text-secondary)] text-sm">
            <strong>{t('fullApiSpecNote')}</strong> {t('fullApiSpecDesc')} 
            <a href="/api/docs/openapi.yaml" className="text-[var(--color-green)] hover:text-[var(--color-green-hover)] transition-colors">/api/docs/openapi.yaml</a>
          </p>
        </div>
      </section>

      {/* SDK Reference */}
      <section id="sdk-reference" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">{t('sdkReferenceTitle')}</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
            {t('sdkReferenceDesc')}
          </p>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-3">{t('gatewayClientTitle')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
              {t('gatewayClientDesc')}
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

          <div className="mb-6">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-3">{t('zkiraClientTitle')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
              {t('zkiraClientDesc')}
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('constructorTitle')}</h4>
                <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                  new ZkiraClient(connection: Connection, wallet: WalletAdapter)
                </code>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('methodsTitle')}</h4>
                <div className="space-y-3">
                  <div>
                    <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                      createPaymentLink(params: CreatePaymentLinkParams): Promise&lt;CreatePaymentLinkResult&gt;
                    </code>
                    <p className="text-[var(--color-text-secondary)] text-[11px] mt-1">{t('createPaymentLinkDesc')}</p>
                  </div>
                  
                  <div>
                    <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                      claimStealth(params: ClaimStealthParams): Promise&lt;ClaimStealthResult&gt;
                    </code>
                    <p className="text-[var(--color-text-secondary)] text-[11px] mt-1">{t('claimStealthDesc')}</p>
                  </div>
                  
                  <div>
                    <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                      scanForPayments(params: ScanForPaymentsParams): Promise&lt;MatchedAnnouncement[]&gt;
                    </code>
                    <p className="text-[var(--color-text-secondary)] text-[11px] mt-1">{t('scanForPaymentsDesc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-3">{t('shieldedPoolClientTitle')}</h3>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
              {t('shieldedPoolClientDesc')}
            </p>
            <div className="space-y-3">
              <div>
                <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                  deposit(tokenMint: PublicKey): Promise&lt;DepositResult&gt;
                </code>
                <p className="text-[var(--color-text-secondary)] text-[11px] mt-1">{t('depositDesc')}</p>
              </div>
              
              <div>
                <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                  withdraw(note: string, recipient: PublicKey): Promise&lt;{'{'}txSignature: string{'}'}&gt;
                </code>
                <p className="text-[var(--color-text-secondary)] text-[11px] mt-1">{t('withdrawDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Webhooks */}
      <section id="webhooks" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">{t('webhooksTitle')}</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('webhooksDesc')}
          </p>
          
          <div className="space-y-4 mb-6">
            <div>
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('eventTypesTitle')}</h4>
              <ul className="text-[var(--color-text-secondary)] text-sm space-y-1">
                <li>• <code>gateway.session_completed</code> - {t('sessionCompletedEvent')}</li>
                <li>• <code>gateway.withdrawal_approved</code> - {t('withdrawalApprovedEvent')}</li>
                <li>• <code>gateway.dispute_created</code> - {t('disputeCreatedEvent')}</li>
                <li>• <code>pool.deposited</code> - {t('poolDepositedEvent')}</li>
                <li>• <code>pool.withdrawal_processed</code> - {t('poolWithdrawalEvent')}</li>
              </ul>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('webhookPayloadTitle')}</h4>
            <CodeBlock 
              code={JSON.stringify({
                "event": "gateway.session_completed",
                "timestamp": 1709740800000,
                "data": {
                  "sessionId": "sess_abc123",
                  "playerId": "player_123",
                  "amount": "100",
                  "token": "USDC",
                  "transactionHash": "5xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
                },
                "signature": "webhook_signature_here"
              }, null, 2)} 
              language="json"
              title="Webhook Payload"
            />
          </div>

          <CodeBlock 
            code={`// Webhook handler example
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-zkira-signature'];
  const payload = JSON.stringify(req.body);
  
  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
    
  if (signature === expectedSignature) {
    // Handle webhook event
    console.log('Event:', req.body.event);
    console.log('Data:', req.body.data);
    res.status(200).send('OK');
  } else {
    res.status(401).send('Invalid signature');
  }
});`} 
            language="javascript"
            title="Webhook Handler Example"
          />
        </div>
      </section>

      {/* Error Responses */}
      <section id="errors" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">{t('errorResponsesTitle')}</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('errorResponsesDesc')}
          </p>
          
          <div className="space-y-4">
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">400 Bad Request</h4>
              <CodeBlock 
                code={JSON.stringify({
                  "error": "Invalid request parameters",
                  "code": "INVALID_PARAMS"
                }, null, 2)} 
                language="json"
              />
            </div>
            
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">401 Unauthorized</h4>
              <CodeBlock 
                code={JSON.stringify({
                  "error": "Invalid or missing API key",
                  "code": "UNAUTHORIZED"
                }, null, 2)} 
                language="json"
              />
            </div>
            
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">404 Not Found</h4>
              <CodeBlock 
                code={JSON.stringify({
                  "error": "Resource not found",
                  "code": "NOT_FOUND"
                }, null, 2)} 
                language="json"
              />
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">429 Too Many Requests</h4>
              <CodeBlock 
                code={JSON.stringify({
                  "error": "Rate limit exceeded",
                  "code": "RATE_LIMITED"
                }, null, 2)} 
                language="json"
              />
            </div>
            
            <div className="border-l-4 border-red-800 pl-4">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">500 Internal Server Error</h4>
              <CodeBlock 
                code={JSON.stringify({
                  "error": "Internal server error",
                  "code": "INTERNAL_ERROR"
                }, null, 2)} 
                language="json"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Rate Limiting */}
      <section id="rate-limiting" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">{t('rateLimitingTitle')}</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('rateLimitingDesc')}
          </p>
          
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('rateLimitHeadersTitle')}</h4>
              <ul className="text-[var(--color-text-secondary)] text-sm space-y-1 font-mono">
                <li>• <code>X-RateLimit-Limit</code> - {t('rateLimitLimitHeader')}</li>
                <li>• <code>X-RateLimit-Remaining</code> - {t('rateLimitRemainingHeader')}</li>
                <li>• <code>X-RateLimit-Reset</code> - {t('rateLimitResetHeader')}</li>
              </ul>
            </div>
          </div>

          <CodeBlock 
            code={`HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1709744000`} 
            language="http"
            title="Rate Limit Headers Example"
          />
        </div>
      </section>
    </div>
  );
}