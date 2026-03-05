pragma circom 2.1.6;

include "node_modules/circomlib/circuits/mimcsponge.circom";
include "node_modules/circomlib/circuits/bitify.circom";
include "node_modules/circomlib/circuits/switcher.circom";

// Verifies a Merkle proof for a given leaf.
//
// Uses MiMCSponge (matching on-chain MerkleTreeWithHistory.sol hashLeftRight).
// MiMCSponge with nInputs=2, nRounds=220, nOutputs=1 and key=0.
//
// Given a leaf, a root, sibling path elements, and path indices (0=left, 1=right),
// computes the root by hashing up the tree with MiMCSponge and checks it matches.
//
// Uses Switcher to select left/right ordering without conditional logic,
// which is required for R1CS constraint satisfaction.
template MerkleTreeChecker(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    component hashers[levels];
    component switchers[levels];

    signal computedPath[levels + 1];
    computedPath[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        // Ensure pathIndices is binary (0 or 1)
        pathIndices[i] * (1 - pathIndices[i]) === 0;

        // Use Switcher to select left/right ordering
        switchers[i] = Switcher();
        switchers[i].sel <== pathIndices[i];
        switchers[i].L <== computedPath[i];
        switchers[i].R <== pathElements[i];

        // Hash the pair with MiMCSponge (matches on-chain hashLeftRight)
        hashers[i] = MiMCSponge(2, 220, 1);
        hashers[i].ins[0] <== switchers[i].outL;
        hashers[i].ins[1] <== switchers[i].outR;
        hashers[i].k <== 0;

        computedPath[i + 1] <== hashers[i].outs[0];
    }

    // Verify computed root matches expected root
    root === computedPath[levels];
}
