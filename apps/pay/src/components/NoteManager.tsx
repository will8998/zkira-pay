'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/components/WalletProvider';
import { retrieveEncryptedData, storeEncryptedData } from '@/lib/payment-link-crypto';
import ConfirmDialog from '@/components/ConfirmDialog';
import { toast } from 'sonner';

interface StoredNote {
  id: string;
  nullifier: bigint;
  secret: bigint;
  commitment: bigint;
  leafIndex: number;
  depositTx: string;
  depositDate: string;
  denomination: string;
  spent: boolean;
}

export function NoteManager() {
  const { wallet, connected, signMessage } = useWallet();
  const [notes, setNotes] = useState<StoredNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');

  useEffect(() => {
    loadNotes();
  }, [wallet, connected, signMessage]);

  const loadNotes = async () => {
    if (!wallet || !signMessage) {
      setNotes([]);
      return;
    }

    try {
      setLoading(true);
      const storageKey = `zkira_pool_notes_${wallet.publicKey.toString()}`;
      const storedNotes = await retrieveEncryptedData<StoredNote[]>(storageKey, signMessage, wallet.publicKey.toString());
      setNotes(storedNotes || []);
    } catch (error) {
      console.warn('Failed to load notes:', error);
      setNotes([]);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async (updatedNotes: StoredNote[]) => {
    if (!wallet || !signMessage) return;

    try {
      const storageKey = `zkira_pool_notes_${wallet.publicKey.toString()}`;
      await storeEncryptedData(storageKey, updatedNotes, signMessage, wallet.publicKey.toString());
      setNotes(updatedNotes);
    } catch (error) {
      console.warn('Failed to save notes:', error);
      toast.error('Failed to save changes');
    }
  };

  const deleteNote = async (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    await saveNotes(updatedNotes);
    toast.success('Note deleted');
    setNoteToDelete(null);
    setShowDeleteDialog(false);
  };

  const copyNote = (note: StoredNote) => {
    const exportData = {
      nullifier: note.nullifier.toString(),
      secret: note.secret.toString(),
      commitment: note.commitment.toString(),
      leafIndex: note.leafIndex,
      depositTx: note.depositTx,
      depositDate: note.depositDate,
      denomination: note.denomination,
      spent: note.spent,
    };

    navigator.clipboard.writeText(JSON.stringify(exportData));
    toast.success('Note copied to clipboard');
  };

  const importNote = async () => {
    if (!importData.trim()) {
      toast.error('Please enter note data');
      return;
    }

    try {
      const noteData = JSON.parse(importData);
      
      // Validate required fields
      const requiredFields = ['nullifier', 'secret', 'commitment', 'leafIndex'];
      for (const field of requiredFields) {
        if (!(field in noteData)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Create new note with imported data
      const newNote: StoredNote = {
        id: `imported_${Date.now()}`,
        nullifier: BigInt(noteData.nullifier),
        secret: BigInt(noteData.secret),
        commitment: BigInt(noteData.commitment),
        leafIndex: noteData.leafIndex,
        depositTx: noteData.depositTx || 'Unknown',
        depositDate: noteData.depositDate || new Date().toISOString(),
        denomination: noteData.denomination || '10',
        spent: noteData.spent || false,
      };

      // Check for duplicates
      const exists = notes.some(note => 
        note.nullifier === newNote.nullifier && 
        note.secret === newNote.secret
      );

      if (exists) {
        toast.error('Note already exists');
        return;
      }

      const updatedNotes = [...notes, newNote];
      await saveNotes(updatedNotes);
      
      toast.success('Note imported successfully');
      setImportData('');
      setShowImportDialog(false);

    } catch (error) {
      console.warn('Import failed:', error);
      toast.error('Invalid note data format');
    }
  };

  const unspentNotes = notes.filter(note => !note.spent);
  const spentNotes = notes.filter(note => note.spent);

  if (!connected) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">Wallet Required</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Connect your wallet to view and manage your pool notes.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-6 w-6 mr-3 text-[var(--color-text-secondary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-[var(--color-text-secondary)]">Loading notes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text)] uppercase tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>
              Your Pool Notes
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {unspentNotes.length} available • {spentNotes.length} spent
            </p>
          </div>
          <button
            onClick={() => setShowImportDialog(true)}
            className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-hover)] font-medium transition-colors btn-press flex items-center gap-2"
          >
            <span>📥</span>
            Import Note
          </button>
        </div>

        <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-hover)] border border-[var(--color-border)] p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <span>🔐</span>
            <span className="font-medium">Encrypted Storage</span>
          </div>
          <p>Your notes are encrypted and stored locally using your wallet signature. Only you can access them.</p>
        </div>
      </div>

      {/* Available Notes */}
      {unspentNotes.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h4 className="text-sm font-medium text-[var(--color-text)] mb-4 uppercase tracking-wide flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)' }}>
            <span>💰</span>
            Available Notes ({unspentNotes.length})
          </h4>
          
          <div className="space-y-3">
            {unspentNotes.map((note) => (
              <div key={note.id} className="border border-[var(--color-border)] p-4 rounded-lg hover:bg-[var(--color-hover)] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-lg font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-mono)' }}>
                        {note.denomination} USDC
                      </span>
                      <span className="text-xs bg-[var(--color-green)] text-black px-2 py-0.5 rounded uppercase font-medium">
                        Available
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--color-text-secondary)]">
                      <span>Leaf #{note.leafIndex}</span>
                      <span>Deposited: {new Date(note.depositDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyNote(note)}
                      className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] rounded transition-colors"
                      title="Copy note"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => {
                        setNoteToDelete(note.id);
                        setShowDeleteDialog(true);
                      }}
                      className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-red)] hover:bg-[var(--color-surface)] rounded transition-colors"
                      title="Delete note"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spent Notes */}
      {spentNotes.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h4 className="text-sm font-medium text-[var(--color-text)] mb-4 uppercase tracking-wide flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)' }}>
            <span>📤</span>
            Spent Notes ({spentNotes.length})
          </h4>
          
          <div className="space-y-3">
            {spentNotes.map((note) => (
              <div key={note.id} className="border border-[var(--color-border)] p-4 rounded-lg bg-[var(--color-surface)] opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-lg font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-mono)' }}>
                        {note.denomination} USDC
                      </span>
                      <span className="text-xs bg-[var(--color-text-secondary)] text-white px-2 py-0.5 rounded uppercase font-medium">
                        Spent
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--color-text-secondary)]">
                      <span>Leaf #{note.leafIndex}</span>
                      <span>Deposited: {new Date(note.depositDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setNoteToDelete(note.id);
                      setShowDeleteDialog(true);
                    }}
                    className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-red)] hover:bg-[var(--color-hover)] rounded transition-colors"
                    title="Delete note"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {notes.length === 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">No Notes Found</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Make a deposit to the shielded pool or import existing notes.
          </p>
          <button
            onClick={() => setShowImportDialog(true)}
            className="px-4 py-2 bg-[var(--color-button)] text-[var(--color-bg)] hover:bg-[var(--color-button-hover)] font-medium transition-colors btn-press"
          >
            Import Note
          </button>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 max-w-md w-full mx-4">
            <h2 className="text-[17px] font-semibold text-[var(--color-text)] mb-4">Import Pool Note</h2>
            
            <div className="mb-4">
              <label className="text-sm font-medium text-[var(--color-text)] mb-2 block">
                Note Data (JSON)
              </label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste your exported note JSON here..."
                className="w-full h-32 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-2 text-sm focus:border-[var(--color-button)] focus:ring-0 focus:outline-none transition-colors font-[family-name:var(--font-mono)]"
              />
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                Paste the JSON data of a previously exported note.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setImportData('');
                }}
                className="px-4 py-2 text-[13px] font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-text)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={importNote}
                className="bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] px-4 py-2 text-[13px] font-medium transition-colors"
              >
                Import Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteDialog}
        onCancel={() => {
          setShowDeleteDialog(false);
          setNoteToDelete(null);
        }}
        onConfirm={() => noteToDelete && deleteNote(noteToDelete)}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone. Make sure you have backed up the note if you still need it."
        confirmLabel="Delete Note"
        confirmVariant="danger"
      />
    </div>
  );
}