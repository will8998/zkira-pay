# ZKIRA Pay - Sales Brief

**Document Classification: Internal - Sales Team Only**
**Last Updated: March 2026**

---

## What is ZKIRA Pay?

ZKIRA Pay is a **private payment infrastructure** that allows businesses and their clients to move stablecoins (USDC, USDT, DAI) across blockchains **without leaving a traceable link between sender and receiver**.

Think of it as a **privacy layer for crypto payments** — money goes in, money comes out, and there is **no public connection** between the two transactions on the blockchain.

---

## Who is it for?

| Industry | Use Case |
|----------|----------|
| **Casino & iGaming Networks** | Player deposits/withdrawals without on-chain exposure |
| **Sports Betting Platforms** | Anonymous funding and cashout for bettors |
| **Football Betting Networks** | Private settlement between operators and players |
| **Logistics & Import/Export** | Confidential B2B payments between trade partners |

---

## How Does It Work? (Simple Version)

### The 3-Step Flow

```
STEP 1: DEPOSIT
Client sends stablecoins (e.g., 1,000 USDC) into the ZKIRA pool.
They receive a secret "receipt" — a private code only they have.

STEP 2: WAIT (Optional)
The funds sit in a shared pool with thousands of other deposits.
There is no way to tell which deposit belongs to whom.

STEP 3: WITHDRAW
Using the secret receipt, the client (or someone they give it to)
withdraws the same amount to ANY wallet address.

The blockchain shows:
  - Someone deposited 1,000 USDC    (no link to the withdraw)
  - Someone withdrew 1,000 USDC     (no link to the deposit)
  - These two events CANNOT be connected.
```

### Why Can't Anyone Trace It?

ZKIRA Pay uses **Zero-Knowledge Proofs (ZK-proofs)** — the same military-grade cryptography used by governments and intelligence agencies. A ZK-proof lets you prove "I have the right to withdraw this money" **without revealing which deposit is yours**.

**Analogy for clients:**
> Imagine 1,000 people each put an identical sealed envelope containing $1,000 into a vault. Later, any of them can go to a different vault location and take out $1,000 by proving they put one in — without anyone knowing WHICH envelope was theirs.

---

## How Does It REALLY Work? (Technical Detail)

### The Cryptography

1. **Deposit**: User generates two random secrets (`nullifier` + `secret`), hashes them together to create a `commitment`, and deposits stablecoins along with this commitment into the smart contract.

2. **Pool Storage**: The commitment is added to a **Merkle Tree** — a cryptographic data structure that holds all deposits. The tree currently supports over 1 million deposits per pool.

3. **Withdrawal**: User provides a **Groth16 ZK-SNARK proof** that proves:
   - "I know the secret behind one of the commitments in the Merkle tree"
   - "I haven't withdrawn this deposit before"
   - Without revealing WHICH commitment is theirs

4. **Nullifier**: Each deposit has a unique nullifier hash. Once used for withdrawal, it's marked as "spent" — preventing double-spending without revealing the deposit.

### What Gets Published On-Chain

| Data Point | Visible? | Details |
|-----------|----------|---------|
| Deposit amount | Yes | Fixed denominations (100, 1K, 10K, 100K USDC) |
| Deposit wallet | Yes | But it's a burner wallet (disposable) |
| Withdraw wallet | Yes | Fresh wallet, no history |
| Link between deposit and withdraw | **NO** | Cryptographically impossible |
| Who deposited | **NO** | Burner wallet, no KYC |
| Who withdrew | **NO** | Fresh wallet, no connection |
| The secret receipt | **NO** | Only exists in user's browser |

### Supported Assets & Chains

| Chain | Token | Pool Denominations |
|-------|-------|--------------------|
| **Arbitrum** (Ethereum L2) | USDC | 100 / 1,000 / 10,000 / 100,000 / 250,000 / 500,000 / 1,000,000 / 5,000,000 / 10,000,000 |
| **Arbitrum** | USDT | Same denominations |
| **Arbitrum** | DAI | Same denominations |
| **TRON** | USDT (TRC-20) | Same denominations |

**Why these chains?**
- **Arbitrum**: Fast (sub-second), cheap ($0.01-0.10 per tx), Ethereum security, USDC is native
- **TRON**: Dominant for USDT transfers globally, especially in Asia and emerging markets

---

## Walletless Mode (Key Selling Point)

**Clients do NOT need a crypto wallet app.** 

ZKIRA Pay runs entirely in the browser. When a user visits the platform:

1. Browser generates a **disposable wallet** automatically (no MetaMask, no Trust Wallet, nothing to install)
2. User sends stablecoins to this disposable wallet address
3. The platform handles the deposit into the privacy pool
4. User receives their secret receipt (downloadable file or copy-paste code)
5. For withdrawal — user pastes the receipt, enters destination wallet, done

**What the user needs:**
- A laptop (ideally burner/clean)
- A VPN or Tor Browser
- Their stablecoins
- Nothing else

**What the user does NOT need:**
- No wallet software
- No browser extensions
- No accounts or registration
- No KYC / identity verification
- No email, no phone number

---

## Privacy Protections (Full List)

### On-Chain Privacy
- **ZK-SNARK proofs** — cryptographically impossible to link deposits to withdrawals
- **Fixed denominations** — all deposits of the same size look identical
- **Shared anonymity pool** — your deposit mixes with thousands of others
- **Nullifier system** — prevents double-spend without revealing identity

### Network-Level Privacy
- **Relayer system** — a third-party server submits the withdrawal transaction, so the recipient wallet never touches the pool contract directly. This breaks the on-chain link completely.
- **No IP logging** — the relayer does not store IP addresses
- **Tor/VPN compatible** — the platform works in Tor Browser

### User-Level Privacy
- **Ephemeral wallets** — browser generates a new wallet each session
- **No accounts** — nothing to register, no identity stored anywhere
- **Client-side encryption** — the secret receipt is encrypted in the browser before storage. ZKIRA servers never see it.

---

## Compliance Layer

ZKIRA Pay includes a **compliance layer** to reject sanctioned or stolen funds:

1. **Sanctions Oracle** (Arbitrum) — checks deposits against the Chainalysis sanctions list. If a wallet is sanctioned by OFAC, the deposit is **rejected automatically**.

2. **Token Blacklist Check** — for USDC: checks Circle's blacklist. For USDT: checks the issuer's block list. Blacklisted wallets cannot deposit.

3. **Local Blocklist** — the operator (you) can add specific wallet addresses to a blocklist. Useful for blocking known bad actors.

**What this means for partners:**
> "We don't accept dirty money. Sanctioned wallets and blacklisted addresses are automatically blocked at the smart contract level. This is built into the protocol, not an optional add-on."

---

## Revenue Model

### Protocol Fee
- A configurable percentage (default: 1%) is deducted from every withdrawal
- Sent directly to the treasury wallet
- Maximum cap: 5%
- Collected automatically by the smart contract — no manual intervention

### Partner/Referral System
- Each partner (casino, betting operator, logistics company) gets their own **whitelabel frontend**
- Partner's referral address is embedded in their frontend
- On every withdrawal through their frontend, the partner earns a configurable fee (e.g., 0.5%)
- The fee is split automatically by the smart contract

### Fee Flow Example

```
User deposits:     10,000 USDC
User withdraws:    10,000 USDC

Breakdown:
  Protocol fee (1%):     100 USDC  → Treasury
  Partner fee (0.5%):     50 USDC  → Partner wallet
  Relayer fee (0.1%):     10 USDC  → Relayer operator
  User receives:       9,840 USDC  → Destination wallet
```

All fees are deducted at withdrawal time. The user always deposits the full denomination amount.

---

## Whitelabel Partner Program

Each partner gets:
- **Their own branded frontend** — custom logo, colors, app name
- **Their own referral address** — earns fees on every transaction through their site
- **Their own domain** — deploy on any domain
- **Full privacy** — partners don't see user data either

### Setup for Partners

| Setting | What It Does |
|---------|-------------|
| App Name | Displayed in the UI header and footer |
| Logo URL | Custom logo for the partner's brand |
| Primary Color | Theme color for buttons and accents |
| Referrer Address | Wallet that receives partner fees |
| Footer Text | Custom footer branding |

**Deployment is simple** — same codebase, different configuration. A new partner frontend can be set up in under 30 minutes.

---

## Pool Architecture

### Multi-Pool Design

For each token and denomination, ZKIRA deploys **3 redundant pool contracts**. This means:

- If one pool's contract address gets flagged by a centralized exchange, the other pools remain functional
- Users can distribute deposits across multiple pools for extra safety
- Each pool has its own independent Merkle tree and anonymity set

### Pool Capacity

Each pool supports **2^20 = 1,048,576 deposits** before it's full. With 3 pools per denomination and 9 denominations per token, that's:

- **Per token**: 27 pools x 1M deposits = ~28 million deposit slots
- **Across all tokens**: ~112 million deposit slots total

---

## Competitive Advantages

| Feature | ZKIRA Pay | Tornado Cash (Original) | Others |
|---------|-----------|------------------------|--------|
| Multi-chain | Arbitrum + TRON | Ethereum only | Usually single chain |
| Multi-token | USDC + USDT + DAI | ETH + DAI | Limited |
| Walletless mode | Yes (browser wallet) | No (MetaMask required) | No |
| Whitelabel | Yes (partner program) | No | No |
| Revenue sharing | Built-in referral fees | No | No |
| Compliance layer | Sanctions + blocklist | None | Varies |
| High denominations | Up to 10M USDC | Up to 100 ETH | Low limits |
| TRC-20 USDT support | Yes | No | Rare |
| Relayer-paid gas | Yes | Community relayers | Varies |
| Tor compatible | Yes | Yes | Varies |

---

## How to Explain It to Clients

### For Casino/Betting Operators

> "Your players can deposit and withdraw using USDC or USDT without anyone being able to see their gambling activity on the blockchain. They don't need any wallet software — just a web browser. You get your own branded platform and earn a fee on every transaction."

### For Logistics/Import-Export

> "Your payments between suppliers and buyers are completely private on-chain. Competitors cannot monitor your payment flows, volumes, or trading partners. Funds move through a shared privacy pool that makes individual transactions untraceable."

### For High-Net-Worth Individuals

> "Move any amount of stablecoins privately. Deposit in one wallet, withdraw to a completely separate wallet. The blockchain cannot connect the two. Military-grade cryptography (zero-knowledge proofs) guarantees this — it's not trust-based, it's math-based."

---

## Frequently Asked Questions (Sales)

**Q: Is this legal?**
A: The code itself is legal — the US Fifth Circuit Court of Appeals ruled in November 2024 that smart contracts cannot be sanctioned (overturning OFAC's Tornado Cash sanctions). However, operating the service commercially may carry regulatory risk depending on jurisdiction. The compliance layer (sanctions screening, blocklist) demonstrates good-faith effort to block illicit funds.

**Q: Can law enforcement trace transactions?**
A: On-chain analysis firms (Chainalysis, Arkham, etc.) **cannot** link deposits to withdrawals. The ZK-proof mathematically prevents this. However, if a user reuses wallets, has poor operational security, or uses timing that creates patterns, circumstantial analysis may be possible (though not provable).

**Q: What if USDC/USDT blacklists a pool contract?**
A: This is why we deploy **3 redundant pools per denomination**. If one gets flagged, the others continue operating. Funds already in a flagged pool can still be withdrawn — blacklisting only prevents new deposits.

**Q: How much volume can it handle?**
A: Each pool handles ~1 million deposits. With 27+ pools per token across multiple chains, the system can process **billions in volume** before reaching capacity limits.

**Q: What currencies are supported?**
A: USDC, USDT, and DAI — all US dollar stablecoins. We focus on stablecoins because our clients deal in dollar-denominated value, not speculative crypto.

**Q: Does the client need to be technical?**
A: No. The user experience is: (1) Go to website, (2) Send stablecoins to the displayed address, (3) Save your receipt code, (4) Later, paste receipt and enter destination wallet. That's it.

---

## Contact & Next Steps

For integration inquiries, partnership setup, or technical demo, contact your ZKIRA Pay representative.

**Minimum partnership requirements:**
- Expected monthly volume
- Preferred tokens (USDC/USDT/DAI)
- Preferred chain (Arbitrum/TRON)
- Desired fee structure

---

*ZKIRA Pay — Private payments. Zero traces. Enterprise grade.*
