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
        NEXT_PUBLIC_API_URL: "http://localhost:3021",
        NEXT_PUBLIC_RELAYER_URL: "http://localhost:3022",
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
        // Arbitrum config
        ARB_RPC_URL: "https://arb1.arbitrum.io/rpc",
        CHAIN_ID: "42161",
        RELAYER_PRIVATE_KEY: "",         // Fill with hex private key
        SANCTIONS_ORACLE: "0x40C57923924B5c5c5455c48D93317139ADDaC8fb",
        USDC_ADDRESS: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        USDT_ADDRESS: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        DAI_ADDRESS: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
        // Pool addresses — fill after contract deployment
        ARB_USDC_POOLS: "",
        ARB_USDT_POOLS: "",
        ARB_DAI_POOLS: "",
        // Tron config
        TRON_ENABLED: "false",           // Set to "true" after Tron deployment
        TRON_FULL_HOST: "https://api.trongrid.io",
        TRON_PRIVATE_KEY: "",            // Fill with Tron hex private key
        TRON_POOL_ADDRESSES: "",
        TRON_USDT_ADDRESS: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
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
        PAY_APP_URL: "https://app.zkira.xyz",
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
