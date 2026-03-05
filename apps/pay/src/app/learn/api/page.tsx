'use client';

import { PageHeader } from '@/components/PageHeader';
import { CodeBlock } from '@/components/learn/CodeBlock';

export default function APIReferencePage() {
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        title="API Reference"
        description="Complete REST API and TypeScript SDK reference"
      />
      
      <a 
        href="/developers" 
        className="text-[11px] text-[var(--color-green)] hover:text-[var(--color-green-hover)] -mt-4 mb-6 inline-block transition-colors"
      >
        Manage your API keys →
      </a>

      {/* Authentication */}
      <section id="authentication" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">Authentication</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            All API requests require authentication using your API key in the Authorization header.
          </p>
          <CodeBlock 
            code="Authorization: Bearer your_api_key_here" 
            language="http"
            title="Authorization Header"
          />
          <p className="text-[var(--color-text-secondary)] text-[11px] mt-3">
            Generate API keys at <a href="/developers" className="text-[var(--color-green)] hover:text-[var(--color-green-hover)] transition-colors">/developers</a>
          </p>
        </div>
      </section>

      {/* Base URL */}
      <section id="base-url" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">Base URL</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            All API endpoints are available at the following base URL:
          </p>
          <CodeBlock 
            code="https://api.zkira.xyz" 
            language="url"
            title="Production Base URL"
          />
        </div>
      </section>

      {/* REST Endpoints */}
      <section id="rest-endpoints" className="mb-8">
        <h2 className="text-2xl font-medium text-[var(--color-text-primary)] mb-6">REST Endpoints</h2>

        {/* Create Payment */}
        <div id="create-payment" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-[#FFFFFF] text-black px-2.5 py-0.5 text-[11px] font-medium">POST</span>
            <code className="text-[var(--color-text-primary)] font-mono">/api/payments/create</code>
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            Create a confidential payment escrow. Generates a claim URL for the recipient.
          </p>
          <div className="mb-4">
            <CodeBlock 
              code={JSON.stringify({
                "amount": 100,
                "tokenMint": "USDC",
                "expiryDays": 7
              }, null, 2)} 
              language="json"
              title="Request Body"
            />
          </div>
          <CodeBlock 
            code={JSON.stringify({
              "paymentId": "pay_1234567890",
              "claimUrl": "https://app.zkira.xyz/claim/abc123",
              "payUrl": "https://app.zkira.xyz/pay/xyz789",
              "amount": 100,
              "tokenMint": "USDC",
              "claimHash": "hash_abc123",
              "metaAddress": "meta_xyz789",
              "expiresAt": "2024-01-15T10:30:00Z"
            }, null, 2)} 
            language="json"
            title="Response"
          />
        </div>

        {/* Get Payment */}
        <div id="get-payment" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-[var(--color-green)] text-white px-2.5 py-0.5 text-[11px] font-medium">GET</span>
            <code className="text-[var(--color-text-primary)] font-mono">/api/payments/:id</code>
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            Retrieve payment details by payment ID.
          </p>
          <CodeBlock 
            code={JSON.stringify({
              "payment": {
                "paymentId": "pay_1234567890",
                "amount": 100,
                "tokenMint": "USDC",
                "claimHash": "hash_abc123",
                "metaAddress": "meta_xyz789",
                "expiresAt": "2024-01-15T10:30:00Z",
                "createdAt": "2024-01-08T10:30:00Z"
              }
            }, null, 2)} 
            language="json"
            title="Response"
          />
        </div>

        {/* Check Status */}
        <div id="check-status" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-[#FFFFFF] text-black px-2.5 py-0.5 text-[11px] font-medium">POST</span>
            <code className="text-[var(--color-text-primary)] font-mono">/api/payments/status</code>
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            Check the on-chain status of a payment escrow.
          </p>
          <div className="mb-4">
            <CodeBlock 
              code={JSON.stringify({
                "escrowAddress": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
              }, null, 2)} 
              language="json"
              title="Request Body"
            />
          </div>
          <CodeBlock 
            code={JSON.stringify({
              "escrow": {
                "address": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
                "creator": "4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM",
                "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                "amount": 100000000,
                "claimed": false,
                "refunded": false,
                "expiry": 1705320600,
                "createdAt": 1704715800
              }
            }, null, 2)} 
            language="json"
            title="Response"
          />
        </div>

        {/* Get Escrow */}
        <div id="get-escrow" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-[var(--color-green)] text-white px-2.5 py-0.5 text-[11px] font-medium">GET</span>
            <code className="text-[var(--color-text-primary)] font-mono">/api/escrows/:address</code>
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            Get escrow details by on-chain address.
          </p>
          <CodeBlock 
            code={JSON.stringify({
              "escrow": {
                "address": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
                "creator": "4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM",
                "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                "amount": 100000000,
                "claimed": false,
                "refunded": false,
                "expiry": 1705320600,
                "createdAt": 1704715800
              }
            }, null, 2)} 
            language="json"
            title="Response"
          />
        </div>

        {/* List Escrows */}
        <div id="list-escrows" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-[var(--color-green)] text-white px-2.5 py-0.5 text-[11px] font-medium">GET</span>
            <code className="text-[var(--color-text-primary)] font-mono">/api/escrows/creator/:pubkey</code>
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            List all escrows created by a specific wallet address.
          </p>
          <CodeBlock 
            code={JSON.stringify({
              "escrows": [
                {
                  "address": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
                  "creator": "4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM",
                  "amount": 100000000,
                  "claimed": false,
                  "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
                }
              ],
              "count": 1
            }, null, 2)} 
            language="json"
            title="Response"
          />
        </div>

        {/* Health Check */}
        <div id="health" className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-[var(--color-green)] text-white px-2.5 py-0.5 text-[11px] font-medium">GET</span>
            <code className="text-[var(--color-text-primary)] font-mono">/api/health</code>
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            Health check endpoint. No authentication required.
          </p>
          <CodeBlock 
            code={JSON.stringify({
              "status": "ok",
              "timestamp": 1704715800000,
              "version": "1.0.0"
            }, null, 2)} 
            language="json"
            title="Response"
          />
        </div>
      </section>

      {/* SDK Reference */}
      <section id="sdk-reference" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">SDK Reference</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
            TypeScript SDK with ZkiraClient for confidential payments and ShieldedPoolClient for privacy pools.
          </p>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-3">ZkiraClient Class</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Constructor</h4>
                <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                  new ZkiraClient(connection: Connection, wallet: WalletAdapter)
                </code>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Methods</h4>
                <div className="space-y-3">
                  <div>
                    <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                      createPaymentLink(params: CreatePaymentLinkParams): Promise&lt;CreatePaymentLinkResult&gt;
                    </code>
                    <p className="text-[var(--color-text-secondary)] text-[11px] mt-1">Create a confidential payment escrow with claim URL</p>
                  </div>
                  
                  <div>
                    <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                      claimStealth(params: ClaimStealthParams): Promise&lt;ClaimStealthResult&gt;
                    </code>
                    <p className="text-[var(--color-text-secondary)] text-[11px] mt-1">Claim a stealth payment from escrow to recipient wallet</p>
                  </div>
                  
                  <div>
                    <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                      refundPayment(params: RefundPaymentParams): Promise&lt;RefundPaymentResult&gt;
                    </code>
                    <p className="text-[var(--color-text-secondary)] text-[11px] mt-1">Refund an unclaimed payment back to creator</p>
                  </div>
                  
                  <div>
                    <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                      scanForPayments(params: ScanForPaymentsParams): Promise&lt;MatchedAnnouncement[]&gt;
                    </code>
                    <p className="text-[var(--color-text-secondary)] text-[11px] mt-1">Scan blockchain for payments to registered meta-addresses</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-3">useZkiraPay React Hook</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Configuration</h4>
                <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                  {`{ payAppUrl?: string, apiUrl?: string, apiKey?: string }`}
                </code>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Returns</h4>
                <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                  {`{ createPayment, checkPaymentStatus, getPayment, status, error, lastResult, reset }`}
                </code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ShieldedPoolClient SDK */}
      <section id="shielded-pool-client" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">ShieldedPoolClient SDK</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
            Privacy-focused client for shielded deposits and private withdrawals using zero-knowledge proofs.
          </p>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-3">ShieldedPoolClient Class</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Constructor</h4>
                <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                  new ShieldedPoolClient(connection: Connection, wallet: WalletAdapter, poolConfig: PoolConfig, options?: ClientOptions)
                </code>
                <p className="text-[var(--color-text-secondary)] text-[11px] mt-1">Initialize client with Solana connection, wallet, and pool configuration</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Methods</h4>
                <div className="space-y-3">
                  <div>
                    <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                      deposit(tokenMint: PublicKey): Promise&lt;DepositResult&gt;
                    </code>
                    <p className="text-[var(--color-text-secondary)] text-[11px] mt-1">Create a shielded deposit - generates commitment and encrypted note for withdrawal</p>
                  </div>
                  
                  <div>
                    <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                      withdraw(note: string, recipient: PublicKey): Promise&lt;{'{'}txSignature: string{'}'}&gt;
                    </code>
                    <p className="text-[var(--color-text-secondary)] text-[11px] mt-1">Private withdrawal - generates ZK proof (~3 seconds) and queues withdrawal for batched processing</p>
                  </div>
                  
                  <div>
                    <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                      getPoolState(): Promise&lt;PoolState&gt;
                    </code>
                    <p className="text-[var(--color-text-secondary)] text-[11px] mt-1">Get current pool statistics including total deposits and pending withdrawals</p>
                  </div>
                  
                  <div>
                    <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                      rebuildTree(): Promise&lt;void&gt;
                    </code>
                    <p className="text-[var(--color-text-secondary)] text-[11px] mt-1">Rebuild local Merkle tree from on-chain commitments (required after extended offline periods)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-3">TypeScript Interfaces</h3>
            <div className="space-y-3">
              <CodeBlock 
                code={`interface PoolConfig {
  programId: PublicKey;     // Shielded pool program ID
  tokenMint: PublicKey;     // Token mint (e.g., USDC)
  denomination: number;     // Fixed deposit amount in lamports
}

interface PoolState {
  totalDeposits: number;        // Total number of deposits
  pendingWithdrawals: number;   // Queued withdrawals count
  merkleRoot: string;           // Current Merkle tree root
}

interface DepositResult {
  txSignature: string;  // Transaction signature
  note: string;         // Encrypted note (save securely for withdrawal)
}`} 
                language="typescript"
                title="ShieldedPoolClient Types"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-3">Usage Example</h3>
            <CodeBlock 
              code={`import { ShieldedPoolClient } from '@zkira/sdk';
import { Connection, PublicKey } from '@solana/web3.js';

// Initialize client
const poolClient = new ShieldedPoolClient(connection, wallet, {
  programId: SHIELDED_POOL_PROGRAM_ID,
  tokenMint: USDC_MINT,
  denomination: 10_000_000, // 10 USDC
});

// Shielded deposit
const { txSignature, note } = await poolClient.deposit(USDC_MINT);
console.log('Deposit confirmed:', txSignature);
// IMPORTANT: Save 'note' securely - needed for withdrawal

// Private withdrawal (generates ZK proof)
const result = await poolClient.withdraw(note, recipientAddress);
console.log('Withdrawal queued:', result.txSignature);
// Funds arrive within ~1 hour via batched processing

// Check pool state
const state = await poolClient.getPoolState();
console.log('Pool deposits:', state.totalDeposits);`} 
              language="typescript"
              title="ShieldedPoolClient Example"
            />
          </div>
        </div>
      </section>

      {/* Privacy Transport */}
      <section id="privacy-transport" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">Privacy Transport</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
            Enhanced privacy transport layer using Nym mixnet for metadata protection.
          </p>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-3">createPrivateTransport Function</h3>
            <div className="space-y-4">
              <div>
                <code className="block text-[var(--color-text-secondary)] text-sm font-mono bg-[var(--color-background)] p-3 border border-[var(--border-subtle)]">
                  createPrivateTransport(): Promise&lt;Transport&gt;
                </code>
                <p className="text-[var(--color-text-secondary)] text-[11px] mt-1">Creates Nym mixnet transport for enhanced metadata privacy, falls back to direct connection if mixnet unavailable</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-3">Usage Example</h3>
            <CodeBlock 
              code={`import { createPrivateTransport, ShieldedPoolClient, ZkiraClient } from '@zkira/sdk';

// Create privacy transport
const transport = await createPrivateTransport();

// Use with ShieldedPoolClient
const poolClient = new ShieldedPoolClient(connection, wallet, poolConfig, {
  transport
});

// Use with ZkiraClient
const zkiraClient = new ZkiraClient(connection, wallet, {
  transport
});

// All network requests now route through Nym mixnet
// for enhanced metadata privacy and traffic analysis resistance`} 
              language="typescript"
              title="Privacy Transport Example"
            />
          </div>
        </div>
      </section>


      {/* Webhooks */}
      <section id="webhooks" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">Webhooks</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            Configure webhooks to receive real-time notifications about payment events.
          </p>
          
          <div className="space-y-4 mb-6">
            <div>
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Event Types</h4>
              <ul className="text-[var(--color-text-secondary)] text-sm space-y-1">
                <li>• <code>payment.completed</code> - Payment claimed by recipient</li>
                <li>• <code>payment.expired</code> - Payment expired without claim</li>
                <li>• <code>escrow.claimed</code> - Escrow successfully claimed</li>
                <li>• <code>pool.deposited</code> - Shielded deposit confirmed</li>
                <li>• <code>pool.withdrawal_queued</code> - Private withdrawal proof verified, queued for processing</li>
                <li>• <code>pool.withdrawal_processed</code> - Batched withdrawal executed on-chain</li>
              </ul>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Webhook Payload</h4>
            <CodeBlock 
              code={JSON.stringify({
                "event": "payment.completed",
                "timestamp": 1704715800000,
                "data": {
                  "paymentId": "pay_1234567890",
                  "escrowAddress": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
                  "amount": 100000000,
                  "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                  "recipient": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
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
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">Error Responses</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            All errors follow a consistent format with appropriate HTTP status codes.
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
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">Rate Limiting</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            API requests are limited to 1000 requests per hour per API key. Rate limit information is included in response headers.
          </p>
          
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Rate Limit Headers</h4>
              <ul className="text-[var(--color-text-secondary)] text-sm space-y-1 font-mono">
                <li>• <code>X-RateLimit-Limit</code> - Maximum requests per hour</li>
                <li>• <code>X-RateLimit-Remaining</code> - Remaining requests in current window</li>
                <li>• <code>X-RateLimit-Reset</code> - Unix timestamp when limit resets</li>
              </ul>
            </div>
          </div>

          <CodeBlock 
            code={`HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704719400`} 
            language="http"
            title="Rate Limit Headers Example"
          />
        </div>
      </section>
    </div>
  );
}