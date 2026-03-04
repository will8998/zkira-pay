'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useWallet, useConnection } from '@/components/WalletProvider';
import { PublicKey } from '@solana/web3.js';
import { ZkiraClient } from '@zkira/sdk';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { generateMetaAddress, encodeMetaAddress } from '@zkira/crypto';
import { CreatePaymentForm } from '@/components/CreatePaymentForm';
import { PaymentSuccess } from '@/components/PaymentSuccess';
import { PageHeader } from '@/components/PageHeader';
import { encryptAndStore, storeEncryptedData, retrieveEncryptedData } from '@/lib/payment-link-crypto';

export default function CreatePage() {
  const t = useTranslations('createPage');
  const tCommon = useTranslations('common');
  const { connected, publicKey, signTransaction, signMessage } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdAmount, setCreatedAmount] = useState<string>('');

  const handleSubmit = async (data: {
    amount: string;
    tokenMint: string;
    expiry: string;
  }) => {
    if (!publicKey || !signTransaction) {
      setError('Wallet not connected. Please connect using the sidebar.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const walletAdapter = {
        publicKey,
        signTransaction,
      };

      const zkiraClient = new ZkiraClient(connection, walletAdapter);

      const { spendPubkey, viewPubkey } = generateMetaAddress();
      const recipientMetaAddress = encodeMetaAddress(spendPubkey, viewPubkey);

      const amount = BigInt(Math.floor(parseFloat(data.amount) * 1_000_000));
      const tokenMint = new PublicKey(data.tokenMint);
      const expirySeconds = parseInt(data.expiry) * 24 * 60 * 60;

      const result = await zkiraClient.createPaymentLink({
        recipientMetaAddress,
        amount,
        tokenMint,
        expirySeconds,
      });

      // Encrypt and store transaction in localStorage
      try {
        if (signMessage) {
          const existing = await retrieveEncryptedData<any>('zkira_transactions', signMessage, publicKey.toBase58()) || [];
          existing.push({
            type: 'sent',
            amount: String(amount),
            tokenMint: data.tokenMint,
            txSignature: 'pending',
            escrowAddress: result.escrowAddress.toBase58(),
            timestamp: new Date().toISOString(),
            status: 'pending',
          });
          await storeEncryptedData('zkira_transactions', existing, signMessage, publicKey.toBase58());
        }
      } catch (e) {
        // Fallback to unencrypted if encryption fails
        try {
          const existing = JSON.parse(localStorage.getItem('zkira_transactions') || '[]');
          existing.push({
            type: 'sent',
            amount: String(amount),
            tokenMint: data.tokenMint,
            txSignature: 'pending',
            escrowAddress: result.escrowAddress.toBase58(),
            timestamp: new Date().toISOString(),
            status: 'pending',
          });
          localStorage.setItem('zkira_transactions', JSON.stringify(existing));
        } catch (fallbackErr) {
          // Silent fallback
        }
      }

      // Encrypt and store payment link in localStorage
      try {
        if (signMessage) {
          const paymentLinks = await retrieveEncryptedData<any>('zkira_payment_links', signMessage, publicKey.toBase58()) || [];
          paymentLinks.push({
            escrowAddress: result.escrowAddress.toBase58(),
            paymentUrl: `${window.location.origin}${result.paymentUrl}`,
            createdAt: new Date().toISOString(),
          });
          await storeEncryptedData('zkira_payment_links', paymentLinks, signMessage, publicKey.toBase58());
        }
      } catch (e) {
        // Fallback to unencrypted if encryption fails
        try {
          const paymentLinks = JSON.parse(localStorage.getItem('zkira_payment_links') || '[]');
          paymentLinks.push({
            escrowAddress: result.escrowAddress.toBase58(),
            paymentUrl: `${window.location.origin}${result.paymentUrl}`,
            createdAt: new Date().toISOString(),
          });
          localStorage.setItem('zkira_payment_links', JSON.stringify(paymentLinks));
        } catch (fallbackErr) {
          // Silent fallback
        }
      }

      // Encrypt and store on server (non-blocking, best-effort)
      // Falls back silently to localStorage-only for hardware wallets
      if (signMessage) {
        encryptAndStore({
          walletAddress: publicKey.toBase58(),
          escrowAddress: result.escrowAddress.toBase58(),
          paymentUrl: `${window.location.origin}${result.paymentUrl}`,
          signMessage,
        }).catch((err) => {
          console.warn('Failed to encrypt+store payment link (localStorage fallback active):', err);
        });
      }

      setPaymentUrl(`${window.location.origin}${result.paymentUrl}`);
      setCreatedAmount(data.amount);
      toast.success(t('paymentCreated'));
    } catch (err) {
      console.error('Failed to create payment:', err);
      setError(getErrorMessage(err));
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (paymentUrl) {
    return (
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-2xl mx-auto animate-fade-in">
        <PageHeader title={t('title')} description={t('successDescription')} />
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 md:p-6">
          <PaymentSuccess type="created" paymentUrl={paymentUrl} amount={createdAmount} senderAddress={publicKey?.toBase58()} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-2xl mx-auto animate-fade-in">
      <PageHeader title={t('title')} description={t('description')} />

      {!connected && (
        <div className="border-l-2 border-[var(--color-green)] bg-[var(--color-surface)] px-4 py-3 mb-6">
          <p className="text-[var(--color-text-secondary)] text-sm">{t('connectNotice')}</p>
        </div>
      )}

      {error && (
        <div className="border-l-2 border-[var(--color-red)] bg-[rgba(255,40,40,0.08)] px-4 py-3 mb-6">
          <p className="text-[var(--color-red)] text-sm">{error}</p>
        </div>
      )}

      <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 md:p-6">
        <CreatePaymentForm onSubmit={handleSubmit} isLoading={isLoading} disabled={!connected} />
      </div>
    </div>
  );
}
