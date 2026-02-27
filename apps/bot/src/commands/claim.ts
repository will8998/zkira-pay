import { CommandContext, Context } from 'grammy';
import { claimActions, openApp } from '../keyboards.js';
import { loadConfig } from '../config.js';

export async function handleClaim(ctx: CommandContext<Context>) {
  const config = loadConfig();
  const input = ctx.match?.toString().trim();

  if (!input) {
    await ctx.reply(
      `Open the app to claim your payment\\.\n\nYou'll need your *claim secret* and the *payment link*\\.`,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: openApp('/claim'),
      }
    );
    return;
  }

  // If it's a full URL, redirect to it directly
  if (input.startsWith('http')) {
    await ctx.reply(
      '\ud83d\udcb0 *Ready to claim*\n\nOpen the link below to receive your payment\\.',
      {
        parse_mode: 'MarkdownV2',
        reply_markup: claimActions(input),
      }
    );
    return;
  }

  // If it's just a secret, show it and direct to app
  await ctx.reply(
    `\ud83d\udd11 *Your claim secret*\n\n\`${input}\`\n\nOpen the app and paste this to claim your payment\\.`,
    {
      parse_mode: 'MarkdownV2',
      reply_markup: openApp('/claim'),
    }
  );
}
