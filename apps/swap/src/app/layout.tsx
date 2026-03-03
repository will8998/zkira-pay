import type { Metadata } from "next";
import { Chakra_Petch, Share_Tech_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SwapProvider } from "@/context/SwapContext";

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
  title: "ZKIRA Swap",
  description: "Private cross-chain token swaps powered by ZKIRA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" className={`${chakraPetch.variable} ${shareTechMono.variable}`}>
      <body className="bg-[#000000] text-[var(--color-text)] font-[family-name:var(--font-sans)] antialiased">
        <div className="ambient-bg" />
        <div className="scanlines" />
        <SwapProvider>
          <div className="relative z-10 flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 bg-[var(--bg-main)]">
              {children}
            </main>
            <Footer />
          </div>
        </SwapProvider>
      </body>
    </html>
  );
}
