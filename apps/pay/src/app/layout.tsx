import type { Metadata } from 'next';
import { Poppins, JetBrains_Mono } from 'next/font/google';
import { WalletContextProvider } from '@/components/WalletProvider';
import { NetworkProvider } from '@/lib/network-config';
import { TopBar } from '@/components/TopBar';
import { CommandPaletteProvider, CommandPalette } from '@/components/CommandPalette';
import { Toaster } from 'sonner';
import './globals.css';
import { BottomTabBar } from '@/components/BottomTabBar';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ZKIRA Pay — Stealth Payments',
  description: 'Send and receive confidential payments on Solana with stealth addresses. Zero traceability, instant settlement.',
  metadataBase: new URL('https://app.zkira.xyz'),
  openGraph: {
    title: 'ZKIRA Pay — Stealth Payments',
    description: 'Send and receive confidential payments on Solana with stealth addresses. Zero traceability, instant settlement.',
    url: 'https://app.zkira.xyz',
    siteName: 'ZKIRA Pay',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZKIRA Pay — Stealth Payments',
    description: 'Send and receive confidential payments on Solana with stealth addresses.',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className={`${poppins.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#000000] text-[var(--color-text)] font-[family-name:var(--font-sans)] antialiased">
        <div className="scanlines" />
        <NetworkProvider>
          <WalletContextProvider>
            <CommandPaletteProvider>
              <div className="relative z-10 flex flex-col h-dvh overflow-hidden">
                <TopBar />
                <Toaster
                  position="top-center"
                  richColors
                  theme="dark"
                  toastOptions={{
                    className: 'font-[family-name:var(--font-sans)]',
                  }}
                />
                <main className="flex-1 overflow-y-auto bg-[var(--bg-main)] pb-20 md:pb-0">
                  {children}
                </main>
              </div>
              <CommandPalette />
            </CommandPaletteProvider>
            <BottomTabBar />
          </WalletContextProvider>
        </NetworkProvider>
      </body>
    </html>
  );
}
