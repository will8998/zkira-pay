/**
 * Script to initialize protocol config on payment-escrow and multisig-escrow with fee_bps=30 (0.3%).
 * If config already exists, calls update_config instead.
 * Usage: npx tsx scripts/update-fees.ts
 */
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  TransactionInstruction,
  VersionedTransaction,
  SystemProgram,
} from '@solana/web3.js';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';

// Program IDs
const PAYMENT_ESCROW_PROGRAM_ID = new PublicKey('DvHQCrzhL8ofNQFqxkRHnqf4Gmkejv48DCFAUMGtKHmX');
const MULTISIG_ESCROW_PROGRAM_ID = new PublicKey('yLGC8fizXAfvxT8AnQaVFCjEAScz5o4zqmBHoPVs3bu');

// New fee: 30 bps = 0.3%
const NEW_FEE_BPS = 30;

function getDiscriminator(name: string): Buffer {
  const hash = createHash('sha256').update(`global:${name}`).digest();
  return hash.subarray(0, 8);
}

function findConfigPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('config')], programId);
}

/**
 * Builds initialize_config instruction data.
 * Anchor: initialize_config(fee_bps: u16)
 */
function buildInitializeConfigData(feeBps: number): Buffer {
  const discriminator = getDiscriminator('initialize_config');
  const data = Buffer.alloc(8 + 2); // discriminator + u16
  discriminator.copy(data, 0);
  data.writeUInt16LE(feeBps, 8);
  return data;
}

/**
 * Builds update_config instruction data.
 * Anchor: update_config(new_admin: Option<Pubkey>, new_fee_recipient: Option<Pubkey>, new_fee_bps: Option<u16>, paused: Option<bool>)
 */
function buildUpdateConfigData(newFeeBps: number): Buffer {
  const discriminator = getDiscriminator('update_config');
  const data = Buffer.alloc(8 + 1 + 1 + 1 + 2 + 1);
  let offset = 0;
  discriminator.copy(data, offset); offset += 8;
  data.writeUInt8(0, offset); offset += 1; // new_admin = None
  data.writeUInt8(0, offset); offset += 1; // new_fee_recipient = None
  data.writeUInt8(1, offset); offset += 1; // new_fee_bps = Some
  data.writeUInt16LE(newFeeBps, offset); offset += 2;
  data.writeUInt8(0, offset); offset += 1; // paused = None
  return data;
}

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  const deployerSecret = JSON.parse(readFileSync('keys/deployer.json', 'utf-8'));
  const deployer = Keypair.fromSecretKey(Uint8Array.from(deployerSecret));
  console.log(`Admin/Deployer: ${deployer.publicKey.toBase58()}`);

  const [paymentConfig] = findConfigPDA(PAYMENT_ESCROW_PROGRAM_ID);
  const [multisigConfig] = findConfigPDA(MULTISIG_ESCROW_PROGRAM_ID);

  console.log(`Payment Escrow Config PDA: ${paymentConfig.toBase58()}`);
  console.log(`Multisig Escrow Config PDA: ${multisigConfig.toBase58()}`);

  // Check if configs exist
  const paymentConfigInfo = await connection.getAccountInfo(paymentConfig);
  const multisigConfigInfo = await connection.getAccountInfo(multisigConfig);

  const instructions: TransactionInstruction[] = [];

  // Payment Escrow
  if (!paymentConfigInfo) {
    console.log('\nPayment Escrow config NOT initialized — calling initialize_config...');
    instructions.push(new TransactionInstruction({
      programId: PAYMENT_ESCROW_PROGRAM_ID,
      keys: [
        { pubkey: paymentConfig, isSigner: false, isWritable: true },
        { pubkey: deployer.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: buildInitializeConfigData(NEW_FEE_BPS),
    }));
  } else {
    console.log('\nPayment Escrow config exists — calling update_config...');
    instructions.push(new TransactionInstruction({
      programId: PAYMENT_ESCROW_PROGRAM_ID,
      keys: [
        { pubkey: paymentConfig, isSigner: false, isWritable: true },
        { pubkey: deployer.publicKey, isSigner: true, isWritable: false },
      ],
      data: buildUpdateConfigData(NEW_FEE_BPS),
    }));
  }

  // Multisig Escrow
  if (!multisigConfigInfo) {
    console.log('Multisig Escrow config NOT initialized — calling initialize_config...');
    instructions.push(new TransactionInstruction({
      programId: MULTISIG_ESCROW_PROGRAM_ID,
      keys: [
        { pubkey: multisigConfig, isSigner: false, isWritable: true },
        { pubkey: deployer.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: buildInitializeConfigData(NEW_FEE_BPS),
    }));
  } else {
    console.log('Multisig Escrow config exists — calling update_config...');
    instructions.push(new TransactionInstruction({
      programId: MULTISIG_ESCROW_PROGRAM_ID,
      keys: [
        { pubkey: multisigConfig, isSigner: false, isWritable: true },
        { pubkey: deployer.publicKey, isSigner: true, isWritable: false },
      ],
      data: buildUpdateConfigData(NEW_FEE_BPS),
    }));
  }

  // Send transaction
  const blockhash = await connection.getLatestBlockhash();
  const message = new TransactionMessage({
    payerKey: deployer.publicKey,
    recentBlockhash: blockhash.blockhash,
    instructions,
  }).compileToV0Message();

  const tx = new VersionedTransaction(message);
  tx.sign([deployer]);

  console.log(`\nSending ${instructions.length} instruction(s)...`);
  const sig = await connection.sendTransaction(tx);
  console.log(`Signature: ${sig}`);

  await connection.confirmTransaction({ signature: sig, ...blockhash }, 'confirmed');
  console.log('✅ Transaction confirmed!');

  // Verify
  console.log('\n--- Verification ---');
  const paymentConfigData = await connection.getAccountInfo(paymentConfig);
  if (paymentConfigData) {
    const feeBps = paymentConfigData.data.readUInt16LE(8 + 32 + 32);
    console.log(`Payment Escrow fee_bps: ${feeBps} (${(feeBps / 100).toFixed(1)}%)`);
  }
  const multisigConfigData = await connection.getAccountInfo(multisigConfig);
  if (multisigConfigData) {
    const feeBps = multisigConfigData.data.readUInt16LE(8 + 32 + 32);
    console.log(`Multisig Escrow fee_bps: ${feeBps} (${(feeBps / 100).toFixed(1)}%)`);
  }

  console.log('\nDone! All protocol fees set to 0.3% (30 bps).');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
