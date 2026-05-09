import * as anchor from "@coral-xyz/anchor";
import * as fs from "fs";
import * as os from "os";
import {
  getArciumAccountBaseSeed,
  getCompDefAccOffset,
  getArciumProgramId,
  getArciumProgram,
} from "@arcium-hq/client";

const idl = JSON.parse(fs.readFileSync("target/idl/invisi_phone.json", "utf8"));
const kp = anchor.web3.Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync(os.homedir() + "/.config/solana/id.json", "utf8")))
);
const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(kp), { commitment: "confirmed" });
anchor.setProvider(provider);
const program = new anchor.Program(idl as anchor.Idl, provider);
const arciumProgram = getArciumProgram(provider);

(async () => {
  try {
    const baseSeed = getArciumAccountBaseSeed("ComputationDefinitionAccount");
    const offset = getCompDefAccOffset("check_contacts");

    const [compDefPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [baseSeed, program.programId.toBuffer(), offset],
      getArciumProgramId()
    );

    console.log("Computation Definition PDA:", compDefPDA.toString());
    console.log("\nAttempting to close the old computation definition account...");

    // Try to close the account using Arcium's close instruction
    try {
      const closeIx = await arciumProgram.methods
        .closeComputationDefinition()
        .accounts({
          authority: kp.publicKey,
          compDefAccount: compDefPDA,
          receiver: kp.publicKey,
        })
        .instruction();

      const tx = new anchor.web3.Transaction().add(closeIx);
      const sig = await provider.sendAndConfirm(tx);
      console.log("✓ Closed old comp def account:", sig);
    } catch (err: any) {
      console.log("Could not close account (might not have close authority):", err.message);
      console.log("\nThe computation definition account exists but cannot be closed.");
      console.log("This means it was initialized without a finalize_authority.");
      console.log("\nYou have two options:");
      console.log("1. Deploy your program to a NEW program ID (recommended)");
      console.log("2. Contact Arcium support to help close the account");
      process.exit(1);
    }

    console.log("\nAccount closed successfully. You can now run:");
    console.log("  npx ts-node scripts/init_comp_def.ts");

  } catch (err: any) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
