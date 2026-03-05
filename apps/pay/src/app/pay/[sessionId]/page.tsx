'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

// Session type definition
interface PaymentSession {
  id: string;
  status: string;
  amount: string;
  token: string;
  chain: string;
  ephemeralWallet: string | null;
  expiresAt: string;
  createdAt: string;
}


// Countdown timer component
function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ minutes, seconds });
      } else {
        setTimeLeft({ minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!timeLeft) {
    return <div className="text-[var(--color-text-secondary)] text-sm">Loading...</div>;
  }

  const isExpired = timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div className={`text-sm font-mono tabular-nums ${isExpired ? 'text-[var(--color-red)]' : 'text-[var(--color-text)]'}`}>
      {isExpired ? 'EXPIRED' : `${timeLeft.minutes.toString().padStart(2, '0')}:${timeLeft.seconds.toString().padStart(2, '0')}`}
    </div>
  );
}

export default function PaymentSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [polling, setPolling] = useState(false);

  // Fetch session data
  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`/api/gateway/sessions/${sessionId}/public`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('SESSION_NOT_FOUND');
        } else {
          setError('FETCH_ERROR');
        }
        return;
      }
      
      const sessionData = await response.json();
      setSession(sessionData);
      setError(null);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('NETWORK_ERROR');
    }
  }, [sessionId]);

  // Initial fetch
  useEffect(() => {
    fetchSession().finally(() => setLoading(false));
  }, [fetchSession]);

  // Set up polling for status updates
  useEffect(() => {
    if (!session || session.status !== 'pending') return;

    setPolling(true);
    const interval = setInterval(async () => {
      await fetchSession();
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(interval);
      setPolling(false);
    };
  }, [session, fetchSession]);

  // Copy to clipboard functionality
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  // Set page title
  useEffect(() => {
    document.title = 'OMNIPAY - Payment';
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] p-8 max-w-md w-full animate-fade-in">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 mx-auto">
              <div className="w-full h-full border-2 border-[var(--border-subtle)] border-t-[var(--color-text)] rounded-full animate-spin"></div>
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm">Loading payment session...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error states
  if (error === 'SESSION_NOT_FOUND') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] p-8 max-w-md w-full text-center animate-fade-in">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-mono)]">
            Session Not Found
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm">
            The payment session you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] p-8 max-w-md w-full text-center animate-fade-in">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-mono)]">
            Connection Error
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mb-4">
            Unable to load payment session. Please check your connection and try again.
          </p>
          <button
            onClick={() => {
              setLoading(true);
              fetchSession().finally(() => setLoading(false));
            }}
            className="bg-[var(--color-button)] text-[var(--color-button-text)] px-4 py-2 text-sm font-semibold hover:bg-[var(--color-button-hover)] transition-colors btn-press rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Check if session is expired
  const isExpired = new Date() > new Date(session.expiresAt);

  // Session expired state
  if (isExpired || session.status === 'expired') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] p-8 max-w-md w-full text-center animate-fade-in">
          <div className="text-4xl mb-4">⏰</div>
          <h1 className="text-xl font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-mono)]">
            Session Expired
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm">
            This payment session has expired. Please request a new payment link.
          </p>
        </div>
      </div>
    );
  }

  // Payment confirmed state
  if (session.status === 'confirmed' || session.status === 'completed') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] p-8 max-w-md w-full text-center animate-fade-in">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-semibold text-[var(--color-text)] mb-2 font-[family-name:var(--font-mono)]">
            Payment Received
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mb-4">
            Your payment of {session.amount} {session.token} has been successfully received and confirmed.
          </p>
          <div className="text-xs text-[var(--color-text-tertiary)] font-mono">
            Session: {session.id}
          </div>
        </div>
      </div>
    );
  }

  // Main payment interface for pending sessions
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] p-8 max-w-lg w-full animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-[var(--color-text)] flex items-center justify-center text-black font-bold text-sm">
              OP
            </div>
            <span className="text-lg font-semibold text-[var(--color-text)] font-[family-name:var(--font-mono)]">
              OMNIPAY
            </span>
          </div>
          <p className="text-[var(--color-text-secondary)] text-xs">
            Secure Payment Gateway
          </p>
        </div>

        {/* Payment Details */}
        <div className="space-y-6">
          {/* Amount and Token */}
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--color-text)] mb-2 font-[family-name:var(--font-mono)] tabular-nums">
              Send {session.amount} {session.token}
            </div>
            <div className="inline-flex items-center gap-2 bg-[var(--color-hover)] px-3 py-1 text-xs">
              <div className="w-2 h-2 bg-[var(--color-text)] rounded-full"></div>
              <span className="text-[var(--color-text-secondary)]">on {session.chain}</span>
            </div>
          </div>

          {/* Deposit Address */}
          {session.ephemeralWallet && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-[var(--color-text)] mb-2">
                Deposit Address
              </h3>
              <div 
                className="bg-[var(--color-bg)] border border-[var(--border-subtle)] p-4 cursor-pointer hover:border-[var(--border-subtle-hover)] transition-colors group relative"
                onClick={() => copyToClipboard(session.ephemeralWallet!)}
              >
                <div className="font-mono text-xs text-[var(--color-text)] break-all">
                  {session.ephemeralWallet}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--color-bg)] bg-opacity-90">
                  <span className="text-xs text-[var(--color-text-secondary)]">Click to copy</span>
                </div>
              </div>
              {copyFeedback && (
                <div className="text-center text-xs text-[var(--color-text)] animate-fade-in">
                  {copyFeedback}
                </div>
              )}
            </div>
          )}

          {/* QR Code */}
          {session.ephemeralWallet && (
            <div className="flex justify-center">
              <div className="inline-block p-4 bg-white rounded-xl">
                <QRCodeSVG value={session.ephemeralWallet} size={180} level="M" />
              </div>
            </div>
          )}

          {/* Status and Timer */}
          <div className="bg-[var(--color-hover)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[var(--color-text)] rounded-full animate-pulse-green"></div>
                <span className="text-sm text-[var(--color-text-secondary)]">
                  Waiting for payment...
                </span>
              </div>
              {polling && (
                <div className="w-3 h-3 border border-[var(--border-subtle)] border-t-[var(--color-text)] rounded-full animate-spin"></div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-tertiary)]">
                Session expires in:
              </span>
              <CountdownTimer expiresAt={session.expiresAt} />
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-[var(--color-text-secondary)] space-y-2 leading-relaxed">
            <p>
              <strong className="text-[var(--color-text)]">Instructions:</strong>
            </p>
            <ol className="space-y-1 ml-4 list-decimal">
              <li>Copy the deposit address above or scan the QR code</li>
              <li>Send exactly {session.amount} {session.token} on {session.chain}</li>
              <li>Wait for network confirmation (this page will update automatically)</li>
            </ol>
          </div>

          {/* Session ID */}
          <div className="pt-4 border-t border-[var(--border-subtle)] text-center">
            <div className="text-xs text-[var(--color-text-tertiary)] font-mono">
              Session: {session.id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}