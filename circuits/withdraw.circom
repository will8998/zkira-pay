pragma circom 2.1.6;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/bitify.circom";
include "node_modules/circomlib/circuits/switcher.circom";
include "./merkle-tree.circom";

// Proves knowledge of (nullifier, secret) committed to the Merkle tree
// without revealing which leaf is being spent.
//
// Public inputs:  root, nullifierHash, recipient, denomination
// Private inputs: nullifier, secret, pathElements[], pathIndices[]
//
// The circuit enforces:
//   1. commitment = Poseidon(nullifier, secret) exists as a leaf in the tree
//   2. nullifierHash = Poseidon(nullifier) matches public input (prevents double-spend)
//   3. recipient and denomination are bound to the proof (prevents front-running)
template Withdraw(levels) {
    // Public inputs
    signal input root;           // Current Merkle root
    signal input nullifierHash;  // Hash of nullifier (prevents double-spend)
    signal input recipient;      // Recipient address (as field element)
    signal input denomination;   // Pool denomination (binding)

    // Private inputs
    signal input nullifier;      // Secret nullifier
    signal input secret;         // Secret value
    signal input pathElements[levels];  // Merkle proof siblings
    signal input pathIndices[levels];   // Merkle proof path (0=left, 1=right)

    // 1. Compute commitment = Poseidon(nullifier, secret)
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== nullifier;
    commitmentHasher.inputs[1] <== secret;
    signal commitment <== commitmentHasher.out;

    // 2. Compute nullifierHash = Poseidon(nullifier)
    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== nullifier;

    // 3. Verify nullifierHash matches public input
    nullifierHash === nullifierHasher.out;

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

    // 6. Bind denomination to proof
    signal denominationSquare;
    denominationSquare <== denomination * denomination;
}

component main {public [root, nullifierHash, recipient, denomination]} = Withdraw(20);
