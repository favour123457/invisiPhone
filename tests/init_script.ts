import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import * as fs from "fs";
import {
    getMXEAccAddress,
    getClusterAccAddress,
    getMempoolAccAddress,
    getExecutingPoolAccAddress,
    getLookupTableAddress,
    getArciumProgram,
} from "@arcium-hq/client";

async function main() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    console.log("Using network:", provider.connection.rpcEndpoint);

    const idlPath = "./target/idl/invisi_phone.json";
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
    const programId = new anchor.web3.PublicKey("6SywLpwku6C4co4yFZ2YgZPEjhqaCTrdGdczt4njG2ny");
    const program = new Program(idl, provider);

    // Devnet only has one cluster offset: 456
    const CLUSTER_OFFSET = 456;

    const ARCIUM_PROGRAM = new anchor.web3.PublicKey("Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ");

    // Derive registered users PDA
    const [registeredUsersPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("registered_users")],
        programId
    );

    // Derive comp def account
    const COMP_DEF_OFFSET = 562783596;
    const compDefBuf = Buffer.alloc(4);
    compDefBuf.writeUInt32LE(COMP_DEF_OFFSET, 0);
    const compDefAccount = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("ComputationDefinitionAccount"), programId.toBytes(), compDefBuf],
        ARCIUM_PROGRAM
    )[0];

    // Derive all cluster-related accounts
    const mxeAccount = getMXEAccAddress(programId);
    const clusterAccount = getClusterAccAddress(CLUSTER_OFFSET);
    const mempoolAccount = getMempoolAccAddress(CLUSTER_OFFSET);
    const executingPool = getExecutingPoolAccAddress(CLUSTER_OFFSET);

    // Fetch lut offset from the MXE account data
    const arciumProgram = getArciumProgram(provider);
    const mxeData = await arciumProgram.account.mxeAccount.fetch(mxeAccount);
    console.log("MXE data keys:", Object.keys(mxeData));
    const addressLookupTable = getLookupTableAddress(programId, mxeData.lutOffsetSlot);

    console.log("Registered Users PDA: ", registeredUsersPda.toString());
    console.log("Comp Def Account:     ", compDefAccount.toString());
    console.log("MXE Account:          ", mxeAccount.toString());
    console.log("Cluster Account:      ", clusterAccount.toString());
    console.log("Mempool Account:      ", mempoolAccount.toString());
    console.log("Executing Pool:       ", executingPool.toString());
    console.log("Address Lookup Table: ", addressLookupTable.toString());

    // Step 1: Init registered users (already initialized - expected to fail silently)
    try {
        const tx1 = await program.methods.initRegisteredUsers().accounts({
            payer: provider.wallet.publicKey,
            registeredUsers: registeredUsersPda,
            systemProgram: anchor.web3.SystemProgram.programId,
        }).rpc();
        console.log("Initialized Registered Users! TX:", tx1);
    } catch (e: any) {
        console.log("Registered Users already initialized, skipping.");
    }

    // Step 2: Init computation definition with all required accounts
    try {
        console.log("Calling initCheckContactsV2CompDef...");
        const tx2 = await program.methods.initCheckContactsV2CompDef().accountsPartial({
            payer: provider.wallet.publicKey,
            mxeAccount: mxeAccount,
            compDefAccount: compDefAccount,
            clusterAccount: clusterAccount,
            mempoolAccount: mempoolAccount,
            executingPool: executingPool,
            addressLookupTable: addressLookupTable,
            systemProgram: anchor.web3.SystemProgram.programId,
        }).rpc({ skipPreflight: false });
        console.log("Initialized Comp Def! TX:", tx2);
    } catch (e: any) {
        console.log("Comp Def init error:", e.message);
        if (e.logs) console.log("Logs:", e.logs);
    }
}

main().catch(console.error);