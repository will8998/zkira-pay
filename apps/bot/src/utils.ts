/**
 * Escape special characters for Telegram MarkdownV2 parse mode.
 * Must escape: _ * [ ] ( ) ~ ` > # + - = | { } . !
 */
export function escMd2(text: string | number): string {
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

// ─── Secret Store ───
// In-memory store for claim secrets. Telegram callback_data has a 64-byte limit.
// Full hex secrets are 64 chars + prefix = 71 bytes (over limit).
// We store them here keyed by short random IDs.

const secretStore = new Map<string, string>();

let idCounter = 0;

export function storeSecret(secretHex: string): string {
  const id = (++idCounter).toString(36);
  secretStore.set(id, secretHex);
  // Auto-expire after 24h to prevent memory leak
  setTimeout(() => secretStore.delete(id), 24 * 60 * 60 * 1000);
  return id;
}

export function getSecret(id: string): string | undefined {
  return secretStore.get(id);
}