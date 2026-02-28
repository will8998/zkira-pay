'use client';

import { useState } from 'react';
import { useWallet, useConnection } from './WalletProvider';
import { useBalance } from './useBalance';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { createCreatePaymentIx } from '@zkira/sdk';
import { decodeMetaAddress, hexToBytes } from '@zkira/crypto';
import { PaymentSuccess } from './PaymentSuccess';
import { toast } from 'sonner';
import { useNetwork, getUsdcMint } from '@/lib/network-config';
interface PayInvoiceProps {
  amount: string;
  recipientMetaAddress: string;
  claimHashHex: string;
  expiryDays: string;
}

export function PayInvoice({ amount, recipientMetaAddress, claimHashHex, expiryDays }: PayInvoiceProps) {
  const { connected, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { network } = useNetwork();
  const { sol, usdc, loading: balanceLoading, error: balanceError } = useBalance();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const handlePayInvoice = async () => {
    if (!connected || !publicKey || !signTransaction) return;

    try {
      setIsLoading(true);
      setError(null);

      // Decode meta address to get recipient keys
      const { spendPubkey, viewPubkey } = decodeMetaAddress(recipientMetaAddress);
      
      // Convert claim hash from hex to bytes
      const claimHash = hexToBytes(claimHashHex);
      
      // USDC devnet mint
      const tokenMint = new PublicKey(getUsdcMint(network));
      
      // Convert amount to lamports (USDC has 6 decimals)
      const amountLamports = BigInt(Math.floor(parseFloat(amount) * 1_000_000));
      
      // Generate random nonce
      const nonce = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
      
      // Calculate expiry timestamp
      const expiryTimestamp = Math.floor(Date.now() / 1000) + (parseInt(expiryDays) * 24 * 60 * 60);
      
      // Get creator's token account
      const creatorTokenAccount = await getAssociatedTokenAddress(tokenMint, publicKey);

      // Create the instruction
      const ix = createCreatePaymentIx({
        creator: publicKey,
        creatorTokenAccount,
        tokenMint,
        amount: amountLamports,
        claimHash,
        recipientSpendPubkey: spendPubkey,
        recipientViewPubkey: viewPubkey,
        expiry: expiryTimestamp,
        nonce,
      });

      // Create transaction
      const tx = new Transaction().add(ix);
      
      // Get recent blockhash and set fee payer
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;

      // Sign transaction
      const signedTx = await signTransaction(tx);

      // Send and confirm transaction
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      setTxSignature(signature);
      setPaid(true);
      toast.success('Payment sent successfully');
      
      // Record invoice payment in localStorage
      try {
        const existing = JSON.parse(localStorage.getItem('zkira_transactions') || '[]');
        existing.push({
          type: 'sent',
          amount: String(BigInt(Math.floor(parseFloat(amount) * 1_000_000))),
          tokenMint: getUsdcMint(network),
          txSignature: signature,
          timestamp: new Date().toISOString(),
          status: 'completed',
        });
        localStorage.setItem('zkira_transactions', JSON.stringify(existing));
      } catch (e) {
        console.error('Failed to save transaction:', e);
      }
    } catch (err) {
      console.error('Error paying invoice:', err);
      setError('Failed to pay invoice. Please try again.');
      toast.error('Failed to pay invoice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (paid && txSignature) {
    return <PaymentSuccess type="invoice_paid" txSignature={txSignature} amount={amount} />;
  }

  const networkFee = '~0.01 SOL';
  const claimFeePercentage = 0.30;
  const claimFee = (parseFloat(amount) * claimFeePercentage / 100).toFixed(6);

  return (
    <div className="max-w-lg mx-auto px-4 md:px-0">
      {/* Error display */}
      {error && (
        <div className="bg-[var(--color-error-bg)] border border-[var(--color-error-border)] p-4 mb-6">
          <p className="text-[var(--color-red)] text-sm">{error}</p>
        </div>
      )}

      {/* Balance error display */}
      {balanceError && (
        <div className="bg-[var(--color-error-bg)] border border-[var(--color-error-border)] p-4 mb-6">
          <p className="text-[var(--color-red)] text-sm">{balanceError}</p>
        </div>
      )}

      {/* Invoice Details Card */}
      <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-8 mb-6">
        <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-text)] mb-6 tracking-tight">Invoice Details</h2>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-[var(--color-border)]">
            <span className="text-[var(--color-text-secondary)]">Amount</span>
            <span className="text-xl md:text-2xl font-semibold text-[var(--color-text)]">
              ${amount} USDC
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-[var(--color-border)]">
            <span className="text-[var(--color-text-secondary)]">Expires in</span>
            <span className="text-[var(--color-text)]">
              {expiryDays} days
            </span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-[var(--color-text-secondary)]">Status</span>
            <span className="px-3 py-1 bg-[var(--color-success-bg)] text-[var(--color-green)] text-sm font-medium rounded-full border border-[var(--color-green)]/20">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Wallet Balance Display */}
      {connected && (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Wallet Balance</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-text-secondary)]">SOL</span>
              <span className="text-[var(--color-text)] font-mono">
                {balanceLoading ? '...' : sol?.toFixed(4) || '0.0000'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-text-secondary)]">USDC</span>
              <span className="text-[var(--color-text)] font-mono">
                {balanceLoading ? '...' : usdc?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Fee Breakdown */}
      <div className="border border-[var(--color-border)] bg-[var(--color-hover)] p-4 md:p-6 mb-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Fee Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-secondary)]">Amount</span>
            <span className="text-[var(--color-text)]">${amount} USDC</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-secondary)]">Network fee</span>
            <span className="text-[var(--color-text)]">{networkFee}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-secondary)]">Claim fee (0.3%)</span>
            <span className="text-[var(--color-text)]">${claimFee} USDC</span>
          </div>
        </div>
      </div>

      {/* Action Area */}
      {!connected ? (
        <div className="bg-[var(--color-hover)] border border-[var(--color-border)] p-4 md:p-6 text-center">
          <p className="text-[var(--color-text-secondary)]">Connect your wallet using the sidebar to pay this invoice.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[var(--color-hover)] border border-[var(--color-border)] p-4">
            <p className="text-[var(--color-text-secondary)] text-sm mb-1">Paying from wallet</p>
            <p className="text-[var(--color-text)] font-mono text-sm truncate break-all">
              {publicKey?.toBase58()}
            </p>
          </div>

          <button
            onClick={handlePayInvoice}
            disabled={isLoading || balanceLoading || !usdc || usdc < parseFloat(amount)}
            className="w-full px-6 py-4 bg-[var(--color-button)] text-[var(--color-bg)] border border-[var(--color-button)] hover:bg-[var(--color-button-hover)] hover:border-[var(--color-button-hover)] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-[var(--color-bg)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Paying Invoice...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Pay Invoice</span>
              </>
            )}
          </button>

          {connected && usdc !== null && usdc < parseFloat(amount) && (
            <p className="text-[var(--color-red)] text-xs text-center">
              Insufficient USDC balance. You need ${amount} USDC but only have ${usdc.toFixed(2)} USDC.
            </p>
          )}

          <p className="text-[var(--color-text-muted)] text-xs text-center">
            Payer covers network fees. You'll need a small amount of SOL for the transaction.
          </p>
        </div>
      )}
    </div>
  );
}