use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

declare_id!("EECGiV8qMJm7BT4HpLw3KBWUAETDDB8H33jaRtTRpe5v");

#[program]
pub mod ghost_registry {
    use super::*;




    /// Send tokens to a stealth address and create announcement
    pub fn send_to_stealth(
        ctx: Context<SendToStealth>,
        ephemeral_pubkey: [u8; 32],
        stealth_address: [u8; 32],
        encrypted_metadata: Vec<u8>,
        amount: u64,
    ) -> Result<()> {
        require!(encrypted_metadata.len() <= 256, GhostError::MetadataTooLarge);

        let announcement = &mut ctx.accounts.announcement;
        let clock = Clock::get()?;

        // Set announcement data
        announcement.ephemeral_pubkey = ephemeral_pubkey;
        announcement.stealth_address = stealth_address;
        announcement.token_mint = ctx.accounts.token_mint.key();
        announcement.encrypted_metadata = encrypted_metadata;
        announcement.timestamp = clock.unix_timestamp;
        announcement.bump = ctx.bumps.announcement;

        // Transfer tokens from sender to stealth address
        let transfer_accounts = TransferChecked {
            from: ctx.accounts.sender_token_account.to_account_info(),
            mint: ctx.accounts.token_mint.to_account_info(),
            to: ctx.accounts.stealth_token_account.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_accounts,
        );

        token_interface::transfer_checked(
            cpi_ctx,
            amount,
            ctx.accounts.token_mint.decimals,
        )?;

        Ok(())
    }

}

// Account Structures


#[account]
pub struct Announcement {
    /// Sender's ephemeral Ed25519 public key
    pub ephemeral_pubkey: [u8; 32],
    /// Derived stealth address (Ed25519 pubkey)
    pub stealth_address: [u8; 32],
    /// SPL token mint
    pub token_mint: Pubkey,
    /// AES-GCM encrypted metadata (max 256 bytes)
    pub encrypted_metadata: Vec<u8>,
    /// Unix timestamp
    pub timestamp: i64,
    /// PDA bump
    pub bump: u8,
}

impl Announcement {
    pub const LEN: usize = 32 + 32 + 32 + (4 + 256) + 8 + 1;
}

// Instruction Contexts




#[derive(Accounts)]
#[instruction(ephemeral_pubkey: [u8; 32], stealth_address: [u8; 32], encrypted_metadata: Vec<u8>, amount: u64)]
pub struct SendToStealth<'info> {
    #[account(
        init,
        payer = sender,
        space = 8 + Announcement::LEN,
        seeds = [b"announce", stealth_address.as_ref()],
        bump
    )]
    pub announcement: Account<'info, Announcement>,

    #[account(mut)]
    pub sender: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = sender,
        associated_token::token_program = token_program
    )]
    pub sender_token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: This is the stealth address derived from ECDH
    pub stealth_address_account: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = sender,
        associated_token::mint = token_mint,
        associated_token::authority = stealth_address_account,
        associated_token::token_program = token_program
    )]
    pub stealth_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}



// Error Codes

#[error_code]
pub enum GhostError {
    #[msg("Label too long (max 32 characters)")]
    LabelTooLong,
    #[msg("Invalid public key length")]
    InvalidPubkeyLength,
    #[msg("Encrypted metadata too large (max 256 bytes)")]
    MetadataTooLarge,
    #[msg("Unauthorized")]
    Unauthorized,
}
