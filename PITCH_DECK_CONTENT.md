# ZKIRA Pay — Pitch Deck & BD Content

---

## SLIDE 1: Title

**ZKIRA Pay**
Private Payments on Solana

*"Every transaction on a public blockchain is a privacy leak. We fix that."*

Website: zkira.xyz
App: app.zkira.xyz

---

## SLIDE 2: The Problem

### Crypto Has a Privacy Problem

Every wallet address is a window into your financial life.

- **$3.7T** in crypto assets — all transaction histories publicly visible
- Share your wallet to get paid? Everyone can see your balance, spending habits, and counterparties.
- Businesses can't adopt crypto for payroll, vendor payments, or treasury ops without exposing sensitive financial data.
- On-chain identity tools (ENS, Bonfida, .sol) make the problem *worse* — they permanently link a human identity to a transparent ledger.

**The result:** Crypto payments can't scale to real commerce until privacy is solved at the protocol level.

### Who This Hurts

| User | Problem |
|------|---------|
| **Freelancers** | Invoice a client, they see your entire net worth |
| **DAOs** | Contributor payments expose compensation to everyone |
| **Businesses** | Vendor payments reveal supply chain and margins |
| **Individuals** | Receive a payment, now your wallet is doxxed forever |
| **Protocols** | Grant recipients' spending tracked by competitors |

---

## SLIDE 3: The Solution

### PRIV: Private Payments Without Compromise

ZKIRA Pay enables **confidential crypto payments on Solana** using stealth addresses — cryptographically derived one-time addresses that break the on-chain link between sender and recipient.

**How it works in 3 steps:**

1. **Recipient publishes a "meta-address"** — a public identifier (like an email) that anyone can send to
2. **Sender derives a one-time stealth address** — a fresh address only the recipient can control, invisible to anyone else
3. **Recipient scans and claims** — only the recipient's private key can detect and spend the funds

No mixers. No bridges. No trusted third parties. Pure cryptography.

**The magic:** The sender and recipient interact with a *different address every time*, so no on-chain observer can link payments to a recipient's identity.

---

## SLIDE 4: How It Works (Technical)

### Stealth Address Protocol

Built on elliptic curve Diffie-Hellman (ECDH) over Ed25519 — the same curve Solana uses natively.

```
Recipient registers:
  spend_pubkey + view_pubkey → "meta-address" (on-chain ghost registry)

Sender creates payment:
  1. Generate ephemeral keypair
  2. shared_secret = ECDH(ephemeral_priv, view_pubkey)
  3. stealth_address = spend_pubkey + SHA256(shared_secret) * G
  4. Send funds to stealth_address
  5. Post encrypted announcement on-chain

Recipient scans:
  1. For each announcement, re-derive stealth_address using view_privkey
  2. If match found → derive stealth_privkey using spend_privkey
  3. Claim funds
```

**Why this matters:**
- No trusted relayer needed for privacy (relayer is optional, for gas abstraction only)
- Quantum-resistant upgrade path (lattice-based ECDH)
- Compatible with any SPL token (USDC, SOL, etc.)
- Sub-second finality on Solana (~400ms)

---

## SLIDE 5: Product Suite

### Not Just a Protocol — A Complete Payments Platform

| Product | What It Does | Status |
|---------|-------------|--------|
| **Payment Links** | Create a URL with escrowed funds. Recipient claims with a secret. Shareable via any channel. | Live |
| **Stealth Transfers** | Direct private transfers to stealth addresses. Zero-knowledge recipient. | Live |
| **Milestone Escrows** | Freelancer/contractor payments with up to 10 milestones. Creator releases per milestone. | Live |
| **Multisig Escrows** | M-of-N approval (up to 3 approvers) before funds release. For teams and DAOs. | Live |
| **Invoice System** | Create and manage payment requests. CRM-like contact management. | Live |
| **Transaction Relayer** | Gas abstraction — recipients don't need SOL to claim. | Live |
| **Telegram Bot** | Send and receive payments via Telegram. | Live |
| **Embeddable Widget** | Drop-in React component for any website to accept PRIV payments. | Live |
| **Points & Leaderboard** | Gamification layer — earn points for protocol activity, compete on leaderboard. | Live |
| **Referral System** | Invite friends, earn 10% of their points. Viral growth engine. | Live |
| **Admin Dashboard** | Full operational dashboard — analytics, user management, network monitoring. | Live |

**All products are live on Solana Devnet. Mainnet deployment in progress.**

---

## SLIDE 6: Market Opportunity

### The Private Payments Market

**Total Addressable Market:**

- **$3.7T** total crypto market cap — all needing privacy for real adoption
- **$150B+** stablecoin market cap — the actual payments use case
- **$40B** daily crypto transfer volume — every transfer is a potential PRIV transaction
- **$8B+** DeFi payroll and contributor payments market (growing 200%+ YoY)

**Serviceable Market:**

- **Solana** processes 65,000 TPS at ~$0.00025/tx — the only L1 fast and cheap enough for real payments
- **$2B+** monthly USDC volume on Solana alone
- Every DAO, protocol, freelancer, and business on Solana is a potential user

**Why Now:**

1. **Regulatory pressure** — MiCA, Travel Rule, and OFAC actions are pushing privacy to the forefront
2. **Institutional entry** — Institutions won't transact on transparent chains without privacy
3. **Solana momentum** — Fastest-growing L1 ecosystem, 10x developer growth YoY
4. **Privacy narrative** — Post-Tornado Cash, the market needs compliant, non-custodial privacy

---

## SLIDE 7: Business Model & Tokenomics

### Revenue Model: Protocol Fees

PRIV charges a **0.3% fee on every escrowed payment** — extracted at claim time, on-chain, non-custodial.

At scale:
| Daily Volume | Daily Revenue | Annual Revenue |
|-------------|--------------|----------------|
| $100K | $300 | $109K |
| $1M | $3,000 | $1.1M |
| $10M | $30,000 | $10.9M |
| $100M | $300,000 | $109M |

### $PRIV Token — The Pumpenomics Flywheel

**Every user action creates buy pressure or removes supply.**

```
Volume → Fees → 50% Buyback & Burn (constant deflation)
                 30% Staker Revenue Share (real USDC yield)
                 20% Treasury (growth fund)
```

**Staking Tiers:**

| Tier | Stake | Fee | Points Multiplier | Revenue Share |
|------|-------|-----|-------------------|---------------|
| Free | 0 | 0.3% | 1x | 0% |
| Agent | 1,000 $PRIV | 0.2% | 1.5x | 5% of pool |
| Ghost | 5,000 $PRIV | 0.1% | 2x | 15% of pool |
| Shadow | 25,000 $PRIV | 0.05% | 3x | 30% of pool |
| Phantom | 100,000 $PRIV | 0% | 5x | 50% of pool |

**5 Token Sinks:**

1. **Fee Buyback & Burn** — 50% of all fees buy $PRIV on-market and burn. Permanent deflation.
2. **Staking Lock** — Must stake to reduce fees. Everyone wants lower fees. Supply locked.
3. **Privacy Premium** — Higher tiers unlock premium features (higher limits, batch payments, priority relaying).
4. **Airdrop Vesting** — TGE airdrop vests over 12 months. Stake to accelerate unlock. Airdrop holders become buyers.
5. **Referral Gate** — Must hold 500 $PRIV to activate referral commissions. Every referrer is a holder.

**Token Supply:**

| Allocation | % | Vesting |
|-----------|---|---------|
| Airdrop (points holders) | 15% | 12mo linear, stake-to-accelerate |
| Liquidity (locked) | 10% | Permanent lock |
| Team | 15% | 12mo cliff + 24mo vest |
| Treasury | 20% | Governance-controlled |
| Staking Rewards | 10% | 4-year declining emission |
| Future Seasons | 10% | Ongoing points program |
| Community/Marketing | 10% | As needed |
| Private Sale | 10% | 6mo cliff + 12mo vest |

**Day 1 float: ~15-20%.** Low circulating supply + constant buy pressure from fees = structural price support.

---

## SLIDE 8: Architecture & Security

### Battle-Tested Cryptography

| Component | Standard |
|-----------|----------|
| Key exchange | X25519 (Curve25519 ECDH) |
| Signatures | Ed25519 (Solana-native) |
| Hashing | SHA-256, SHA-512 |
| Metadata encryption | AES-256-GCM |
| Claim secrets | SHA-256 commitment scheme |

All crypto primitives use **audited libraries** (@noble/curves, @noble/hashes by Paul Miller — the same libraries used by Ethereum, Cosmos, and major wallets).

### On-Chain Programs

4 Solana programs built with Anchor 0.30.1:

| Program | Purpose |
|---------|---------|
| Ghost Registry | Meta-address registration + stealth announcements |
| Payment Escrow | Standard escrow with protocol fees |
| Conditional Escrow | Milestone-based payments (up to 10 milestones) |
| Multisig Escrow | M-of-N approval (up to 3 approvers) |

All programs are **non-custodial** — funds are held in PDAs (Program Derived Addresses), not in any wallet controlled by PRIV.

### Off-Chain Infrastructure

| Service | Tech | Purpose |
|---------|------|---------|
| Payment App | Next.js 16, React 19 | User-facing web app |
| REST API | Hono, PostgreSQL, Drizzle ORM | Indexer + user management |
| Relayer | Hono | Gas abstraction service |
| Telegram Bot | grammY | Mobile-first interaction |

---

## SLIDE 9: Competitive Landscape

| Protocol | Chain | Approach | Fee | UX | Status |
|----------|-------|----------|-----|-----|--------|
| **Tornado Cash** | Ethereum | Mixer (deposit/withdraw pools) | 0% | Complex | Sanctioned |
| **Aztec/zk.money** | Ethereum L2 | ZK rollup | Variable | Moderate | Shut down |
| **Railgun** | Multi-chain | ZK proofs in smart contracts | 0.25% | Moderate | Live |
| **Elusiv** | Solana | Token pools + ZK | 0.1% | Moderate | Discontinued |
| **Light Protocol** | Solana | Compressed accounts + ZK | Variable | Complex | Testnet |
| **PRIV** | Solana | Stealth addresses (ECDH) | 0.3% | Simple | Live (Devnet) |

### PRIV's Advantages:

1. **Simplicity** — Stealth addresses are the simplest privacy primitive. No trusted setup, no pool dependencies, no withdrawal delays.
2. **UX** — Payment links, Telegram bot, embeddable widget. Privacy that feels like Venmo.
3. **Solana-native** — Sub-second finality, $0.00025/tx. Privacy at the speed and cost of normal payments.
4. **Full product suite** — Not just privacy transfers. Escrow, multisig, milestones, invoicing, contacts.
5. **Token economics** — Real revenue from fees, not inflationary rewards. Sustainable protocol.
6. **Compliant design** — Stealth addresses are non-custodial and don't pool funds. View keys enable selective disclosure for compliance.

---

## SLIDE 10: Traction & Metrics

### What's Built (v0.1.0)

- **4 on-chain programs** deployed and functional
- **11 product features** live (payment links, escrow, multisig, invoicing, relayer, bot, widget, points, referrals, contacts, admin)
- **15 API route modules** — full REST API with indexer
- **Full admin dashboard** — analytics, user management, network monitoring, points management
- **Gamification layer** — points, leaderboard, referral system driving pre-TGE engagement
- **Anti-gaming protections** — velocity limits, min transaction amounts, self-send detection, admin flag/freeze

### What's Next

- Mainnet deployment
- Token launch (TGE)
- Staking program
- Fee buyback & burn system
- Mobile app (React Native)
- Institutional API (SDK for businesses)

---

## SLIDE 11: Roadmap

### Phase 1: Foundation (Complete)
- Stealth address cryptography library
- Ghost registry program (on-chain meta-address storage)
- Payment escrow program with protocol fees
- Conditional escrow (milestones)
- Multisig escrow
- SDK for developers
- Web app (payment links, claims, escrows)
- REST API + PostgreSQL indexer
- Transaction relayer
- Telegram bot
- Embeddable payment widget

### Phase 2: Growth Engine (Complete)
- Points system with immutable ledger
- Leaderboard (public, real-time)
- Referral system (codes, commissions, tracking)
- Admin dashboard (6 management pages)
- Anti-gaming protections
- Weekly drop mechanism

### Phase 3: Token Launch (In Progress)
- Mainnet deployment (all programs + infra)
- $PRIV SPL token creation
- Staking program (Anchor) with tier system
- Fee system activation (0.3% with tier discounts)
- Buyback & burn mechanism
- Revenue distribution to stakers
- Airdrop snapshot + vesting contracts
- Token claim page

### Phase 4: Scale (Planned)
- Mobile app (React Native)
- Institutional/enterprise API
- Cross-chain stealth addresses (EVM chains)
- Privacy-preserving compliance tools (selective disclosure via view keys)
- Decentralized relayer network
- Governance (DAO)

---

## SLIDE 12: Team

*[To be filled — names, roles, backgrounds]*

Key competencies:
- Solana program development (Anchor/Rust)
- Applied cryptography (stealth addresses, ECDH, ZK)
- Full-stack TypeScript (Next.js, Hono, PostgreSQL)
- Token economics design
- Product & growth

---

## SLIDE 13: The Ask

### Raising: $[X]M Seed / Pre-Seed

**Use of funds:**

| Allocation | % | Purpose |
|-----------|---|---------|
| Engineering | 50% | Mainnet hardening, mobile app, cross-chain, staking program |
| Security Audits | 15% | Smart contract audits (on-chain programs + crypto library) |
| Liquidity | 15% | DEX liquidity for $PRIV at TGE |
| Growth | 15% | User acquisition, partnerships, grants |
| Operations | 5% | Legal, infrastructure, admin |

**What investors get:**
- Token allocation at pre-TGE valuation
- Protocol with real revenue model (fees, not just speculation)
- Pre-built product suite (not a whitepaper — working code, live on devnet)
- First-mover in Solana stealth address payments

---

## SLIDE 14: Why Now, Why Us

1. **Privacy is the next crypto narrative** — Post-Tornado Cash, the market needs compliant privacy. We're building it.
2. **Solana is winning** — Fastest, cheapest L1. Where payments will live.
3. **We're not a whitepaper** — 4 programs, 11 features, full stack, live on devnet.
4. **Real revenue** — 0.3% fees on every transaction. Not inflationary tokenomics.
5. **The flywheel is spinning** — Points system driving pre-TGE engagement. Referrals growing the user base. Token launch converts attention to locked capital.

*"Privacy isn't a feature. It's a right. We're making it the default."*

---
---

# PARTNERSHIP / BD MATERIALS

---

## For Wallets (Phantom, Backpack, Solflare)

### Integration: Native Privacy Payments

**What we offer:**
- **SDK + Widget** — Drop-in React component for private payments in your wallet UI
- **Stealth address support** — Users register meta-addresses, receive private payments natively
- **Gas abstraction** — Our relayer handles SOL fees. Recipients claim without gas.

**Why you care:**
- Privacy is the #1 requested feature by power users
- Differentiate from competitors (first wallet with native stealth payments)
- Revenue share opportunity on protocol fees generated through your integration

**Integration effort:** 1-2 weeks (SDK is npm-installable, widget is embed-ready)

---

## For DAOs & Protocols

### Use Case: Private Contributor Payments

**Problem you have:**
- Paying contributors exposes compensation on-chain
- Competitors track your spending and supply chain
- Grant recipients' spending patterns are visible

**What PRIV does:**
- **Milestone escrows** — Pay contractors per milestone, privately
- **Multisig escrows** — Treasury committee approves, recipient is hidden
- **Batch payments** — Pay 50 contributors in one transaction, each to a unique stealth address
- **Invoice system** — Manage ongoing payment relationships

**Integration:**
- Direct API access (REST)
- SDK for programmatic payments
- Custom multisig configurations

---

## For Exchanges & On-ramps

### Use Case: Private Withdrawals

**What we offer:**
- Users withdraw to a PRIV meta-address instead of a direct wallet
- Funds arrive at a stealth address — no on-chain link to the exchange withdrawal
- Compliance: exchange has full KYC. Only the on-chain link is broken.

**Why you care:**
- User demand for privacy (competitive advantage)
- Reduces risk of targeted attacks on known high-balance wallets
- Compliant — you maintain full user records, PRIV only obscures on-chain destination

---

## For DeFi Protocols

### Use Case: Private DeFi Interaction

**What we offer:**
- Stealth address payments as a primitive for your protocol
- Users can receive rewards, yields, and payouts to stealth addresses
- SDK for programmatic integration

**Example integrations:**
- Lending protocol → private liquidation notifications and settlements
- DEX → private OTC desk for large trades
- Yield aggregator → private reward distribution
- NFT marketplace → private purchases (buyer identity hidden)

---

## For Enterprises / Fintechs

### Use Case: Crypto Payroll & B2B Payments

**Problem:**
- Businesses can't do crypto payroll without exposing every employee's salary
- B2B payments reveal pricing, volumes, and vendor relationships

**PRIV Enterprise Solution:**
- **Batch stealth payments** — Pay entire payroll privately in one transaction
- **Milestone escrows** — Contract-based payments with approval workflows
- **API-first** — Full REST API, webhook notifications, SDK
- **Compliance tools** — View keys enable selective disclosure to auditors
- **White-label widget** — Embed private payments in your existing platform

---

## For Investors / VCs

### Why PRIV Is Investable

**1. Real revenue, not speculation**
- 0.3% protocol fee on every transaction — on-chain, automatic, non-custodial
- Revenue scales linearly with volume
- Already built into the smart contracts

**2. Working product, not a whitepaper**
- 4 Solana programs deployed
- 11 product features live
- Full admin dashboard and analytics
- Points/referral system driving pre-TGE engagement

**3. Defensible moat**
- Stealth address implementation is non-trivial (ECDH + Ed25519 + custom scanning)
- Full product suite (not just a privacy primitive — escrow, multisig, milestones, invoicing)
- Network effects from meta-address registry and referral system

**4. Token economics create structural demand**
- Fee buyback & burn = constant buy pressure
- Staking for fee discounts = supply lock
- Revenue sharing = real yield for holders
- Low initial float (~15-20%) with gradual unlock

**5. Timing**
- Privacy narrative accelerating (regulatory pressure, institutional demand)
- Solana ecosystem growing fastest of any L1
- Tornado Cash vacuum — market needs compliant privacy
- Pre-TGE = ground floor

### Key Metrics to Watch
- Transaction volume (fee revenue driver)
- Active stealth addresses (adoption)
- Staked $PRIV (supply lock)
- Burn rate (deflationary pressure)
- Referral network growth (viral coefficient)

---

## One-Pager (for cold outreach)

### ZKIRA Pay — Private Payments on Solana

**What:** A protocol enabling confidential crypto payments using stealth addresses. Send and receive USDC, SOL, and any SPL token without exposing the recipient's wallet on-chain.

**How:** Elliptic curve Diffie-Hellman key exchange derives one-time stealth addresses. Only the intended recipient can detect and claim funds. No mixers, no trusted setup, no pool dependencies.

**Product:** Payment links, milestone escrows, multisig escrows, invoicing, Telegram bot, embeddable widget, transaction relayer, points/referral system. Full admin dashboard.

**Business Model:** 0.3% fee on every escrowed payment. Fee split: 50% buyback & burn $PRIV, 30% staker yield, 20% treasury.

**Token:** $PRIV — stake for fee discounts, earn real USDC yield from protocol revenue, unlock premium privacy features. Deflationary via constant fee-funded buyback & burn.

**Status:** 4 Solana programs + full web app live on Devnet. Mainnet imminent. Pre-TGE points system active.

**Team:** *[To be filled]*

**Contact:** *[To be filled]*

**Website:** zkira.xyz | **App:** app.zkira.xyz
