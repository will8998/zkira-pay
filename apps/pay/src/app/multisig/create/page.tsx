'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@/components/WalletProvider';
import PrivacyCallout from '@/components/PrivacyCallout';
import InfoTooltip from '@/components/InfoTooltip';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { generateMetaAddress, encodeMetaAddress, generateClaimSecret, hashClaimSecret, bytesToHex } from '@zkira/crypto';
import { createCreateMultisigEscrowIx, findMultisigEscrow } from '@zkira/sdk';
import { CreateMultisigEscrow } from '@/components/CreateMultisigEscrow';
import { PaymentSuccess } from '@/components/PaymentSuccess';
import { PageHeader } from '@/components/PageHeader';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

export default function CreateMultisigPage() {
  const { connected, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [escrowUrl, setEscrowUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: {
    amount: string;
    tokenMint: string;
    expiry: string;
    requiredApprovals: number;
    approvers: string[];
  }) => {
    if (!publicKey || !signTransaction) {
      setError('Wallet not connected. Please connect using the button in the sidebar.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Auto-generate stealth meta-address (ephemeral — keys discarded after escrow creation)
      const { spendPubkey, viewPubkey } = generateMetaAddress();
      const recipientMetaAddress = encodeMetaAddress(spendPubkey, viewPubkey);

      const amount = BigInt(Math.floor(parseFloat(data.amount) * 1_000_000));
      const tokenMint = new PublicKey(data.tokenMint);
      const expirySeconds = parseInt(data.expiry) * 24 * 60 * 60;
      const approvers = data.approvers.map(addr => new PublicKey(addr));

      // Generate claim secret and hash
      const claimSecret = generateClaimSecret();
      const claimHash = hashClaimSecret(claimSecret);

      // Generate nonce (random 8-byte value)
      const nonce = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));

      // Get creator's associated token account
      const creatorTokenAccount = await getAssociatedTokenAddress(tokenMint, publicKey);

      // Build the create multisig escrow instruction
      const createIx = createCreateMultisigEscrowIx({
        creator: publicKey,
        creatorTokenAccount,
        tokenMint,
        amount,
        claimHash,
        recipientSpendPubkey: spendPubkey,
        recipientViewPubkey: viewPubkey,
        expiry: Math.floor(Date.now() / 1000) + expirySeconds,
        nonce,
        approverCount: approvers.length,
        requiredApprovals: data.requiredApprovals,
        approvers,
      });

      // Build and send transaction
      const transaction = new Transaction().add(createIx);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTx = await signTransaction(transaction);
      const txid = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(txid);

      // Derive escrow address
      const [escrowAddress] = findMultisigEscrow(publicKey, nonce);

      // Save claim secret to localStorage for later use
      sessionStorage.setItem(`escrow_${escrowAddress.toBase58()}_claim_secret`, bytesToHex(claimSecret));

      // Set the escrow URL
      setEscrowUrl(`${window.location.origin}/multisig/${escrowAddress.toBase58()}`);
      
      toast.success('Multi-sig escrow created successfully');
    } catch (err) {
      console.error('Failed to create multisig escrow:', err);
      toast.error(getErrorMessage(err));
      setIsLoading(false);
    }
  };

  if (escrowUrl) {
    return (
      <div className="px-6 py-6 max-w-5xl mx-auto animate-entrance">
        <PageHeader title="Escrow Created" description="Your multi-sig escrow has been set up" />
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 animate-entrance">
          <PaymentSuccess type="created" paymentUrl={escrowUrl} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto animate-entrance">
      <PageHeader
        title={<span>Create Multi-sig Escrow<InfoTooltip text="Multi-signature requires multiple wallet approvals before funds are released. Adds an extra layer of security for high-value transactions." /></span>}
        description="Require multiple approvals before payment release"
      />

      {/* Wallet Connection Notice */}
      {!connected && (
        <div className="border-l-2 border-[var(--color-green)] bg-[var(--color-surface)] px-4 py-3 mb-6">
          <p className="text-[var(--color-text-secondary)] text-sm">Connect your wallet to create a multi-sig escrow</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="border-l-2 border-[var(--color-red)] bg-[rgba(255,40,40,0.08)] px-4 py-3 mb-6">
          <p className="text-[var(--color-red)] text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 animate-entrance">
        <CreateMultisigEscrow onSubmit={handleSubmit} isLoading={isLoading} disabled={!connected} />
        <div className="mt-6">
          <PrivacyCallout variant="compact" />
        </div>
      </div>
    </div>
  );
}
