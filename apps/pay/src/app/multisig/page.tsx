'use client';

import { useState, useEffect } from 'react';
import InfoTooltip from '@/components/InfoTooltip';
import { useWallet, useConnection } from '@/components/WalletProvider';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { createApproveReleaseIx, createExecuteReleaseIx, createRefundMultisigEscrowIx } from '@zkira/sdk';
import { MULTISIG_ESCROW_PROGRAM_ID } from '@zkira/common';
import { bytesToHex, hexToBytes } from '@zkira/crypto';
import { MultisigEscrowView } from '@/components/MultisigEscrowView';
import { PageHeader } from '@/components/PageHeader';
import Link from 'next/link';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import ConfirmDialog from '@/components/ConfirmDialog';



interface MultisigEscrowData {
  address: PublicKey;
  creator: PublicKey;
  tokenMint: PublicKey;
  amount: bigint;
  recipientSpendPubkey: Uint8Array;
  recipientViewPubkey: Uint8Array;
  claimHash: Uint8Array;
  expiry: number;
  approverCount: number;
  requiredApprovals: number;
  currentApprovals: number;
  approvers: PublicKey[];
  approvalBitmap: number;
  released: boolean;
  refunded: boolean;
  nonce: bigint;
  feeBps: number;
  createdAt: number;
}

export default function MultisigPage() {
  const { connected, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [escrows, setEscrows] = useState<MultisigEscrowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingRefundAddress, setPendingRefundAddress] = useState<PublicKey | null>(null);
  const [pendingApproveAddress, setPendingApproveAddress] = useState<PublicKey | null>(null);

  useEffect(() => {
    const loadEscrows = async () => {
      if (!connected || !publicKey) {
        setEscrows([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get all multisig escrow accounts for this program
        const accounts = await connection.getProgramAccounts(MULTISIG_ESCROW_PROGRAM_ID, {
          filters: [
            {
              memcmp: {
                offset: 8, // Skip 8-byte discriminator
                bytes: publicKey.toBase58(), // Filter by creator
              },
            },
          ],
        });

        // Deserialize each account
        const escrowData: MultisigEscrowData[] = [];
        for (const { pubkey, account } of accounts) {
          try {
            const data = account.data;
            let offset = 8; // Skip discriminator

            // Parse on-chain data layout
            const creator = new PublicKey(data.slice(offset, offset + 32));
            offset += 32;
            const tokenMint = new PublicKey(data.slice(offset, offset + 32));
            offset += 32;
            const amount = data.readBigUInt64LE(offset);
            offset += 8;
            const claimHash = data.slice(offset, offset + 32);
            offset += 32;
            const recipientSpendPubkey = data.slice(offset, offset + 32);
            offset += 32;
            const recipientViewPubkey = data.slice(offset, offset + 32);
            offset += 32;
            const expiry = Number(data.readBigInt64LE(offset));
            offset += 8;
            const nonce = data.readBigUInt64LE(offset);
            offset += 8;
            const approverCount = data.readUInt8(offset);
            offset += 1;
            const requiredApprovals = data.readUInt8(offset);
            offset += 1;
            const currentApprovals = data.readUInt8(offset);
            offset += 1;
            const released = data.readUInt8(offset) === 1;
            offset += 1;
            const refunded = data.readUInt8(offset) === 1;
            offset += 1;
            const feeBps = data.readUInt16LE(offset);
            offset += 2;

            // Parse approvers array
            const approvers: PublicKey[] = [];
            for (let i = 0; i < approverCount; i++) {
              approvers.push(new PublicKey(data.slice(offset, offset + 32)));
              offset += 32;
            }

            // Skip approval_flags for now
            
            escrowData.push({
              address: pubkey,
              creator,
              tokenMint,
              amount,
              recipientSpendPubkey: new Uint8Array(recipientSpendPubkey),
              recipientViewPubkey: new Uint8Array(recipientViewPubkey),
              claimHash: new Uint8Array(claimHash),
              expiry,
              approverCount,
              requiredApprovals,
              currentApprovals,
              approvers,
              approvalBitmap: 0,
              released,
              refunded,
              nonce,
              feeBps,
              createdAt: expiry - (30 * 24 * 60 * 60),
            });
          } catch (parseErr) {
            console.warn('Failed to parse escrow account:', pubkey.toString(), parseErr);
          }
        }

        setEscrows(escrowData);
      } catch (err) {
        console.error('Failed to load escrows:', err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadEscrows();
  }, [connected, publicKey, connection]);

  const handleApprove = async (escrowAddress: PublicKey) => {
    if (!publicKey) return;

    try {
      if (!publicKey || !signTransaction) return;

      // Build approve instruction
      const approveIx = createApproveReleaseIx({
        approver: publicKey,
        escrowAddress,
      });

      // Build and send transaction
      const transaction = new Transaction().add(approveIx);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTx = await signTransaction(transaction);
      const txid = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(txid);

      // Update local state
      setEscrows(prev => prev.map(escrow => 
        escrow.address.equals(escrowAddress) 
          ? { ...escrow, currentApprovals: escrow.currentApprovals + 1 }
          : escrow
      ));
    } catch (err) {
      console.error('Failed to approve:', err);
      toast.error(getErrorMessage(err));
    }
  };

  const handleExecute = async (escrowAddress: PublicKey, claimSecret: Uint8Array) => {
    if (!publicKey) return;

    try {
      if (!publicKey || !signTransaction) return;

      // Get claim secret from localStorage
      const claimSecretHex = sessionStorage.getItem(`escrow_${escrowAddress.toBase58()}_claim_secret`);
      if (!claimSecretHex) {
        setError('Claim secret not found. Cannot execute release.');
        return;
      }

      const claimSecretBytes = hexToBytes(claimSecretHex);

      // Find the escrow data to get token mint and creator
      const escrow = escrows.find(e => e.address.equals(escrowAddress));
      if (!escrow) {
        setError('Escrow not found');
        return;
      }

      // Get claimer's token account
      const claimerTokenAccount = await getAssociatedTokenAddress(escrow.tokenMint, publicKey);

      // For now, use creator as fee recipient (in production, this would be protocol fee account)
      const feeRecipientTokenAccount = await getAssociatedTokenAddress(escrow.tokenMint, escrow.creator);

      // Build execute instruction
      const executeIx = createExecuteReleaseIx({
        claimer: publicKey,
        claimerTokenAccount,
        escrowAddress,
        claimSecret: claimSecretBytes,
        feeRecipientTokenAccount,
        tokenMint: escrow.tokenMint,
        creator: escrow.creator,
      });

      // Build and send transaction
      const transaction = new Transaction().add(executeIx);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTx = await signTransaction(transaction);
      const txid = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(txid);
      
      toast.success('Release executed successfully');

      // Update local state
      setEscrows(prev => prev.map(escrow => 
        escrow.address.equals(escrowAddress) 
          ? { ...escrow, released: true }
          : escrow
      ));
    } catch (err) {
      console.error('Failed to execute release:', err);
      toast.error(getErrorMessage(err));
    }
  };

  const handleRefund = async (escrowAddress: PublicKey) => {
    if (!publicKey) return;

    try {
      if (!publicKey || !signTransaction) return;

      // Find the escrow data to get token mint
      const escrow = escrows.find(e => e.address.equals(escrowAddress));
      if (!escrow) {
        setError('Escrow not found');
        return;
      }

      // Get creator's token account
      const creatorTokenAccount = await getAssociatedTokenAddress(escrow.tokenMint, publicKey);

      // Build refund instruction
      const refundIx = createRefundMultisigEscrowIx({
        creator: publicKey,
        creatorTokenAccount,
        escrowAddress,
        tokenMint: escrow.tokenMint,
      });

      // Build and send transaction
      const transaction = new Transaction().add(refundIx);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTx = await signTransaction(transaction);
      const txid = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(txid);
      
      toast.success('Escrow refunded successfully');

      // Update local state
      setEscrows(prev => prev.map(escrow => 
        escrow.address.equals(escrowAddress) 
          ? { ...escrow, refunded: true }
          : escrow
      ));
    } catch (err) {
      console.error('Failed to refund:', err);
      toast.error(getErrorMessage(err));
    }
  };

  const handleRefundClick = async (escrowAddress: PublicKey) => {
    setPendingRefundAddress(escrowAddress);
  };

  const handleApproveClick = async (escrowAddress: PublicKey) => {
    setPendingApproveAddress(escrowAddress);
  };

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 max-w-5xl mx-auto animate-entrance">
      <PageHeader
        title={<span>Multi-sig Escrows<InfoTooltip text="Multi-signature requires multiple wallet approvals before funds are released. Adds an extra layer of security for high-value transactions." /></span>}
        description="Manage escrows requiring multiple approvals"
        actionLabel="Create New"
        actionHref="/multisig/create"
      />
      
      <a href="/developers/docs" className="text-[11px] text-[var(--color-green)] hover:text-[var(--color-green-hover)] -mt-4 mb-4 inline-block transition-colors">Learn more about multi-sig →</a>
      {/* Wallet Connection Notice */}
      {!connected && (
        <div className="border-l-2 border-[var(--color-green)] bg-[var(--color-surface)] px-4 py-3 mb-6">
          <p className="text-[var(--color-text-secondary)] text-sm">Connect your wallet to view escrows where you're a creator or approver.</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="border-l-2 border-[var(--color-red)] bg-[rgba(255,40,40,0.08)] px-4 py-3 mb-6">
          <p className="text-[var(--color-red)] text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && connected && (
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

      {/* Escrows List */}
      {!loading && connected && (
        <div className="bg-[var(--color-surface)] border border-[var(--border-subtle)] rounded-none animate-entrance">
          {escrows.length === 0 ? (
            <div className="p-6 md:p-12 text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-[var(--color-section-label)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[var(--color-text)] text-lg font-medium">No multi-sig escrows found</p>
              <p className="text-[var(--color-muted)] text-sm mt-1 mb-6">Create your first multi-sig escrow to get started</p>
              <Link
                href="/multisig/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] font-medium transition-colors text-sm btn-press"
              >
                Create Multi-sig Escrow
              </Link>
            </div>
          ) : (
            <div className="p-4 md:p-6 space-y-4">
              {escrows.map((escrow) => (
                <MultisigEscrowView
                  key={escrow.address.toString()}
                  escrow={escrow}
                  currentUser={publicKey}
                  onApprove={handleApproveClick}
                  onExecute={handleExecute}
                  onRefund={handleRefundClick}
                />
              ))}
            </div>
          )}
        </div>
      )}


      <ConfirmDialog
        open={pendingRefundAddress !== null}
        onConfirm={() => {
          if (pendingRefundAddress) {
            handleRefund(pendingRefundAddress);
            setPendingRefundAddress(null);
          }
        }}
        onCancel={() => setPendingRefundAddress(null)}
        title="Refund Escrow"
        description="This will return all funds to the creator wallet. This cannot be undone."
        confirmLabel="Refund"
        confirmVariant="danger"
      />

      <ConfirmDialog
        open={pendingApproveAddress !== null}
        onConfirm={() => {
          if (pendingApproveAddress) {
            handleApprove(pendingApproveAddress);
            setPendingApproveAddress(null);
          }
        }}
        onCancel={() => setPendingApproveAddress(null)}
        title="Approve Release"
        description="Your approval will be recorded on-chain. Once the required number of approvals is met, funds can be released."
        confirmLabel="Approve"
        confirmVariant="default"
      />
    </div>

  );
}
