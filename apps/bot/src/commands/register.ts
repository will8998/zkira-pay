import { CommandContext, Context } from 'grammy';
import { PublicKey } from '@solana/web3.js';
import { loadConfig } from '../config.js';
import { mainMenu } from '../keyboards.js';

export async function handleRegister(ctx: CommandContext<Context>) {
  const config = loadConfig();
  const address = ctx.match?.toString().trim();

  if (!address) {
    await ctx.reply('Send your Solana wallet address to link it\\.', {
      parse_mode: 'MarkdownV2',
    });
    return;
  }

  try {
    new PublicKey(address);
  } catch {
    await ctx.reply(`That doesn't look right\. Send a valid Solana address\.`, {
      parse_mode: 'MarkdownV2',
    });
    return;
  }

  try {
    const res = await fetch(`${config.apiUrl}/api/users/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: address }),
    });

    if (!res.ok) throw new Error('API error');

    const short = `${address.slice(0, 4)}…${address.slice(-4)}`;

    await ctx.reply(
      `✅ *Wallet linked*\n\n\`${short}\`\n\nYou're ready to go\\.`,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: mainMenu(),
      }
    );
  } catch {
    await ctx.reply(`Couldn't link wallet\. Try again later\.`, {
      parse_mode: 'MarkdownV2',
    });
  }
}
