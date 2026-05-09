use arcis::*;

#[encrypted]
mod circuits {
    use arcis::*;

    pub struct ContactsInput {
        c0: u128,
        c1: u128,
        c2: u128,
        r0: u128,
        r1: u128,
        r2: u128,
        r3: u128,
        r4: u128,
        contact_count: u8,
        reg_count: u8,
    }

    #[instruction]
    pub fn check_contacts(input: Enc<Shared, ContactsInput>) -> Enc<Shared, [u8; 3]> {
        let d = input.to_arcis();
        let contacts = [d.c0, d.c1, d.c2];
        let registered = [d.r0, d.r1, d.r2, d.r3, d.r4];

        let mut matches: [u8; 3] = [0u8; 3];
        for i in 0..3usize {
            for j in 0..5usize {
                if (i as u8) < d.contact_count && (j as u8) < d.reg_count {
                    if contacts[i] == registered[j] && contacts[i] != 0 {
                        matches[i] = 1;
                    }
                }
            }
        }
        input.owner.from_arcis(matches)
    }
}