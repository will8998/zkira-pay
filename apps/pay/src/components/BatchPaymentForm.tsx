'use client';
import { toast } from 'sonner';
import PrivacyCallout from '@/components/PrivacyCallout';
import { getErrorMessage } from '@/lib/errors';

import { useState, useRef, useCallback } from 'react';
import { useBalance } from './useBalance';
import { useWallet, useConnection } from './WalletProvider';
import { useNetwork, getUsdcMint } from '@/lib/network-config';
import { generateMetaAddress, encodeMetaAddress, deriveStealthAddress, decodeMetaAddress, bytesToHex } from '@zkira/crypto';
import { createCreatePaymentIx, findEscrow } from '@zkira/sdk';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey, Transaction } from '@solana/web3.js';

interface Payment {
  amount: string;
  note: string;
}

interface ProcessedPayment extends Payment {
  id: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  claimLink?: string;
  txSignature?: string;
  error?: string;
}

type InputMode = 'csv' | 'manual';


export function BatchPaymentForm() {
  const { connected, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { network } = useNetwork();
  const { sol, usdc, loading: balanceLoading } = useBalance();
  
  const [inputMode, setInputMode] = useState<InputMode>('csv');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [processedPayments, setProcessedPayments] = useState<ProcessedPayment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProgress, setCurrentProgress] = useState({ current: 0, total: 0 });
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [manualPayments, setManualPayments] = useState<Payment[]>([
    { amount: '', note: '' }
  ]);

  const totalAmount = payments.reduce((sum, payment) => {
    const amount = parseFloat(payment.amount) || 0;
    return sum + amount;
  }, 0);

  const totalFees = totalAmount * 0.003;
  const totalCost = totalAmount + totalFees;

  const parseCSV = (text: string): Payment[] => {
    const lines = text.trim().split('\n');
    const payments: Payment[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length < 2) continue;
      
      const amount = parts[0].trim();
      const note = parts.slice(1).join(',').trim();
      
      if (amount && note) {
        payments.push({ amount, note });
      }
    }
    
    return payments;
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsedPayments = parseCSV(text);
      setPayments(parsedPayments);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.name.endsWith('.csv') || file.type === 'text/csv');
    
    if (csvFile) {
      handleFileSelect(csvFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const addManualRow = () => {
    setManualPayments([...manualPayments, { amount: '', note: '' }]);
  };

  const removeManualRow = (index: number) => {
    if (manualPayments.length > 1) {
      setManualPayments(manualPayments.filter((_, i) => i !== index));
    }
  };

  const updateManualPayment = (index: number, field: 'amount' | 'note', value: string) => {
    const updated = [...manualPayments];
    updated[index][field] = value;
    setManualPayments(updated);
    
    const validPayments = updated.filter(p => p.amount && p.note);
    setPayments(validPayments);
  };

  const executePayments = async () => {
    if (!publicKey || !signTransaction || !payments.length) return;

    setIsProcessing(true);
    setShowResults(true);
    setCurrentProgress({ current: 0, total: payments.length });

    const processed: ProcessedPayment[] = payments.map((payment, index) => ({
      ...payment,
      id: `payment-${index}`,
      status: 'pending'
    }));

    setProcessedPayments(processed);

    try {
      const creatorAta = await getAssociatedTokenAddress(new PublicKey(getUsdcMint(network)), publicKey);
      
      for (let i = 0; i < payments.length; i += 2) {
        const batch = payments.slice(i, i + 2);
        const batchProcessed = processed.slice(i, i + 2);
        
        try {
          batchProcessed.forEach(p => p.status = 'processing');
          setProcessedPayments([...processed]);
          
          const tx = new Transaction();
          const batchData: Array<{
            payment: ProcessedPayment;
            meta: ReturnType<typeof generateMetaAddress>;
            stealthAddress: Uint8Array;
            ephemeralPubkey: Uint8Array;
            nonce: bigint;
            escrowAddress: PublicKey;
          }> = [];

          for (const payment of batch) {
            const meta = generateMetaAddress();
            const metaAddress = encodeMetaAddress(meta.spendPubkey, meta.viewPubkey);
            const { stealthPubkey, ephemeralPubkey } = deriveStealthAddress(meta.spendPubkey, meta.viewPubkey);
            const nonce = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
            const [escrowAddress] = findEscrow(publicKey, nonce);

            const ix = createCreatePaymentIx({
              creator: publicKey,
              creatorTokenAccount: creatorAta,
              tokenMint: new PublicKey(getUsdcMint(network)),
              amount: BigInt(Math.round(parseFloat(payment.amount) * 1_000_000)),
              stealthAddress: stealthPubkey,
              recipientSpendPubkey: meta.spendPubkey,
              recipientViewPubkey: meta.viewPubkey,
              expiry: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
              nonce,
            });

            tx.add(ix);
            
            const processedPayment = batchProcessed.find(p => p.amount === payment.amount && p.note === payment.note);
            if (processedPayment) {
              batchData.push({
                payment: processedPayment,
                meta,
                stealthAddress: stealthPubkey,
                ephemeralPubkey,
                nonce,
                escrowAddress
              });
            }
          }

          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
          tx.recentBlockhash = blockhash;
          tx.feePayer = publicKey;
          
          const signed = await signTransaction(tx);
          const sig = await connection.sendRawTransaction(signed.serialize());
          await connection.confirmTransaction({ 
            signature: sig, 
            blockhash, 
            lastValidBlockHeight 
          });

          batchData.forEach(({ payment, escrowAddress }) => {
            payment.status = 'success';
            payment.claimLink = `${window.location.origin}/claim?escrow=${escrowAddress.toBase58()}`;
            payment.txSignature = sig;
          });

        } catch (error) {
          // Batch payment processing error
          batchProcessed.forEach(p => {
            p.status = 'failed';
            p.error = getErrorMessage(error);
          });
        }

        setCurrentProgress({ current: Math.min(i + 2, payments.length), total: payments.length });
        setProcessedPayments([...processed]);
      }

    } catch (error) {
      // Batch payment execution error
    } finally {
      const successCount = processedPayments.filter(p => p.status === 'success').length;
      if (successCount > 0) {
        toast.success('Batch payment created');
      }
      setIsProcessing(false);
    }
  };

  const copyAllLinks = async () => {
    const links = processedPayments
      .filter(p => p.claimLink)
      .map(p => p.claimLink)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(links);
    } catch (error) {
      console.error('Failed to copy links:', error);
    }
  };

  const downloadResults = () => {
    const csvContent = processedPayments
      .map(p => `${p.amount},${p.note},${p.status},${p.claimLink || ''},${p.txSignature || ''}`)
      .join('\n');
    
    const header = 'Amount,Note,Status,Claim Link,Transaction\n';
    const blob = new Blob([header + csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch-payment-results.csv';
    a.click();
    
    URL.revokeObjectURL(url);
  };

  const retryFailedPayments = () => {
    const failedPayments = processedPayments
      .filter(p => p.status === 'failed')
      .map(p => ({ amount: p.amount, note: p.note }));
    
    if (failedPayments.length > 0) {
      setPayments(failedPayments);
      setProcessedPayments([]);
      setShowResults(false);
    }
  };

  if (!connected) {
    return (
      <div className="border-l-2 border-[var(--color-green)] bg-[var(--color-hover)] px-4 py-3">
        <p className="text-[var(--color-text-secondary)] text-sm">Connect your wallet to send multiple confidential payments in a single batch.</p>
      </div>
    );
  }

  if (showResults) {
    const successCount = processedPayments.filter(p => p.status === 'success').length;
    const failedCount = processedPayments.filter(p => p.status === 'failed').length;

    return (
      <div className="space-y-8">
        {isProcessing && (
          <div className="border border-[var(--color-border)] bg-[var(--color-hover)] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">
                Processing payments
              </span>
              <span className="text-sm text-[var(--color-text)]">
                {currentProgress.current} of {currentProgress.total}
              </span>
            </div>
            <div className="w-full bg-[var(--color-border)] h-2">
              <div 
                className="bg-[var(--color-green)] h-2 transition-all duration-300"
                style={{ width: `${(currentProgress.current / currentProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="border border-[var(--color-border)] bg-[var(--color-hover)] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">Success</span>
              <div className="text-[var(--color-green)] font-semibold">{successCount}</div>
            </div>
            {failedCount > 0 && (
              <div>
                <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">Failed</span>
                <div className="text-[var(--color-red)] font-semibold">{failedCount}</div>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={downloadResults}
              className="px-3 py-1 min-h-[44px] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm hover:border-[var(--color-text)] hover:text-[var(--color-text)] transition-colors"
            >
              Download Results
            </button>
            {successCount > 0 && (
              <button
                onClick={copyAllLinks}
                className="px-3 py-1 min-h-[44px] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm hover:border-[var(--color-text)] hover:text-[var(--color-text)] transition-colors"
              >
                Copy All Links
              </button>
            )}
            {failedCount > 0 && (
              <button
                onClick={retryFailedPayments}
                className="px-3 py-1 min-h-[44px] bg-[var(--color-red)] text-[var(--color-bg)] text-sm hover:bg-[var(--color-red-hover)] transition-colors"
              >
                Retry Failed
              </button>
            )}
          </div>
        </div>

        <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="border-b border-[var(--color-border)] p-4">
            <h3 className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">Results</h3>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-hover)]">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">#</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">Amount</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">Note</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">Claim Link</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">Transaction</th>
                </tr>
              </thead>
              <tbody>
                {processedPayments.map((payment, index) => (
                  <tr key={payment.id} className="border-b border-[var(--color-border)]">
                    <td className="px-4 py-3 text-sm text-[var(--color-muted)]">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text)] font-medium tabular-nums">${payment.amount} USDC</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)] max-w-xs truncate">{payment.note}</td>
                    <td className="px-4 py-3 text-sm">
                      {payment.status === 'success' && <span className="text-[var(--color-green)]">✓ Success</span>}
                      {payment.status === 'failed' && <span className="text-[var(--color-red)]">✗ Failed</span>}
                      {payment.status === 'processing' && <span className="text-[var(--color-muted)]">Processing...</span>}
                      {payment.status === 'pending' && <span className="text-[var(--color-muted)]">Pending</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {payment.claimLink && (
                        <button
                          onClick={() => navigator.clipboard.writeText(payment.claimLink!)}
                          className="text-[var(--color-green)] hover:text-[var(--color-green-hover)] transition-colors"
                        >
                          Copy Link
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {payment.txSignature && (
                        <a
                          href={`https://explorer.solana.com/tx/${payment.txSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--color-green)] hover:text-[var(--color-green-hover)] transition-colors"
                        >
                          View
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile card view */}
          <div className="md:hidden space-y-2 p-4">
            {processedPayments.map((payment, index) => (
              <div key={payment.id} className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--color-muted)]">#{index + 1}</span>
                  <span className="text-sm font-medium text-[var(--color-text)]">${payment.amount} USDC</span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] truncate">{payment.note}</p>
                <div className="flex justify-between items-center">
                  <div className="text-xs">
                    {payment.status === 'success' && <span className="text-[var(--color-green)]">✓ Success</span>}
                    {payment.status === 'failed' && <span className="text-[var(--color-red)]">✗ Failed</span>}
                    {payment.status === 'processing' && <span className="text-[var(--color-muted)]">Processing...</span>}
                    {payment.status === 'pending' && <span className="text-[var(--color-muted)]">Pending</span>}
                  </div>
                  <div className="flex gap-2 text-xs">
                    {payment.claimLink && (
                      <button
                        onClick={() => navigator.clipboard.writeText(payment.claimLink!)}
                        className="min-h-[44px] px-3 text-[var(--color-green)] hover:text-[var(--color-green-hover)] transition-colors"
                      >
                        Copy Link
                      </button>
                    )}
                    {payment.txSignature && (
                      <a
                        href={`https://explorer.solana.com/tx/${payment.txSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] px-3 flex items-center text-[var(--color-green)] hover:text-[var(--color-green-hover)] transition-colors"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            setShowResults(false);
            setPayments([]);
            setProcessedPayments([]);
            setManualPayments([{ amount: '', note: '' }]);
          }}
          className="px-4 py-2 min-h-[44px] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm hover:border-[var(--color-text)] hover:text-[var(--color-text)] transition-colors"
        >
          Start New Batch
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border border-[var(--color-border)] bg-[var(--color-hover)] p-4 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">Wallet Balance</span>
        <div className="flex items-center gap-4 text-sm">
          {balanceLoading ? (
            <span className="text-[var(--color-section-label)]">Loading...</span>
          ) : (
            <>
              <span className="text-[var(--color-text)] font-medium tabular-nums">{usdc !== null ? usdc.toFixed(2) : '—'} USDC</span>
              <span className="text-[var(--color-muted)] tabular-nums">{sol !== null ? sol.toFixed(4) : '—'} SOL</span>
            </>
          )}
        </div>
      </div>

      <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex">
          <button
            onClick={() => setInputMode('csv')}
            className={`flex-1 px-4 min-h-[44px] text-sm font-medium transition-colors border-r border-[var(--color-border)] btn-press ${
              inputMode === 'csv'
                ? 'bg-[var(--color-button)] text-[var(--color-button-text)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]'
            }`}
          >
            CSV Upload
          </button>
          <button
            onClick={() => setInputMode('manual')}
            className={`flex-1 px-4 min-h-[44px] text-sm font-medium transition-colors btn-press ${
              inputMode === 'manual'
                ? 'bg-[var(--color-button)] text-[var(--color-button-text)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]'
            }`}
          >
            Manual Entry
          </button>
        </div>

        {inputMode === 'csv' && (
          <div className="p-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed min-h-[160px] md:min-h-auto p-8 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? 'border-[var(--color-text)] bg-[var(--color-hover)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text)] hover:bg-[var(--color-hover)]'
              }`}
            >
              <svg className="mx-auto h-12 w-12 text-[var(--color-muted)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg text-[var(--color-text)] font-medium mb-2">
                Drop your CSV file here or click to browse
              </p>
              <p className="text-sm text-[var(--color-muted)]">
                Format: amount,note (one payment per row)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="mt-4 text-xs text-[var(--color-muted)]">
              <p className="font-medium">Example CSV format:</p>
              <pre className="bg-[var(--color-hover)] p-2 mt-1 border border-[var(--color-border)]">
100.00,Salary payment for John{'\n'}50.00,Contractor payment{'\n'}25.50,Expense reimbursement
              </pre>
            </div>
            <p className="text-[11px] text-[var(--color-section-label)] mt-2">CSV files should contain one payment per line: amount,note. No headers required.</p>
          </div>
        )}

        {inputMode === 'manual' && (
          <div className="p-6 space-y-4">
            <label className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium block">
              Payment Details
            </label>
            {manualPayments.map((payment, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-2 md:gap-4 items-stretch md:items-start">
                <div className="flex-1">
                  <input
                    inputMode="decimal"
                    placeholder="Amount (USDC)"
                    step="0.01"
                    value={payment.amount}
                    onChange={(e) => updateManualPayment(index, 'amount', e.target.value)}
                    className="w-full border border-[var(--color-border)] bg-[var(--color-hover)] px-4 py-3 min-h-[44px] focus:border-[var(--color-text)] focus:outline-none input-focus"
                  />
                  <p className="text-[11px] text-[var(--color-section-label)] mt-1">Enter amount in USDC to send to this recipient.</p>
                </div>
                <div className="flex-2">
                  <input
                    type="text"
                    placeholder="Note/description"
                    value={payment.note}
                    onChange={(e) => updateManualPayment(index, 'note', e.target.value)}
                    className="w-full border border-[var(--color-border)] bg-[var(--color-hover)] px-4 py-3 min-h-[44px] focus:border-[var(--color-text)] focus:outline-none input-focus"
                  />
                  <p className="text-[11px] text-[var(--color-section-label)] mt-1">Description for this payment (invoice reference, memo, etc).</p>
                </div>
                {manualPayments.length > 1 && (
                  <button
                    onClick={() => removeManualRow(index)}
                    className="px-3 py-3 min-h-[44px] min-w-[44px] text-[var(--color-red)] hover:bg-[var(--color-error-bg)] transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addManualRow}
              className="w-full border border-dashed border-[var(--color-border)] py-3 min-h-[44px] text-[var(--color-text-secondary)] hover:border-[var(--color-text)] hover:text-[var(--color-text)] transition-colors"
            >
              + Add Payment
            </button>
          </div>
        )}
      </div>

      {payments.length > 0 && (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="border-b border-[var(--color-border)] p-4">
            <h3 className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">Preview</h3>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-hover)]">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">#</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">Amount</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">Note</th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => (
                  <tr key={index} className="border-b border-[var(--color-border)]">
                    <td className="px-4 py-3 text-sm text-[var(--color-muted)]">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text)] font-medium tabular-nums">${payment.amount} USDC</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">{payment.note}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-muted)]">Ready</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile card view */}
          <div className="md:hidden space-y-2 p-4">
            {payments.map((payment, index) => (
              <div key={index} className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--color-muted)]">#{index + 1}</span>
                  <span className="text-sm font-medium text-[var(--color-text)]">${payment.amount} USDC</span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] truncate">{payment.note}</p>
                <div className="text-xs text-[var(--color-muted)]">Ready</div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-[var(--color-border)] p-4 bg-[var(--color-hover)] space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Total payments</span>
              <span className="text-[var(--color-text)] font-medium">{payments.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Total amount</span>
              <span className="text-[var(--color-text)] font-medium tabular-nums">${totalAmount.toFixed(2)} USDC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Total fees (0.3% each)</span>
              <span className="text-[var(--color-muted)] tabular-nums">${totalFees.toFixed(4)} USDC</span>
            </div>
            <div className="border-t border-[var(--color-border)] pt-2 flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Total cost</span>
              <span className="text-[var(--color-text)] font-semibold tabular-nums">${totalCost.toFixed(4)} USDC</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--color-section-label)]">Network fees</span>
              <span className="text-[var(--color-section-label)] tabular-nums">~{Math.ceil(payments.length / 2) * 0.01} SOL</span>
            </div>
          </div>
        </div>
      )}

      {payments.length > 0 && usdc !== null && totalCost > usdc && (
        <div className="border-l-2 border-[var(--color-red)] bg-[var(--color-error-bg)] px-4 py-3">
          <p className="text-[var(--color-red)] text-sm">
            Insufficient USDC balance. You need ${totalCost.toFixed(2)} but have ${usdc.toFixed(2)} available.
          </p>
        </div>
      )}

      {payments.length > 0 && (
        <button
          onClick={executePayments}
          disabled={isProcessing || (usdc !== null && totalCost > usdc)}
          className="w-full px-6 py-4 min-h-[48px] bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-press"
        >
          {isProcessing ? 'Processing Payments...' : `Send All ${payments.length} Payments`}
        </button>
      )}

      <PrivacyCallout variant="compact" />
    </div>
  );
}