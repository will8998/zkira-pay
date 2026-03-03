module.exports = {
  apps: [
    {
      name: "zkira-pay",
      cwd: "/var/www/zkira-pay/apps/pay",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3011",
      env: {
        NODE_ENV: "production",
        PORT: 3011,
        NEXT_PUBLIC_SOLANA_RPC: "https://api.devnet.solana.com",
        NEXT_PUBLIC_SOLANA_NETWORK: "devnet",
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
        PORT: 3012,
        SOLANA_RPC: "https://api.devnet.solana.com",
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
        PORT: 3013,
        SOLANA_RPC: "https://api.devnet.solana.com",
      },
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
        SOLANA_RPC_URL: "https://api.devnet.solana.com",
        PAY_APP_URL: "https://app.zkira.xyz",
        API_URL: "http://localhost:3012",
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
