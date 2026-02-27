import { Bot, Context, InlineKeyboard } from 'grammy';
import { mainMenu, amountPicker, tokenPicker, afterSecret } from './keyboards.js';
import { createAndReply } from './commands/pay.js';
import { loadConfig } from './config.js';
import { escMd2, getSecret } from './utils.js';

export function registerCallbacks(bot: Bot) {
  // ─── Navigation ───

  bot.callbackQuery('menu:home', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      `*PRIV*\nPrivate payments on Solana\\. \n\nRequest money, share a link, get paid\\. That's it\\.`,
      { parse_mode: 'MarkdownV2', reply_markup: mainMenu() }
    );
  });

  bot.callbackQuery('menu:request', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText('💰 *How much?*', {
      parse_mode: 'MarkdownV2',
      reply_markup: amountPicker(),
    });
  });

  bot.callbackQuery('menu:pay', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      'Paste a payment link to pay someone\\.\n\nOr open the app to pay directly\\.',
      {
        parse_mode: 'MarkdownV2',
        reply_markup: (() => {
          const config = loadConfig();
          return new InlineKeyboard()
            .url('📱 Open App', config.payAppUrl)
            .row()
            .text('↩️ Back', 'menu:home');
        })(),
      }
    );
  });

  bot.callbackQuery('menu:balance', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      'Send me a wallet address to check the balance\\.\n\nExample: `/balance 9WzD\\.\\.\\.AWWM`',
      { parse_mode: 'MarkdownV2' }
    );
  });

  // ─── Amount Selection → Create Payment (USDC only for now) ───

  bot.callbackQuery(/^amount:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const amount = parseInt(ctx.match[1]);
    // Skip token picker — webapp only supports USDC currently
    await ctx.deleteMessage();
    await createAndReply(ctx, amount, 'USDC');
  });

  // ─── Token Selection (kept for backwards compat / custom amounts) ───

  bot.callbackQuery(/^token:(\d+(?:\.\d+)?):(\w+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const amount = parseFloat(ctx.match[1]);
    const token = ctx.match[2];
    await ctx.deleteMessage();
    await createAndReply(ctx, amount, token);
  });

  // ─── Show Claim Secret ───

  bot.callbackQuery(/^secret:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const secretId = ctx.match[1];
    const secret = getSecret(secretId);
    if (!secret) {
      await ctx.editMessageText('Secret expired\\. Create a new payment request\\.', {
        parse_mode: 'MarkdownV2',
        reply_markup: afterSecret(),
      });
      return;
    }
    await ctx.editMessageText(
      `\ud83d\udd11 *Your claim secret*\n\n\`${secret}\`\n\n\u26a0\ufe0f Save this\\. You need it to claim your payment\\.`,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: afterSecret(),
      }
    );
  });
}
