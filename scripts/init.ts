import * as anchor from "@coral-xyz/anchor";
import * as fs from "fs";
import * as os from "os";

const idl = JSON.parse(fs.readFileSync("target/idl/invisi_phone.json", "utf8"));
const kp = anchor.web3.Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync(os.homedir() + "/.config/solana/id.json", "utf8")))
);
const provider = new anchor.AnchorProvider(
  new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed"),
  new anchor.Wallet(kp),
  { commitment: "confirmed" }
);
anchor.setProvider(provider);
const program = new anchor.Program(idl as anchor.Idl, provider);

(async () => {
  const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("registered_users")],
    program.programId
  );
  const tx = await program.methods
    .initRegisteredUsers()
    .accounts({
      payer: kp.publicKey,
      registeredUsers: pda,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([kp])
    .rpc({ commitment: "confirmed" });
  console.log("Init registered users tx:", tx);
})();
