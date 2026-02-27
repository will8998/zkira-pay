import { InlineKeyboard } from 'grammy';
import { loadConfig } from './config.js';
import { storeSecret } from './utils.js';

// ─── Main Menu ───

export function mainMenu() {
  const config = loadConfig();
  return new InlineKeyboard()
    .text('💰 Request Money', 'menu:request')
    .text('💳 Pay Someone', 'menu:pay')
    .row()
    .text('💼 Check Balance', 'menu:balance')
    .row()
    .text('📖 Learn', 'guide:home')
    .row()
    .url('📱 Open App', config.payAppUrl);
}

// ─── Amount Selection ───

export function amountPicker() {
  return new InlineKeyboard()
    .text('$10', 'amount:10')
    .text('$25', 'amount:25')
    .text('$50', 'amount:50')
    .text('$100', 'amount:100')
    .row()
    .text('$250', 'amount:250')
    .text('$500', 'amount:500')
    .text('$1000', 'amount:1000')
    .row()
    .text('↩️ Back', 'menu:home');
}

// ─── Token Selection ───

export function tokenPicker(amount: number) {
  return new InlineKeyboard()
    .text('USDC', `token:${amount}:USDC`)
    .text('SOL', `token:${amount}:SOL`)
    .row()
    .text('↩️ Back', 'menu:request');
}

// ─── Payment Created ───

export function paymentCreated(paymentUrl: string, claimSecretHex: string) {
  const secretId = storeSecret(claimSecretHex);
  return new InlineKeyboard()
    .url('\ud83d\udd17 Share Payment Link', paymentUrl)
    .row()
    .text('\ud83d\udd11 Show Claim Secret', `secret:${secretId}`)
    .row()
    .text('\ud83d\udcb0 New Request', 'menu:request')
    .text('\ud83c\udfe0 Home', 'menu:home');
}

// ─── After Secret Reveal ───

export function afterSecret() {
  return new InlineKeyboard()
    .text('💰 New Request', 'menu:request')
    .text('🏠 Home', 'menu:home');
}

// ─── Balance Result ───

export function balanceActions() {
  const config = loadConfig();
  return new InlineKeyboard()
    .text('💰 Request Money', 'menu:request')
    .row()
    .url('📱 Open App', config.payAppUrl)
    .row()
    .text('🏠 Home', 'menu:home');
}

// ─── Status Result ───

export function statusActions(payAppUrl: string) {
  return new InlineKeyboard()
    .url('📱 View in App', payAppUrl)
    .row()
    .text('🏠 Home', 'menu:home');
}

// ─── Claim Actions ───

export function claimActions(claimUrl: string) {
  return new InlineKeyboard()
    .url('💰 Claim Payment', claimUrl)
    .row()
    .text('🏠 Home', 'menu:home');
}

// ─── Confirm Amount (for natural text input) ───

export function confirmAmount(amount: number) {
  return new InlineKeyboard()
    .text('USDC', `token:${amount}:USDC`)
    .text('SOL', `token:${amount}:SOL`)
    .row()
    .text('✏️ Change Amount', 'menu:request')
    .text('❌ Cancel', 'menu:home');
}

// ─── Open App Only ───

export function openApp(path: string = '') {
  const config = loadConfig();
  const url = path ? `${config.payAppUrl}${path}` : config.payAppUrl;
  return new InlineKeyboard()
    .url('📱 Open App', url)
    .row()
    .text('🏠 Home', 'menu:home');
}
