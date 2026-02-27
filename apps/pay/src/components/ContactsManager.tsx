'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useWallet } from './WalletProvider';
import { EmptyState } from './EmptyState';

interface Contact {
  id: string;
  name: string;
  metaAddress: string;
  createdAt: number;
}

const STORAGE_KEY = 'zkira_contacts';

export function ContactsManager() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', metaAddress: '' });
  const [errors, setErrors] = useState<{ name?: string; metaAddress?: string }>({});
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Load contacts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setContacts(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  }, []);

  // Save contacts to localStorage whenever contacts change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    } catch (error) {
      console.error('Failed to save contacts:', error);
    }
  }, [contacts]);

  const generateContactId = () => 
    `contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const validateForm = () => {
    const newErrors: { name?: string; metaAddress?: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name must be 50 characters or less';
    }

    if (!formData.metaAddress.trim()) {
      newErrors.metaAddress = 'Meta-address is required';
    } else if (formData.metaAddress.length < 32 || formData.metaAddress.length > 44) {
      newErrors.metaAddress = 'Meta-address must be a valid base58 address';
    }

    // Check for duplicate names (excluding current contact when editing)
    const existingContact = contacts.find(contact => 
      contact.name.toLowerCase() === formData.name.trim().toLowerCase() &&
      contact.id !== editingContactId
    );
    if (existingContact) {
      newErrors.name = 'A contact with this name already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddContact = () => {
    if (!validateForm()) return;

    const newContact: Contact = {
      id: generateContactId(),
      name: formData.name.trim(),
      metaAddress: formData.metaAddress.trim(),
      createdAt: Date.now(),
    };

    setContacts(prev => [newContact, ...prev]);
    setFormData({ name: '', metaAddress: '' });
    setIsAddingContact(false);
    toast.success('Contact added');
  };

  const handleEditContact = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setFormData({ name: contact.name, metaAddress: contact.metaAddress });
      setEditingContactId(contactId);
      setIsAddingContact(true);
    }
  };

  const handleUpdateContact = () => {
    if (!validateForm() || !editingContactId) return;

    setContacts(prev => prev.map(contact => 
      contact.id === editingContactId
        ? { ...contact, name: formData.name.trim(), metaAddress: formData.metaAddress.trim() }
        : contact
    ));

    setFormData({ name: '', metaAddress: '' });
    setEditingContactId(null);
    setIsAddingContact(false);
    toast.success('Contact updated');
  };

  const handleDeleteContact = (contactId: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== contactId));
    setDeleteConfirm(null);
    toast('Contact deleted');
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast.success('Address copied');
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = address;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedAddress(address);
      toast.success('Address copied');
      setTimeout(() => setCopiedAddress(null), 2000);
    }
  };

  const handlePayContact = (contact: Contact) => {
    const params = new URLSearchParams({
      contact: contact.name,
      meta: contact.metaAddress,
    });
    router.push(`/create?${params.toString()}`);
  };

  const handleExportContacts = () => {
    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      contacts: contacts,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zkira-contacts-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportContacts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);
        
        let importedContacts: Contact[] = [];
        
        // Support both exported format and direct contact array
        if (importData.contacts && Array.isArray(importData.contacts)) {
          importedContacts = importData.contacts;
        } else if (Array.isArray(importData)) {
          importedContacts = importData;
        } else {
          throw new Error('Invalid file format');
        }

        // Validate contacts structure
        const validContacts = importedContacts.filter(contact => 
          contact &&
          typeof contact.name === 'string' &&
          typeof contact.metaAddress === 'string' &&
          contact.name.trim() &&
          contact.metaAddress.trim()
        ).map(contact => ({
          id: generateContactId(), // Generate new IDs to avoid conflicts
          name: contact.name.trim(),
          metaAddress: contact.metaAddress.trim(),
          createdAt: contact.createdAt || Date.now(),
        }));

        if (validContacts.length === 0) {
          throw new Error('No valid contacts found in file');
        }

        // Merge with existing contacts, avoiding duplicates by name
        setContacts(prev => {
          const existingNames = new Set(prev.map(c => c.name.toLowerCase()));
          const newContacts = validContacts.filter(c => !existingNames.has(c.name.toLowerCase()));
          return [...newContacts, ...prev];
        });

      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import contacts. Please check the file format.');
      } finally {
        setIsImporting(false);
        event.target.value = ''; // Reset file input
      }
    };
    
    reader.readAsText(file);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.metaAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCancelForm = () => {
    setFormData({ name: '', metaAddress: '' });
    setEditingContactId(null);
    setIsAddingContact(false);
    setErrors({});
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-slide-up">

      {/* Wallet Status */}
      {connected && (
        <div className="border border-[var(--color-border)] bg-[var(--color-hover)] p-4 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">Wallet Status</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[var(--color-green)]"></div>
            <span className="text-sm text-[var(--color-text)] font-medium">
              Connected: {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
            </span>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-h-[44px] border border-[var(--color-border)] bg-[var(--color-hover)] px-4 py-3 focus:border-[var(--color-text)] focus:outline-none transition-colors input-focus"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsAddingContact(true)}
            className="min-h-[44px] px-4 py-3 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] font-medium transition-colors whitespace-nowrap btn-press"
          >
            Add Contact
          </button>
          <button
            onClick={handleExportContacts}
            disabled={contacts.length === 0}
            className="min-h-[44px] px-4 py-3 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-text)] hover:text-[var(--color-text)] font-medium transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed btn-press"
          >
            Export
          </button>
          <label className="min-h-[44px] px-4 py-3 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-text)] hover:text-[var(--color-text)] font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center">
            {isImporting ? 'Importing...' : 'Import'}
            <input
              type="file"
              accept=".json"
              onChange={handleImportContacts}
              className="hidden"
              disabled={isImporting}
            />
          </label>
        </div>
      </div>

      {/* Add/Edit Contact Form */}
      {isAddingContact && (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--color-text)]">
              {editingContactId ? 'Edit Contact' : 'Add New Contact'}
            </h2>
            <button
              onClick={handleCancelForm}
              className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors btn-press"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium mb-2 block">
                Contact Name
              </label>
              <input
                type="text"
                placeholder="Enter contact name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full min-h-[44px] border border-[var(--color-border)] bg-[var(--color-hover)] px-4 py-3 focus:border-[var(--color-text)] focus:outline-none transition-colors input-focus"
              />
              {errors.name && <p className="text-[var(--color-red)] text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium mb-2 block">
                Meta-Address
              </label>
              <input
                type="text"
                placeholder="Base58 meta-address"
                value={formData.metaAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, metaAddress: e.target.value }))}
                className="w-full min-h-[44px] border border-[var(--color-border)] bg-[var(--color-hover)] px-4 py-3 focus:border-[var(--color-text)] focus:outline-none transition-colors font-[family-name:var(--font-mono)] text-sm input-focus"
              />
              {errors.metaAddress && <p className="text-[var(--color-red)] text-sm mt-1">{errors.metaAddress}</p>}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={editingContactId ? handleUpdateContact : handleAddContact}
              className="min-h-[44px] px-6 py-3 bg-[var(--color-button)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] font-medium transition-colors btn-press"
            >
              {editingContactId ? 'Update Contact' : 'Add Contact'}
            </button>
            <button
              onClick={handleCancelForm}
              className="min-h-[44px] px-6 py-3 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-text)] hover:text-[var(--color-text)] font-medium transition-colors btn-press"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contacts List */}
      {filteredContacts.length === 0 ? (
        searchTerm ? (
          <EmptyState
            title="No contacts found"
            description={`No contacts match "${searchTerm}". Try a different search term.`}
            compact
          />
        ) : (
          <EmptyState
            title="No contacts yet"
            description="Add contacts to quickly send confidential payments to saved meta-addresses."
            actionLabel="Add Your First Contact"
            onAction={() => setIsAddingContact(true)}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
        )
      ) : (
        <div className="space-y-4">
          {filteredContacts.map((contact, index) => (
            <div
              key={contact.id}
              className="border border-[var(--color-border)] bg-[var(--color-surface)] animate-entrance"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Mobile Layout */}
              <div className="md:hidden p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-[var(--color-text)] truncate">
                      {contact.name}
                    </h3>
                    <p className="text-xs text-[var(--color-muted)] font-mono truncate mt-1">
                      {contact.metaAddress.slice(0, 16)}...{contact.metaAddress.slice(-4)}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium whitespace-nowrap">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {/* Mobile Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePayContact(contact)}
                    className="min-h-[44px] min-w-[44px] flex-1 bg-[var(--color-green)] hover:bg-[var(--color-green-hover)] text-[var(--color-bg)] text-sm font-medium transition-colors btn-press"
                  >
                    Pay
                  </button>
                  <button
                    onClick={() => handleCopyAddress(contact.metaAddress)}
                    className="min-h-[44px] min-w-[44px] px-3 border border-[var(--color-border)] bg-[var(--color-hover)] hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] text-sm font-medium transition-colors btn-press"
                  >
                    {copiedAddress === contact.metaAddress ? '✓' : 'Copy'}
                  </button>
                  <button
                    onClick={() => handleEditContact(contact.id)}
                    className="min-h-[44px] min-w-[44px] px-3 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-text)] hover:text-[var(--color-text)] text-sm font-medium transition-colors btn-press"
                  >
                    Edit
                  </button>
                  {deleteConfirm === contact.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="min-h-[44px] min-w-[44px] px-2 bg-[var(--color-red)] text-[var(--color-bg)] text-xs font-medium transition-colors btn-press"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="min-h-[44px] min-w-[44px] px-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-xs font-medium transition-colors btn-press"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(contact.id)}
                      className="min-h-[44px] min-w-[44px] px-3 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-red)] hover:border-[var(--color-red)] text-sm font-medium transition-colors btn-press"
                    >
                      Del
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:block p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-[var(--color-text)] truncate">
                        {contact.name}
                      </h3>
                      <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium whitespace-nowrap">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-muted)] font-medium">
                        Meta-Address
                      </span>
                      <code className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-text-secondary)] break-all flex-1">
                        {contact.metaAddress}
                      </code>
                      <button
                        onClick={() => handleCopyAddress(contact.metaAddress)}
                        className="min-h-[44px] min-w-[44px] px-3 py-1.5 border border-[var(--color-border)] bg-[var(--color-hover)] hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors text-sm font-medium whitespace-nowrap btn-press"
                      >
                        {copiedAddress === contact.metaAddress ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Desktop Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handlePayContact(contact)}
                    className="min-h-[44px] min-w-[44px] px-4 py-2 bg-[var(--color-green)] hover:bg-[var(--color-green-hover)] text-[var(--color-bg)] font-medium transition-colors btn-press"
                  >
                    Pay
                  </button>
                  <button
                    onClick={() => handleEditContact(contact.id)}
                    className="min-h-[44px] min-w-[44px] px-4 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-text)] hover:text-[var(--color-text)] font-medium transition-colors btn-press"
                  >
                    Edit
                  </button>
                  {deleteConfirm === contact.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="min-h-[44px] min-w-[44px] px-3 py-2 bg-[var(--color-red)] text-[var(--color-bg)] font-medium transition-colors text-sm btn-press"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="min-h-[44px] min-w-[44px] px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-text)] hover:text-[var(--color-text)] font-medium transition-colors text-sm btn-press"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(contact.id)}
                      className="min-h-[44px] min-w-[44px] px-4 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-red)] hover:border-[var(--color-red)] font-medium transition-colors btn-press"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}