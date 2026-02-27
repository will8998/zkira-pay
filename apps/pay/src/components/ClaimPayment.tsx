'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from './WalletProvider';
import { PublicKey } from '@solana/web3.js';
import { ZkiraClient } from '@zkira/sdk';
import { PAYMENT_ESCROW_PROGRAM_ID } from '@zkira/common';
import { hexToBytes } from '@zkira/crypto';
import { PaymentSuccess } from './PaymentSuccess';
import { toast } from 'sonner';
interface ClaimPaymentProps {
  escrowAddress: string;
  claimSecret: string;
}

interface EscrowData {
  creator: PublicKey;
  tokenMint: PublicKey;
  amount: bigint;
  expiry: number;
  claimed: boolean;
  refunded: boolean;
}

export function ClaimPayment({ escrowAddress, claimSecret }: ClaimPaymentProps) {
  const { connected, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [escrowData, setEscrowData] = useState<EscrowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Fetch escrow data on mount
  useEffect(() => {
    async function fetchEscrow() {
      try {
        setLoading(true);
        setError(null);
        
        let escrowPubkey: PublicKey;
        try {
          escrowPubkey = new PublicKey(escrowAddress);
        } catch {
          setError('Invalid payment link — bad escrow address');
          setLoading(false);
          return;
        }
        
        const accountInfo = await connection.getAccountInfo(escrowPubkey);
        
        if (!accountInfo) {
          setError('Payment not found');
          return;
        }
        
        if (accountInfo.owner.toBase58() !== PAYMENT_ESCROW_PROGRAM_ID.toBase58()) {
          setError('Payment not found — account is not a valid escrow');
          return;
        }
        
        // Deserialize escrow data
        const data = accountInfo.data;
        let offset = 8; // skip discriminator
        const creator = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
        const tokenMint = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
        const view = new DataView(data.buffer, data.byteOffset);
        const amount = view.getBigUint64(offset, true); offset += 8;
        // skip claim_hash (32), recipient_spend (32), recipient_view (32)
        offset += 96;
        const expiry = Number(view.getBigInt64(offset, true)); offset += 8;
        const claimed = data[offset] === 1; offset += 1;
        const refunded = data[offset] === 1;
        
        setEscrowData({ creator, tokenMint, amount, expiry, claimed, refunded });
      } catch (err) {
        console.error('Error fetching escrow:', err);
        if (err instanceof RangeError) {
          setError('Payment not found — invalid account data');
        } else if (err instanceof Error && err.message.includes('Invalid public key')) {
          setError('Invalid payment link — bad escrow address');
        } else {
          setError('Failed to load payment details. Please check your connection.');
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchEscrow();
  }, [escrowAddress, connection]);

  const handleClaim = async () => {
    if (!connected || !publicKey || !signTransaction || !escrowData) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let escrowPubkey: PublicKey;
      try {
        escrowPubkey = new PublicKey(escrowAddress);
      } catch {
        setError('Invalid payment link — bad escrow address');
        setIsLoading(false);
        return;
      }
      
      const walletAdapter = { publicKey, signTransaction };
      const zkiraClient = new ZkiraClient(connection, walletAdapter);
      const claimSecretBytes = hexToBytes(claimSecret);
      
      // Pre-flight: verify escrow is still claimable
      const preflightInfo = await connection.getAccountInfo(escrowPubkey);
      if (!preflightInfo) {
        setError('Payment escrow no longer exists on-chain');
        setIsLoading(false);
        return;
      }
      const result = await zkiraClient.claimPayment({
        escrowAddress: escrowPubkey,
        claimSecret: claimSecretBytes,
      });
      
      setTxSignature(result.txSignature);
      setClaimed(true);
      toast.success('Payment claimed successfully');
      
      // Record claimed transaction in localStorage
      try {
        const existing = JSON.parse(localStorage.getItem('zkira_transactions') || '[]');
        existing.push({
          txSignature: result.txSignature,
          amount: String(escrowData.amount),
          tokenMint: escrowData.tokenMint.toBase58(),
          timestamp: new Date().toISOString(),
          type: 'received',
          status: 'claimed',
        });
        localStorage.setItem('zkira_transactions', JSON.stringify(existing));
      } catch (e) {
        console.error('Failed to save transaction:', e);
      }
    } catch (err) {
      console.error('Error claiming payment:', err);
      setError('Failed to claim payment. Please try again.');
      toast.error('Failed to claim payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (claimed && txSignature) {
    return <PaymentSuccess type="claimed" txSignature={txSignature} />;
  }

  // Handle loading state
  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 md:px-0">
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-8 text-center">
          <svg className="animate-spin h-8 w-8 text-[var(--color-muted)] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-[var(--color-text-secondary)]">Loading payment details...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 md:px-0">
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-8 text-center">
          <svg className="w-12 h-12 text-[var(--color-red)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">Error</h3>
          <p className="text-[var(--color-red)]">{error}</p>
        </div>
      </div>
    );
  }

  // Handle no escrow data
  if (!escrowData) {
    return (
      <div className="max-w-lg mx-auto px-4 md:px-0">
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-8 text-center">
          <p className="text-[var(--color-text-secondary)]">No payment data available</p>
        </div>
      </div>
    );
  }

  // Check if payment is already claimed
  if (escrowData.claimed) {
    return (
      <div className="max-w-lg mx-auto px-4 md:px-0">
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-8 text-center">
          <svg className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">Already Claimed</h3>
          <p className="text-[var(--color-text-secondary)]">This payment has already been claimed.</p>
        </div>
      </div>
    );
  }

  // Check if payment is refunded
  if (escrowData.refunded) {
    return (
      <div className="max-w-lg mx-auto px-4 md:px-0">
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-8 text-center">
          <svg className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">Payment Refunded</h3>
          <p className="text-[var(--color-text-secondary)]">This payment has been refunded to the sender.</p>
        </div>
      </div>
    );
  }

  // Check if payment is expired
  const now = Math.floor(Date.now() / 1000);
  const isExpired = escrowData.expiry < now;

  if (isExpired) {
    return (
      <div className="max-w-lg mx-auto px-4 md:px-0">
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-8 text-center">
          <svg className="w-12 h-12 text-[var(--color-red)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">Payment Expired</h3>
          <p className="text-[var(--color-red)]">This payment link has expired and can no longer be claimed.</p>
        </div>
      </div>
    );
  }

  // Format amount for display (assuming 6 decimals for most tokens)
  const displayAmount = (Number(escrowData.amount) / 1_000_000).toFixed(6);
  const tokenAddress = escrowData.tokenMint.toBase58();
  const creatorAddress = escrowData.creator.toBase58();

  return (
    <div className="max-w-lg mx-auto px-4 md:px-0">
      {/* Error display */}
      {error && (
        <div className="bg-[var(--color-error-bg)] border border-[var(--color-error-border)] p-4 mb-6">
          <p className="text-[var(--color-red)] text-sm">{error}</p>
        </div>
      )}

      {/* Escrow Details Card */}
      <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-8 mb-6">
        <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-text)] mb-6 tracking-tight">Payment Details</h2>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-[var(--color-border)]">
            <span className="text-[var(--color-text-secondary)]">Amount</span>
            <span className="text-2xl font-semibold text-[var(--color-text)]">
              {displayAmount} tokens
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-[var(--color-border)]">
            <span className="text-[var(--color-text-secondary)]">Token</span>
            <span className="text-[var(--color-text)] font-mono text-sm">
              {tokenAddress.slice(0, 8)}...{tokenAddress.slice(-4)}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-[var(--color-border)]">
            <span className="text-[var(--color-text-secondary)]">Sender</span>
            <span className="text-[var(--color-text)] font-mono text-sm">{creatorAddress.slice(0, 8)}...{creatorAddress.slice(-4)}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-[var(--color-border)]">
            <span className="text-[var(--color-text-secondary)]">Expires</span>
            <span className="text-[var(--color-text)]">
              {new Date(escrowData.expiry * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-[var(--color-text-secondary)]">Status</span>
            <span className="px-3 py-1 bg-[var(--color-green)] bg-opacity-10 text-[var(--color-green)] text-sm font-medium">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Action Area */}
{!connected ? (
  <div className="bg-[var(--color-hover)] border border-[var(--color-border)] p-4 md:p-6 text-center">
    <p className="text-[var(--color-text-secondary)]">Connect your wallet using the sidebar to claim this payment.</p>
  </div>
) : (
  <div className="space-y-4">
    <div className="bg-[var(--color-hover)] border border-[var(--color-border)] p-4">
      <p className="text-[var(--color-text-secondary)] text-sm mb-1">Claiming to wallet</p>
      <p className="text-[var(--color-text)] font-mono text-sm truncate">
        {publicKey?.toBase58()}
      </p>
    </div>

    <button
      onClick={handleClaim}
      disabled={isLoading}
      className="w-full px-6 py-4 bg-[var(--color-green)] text-[var(--color-bg)] border border-[var(--color-green)] hover:bg-[var(--color-green-hover)] hover:border-[var(--color-green-hover)] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5 text-[var(--color-bg)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Claiming Payment...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Claim Payment</span>
        </>
      )}
    </button>

    <p className="text-[var(--color-muted)] text-xs text-center">
      Claimer pays gas fees. You'll need a small amount of SOL for the transaction.
    </p>
  </div>
)}
    </div>
  );
}
