use arcis::*;

#[encrypted]
mod circuits {
    use arcis::*;

    pub struct ContactBatch {
        contacts: [[u8; 32]; 10],
        count: u8,
    }

    pub struct RegisteredSet {
        users: [[u8; 32]; 50],
        count: u8,
    }

    #[instruction]
    pub fn check_contacts(
        contacts_ctxt: Enc<Shared, ContactBatch>,
        registered_ctxt: Enc<Shared, RegisteredSet>,
    ) -> Enc<Shared, [u8; 10]> {
        let contacts = contacts_ctxt.to_arcis();
        let registered = registered_ctxt.to_arcis();

        let mut matches: [u8; 10] = [0u8; 10];

        // Arcis only supports for loops with fixed ranges
        for i in 0..10usize {
            for j in 0..50usize {
                // Only compare within actual counts
                if (i as u8) < contacts.count && (j as u8) < registered.count {
                    let mut equal = true;

                    for k in 0..32usize {
                        if contacts.contacts[i][k] != registered.users[j][k] {
                            equal = false;
                        }
                    }

                    if equal {
                        matches[i] = 1;
                    }
                }
            }
        }

        contacts_ctxt.owner.from_arcis(matches)
    }
}