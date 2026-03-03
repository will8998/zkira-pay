'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SwapCard from '@/components/swap/SwapCard';
import RoutesPanel from '@/components/swap/RoutesPanel';
import { useSwapContext } from '@/context/SwapContext';
import InviteGate from '@/components/InviteGate';
import { validateInviteCode } from '@/lib/api';
import type { SwapResponse } from '@zkira/swap-types';

function SwapPage() {
  const router = useRouter();
  const { setStep, setSwap } = useSwapContext();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(true);
  const [gateLoading, setGateLoading] = useState(true);

  useEffect(() => {
    const checkStoredCode = async () => {
      const storedCode = localStorage.getItem('zkira-invite-code');
      if (storedCode) {
        try {
          const result = await validateInviteCode(storedCode);
          if (result.valid && !result.used) {
            setInviteCode(storedCode);
            setGateOpen(false);
          } else {
            localStorage.removeItem('zkira-invite-code');
            setGateOpen(true);
          }
        } catch {
          localStorage.removeItem('zkira-invite-code');
          setGateOpen(true);
        }
      } else {
        setGateOpen(true);
      }
      setGateLoading(false);
    };

    checkStoredCode();
  }, []);

  const handleUnlock = (code: string) => {
    localStorage.setItem('zkira-invite-code', code);
    setInviteCode(code);
    setGateOpen(false);
  };

  const handleSwapCreated = (swap: SwapResponse) => {
    setSwap(swap);
    setStep('depositing');
    router.push(`/swap/${swap.requestId}`);
  };

  if (gateLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <svg className="animate-spin h-8 w-8 text-zkira-green" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (gateOpen) {
    return <InviteGate onUnlock={handleUnlock} />;
  }

  return (
    <div className="pt-12 md:pt-16 lg:pt-20 px-4">
      <div className="text-center mb-10 md:mb-12">
        <h1
          className="font-orbitron font-normal text-4xl md:text-5xl lg:text-6xl text-white leading-tight"
          style={{ textShadow: '0 0 30px rgba(255, 23, 68, 0.3)' }}
        >
          BE UNTRACEABLE.<br />
          BE UNTOUCHABLE.
        </h1>
      </div>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col lg:flex-row gap-6 w-full max-w-4xl">
          <div className="w-full lg:w-[450px]">
            <SwapCard inviteCode={inviteCode} onSwapCreated={handleSwapCreated} />
          </div>
          <div className="w-full lg:w-[450px]">
            <RoutesPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return <SwapPage />;
}
