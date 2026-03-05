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
        DATABASE_URL: "postgresql://zkira:zkira_s3cure_2026!@localhost:5432/zkira",
        ADMIN_PASSWORD: "zkira_admin_2026",
        RELAYER_SECRET: "zkira_relayer_s3cret_2026",
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
        // Arbitrum config — Sepolia testnet
        ARB_RPC_URL: "https://sepolia-rollup.arbitrum.io/rpc",
        CHAIN_ID: "421614",
        RELAYER_PRIVATE_KEY: "",         // Fill with hex private key
        SANCTIONS_ORACLE: "0xAd18BFABA4f6D6c0137559fCa5ff62A21fc3Fd27",
        USDC_ADDRESS: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
        USDT_ADDRESS: "0x93d67359a0f6f117150a70fdde6bb96782497248",
        DAI_ADDRESS: "0x9bc8388dd439fa3365b1f78a81242adbb4677759",
        // Pool addresses — all 48 pools from deployment-421614.json
        ARB_USDC_POOLS: "0x98E9D74542f096962936702666a05fafaBfe5faf,0x56feE0A13c5B3EBF81c04C5BedE69FfF7bE2b269,0x698313719944Ec8e571B4d250e3594e3fd895f97,0xA628af5b22Ad9c19BA756e40EdA77e6A3E05CF44,0x37c09933CaddEE27b46a9F64Be3CBa44782BC890,0x5064D30988B456A81C2e119ab52818e4a1A5c5Ed,0x3e202D832F710E83Ea542377621BF63694A30235,0x1BBb974451Ce509743e5787aba8090f95b38F257,0x7221170F93dFBB9F017c43bf6027b12aD8072889,0x095CF170985D3f8C6317450BAeB8B613896b8b4d,0x5BB495F2e9593cE19824ECD3dDb214f06834b2b9,0xaf733d07794F1D9971540E167ad721E58d2fb2f5,0x9B40f228548e4b1a4Fbdb24657c4778918639795,0xE74c1706E130bE84b942d219248952C448D7fB1b,0xAF0024aCBEa126FaD0D75861DD2F9c300DF12A56,0x11892Ca87f30aea15DB031Cfe5F9cF34069725BA",
        ARB_USDT_POOLS: "0xe12427fBb72ac9cbdc72Bf5eB183edF566bD5f87,0x74781D4c8dbfba55BBFEBeA22B914ca38b0794eB,0x03593c41fb085f7eEd8a7201A1572A3710b9961F,0xF701C32C16C40F92f00a71684A9E4d0E340E71dA,0x3edF8C88EdF0495C9F123eEa9F4b8Dd5d11f1103,0x8cA0e84c4C2368908B6a65De5Bd5aaf1b0237f10,0xE8F551b01beAd2C2ddb9E0713ea69C54Ea7601D3,0x01ccD93f52c2BF05Ad5F5d229413663119f66b8C,0x4b9Ec2255074AeD546365b21e7758eFc39C33D70,0x7492A2804D2C364A151CDc5e2DA4cf3E99809502,0x72a9Bcb3CCd8B3746f67eb4E7295294eaFfa3cDb,0x166a5336422a0d49ac0Ea54a461405E77D7B023f,0x36677AE61490756D48e64D9C7BB994149a7f9470,0x7067BEC5115335aB379b10F1F61ac37d739C82D9,0x97C7596EAAd77fEc1fC488e73eA900C38BF79ee8,0x86bd50B606730631221Cc651E7C8ecdc513D86e9",
        ARB_DAI_POOLS: "0xd6576Ffe8CDb46F68B64043F008b967675401B3e,0x60d6D80c7F1B7ae2695C060Cb8DcdA535BB37aFF,0xc1B9dAeFdB2daF2e931ef1251ebDF6D83976EC0a,0x23fCf05D980782f1caFB7c398C162221036101E8,0xC1Ed03b9d482a330e283eB64CB19B52139a7aBc1,0xa954D95D388e565c8f4377132a8e0687935AB498,0xE3C521A26C147f8598779a6095612224B8e23f25,0x363302036B8A52Bc57d5699877cd37b5859f549C,0x401097a6C1fCBe3DEf9eD2A949745A138D4663E5,0x8FD175F101Fccf2fCBC1BbF2A65747c1Cd3aAd37,0xC24c358d083C92b321f07cbFE3b33e0aa1a51729,0x39feBE8C14a2150253183d2590b567B770C82b76,0x4cDC1047E83DA732CE0cD535154E5BA1e756EF68,0xb2b42A6844D615C6158A560684B87d152AE828a1,0xAb6c66070C5Bb853cc1D3719E43854f33D2625be,0x1A71834AE58565ff49EFd1c0652e71C0A6277a6E",
        // Tron config
        TRON_ENABLED: "false",
        TRON_FULL_HOST: "https://api.trongrid.io",
        TRON_PRIVATE_KEY: "",
        TRON_POOL_ADDRESSES: "",
        TRON_USDT_ADDRESS: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        // API integration for partner volume tracking
        API_URL: "http://localhost:3021",
        RELAYER_SECRET: "zkira_relayer_s3cret_2026",
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
