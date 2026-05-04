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
  uploadCircuit,
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
  const baseSeed = getArciumAccountBaseSeed("ComputationDefinitionAccount");
  const offset = getCompDefAccOffset("check_contacts");

  const [compDefPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [baseSeed, program.programId.toBuffer(), offset],
    getArciumProgramId()
  );

  const mxeAccount = getMXEAccAddress(program.programId);
  const mxeAcc = await arciumProgram.account.mxeAccount.fetch(mxeAccount);
  const lutAddress = getLookupTableAddress(program.programId, mxeAcc.lutOffsetSlot);

  const tx = await program.methods
    .initCheckContactsCompDef()
    .accounts({
      payer: kp.publicKey,
      mxeAccount,
      compDefAccount: compDefPDA,
      addressLookupTable: lutAddress,
    })
    .signers([kp])
    .rpc({ commitment: "confirmed" });

  console.log("Init comp def tx:", tx);
})();
