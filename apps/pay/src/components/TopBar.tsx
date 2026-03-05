'use client';

import Link from 'next/link';
import { LanguageSwitcher } from './LanguageSwitcher';
import { EVMNetworkToggle } from './EVMNetworkToggle';

export function TopBar() {
  return (
    <div className="relative z-20 h-12 bg-[rgba(8,8,8,0.8)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)] px-4 flex items-center justify-between shrink-0">
      {/* Left — Logo (visible only on mobile, sidebar has it on desktop) */}
      <Link href="/" className="flex items-center hover:opacity-80 transition-opacity md:hidden">
        <img src="/logo-new.png" alt="OMNIPAY" className="h-6 w-auto" />
      </Link>

      {/* Spacer on desktop (logo is in sidebar) */}
      <div className="hidden md:block" />

      {/* Right — Network toggle + Language */}
      <div className="flex items-center gap-3">
        <EVMNetworkToggle />
        <LanguageSwitcher />
      </div>
    </div>
  );
}
