'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';

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
      name: 'Home',
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
      name: 'Claim Payment',
      href: '/claim',
      keywords: ['claim', 'redeem', 'receive', 'code'],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      )
    },
    {
      name: 'Pool',
      href: '/pool',
      keywords: ['deposit', 'withdraw', 'pool', 'mixer'],
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
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
  ];

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
          </Command.List>
        </Command>
      </div>
    </>
  );
}
