module.exports = {
  networks: {
    development: {
      privateKey: process.env.PRIVATE_KEY,
      fullHost: 'http://127.0.0.1:9090',
      network_id: '*',
    },
    shasta: {
      privateKey: process.env.PRIVATE_KEY,
      fullHost: 'https://api.shasta.trongrid.io',
      network_id: '2',
    },
    nile: {
      privateKey: process.env.PRIVATE_KEY,
      fullHost: 'https://nile.trongrid.io',
      network_id: '3',
    },
    mainnet: {
      privateKey: process.env.PRIVATE_KEY,
      fullHost: 'https://api.trongrid.io',
      network_id: '1',
    },
  },
  compilers: {
    solc: {
      version: '0.7.6',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};