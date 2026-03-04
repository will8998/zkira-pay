use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

declare_id!("DvHQCrzhL8ofNQFqxkRHnqf4Gmkejv48DCFAUMGtKHmX");

#[program]
pub mod payment_escrow {
    use super::*;

    pub fn initialize_config(ctx: Context<InitializeConfig>, fee_bps: u16) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.fee_recipient = ctx.accounts.admin.key();
        config.fee_bps = fee_bps;
        config.paused = false;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn update_config(
        ctx: Context<UpdateConfig>,
        new_admin: Option<Pubkey>,
        new_fee_recipient: Option<Pubkey>,
        new_fee_bps: Option<u16>,
        paused: Option<bool>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;

        if let Some(admin) = new_admin {
            config.admin = admin;
        }
        if let Some(fee_recipient) = new_fee_recipient {
            config.fee_recipient = fee_recipient;
        }
        if let Some(fee_bps) = new_fee_bps {
            config.fee_bps = fee_bps;
        }
        if let Some(paused) = paused {
            config.paused = paused;
        }

        Ok(())
    }

    pub fn create_payment(
        ctx: Context<CreatePayment>,
        nonce: u64,
        stealth_address: [u8; 32],
        amount: u64,
        expiry: i64,
        recipient_spend_pubkey: [u8; 32],
        recipient_view_pubkey: [u8; 32],
    ) -> Result<()> {
        let config = &ctx.accounts.config;
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        // Validations
        require!(!config.paused, EscrowError::ProtocolPaused);
        require!(amount > 0, EscrowError::ZeroAmount);
        require!(expiry > clock.unix_timestamp, EscrowError::InvalidExpiry);
        require!(
            expiry < clock.unix_timestamp + (30 * 24 * 60 * 60), // 30 days
            EscrowError::InvalidExpiry
        );

        // Initialize escrow account
        escrow.creator = ctx.accounts.creator.key();
        escrow.token_mint = ctx.accounts.token_mint.key();
        escrow.amount = amount;
        escrow.stealth_address = stealth_address;
        escrow.recipient_spend_pubkey = recipient_spend_pubkey;
        escrow.recipient_view_pubkey = recipient_view_pubkey;
        escrow.expiry = expiry;
        escrow.claimed = false;
        escrow.refunded = false;
        escrow.nonce = nonce;
        escrow.fee_bps = config.fee_bps;
        escrow.bump = ctx.bumps.escrow;
        escrow.created_at = clock.unix_timestamp;

        // Transfer tokens to vault
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.creator_ata.to_account_info(),
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.creator.to_account_info(),
            },
        );

        token_interface::transfer_checked(
            transfer_ctx,
            amount,
            ctx.accounts.token_mint.decimals,
        )?;

        Ok(())
    }

    pub fn claim_stealth(ctx: Context<ClaimStealth>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        // Validations
        require!(!escrow.claimed, EscrowError::AlreadyClaimed);
        require!(!escrow.refunded, EscrowError::AlreadyRefunded);
        require!(clock.unix_timestamp < escrow.expiry, EscrowError::PaymentExpired);

        // Verify claimer IS the stealth address — no secrets needed, just wallet ownership
        require!(
            ctx.accounts.claimer.key().to_bytes() == escrow.stealth_address,
            EscrowError::InvalidStealthAddress
        );

        // Calculate fee (same as before)
        let fee_amount = escrow.amount
            .checked_mul(escrow.fee_bps as u64)
            .ok_or(EscrowError::Overflow)?
            .checked_div(10000)
            .ok_or(EscrowError::Overflow)?;

        let claim_amount = escrow.amount
            .checked_sub(fee_amount)
            .ok_or(EscrowError::Overflow)?;

        // Transfer claim amount to claimer
        let seeds = &[
            b"escrow",
            escrow.creator.as_ref(),
            &escrow.nonce.to_le_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];

        if claim_amount > 0 {
            let transfer_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.token_mint.to_account_info(),
                    to: ctx.accounts.claimer_ata.to_account_info(),
                    authority: escrow.to_account_info(),
                },
                signer,
            );
            token_interface::transfer_checked(
                transfer_ctx,
                claim_amount,
                ctx.accounts.token_mint.decimals,
            )?;
        }

        // Transfer fee to fee recipient
        if fee_amount > 0 {
            let transfer_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.token_mint.to_account_info(),
                    to: ctx.accounts.fee_recipient_ata.to_account_info(),
                    authority: escrow.to_account_info(),
                },
                signer,
            );
            token_interface::transfer_checked(
                transfer_ctx,
                fee_amount,
                ctx.accounts.token_mint.decimals,
            )?;
        }

        // Close vault and return rent to creator
        let close_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token_interface::CloseAccount {
                account: ctx.accounts.vault.to_account_info(),
                destination: ctx.accounts.creator.to_account_info(),
                authority: escrow.to_account_info(),
            },
            signer,
        );
        anchor_spl::token_interface::close_account(close_ctx)?;

        escrow.claimed = true;
        Ok(())
    }

    pub fn refund_payment(ctx: Context<RefundPayment>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        // Validations
        require!(!escrow.claimed, EscrowError::AlreadyClaimed);
        require!(!escrow.refunded, EscrowError::AlreadyRefunded);
        require!(
            clock.unix_timestamp >= escrow.expiry,
            EscrowError::PaymentNotExpired
        );

        // Transfer all tokens back to creator
        let _escrow_key = escrow.key();
        let seeds = &[
            b"escrow",
            escrow.creator.as_ref(),
            &escrow.nonce.to_le_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.creator_ata.to_account_info(),
                authority: escrow.to_account_info(),
            },
            signer,
        );

        token_interface::transfer_checked(
            transfer_ctx,
            escrow.amount,
            ctx.accounts.token_mint.decimals,
        )?;

        // Close vault and return rent to creator
        let close_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token_interface::CloseAccount {
                account: ctx.accounts.vault.to_account_info(),
                destination: ctx.accounts.creator.to_account_info(),
                authority: escrow.to_account_info(),
            },
            signer,
        );

        anchor_spl::token_interface::close_account(close_ctx)?;

        escrow.refunded = true;

        Ok(())
    }
}

// Account Structures

#[account]
pub struct ProtocolConfig {
    pub admin: Pubkey,
    pub fee_recipient: Pubkey,
    pub fee_bps: u16,
    pub paused: bool,
    pub bump: u8,
}

#[account]
pub struct PaymentEscrow {
    pub creator: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub stealth_address: [u8; 32],
    pub recipient_spend_pubkey: [u8; 32],
    pub recipient_view_pubkey: [u8; 32],
    pub expiry: i64,
    pub claimed: bool,
    pub refunded: bool,
    pub nonce: u64,
    pub fee_bps: u16,
    pub bump: u8,
    pub created_at: i64,
}

// Instruction Contexts

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 76, // ProtocolConfig space
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.admin == admin.key() @ EscrowError::Unauthorized
    )]
    pub config: Account<'info, ProtocolConfig>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct CreatePayment<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    #[account(
        init,
        payer = creator,
        space = 8 + 205, // PaymentEscrow space
        seeds = [b"escrow", creator.key().as_ref(), &nonce.to_le_bytes()],
        bump
    )]
    pub escrow: Box<Account<'info, PaymentEscrow>>,
    #[account(
        init,
        payer = creator,
        token::mint = token_mint,
        token::authority = escrow,
        token::token_program = token_program,
        seeds = [b"vault", escrow.key().as_ref()],
        bump
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = creator,
        associated_token::token_program = token_program
    )]
    pub creator_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimStealth<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    #[account(
        mut,
        seeds = [b"escrow", escrow.creator.as_ref(), &escrow.nonce.to_le_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Box<Account<'info, PaymentEscrow>>,
    #[account(
        mut,
        seeds = [b"vault", escrow.key().as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = escrow
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = claimer,
        associated_token::token_program = token_program
    )]
    pub claimer_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = config.fee_recipient,
        associated_token::token_program = token_program
    )]
    pub fee_recipient_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: This is the creator account for rent refund, validated by constraint
    #[account(mut, constraint = creator.key() == escrow.creator @ EscrowError::Unauthorized)]
    pub creator: AccountInfo<'info>,
    #[account(mut)]
    pub claimer: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundPayment<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.creator.as_ref(), &escrow.nonce.to_le_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Box<Account<'info, PaymentEscrow>>,
    #[account(
        mut,
        seeds = [b"vault", escrow.key().as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = escrow
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = creator,
        associated_token::token_program = token_program
    )]
    pub creator_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = creator.key() == escrow.creator @ EscrowError::Unauthorized
    )]
    pub creator: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

// Error Codes

#[error_code]
pub enum EscrowError {
    #[msg("Protocol is paused")]
    ProtocolPaused,
    #[msg("Payment has expired")]
    PaymentExpired,
    #[msg("Payment not yet expired")]
    PaymentNotExpired,
    #[msg("Payment already claimed")]
    AlreadyClaimed,
    #[msg("Payment already refunded")]
    AlreadyRefunded,
    #[msg("Invalid stealth address — signer does not match")]
    InvalidStealthAddress,
    #[msg("Invalid expiry time")]
    InvalidExpiry,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
}
