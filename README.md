# ZKIRA Pay

Private payments on Solana. Stealth addresses, shielded transfers, zero-knowledge proofs.

## Structure

```
apps/
  pay/        — Payment app + admin dashboard (Next.js)
  api/        — REST API server (Hono)
  bot/        — Telegram bot
packages/
  common/     — Shared utilities
  crypto/     — Stealth address cryptography
  sdk/        — Solana SDK (instructions, PDAs, client)
  widget/     — Embeddable payment widget
services/
  relayer/    — Transaction relayer
programs/
  ghost-registry/      — Solana program (stealth registry)
  conditional-escrow/  — Solana program (escrow)
  multisig-escrow/     — Solana program (multisig)
```

## Development

```bash
pnpm install
pnpm dev        # Start all apps in dev mode
pnpm build      # Build all packages
pnpm lint       # Lint all packages
```

## Deployment

PM2 manages production services. See `ecosystem.config.js`.

| Service | Port |
|---------|------|
| zkira-pay | 3011 |
| zkira-api | 3012 |
| zkira-relayer | 3013 |

Marketing website is in a [separate repository](https://github.com/zkira-pay/zkira-web).
