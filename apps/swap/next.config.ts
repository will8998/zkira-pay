import type { NextConfig } from 'next';

const API_URL = process.env.SWAP_API_URL || 'http://localhost:3014';

const nextConfig: NextConfig = {
  transpilePackages: ['@zkira/swap-types'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.rocketx.exchange',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
