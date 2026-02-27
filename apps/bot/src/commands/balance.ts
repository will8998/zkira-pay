import { CommandContext, Context } from 'grammy';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { loadConfig } from '../config.js';
import { balanceActions } from '../keyboards.js';
import { escMd2 } from '../utils.js';

export async function handleBalance(ctx: CommandContext<Context>) {
  const config = loadConfig();
  const address = ctx.match?.toString().trim();

  if (!address) {
    await ctx.reply('Send me a wallet address\\.', {
      parse_mode: 'MarkdownV2',
    });
    return;
  }

  let publicKey: PublicKey;
  try {
    publicKey = new PublicKey(address);
  } catch {
    await ctx.reply(`That doesn't look like a valid address\\. Check and try again\\.`, {
      parse_mode: 'MarkdownV2',
    });
    return;
  }

  const loading = await ctx.reply('Checking…');

  try {
    const connection = new Connection(config.solanaRpcUrl, 'confirmed');
    const lamports = await connection.getBalance(publicKey);
    const sol = lamports / LAMPORTS_PER_SOL;

    await ctx.api.deleteMessage(ctx.chat.id, loading.message_id);

    const short = `${address.slice(0, 4)}…${address.slice(-4)}`;
    const status = sol === 0 ? '⚠️ Empty' : sol < 0.01 ? '⚠️ Low' : '✅';

    await ctx.reply(
      `${status} *${escMd2(short)}*\n\n*${escMd2(sol.toFixed(4))} SOL*`,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: balanceActions(),
      }
    );
  } catch {
    await ctx.api.deleteMessage(ctx.chat.id, loading.message_id);
    await ctx.reply(`Couldn't check balance\\. Try again later\\.`, {
      parse_mode: 'MarkdownV2',
    });
  }
}
