'use client';

import { useState, useEffect } from 'react';
import InfoTooltip from '@/components/InfoTooltip';
import { useWallet, useConnection } from '@/components/WalletProvider';
import { Transaction, Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { createReleaseMilestoneIx, createRefundUnreleasedIx } from '@zkira/sdk';
import { CONDITIONAL_ESCROW_PROGRAM_ID } from '@zkira/common';
import { MilestoneEscrowView } from '@/components/MilestoneEscrowView';
import { PageHeader } from '@/components/PageHeader';
import { toast } from 'sonner';
import { useNetwork, getUsdcMint } from '@/lib/network-config';
import { getErrorMessage } from '@/lib/errors';
import ConfirmDialog from '@/components/ConfirmDialog';



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

export default function EscrowPage() {
  const { connected, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { network } = useNetwork();
  const [escrows, setEscrows] = useState<MilestoneEscrowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRefundId, setPendingRefundId] = useState<string | null>(null);
  const [pendingRelease, setPendingRelease] = useState<{ escrowId: string; milestoneIndex: number } | null>(null);


  useEffect(() => {
    if (connected && publicKey) {
      loadEscrows();
    }
  }, [connected, publicKey]);

  const loadEscrows = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch escrows from on-chain conditional-escrow program
      const accounts = await connection.getProgramAccounts(CONDITIONAL_ESCROW_PROGRAM_ID);
      
      const escrowsData: MilestoneEscrowData[] = [];
      
      for (const account of accounts) {
        try {
          const data = account.account.data;
          if (data.length < 8) continue; // Skip if too small
          
          // Skip 8-byte discriminator
          let offset = 8;
          
          // Deserialize account data
          const creator = new PublicKey(data.slice(offset, offset + 32));
          offset += 32;
          
          // Only include escrows created by current user
          if (!creator.equals(publicKey!)) continue;
          
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
          
          escrowsData.push({
            id: account.pubkey.toBase58(),
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
          // Skip accounts that can't be deserialized
          console.warn('Failed to deserialize escrow account:', err);
          continue;
        }
      }
      
      setEscrows(escrowsData);
    } catch (err) {
      console.error('Failed to load escrows:', err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleaseMilestone = async (escrowId: string, milestoneIndex: number) => {
    if (!publicKey || !signTransaction) {
      setError('Wallet not connected');
      return;
    }

    try {
      const escrowPubkey = new PublicKey(escrowId);
      const escrow = escrows.find(e => e.id === escrowId);
      if (!escrow) {
        setError('Escrow not found');
        return;
      }

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
      
      toast.success('Milestone approved');
      
      // Update local state
      setEscrows(prev => prev.map(escrow => {
        if (escrow.id === escrowId) {
          const newMilestones = [...escrow.milestones];
          newMilestones[milestoneIndex] = { ...newMilestones[milestoneIndex], released: true };
          
          return {
            ...escrow,
            milestones: newMilestones,
            milestonesReleased: escrow.milestonesReleased + 1,
            releasedAmount: escrow.releasedAmount + escrow.milestones[milestoneIndex].amount,
          };
        }
        return escrow;
      }));
    } catch (err) {
      console.error('Failed to release milestone:', err);
      toast.error(getErrorMessage(err));
    }
  };

  const handleRefundUnreleased = async (escrowId: string) => {
    if (!publicKey || !signTransaction) {
      setError('Wallet not connected');
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
      
      toast.success('Funds refunded successfully');
      
      // Update local state
      setEscrows(prev => prev.map(escrow => {
        if (escrow.id === escrowId) {
          return { ...escrow, refunded: true };
        }
        return escrow;
      }));
    } catch (err) {
      console.error('Failed to refund unreleased funds:', err);
      toast.error(getErrorMessage(err));
    }
  };

  const handleReleaseMilestoneClick = async (escrowId: string, milestoneIndex: number) => {
    setPendingRelease({ escrowId, milestoneIndex });
  };

  const handleRefundUnreleasedClick = async (escrowId: string) => {
    setPendingRefundId(escrowId);
  };

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-5xl mx-auto animate-entrance">
      <PageHeader
        title={<span>Milestone Escrows<InfoTooltip text="An escrow holds funds in a smart contract until predefined conditions are met. Neither party can access funds unilaterally." /></span>}
        description="Manage your milestone-based payment escrows"
        actionLabel="Create New Escrow"
        actionHref="/escrow/create"
      />
      
      <a href="/developers/docs" className="text-[11px] text-[var(--color-green)] hover:text-[var(--color-green-hover)] -mt-4 mb-4 inline-block transition-colors">Learn more about escrows →</a>
      {/* Wallet Connection Notice */}
      {!connected && (
        <div className="border-l-2 border-[var(--color-green)] bg-[var(--color-surface)] px-4 py-3 mb-6">
          <p className="text-[var(--color-text-secondary)] text-sm">Connect your wallet to view and manage your milestone escrows. Only escrows you created will appear here.</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="border-l-2 border-[var(--color-red)] bg-[rgba(255,40,40,0.08)] px-4 py-3 mb-6">
          <p className="text-[var(--color-red)] text-sm">{error}</p>
          <button
            onClick={loadEscrows}
            className="text-[var(--color-red)] text-sm underline hover:no-underline mt-1"
          >
            Try again
          </button>
        </div>
      )}

      {/* Escrows List */}
      {/* Loading State */}
      {connected && isLoading && (
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-6 md:p-12 text-center animate-entrance">
          <div className="inline-flex items-center gap-2 text-[var(--color-muted)]">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading escrows...
          </div>
        </div>
      )}

      {/* Empty State */}
      {connected && !isLoading && escrows.length === 0 && (
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none animate-entrance">
          <div className="p-6 md:p-12 text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-[var(--color-section-label)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[var(--color-text)] text-lg font-medium">No milestone escrows yet</p>
            <p className="text-[var(--color-muted)] text-sm mt-1 mb-6">Create your first milestone escrow to release funds progressively</p>
            <a
              href="/escrow/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] font-medium transition-colors text-sm btn-press"
            >
              Create Milestone Escrow
            </a>
          </div>
        </div>
      )}

      {/* Escrows List */}
      {connected && !isLoading && escrows.length > 0 && (
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none p-4 md:p-6 animate-entrance">
          <MilestoneEscrowView
            escrows={escrows}
            onReleaseMilestone={handleReleaseMilestoneClick}
            onRefundUnreleased={handleRefundUnreleasedClick}
            isLoading={isLoading}
          />
        </div>
      )}

      <ConfirmDialog
        open={pendingRefundId !== null}
        onConfirm={() => {
          if (pendingRefundId) {
            handleRefundUnreleased(pendingRefundId);
            setPendingRefundId(null);
          }
        }}
        onCancel={() => setPendingRefundId(null)}
        title="Refund Unreleased Funds"
        description="This will return all unreleased milestone funds to your wallet. Released milestones cannot be reversed."
        confirmLabel="Refund Funds"
        confirmVariant="danger"
      />

      <ConfirmDialog
        open={pendingRelease !== null}
        onConfirm={() => {
          if (pendingRelease) {
            handleReleaseMilestone(pendingRelease.escrowId, pendingRelease.milestoneIndex);
            setPendingRelease(null);
          }
        }}
        onCancel={() => setPendingRelease(null)}
        title="Release Milestone"
        description="Funds for this milestone will be released to the recipient. This action cannot be undone."
        confirmLabel="Release"
        confirmVariant="default"
      />
    </div>
  );
}
