// Copy this file to ecosystem.config.js and fill in real values.
// NEVER commit ecosystem.config.js — it contains secrets.

module.exports = {
  apps: [
    {
      name: "zkira-pay",
      cwd: "/var/www/zkira-pay/apps/pay",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3020",
      env: {
        NODE_ENV: "production",
        PORT: 3020,
        NEXT_PUBLIC_API_URL: "https://omnipay.club/api",
        NEXT_PUBLIC_RELAYER_URL: "https://omnipay.club/relayer",
      },
    },
    {
      name: "zkira-api",
      cwd: "/var/www/zkira-pay/apps/api",
      script: "node_modules/.bin/tsx",
      interpreter: "/bin/bash",
      args: "src/index.ts",
      env: {
        NODE_ENV: "production",
        PORT: 3021,
        HOST: "127.0.0.1",
        DATABASE_URL: "postgresql://USER:PASSWORD@localhost:5432/zkira",
        ADMIN_PASSWORD: "CHANGE_ME_STRONG_PASSWORD",
        JWT_SECRET: "CHANGE_ME_RANDOM_64_CHAR_HEX",
        RELAYER_SECRET: "CHANGE_ME_RELAYER_SECRET",
      },
    },
    {
      name: "zkira-relayer",
      cwd: "/var/www/zkira-pay/services/relayer",
      script: "node_modules/.bin/tsx",
      interpreter: "/bin/bash",
      args: "src/index.ts",
      env: {
        NODE_ENV: "production",
        PORT: 3022,
        HOST: "127.0.0.1",
        ARB_RPC_URL: "https://sepolia-rollup.arbitrum.io/rpc",
        CHAIN_ID: "421614",
        RELAYER_PRIVATE_KEY: "CHANGE_ME_HEX_PRIVATE_KEY",
        SANCTIONS_ORACLE: "0xAd18BFABA4f6D6c0137559fCa5ff62A21fc3Fd27",
        USDC_ADDRESS: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
        USDT_ADDRESS: "0x93d67359a0f6f117150a70fdde6bb96782497248",
        DAI_ADDRESS: "0x9bc8388dd439fa3365b1f78a81242adbb4677759",
        CORS_ORIGINS: "https://omnipay.club",
        ARB_USDC_POOLS: "",
        ARB_USDT_POOLS: "",
        ARB_DAI_POOLS: "",
        TRON_ENABLED: "false",
        TRON_FULL_HOST: "https://api.trongrid.io",
        TRON_PRIVATE_KEY: "",
        TRON_POOL_ADDRESSES: "",
        TRON_USDT_ADDRESS: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        API_URL: "http://localhost:3021",
        RELAYER_SECRET: "CHANGE_ME_RELAYER_SECRET",
      }
    },
    {
      name: "zkira-bot",
      cwd: "/var/www/zkira-pay/apps/bot",
      script: "node_modules/.bin/tsx",
      interpreter: "/bin/bash",
      args: "src/index.ts",
      env: {
        NODE_ENV: "production",
        BOT_MODE: "polling",
        PAY_APP_URL: "https://omnipay.club",
        API_URL: "http://localhost:3021",
      },
    },
    {
      name: "zkira-swap-api",
      cwd: "/var/www/zkira-pay/apps/swap-api",
      script: "node_modules/.bin/tsx",
      interpreter: "/bin/bash",
      args: "src/index.ts",
      env: {
        NODE_ENV: "production",
        PORT: 3014,
      },
    },
    {
      name: "zkira-swap",
      cwd: "/var/www/zkira-pay/apps/swap",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3015",
      env: {
        NODE_ENV: "production",
        PORT: 3015,
      },
    },
  ],
};
