import { QRCodeSVG } from 'qrcode.react';

interface DepositInfoProps {
  depositAddress: string;
  amount: number;
  tokenSymbol: string;
}

export function DepositInfo({
  depositAddress,
  amount,
  tokenSymbol
}: DepositInfoProps) {
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(depositAddress);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-[var(--color-text)] text-sm">
        Send exactly {amount} {tokenSymbol} to:
      </div>

      <div className="bg-[var(--color-surface)] p-4 relative">
        <div className="font-[family-name:var(--font-mono)] text-sm break-all pr-10">
          {depositAddress}
        </div>
        <button
          onClick={handleCopyAddress}
          className="absolute top-3 right-3 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        </button>
      </div>
      <div className="flex justify-center">
        <div className="bg-white p-4">
          <QRCodeSVG
            value={depositAddress}
            size={180}
            bgColor="transparent"
            fgColor="#000000"
          />
        </div>
      </div>
      <div className="text-[var(--color-warning-text)] text-xs text-center">
        Send only {tokenSymbol} to this address
      </div>
    </div>
  );
}
