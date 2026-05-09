import * as anchor from "@coral-xyz/anchor";
import * as fs from "fs";
import * as os from "os";
import {
  getArciumAccountBaseSeed,
  getCompDefAccOffset,
  getArciumProgramId,
  getLookupTableAddress,
  getMXEAccAddress,
  getArciumProgram,
} from "@arcium-hq/client";
import {
  ComputeBudgetProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

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

    const mxeAccount = getMXEAccAddress(program.programId);
    const mxeAcc = await arciumProgram.account.mxeAccount.fetch(mxeAccount);
    const lutAddress = getLookupTableAddress(program.programId, mxeAcc.lutOffsetSlot);

    console.log("MXE Account:", mxeAccount.toString());
    console.log("LUT Address:", lutAddress.toString());

    // Build the instruction
    const ix = await program.methods
      .initCheckContactsCompDef()
      .accounts({
        payer: kp.publicKey,
        mxeAccount,
        compDefAccount: compDefPDA,
        addressLookupTable: lutAddress,
      })
      .instruction();

    // Add compute budget to get more CUs
    const computeIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: 1_400_000,  // max allowed
    });

    const tx = new Transaction().add(computeIx).add(ix);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = kp.publicKey;

    console.log("Sending transaction...");
    const sig = await sendAndConfirmTransaction(connection, tx, [kp], {
      commitment: "confirmed",
      skipPreflight: true,
    });
    console.log("✓ Init comp def tx:", sig);
    console.log("✓ Computation definition initialized successfully!");
  } catch (err: any) {
    console.error("Error initializing comp def:", err);
    if (err?.signature) {
      console.log("Transaction signature:", err.signature);
      const logs = await connection.getTransaction(err.signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      console.log("Transaction logs:", logs?.meta?.logMessages);
    }
    if (err?.logs) {
      console.log("Error logs:", err.logs);
    }
    process.exit(1);
  }
})();