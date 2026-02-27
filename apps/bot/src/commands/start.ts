import { CommandContext, Context } from 'grammy';
import { mainMenu } from '../keyboards.js';

export async function handleStart(ctx: CommandContext<Context>) {
  await ctx.reply(
    `*PRIV*\nPrivate payments on Solana\\.\n\nRequest money, share a link, get paid\\. That's it\\.`,
    {
      parse_mode: 'MarkdownV2',
      reply_markup: mainMenu(),
    }
  );
}
