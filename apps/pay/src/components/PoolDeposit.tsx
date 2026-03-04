'use client';

import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { ShieldedPoolClient, PoolConfig, PoolNote } from '@zkira/sdk';
import { useWallet, useConnection } from '@/components/WalletProvider';
import { useNetwork, getUsdcMint } from '@/lib/network-config';
import { useBalance } from '@/components/useBalance';
import ConfirmDialog from '@/components/ConfirmDialog';
import { storeEncryptedData } from '@/lib/payment-link-crypto';
import { toast } from 'sonner';

export function PoolDeposit() {
  const { connection } = useConnection();
  const { wallet, connected, signMessage } = useWallet();
  const { network } = useNetwork();
  const { usdc, loading: balanceLoading } = useBalance();
  
  const [isDepositing, setIsDepositing] = useState(false);
  const [generatedNote, setGeneratedNote] = useState<PoolNote | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [depositTx, setDepositTx] = useState<string>('');

  // Pool configuration (devnet defaults)
  const poolConfig: PoolConfig = {
    poolAddress: new PublicKey('6g5RquPcpe81VzB6CtmuS8pzbXs7nZ5CT7gZt4fLKedx'),
    tokenMint: new PublicKey(getUsdcMint(network)),
    denomination: BigInt(10_000_000), // 10 USDC (6 decimals)
    circuitWasmUrl: '/circuits/withdraw.wasm',
    circuitZkeyUrl: '/circuits/withdraw_final.zkey',
  };

  const denomination = Number(poolConfig.denomination) / 1_000_000; // Convert to USDC
  const hasEnoughBalance = usdc !== null && usdc >= denomination;

  const handleDeposit = async () => {
    if (!connected || !wallet || !signMessage) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!hasEnoughBalance) {
      toast.error(`Insufficient USDC balance. Need ${denomination} USDC.`);
      return;
    }

    try {
      setIsDepositing(true);
      
      const client = new ShieldedPoolClient(connection, wallet, poolConfig);
      const result = await client.deposit(poolConfig.tokenMint);
      
      // Store deposit information
      const noteWithMetadata = {
        ...result.note,
        depositTx: result.txSignature,
        depositDate: new Date().toISOString(),
        denomination: denomination.toString(),
        spent: false,
      };

      setGeneratedNote(noteWithMetadata);
      setDepositTx(result.txSignature);
      
      toast.success('Deposit successful! Please save your note securely.');
      
    } catch (error) {
      console.warn('Deposit failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Deposit failed';
      toast.error(errorMessage);
    } finally {
      setIsDepositing(false);
    }
  };

  const saveNote = async () => {
    if (!generatedNote || !wallet || !signMessage) return;

    try {
      const storageKey = `zkira_pool_notes_${wallet.publicKey.toString()}`;
      
      // Get existing notes
      const existingNotes = await getStoredNotes();
      
      // Add new note
      const newNotes = [
        ...existingNotes,
        {
          ...generatedNote,
          id: `note_${Date.now()}`,
        }
      ];

      // Store encrypted
      await storeEncryptedData(storageKey, newNotes, signMessage, wallet.publicKey.toString());
      
      toast.success('Note saved securely to your wallet storage');
      
      // Reset state
      setGeneratedNote(null);
      setDepositTx('');
      
    } catch (error) {
      console.warn('Failed to save note:', error);
      toast.error('Failed to save note. Please copy it manually!');
    }
  };

  const getStoredNotes = async (): Promise<any[]> => {
    if (!wallet || !signMessage) return [];
    
    try {
      const { retrieveEncryptedData } = await import('@/lib/payment-link-crypto');
      const storageKey = `zkira_pool_notes_${wallet.publicKey.toString()}`;
      const notes = await retrieveEncryptedData<any[]>(storageKey, signMessage, wallet.publicKey.toString());
      return notes || [];
    } catch {
      return [];
    }
  };

  const copyNote = () => {
    if (!generatedNote) return;
    
    const noteData = {
      nullifier: generatedNote.nullifier.toString(),
      secret: generatedNote.secret.toString(),
      commitment: generatedNote.commitment.toString(),
      leafIndex: generatedNote.leafIndex,
      depositTx,
      depositDate: generatedNote.depositDate,
      denomination: generatedNote.denomination,
    };
    
    navigator.clipboard.writeText(JSON.stringify(noteData));
    toast.success('Note copied to clipboard');
  };

  if (generatedNote) {
    return (
      <div className="space-y-6">
        {/* Success State - Show Generated Note */}
        <div className="bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-lg font-bold text-[var(--color-warning-text)] uppercase tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>
                CRITICAL: Save Your Note
              </h3>
              <p className="text-sm text-[var(--color-warning-text)] opacity-80">
                If you lose this note, your funds are unrecoverable
              </p>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-lg mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wide block mb-1">Amount</span>
                <span className="text-[var(--color-text)] font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>
                  {denomination} USDC
                </span>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wide block mb-1">Leaf Index</span>
                <span className="text-[var(--color-text)] font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>
                  #{generatedNote.leafIndex}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wide block mb-1">Transaction</span>
                <span className="text-[var(--color-text)] font-semibold text-xs break-all" style={{ fontFamily: 'var(--font-mono)' }}>
                  {depositTx}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveNote}
              className="flex-1 px-4 py-3 bg-[var(--color-green)] text-black hover:bg-[var(--color-green-hover)] font-medium transition-colors btn-press flex items-center justify-center gap-2"
            >
              <span>💾</span>
              Save Note Securely
            </button>
            <button
              onClick={copyNote}
              className="px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-hover)] font-medium transition-colors btn-press flex items-center gap-2"
            >
              <span>📋</span>
              Copy
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance Display */}
      {connected && (
        <div className="border border-[var(--color-border)] bg-[var(--color-hover)] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] font-medium">Wallet Balance</span>
          <div className="text-sm">
            {balanceLoading ? (
              <span className="text-[var(--color-text-secondary)]">Loading...</span>
            ) : (
              <span className="text-[var(--color-text)] font-medium tabular-nums">
                {usdc !== null ? usdc.toFixed(2) : '—'} USDC
              </span>
            )}
          </div>
        </div>
      )}

      {/* Deposit Information */}
      <div className="bg-[var(--bg-card)] border border-[var(--color-border)] p-6 rounded-xl">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-4xl">🛡️</div>
            <div className="text-left">
              <h3 className="text-2xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-mono)' }}>
                {denomination} USDC
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">Fixed denomination</p>
            </div>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
            Deposit {denomination} USDC to the shielded pool for private transactions. You'll receive a note that allows you to withdraw later.
          </p>
        </div>

        {/* Privacy Features */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[var(--color-green)]">✓</span>
            <span className="text-[var(--color-text-secondary)]">Zero-knowledge proofs hide your transaction history</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[var(--color-green)]">✓</span>
            <span className="text-[var(--color-text-secondary)]">Fixed denominations prevent amount-based linking</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[var(--color-green)]">✓</span>
            <span className="text-[var(--color-text-secondary)]">Anonymity set protects your privacy</span>
          </div>
        </div>

        {/* Deposit Button */}
        <button
          onClick={() => setShowConfirmDialog(true)}
          disabled={isDepositing || !connected || !hasEnoughBalance}
          className="w-full px-6 py-4 min-h-[48px] bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-press"
        >
          {isDepositing ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing Deposit...</span>
            </>
          ) : (
            <>
              <span>🛡️</span>
              <span>Deposit {denomination} USDC to Shielded Pool</span>
            </>
          )}
        </button>

        {!connected && (
          <p className="text-center text-sm text-[var(--color-text-secondary)] mt-3">
            Connect your wallet to deposit
          </p>
        )}

        {connected && !hasEnoughBalance && (
          <p className="text-center text-sm text-[var(--color-red)] mt-3">
            Insufficient balance. Need {denomination} USDC.
          </p>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onCancel={() => setShowConfirmDialog(false)}
        onConfirm={handleDeposit}
        title="Confirm Shielded Deposit"
        description={`You are about to deposit ${denomination} USDC to the shielded pool. You will receive a note that must be saved securely to withdraw your funds later.`}
        confirmLabel="Confirm Deposit"
        confirmVariant="default"
      />
    </div>
  );
}