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
    <div className="pt-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-[480px] shrink-0">
          <SwapCard onSwapCreated={handleSwapCreated} />
        </div>
        <div className="flex-1 min-w-0">
          <RoutesPanel />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return <SwapPage />;
}
