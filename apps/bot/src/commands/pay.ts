import { CommandContext, Context } from 'grammy';
import { loadConfig } from '../config.js';
import { amountPicker, paymentCreated } from '../keyboards.js';
import { escMd2 } from '../utils.js';
import {
  generateMetaAddress,
  encodeMetaAddress,
} from '@zkira/crypto';

// Unified payment command — replaces /send, /request, /create
export async function handlePay(ctx: CommandContext<Context>) {
  const input = ctx.match?.toString().trim() || '';

  // No args → show amount picker
  if (!input) {
    await ctx.reply('💰 *How much?*', {
      parse_mode: 'MarkdownV2',
      reply_markup: amountPicker(),
    });
    return;
  }

  // Parse amount and optional token from args
  const parts = input.split(/\s+/);
  const amount = parseFloat(parts[0]);
  const token = (parts[1] || 'USDC').toUpperCase();

  if (isNaN(amount) || amount <= 0) {
    await ctx.reply('Enter a valid amount\\.', {
      parse_mode: 'MarkdownV2',
      reply_markup: amountPicker(),
    });
    return;
  }

  // If token not specified, default to USDC (webapp only supports USDC currently)
  if (parts.length < 2) {
    await createAndReply(ctx, amount, 'USDC');
    return;
  }

  // Full args given → create payment directly
  await createAndReply(ctx, amount, token);
}

// Core payment creation logic — shared by command and callbacks
export async function createAndReply(
  ctx: { reply: Context['reply'] },
  amount: number,
  token: string,
) {
  const config = loadConfig();

  try {
    const metaAddress = generateMetaAddress();
    const encoded = encodeMetaAddress(metaAddress.spendPubkey, metaAddress.viewPubkey);
    const paymentUrl = `${config.payAppUrl}/pay?amount=${amount}&token=${token}&to=${encoded}&expiry=7`;

    // Note: API persistence skipped — bot generates crypto locally.
    // The payment URL contains all info the webapp needs.

    await ctx.reply(
      `\u2705 *Payment link ready*\n\n\ud83d\udcb0 *${escMd2(amount)} ${escMd2(token)}*\n\u23f3 Expires in 7 days`,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: paymentCreated(paymentUrl),
      }
    );
  } catch (error) {
    console.error('Error creating payment:', error);
    await ctx.reply('Something went wrong\\. Try again\\.', {
      parse_mode: 'MarkdownV2',
    });
  }
}
