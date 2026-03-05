import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ZKIRA Pay — Private Payments on Arbitrum & Tron';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0A',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            background: '#FF2828',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <span style={{ color: '#FFFFFF', fontSize: 48, fontWeight: 700 }}>Z</span>
        </div>

        {/* Title */}
        <div
          style={{
            color: '#EDEAE4',
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: '-0.04em',
            marginBottom: 16,
          }}
        >
          ZKIRA Pay
        </div>

        {/* Subtitle */}
        <div
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: 28,
            fontWeight: 400,
            letterSpacing: '-0.01em',
          }}
        >
          Private Multi-Chain Mixer
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 40,
          }}
        >
          {['ZK Proofs', 'Multi-Chain', 'Walletless Mode', 'Partner System'].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  background: 'rgba(237,234,228,0.08)',
                  border: '1px solid rgba(237,234,228,0.12)',
                  borderRadius: 8,
                  padding: '10px 20px',
                  color: '#C8C3B8',
                  fontSize: 18,
                  fontWeight: 500,
                }}
              >
                {feature}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
