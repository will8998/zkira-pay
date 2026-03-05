'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { CodeBlock } from '@/components/learn/CodeBlock';

export default function APIReferencePage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'omnipay2026') {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  if (!authenticated) {
    return (
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto animate-fade-in">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-8 max-w-md w-full">
            <h1 className="text-2xl font-medium text-[var(--color-text-primary)] mb-4">API Reference</h1>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
              This documentation is for authorized integration partners only.
            </p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--border-subtle)] text-[var(--color-text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--color-text-primary)] transition-colors"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Access Documentation
              </button>
              
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        title="API Reference"
        description="Gateway integration documentation for OMNIPAY payment processing"
      />

      {/* Getting Started */}
      <section id="getting-started" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">Getting Started</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            OMNIPAY provides a simple REST API for integrating private payment processing into your platform. We handle all the complexity of zero-knowledge proofs, shielded pools, and multi-chain settlement. You just make API calls.
          </p>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            API keys are provided by the OMNIPAY team during onboarding. Contact us to get started.
          </p>
        </div>
      </section>

      {/* Authentication */}
      <section id="authentication" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">Authentication</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            All API requests must include your API key in the request headers. API keys are manually provisioned by the OMNIPAY team during the onboarding process.
          </p>
          
          <CodeBlock 
            code="X-API-Key: your_api_key_here" 
            language="http"
            title="Authentication Header"
          />
          
          <p className="text-[var(--color-text-secondary)] text-[11px] mt-3">
            API keys are provided manually by OMNIPAY team. No self-service generation available.
          </p>
        </div>
      </section>

      {/* Base URL */}
      <section id="base-url" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">Base URL</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            All API endpoints are relative to the base URL shown below.
          </p>
          <CodeBlock 
            code="https://omnipay.club/api" 
            language="url"
            title="Production Base URL"
          />
        </div>
      </section>

      {/* Create Payment Session */}
      <section id="create-session" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">Create Payment Session</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            Create a new payment session for a player. Returns a deposit URL that the player can use to complete the payment.
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
              title="Request Body"
            />
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Response</h4>
            <CodeBlock 
              code={JSON.stringify({
                "sessionId": "sess_abc123",
                "depositUrl": "https://omnipay.club/deposit/sess_abc123",
                "status": "pending",
                "expiresAt": "2026-03-06T15:30:00Z"
              }, null, 2)} 
              language="json"
              title="Response Body"
            />
          </div>
        </div>
      </section>

      {/* Get Session Status */}
      <section id="get-session" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">Get Session Status</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            Retrieve the current status and details of a payment session.
          </p>
          
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
                "status": "completed",
                "depositUrl": "https://omnipay.club/deposit/sess_abc123",
                "expiresAt": "2026-03-06T15:30:00Z",
                "completedAt": "2026-03-06T14:25:00Z"
              }, null, 2)} 
              language="json"
              title="Response Body"
            />
          </div>
        </div>
      </section>

      {/* Create Withdrawal */}
      <section id="create-withdrawal" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">Create Withdrawal</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            Create a withdrawal request for a player. Withdrawals require manual approval from the OMNIPAY team before processing.
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
              title="Request Body"
            />
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Response</h4>
            <CodeBlock 
              code={JSON.stringify({
                "withdrawalId": "wd_xyz789",
                "status": "pending_approval",
                "createdAt": "2026-03-06T14:30:00Z"
              }, null, 2)} 
              language="json"
              title="Response Body"
            />
          </div>
        </div>
      </section>

      {/* Webhooks */}
      <section id="webhooks" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">Webhooks</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            OMNIPAY sends webhook events to notify your application of important payment events. Configure your webhook endpoint during onboarding.
          </p>
          
          <div className="space-y-4 mb-6">
            <div>
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Event Types</h4>
              <ul className="text-[var(--color-text-secondary)] text-sm space-y-1">
                <li>• <code>session_completed</code> - Payment session successfully completed</li>
                <li>• <code>withdrawal_processed</code> - Withdrawal has been processed and sent</li>
              </ul>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Webhook Payload</h4>
            <CodeBlock 
              code={JSON.stringify({
                "event": "session_completed",
                "timestamp": 1709740800000,
                "data": {
                  "sessionId": "sess_abc123",
                  "playerId": "player_123",
                  "amount": "100",
                  "token": "USDC",
                  "transactionHash": "5xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
                }
              }, null, 2)} 
              language="json"
              title="Webhook Payload Example"
            />
          </div>

          <CodeBlock 
            code={`// Webhook handler example (Node.js/Express)
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-omnipay-signature'];
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
            The API uses standard HTTP status codes to indicate success or failure. Error responses include a JSON body with additional details.
          </p>
          
          <div className="space-y-4">
            <div className="border-l-4 border-white pl-4">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">400 Bad Request</h4>
              <CodeBlock 
                code={JSON.stringify({
                  "error": "Invalid request parameters",
                  "code": "INVALID_PARAMS"
                }, null, 2)} 
                language="json"
              />
            </div>
            
            <div className="border-l-4 border-gray-400 pl-4">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">401 Unauthorized</h4>
              <CodeBlock 
                code={JSON.stringify({
                  "error": "Invalid or missing API key",
                  "code": "UNAUTHORIZED"
                }, null, 2)} 
                language="json"
              />
            </div>
            
            <div className="border-l-4 border-gray-600 pl-4">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">404 Not Found</h4>
              <CodeBlock 
                code={JSON.stringify({
                  "error": "Resource not found",
                  "code": "NOT_FOUND"
                }, null, 2)} 
                language="json"
              />
            </div>
            
            <div className="border-l-4 border-white pl-4">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">429 Too Many Requests</h4>
              <CodeBlock 
                code={JSON.stringify({
                  "error": "Rate limit exceeded",
                  "code": "RATE_LIMITED"
                }, null, 2)} 
                language="json"
              />
            </div>
            
            <div className="border-l-4 border-gray-400 pl-4">
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
            API requests are limited to 1000 requests per minute per API key. Rate limit information is included in response headers.
          </p>
          
          <div className="space-y-3 mb-4">
            <div>
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Rate Limit Headers</h4>
              <ul className="text-[var(--color-text-secondary)] text-sm space-y-1 font-mono">
                <li>• <code>X-RateLimit-Limit</code> - Maximum requests per minute</li>
                <li>• <code>X-RateLimit-Remaining</code> - Remaining requests in current window</li>
                <li>• <code>X-RateLimit-Reset</code> - Unix timestamp when limit resets</li>
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