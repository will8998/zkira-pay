import { Bot, Context, InlineKeyboard } from 'grammy';

// ─── Guide Navigation Keyboards ───

function guideNav(current: string) {
  const pages = ['how', 'what', 'privacy', 'features', 'faq'] as const;
  const idx = pages.indexOf(current as (typeof pages)[number]);
  const kb = new InlineKeyboard();

  if (idx > 0) kb.text('← Back', `guide:${pages[idx - 1]}`);
  if (idx < pages.length - 1) kb.text('Next →', `guide:${pages[idx + 1]}`);
  kb.row();
  kb.text('📖 Guide', 'guide:home').text('🏠 Menu', 'menu:home');
  return kb;
}

export function guideHomeKeyboard() {
  return new InlineKeyboard()
    .text('🔄 How It Works', 'guide:how')
    .row()
    .text('🔒 Privacy & Security', 'guide:privacy')
    .row()
    .text('💎 What is PRIV?', 'guide:what')
    .row()
    .text('⚡ Features', 'guide:features')
    .row()
    .text('❓ FAQ', 'guide:faq')
    .row()
    .text('🏠 Menu', 'menu:home');
}

// ─── Guide Page Content (pre-escaped MarkdownV2) ───

const GUIDE_HOME = `📖 *Learn about PRIV*

Private payments on Solana\\.
Simple as sending a link\\.

Pick a topic below to learn more\\.`;

const HOW_IT_WORKS = `🔄 *How It Works*

*Step 1* — Request
Tap *Request Money* and pick an amount\\.

*Step 2* — Share
Send the payment link to anyone — text, email, group chat\\.

*Step 3* — Pay
They open the link, connect a wallet, and send USDC\\.

*Step 4* — Claim
Use your claim secret to withdraw funds to your wallet\\.

That's it\\. Four steps\\. No accounts, no sign\\-ups\\.`;

const WHAT_IS_PRIV = `💎 *What is PRIV?*

Confidential payments infrastructure on Solana\\.

PRIV lets you request and receive money without exposing your wallet address, transaction history, or balances on\\-chain\\.

*How?*
Every payment creates a unique one\\-time stealth address\\. Only the person with the claim secret can access the funds\\. Nobody else — not even PRIV — can see who paid whom\\.

*Built on Solana*
Fast, cheap, final\\. Transactions settle in under a second for fractions of a cent\\.

*Open source*
Everything is verifiable\\. No trust required\\.`;

const PRIVACY = `🔒 *Privacy & Security*

*Stealth addresses*
Each payment generates a fresh one\\-time address\\. Your real wallet is never linked to the transaction\\.

*What's protected:*
✅ Sender identity
✅ Recipient identity
✅ Payment link \\(only you and the recipient see it\\)
✅ Claim secret \\(never stored on\\-chain\\)

*What's on\\-chain:*
📋 The escrow exists \\(amount \\+ one\\-time address\\)
📋 That's it — no names, no wallets, no history

*Claim secrets*
Your claim secret is the key to your funds\\. It's generated locally on your device and never sent to any server\\. Save it — if you lose it, nobody can recover it\\.

*No accounts*
PRIV doesn't require accounts, emails, or KYC\\. Connect a wallet, get paid\\.`;

const FEATURES = `⚡ *Features*

*💸 Stealth Transfers*
Send USDC via stealth addresses\\. Only the claim link recipient can access funds\\.

*🔗 Invoice Links*
Generate shareable payment links with built\\-in expiry\\. Send to anyone — they don't need PRIV or an account\\.

*🔐 Milestone Escrow*
Lock funds in escrow and release milestone\\-by\\-milestone\\. On\\-chain enforcement, no middleman\\.

*👥 Multi\\-sig Approval*
Require multiple approvers before funds are released\\. Perfect for teams and organizations\\.

*🤖 Telegram Bot*
Request money, check balances, and manage payments — all without leaving Telegram\\.

*📱 Web App*
Full dashboard at app\.zkira\.xyz — send, request, claim, and track everything\.`;

const FAQ = `❓ *FAQ*

*Do I need an account?*
No\\. Just a Solana wallet\\. No email, no sign\\-up\\.

*What tokens are supported?*
USDC on Solana\\. More tokens coming soon\\.

*Is it free?*
Creating payment links is free\\. Standard Solana network fees apply when sending and claiming \\(\\<$0\\.01\\)\\.

*What if I lose my claim secret?*
Funds cannot be recovered\. The claim secret is generated on your device and never stored by ZKIRA Pay\. Always save it somewhere safe\.

*Who can see my payment?*
Only you and the person you share the link with\\. The blockchain sees an escrow at a one\\-time address — no names, no wallet links\\.

*Can the sender take the money back?*
Escrows have an expiry\\. If unclaimed, the sender can reclaim after the expiry period\\.

*Where can I get help?*
Twitter: @zkira\_xyz
GitHub: github\.com/zkira\-pay`;

// ─── Register Guide Callbacks ───

export function registerGuideCallbacks(bot: Bot) {
  bot.callbackQuery('guide:home', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(GUIDE_HOME, {
      parse_mode: 'MarkdownV2',
      reply_markup: guideHomeKeyboard(),
    });
  });

  bot.callbackQuery('guide:how', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(HOW_IT_WORKS, {
      parse_mode: 'MarkdownV2',
      reply_markup: guideNav('how'),
    });
  });

  bot.callbackQuery('guide:what', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(WHAT_IS_PRIV, {
      parse_mode: 'MarkdownV2',
      reply_markup: guideNav('what'),
    });
  });

  bot.callbackQuery('guide:privacy', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(PRIVACY, {
      parse_mode: 'MarkdownV2',
      reply_markup: guideNav('privacy'),
    });
  });

  bot.callbackQuery('guide:features', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(FEATURES, {
      parse_mode: 'MarkdownV2',
      reply_markup: guideNav('features'),
    });
  });

  bot.callbackQuery('guide:faq', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(FAQ, {
      parse_mode: 'MarkdownV2',
      reply_markup: guideNav('faq'),
    });
  });
}
