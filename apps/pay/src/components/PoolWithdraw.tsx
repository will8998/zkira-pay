'use client';

import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { ShieldedPoolClient, PoolConfig, PoolNote } from '@zkira/sdk';
import { useWallet, useConnection } from '@/components/WalletProvider';
import { useNetwork, getUsdcMint } from '@/lib/network-config';
import { retrieveEncryptedData, storeEncryptedData } from '@/lib/payment-link-crypto';
import ConfirmDialog from '@/components/ConfirmDialog';
import { toast } from 'sonner';

interface StoredNote extends PoolNote {
  id: string;
  depositTx: string;
  depositDate: string;
  denomination: string;
  spent: boolean;
}

export function PoolWithdraw() {
  const { connection } = useConnection();
  const { wallet, connected, signMessage } = useWallet();
  const { network } = useNetwork();
  
  const [savedNotes, setSavedNotes] = useState<StoredNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [withdrawalComplete, setWithdrawalComplete] = useState<string | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Pool configuration (devnet defaults)
  const poolConfig: PoolConfig = {
    poolAddress: new PublicKey('6g5RquPcpe81VzB6CtmuS8pzbXs7nZ5CT7gZt4fLKedx'),
    tokenMint: new PublicKey(getUsdcMint(network)),
    denomination: BigInt(10_000_000), // 10 USDC (6 decimals)
    circuitWasmUrl: '/circuits/withdraw.wasm',
    circuitZkeyUrl: '/circuits/withdraw_final.zkey',
  };

  // Load saved notes on wallet connection
  useEffect(() => {
    loadSavedNotes();
  }, [wallet, connected, signMessage]);

  // Set default recipient to connected wallet
  useEffect(() => {
    if (connected && wallet && !recipientAddress) {
      setRecipientAddress(wallet.publicKey.toString());
    }
  }, [connected, wallet, recipientAddress]);

  const loadSavedNotes = async () => {
    if (!wallet || !signMessage) {
      setSavedNotes([]);
      return;
    }

    try {
      setLoadingNotes(true);
      const storageKey = `zkira_pool_notes_${wallet.publicKey.toString()}`;
      const notes = await retrieveEncryptedData<StoredNote[]>(storageKey, signMessage, wallet.publicKey.toString());
      setSavedNotes(notes?.filter(note => !note.spent) || []);
    } catch (error) {
      console.warn('Failed to load saved notes:', error);
      setSavedNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  };

  const selectedNote = savedNotes.find(note => note.id === selectedNoteId);

  const handleWithdraw = async () => {
    if (!connected || !wallet || !signMessage || !selectedNote) return;

    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(recipientAddress);
    } catch {
      toast.error('Invalid recipient address');
      return;
    }

    try {
      setIsWithdrawing(true);
      setIsGeneratingProof(true);

      // Show proof generation progress
      toast.info('Generating zero-knowledge proof...', { duration: 3000 });

      const client = new ShieldedPoolClient(connection, wallet, poolConfig);
      
      // The withdraw method handles proof generation internally (~3 seconds)
      const result = await client.withdraw(selectedNote, recipientPubkey);

      setIsGeneratingProof(false);

      // Mark note as spent
      const updatedNotes = savedNotes.map(note => 
        note.id === selectedNoteId ? { ...note, spent: true } : note
      );
      const storageKey = `zkira_pool_notes_${wallet.publicKey.toString()}`;
      await storeEncryptedData(storageKey, updatedNotes, signMessage, wallet.publicKey.toString());

      // Update UI
      setSavedNotes(updatedNotes.filter(note => !note.spent));
      setSelectedNoteId('');
      setWithdrawalComplete(result.txSignature);

      toast.success('Withdrawal queued successfully!');

    } catch (error) {
      console.warn('Withdrawal failed:', error);
      let errorMessage = 'Withdrawal failed';
      
      if (error instanceof Error) {
        if (error.message.includes('nullifier')) {
          errorMessage = 'This note has already been spent';
        } else if (error.message.includes('paused')) {
          errorMessage = 'Pool is currently paused';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
      setIsGeneratingProof(false);
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (withdrawalComplete) {
    return (
      <div className="space-y-6">
        {/* Success State */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-green)] p-6 rounded-xl text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-bold text-[var(--color-text)] mb-2 uppercase tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>
            Withdrawal Queued
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">
            Your withdrawal has been successfully queued. Funds will arrive within <strong>~1 hour</strong> due to batched processing for enhanced privacy.
          </p>
          
          <div className="bg-[var(--color-hover)] border border-[var(--color-border)] p-4 rounded-lg mb-4">
            <span className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wide block mb-1">Transaction ID</span>
            <span className="text-[var(--color-text)] font-semibold text-xs break-all" style={{ fontFamily: 'var(--font-mono)' }}>
              {withdrawalComplete}
            </span>
          </div>

          <button
            onClick={() => setWithdrawalComplete(null)}
            className="px-6 py-2 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-medium transition-colors btn-press"
          >
            Make Another Withdrawal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Note Selection */}
      <div className="bg-[var(--bg-card)] border border-[var(--color-border)] p-6 rounded-xl">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-4 uppercase tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>
          Select Note to Withdraw
        </h3>
        
        {loadingNotes ? (
          <div className="flex items-center justify-center py-8 text-[var(--color-text-secondary)]">
            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading notes...
          </div>
        ) : savedNotes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-[var(--color-text-secondary)] text-sm">
              No available notes found. Make a deposit first to withdraw from the shielded pool.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={`w-full p-4 text-left border rounded-lg transition-colors ${
                  selectedNoteId === note.id
                    ? 'border-[var(--color-button)] bg-[var(--color-hover)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-button)] hover:bg-[var(--color-hover)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[var(--color-text)]">
                        {note.denomination} USDC
                      </span>
                      <span className="text-xs text-[var(--color-text-secondary)]" style={{ fontFamily: 'var(--font-mono)' }}>
                        Leaf #{note.leafIndex}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Deposited: {new Date(note.depositDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedNoteId === note.id
                      ? 'border-[var(--color-button)] bg-[var(--color-button)]'
                      : 'border-[var(--color-border)]'
                  }`}>
                    {selectedNoteId === note.id && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recipient Address */}
      {selectedNote && (
        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] p-6 rounded-xl">
          <h3 className="text-sm font-medium text-[var(--color-text)] mb-4 uppercase tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>
            Withdrawal Address
          </h3>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Solana address (defaults to your wallet)"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-3 min-h-[44px] focus:border-[var(--color-button)] focus:ring-0 focus:outline-none transition-colors font-[family-name:var(--font-mono)] text-sm"
            />
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              Funds will be sent to this address. Defaults to your connected wallet.
            </p>
          </div>
        </div>
      )}

      {/* Withdraw Button */}
      {selectedNote && (
        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] p-6 rounded-xl">
          {isGeneratingProof && (
            <div className="mb-4 p-4 bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-[var(--color-warning-text)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div>
                  <div className="text-sm font-medium text-[var(--color-warning-text)]">
                    Generating zero-knowledge proof...
                  </div>
                  <div className="text-xs text-[var(--color-warning-text)] opacity-75">
                    This may take up to 3 seconds
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowConfirmDialog(true)}
            disabled={isWithdrawing || !selectedNote || !recipientAddress.trim()}
            className="w-full px-6 py-4 min-h-[48px] bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-press"
          >
            {isWithdrawing ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Withdrawing...</span>
              </>
            ) : (
              <>
                <span>💸</span>
                <span>Withdraw {selectedNote?.denomination} USDC</span>
              </>
            )}
          </button>

          <div className="mt-4 p-3 bg-[var(--color-hover)] border border-[var(--color-border)] rounded-lg">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span>⏰</span>
              <span>Funds will arrive within ~1 hour due to batched processing</span>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onCancel={() => setShowConfirmDialog(false)}
        onConfirm={handleWithdraw}
        title="Confirm Withdrawal"
        description={`You are about to withdraw ${selectedNote?.denomination} USDC from the shielded pool. This will generate a zero-knowledge proof and queue your withdrawal for batched processing.`}
        confirmLabel="Confirm Withdrawal"
        confirmVariant="default"
      />
    </div>
  );
}