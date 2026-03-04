use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};
use groth16_solana::groth16::Groth16Verifier;

mod verifying_key;
use verifying_key::VERIFYING_KEY;

declare_id!("6g5RquPcpe81VzB6CtmuS8pzbXs7nZ5CT7gZt4fLKedx");

/// Number of recent merkle roots to retain in the ring buffer.
const ROOT_HISTORY_SIZE: usize = 20;

#[program]
pub mod shielded_pool {
    use super::*;

    /// Initialize a new shielded pool for a specific denomination
    pub fn initialize_pool(ctx: Context<InitializePool>, denomination: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool_state;
        pool.authority = ctx.accounts.authority.key();
        pool.token_mint = ctx.accounts.token_mint.key();
        pool.denomination = denomination;
        pool.merkle_root = [0u8; 32];
        pool.next_leaf_index = 0;
        pool.deposit_count = 0;
        pool.withdrawal_count = 0;
        pool.paused = false;
        pool.bump = ctx.bumps.pool_state;
        pool.root_history = [[0u8; 32]; ROOT_HISTORY_SIZE];
        pool.root_history_index = 0;
        pool.pending_withdrawals = 0;
        Ok(())
    }

    /// Deposit a fixed denomination into the shielded pool.
    /// The commitment is the Poseidon hash computed off-chain for the ZK circuit leaf.
    pub fn deposit(ctx: Context<Deposit>, commitment: [u8; 32]) -> Result<()> {
        let pool = &mut ctx.accounts.pool_state;

        // Transfer denomination amount from depositor to pool vault
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.depositor_ata.to_account_info(),
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.pool_vault.to_account_info(),
                authority: ctx.accounts.depositor.to_account_info(),
            },
        );
        token_interface::transfer_checked(
            transfer_ctx,
            pool.denomination,
            ctx.accounts.token_mint.decimals,
        )?;

        // Record leaf index for off-chain tree operator
        let leaf_index = pool.next_leaf_index;
        pool.next_leaf_index = pool
            .next_leaf_index
            .checked_add(1)
            .ok_or(PoolError::Overflow)?;
        pool.deposit_count = pool
            .deposit_count
            .checked_add(1)
            .ok_or(PoolError::Overflow)?;

        // Emit event for off-chain indexer
        emit!(DepositEvent {
            commitment,
            leaf_index,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Authority updates the merkle root after inserting new leaves off-chain.
    pub fn set_root(ctx: Context<SetRoot>, new_root: [u8; 32]) -> Result<()> {
        let pool = &mut ctx.accounts.pool_state;

        // Store current root in history ring buffer before overwriting
        let idx = pool.root_history_index as usize;
        pool.root_history[idx] = pool.merkle_root;
        pool.root_history_index = ((idx + 1) % ROOT_HISTORY_SIZE) as u8;

        // Update current root
        pool.merkle_root = new_root;

        Ok(())
    }

    /// Submit a Groth16 proof to queue a withdrawal.
    /// The nullifier PDA prevents double-spending (init fails if already exists).
    pub fn queue_withdrawal(
        ctx: Context<QueueWithdrawal>,
        proof_a: [u8; 64],
        proof_b: [u8; 128],
        proof_c: [u8; 64],
        public_inputs: [[u8; 32]; 4], // root, nullifierHash, recipient, denomination
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool_state;

        require!(!pool.paused, PoolError::PoolPaused);

        // Verify the root is current or in recent history
        let root = public_inputs[0];
        let root_valid = root == pool.merkle_root || pool.root_history.contains(&root);
        require!(root_valid, PoolError::InvalidRoot);

        // Verify Groth16 proof using groth16-solana (4 public inputs)
        let mut verifier =
            Groth16Verifier::new(&proof_a, &proof_b, &proof_c, &public_inputs, &VERIFYING_KEY)
                .map_err(|_| PoolError::ProofVerificationFailed)?;

        verifier
            .verify()
            .map_err(|_| PoolError::ProofVerificationFailed)?;

        // Initialize the nullifier account (PDA creation proves uniqueness)
        let nullifier = &mut ctx.accounts.nullifier;
        nullifier.bump = ctx.bumps.nullifier;

        // Initialize the withdrawal queue entry
        let withdrawal = &mut ctx.accounts.withdrawal;
        withdrawal.pool = pool.key();
        withdrawal.recipient = Pubkey::new_from_array(public_inputs[2]);
        withdrawal.amount = pool.denomination;
        withdrawal.queued_at = Clock::get()?.unix_timestamp;
        withdrawal.processed = false;
        withdrawal.bump = ctx.bumps.withdrawal;

        pool.pending_withdrawals = pool
            .pending_withdrawals
            .checked_add(1)
            .ok_or(PoolError::Overflow)?;

        Ok(())
    }

    /// Authority processes a queued withdrawal, transferring tokens to the recipient.
    pub fn process_batch(ctx: Context<ProcessBatch>) -> Result<()> {
        let pool = &mut ctx.accounts.pool_state;
        let withdrawal = &mut ctx.accounts.withdrawal;

        require!(!withdrawal.processed, PoolError::AlreadyProcessed);

        // Transfer from pool vault to recipient using PDA signer seeds
        let denomination_bytes = pool.denomination.to_le_bytes();
        let seeds = &[
            b"pool" as &[u8],
            pool.token_mint.as_ref(),
            denomination_bytes.as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.pool_vault.to_account_info(),
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.recipient_ata.to_account_info(),
                authority: pool.to_account_info(),
            },
            signer,
        );
        token_interface::transfer_checked(
            transfer_ctx,
            withdrawal.amount,
            ctx.accounts.token_mint.decimals,
        )?;

        withdrawal.processed = true;
        pool.withdrawal_count = pool
            .withdrawal_count
            .checked_add(1)
            .ok_or(PoolError::Overflow)?;
        pool.pending_withdrawals = pool.pending_withdrawals.saturating_sub(1);

        Ok(())
    }
}

// === Account Structures ===

#[account]
pub struct PoolState {
    /// Authority that can update merkle root and process batches
    pub authority: Pubkey,
    /// SPL token mint for this pool
    pub token_mint: Pubkey,
    /// Fixed denomination for deposits/withdrawals (e.g., 10_000_000 for 10 USDC)
    pub denomination: u64,
    /// Current Merkle root (updated off-chain)
    pub merkle_root: [u8; 32],
    /// Next available leaf index in the Merkle tree
    pub next_leaf_index: u64,
    /// Total number of deposits
    pub deposit_count: u64,
    /// Total number of withdrawals processed
    pub withdrawal_count: u64,
    /// Emergency pause flag
    pub paused: bool,
    /// PDA bump
    pub bump: u8,
    /// Ring buffer of recent merkle roots (allow proofs against recent roots)
    pub root_history: [[u8; 32]; 20], // ROOT_HISTORY_SIZE — const not allowed in attribute
    /// Current write position in the ring buffer
    pub root_history_index: u8,
    /// Number of queued but unprocessed withdrawals
    pub pending_withdrawals: u64,
}

impl PoolState {
    /// 32 (authority) + 32 (token_mint) + 8 (denomination) + 32 (merkle_root)
    /// + 8 (next_leaf_index) + 8 (deposit_count) + 8 (withdrawal_count)
    /// + 1 (paused) + 1 (bump) + 640 (root_history) + 1 (root_history_index)
    /// + 8 (pending_withdrawals)
    pub const LEN: usize = 32 + 32 + 8 + 32 + 8 + 8 + 8 + 1 + 1 + (32 * 20) + 1 + 8;
}

#[account]
pub struct Nullifier {
    pub bump: u8,
}

#[account]
pub struct WithdrawalEntry {
    pub pool: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub queued_at: i64,
    pub processed: bool,
    pub bump: u8,
}

impl WithdrawalEntry {
    pub const LEN: usize = 32 + 32 + 8 + 8 + 1 + 1; // 82
}

// === Instruction Contexts ===

#[derive(Accounts)]
#[instruction(denomination: u64)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + PoolState::LEN,
        seeds = [b"pool", token_mint.key().as_ref(), &denomination.to_le_bytes()],
        bump
    )]
    pub pool_state: Box<Account<'info, PoolState>>,
    /// Pool vault — PDA token account holding deposited funds
    #[account(
        init,
        payer = authority,
        token::mint = token_mint,
        token::authority = pool_state,
        seeds = [b"pool_vault", pool_state.key().as_ref()],
        bump
    )]
    pub pool_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool_state.token_mint.as_ref(), &pool_state.denomination.to_le_bytes()],
        bump = pool_state.bump,
        constraint = !pool_state.paused @ PoolError::PoolPaused
    )]
    pub pool_state: Box<Account<'info, PoolState>>,
    #[account(
        mut,
        seeds = [b"pool_vault", pool_state.key().as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = pool_state
    )]
    pub pool_vault: InterfaceAccount<'info, TokenAccount>,
    pub token_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = depositor,
        associated_token::token_program = token_program
    )]
    pub depositor_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub depositor: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct SetRoot<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool_state.token_mint.as_ref(), &pool_state.denomination.to_le_bytes()],
        bump = pool_state.bump,
        constraint = pool_state.authority == authority.key() @ PoolError::Unauthorized
    )]
    pub pool_state: Box<Account<'info, PoolState>>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(proof_a: [u8; 64], proof_b: [u8; 128], proof_c: [u8; 64], public_inputs: [[u8; 32]; 4])]
pub struct QueueWithdrawal<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool_state.token_mint.as_ref(), &pool_state.denomination.to_le_bytes()],
        bump = pool_state.bump,
    )]
    pub pool_state: Box<Account<'info, PoolState>>,
    /// Nullifier PDA — if this account already exists, the nullifier was already spent
    #[account(
        init,
        payer = payer,
        space = 8 + 1,
        seeds = [b"nullifier", pool_state.key().as_ref(), public_inputs[1].as_ref()],
        bump
    )]
    pub nullifier: Account<'info, Nullifier>,
    /// Withdrawal queue entry
    #[account(
        init,
        payer = payer,
        space = 8 + WithdrawalEntry::LEN,
        seeds = [b"withdrawal", pool_state.key().as_ref(), public_inputs[1].as_ref()],
        bump
    )]
    pub withdrawal: Account<'info, WithdrawalEntry>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessBatch<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool_state.token_mint.as_ref(), &pool_state.denomination.to_le_bytes()],
        bump = pool_state.bump,
        constraint = pool_state.authority == authority.key() @ PoolError::Unauthorized
    )]
    pub pool_state: Box<Account<'info, PoolState>>,
    #[account(
        mut,
        constraint = withdrawal.pool == pool_state.key() @ PoolError::Unauthorized,
        constraint = !withdrawal.processed @ PoolError::AlreadyProcessed
    )]
    pub withdrawal: Account<'info, WithdrawalEntry>,
    #[account(
        mut,
        seeds = [b"pool_vault", pool_state.key().as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = pool_state
    )]
    pub pool_vault: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_mint: Box<InterfaceAccount<'info, Mint>>,
    /// Recipient ATA — create if needed
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = token_mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_program
    )]
    pub recipient_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: Derived from the withdrawal entry's recipient field
    #[account(
        constraint = recipient.key() == withdrawal.recipient @ PoolError::Unauthorized
    )]
    pub recipient: UncheckedAccount<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

// === Events ===

#[event]
pub struct DepositEvent {
    pub commitment: [u8; 32],
    pub leaf_index: u64,
    pub timestamp: i64,
}

// === Errors ===

#[error_code]
pub enum PoolError {
    #[msg("Pool is paused")]
    PoolPaused,
    #[msg("Invalid denomination")]
    InvalidDenomination,
    #[msg("Nullifier already spent")]
    NullifierAlreadySpent,
    #[msg("Invalid Merkle root")]
    InvalidRoot,
    #[msg("Groth16 proof verification failed")]
    ProofVerificationFailed,
    #[msg("Soak time not met — deposit too recent")]
    SoakTimeNotMet,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Withdrawal already processed")]
    AlreadyProcessed,
}
