import * as anchor from "@coral-xyz/anchor";
import * as fs from "fs";
import * as os from "os";
import {
  getArciumAccountBaseSeed,
  getCompDefAccOffset,
  getArciumProgramId,
} from "@arcium-hq/client";

const idl = JSON.parse(fs.readFileSync("target/idl/invisi_phone.json", "utf8"));
const kp = anchor.web3.Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync(os.homedir() + "/.config/solana/id.json", "utf8")))
);
const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(kp), { commitment: "confirmed" });
anchor.setProvider(provider);
const program = new anchor.Program(idl as anchor.Idl, provider);

(async () => {
  const baseSeed = getArciumAccountBaseSeed("ComputationDefinitionAccount");
  const offset = getCompDefAccOffset("check_contacts");

  const [compDefPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [baseSeed, program.programId.toBuffer(), offset],
    getArciumProgramId()
  );

  console.log("Computation Definition PDA:", compDefPDA.toString());
  
  try {
    const accountInfo = await connection.getAccountInfo(compDefPDA);
    if (accountInfo) {
      console.log("✓ Computation definition account EXISTS");
      console.log("  Owner:", accountInfo.owner.toString());
      console.log("  Data length:", accountInfo.data.length);
    } else {
      console.log("✗ Computation definition account DOES NOT EXIST");
      console.log("\nYou need to run: npm run init-comp-def");
    }
  } catch (err) {
    console.error("Error checking account:", err);
  }
})();
