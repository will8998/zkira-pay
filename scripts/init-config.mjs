import { Connection, Keypair, Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { sha256 } from '@noble/hashes/sha256';
import { readFileSync } from 'fs';
import { homedir } from 'os';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

const keypairData = JSON.parse(readFileSync(new URL('../keys/deployer.json', import.meta.url), 'utf-8'));
const admin = Keypair.fromSecretKey(new Uint8Array(keypairData));

console.log('Admin:', admin.publicKey.toBase58());

const PROGRAM_ID = new PublicKey('DvHQCrzhL8ofNQFqxkRHnqf4Gmkejv48DCFAUMGtKHmX');

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('config')],
  PROGRAM_ID
);
console.log('Config PDA:', configPda.toBase58());

const configInfo = await connection.getAccountInfo(configPda);
if (configInfo) {
  console.log('Config already initialized! Skipping.');
  process.exit(0);
}

// Build initialize_config instruction
// Anchor discriminator = sha256("global:initialize_config")[0..8]
const discriminator = sha256('global:initialize_config').slice(0, 8);

// fee_bps: u16 LE = 25 (0.25%)
const feeBpsBytes = new Uint8Array(2);
new DataView(feeBpsBytes.buffer).setUint16(0, 25, true);

const data = Buffer.concat([Buffer.from(discriminator), feeBpsBytes]);

const ix = {
  keys: [
    { pubkey: configPda, isSigner: false, isWritable: true },
    { pubkey: admin.publicKey, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ],
  programId: PROGRAM_ID,
  data,
};

const tx = new Transaction().add(ix);
const { blockhash } = await connection.getLatestBlockhash();
tx.recentBlockhash = blockhash;
tx.feePayer = admin.publicKey;
tx.sign(admin);

const sig = await connection.sendRawTransaction(tx.serialize());
await connection.confirmTransaction(sig);

console.log('Config initialized! Tx:', sig);
console.log('Fee: 0.25% (25 bps)');
console.log('Fee Recipient:', admin.publicKey.toBase58());
