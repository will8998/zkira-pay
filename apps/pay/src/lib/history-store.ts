/**
 * LocalStorage-based transaction history manager for ZKIRA Pay.
 *
 * All history is stored locally in the browser — nothing is sent to the server.
 * This ensures privacy: only the user's device knows their transaction history.
 */

import type { HistoryEntry, HistoryEntryType } from '@/types/payment';
import type { Chain, TokenId } from '@/config/pool-registry';

const STORAGE_KEY = 'zkira_history';
const MAX_ENTRIES = 500;

/** Read all history entries from localStorage. */
export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

/** Add a new history entry. */
export function addHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): HistoryEntry {
  const full: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  const history = getHistory();
  history.unshift(full);

  // Trim to max entries
  if (history.length > MAX_ENTRIES) {
    history.length = MAX_ENTRIES;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return full;
}

/** Update an existing entry's status. */
export function updateHistoryEntry(id: string, updates: Partial<HistoryEntry>): void {
  const history = getHistory();
  const index = history.findIndex((e) => e.id === id);
  if (index === -1) return;

  history[index] = { ...history[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

/** Clear all history. */
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Quick helper to log a send. */
export function logSend(params: {
  chain: Chain;
  token: TokenId;
  amountRaw: string;
  amountLabel: string;
  claimCode: string;
}): HistoryEntry {
  return addHistoryEntry({
    type: 'send',
    chain: params.chain,
    token: params.token,
    amountRaw: params.amountRaw,
    amountLabel: params.amountLabel,
    claimCode: params.claimCode,
    status: 'complete',
  });
}

/** Quick helper to log a claim. */
export function logClaim(params: {
  chain: Chain;
  token: TokenId;
  amountRaw: string;
  amountLabel: string;
  claimCode: string;
}): HistoryEntry {
  return addHistoryEntry({
    type: 'claim',
    chain: params.chain,
    token: params.token,
    amountRaw: params.amountRaw,
    amountLabel: params.amountLabel,
    claimCode: params.claimCode,
    status: 'complete',
  });
}

/** Quick helper to log an invoice request. */
export function logRequest(params: {
  chain: Chain;
  token: TokenId;
  amountRaw: string;
  amountLabel: string;
  invoiceId: string;
}): HistoryEntry {
  return addHistoryEntry({
    type: 'request',
    chain: params.chain,
    token: params.token,
    amountRaw: params.amountRaw,
    amountLabel: params.amountLabel,
    invoiceId: params.invoiceId,
    status: 'pending',
  });
}

/** Quick helper to log a deposit. */
export function logDeposit(params: {
  chain: Chain;
  token: TokenId;
  amountRaw: string;
  amountLabel: string;
  txHashes?: string[];
}): HistoryEntry {
  return addHistoryEntry({
    type: 'deposit',
    chain: params.chain,
    token: params.token,
    amountRaw: params.amountRaw,
    amountLabel: params.amountLabel,
    txHashes: params.txHashes,
    status: 'complete',
  });
}

/** Quick helper to log a withdrawal. */
export function logWithdraw(params: {
  chain: Chain;
  token: TokenId;
  amountRaw: string;
  amountLabel: string;
  txHashes?: string[];
}): HistoryEntry {
  return addHistoryEntry({
    type: 'withdraw',
    chain: params.chain,
    token: params.token,
    amountRaw: params.amountRaw,
    amountLabel: params.amountLabel,
    txHashes: params.txHashes,
    status: 'complete',
  });
}
