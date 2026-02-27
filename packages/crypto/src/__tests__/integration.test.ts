import { describe, it, expect } from 'vitest';
import {
  generateMetaAddress,
  encodeMetaAddress,
  decodeMetaAddress,
  deriveStealthAddress,
  scanAnnouncements,
  deriveStealthPrivateKey,
  encryptMetadata,
  decryptMetadata,
  generateClaimSecret,
  hashClaimSecret,
  verifyClaimSecret,
  bytesToHex,
  hexToBytes,
} from '../index.js';
import { ed25519 } from '@noble/curves/ed25519';

describe('integration: full payment link flow', () => {
  it('end-to-end: create payment link → scan → claim', async () => {
    // ─── SETUP: Receiver generates a meta-address and shares it ───
    const receiver = generateMetaAddress();
    const encoded = encodeMetaAddress(receiver.spendPubkey, receiver.viewPubkey);

    // ─── SENDER: Creates payment link ───
    // 1. Decode receiver's meta-address
    const { spendPubkey, viewPubkey } = decodeMetaAddress(encoded);

    // 2. Derive stealth address
    const stealth = deriveStealthAddress(spendPubkey, viewPubkey);

    // 3. Encrypt metadata (amount, memo)
    const metadata = new TextEncoder().encode(JSON.stringify({
      amount: '100.00',
      token: 'USDC',
      memo: 'Payment for services',
    }));
    const encryptedMeta = await encryptMetadata(metadata, stealth.sharedSecret);

    // 4. Generate claim secret for the payment link
    const claimSecret = generateClaimSecret();
    const claimHash = hashClaimSecret(claimSecret);

    // At this point, sender would:
    // - Create escrow on-chain with claimHash
    // - Post announcement with ephemeralPubkey + stealthPubkey + encryptedMeta
    // - Generate payment link: https://app.zkira.xyz/{escrow}#{bytesToHex(claimSecret)}

    // ─── RECEIVER: Scans announcements ───
    const announcements = [
      {
        ephemeralPubkey: stealth.ephemeralPubkey,
        stealthAddress: stealth.stealthPubkey,
      },
    ];

    const matches = scanAnnouncements(
      announcements,
      receiver.viewPrivkey,
      receiver.spendPubkey,
    );

    expect(matches.length).toBe(1);

    // ─── RECEIVER: Decrypts metadata ───
    const decryptedMeta = await decryptMetadata(encryptedMeta, matches[0].sharedSecret);
    const parsedMeta = JSON.parse(new TextDecoder().decode(decryptedMeta));
    expect(parsedMeta.amount).toBe('100.00');
    expect(parsedMeta.token).toBe('USDC');
    expect(parsedMeta.memo).toBe('Payment for services');

    // ─── RECEIVER: Derives stealth private key ───
    const stealthPrivkey = deriveStealthPrivateKey(
      receiver.spendPrivkey,
      receiver.viewPrivkey,
      matches[0].ephemeralPubkey,
    );

    // Verify the stealth private key produces the correct public key
    const scalar = bytesToScalar(stealthPrivkey);
    const derivedPubkey = ed25519.ExtendedPoint.BASE.multiply(scalar).toRawBytes();
    expect(derivedPubkey).toEqual(stealth.stealthPubkey);

    // ─── CLAIM: Verify claim secret ───
    expect(verifyClaimSecret(claimSecret, claimHash)).toBe(true);

    // Wrong secret should fail
    const wrongSecret = generateClaimSecret();
    expect(verifyClaimSecret(wrongSecret, claimHash)).toBe(false);
  });

  it('hex roundtrip for claim secret in URL fragment', () => {
    const secret = generateClaimSecret();
    const hex = bytesToHex(secret);
    const recovered = hexToBytes(hex);
    expect(recovered).toEqual(secret);

    // Verify the recovered secret still validates
    const hash = hashClaimSecret(secret);
    expect(verifyClaimSecret(recovered, hash)).toBe(true);
  });

  it('multiple senders, one receiver', async () => {
    const receiver = generateMetaAddress();

    // Simulate 3 senders
    const stealths = Array.from({ length: 3 }, () =>
      deriveStealthAddress(receiver.spendPubkey, receiver.viewPubkey),
    );

    const announcements = stealths.map((s) => ({
      ephemeralPubkey: s.ephemeralPubkey,
      stealthAddress: s.stealthPubkey,
    }));

    // Add noise from other recipients
    const other = generateMetaAddress();
    const noise = deriveStealthAddress(other.spendPubkey, other.viewPubkey);
    announcements.push({
      ephemeralPubkey: noise.ephemeralPubkey,
      stealthAddress: noise.stealthPubkey,
    });

    const matches = scanAnnouncements(
      announcements,
      receiver.viewPrivkey,
      receiver.spendPubkey,
    );

    expect(matches.length).toBe(3);

    // Each match should have a unique stealth address
    const addresses = matches.map((m) => bytesToHex(m.stealthAddress));
    expect(new Set(addresses).size).toBe(3);
  });
});

function bytesToScalar(bytes: Uint8Array): bigint {
  let scalar = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) {
    scalar = (scalar << 8n) | BigInt(bytes[i]);
  }
  return scalar;
}
