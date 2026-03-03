import type { NextConfig } from 'next';

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
        destination: 'http://localhost:3014/api/:path*',
      },
    ];
  },
};

export default nextConfig;
