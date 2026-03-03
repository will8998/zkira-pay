import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SwapProvider } from "@/context/SwapContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-orbitron'
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
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased min-h-screen flex flex-col bg-zkira-bg`}
      >
        <SwapProvider>
          <Header />
          <main className="flex-1 pt-16 pb-9">
            {children}
          </main>
          <Footer />
        </SwapProvider>
      </body>
    </html>
  );
}
