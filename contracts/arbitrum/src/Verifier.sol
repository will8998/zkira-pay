// SPDX-License-Identifier: MIT
// Generated from ZKIRA trusted setup ceremony using snarkjs 0.7.6
// Circuit: withdraw.circom (MiMCSponge, 20-level Merkle tree, 6 public inputs)
// Trusted setup: Groth16 on BN254 (bn128) curve
//
// This contract wraps the snarkjs-generated Groth16 verifier to implement
// the IVerifier interface expected by ComplianceTornado.sol:
//   verifyProof(bytes _proof, uint256[6] _input)
//
// The _proof bytes encode 8 uint256 values (abi.encode(uint256[8])):
//   [pA.x, pA.y, pB.x[1], pB.x[0], pB.y[1], pB.y[0], pC.x, pC.y]
//
// The _input array contains 6 public signals:
//   [root, nullifierHash, recipient, relayer, fee, refund]

pragma solidity ^0.7.0;

library Pairing {
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct G1Point {
        uint256 X;
        uint256 Y;
    }

    struct G2Point {
        uint256[2] X;
        uint256[2] Y;
    }

    function negate(G1Point memory p) internal pure returns (G1Point memory) {
        if (p.X == 0 && p.Y == 0) {
            return G1Point(0, 0);
        } else {
            return G1Point(p.X, PRIME_Q - (p.Y % PRIME_Q));
        }
    }

    function plus(
        G1Point memory p1,
        G1Point memory p2
    ) internal view returns (G1Point memory r) {
        uint256[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            switch success case 0 { invalid() }
        }
        require(success, "pairing-add-failed");
    }

    function scalar_mul(G1Point memory p, uint256 s) internal view returns (G1Point memory r) {
        uint256[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            switch success case 0 { invalid() }
        }
        require(success, "pairing-mul-failed");
    }

    function pairing(
        G1Point memory a1,
        G2Point memory a2,
        G1Point memory b1,
        G2Point memory b2,
        G1Point memory c1,
        G2Point memory c2,
        G1Point memory d1,
        G2Point memory d2
    ) internal view returns (bool) {
        G1Point[4] memory p1 = [a1, b1, c1, d1];
        G2Point[4] memory p2 = [a2, b2, c2, d2];

        uint256 inputSize = 24;
        uint256[] memory input = new uint256[](inputSize);

        for (uint256 i = 0; i < 4; i++) {
            uint256 j = i * 6;
            input[j + 0] = p1[i].X;
            input[j + 1] = p1[i].Y;
            input[j + 2] = p2[i].X[0];
            input[j + 3] = p2[i].X[1];
            input[j + 4] = p2[i].Y[0];
            input[j + 5] = p2[i].Y[1];
        }

        uint256[1] memory out;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            switch success case 0 { invalid() }
        }
        require(success, "pairing-opcode-failed");
        return out[0] != 0;
    }
}

contract Verifier {
    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
    using Pairing for *;

    struct VerifyingKey {
        Pairing.G1Point alfa1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[7] IC; // 6 public inputs + 1 = 7 IC points
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        // Generated from circuits/build/withdraw_final.zkey via snarkjs
        vk.alfa1 = Pairing.G1Point(uint256(12274052936484203321256361805587978771077808855055170185253180258761860225480), uint256(15779060132628728419894780440695678039511343477732260254336793586455797352657));
        vk.beta2 = Pairing.G2Point([uint256(5801524168652131293816568351340529415827045958318835734046150431785639447991), uint256(14164010959569160861208545661052932332756466478076605585748791305672139777989)], [uint256(17167501411710411744494483613457203159996881167128918888928550213872471393009), uint256(15235887265396745686931286139344128137005224804351179114069811523042414938872)]);
        vk.gamma2 = Pairing.G2Point([uint256(11559732032986387107991004021392285783925812861821192530917403151452391805634), uint256(10857046999023057135944570762232829481370756359578518086990519993285655852781)], [uint256(4082367875863433681332203403145435568316851327593401208105741076214120093531), uint256(8495653923123431417604973247489272438418190587263600148770280649306958101930)]);
        vk.delta2 = Pairing.G2Point([uint256(16773099061952560325572913177310406873354968853400893994293435100057081382352), uint256(21850614765646445851543989673978697516237816848318902216915731335697249332140)], [uint256(20954596766177854048640779607874629492975790521279083400641734451163888513426), uint256(6424326835391540423459326303612780761685066375015449991784602422131012763198)]);
        vk.IC[0] = Pairing.G1Point(uint256(13543797322836705259455264583711702796664764421190727358805205365521836851938), uint256(12738256267542149886680630352968893447151945119156400932305999345581715174288));
        vk.IC[1] = Pairing.G1Point(uint256(13922459777182950714195929183634958307097241587942143086959652686384970895789), uint256(13337269806334790504959397524942996497856725736703565192450966224311710830285));
        vk.IC[2] = Pairing.G1Point(uint256(1386499791841973573389998449242948285443223927627297843955204972999873303298), uint256(12464147390121466930004958331691004285960666069621619201931732249161579942658));
        vk.IC[3] = Pairing.G1Point(uint256(17805364183731251629028743837415937219911836388463473246600703645212442361852), uint256(16665681471739925545151555766996094938423235543710802313186201353968820170359));
        vk.IC[4] = Pairing.G1Point(uint256(3530262723268583064029176564907040419392685597779886964877241450933120326793), uint256(9121074819484549087031437622738529033507288587377109872443455965290183095947));
        vk.IC[5] = Pairing.G1Point(uint256(5946298132463821944449378355274680224309152092412505088102334055703319565485), uint256(16883772787939399891224930265500124224613570938306761433503971664299309996336));
        vk.IC[6] = Pairing.G1Point(uint256(4553030527707891599915404537809236029812414537996288068518675472310920588585), uint256(8244095617045129285355415681047397831960092671461942000771235906030565173962));
    }

    /**
     * @dev Verify a Groth16 proof. Interface compatible with ComplianceTornado.sol.
     * @param proof ABI-encoded proof data: abi.encode(uint256[8])
     *   [pA.x, pA.y, pB.x[1], pB.x[0], pB.y[1], pB.y[0], pC.x, pC.y]
     * @param input Public signals: [root, nullifierHash, recipient, relayer, fee, refund]
     */
    function verifyProof(
        bytes memory proof,
        uint256[6] memory input
    ) public view returns (bool) {
        uint256[8] memory p = abi.decode(proof, (uint256[8]));

        // Validate proof elements are in the field
        for (uint8 i = 0; i < p.length; i++) {
            require(p[i] < PRIME_Q, "verifier-proof-element-gte-prime-q");
        }

        Proof memory _proof;
        _proof.A = Pairing.G1Point(p[0], p[1]);
        _proof.B = Pairing.G2Point([p[2], p[3]], [p[4], p[5]]);
        _proof.C = Pairing.G1Point(p[6], p[7]);

        VerifyingKey memory vk = verifyingKey();

        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);
        vk_x = Pairing.plus(vk_x, vk.IC[0]);

        // Validate all public inputs are in the scalar field
        for (uint256 i = 0; i < input.length; i++) {
            require(input[i] < SNARK_SCALAR_FIELD, "verifier-gte-snark-scalar-field");
            vk_x = Pairing.plus(vk_x, Pairing.scalar_mul(vk.IC[i + 1], input[i]));
        }

        return Pairing.pairing(
            Pairing.negate(_proof.A),
            _proof.B,
            vk.alfa1,
            vk.beta2,
            vk_x,
            vk.gamma2,
            _proof.C,
            vk.delta2
        );
    }
}
