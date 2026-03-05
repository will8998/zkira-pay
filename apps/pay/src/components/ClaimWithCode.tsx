'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { deriveDeadDropId } from '@/lib/claim-code';
import { aesDecrypt } from '@/lib/dead-drop-crypto';
import type { DepositBundle, DepositNoteRecord } from '@/types/payment';
import { ReceiptManager, type PoolNote } from '@zkira/sdk';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

type ClaimStep = 'enter-code' | 'decrypt' | 'download' | 'complete';

interface ClaimWithCodeProps {
  /** Pre-filled code from URL query param. */
  initialCode?: string;
}

export function ClaimWithCode({ initialCode }: ClaimWithCodeProps) {
  const [step, setStep] = useState<ClaimStep>('enter-code');
  const [claimCode, setClaimCode] = useState(initialCode ?? '');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bundle, setBundle] = useState<DepositBundle | null>(null);
  const [downloadedCount, setDownloadedCount] = useState(0);
  const [receiptPassword, setReceiptPassword] = useState('');

  // Fetch and decrypt the dead drop
  const handleClaim = useCallback(async () => {
    if (!claimCode.trim() || !encryptionKey.trim()) {
      toast.error('Please enter both the claim code and password');
      return;
    }

    setIsLoading(true);
    try {
      // Derive dead drop ID from claim code
      const dropId = await deriveDeadDropId(claimCode.trim());

      // Fetch from API
      const response = await fetch(`${API_URL}/api/dead-drop/${dropId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Claim code not found');
        if (response.status === 410) throw new Error('Claim code expired');
        throw new Error('Failed to retrieve payment');
      }

      const data = await response.json();
      const payload = data.payload as { ciphertext: string; nonce: string; version: number };

      // Decrypt with AES-GCM
      const plaintext = await aesDecrypt(payload.ciphertext, payload.nonce, encryptionKey.trim());
      const decryptedBundle = JSON.parse(plaintext) as DepositBundle;

      setBundle(decryptedBundle);
      setStep('download');

      // Mark as claimed
      await fetch(`${API_URL}/api/dead-drop/${dropId}/claim`, { method: 'PATCH' });

      toast.success(`${decryptedBundle.notes.length} deposit note${decryptedBundle.notes.length !== 1 ? 's' : ''} decrypted!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to claim payment');
    } finally {
      setIsLoading(false);
    }
  }, [claimCode, encryptionKey]);

  // Download individual receipt
  const downloadReceipt = useCallback(async (note: DepositNoteRecord, index: number) => {
    if (!receiptPassword.trim()) {
      toast.error('Enter a password to encrypt your receipt');
      return;
    }

    try {
      const poolNote: PoolNote = {
        nullifier: BigInt(note.nullifier),
        secret: BigInt(note.secret),
        commitment: BigInt(note.commitment),
        leafIndex: note.leafIndex,
      };

      const receipt = await ReceiptManager.encrypt(
        poolNote,
        receiptPassword,
        note.pool,
        BigInt(note.denomination),
      );

      ReceiptManager.downloadReceipt(receipt, `zkira-receipt-${index + 1}.json`);
      setDownloadedCount((prev) => prev + 1);
      toast.success(`Receipt #${index + 1} downloaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create receipt');
    }
  }, [receiptPassword]);

  // Download all receipts
  const downloadAll = useCallback(async () => {
    if (!bundle || !receiptPassword.trim()) {
      toast.error('Enter a password first');
      return;
    }

    for (let i = 0; i < bundle.notes.length; i++) {
      await downloadReceipt(bundle.notes[i], i);
    }
    setStep('complete');
  }, [bundle, receiptPassword, downloadReceipt]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1
          className="text-3xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Claim Payment
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm">
          Enter the claim code and password you received from the sender.
        </p>
      </div>

      {/* Step: Enter Code */}
      {step === 'enter-code' && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl space-y-6">
            <div>
              <label
                className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Claim Code
              </label>
              <input
                type="text"
                value={claimCode}
                onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                placeholder="ZKIRA-XXXX-XXXX"
                className="w-full px-4 py-4 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] text-center text-xl tracking-widest placeholder-[var(--color-text-secondary)] focus:border-[var(--color-button)] focus:outline-none transition-colors"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Encryption Password
              </label>
              <input
                type="password"
                value={encryptionKey}
                onChange={(e) => setEncryptionKey(e.target.value)}
                placeholder="Paste the encryption password"
                className="w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:border-[var(--color-button)] focus:outline-none transition-colors"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          <button
            onClick={handleClaim}
            disabled={!claimCode.trim() || !encryptionKey.trim() || isLoading}
            className="w-full px-6 py-4 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-press flex items-center justify-center gap-2"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>CLAIMING...</span>
              </>
            ) : (
              'CLAIM PAYMENT →'
            )}
          </button>
        </div>
      )}

      {/* Step: Download Receipts */}
      {step === 'download' && bundle && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔓</div>
              <h2
                className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Payment Decrypted
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                {bundle.notes.length} deposit note{bundle.notes.length !== 1 ? 's' : ''} found.
                Download encrypted receipts to withdraw later.
              </p>
            </div>

            {/* Notes list */}
            <div className="space-y-2 mb-6">
              {bundle.notes.map((note, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-[var(--color-bg)] border border-[var(--color-border)] p-3 rounded"
                >
                  <span
                    className="text-sm text-[var(--color-text)]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    Note #{i + 1} — {note.chain}/{note.token}
                  </span>
                  <span className="text-sm text-[var(--color-green)]">✓ Decrypted</span>
                </div>
              ))}
            </div>

            {/* Receipt password */}
            <div className="bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] p-6 rounded-xl space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <h3
                    className="text-lg font-bold text-[var(--color-warning-text)] uppercase tracking-wide"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    SAVE YOUR RECEIPTS
                  </h3>
                  <p className="text-sm text-[var(--color-warning-text)] opacity-80">
                    Create a password to encrypt your withdrawal receipts
                  </p>
                </div>
              </div>

              <input
                type="password"
                value={receiptPassword}
                onChange={(e) => setReceiptPassword(e.target.value)}
                placeholder="Enter password for receipts"
                className="w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:border-[var(--color-button)] focus:outline-none transition-colors"
                style={{ fontFamily: 'var(--font-mono)' }}
              />

              <button
                onClick={downloadAll}
                disabled={!receiptPassword.trim()}
                className="w-full px-6 py-4 bg-[var(--color-green)] text-black hover:bg-[var(--color-green-hover)] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-press"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                💾 DOWNLOAD ALL RECEIPTS ({bundle.notes.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step: Complete */}
      {step === 'complete' && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2
              className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Receipts Downloaded
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Go to the Pool → Withdraw page and upload each receipt to withdraw your funds.
            </p>
          </div>

          <button
            onClick={() => {
              setStep('enter-code');
              setClaimCode('');
              setEncryptionKey('');
              setBundle(null);
              setDownloadedCount(0);
              setReceiptPassword('');
            }}
            className="w-full px-6 py-4 bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] font-medium transition-colors btn-press"
          >
            Claim Another Payment
          </button>
        </div>
      )}
    </div>
  );
}
