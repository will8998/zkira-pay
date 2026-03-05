'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { DenominationBuilder } from '@/components/DenominationBuilder';
import { ChainTokenSelector, type ChainTokenSelection } from '@/components/ChainTokenSelector';
import { generateX25519Keypair, boxDecrypt } from '@/lib/dead-drop-crypto';
import type {
  DenominationSet,
  InvoiceRequest,
  InvoiceNoteEntry,
  DepositNoteRecord,
} from '@/types/payment';
import type { Chain, TokenId } from '@/config/pool-registry';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3012';
const POLL_INTERVAL_MS = 8000;

type WizardStep = 'select' | 'created' | 'waiting' | 'withdrawing' | 'complete';

export function RequestPaymentWizard() {
  // Selection
  const [chain, setChain] = useState<Chain>('arbitrum');
  const [token, setToken] = useState<TokenId>('usdc');
  const [denomSet, setDenomSet] = useState<DenominationSet | null>(null);
  const [memo, setMemo] = useState('');

  // Wizard state
  const [step, setStep] = useState<WizardStep>('select');
  const [invoice, setInvoice] = useState<InvoiceRequest | null>(null);
  const [secretKey, setSecretKey] = useState<string>('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Waiting state
  const [receivedNotes, setReceivedNotes] = useState<DepositNoteRecord[]>([]);
  const [withdrawnCount, setWithdrawnCount] = useState(0);
  const [txHashes, setTxHashes] = useState<string[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  const handleChainTokenChange = useCallback((sel: ChainTokenSelection) => {
    setChain(sel.chain);
    setToken(sel.token);
  }, []);

  // Create invoice
  const createInvoice = useCallback(async () => {
    if (!denomSet || denomSet.selections.length === 0) {
      toast.error('Select at least one denomination');
      return;
    }

    try {
      const keypair = generateX25519Keypair();
      setSecretKey(keypair.secretKey);

      const invoiceId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const denominations = denomSet.selections.map((s) => ({
        pool: s.pool.address,
        denomination: s.pool.denomination,
        label: s.pool.label,
        count: s.count,
      }));

      const response = await fetch(`${API_URL}/api/invoices/v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          chain,
          token,
          denominations,
          totalRaw: denomSet.totalRaw.toString(),
          totalLabel: denomSet.totalLabel,
          recipientPubkey: keypair.publicKey,
          memo: memo || null,
          expiresAt,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const inv: InvoiceRequest = {
        invoiceId,
        chain,
        token,
        denominations: denomSet.selections,
        totalRaw: denomSet.totalRaw.toString(),
        totalLabel: denomSet.totalLabel,
        recipientPubkey: keypair.publicKey,
        memo: memo || undefined,
        createdAt: new Date().toISOString(),
        expiresAt,
        status: 'pending',
      };

      setInvoice(inv);
      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/pay?invoice=${invoiceId}`;
      setInvoiceUrl(url);
      setStep('created');
      toast.success('Invoice created!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice');
    }
  }, [denomSet, chain, token, memo]);

  // Start polling for notes
  const startWaiting = useCallback(() => {
    setStep('waiting');
    const controller = new AbortController();
    abortRef.current = controller;

    const poll = async () => {
      if (!invoice) return;

      while (!controller.signal.aborted) {
        try {
          const res = await fetch(`${API_URL}/api/invoices/v2/${invoice.invoiceId}/notes`);
          if (res.ok) {
            const data = await res.json();
            const notes: InvoiceNoteEntry[] = data.notes ?? [];

            // Calculate expected total notes
            const expectedCount = invoice.denominations.reduce((sum, s) => sum + s.count, 0);

            if (notes.length >= expectedCount) {
              // Decrypt all notes
              const decryptedNotes: DepositNoteRecord[] = [];
              for (const note of notes) {
                try {
                  const plaintext = boxDecrypt(
                    note.ciphertext,
                    note.nonce,
                    note.ephemeralPubkey,
                    secretKey,
                  );
                  const parsed = JSON.parse(plaintext) as DepositNoteRecord;
                  decryptedNotes.push(parsed);
                } catch {
                  // Skip corrupted notes
                }
              }

              setReceivedNotes(decryptedNotes);
              setStep('withdrawing');
              toast.success(`${decryptedNotes.length} deposit notes received!`);
              return;
            }
          }
        } catch {
          // keep polling
        }

        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, POLL_INTERVAL_MS);
          controller.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
          }, { once: true });
        });
      }
    };

    poll().catch(() => {
      // aborted
    });
  }, [invoice, secretKey]);

  // Withdraw all notes via relayer
  const withdrawAll = useCallback(async () => {
    // TODO: Implement sequential withdrawal via relayer
    // For now, mark as complete — the actual withdrawal will use the same
    // logic as WithdrawWizard but automated with pre-loaded notes
    setStep('complete');
    toast.success('Funds received! Withdraw from the Pool page using your downloaded receipts.');
  }, [receivedNotes]);

  // Auto-start withdrawal when notes received
  useEffect(() => {
    if (step === 'withdrawing' && receivedNotes.length > 0) {
      withdrawAll();
    }
  }, [step, receivedNotes, withdrawAll]);

  const copyToClipboard = useCallback(async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1
          className="text-3xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Request Payment
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm">
          Create an invoice. Share the link. Funds arrive privately.
        </p>
      </div>

      {/* Step: Select */}
      {step === 'select' && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-xl">
            <ChainTokenSelector onSelectionChange={handleChainTokenChange} />
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-xl">
            <DenominationBuilder chain={chain} token={token} onChange={setDenomSet} />
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-xl">
            <label
              className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Memo (optional)
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="What is this payment for?"
              className="w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:border-[var(--color-button)] focus:outline-none transition-colors"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <button
            onClick={createInvoice}
            disabled={!denomSet || denomSet.selections.length === 0 || denomSet.totalRaw === 0n}
            className="w-full px-6 py-4 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-press"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            CREATE INVOICE →
          </button>
        </div>
      )}

      {/* Step: Created — show link */}
      {step === 'created' && invoice && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl text-center">
            <div className="text-6xl mb-4">📩</div>
            <h2
              className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Invoice Created
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm mb-6">
              Share this link with the payer. Amount: {invoice.totalLabel}
            </p>

            <div className="bg-[var(--color-bg)] border border-[var(--color-border)] p-4 rounded-xl mb-4">
              <div
                className="text-sm font-mono text-[var(--color-text)] break-all"
              >
                {invoiceUrl}
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(invoiceUrl, setCopiedUrl)}
              className="px-6 py-3 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-bold transition-colors btn-press"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {copiedUrl ? '✓ Copied' : '📋 Copy Invoice Link'}
            </button>
          </div>

          <button
            onClick={startWaiting}
            className="w-full px-6 py-4 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-bold transition-colors btn-press"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            WAIT FOR PAYMENT →
          </button>
        </div>
      )}

      {/* Step: Waiting */}
      {step === 'waiting' && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 border-4 border-[var(--color-border)] border-t-[var(--color-button)] rounded-full animate-spin" />
            </div>
            <h2
              className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Waiting for Payment
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Polling for deposits from the payer... Keep this tab open.
            </p>
          </div>

          <button
            onClick={() => {
              abortRef.current?.abort();
              setStep('created');
            }}
            className="w-full px-4 py-3 bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] font-medium transition-colors btn-press"
          >
            ← Back to Invoice
          </button>
        </div>
      )}

      {/* Step: Complete */}
      {(step === 'withdrawing' || step === 'complete') && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-xl text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2
              className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-wide mb-2"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Payment Received!
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4">
              {receivedNotes.length} deposit note{receivedNotes.length !== 1 ? 's' : ''} decrypted.
              Use the Pool withdraw page with these receipts.
            </p>

            {/* Download receipts */}
            <div className="space-y-2">
              {receivedNotes.map((note, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-[var(--color-bg)] border border-[var(--color-border)] p-3 rounded"
                >
                  <span className="text-sm text-[var(--color-text)]" style={{ fontFamily: 'var(--font-mono)' }}>
                    Note #{i + 1} — Pool {note.pool.slice(0, 8)}...
                  </span>
                  <span className="text-sm text-[var(--color-green)]">✓</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setStep('select');
              setInvoice(null);
              setReceivedNotes([]);
              setDenomSet(null);
              setMemo('');
            }}
            className="w-full px-6 py-4 bg-[var(--color-hover)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] font-medium transition-colors btn-press"
          >
            Create Another Invoice
          </button>
        </div>
      )}
    </div>
  );
}
