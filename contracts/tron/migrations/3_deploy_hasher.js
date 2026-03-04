const HasherFactory = artifacts.require('HasherFactory');

module.exports = async function (deployer, network, accounts) {
  // Deploy the HasherFactory
  await deployer.deploy(HasherFactory);
  const hasherFactory = await HasherFactory.deployed();
  
  // Deploy the actual MiMCSponge hasher using the factory
  console.log('Deploying MiMCSponge hasher...');
  const tx = await hasherFactory.deployHasher();
  
  // Get the hasher address from the event
  const hasherAddress = tx.logs.find(log => log.event === 'HasherDeployed').args.hasher;
  console.log(`MiMCSponge hasher deployed at: ${hasherAddress}`);
  
  // Store the hasher address for use in subsequent migrations
  // This is a TronBox-specific way to pass data between migrations
  HasherFactory.hasherAddress = hasherAddress;
};