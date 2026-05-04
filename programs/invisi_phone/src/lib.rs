use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;


const COMP_DEF_OFFSET_CHECK_CONTACTS: u32 = comp_def_offset("check_contacts");


declare_id!("BwxmXwa3Gfz7xFpF5qMvuKSQunimR5HzzMmrb7VPWh4m");


pub const MAX_REGISTERED_USERS: usize = 50;
pub const MAX_CONTACTS_PER_BATCH: usize = 10;

// Seed for the registered users account (one global list for the app)
pub const REGISTERED_USERS_SEED: &[u8] = b"registered_users";

#[arcium_program]
pub mod invisi_phone {
    use super::*;
    use arcium_client::idl::arcium::types::CircuitSource;
    use arcium_client::idl::arcium::types::OffChainCircuitSource;

    pub fn init_check_contacts_comp_def(
    ctx: Context<InitCheckContactsCompDef>
) -> Result<()> {
    init_comp_def(
        ctx.accounts,
        Some(CircuitSource::OffChain(OffChainCircuitSource {
            source: "https://dwoonbiedwpwwmlknxvn.supabase.co/storage/v1/object/public/arcium1/check_contacts.arcis".to_string(),
            hash: [
                0xf8, 0x2f, 0x2d, 0xa4, 0x4a, 0x3b, 0x8a, 0x86,
                0xa3, 0x25, 0x5e, 0xaa, 0x01, 0x9d, 0xcf, 0x25,
                0x30, 0xdb, 0x79, 0x75, 0xa1, 0x70, 0x92, 0x09,
                0xa8, 0xdb, 0x00, 0xc9, 0xae, 0x8d, 0x94, 0x61,
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
        contacts_ciphertext: [u8; 32],      // encrypted ContactBatch
        registered_ciphertext: [u8; 32],    // encrypted RegisteredSet
        pubkey: [u8; 32],                   // user's encryption public key
        nonce: u128,                        // replay protection
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        // Package the encrypted inputs for Arcium
        let args = ArgBuilder::new()
            .x25519_pubkey(pubkey)                      // result recipient
            .plaintext_u128(nonce)                      // replay protection
            .encrypted_u8(contacts_ciphertext)          // user's secret contacts
            .encrypted_u8(registered_ciphertext)        // registered users (encrypted)
            .build();

        // Send to Arcium MXE — "when done, call check_contacts_callback"
        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            vec![CheckContactsCallback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[],
            )?],
            1,  // one output: the matches array [u8; 10]
            0,  // standard priority
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


        emit!(ContactMatchEvent {
            matches: o.ciphertexts[0],  
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
 
    pub mempool_account: UncheckedAccount<'info>,

    #[account(
        mut,
        address = derive_execpool_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]

    pub executing_pool: UncheckedAccount<'info>,

    #[account(
        mut,
        address = derive_comp_pda!(computation_offset, mxe_account, ErrorCode::ClusterNotSet)
    )]
 
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
    pub matches: [u8; 32],      // encrypted match results [1,0,1,0...]
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