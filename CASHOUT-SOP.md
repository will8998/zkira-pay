# ZKIRA Pay — Cashout SOP for Operators

## How to Convert Shielded Pool Withdrawals to Fiat Without Re-Introducing Traceability

This document is your operational playbook. ZKIRA Pay severs the on-chain link between your casino and the player's withdrawal address using zero-knowledge proofs. That privacy is worthless if you then deposit directly into Binance with your passport attached.

This SOP ensures the privacy chain stays intact from shielded pool to cash in hand.

---

## The Golden Rule

**Never send funds from a shielded withdrawal directly to a KYC exchange.**

Coinbase, Binance, Kraken, OKX — all of them report to chain analysis firms. The moment shielded funds hit a KYC exchange wallet, your identity is re-linked to those funds. Everything ZKIRA did is undone in one transaction.

---

## Phase 1: Post-Withdrawal Wallet Hygiene

Before you think about cashing out, the funds need to be clean on-chain.

### 1.1 Fresh Wallet Per Withdrawal

- Generate a **new wallet address** for every single withdrawal from the shielded pool
- NEVER reuse a withdrawal address — address reuse is the #1 way chain analysis re-clusters wallets
- ZKIRA Pay generates these automatically, but if doing manual withdrawals, use an HD wallet and increment the index each time

### 1.2 Let the Funds Sit

- **Minimum 24-hour hold** after withdrawal before any movement
- Ideally 3-7 days — chain analysis firms flag same-day deposit-after-mixer patterns
- Chainalysis and Elliptic use **timing correlation**: if $100K enters a pool and $100K leaves within the same hour, they flag it as linked even without cryptographic proof
- Randomize your wait time. Don't always wait exactly 3 days. Wait 2 days, then 5 days, then 1 day, then 4 days.

### 1.3 Break the Amount Pattern

- If you deposited $1,000,000 (1x $1M denomination), do NOT withdraw and immediately move exactly $1,000,000
- Move in smaller, irregular chunks: $347K, then $218K, then $435K
- The amounts should not add up to an obvious round number within the same 24-hour period
- Chain analysis firms use **amount correlation** — even post-mixer, if the same amounts keep appearing, they build probabilistic links

### 1.4 Never Consolidate Into One Wallet

- If you withdrew 5 notes ($1M each = $5M total), those 5 withdrawals should go to 5 different wallets
- Those 5 wallets should NEVER send to the same destination
- The moment 5 unrelated wallets all send to one wallet, chain analysis flags the destination as the "real" owner

---

## Phase 2: Off-Ramp Methods (Ranked by Privacy)

### Tier 1 — P2P Cash Trades (Maximum Privacy)

The gold standard. You trade crypto directly with another person for cash. No exchange, no KYC, no digital paper trail.

**How it works:**
1. Find a P2P counterparty (see platforms below)
2. Agree on rate and amount
3. They send cash (bank transfer, cash in person, mobile money)
4. You send USDT/USDC from your clean withdrawal wallet to their wallet
5. Transaction complete — no exchange involved

**P2P Platforms:**

| Platform | KYC Required | Supported Assets | Best For | Notes |
|----------|-------------|-----------------|----------|-------|
| **Telegram OTC Groups** | None | TRC-20 USDT, ERC-20 | Asia, Middle East | Largest volume. Use escrow bots or trusted middlemen. |
| **Bisq** | None | BTC, limited altcoins | Privacy purists | Decentralized, no server. Swap USDT→BTC first via DEX, then sell on Bisq. |
| **Robosats** | None | BTC (Lightning) | Small-medium amounts | Tor-native. Swap USDT→BTC→Lightning first. Under $5K per trade. |
| **Hodl Hodl** | None (for basic) | BTC | Global | Non-custodial escrow. Multisig-based. |
| **Noones** (ex-Paxful) | Email only | USDT, BTC | Africa, LATAM, SEA | Paxful founder's new platform. 300+ payment methods. |
| **Peach Bitcoin** | None | BTC | Europe | Mobile app, European bank transfers. Swap USDT→BTC first. |

**For large amounts ($100K+):**
- Use Telegram OTC brokers. The TRC-20 USDT OTC market does billions daily.
- Typical spread: 0.5-1.5% above spot.
- Always use escrow or trade in person with a trusted intermediary.
- Split into multiple trades across multiple brokers. Don't move $500K through one person.

### Tier 2 — Regional OTC Desks (Strong Privacy)

Physical and semi-physical OTC operations that convert crypto to cash with minimal or no identity verification.

**Southeast Asia (where most betting operators are):**

| Location | What Exists | How It Works |
|----------|------------|--------------|
| **Cambodia (Phnom Penh, Sihanoukville)** | Physical OTC shops, casino cage conversions | Walk in with USDT on your phone, walk out with USD cash. Shops on every block in Sihanoukville. $50K+ per visit common. |
| **Philippines (Manila, Cebu)** | OTC shops, remittance centers that accept USDT | USDT → PHP via Gcash/Maya or cash. Networks of "money changers" handle crypto. |
| **Vietnam (HCMC, Hanoi)** | Telegram OTC networks, physical meetups | Large underground USDT↔VND market. Telegram groups with thousands of members. |
| **Thailand (Bangkok, Pattaya)** | OTC shops, Bitcoin ATMs | Bitkub-affiliated shops. Some no-KYC for under 50K THB (~$1,400). |
| **Malaysia (KL)** | Telegram P2P, physical OTC in mid-valley area | USDT→MYR via bank transfer. Active Telegram groups. |
| **Dubai/UAE** | OTC desks in DIFC, Deira | Massive OTC market. Cash deals up to $1M+ common. Many ex-gambling operators already use these. |

**How to use OTC desks safely:**
1. Start small — do a $5K test trade before moving $500K
2. Never give your real name or phone number on the first trade
3. Use a separate phone/SIM for OTC communications
4. Vary which desk you use — don't become a "regular" at one shop
5. For large amounts, negotiate the rate before showing up. OTC desks will front-run you if they know you're holding big.

### Tier 3 — Gift Cards & Vouchers (Good Privacy, Lower Amounts)

Convert crypto to spendable value without touching the banking system.

| Service | Accepts | What You Get | Limits |
|---------|---------|-------------|--------|
| **Bitrefill** | BTC, ETH, USDT, USDC, Lightning | Gift cards for Amazon, Uber, Steam, 4,000+ brands. Phone top-ups. | No KYC. Up to $5K per card. |
| **CoinCards** | BTC, Lightning, Litecoin | Canadian/US gift cards | No KYC. |
| **Coinsbee** | 50+ cryptos including USDT | Gift cards, phone top-ups, prepaid Visa | No KYC for most cards. |

**Best use case:** Operational expenses. Pay for servers, travel, hotels, staff gifts. Not suitable for cashing out $1M, but great for $5K-20K in running costs.

### Tier 4 — Crypto Debit Cards (Moderate Privacy)

Load stablecoins onto a card, spend anywhere Visa/Mastercard is accepted.

| Card | KYC Level | Loads | Notes |
|------|----------|-------|-------|
| **Paybis** | Email + phone | USDT, USDC | Virtual cards available. Lower KYC for small amounts. |
| **Bybit Card** | Exchange KYC | USDT | Requires Bybit account. Not ideal for privacy. |
| **Wirex** | Full KYC | Multi-crypto | Not recommended for privacy use. |

**Reality check:** Most crypto cards now require full KYC. These work for spending small amounts from a separate identity/entity, not for cashing out large sums privately.

### Tier 5 — Chain-Hopping via DeFi (Technical, Good Privacy)

Use DeFi to swap, bridge, and diversify before off-ramping.

**Strategy:**
1. Withdraw USDT from ZKIRA shielded pool to a fresh wallet
2. Swap USDT → ETH or USDT → BTC via a DEX (Uniswap on Arbitrum, SunSwap on Tron)
3. Bridge to a different chain (Arbitrum → Optimism → Base, or use THORChain for native BTC)
4. Off-ramp the resulting asset through a P2P platform

**Why chain-hop?**
- Each bridge adds a layer of separation
- Chain analysis firms have weaker cross-chain tracking than same-chain tracking
- Ending up with native BTC (not wrapped) via THORChain is particularly strong — BTC has the deepest P2P liquidity

**Risks:**
- Bridge exploits (smart contract risk)
- Slippage on large swaps
- Gas costs add up across multiple chains
- DEX swaps are public — don't swap the exact shielded amount

---

## Phase 3: Operational Security (OPSEC)

### 3.1 Device Separation

- Use a **dedicated device** (phone or laptop) for all cashout operations
- This device should NEVER be used for your casino operations, personal email, or social media
- Factory reset it periodically
- Use a VPN at all times on this device (Mullvad, IVPN — pay with crypto, no email required)

### 3.2 Network Privacy

- **Always use a VPN** when interacting with withdrawal wallets or P2P platforms
- For Tier 1 operations (P2P/Telegram), use **Tor Browser** for web access
- Never access withdrawal wallets from your casino office IP or home IP
- Your ISP logs show you accessed a crypto wallet at the exact time a withdrawal happened — that's a timing correlation

### 3.3 Communication

- Use **Signal** or **Telegram** (with auto-delete enabled) for OTC negotiations
- Never use email, WhatsApp, or SMS for cashout discussions
- Use a separate Telegram account (separate phone number) for OTC trading
- Never mention amounts, wallet addresses, or transaction IDs in messages that aren't end-to-end encrypted

### 3.4 Banking

- If cash reaches a bank account, it should go to an account that has **no connection** to your casino operation
- Use a separate corporate entity or personal account in a different jurisdiction
- Deposit cash in amounts that don't trigger reporting thresholds (varies by country — $10K in US, varies elsewhere)
- Vary deposit amounts and timing — regular deposits of just-under-threshold amounts trigger Suspicious Activity Reports (SARs) faster than occasional larger ones

---

## Phase 4: What NOT to Do (Common Mistakes)

### Instant re-linking
- Withdrawing from shielded pool and depositing to Binance within the same hour
- Using the same wallet for shielded withdrawals and exchange deposits
- Consolidating multiple withdrawal wallets into one before off-ramping

### Amount fingerprinting
- Withdrawing $1,000,000 from the pool and immediately selling exactly $1,000,000 P2P
- Always break amounts into irregular chunks with time gaps

### Behavioral patterns
- Always using the same OTC desk/broker
- Always cashing out on the same day of the week
- Always moving funds at the same time of day
- Using consistent amounts ($50K every Monday = obvious pattern)

### Digital footprint
- Accessing withdrawal wallets from your personal computer
- Googling "how to cash out crypto anonymously" from your office network
- Discussing cashout plans over company Slack/Discord

### Taint propagation
- Sending "clean" shielded withdrawal funds to a wallet that previously received direct casino payouts
- Mixing clean and dirty wallets in the same wallet app/seed phrase

---

## Quick Reference: Cashout Decision Matrix

| Amount | Recommended Method | Time Required | Typical Cost |
|--------|-------------------|---------------|-------------|
| Under $1K | Gift cards (Bitrefill) | Instant | 0-3% markup |
| $1K - $10K | P2P platform (Noones, Bisq) | 1-24 hours | 1-3% spread |
| $10K - $100K | Telegram OTC broker | 1-3 days | 0.5-1.5% spread |
| $100K - $500K | Regional OTC desk (physical) | 1-5 days | 0.5-2% spread |
| $500K - $5M | Multiple OTC desks + chain-hopping | 1-4 weeks | 1-2% total |
| $5M+ | Dedicated OTC relationship + multiple jurisdictions | 2-8 weeks | Negotiated |

---

## For ZKIRA Pay Customers: Recommended Minimum Flow

1. **Withdraw** from shielded pool to a fresh, never-used wallet
2. **Wait** minimum 3 days (randomize between 1-7 days)
3. **Split** into 2-4 irregular amounts
4. **Swap** at least one portion through a DEX to a different asset
5. **Off-ramp** via P2P or OTC — never direct to a KYC exchange
6. **Rotate** your methods — don't use the same off-ramp twice in a row

The ZK proof gives you mathematical privacy. This SOP gives you operational privacy. You need both.

---

*This document is for operational guidance only. ZKIRA Pay does not provide legal or financial advice. Operators are responsible for compliance with applicable laws in their jurisdictions.*
