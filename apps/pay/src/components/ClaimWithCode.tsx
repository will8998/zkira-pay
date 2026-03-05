'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { deriveDeadDropId } from '@/lib/claim-code';
import { aesDecrypt } from '@/lib/dead-drop-crypto';
import type { DepositBundle, DepositNoteRecord } from '@/types/payment';
import { executeBatchWithdrawal, type BatchWithdrawProgress, type WithdrawResult } from '@/lib/withdraw-engine';
import { getExplorerTxUrl, CHAIN_CONFIGS } from '@/config/pool-registry';
import { logClaim } from '@/lib/history-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

type ClaimStep = 'enter-code' | 'address' | 'withdrawing' | 'complete';

interface ClaimWithCodeProps {
  initialCode?: string;
}

export function ClaimWithCode({ initialCode }: ClaimWithCodeProps) {
  const [step, setStep] = useState<ClaimStep>('enter-code');
  const [claimCode, setClaimCode] = useState(initialCode ?? '');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bundle, setBundle] = useState<DepositBundle | null>(null);

  // Address + withdrawal state
  const [destinationAddress, setDestinationAddress] = useState('');
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [withdrawProgress, setWithdrawProgress] = useState<BatchWithdrawProgress | null>(null);
  const [withdrawResults, setWithdrawResults] = useState<WithdrawResult[]>([]);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Fetch, decrypt the dead drop, then move to address step
  const handleClaim = useCallback(async () => {
    if (!claimCode.trim() || !encryptionKey.trim()) {
      toast.error('Please enter both the claim code and password');
      return;
    }

    setIsLoading(true);
    try {
      const dropId = await deriveDeadDropId(claimCode.trim());

      const response = await fetch(`${API_URL}/api/dead-drop/${dropId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Claim code not found');
        if (response.status === 410) throw new Error('Claim code expired');
        throw new Error('Failed to retrieve payment');
      }

      const data = await response.json();
      const payload = data.payload as { ciphertext: string; nonce: string; version: number };

      const plaintext = await aesDecrypt(payload.ciphertext, payload.nonce, encryptionKey.trim());
      const decryptedBundle = JSON.parse(plaintext) as DepositBundle;

      setBundle(decryptedBundle);
      setStep('address');

      // Mark as claimed
      await fetch(`${API_URL}/api/dead-drop/${dropId}/claim`, { method: 'PATCH' });

      toast.success(`${decryptedBundle.notes.length} deposit note${decryptedBundle.notes.length !== 1 ? 's' : ''} decrypted!`);

      // Log to local history
      logClaim({
        chain: decryptedBundle.notes[0]?.chain ?? 'arbitrum',
        token: decryptedBundle.notes[0]?.token ?? 'usdc',
        amountRaw: decryptedBundle.totalRaw,
        amountLabel: `${decryptedBundle.notes.length} note${decryptedBundle.notes.length !== 1 ? 's' : ''}`,
        claimCode: claimCode.trim(),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to claim payment');
    } finally {
      setIsLoading(false);
    }
  }, [claimCode, encryptionKey]);

  // Address validation
  const handleAddressChange = (value: string) => {
    setDestinationAddress(value);
    setIsValidAddress(/^0x[a-fA-F0-9]{40}$/.test(value));
  };

  // Auto-withdraw all notes to destination address
  const handleWithdrawAll = useCallback(async () => {
    if (!bundle || !isValidAddress) return;

    setStep('withdrawing');
    setWithdrawError(null);
    setWithdrawResults([]);

    try {
      const results = await executeBatchWithdrawal(
        bundle.notes,
        destinationAddress,
        (progress) => setWithdrawProgress(progress),
      );

      setWithdrawResults(results);
      setStep('complete');
      toast.success('All withdrawals complete! Funds are on the way.');
    } catch (error) {
      setWithdrawError(error instanceof Error ? error.message : 'Withdrawal failed');
      toast.error(error instanceof Error ? error.message : 'Withdrawal failed');
    }
  }, [bundle, destinationAddress, isValidAddress]);

  // Get denomination label from a note
  const getDenomLabel = (note: DepositNoteRecord): string => {
    const decimals = note.token === 'dai' ? 18 : 6;
    const value = Number(BigInt(note.denomination)) / Math.pow(10, decimals);
    return `${value.toLocaleString()} ${note.token.toUpperCase()}`;
  };

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
          Enter the claim code and password to withdraw funds to your wallet.
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
                placeholder="OMNIPAY-XXXX-XXXX"
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
            className="w-full px-6 py-4 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-press rounded-lg flex items-center justify-center gap-2"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>DECRYPTING...</span>
              </>
            ) : (
              'CLAIM PAYMENT →'
            )}
          </button>
        </div>
      )}

      {/* Step: Enter Destination Address */}
      {step === 'address' && bundle && (
        <div className="space-y-6">
          {/* Decrypted notes summary */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🔓</div>
              <h2
                className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Payment Decrypted
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                {bundle.notes.length} deposit{bundle.notes.length !== 1 ? 's' : ''} found.
                Enter your wallet address to withdraw all at once.
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
                    #{i + 1} — {getDenomLabel(note)}
                  </span>
                  <span className="text-sm text-[var(--color-green)]">✓ Ready</span>
                </div>
              ))}
            </div>

            {/* Destination address */}
            <div className="space-y-3">
              <label
                className="block text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Withdraw To
              </label>
              <input
                type="text"
                value={destinationAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder="0x... your Ethereum / Arbitrum address"
                className={`w-full px-4 py-3 bg-[var(--color-bg)] border text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:outline-none transition-colors ${
                  isValidAddress
                    ? 'border-[var(--color-green)]'
                    : destinationAddress && !isValidAddress
                    ? 'border-red-500'
                    : 'border-[var(--color-border)] focus:border-[var(--color-button)]'
                }`}
                style={{ fontFamily: 'var(--font-mono)' }}
                autoFocus
              />
              {destinationAddress && !isValidAddress && (
                <p className="text-sm text-red-500">Invalid Ethereum address</p>
              )}
            </div>
          </div>

          <button
            onClick={handleWithdrawAll}
            disabled={!isValidAddress}
            className="w-full px-6 py-4 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-press rounded-lg"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            WITHDRAW ALL {bundle.notes.length} NOTE{bundle.notes.length !== 1 ? 'S' : ''} →
          </button>

          <button
            onClick={() => {
              setStep('enter-code');
              setBundle(null);
              setClaimCode('');
              setEncryptionKey('');
              setDestinationAddress('');
            }}
            className="w-full px-4 py-3 bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] font-medium transition-colors btn-press rounded-lg"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Step: Withdrawing */}
      {step === 'withdrawing' && bundle && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl">
            <div className="text-center mb-6">
              <h2
                className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {withdrawError
                  ? 'Withdrawal Error'
                  : `Withdrawing ${(withdrawProgress?.noteIndex ?? 0) + 1} of ${bundle.notes.length}`}
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                {withdrawError
                  ? withdrawError
                  : withdrawProgress?.message ?? 'Preparing...'}
              </p>
            </div>

            {/* Progress bar */}
            {!withdrawError && (
              <div className="w-full bg-[var(--color-border)] rounded-full h-2 mb-6">
                <div
                  className="bg-[var(--color-button)] h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(
                      ((withdrawProgress?.noteIndex ?? 0) +
                        (withdrawProgress?.stage === 'submit' ? 0.8 : withdrawProgress?.stage === 'proof' ? 0.5 : 0.2)) /
                      bundle.notes.length
                    ) * 100}%`,
                  }}
                />
              </div>
            )}

            {/* Per-note status */}
            <div className="space-y-2">
              {bundle.notes.map((note, i) => {
                const completed = withdrawResults.some((r) => r.noteIndex === i);
                const isActive = !withdrawError && (withdrawProgress?.noteIndex ?? -1) === i;
                const isPending = !completed && !isActive;

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-[var(--color-bg)] border border-[var(--color-border)] p-3 rounded"
                  >
                    <span
                      className="text-sm text-[var(--color-text)]"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      #{i + 1} — {getDenomLabel(note)}
                    </span>
                    <span className="text-sm">
                      {completed && <span className="text-[var(--color-green)]">✓ Done</span>}
                      {isActive && (
                        <span className="text-[var(--color-button)] flex items-center gap-1">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          {withdrawProgress?.stage === 'tree'
                            ? 'Tree...'
                            : withdrawProgress?.stage === 'proof'
                            ? 'ZK Proof...'
                            : 'Submitting...'}
                        </span>
                      )}
                      {isPending && <span className="text-[var(--color-text-secondary)]">Pending</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Error retry */}
            {withdrawError && (
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleWithdrawAll}
                  className="w-full px-6 py-4 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] font-bold transition-colors btn-press rounded-lg"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  RETRY WITHDRAWAL
                </button>
              </div>
            )}
          </div>

          {!withdrawError && (
            <div className="bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="text-sm text-[var(--color-warning-text)]">
                  <strong>DO NOT CLOSE THIS TAB</strong> — withdrawals are in progress.
                  Each withdrawal requires a zero-knowledge proof which takes a moment.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: Complete */}
      {step === 'complete' && bundle && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2
              className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Funds Withdrawn!
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm">
              {withdrawResults.length} withdrawal{withdrawResults.length !== 1 ? 's' : ''} complete.
              Funds will arrive in your wallet within ~1 minute.
            </p>
          </div>

          {/* Transaction list */}
          {withdrawResults.length > 0 && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-xl space-y-3">
              <h3
                className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Transactions
              </h3>
              {withdrawResults.map((result, i) => {
                const note = bundle.notes[result.noteIndex];
                const chain = note?.chain ?? 'arbitrum';
                return (
                  <div key={i} className="flex items-center justify-between bg-[var(--color-bg)] border border-[var(--color-border)] p-3 rounded">
                    <span
                      className="text-sm text-[var(--color-text)]"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {note ? getDenomLabel(note) : `Note #${result.noteIndex + 1}`}
                    </span>
                    {result.txHash ? (
                      <a
                        href={getExplorerTxUrl(chain, result.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[var(--color-button)] hover:text-[var(--color-button-hover)] underline"
                      >
                        {result.txHash.slice(0, 10)}... →
                      </a>
                    ) : (
                      <span className="text-sm text-[var(--color-green)]">✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={() => {
              setStep('enter-code');
              setClaimCode('');
              setEncryptionKey('');
              setBundle(null);
              setDestinationAddress('');
              setWithdrawResults([]);
              setWithdrawProgress(null);
              setWithdrawError(null);
            }}
            className="w-full px-6 py-4 bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] font-medium transition-colors btn-press rounded-lg"
          >
            Claim Another Payment
          </button>
        </div>
      )}
    </div>
  );
}
