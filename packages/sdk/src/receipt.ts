import type { PoolNote, EncryptedReceipt } from './types.js';

/**
 * Manages encrypted storage and retrieval of shielded pool notes.
 * Uses password-based encryption with AES-256-GCM and PBKDF2 key derivation.
 */
export class ReceiptManager {
  private static readonly PBKDF2_ITERATIONS = 100000;
  private static readonly SALT_LENGTH = 16;
  private static readonly IV_LENGTH = 12;

  /**
   * Encrypts a pool note with password-based encryption.
   * 
   * @param note - The pool note to encrypt
   * @param password - Password for encryption
   * @param poolAddress - Pool address (base58)
   * @param denomination - Pool denomination
   * @returns Encrypted receipt
   */
  static async encrypt(
    note: PoolNote,
    password: string,
    poolAddress: string,
    denomination: bigint
  ): Promise<EncryptedReceipt> {
    // Serialize note data
    const noteData = {
      nullifier: note.nullifier.toString(16),
      secret: note.secret.toString(16),
      commitment: note.commitment.toString(16),
      leafIndex: note.leafIndex
    };
    
    const plaintext = new TextEncoder().encode(JSON.stringify(noteData));
    const passwordBytes = new TextEncoder().encode(password);
    
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBytes,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    // Derive encryption key using PBKDF2
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // Encrypt the plaintext
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plaintext
    );
    
    // Encode to base64
    const encryptedBase64 = this.arrayBufferToBase64(ciphertext);
    const saltBase64 = this.uint8ArrayToBase64(salt);
    const ivBase64 = this.uint8ArrayToBase64(iv);
    
    return {
      v: 1,
      pool: poolAddress,
      denomination: denomination.toString(),
      encrypted: encryptedBase64,
      salt: saltBase64,
      iv: ivBase64
    };
  }

  /**
   * Decrypts an encrypted receipt back to a pool note.
   * 
   * @param receipt - The encrypted receipt
   * @param password - Password for decryption
   * @returns Decrypted pool note
   * @throws Error if password is invalid or receipt is malformed
   */
  static async decrypt(receipt: EncryptedReceipt, password: string): Promise<PoolNote> {
    // Validate receipt version
    if (receipt.v !== 1) {
      throw new Error(`Unsupported receipt version: ${receipt.v}`);
    }
    
    try {
      // Decode base64 data
      const salt = this.base64ToUint8Array(receipt.salt);
      const iv = this.base64ToUint8Array(receipt.iv);
      const ciphertext = this.base64ToArrayBuffer(receipt.encrypted);
      
      const passwordBytes = new TextEncoder().encode(password);
      
      // Import password as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBytes,
        'PBKDF2',
        false,
        ['deriveKey']
      );
      
      // Derive decryption key using same PBKDF2 parameters
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: this.PBKDF2_ITERATIONS,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
      // Decrypt the ciphertext
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );
      
      // Parse the decrypted data
      const decryptedText = new TextDecoder().decode(plaintext);
      const noteData = JSON.parse(decryptedText);
      
      // Convert hex strings back to bigint
      return {
        nullifier: BigInt('0x' + noteData.nullifier),
        secret: BigInt('0x' + noteData.secret),
        commitment: BigInt('0x' + noteData.commitment),
        leafIndex: noteData.leafIndex
      };
    } catch (error) {
      // AES-GCM throws on wrong password/corrupted data
      if (error instanceof Error && error.name === 'OperationError') {
        throw new Error('Invalid password');
      }
      throw error;
    }
  }

  /**
   * Downloads an encrypted receipt as a JSON file.
   * Browser-only functionality.
   * 
   * @param receipt - The encrypted receipt to download
   * @param filename - Optional custom filename
   */
  static downloadReceipt(receipt: EncryptedReceipt, filename?: string): void {
    if (typeof (globalThis as any).window === 'undefined') {
      throw new Error('downloadReceipt is only available in browser environments');
    }
    
    const defaultFilename = `zkira-receipt-${Date.now()}.json`;
    const finalFilename = filename || defaultFilename;
    
    const jsonString = JSON.stringify(receipt, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    try {
      const link = (globalThis as any).document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      (globalThis as any).document.body.appendChild(link);
      link.click();
      (globalThis as any).document.body.removeChild(link);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Parses and validates a receipt from JSON string.
   * 
   * @param input - JSON string containing the receipt
   * @returns Parsed and validated encrypted receipt
   * @throws Error if the input is not a valid receipt
   */
  static parseReceipt(input: string): EncryptedReceipt {
    let parsed: any;
    
    try {
      parsed = JSON.parse(input);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
    
    // Validate receipt structure
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Receipt must be an object');
    }
    
    if (parsed.v !== 1) {
      throw new Error(`Unsupported receipt version: ${parsed.v}`);
    }
    
    const requiredFields = ['pool', 'denomination', 'encrypted', 'salt', 'iv'];
    for (const field of requiredFields) {
      if (typeof parsed[field] !== 'string') {
        throw new Error(`Missing or invalid field: ${field}`);
      }
    }
    
    return parsed as EncryptedReceipt;
  }

  // Base64 encoding/decoding helpers using browser-native APIs
  private static uint8ArrayToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
  }

  private static base64ToUint8Array(base64: string): Uint8Array {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    return bytes.buffer;
  }
}