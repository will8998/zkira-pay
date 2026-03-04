const SanctionsOracle = artifacts.require('SanctionsOracle');

module.exports = function (deployer) {
  deployer.deploy(SanctionsOracle);
};