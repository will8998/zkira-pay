'use client';
import { useRouter } from 'next/navigation';
import SwapCard from '@/components/swap/SwapCard';
import RoutesPanel from '@/components/swap/RoutesPanel';
import { useSwapContext } from '@/context/SwapContext';
import type { SwapResponse } from '@zkira/swap-types';

function SwapPage() {
  const router = useRouter();
  const { setStep, setSwap } = useSwapContext();

  const handleSwapCreated = (swap: SwapResponse) => {
    setSwap(swap);
    setStep('depositing');
    router.push(`/swap/${swap.requestId}`);
  };

  return (
    <div className="pt-20 md:pt-24 px-4">
      <div className="text-center mb-10 md:mb-12">
        <h1
          className="font-[family-name:var(--font-sans)] font-bold text-4xl md:text-5xl lg:text-6xl text-[var(--color-text)] tracking-wider leading-tight"
          style={{ textShadow: '0 0 30px rgba(255, 40, 40, 0.3)' }}
        >
          BE UNTRACEABLE.<br />
          BE UNTOUCHABLE.
        </h1>
      </div>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col lg:flex-row gap-6 w-full max-w-4xl">
          <div className="w-full lg:w-[450px]">
            <SwapCard onSwapCreated={handleSwapCreated} />
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
