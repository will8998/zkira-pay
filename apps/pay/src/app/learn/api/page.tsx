'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/PageHeader';
import { CodeBlock } from '@/components/learn/CodeBlock';
export default function APIReferencePage() {
  const t = useTranslations('omnipayApiPage');
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
            <h1 className="text-2xl font-medium text-[var(--color-text-primary)] mb-4">{t('login_title')}</h1>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
              {t('login_desc')}
            </p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login_placeholder')}
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--border-subtle)] text-[var(--color-text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--color-text-primary)] transition-colors"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                {t('login_button')}
              </button>
              
              {error && (
                <p className="text-red-400 text-sm">{error === 'Invalid password' ? t('login_error') : error}</p>
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
        title={t('title')}
        description={t('description')}
      />

      {/* Getting Started */}
      <section id="getting-started" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">{t('gettingStarted_title')}</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('gettingStarted_desc1')}
          </p>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {t('gettingStarted_desc2')}
          </p>
        </div>
      </section>

      {/* Authentication */}
      <section id="authentication" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">{t('auth_title')}</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('auth_desc')}
          </p>
          
          <CodeBlock 
            code="X-API-Key: your_api_key_here" 
            language="http"
            title={t('auth_codeTitle')}
          />
          
          <p className="text-[var(--color-text-secondary)] text-[11px] mt-3">
            {t('auth_note')}
          </p>
        </div>
      </section>

      {/* Base URL */}
      <section id="base-url" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">{t('baseUrl_title')}</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('baseUrl_desc')}
          </p>
          <CodeBlock 
            code="https://omnipay.club/api" 
            language="url"
            title={t('baseUrl_codeTitle')}
          />
        </div>
      </section>

      {/* Create Payment Session */}
      <section id="create-session" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">{t('createSession_title')}</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('createSession_desc')}
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
              title={t('createSession_requestCodeTitle')}
            />
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('response')}</h4>
            <CodeBlock 
              code={JSON.stringify({
                "sessionId": "sess_abc123",
                "depositUrl": "https://omnipay.club/deposit/sess_abc123",
                "status": "pending",
                "expiresAt": "2026-03-06T15:30:00Z"
              }, null, 2)} 
              language="json"
              title={t('createSession_responseCodeTitle')}
            />
          </div>
        </div>
      </section>

      {/* Get Session Status */}
      <section id="get-session" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">{t('getSession_title')}</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('getSession_desc')}
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
              title={t('getSession_responseCodeTitle')}
            />
          </div>
        </div>
      </section>

      {/* Create Withdrawal */}
      <section id="create-withdrawal" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">{t('createWithdrawal_title')}</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('createWithdrawal_desc')}
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
              title={t('createWithdrawal_requestCodeTitle')}
            />
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('response')}</h4>
            <CodeBlock 
              code={JSON.stringify({
                "withdrawalId": "wd_xyz789",
                "status": "pending_approval",
                "createdAt": "2026-03-06T14:30:00Z"
              }, null, 2)} 
              language="json"
              title={t('createWithdrawal_responseCodeTitle')}
            />
          </div>
        </div>
      </section>

      {/* Webhooks */}
      <section id="webhooks" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">{t('webhooks_title')}</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('webhooks_desc')}
          </p>
          
          <div className="space-y-4 mb-6">
            <div>
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('webhooks_eventTypes')}</h4>
              <ul className="text-[var(--color-text-secondary)] text-sm space-y-1">
                <li>• <code>session_completed</code> - {t('webhooks_sessionCompleted')}</li>
                <li>• <code>withdrawal_processed</code> - {t('webhooks_withdrawalProcessed')}</li>
              </ul>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('webhooks_payloadTitle')}</h4>
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
              title={t('webhooks_payloadCodeTitle')}
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
            title={t('webhooks_handlerCodeTitle')}
          />
        </div>
      </section>

      {/* Error Responses */}
      <section id="errors" className="mb-8">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 mb-6">
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">{t('errors_title')}</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('errors_desc')}
          </p>
          
          <div className="space-y-4">
            <div className="border-l-4 border-white pl-4">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('errors_400')}</h4>
              <CodeBlock 
                code={JSON.stringify({
                  "error": "Invalid request parameters",
                  "code": "INVALID_PARAMS"
                }, null, 2)} 
                language="json"
              />
            </div>
            
            <div className="border-l-4 border-gray-400 pl-4">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('errors_401')}</h4>
              <CodeBlock 
                code={JSON.stringify({
                  "error": "Invalid or missing API key",
                  "code": "UNAUTHORIZED"
                }, null, 2)} 
                language="json"
              />
            </div>
            
            <div className="border-l-4 border-gray-600 pl-4">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('errors_404')}</h4>
              <CodeBlock 
                code={JSON.stringify({
                  "error": "Resource not found",
                  "code": "NOT_FOUND"
                }, null, 2)} 
                language="json"
              />
            </div>
            
            <div className="border-l-4 border-white pl-4">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('errors_429')}</h4>
              <CodeBlock 
                code={JSON.stringify({
                  "error": "Rate limit exceeded",
                  "code": "RATE_LIMITED"
                }, null, 2)} 
                language="json"
              />
            </div>
            
            <div className="border-l-4 border-gray-400 pl-4">
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('errors_500')}</h4>
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
          <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-4">{t('rateLimit_title')}</h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
            {t('rateLimit_desc')}
          </p>
          
          <div className="space-y-3 mb-4">
            <div>
              <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('rateLimit_headers')}</h4>
              <ul className="text-[var(--color-text-secondary)] text-sm space-y-1 font-mono">
                <li>• <code>X-RateLimit-Limit</code> - {t('rateLimit_limit')}</li>
                <li>• <code>X-RateLimit-Remaining</code> - {t('rateLimit_remaining')}</li>
                <li>• <code>X-RateLimit-Reset</code> - {t('rateLimit_reset')}</li>
              </ul>
            </div>
          </div>

          <CodeBlock 
            code={`HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1709744000`} 
            language="http"
            title={t('rateLimit_codeTitle')}
          />
        </div>
      </section>
    </div>
  );
}