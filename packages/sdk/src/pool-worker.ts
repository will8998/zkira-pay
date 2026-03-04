/**
 * Web Worker for snarkjs proof generation.
 * Runs snarkjs.groth16.fullProve() inside a Web Worker to avoid blocking the main thread.
 * Falls back to direct execution if Web Workers are not available (Node.js).
 */

export interface ProofGenerationInput {
  signals: Record<string, any>;
  wasmUrl: string;
  zkeyUrl: string;
}

export interface ProofGenerationResult {
  proof: any;
  publicSignals: string[];
}

/**
 * Generate a Groth16 proof using snarkjs.
 * Uses Web Worker in browser environments, direct execution in Node.js.
 */
export async function generateProof(input: ProofGenerationInput): Promise<ProofGenerationResult> {
  // Check if we're in a browser environment with Web Worker support
  if (typeof globalThis !== 'undefined' && 'Worker' in globalThis && 'window' in globalThis) {
    return generateProofWithWorker(input);
  } else {
    // Fallback for Node.js or environments without Web Worker support
    return generateProofDirect(input);
  }
}

/**
 * Generate proof using Web Worker (browser).
 */
async function generateProofWithWorker(input: ProofGenerationInput): Promise<ProofGenerationResult> {
  return new Promise((resolve, reject) => {
    // Create worker from inline code to avoid separate file dependency
    const workerCode = `
      // Import snarkjs dynamically
      let snarkjs;
      
      self.onmessage = async function(e) {
        try {
          const { signals, wasmUrl, zkeyUrl } = e.data;
          
          // Dynamic import of snarkjs
          if (!snarkjs) {
            snarkjs = await import('snarkjs');
          }
          
          // Fetch circuit files
          const wasmResponse = await fetch(wasmUrl);
          const wasmBuffer = await wasmResponse.arrayBuffer();
          
          const zkeyResponse = await fetch(zkeyUrl);
          const zkeyBuffer = await zkeyResponse.arrayBuffer();
          
          // Generate proof
          const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            signals,
            new Uint8Array(wasmBuffer),
            new Uint8Array(zkeyBuffer)
          );
          
          self.postMessage({ success: true, proof, publicSignals });
        } catch (error) {
          self.postMessage({ 
            success: false, 
            error: error.message || 'Unknown error during proof generation' 
          });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const WorkerConstructor = (globalThis as any).Worker;
    const worker = new WorkerConstructor(URL.createObjectURL(blob));

    worker.onmessage = (e: any) => {
      const { success, proof, publicSignals, error } = e.data;
      
      if (success) {
        resolve({ proof, publicSignals });
      } else {
        reject(new Error(error));
      }
      
      worker.terminate();
      URL.revokeObjectURL(worker.url);
    };

    worker.onerror = (error: any) => {
      reject(new Error(`Worker error: ${error.message}`));
      worker.terminate();
    };

    worker.postMessage(input);
  });
}

/**
 * Generate proof directly (Node.js fallback).
 */
async function generateProofDirect(input: ProofGenerationInput): Promise<ProofGenerationResult> {
  // Dynamic import to avoid loading snarkjs at module load time
  const snarkjs = await import('snarkjs' as any);
  
  const { signals, wasmUrl, zkeyUrl } = input;
  
  // In Node.js, URLs might be file paths or actual URLs
  let wasmBuffer: Uint8Array;
  let zkeyBuffer: Uint8Array;
  
  if (wasmUrl.startsWith('http')) {
    // Fetch from URL
    const wasmResponse = await fetch(wasmUrl);
    wasmBuffer = new Uint8Array(await wasmResponse.arrayBuffer());
    
    const zkeyResponse = await fetch(zkeyUrl);
    zkeyBuffer = new Uint8Array(await zkeyResponse.arrayBuffer());
  } else {
    // Read from file system (Node.js)
    const fs = await import('fs');
    wasmBuffer = new Uint8Array(fs.readFileSync(wasmUrl));
    zkeyBuffer = new Uint8Array(fs.readFileSync(zkeyUrl));
  }
  
  // Generate proof
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    signals,
    wasmBuffer,
    zkeyBuffer
  );
  
  return { proof, publicSignals };
}