use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hashv;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

declare_id!("ET3eDt2vfvXXeUaDC4wJ1od9EZ2r6DGMmwiBzXJLAovJ");

#[program]
pub mod conditional_escrow {
    use super::*;

    pub fn create_milestone_escrow(
        ctx: Context<CreateMilestoneEscrow>,
        nonce: u64,
        claim_hash: [u8; 32],
        total_amount: u64,
        expiry: i64,
        recipient_spend_pubkey: [u8; 32],
        recipient_view_pubkey: [u8; 32],
        milestone_count: u8,
        milestone_amounts: Vec<u64>,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        // Validations
        require!(total_amount > 0, MilestoneEscrowError::ZeroAmount);
        require!(expiry > clock.unix_timestamp, MilestoneEscrowError::InvalidExpiry);
        require!(
            expiry < clock.unix_timestamp + (30 * 24 * 60 * 60), // 30 days
            MilestoneEscrowError::InvalidExpiry
        );
        require!(milestone_count > 0, MilestoneEscrowError::InvalidMilestoneCount);
        require!(milestone_count <= 10, MilestoneEscrowError::TooManyMilestones);
        require!(
            milestone_amounts.len() == milestone_count as usize,
            MilestoneEscrowError::MilestoneCountMismatch
        );

        // Validate sum of milestone amounts equals total amount
        let sum: u64 = milestone_amounts.iter().try_fold(0u64, |acc, &x| acc.checked_add(x)).ok_or(MilestoneEscrowError::Overflow)?;
        require!(sum == total_amount, MilestoneEscrowError::MilestoneAmountMismatch);

        // Initialize escrow account
        escrow.creator = ctx.accounts.creator.key();
        escrow.token_mint = ctx.accounts.token_mint.key();
        escrow.total_amount = total_amount;
        escrow.released_amount = 0;
        escrow.recipient_spend_pubkey = recipient_spend_pubkey;
        escrow.recipient_view_pubkey = recipient_view_pubkey;
        escrow.claim_hash = claim_hash;
        escrow.expiry = expiry;
        escrow.milestone_count = milestone_count;
        escrow.milestones_released = 0;
        escrow.refunded = false;
        escrow.nonce = nonce;
        escrow.fee_bps = 250; // 2.5% fee (hardcoded for now)
        escrow.bump = ctx.bumps.escrow;
        escrow.created_at = clock.unix_timestamp;

        // Initialize milestone arrays
        for i in 0..10 {
            if i < milestone_count as usize {
                escrow.milestone_amounts[i] = milestone_amounts[i];
                escrow.milestone_released[i] = false;
            } else {
                escrow.milestone_amounts[i] = 0;
                escrow.milestone_released[i] = false;
            }
        }

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
            total_amount,
            ctx.accounts.token_mint.decimals,
        )?;

        Ok(())
    }

    pub fn release_milestone(
        ctx: Context<ReleaseMilestone>,
        milestone_index: u8,
        claim_secret: Vec<u8>,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        // Validations
        require!(
            ctx.accounts.creator.key() == escrow.creator,
            MilestoneEscrowError::Unauthorized
        );
        require!(!escrow.refunded, MilestoneEscrowError::AlreadyRefunded);
        require!(clock.unix_timestamp < escrow.expiry, MilestoneEscrowError::EscrowExpired);
        require!(
            milestone_index < escrow.milestone_count,
            MilestoneEscrowError::InvalidMilestoneIndex
        );
        require!(
            !escrow.milestone_released[milestone_index as usize],
            MilestoneEscrowError::MilestoneAlreadyReleased
        );

        // Verify claim secret
        let domain = b"priv_claim";
        let computed_hash = hashv(&[domain, &claim_secret]);
        require!(
            computed_hash.to_bytes() == escrow.claim_hash,
            MilestoneEscrowError::InvalidClaimSecret
        );

        let milestone_amount = escrow.milestone_amounts[milestone_index as usize];

        // Calculate fee
        let fee_amount = milestone_amount
            .checked_mul(escrow.fee_bps as u64)
            .ok_or(MilestoneEscrowError::Overflow)?
            .checked_div(10000)
            .ok_or(MilestoneEscrowError::Overflow)?;

        let claim_amount = milestone_amount
            .checked_sub(fee_amount)
            .ok_or(MilestoneEscrowError::Overflow)?;

        // Transfer claim amount to claimer
        let _escrow_key = escrow.key();
        let seeds = &[
            b"milestone_escrow",
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

        // Transfer fee to fee recipient (creator for now - could be protocol fee later)
        if fee_amount > 0 {
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
                fee_amount,
                ctx.accounts.token_mint.decimals,
            )?;
        }

        // Mark milestone as released
        escrow.milestone_released[milestone_index as usize] = true;
        escrow.milestones_released += 1;
        escrow.released_amount = escrow
            .released_amount
            .checked_add(milestone_amount)
            .ok_or(MilestoneEscrowError::Overflow)?;

        Ok(())
    }

    pub fn refund_unreleased(ctx: Context<RefundUnreleased>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        // Validations
        require!(
            ctx.accounts.creator.key() == escrow.creator,
            MilestoneEscrowError::Unauthorized
        );
        require!(!escrow.refunded, MilestoneEscrowError::AlreadyRefunded);
        require!(
            clock.unix_timestamp >= escrow.expiry,
            MilestoneEscrowError::EscrowNotExpired
        );

        // Calculate unreleased amount
        let unreleased_amount = escrow
            .total_amount
            .checked_sub(escrow.released_amount)
            .ok_or(MilestoneEscrowError::Overflow)?;

        // Prepare seeds for both transfer and vault close
        let _escrow_key = escrow.key();
        let seeds = &[
            b"milestone_escrow",
            escrow.creator.as_ref(),
            &escrow.nonce.to_le_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];

        if unreleased_amount > 0 {
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
                unreleased_amount,
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

        escrow.refunded = true;

        Ok(())
    }
}

// Account Structures

#[account]
pub struct MilestoneEscrow {
    pub creator: Pubkey,                    // 32 bytes
    pub token_mint: Pubkey,                 // 32 bytes
    pub total_amount: u64,                  // 8 bytes
    pub released_amount: u64,               // 8 bytes
    pub recipient_spend_pubkey: [u8; 32],   // 32 bytes
    pub recipient_view_pubkey: [u8; 32],    // 32 bytes
    pub claim_hash: [u8; 32],               // 32 bytes
    pub expiry: i64,                        // 8 bytes
    pub milestone_count: u8,                // 1 byte
    pub milestones_released: u8,            // 1 byte
    pub milestone_amounts: [u64; 10],       // 80 bytes
    pub milestone_released: [bool; 10],     // 10 bytes
    pub refunded: bool,                     // 1 byte
    pub nonce: u64,                         // 8 bytes
    pub fee_bps: u16,                       // 2 bytes
    pub bump: u8,                           // 1 byte
    pub created_at: i64,                    // 8 bytes
}

// Instruction Contexts

#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct CreateMilestoneEscrow<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + 335, // MilestoneEscrow space
        seeds = [b"milestone_escrow", creator.key().as_ref(), &nonce.to_le_bytes()],
        bump
    )]
    pub escrow: Box<Account<'info, MilestoneEscrow>>,
    #[account(
        init,
        payer = creator,
        token::mint = token_mint,
        token::authority = escrow,
        token::token_program = token_program,
        seeds = [b"milestone_vault", escrow.key().as_ref()],
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
pub struct ReleaseMilestone<'info> {
    #[account(
        mut,
        seeds = [b"milestone_escrow", escrow.creator.as_ref(), &escrow.nonce.to_le_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Box<Account<'info, MilestoneEscrow>>,
    #[account(
        mut,
        seeds = [b"milestone_vault", escrow.key().as_ref()],
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
        associated_token::authority = creator,
        associated_token::token_program = token_program
    )]
    pub creator_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(mut)]
    pub claimer: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundUnreleased<'info> {
    #[account(
        mut,
        seeds = [b"milestone_escrow", escrow.creator.as_ref(), &escrow.nonce.to_le_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Box<Account<'info, MilestoneEscrow>>,
    #[account(
        mut,
        seeds = [b"milestone_vault", escrow.key().as_ref()],
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
        constraint = creator.key() == escrow.creator @ MilestoneEscrowError::Unauthorized
    )]
    pub creator: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

// Error Codes

#[error_code]
pub enum MilestoneEscrowError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Invalid expiry time")]
    InvalidExpiry,
    #[msg("Invalid milestone count")]
    InvalidMilestoneCount,
    #[msg("Too many milestones (max 10)")]
    TooManyMilestones,
    #[msg("Milestone count does not match provided amounts")]
    MilestoneCountMismatch,
    #[msg("Sum of milestone amounts does not equal total amount")]
    MilestoneAmountMismatch,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Escrow already refunded")]
    AlreadyRefunded,
    #[msg("Escrow has expired")]
    EscrowExpired,
    #[msg("Escrow not yet expired")]
    EscrowNotExpired,
    #[msg("Invalid milestone index")]
    InvalidMilestoneIndex,
    #[msg("Milestone already released")]
    MilestoneAlreadyReleased,
    #[msg("Invalid claim secret")]
    InvalidClaimSecret,
    #[msg("Arithmetic overflow")]
    Overflow,
}