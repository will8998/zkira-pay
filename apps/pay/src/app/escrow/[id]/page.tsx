'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useWallet, useConnection } from '@/components/WalletProvider';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { createReleaseMilestoneIx, createRefundUnreleasedIx } from '@zkira/sdk';
import { PublicKey, Transaction } from '@solana/web3.js';
import { MilestoneEscrowView } from '@/components/MilestoneEscrowView';
import { PageHeader } from '@/components/PageHeader';
import Link from 'next/link';
import { useNetwork, getUsdcMint } from '@/lib/network-config';

interface MilestoneEscrowData {
  id: string;
  creator: string;
  totalAmount: number;
  releasedAmount: number;
  tokenSymbol: string;
  expiry: Date;
  milestoneCount: number;
  milestonesReleased: number;
  milestones: {
    description: string;
    amount: number;
    released: boolean;
  }[];
  refunded: boolean;
  createdAt: Date;
}

export default function EscrowDetailPage() {
  const params = useParams();
  const escrowId = params.id as string;
  const { connected, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { network } = useNetwork();
  const [escrow, setEscrow] = useState<MilestoneEscrowData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (escrowId) {
      loadEscrow();
    }
  }, [escrowId]);

  const loadEscrow = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Parse escrow ID as PublicKey
      const escrowPubkey = new PublicKey(escrowId);
      
      // Load account info
      const accountInfo = await connection.getAccountInfo(escrowPubkey);
      
      if (!accountInfo || !accountInfo.data) {
        setEscrow(null);
        return;
      }
      
      const data = accountInfo.data;
      if (data.length < 8) {
        setEscrow(null);
        return;
      }
      
      // Skip 8-byte discriminator
      let offset = 8;
      
      // Deserialize account data
      const creator = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;
      
      const tokenMint = new PublicKey(data.slice(offset, offset + 32));
      offset += 32;
      
      const totalAmount = data.readBigUInt64LE(offset);
      offset += 8;
      
      const releasedAmount = data.readBigUInt64LE(offset);
      offset += 8;
      
      // Skip claim_hash (32 bytes)
      offset += 32;
      
      // Skip recipient_spend_pubkey (32 bytes)
      offset += 32;
      
      // Skip recipient_view_pubkey (32 bytes)
      offset += 32;
      
      const expiry = data.readBigInt64LE(offset);
      offset += 8;
      
      const nonce = data.readBigUInt64LE(offset);
      offset += 8;
      
      const milestoneCount = data.readUInt8(offset);
      offset += 1;
      
      const refunded = data.readUInt8(offset) === 1;
      offset += 1;
      
      // Read milestones
      const milestones = [];
      let milestonesReleased = 0;
      
      for (let i = 0; i < milestoneCount; i++) {
        const amount = data.readBigUInt64LE(offset);
        offset += 8;
        const released = data.readUInt8(offset) === 1;
        offset += 1;
        
        milestones.push({
          description: `Milestone ${i + 1}`,
          amount: Number(amount) / 1_000_000, // Convert from lamports to tokens
          released
        });
        
        if (released) milestonesReleased++;
      }
      
      setEscrow({
        id: escrowId,
        creator: creator.toBase58(),
        totalAmount: Number(totalAmount) / 1_000_000, // Convert from lamports to tokens
        releasedAmount: Number(releasedAmount) / 1_000_000,
        tokenSymbol: 'USDC', // Default to USDC for now
        expiry: new Date(Number(expiry) * 1000),
        milestoneCount,
        milestonesReleased,
        milestones,
        refunded,
        createdAt: new Date() // We don't have creation time on-chain
      });
    } catch (err) {
      console.error('Failed to load escrow:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load milestone escrow. Please check the URL and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleaseMilestone = async (escrowId: string, milestoneIndex: number) => {
    if (!escrow || !publicKey || !signTransaction) {
      setError('Wallet not connected or escrow not loaded');
      return;
    }

    try {
      const escrowPubkey = new PublicKey(escrowId);
      
      // For now, we'll need the claimer to provide their own keys and claim secret
      // This is a simplified implementation - in a real app, the claimer would have these
      const claimer = publicKey; // Assuming creator is also the claimer for demo
      const tokenMint = new PublicKey(getUsdcMint(network)); // USDC devnet
      
      const creatorAta = await getAssociatedTokenAddress(tokenMint, publicKey);
      const claimerAta = await getAssociatedTokenAddress(tokenMint, claimer);
      
      // For demo purposes, use a dummy claim secret
      // In reality, this would come from the payment link
      const claimSecret = new Uint8Array(32).fill(1);

      const ix = createReleaseMilestoneIx({
        creator: publicKey,
        creatorTokenAccount: creatorAta,
        claimer,
        claimerTokenAccount: claimerAta,
        escrowAddress: escrowPubkey,
        milestoneIndex,
        claimSecret,
        tokenMint
      });

      const transaction = new Transaction().add(ix);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature);
      
      // Update local state
      const newMilestones = [...escrow.milestones];
      newMilestones[milestoneIndex] = { ...newMilestones[milestoneIndex], released: true };
      
      setEscrow({
        ...escrow,
        milestones: newMilestones,
        milestonesReleased: escrow.milestonesReleased + 1,
        releasedAmount: escrow.releasedAmount + escrow.milestones[milestoneIndex].amount,
      });
    } catch (err) {
      console.error('Failed to release milestone:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to release milestone. Please try again.');
      }
    }
  };

  const handleRefundUnreleased = async (escrowId: string) => {
    if (!escrow || !publicKey || !signTransaction) {
      setError('Wallet not connected or escrow not loaded');
      return;
    }

    try {
      const escrowPubkey = new PublicKey(escrowId);
      const tokenMint = new PublicKey(getUsdcMint(network)); // USDC devnet
      const creatorAta = await getAssociatedTokenAddress(tokenMint, publicKey);

      const ix = createRefundUnreleasedIx({
        creator: publicKey,
        creatorTokenAccount: creatorAta,
        escrowAddress: escrowPubkey,
        tokenMint
      });

      const transaction = new Transaction().add(ix);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature);
      
      // Update local state
      setEscrow({ ...escrow, refunded: true });
    } catch (err) {
      console.error('Failed to refund unreleased funds:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to refund unreleased funds. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="px-6 py-6 max-w-5xl mx-auto animate-fade-in">
        <PageHeader title="Milestone Escrow" description="Loading escrow details..." />
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 animate-pulse">
          <div className="h-6 bg-[var(--color-hover)] rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-[var(--color-hover)] rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-[var(--color-hover)] rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !escrow) {
    return (
      <div className="px-6 py-6 max-w-5xl mx-auto animate-fade-in">
        <PageHeader title="Milestone Escrow" description={`Escrow ID: ${escrowId}`} />
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-12 text-center">
          <svg className="w-16 h-16 text-[var(--color-section-label)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">Escrow Not Found</h2>
          <p className="text-[var(--color-muted)] mb-6">
            {error || 'The milestone escrow you\'re looking for doesn\'t exist or has been removed.'}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={loadEscrow}
              className="px-4 py-2 bg-[var(--color-button)] text-[var(--color-button-text)] text-sm font-medium hover:bg-[var(--color-button-hover)] transition-colors btn-press"
            >
              Try Again
            </button>
            <Link
              href="/escrow"
              className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:border-[var(--color-text)] transition-colors"
            >
              View All Escrows
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Milestone Escrow" description={`Escrow ID: ${escrowId}`} />

      {/* Error Display */}
      {error && (
        <div className="border-l-2 border-[var(--color-red)] bg-[rgba(255,40,40,0.08)] px-4 py-3 mb-6">
          <p className="text-[var(--color-red)] text-sm">{error}</p>
        </div>
      )}

      {/* Escrow Details */}
      <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6">
        <MilestoneEscrowView
          escrows={[escrow]}
          onReleaseMilestone={handleReleaseMilestone}
          onRefundUnreleased={handleRefundUnreleased}
          isLoading={false}
        />
      </div>
    </div>
  );
}
