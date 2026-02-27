'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@/components/WalletProvider';
import PrivacyCallout from '@/components/PrivacyCallout';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { createCreateMilestoneEscrowIx, findMilestoneEscrow } from '@zkira/sdk';
import { generateClaimSecret, hashClaimSecret, bytesToHex, generateMetaAddress, encodeMetaAddress } from '@zkira/crypto';
import { CreateMilestoneEscrow } from '@/components/CreateMilestoneEscrow';
import { PaymentSuccess } from '@/components/PaymentSuccess';
import { PageHeader } from '@/components/PageHeader';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import InfoTooltip from '@/components/InfoTooltip';

interface MilestoneData {
  description: string;
  amount: string;
}

interface CreateMilestoneEscrowData {
  totalAmount: string;
  tokenMint: string;
  expiry: string;
  milestones: MilestoneData[];
}

export default function CreateMilestoneEscrowPage() {
  const { connected, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [escrowUrl, setEscrowUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateMilestoneEscrowData) => {
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

      const totalAmount = BigInt(Math.floor(parseFloat(data.totalAmount) * 1_000_000));
      const tokenMint = new PublicKey(data.tokenMint);
      const expirySeconds = parseInt(data.expiry) * 24 * 60 * 60;
      const milestoneAmounts = data.milestones.map(m => BigInt(Math.floor(parseFloat(m.amount) * 1_000_000)));

      // Generate claim secret and hash
      const claimSecret = generateClaimSecret();
      const claimHash = hashClaimSecret(claimSecret);

      // Generate nonce
      const nonce = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));

      // Get creator ATA
      const creatorAta = await getAssociatedTokenAddress(tokenMint, publicKey);

      // Create instruction
      const ix = createCreateMilestoneEscrowIx({
        creator: publicKey,
        creatorTokenAccount: creatorAta,
        tokenMint,
        totalAmount,
        claimHash,
        recipientSpendPubkey: spendPubkey,
        recipientViewPubkey: viewPubkey,
        expiry: Math.floor(Date.now() / 1000) + expirySeconds,
        nonce,
        milestoneAmounts,
      });

      // Build, sign, and send transaction
      const transaction = new Transaction().add(ix);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature);

      // Derive escrow address
      const [escrowAddress] = findMilestoneEscrow(publicKey, nonce);

      // Build claim URL with secret
      const secretHex = bytesToHex(claimSecret);

      // Save transaction to localStorage
      const transactions = JSON.parse(localStorage.getItem('zkira_transactions') || '[]');
      transactions.push({
        type: 'escrow_created',
        escrowAddress: escrowAddress.toBase58(),
        amount: data.totalAmount,
        tokenMint: data.tokenMint,
        timestamp: new Date().toISOString(),
        txSignature: signature
      });
      localStorage.setItem('zkira_transactions', JSON.stringify(transactions));

      setEscrowUrl(`${window.location.origin}/escrow/${escrowAddress.toBase58()}`);
      
      toast.success('Escrow created successfully');
    } catch (err) {
      console.error('Failed to create milestone escrow:', err);
      toast.error(getErrorMessage(err));
      setIsLoading(false);
    }
  };

  if (escrowUrl) {
    return (
      <div className="px-6 py-6 max-w-5xl mx-auto animate-entrance">
        <PageHeader title="Escrow Created" description="Your milestone escrow has been set up" />
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 animate-entrance">
          <PaymentSuccess type="created" paymentUrl={escrowUrl} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto animate-entrance">
      <PageHeader
        title={<span>Create Milestone Escrow<InfoTooltip text="An escrow holds funds in a smart contract until predefined conditions are met. Neither party can access funds unilaterally." /></span>}
        description="Release funds progressively as milestones are completed"
      />

      {/* Wallet Connection Notice */}
      {!connected && (
        <div className="border-l-2 border-[var(--color-green)] bg-[var(--color-surface)] px-4 py-3 mb-6">
          <p className="text-[var(--color-text-secondary)] text-sm">Connect your wallet to create a milestone escrow</p>
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
        <CreateMilestoneEscrow onSubmit={handleSubmit} isLoading={isLoading} disabled={!connected} />
        <div className="mt-6">
          <PrivacyCallout variant="compact" />
        </div>
      </div>
    </div>
  );
}
