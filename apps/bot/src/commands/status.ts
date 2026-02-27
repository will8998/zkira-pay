import { CommandContext, Context } from 'grammy';
import { PublicKey } from '@solana/web3.js';
import { loadConfig } from '../config.js';
import { statusActions, openApp } from '../keyboards.js';
import { escMd2 } from '../utils.js';

interface EscrowResponse {
  escrow: {
    claimed: boolean;
    refunded: boolean;
    amount: string;
    tokenMint: string;
    expiry?: number;
  };
}

export async function handleStatus(ctx: CommandContext<Context>) {
  const config = loadConfig();
  const address = ctx.match?.toString().trim();

  if (!address) {
    await ctx.reply('Send me an escrow address to check\\.', {
      parse_mode: 'MarkdownV2',
    });
    return;
  }

  try {
    new PublicKey(address);
  } catch {
    await ctx.reply('Invalid address\\. Check and try again\\.', {
      parse_mode: 'MarkdownV2',
    });
    return;
  }

  const loading = await ctx.reply('Checking…');

  try {
    const res = await fetch(`${config.apiUrl}/api/escrows/${address}`);

    await ctx.api.deleteMessage(ctx.chat.id, loading.message_id);

    if (!res.ok) {
      await ctx.reply('Payment not found\\.', {
        parse_mode: 'MarkdownV2',
        reply_markup: openApp(),
      });
      return;
    }

    const data = (await res.json()) as EscrowResponse;
    const e = data.escrow;

    const status = e.refunded ? 'refunded' : e.claimed ? 'claimed' : 'pending';
    const icon: Record<string, string> = {
      pending: '\u23f3',
      claimed: '\u2705',
      refunded: '\ud83d\udd04',
    };

    const label = status.charAt(0).toUpperCase() + status.slice(1);
    const tokenLabel = e.tokenMint === 'So11111111111111111111111111111111111111112' ? 'SOL' : 'USDC';

    await ctx.reply(
      `${icon[status] || '\u2753'} *${escMd2(label)}*\n\n\ud83d\udcb0 ${escMd2(e.amount || '?')} ${escMd2(tokenLabel)}`,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: statusActions(config.payAppUrl),
      }
    );
  } catch {
    await ctx.api.deleteMessage(ctx.chat.id, loading.message_id);
    await ctx.reply('Something went wrong\\. Try again later\\.', {
      parse_mode: 'MarkdownV2',
    });
  }
}
