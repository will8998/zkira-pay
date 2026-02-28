use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hashv;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

declare_id!("yLGC8fizXAfvxT8AnQaVFCjEAScz5o4zqmBHoPVs3bu");

#[program]
pub mod multisig_escrow {
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

    pub fn create_multisig_escrow(
        ctx: Context<CreateMultisigEscrow>,
        nonce: u64,
        claim_hash: [u8; 32],
        amount: u64,
        expiry: i64,
        recipient_spend_pubkey: [u8; 32],
        recipient_view_pubkey: [u8; 32],
        approver_count: u8,
        required_approvals: u8,
        approvers: Vec<Pubkey>,
    ) -> Result<()> {
        let config = &ctx.accounts.config;
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        // Validations
        require!(!config.paused, MultisigEscrowError::ProtocolPaused);
        require!(amount > 0, MultisigEscrowError::ZeroAmount);
        require!(expiry > clock.unix_timestamp, MultisigEscrowError::InvalidExpiry);
        require!(
            expiry < clock.unix_timestamp + (30 * 24 * 60 * 60), // 30 days
            MultisigEscrowError::InvalidExpiry
        );
        require!(approver_count <= 3, MultisigEscrowError::TooManyApprovers);
        require!(required_approvals >= 1, MultisigEscrowError::InvalidRequiredApprovals);
        require!(required_approvals <= approver_count, MultisigEscrowError::InvalidRequiredApprovals);
        require!(approvers.len() == approver_count as usize, MultisigEscrowError::InvalidApproverCount);

        // Initialize escrow account
        escrow.creator = ctx.accounts.creator.key();
        escrow.token_mint = ctx.accounts.token_mint.key();
        escrow.amount = amount;
        escrow.recipient_spend_pubkey = recipient_spend_pubkey;
        escrow.recipient_view_pubkey = recipient_view_pubkey;
        escrow.claim_hash = claim_hash;
        escrow.expiry = expiry;
        escrow.approver_count = approver_count;
        escrow.required_approvals = required_approvals;
        escrow.current_approvals = 0;
        escrow.approval_bitmap = 0;
        escrow.released = false;
        escrow.refunded = false;
        escrow.nonce = nonce;
        escrow.fee_bps = config.fee_bps;
        escrow.bump = ctx.bumps.escrow;
        escrow.created_at = clock.unix_timestamp;

        // Initialize approvers array
        for i in 0..3 {
            if i < approvers.len() {
                escrow.approvers[i] = approvers[i];
            } else {
                escrow.approvers[i] = Pubkey::default();
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
            amount,
            ctx.accounts.token_mint.decimals,
        )?;

        Ok(())
    }

    pub fn approve_release(ctx: Context<ApproveRelease>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let approver = ctx.accounts.approver.key();
        let clock = Clock::get()?;

        // Validations
        require!(!escrow.released, MultisigEscrowError::AlreadyReleased);
        require!(!escrow.refunded, MultisigEscrowError::AlreadyRefunded);
        require!(clock.unix_timestamp < escrow.expiry, MultisigEscrowError::EscrowExpired);

        // Find approver in the list
        let mut approver_index = None;
        for i in 0..escrow.approver_count as usize {
            if escrow.approvers[i] == approver {
                approver_index = Some(i);
                break;
            }
        }

        let approver_index = approver_index.ok_or(MultisigEscrowError::NotAnApprover)?;

        // Check if already approved
        let approval_bit = 1u8 << approver_index;
        require!(
            (escrow.approval_bitmap & approval_bit) == 0,
            MultisigEscrowError::AlreadyApproved
        );

        // Set approval bit and increment count
        escrow.approval_bitmap |= approval_bit;
        escrow.current_approvals += 1;

        Ok(())
    }

    pub fn execute_release(ctx: Context<ExecuteRelease>, claim_secret: Vec<u8>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        // Validations
        require!(!escrow.released, MultisigEscrowError::AlreadyReleased);
        require!(!escrow.refunded, MultisigEscrowError::AlreadyRefunded);
        require!(clock.unix_timestamp < escrow.expiry, MultisigEscrowError::EscrowExpired);
        require!(
            escrow.current_approvals >= escrow.required_approvals,
            MultisigEscrowError::InsufficientApprovals
        );

        // Verify claim secret
        let domain = b"priv_claim";
        let computed_hash = hashv(&[domain, &claim_secret]);
        require!(
            computed_hash.to_bytes() == escrow.claim_hash,
            MultisigEscrowError::InvalidClaimSecret
        );

        // Calculate fee
        let fee_amount = escrow
            .amount
            .checked_mul(escrow.fee_bps as u64)
            .ok_or(MultisigEscrowError::Overflow)?
            .checked_div(10000)
            .ok_or(MultisigEscrowError::Overflow)?;

        let claim_amount = escrow
            .amount
            .checked_sub(fee_amount)
            .ok_or(MultisigEscrowError::Overflow)?;

        // Transfer claim amount to claimer
        let _escrow_key = escrow.key();
        let seeds = &[
            b"multisig_escrow",
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

        escrow.released = true;

        Ok(())
    }

    pub fn refund_multisig_escrow(ctx: Context<RefundMultisigEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        // Validations
        require!(!escrow.released, MultisigEscrowError::AlreadyReleased);
        require!(!escrow.refunded, MultisigEscrowError::AlreadyRefunded);
        require!(
            clock.unix_timestamp >= escrow.expiry,
            MultisigEscrowError::EscrowNotExpired
        );

        // Transfer all tokens back to creator
        let _escrow_key = escrow.key();
        let seeds = &[
            b"multisig_escrow",
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
pub struct MultisigEscrow {
    pub creator: Pubkey,                    // 32 bytes
    pub token_mint: Pubkey,                 // 32 bytes
    pub amount: u64,                        // 8 bytes
    pub recipient_spend_pubkey: [u8; 32],   // 32 bytes
    pub recipient_view_pubkey: [u8; 32],    // 32 bytes
    pub claim_hash: [u8; 32],               // 32 bytes
    pub expiry: i64,                        // 8 bytes
    pub approver_count: u8,                 // 1 byte
    pub required_approvals: u8,             // 1 byte
    pub current_approvals: u8,              // 1 byte
    pub approvers: [Pubkey; 3],             // 96 bytes
    pub approval_bitmap: u8,                // 1 byte
    pub released: bool,                     // 1 byte
    pub refunded: bool,                     // 1 byte
    pub nonce: u64,                         // 8 bytes
    pub fee_bps: u16,                       // 2 bytes
    pub bump: u8,                           // 1 byte
    pub created_at: i64,                    // 8 bytes
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
        constraint = config.admin == admin.key() @ MultisigEscrowError::Unauthorized
    )]
    pub config: Account<'info, ProtocolConfig>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct CreateMultisigEscrow<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    #[account(
        init,
        payer = creator,
        space = 8 + 297, // MultisigEscrow space
        seeds = [b"multisig_escrow", creator.key().as_ref(), &nonce.to_le_bytes()],
        bump
    )]
    pub escrow: Account<'info, MultisigEscrow>,
    #[account(
        init,
        payer = creator,
        token::mint = token_mint,
        token::authority = escrow,
        token::token_program = token_program,
        seeds = [b"multisig_vault", escrow.key().as_ref()],
        bump
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    pub token_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = creator,
        associated_token::token_program = token_program
    )]
    pub creator_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveRelease<'info> {
    #[account(
        mut,
        seeds = [b"multisig_escrow", escrow.creator.as_ref(), &escrow.nonce.to_le_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, MultisigEscrow>,
    pub approver: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecuteRelease<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    #[account(
        mut,
        seeds = [b"multisig_escrow", escrow.creator.as_ref(), &escrow.nonce.to_le_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, MultisigEscrow>,
    #[account(
        mut,
        seeds = [b"multisig_vault", escrow.key().as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = escrow
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    pub token_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = claimer,
        associated_token::token_program = token_program
    )]
    pub claimer_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = config.fee_recipient,
        associated_token::token_program = token_program
    )]
    pub fee_recipient_ata: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: This is the creator account for rent refund, validated by constraint
    #[account(mut, constraint = creator.key() == escrow.creator @ MultisigEscrowError::Unauthorized)]
    pub creator: AccountInfo<'info>,
    #[account(mut)]
    pub claimer: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundMultisigEscrow<'info> {
    #[account(
        mut,
        seeds = [b"multisig_escrow", escrow.creator.as_ref(), &escrow.nonce.to_le_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, MultisigEscrow>,
    #[account(
        mut,
        seeds = [b"multisig_vault", escrow.key().as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = escrow
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    pub token_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = creator,
        associated_token::token_program = token_program
    )]
    pub creator_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        constraint = creator.key() == escrow.creator @ MultisigEscrowError::Unauthorized
    )]
    pub creator: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

// Error Codes

#[error_code]
pub enum MultisigEscrowError {
    #[msg("Protocol is paused")]
    ProtocolPaused,
    #[msg("Escrow has expired")]
    EscrowExpired,
    #[msg("Escrow not yet expired")]
    EscrowNotExpired,
    #[msg("Already released")]
    AlreadyReleased,
    #[msg("Already refunded")]
    AlreadyRefunded,
    #[msg("Invalid claim secret")]
    InvalidClaimSecret,
    #[msg("Invalid expiry time")]
    InvalidExpiry,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Too many approvers (max 3)")]
    TooManyApprovers,
    #[msg("Invalid required approvals count")]
    InvalidRequiredApprovals,
    #[msg("Invalid approver count")]
    InvalidApproverCount,
    #[msg("Not an approver")]
    NotAnApprover,
    #[msg("Already approved")]
    AlreadyApproved,
    #[msg("Insufficient approvals")]
    InsufficientApprovals,
}