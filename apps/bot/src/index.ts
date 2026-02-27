import 'dotenv/config';
import { Bot, InlineKeyboard, webhookCallback } from 'grammy';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { loadConfig } from './config.js';
import { handleStart } from './commands/start.js';
import { handleHelp } from './commands/help.js';
import { handlePay, createAndReply } from './commands/pay.js';
import { handleClaim } from './commands/claim.js';
import { handleBalance } from './commands/balance.js';
import { handleStatus } from './commands/status.js';
import { handleRegister } from './commands/register.js';
import { registerCallbacks } from './callbacks.js';
import { registerGuideCallbacks } from './guide.js';
import { mainMenu } from './keyboards.js';
import {
  generateMetaAddress,
  encodeMetaAddress,
  generateClaimSecret,
  hashClaimSecret,
  bytesToHex,
} from '@zkira/crypto';
import { escMd2 } from './utils.js';

export const BOT_VERSION = '0.2.0';

function createBot(token: string): Bot {
  const bot = new Bot(token);

  // ─── Commands (minimal set) ───

  bot.command('start', handleStart);
  bot.command('help', handleHelp);
  bot.command('pay', handlePay);
  bot.command('send', handlePay);     // alias → same handler
  bot.command('request', handlePay);  // alias → same handler
  bot.command('create', handlePay);   // alias → same handler
  bot.command('claim', handleClaim);
  bot.command('balance', handleBalance);
  bot.command('status', handleStatus);
  bot.command('register', handleRegister);

  // ─── Callback Queries (button taps) ───

  registerCallbacks(bot);
  registerGuideCallbacks(bot);

  // ─── Natural Text Handling ───
  // If user types a plain number → treat as payment amount
  // If user types a Solana address → offer to check balance

  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text.trim();

    // Ignore commands (handled above)
    if (text.startsWith('/')) return;

    // Detect plain number → create USDC payment directly
    const amount = parseFloat(text);
    if (!isNaN(amount) && amount > 0 && amount < 1_000_000_000) {
      await createAndReply(ctx, amount, 'USDC');
      return;
    }

    // Detect Solana address (base58, 32-44 chars)
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(text)) {
      await ctx.reply(
        `Looks like a wallet address\\.\n\nWhat would you like to do?`,
        {
          parse_mode: 'MarkdownV2',
          reply_markup: new InlineKeyboard()
            .text('💼 Check Balance', `check_balance:${text}`)
            .text('📊 Check Status', `check_status:${text}`)
            .row()
            .text('🏠 Home', 'menu:home'),
        }
      );
      return;
    }

    // Detect payment URL
    if (text.includes('zkira.xyz') || text.includes('/pay?') || text.includes('/claim?')) {
      await handleClaim(Object.assign(ctx, { match: text }) as any);
      return;
    }
  });

  // ─── Inline Queries ───

  bot.on('inline_query', async (ctx) => {
    const query = ctx.inlineQuery.query.trim();
    const parts = query.split(' ');

    if (!query) {
      await ctx.answerInlineQuery([{
        type: 'article',
        id: 'help',
        title: '💸 Request Money',
        description: 'Type an amount (e.g. "100" or "50 USDC")',
        input_message_content: {
          message_text: 'Type `@PrivPayTo_Bot 100` to create a payment request.',
          parse_mode: 'Markdown',
        },
      }]);
      return;
    }

    const amount = parseFloat(parts[0]);
    const token = (parts[1] || 'USDC').toUpperCase();

    if (isNaN(amount) || amount <= 0) {
      await ctx.answerInlineQuery([{
        type: 'article',
        id: 'invalid',
        title: '💸 Enter a valid amount',
        description: 'e.g. "100" or "50 USDC"',
        input_message_content: {
          message_text: 'Type `@PrivPayTo_Bot 100` to create a payment request.',
          parse_mode: 'Markdown',
        },
      }]);
      return;
    }

    try {
      const config = loadConfig();
      const meta = generateMetaAddress();
      const encoded = encodeMetaAddress(meta.spendPubkey, meta.viewPubkey);
      const secret = generateClaimSecret();
      const hash = hashClaimSecret(secret);
      const hashHex = bytesToHex(hash);
      const secretHex = bytesToHex(secret);

      const url = `${config.payAppUrl}/pay?amount=${amount}&token=${token}&to=${encoded}&hash=${hashHex}&expiry=7`;

      // Note: API persistence skipped — bot generates crypto locally.

      await ctx.answerInlineQuery([{
        type: 'article',
        id: `pay_${Date.now()}`,
        title: `💰 Request ${amount} ${token}`,
        description: `Create a ${amount} ${token} payment request`,
        input_message_content: {
          message_text: `💰 **${amount} ${token}**\n\n[Pay Now](${url})\n\nPowered by PRIV`,
          parse_mode: 'Markdown',
          link_preview_options: { is_disabled: false },
        },
      }]);
    } catch {
      await ctx.answerInlineQuery([{
        type: 'article',
        id: 'error',
        title: '❌ Error',
        description: 'Try again',
        input_message_content: {
          message_text: 'Something went wrong. Try again.',
        },
      }]);
    }
  });

  // ─── Balance/Status from Address Detection ───

  bot.callbackQuery(/^check_balance:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const address = ctx.match[1];
    const config = loadConfig();
    try {
      const { Connection, PublicKey, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
      const connection = new Connection(config.solanaRpcUrl, 'confirmed');
      const lamports = await connection.getBalance(new PublicKey(address));
      const sol = lamports / LAMPORTS_PER_SOL;
      const short = `${address.slice(0, 4)}…${address.slice(-4)}`;
      const status = sol === 0 ? '⚠️' : sol < 0.01 ? '⚠️' : '✅';
      await ctx.editMessageText(
        `${status} *${escMd2(short)}*\n\n*${escMd2(sol.toFixed(4))} SOL*`,
        { parse_mode: 'MarkdownV2', reply_markup: mainMenu() }
      );
    } catch {
      await ctx.editMessageText(`Couldn't check balance\.`, {
        parse_mode: 'MarkdownV2',
        reply_markup: mainMenu(),
      });
    }
  });

  bot.callbackQuery(/^check_status:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const address = ctx.match[1];
    const config = loadConfig();
    try {
      const res = await fetch(`${config.apiUrl}/api/escrows/${address}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json() as { escrow: { claimed: boolean; refunded: boolean; amount: string; tokenMint: string } };
      const e = data.escrow;
      const status = e.refunded ? 'refunded' : e.claimed ? 'claimed' : 'pending';
      const icon: Record<string, string> = { pending: '\u23f3', claimed: '\u2705', refunded: '\ud83d\udd04' };
      await ctx.editMessageText(
        `${icon[status] || '\u2753'} *${escMd2(status)}*\n\n\ud83d\udcb0 ${escMd2(e.amount || '?')} ${escMd2(e.tokenMint?.slice(0, 4) || 'SOL')}`,
        { parse_mode: 'MarkdownV2', reply_markup: mainMenu() }
      );
    } catch {
      await ctx.editMessageText('No payment found at this address\\.', {
        parse_mode: 'MarkdownV2',
        reply_markup: mainMenu(),
      });
    }
  });

  // ─── Error Handler ───

  bot.catch((err) => {
    console.error('Bot error:', err);
  });

  return bot;
}

// ─── Boot ───

async function main() {
  const config = loadConfig();
  const bot = createBot(config.botToken);

  // Set bot commands for Telegram menu
  await bot.api.setMyCommands([
    { command: 'start', description: 'Start here' },
    { command: 'pay', description: 'Request or send money' },
    { command: 'balance', description: 'Check wallet balance' },
    { command: 'help', description: 'How it works' },
  ]);

  console.log(`🤖 PRIV Bot v${BOT_VERSION}`);
  console.log(`⚙️  Mode: ${config.mode}`);

  if (config.mode === 'webhook') {
    const app = new Hono();
    app.get('/', (c) => c.json({ name: 'zkira-bot', version: BOT_VERSION, status: 'ok' }));
    app.get('/health', (c) => c.json({ status: 'ok' }));

    const webhookPath = `/webhook/${config.botToken.split(':')[0]}`;
    app.post(webhookPath, webhookCallback(bot, 'hono', {
      secretToken: config.webhookSecret || undefined,
    }));

    await bot.api.setWebhook(`${config.webhookDomain}${webhookPath}`, {
      secret_token: config.webhookSecret || undefined,
      drop_pending_updates: true,
      allowed_updates: ['message', 'inline_query', 'callback_query'],
    });

    serve({ fetch: app.fetch, port: config.webhookPort });
    console.log(`🚀 Webhook on port ${config.webhookPort}`);
  } else {
    await bot.start({
      onStart: (info) => console.log(`✅ @${info.username} running`),
    });
  }
}

process.once('SIGINT', () => process.exit(0));
process.once('SIGTERM', () => process.exit(0));

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
