import { CommandContext, Context } from 'grammy';
import { guideHomeKeyboard } from '../guide.js';

export async function handleHelp(ctx: CommandContext<Context>) {
  await ctx.reply(
    `📖 *Learn about PRIV*

Private payments on Solana\\.
Simple as sending a link\\.

Pick a topic below to learn more\\.`,
    {
      parse_mode: 'MarkdownV2',
      reply_markup: guideHomeKeyboard(),
    }
  );
}
