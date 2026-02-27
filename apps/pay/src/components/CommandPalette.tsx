'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useWallet } from './WalletProvider';
import { toast } from 'sonner';

const CommandPaletteContext = createContext<{ 
  open: boolean; 
  setOpen: (open: boolean) => void; 
}>({ 
  open: false, 
  setOpen: () => {} 
});

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();
  const { connected, publicKey, connect, disconnect } = useWallet();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      keywords: ['home', 'dashboard', 'overview'],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      )
    },
    {
      name: 'Send Payment',
      href: '/create',
      keywords: ['transfer', 'send', 'pay', 'create', 'new'],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
      )
    },
    {
      name: 'Request Payment',
      href: '/request',
      keywords: ['invoice', 'request', 'receive', 'generate'],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
        </svg>
      )
    },
    {
      name: 'Batch Payments',
      href: '/batch',
      keywords: ['bulk', 'multiple', 'batch'],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 17.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      )
    },
    {
      name: 'Escrow',
      href: '/escrow',
      keywords: ['secure', 'protected', 'escrow'],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      )
    },
    {
      name: 'Multi-sig',
      href: '/multisig',
      keywords: ['multisig', 'multi-signature', 'group'],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      )
    },
    {
      name: 'History',
      href: '/history',
      keywords: ['transactions', 'activity', 'log', 'past'],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: 'Contacts',
      href: '/contacts',
      keywords: ['address book', 'contacts', 'people', 'recipients'],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      )
    },
    {
      name: 'API Keys',
      href: '/developers',
      keywords: ['api', 'keys', 'developers', 'integration'],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
      )
    },
    {
      name: 'Documentation',
      href: '/developers/docs',
      keywords: ['docs', 'guide', 'help', 'documentation'],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    }
  ];

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toBase58());
      toast.success('Address copied');
      setOpen(false);
    }
  };

  const viewExplorer = () => {
    if (publicKey) {
      window.open(`https://solscan.io/account/${publicKey.toBase58()}?cluster=devnet`, '_blank');
      setOpen(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast('Wallet disconnected');
    setOpen(false);
  };

  const handleConnect = () => {
    connect();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={() => setOpen(false)} 
      />
      <div className="fixed inset-x-4 top-[10%] md:inset-x-auto md:top-[20%] md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-[560px] z-50 animate-scale-in">
        <Command className="bg-[#111111] border border-[#282828] overflow-hidden">
          <div className="flex items-center gap-2 px-4 border-b border-[var(--color-border)]">
            <svg 
              className="w-4 h-4 text-[var(--color-text-muted)]"
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <Command.Input
              placeholder="Search commands..."
              className="flex-1 py-3 text-[16px] md:text-[15px] outline-none placeholder-[var(--color-text-muted)] bg-transparent"
            />
            <button
              onClick={() => setOpen(false)}
              className="md:hidden p-1 text-[var(--color-text-muted)] hover:text-[var(--color-button)] transition-colors"
              aria-label="Close command palette"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span className="hidden md:inline kbd text-[10px]">ESC</span>
          </div>
          <Command.List className="max-h-[60vh] md:max-h-[320px] overflow-y-auto py-2">
            <Command.Empty className="px-4 py-8 text-center text-[13px] text-[var(--color-text-muted)]">
              No results found.
            </Command.Empty>
            
            <Command.Group>
              <div className="text-[10px] font-medium tracking-[0.1em] text-[var(--color-text-secondary)] uppercase px-4 py-1.5">
                Navigation
              </div>
              {navItems.map(item => (
                <Command.Item 
                  key={item.href} 
                  keywords={item.keywords}
                  onSelect={() => { 
                    router.push(item.href); 
                    setOpen(false); 
                  }}
                  className="min-h-[44px] px-3 py-3 md:py-2.5 mx-2 rounded-md text-[13px] flex items-center gap-3 cursor-pointer transition-colors text-[var(--color-text-secondary)] data-[selected=true]:bg-[rgba(255,40,40,0.12)] data-[selected=true]:text-white"
                >
                  {item.icon}
                  {item.name}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group>
              <div className="text-[10px] font-medium tracking-[0.1em] text-[var(--color-text-secondary)] uppercase px-4 py-1.5">
                Actions
              </div>
              {connected ? (
                <>
                  <Command.Item 
                    onSelect={copyAddress}
                    keywords={['copy', 'clipboard', 'address']}
                    className="min-h-[44px] px-3 py-3 md:py-2.5 mx-2 rounded-md text-[13px] flex items-center gap-3 cursor-pointer transition-colors text-[var(--color-text-secondary)] data-[selected=true]:bg-[rgba(255,40,40,0.12)] data-[selected=true]:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                    </svg>
                    Copy Wallet Address
                  </Command.Item>
                  <Command.Item 
                    onSelect={viewExplorer}
                    keywords={['explorer', 'solscan', 'blockchain']}
                    className="min-h-[44px] px-3 py-3 md:py-2.5 mx-2 rounded-md text-[13px] flex items-center gap-3 cursor-pointer transition-colors text-[var(--color-text-secondary)] data-[selected=true]:bg-[rgba(255,40,40,0.12)] data-[selected=true]:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    View on Solscan
                  </Command.Item>
                  <Command.Item 
                    onSelect={handleDisconnect}
                    keywords={['logout', 'sign out', 'disconnect']}
                    className="min-h-[44px] px-3 py-3 md:py-2.5 mx-2 rounded-md text-[13px] flex items-center gap-3 cursor-pointer transition-colors text-[var(--color-text-secondary)] data-[selected=true]:bg-[rgba(255,40,40,0.12)] data-[selected=true]:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Disconnect Wallet
                  </Command.Item>
                </>
              ) : (
                <Command.Item 
                  onSelect={handleConnect}
                  keywords={['login', 'sign in', 'connect', 'wallet']}
                  className="min-h-[44px] px-3 py-3 md:py-2.5 mx-2 rounded-md text-[13px] flex items-center gap-3 cursor-pointer transition-colors text-[var(--color-text-secondary)] data-[selected=true]:bg-[rgba(255,40,40,0.12)] data-[selected=true]:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9v3m18 0a2.25 2.25 0 01-2.25 2.25H15a3 3 0 11-6 0H5.25a2.25 2.25 0 01-2.25-2.25m18 0V9a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9v3m18 0a2.25 2.25 0 01-2.25 2.25H15a3 3 0 11-6 0H5.25a2.25 2.25 0 01-2.25-2.25"   />
                  </svg>
                  Connect Wallet
                </Command.Item>
              )}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </>
  );
}