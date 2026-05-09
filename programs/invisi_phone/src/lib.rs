use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;
use arcium_client::idl::arcium::types::CircuitSource;        // add this
use arcium_client::idl::arcium::types::OffChainCircuitSource;

const COMP_DEF_OFFSET_CHECK_CONTACTS: u32 = comp_def_offset("check_contacts");


declare_id!("6SywLpwku6C4co4yFZ2YgZPEjhqaCTrdGdczt4njG2ny");


pub const MAX_REGISTERED_USERS: usize = 50;
pub const MAX_CONTACTS_PER_BATCH: usize = 10;

// Seed for the registered users account (one global list for the app)
pub const REGISTERED_USERS_SEED: &[u8] = b"registered_users";

#[arcium_program]
pub mod invisi_phone {
    use super::*;

    pub fn init_check_contacts_comp_def(
    ctx: Context<InitCheckContactsCompDef>
) -> Result<()> {
    init_comp_def(
        ctx.accounts,
        Some(CircuitSource::OffChain(OffChainCircuitSource {
            source: "https://dwoonbiedwpwwmlknxvn.supabase.co/storage/v1/object/public/arcium1/check_contacts.arcis".to_string(),
            hash: [
                0x47, 0x9a, 0xc7, 0x96, 0x48, 0x36, 0x93, 0xcc, 
                0x4e, 0x4d, 0xdc, 0xe0, 0xc0, 0xd7, 0x31, 0x28, 
                0x7a, 0x29, 0x96, 0x1f, 0xa2, 0xce, 0x20, 0x2e, 
                0x94, 0x71, 0xa3, 0x2f, 0x11, 0xe7, 0x15, 0x79
            ],
        })),
        None, // finalize_authority
    )?;
    Ok(())
}

    pub fn init_registered_users(
        ctx: Context<InitRegisteredUsers>
    ) -> Result<()> {
        let registered = &mut ctx.accounts.registered_users;
        registered.count = 0;
        registered.users = Vec::new();
        Ok(())
    }


    pub fn register_user(
        ctx: Context<RegisterUser>,
        wallet_address: [u8; 32],   // the user's wallet as 32 bytes
    ) -> Result<()> {
        let registered = &mut ctx.accounts.registered_users;

        // Check we haven't hit the max
        require!(
            registered.count < MAX_REGISTERED_USERS as u8,
            ErrorCode::RegistryFull
        );

        // Check they're not already registered (avoid duplicates)
        for i in 0..registered.count as usize {
            if registered.users[i] == wallet_address {
                return Err(ErrorCode::AlreadyRegistered.into());
            }
        }

        // Add them to the list
      
        registered.users.push(wallet_address);
        registered.count += 1;
        // Emit event so frontend knows registration succeeded
        emit!(UserRegisteredEvent {
            wallet: wallet_address,
            total_users: registered.count,
        });

        Ok(())
    }


    pub fn check_contacts(
        ctx: Context<CheckContacts>,
        computation_offset: u64,
        // 3 contact addresses
        c0: [u8; 32],
        c1: [u8; 32],
        c2: [u8; 32],
        // 5 registered user addresses
        r0: [u8; 32],
        r1: [u8; 32],
        r2: [u8; 32],
        r3: [u8; 32],
        r4: [u8; 32],
        // counts
        contact_count: [u8; 32],
        reg_count: [u8; 32],
        pubkey: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

       let args = ArgBuilder::new()
            .x25519_pubkey(pubkey)
            .plaintext_u128(nonce)
            .encrypted_u128(c0)
            .encrypted_u128(c1)
            .encrypted_u128(c2)
            .encrypted_u128(r0)
            .encrypted_u128(r1)
            .encrypted_u128(r2)
            .encrypted_u128(r3)
            .encrypted_u128(r4)
            .encrypted_u8(contact_count)
            .encrypted_u8(reg_count)
            .build();

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            vec![CheckContactsCallback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[],
            )?],
            1,
            0,
        )?;

        Ok(())
    }

 
    #[arcium_callback(encrypted_ix = "check_contacts")]
    pub fn check_contacts_callback(
        ctx: Context<CheckContactsCallback>,
        output: SignedComputationOutputs<CheckContactsOutput>,
    ) -> Result<()> {


        let o = match output.verify_output(
            &ctx.accounts.cluster_account,
            &ctx.accounts.computation_account,
        ) {
            Ok(CheckContactsOutput { field_0 }) => field_0,
            Err(_) => return Err(ErrorCode::AbortedComputation.into()),
        };


        let mut matches_arr = [[0u8; 32]; 3];
        for i in 0..3 {
            matches_arr[i] = o.ciphertexts[i];
        }

        emit!(ContactMatchEvent {
            matches: matches_arr,
            nonce: o.nonce.to_le_bytes(),
        });

        Ok(())
    }
}

#[account]
pub struct RegisteredUsers {
    pub count: u8,                              // how many users registered
    pub users: Vec<[u8; 32]>, // wallet addresses
}

impl RegisteredUsers {

    pub const SPACE: usize = 8 + 1 + 4 + (32 * MAX_REGISTERED_USERS);

}


#[derive(Accounts)]
pub struct InitRegisteredUsers<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = RegisteredUsers::SPACE,
        seeds = [REGISTERED_USERS_SEED],
        bump,
    )]
    pub registered_users: Account<'info, RegisteredUsers>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterUser<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [REGISTERED_USERS_SEED],
        bump,
    )]
    pub registered_users: Account<'info, RegisteredUsers>,

    pub system_program: Program<'info, System>,
}


#[queue_computation_accounts("check_contacts", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct CheckContacts<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, ArciumSignerAccount>,

    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,

    #[account(
        mut,
        address = derive_mempool_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,

    #[account(
        mut,
        address = derive_execpool_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,

    #[account(
        mut,
        address = derive_comp_pda!(computation_offset, mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,

    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_CHECK_CONTACTS)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,

    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    pub cluster_account: Account<'info, Cluster>,

    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Account<'info, FeePool>,

    #[account(
        mut,
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Account<'info, ClockAccount>,

    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}


#[callback_accounts("check_contacts")]
#[derive(Accounts)]
pub struct CheckContactsCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,

    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_CHECK_CONTACTS)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,

    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,

    /// CHECK: computation_account, checked by arcium program.
    pub computation_account: UncheckedAccount<'info>,

    #[account(
        address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    pub cluster_account: Account<'info, Cluster>,

    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

// Accounts for init_check_contacts_comp_def (run once at deploy)
#[init_computation_definition_accounts("check_contacts", payer)]
#[derive(Accounts)]
pub struct InitCheckContactsCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,

    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,

    #[account(
        mut,
        address = derive_mxe_lut_pda!(mxe_account.lut_offset_slot)
    )]
    /// CHECK: address_lookup_table, checked by arcium program.
    pub address_lookup_table: UncheckedAccount<'info>,

    #[account(address = LUT_PROGRAM_ID)]
    /// CHECK: lut_program is the Address Lookup Table program.
    pub lut_program: UncheckedAccount<'info>,

    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

// ============================================================
// EVENTS
// Frontend listens for these
// ============================================================

#[event]
pub struct UserRegisteredEvent {
    pub wallet: [u8; 32],       // who just registered
    pub total_users: u8,        // total registered users now
}

#[event]
pub struct ContactMatchEvent {
    pub matches: [[u8; 32]; 3],      // encrypted match results for 3 contacts
    pub nonce: [u8; 16],        // needed by frontend to decrypt
}

// ============================================================
// ERRORS
// ============================================================
#[error_code]
pub enum ErrorCode {
    #[msg("Computation was aborted or tampered with")]
    AbortedComputation,
    #[msg("No Arcium cluster assigned yet")]
    ClusterNotSet,
    #[msg("Registry is full (max 50 users)")]
    RegistryFull,
    #[msg("Wallet already registered")]
    AlreadyRegistered,
}