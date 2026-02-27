import { PublicKey } from '@solana/web3.js';

export interface DeserializedMetaAddress {
  owner: string;
  spendPubkey: string;
  viewPubkey: string;
  label: string;
  bump: number;
  createdAt: number;
}

export interface DeserializedAnnouncement {
  ephemeralPubkey: string;
  stealthAddress: string;
  tokenMint: string;
  encryptedMetadata: string;
  timestamp: number;
  bump: number;
}

export interface DeserializedEscrow {
  creator: string;
  tokenMint: string;
  amount: string;
  claimHash: string;
  recipientSpendPubkey: string;
  recipientViewPubkey: string;
  expiry: number;
  claimed: boolean;
  refunded: boolean;
  nonce: string;
  feeBps: number;
  bump: number;
  createdAt: number;
}

export interface DeserializedProtocolConfig {
  admin: string;
  feeRecipient: string;
  feeBps: number;
  paused: boolean;
  bump: number;
}

function readString(view: DataView, offset: number): { value: string; newOffset: number } {
  const length = view.getUint32(offset, true);
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset + 4, length);
  const value = new TextDecoder().decode(bytes);
  return { value, newOffset: offset + 4 + length };
}

function readBytes(view: DataView, offset: number, length: number): { value: string; newOffset: number } {
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, length);
  const value = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return { value, newOffset: offset + length };
}

function readPubkey(view: DataView, offset: number): { value: string; newOffset: number } {
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, 32);
  const value = new PublicKey(bytes).toBase58();
  return { value, newOffset: offset + 32 };
}

export function deserializeMetaAddress(data: Buffer): DeserializedMetaAddress {
  const view = new DataView(data.buffer, data.byteOffset + 8); // Skip 8-byte discriminator
  let offset = 0;

  const { value: owner, newOffset: offset1 } = readPubkey(view, offset);
  const { value: spendPubkey, newOffset: offset2 } = readPubkey(view, offset1);
  const { value: viewPubkey, newOffset: offset3 } = readPubkey(view, offset2);
  const { value: label, newOffset: offset4 } = readString(view, offset3);
  const bump = view.getUint8(offset4);
  const createdAt = Number(view.getBigInt64(offset4 + 1, true));

  return {
    owner,
    spendPubkey,
    viewPubkey,
    label,
    bump,
    createdAt,
  };
}

export function deserializeAnnouncement(data: Buffer): DeserializedAnnouncement {
  const view = new DataView(data.buffer, data.byteOffset + 8); // Skip 8-byte discriminator
  let offset = 0;

  const { value: ephemeralPubkey, newOffset: offset1 } = readBytes(view, offset, 32);
  const { value: stealthAddress, newOffset: offset2 } = readBytes(view, offset1, 32);
  const { value: tokenMint, newOffset: offset3 } = readPubkey(view, offset2);
  
  const encryptedMetadataLength = view.getUint32(offset3, true);
  const { value: encryptedMetadata, newOffset: offset4 } = readBytes(view, offset3 + 4, encryptedMetadataLength);
  
  const timestamp = Number(view.getBigInt64(offset4, true));
  const bump = view.getUint8(offset4 + 8);

  return {
    ephemeralPubkey,
    stealthAddress,
    tokenMint,
    encryptedMetadata,
    timestamp,
    bump,
  };
}

export function deserializePaymentEscrow(data: Buffer): DeserializedEscrow {
  const view = new DataView(data.buffer, data.byteOffset + 8); // Skip 8-byte discriminator
  let offset = 0;

  const { value: creator, newOffset: offset1 } = readPubkey(view, offset);
  const { value: tokenMint, newOffset: offset2 } = readPubkey(view, offset1);
  const amount = view.getBigUint64(offset2, true).toString();
  const { value: claimHash, newOffset: offset3 } = readBytes(view, offset2 + 8, 32);
  const { value: recipientSpendPubkey, newOffset: offset4 } = readPubkey(view, offset3);
  const { value: recipientViewPubkey, newOffset: offset5 } = readPubkey(view, offset4);
  const expiry = Number(view.getBigInt64(offset5, true));
  const claimed = view.getUint8(offset5 + 8) === 1;
  const refunded = view.getUint8(offset5 + 9) === 1;
  const nonce = view.getBigUint64(offset5 + 10, true).toString();
  const feeBps = view.getUint16(offset5 + 18, true);
  const bump = view.getUint8(offset5 + 20);
  const createdAt = Number(view.getBigInt64(offset5 + 21, true));

  return {
    creator,
    tokenMint,
    amount,
    claimHash,
    recipientSpendPubkey,
    recipientViewPubkey,
    expiry,
    claimed,
    refunded,
    nonce,
    feeBps,
    bump,
    createdAt,
  };
}

export function deserializeProtocolConfig(data: Buffer): DeserializedProtocolConfig {
  const view = new DataView(data.buffer, data.byteOffset + 8); // Skip 8-byte discriminator
  let offset = 0;

  const { value: admin, newOffset: offset1 } = readPubkey(view, offset);
  const { value: feeRecipient, newOffset: offset2 } = readPubkey(view, offset1);
  const feeBps = view.getUint16(offset2, true);
  const paused = view.getUint8(offset2 + 2) === 1;
  const bump = view.getUint8(offset2 + 3);

  return {
    admin,
    feeRecipient,
    feeBps,
    paused,
    bump,
  };
}