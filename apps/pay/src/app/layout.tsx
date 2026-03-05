import type { Metadata } from 'next';
import { Chakra_Petch, Share_Tech_Mono } from 'next/font/google';
import { BrowserWalletProvider } from '@/components/BrowserWalletProvider';
import { getWhitelabelConfig } from '@/config/whitelabel';
import { TopBar } from '@/components/TopBar';
import { Sidebar } from '@/components/Sidebar';
import { CommandPaletteProvider, CommandPalette } from '@/components/CommandPalette';
import { Toaster } from 'sonner';
import './globals.css';
import { BottomTabBar } from '@/components/BottomTabBar';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { isRtl } from '@/i18n/config';
import type { Locale } from '@/i18n/config';

const chakraPetch = Chakra_Petch({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const shareTechMono = Share_Tech_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ZKIRA Pay — Private Payments',
  description: 'Anonymous multi-chain privacy mixer. Deposit and withdraw USDC, USDT, and DAI on Arbitrum and Tron with zero-knowledge proofs.',
  metadataBase: new URL('https://app.zkirapay.xyz'),
  openGraph: {
    title: 'ZKIRA Pay — Private Payments',
    description: 'Anonymous multi-chain privacy mixer powered by zero-knowledge proofs. Break the on-chain link between sender and receiver.',
    url: 'https://app.zkirapay.xyz',
    siteName: 'ZKIRA Pay',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZKIRA Pay — Private Payments',
    description: 'Anonymous multi-chain privacy mixer. Zero-knowledge proofs for complete transaction privacy.',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale() as Locale;
  const messages = await getMessages();
  const dir = isRtl(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} data-theme="dark" className={`${chakraPetch.variable} ${shareTechMono.variable}`}>
      <body className="bg-[#000000] text-[var(--color-text)] font-[family-name:var(--font-sans)] antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
              <BrowserWalletProvider>
              <CommandPaletteProvider>
                <div className="relative z-10 flex h-dvh overflow-hidden">
                  {/* Side navigation — desktop only */}
                  <Sidebar />
                  {/* Main content area */}
                  <div className="flex-1 flex flex-col min-w-0">
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
                </div>
                <CommandPalette />
              </CommandPaletteProvider>
              <BottomTabBar />
              </BrowserWalletProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
