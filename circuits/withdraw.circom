pragma circom 2.1.6;

include "node_modules/circomlib/circuits/mimcsponge.circom";
include "node_modules/circomlib/circuits/bitify.circom";
include "node_modules/circomlib/circuits/switcher.circom";
include "./merkle-tree.circom";

// Proves knowledge of (nullifier, secret) committed to the Merkle tree
// without revealing which leaf is being spent.
//
// Hash function: MiMCSponge (matches on-chain MerkleTreeWithHistory.sol)
//
// Public inputs:  root, nullifierHash, recipient, relayer, fee, refund
// Private inputs: nullifier, secret, pathElements[], pathIndices[]
//
// The circuit enforces:
//   1. commitment = MiMCSponge(nullifier, secret) exists as a leaf in the tree
//   2. nullifierHash = MiMCSponge(nullifier) matches public input (prevents double-spend)
//   3. recipient, relayer, fee, refund are bound to the proof (prevents front-running)
template Withdraw(levels) {
    // Public inputs
    signal input root;           // Current Merkle root
    signal input nullifierHash;  // Hash of nullifier (prevents double-spend)
    signal input recipient;      // Recipient address (as field element)
    signal input relayer;        // Relayer address (as field element)
    signal input fee;            // Relayer fee (uint256)
    signal input refund;         // Refund amount (uint256, usually 0 for ERC20)

    // Private inputs
    signal input nullifier;      // Secret nullifier
    signal input secret;         // Secret value
    signal input pathElements[levels];  // Merkle proof siblings
    signal input pathIndices[levels];   // Merkle proof path (0=left, 1=right)

    // 1. Compute commitment = MiMCSponge(nullifier, secret)
    // MiMCSponge with nInputs=2, nRounds=220, nOutputs=1
    component commitmentHasher = MiMCSponge(2, 220, 1);
    commitmentHasher.ins[0] <== nullifier;
    commitmentHasher.ins[1] <== secret;
    commitmentHasher.k <== 0;
    signal commitment <== commitmentHasher.outs[0];

    // 2. Compute nullifierHash = MiMCSponge(nullifier)
    component nullifierHasher = MiMCSponge(1, 220, 1);
    nullifierHasher.ins[0] <== nullifier;
    nullifierHasher.k <== 0;

    // 3. Verify nullifierHash matches public input
    nullifierHash === nullifierHasher.outs[0];

    // 4. Verify Merkle proof: commitment exists in tree with given root
    component tree = MerkleTreeChecker(levels);
    tree.leaf <== commitment;
    tree.root <== root;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }

    // 5. Bind recipient to proof (prevents front-running)
    // Square recipient to create a constraint (prevents recipient from being changed)
    signal recipientSquare;
    recipientSquare <== recipient * recipient;

    // 6. Bind relayer to proof
    signal relayerSquare;
    relayerSquare <== relayer * relayer;

    // 7. Bind fee to proof
    signal feeSquare;
    feeSquare <== fee * fee;

    // 8. Bind refund to proof
    signal refundSquare;
    refundSquare <== refund * refund;
}

component main {public [root, nullifierHash, recipient, relayer, fee, refund]} = Withdraw(20);
