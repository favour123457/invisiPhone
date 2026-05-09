"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import idl from "@/idl/invisi_phone.json";

const ARCIUM_PROGRAM_ID = new anchor.web3.PublicKey(
  "Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ"
);
const PROGRAM_ID = new anchor.web3.PublicKey(
  "6SywLpwku6C4co4yFZ2YgZPEjhqaCTrdGdczt4njG2ny"
);
const CLUSTER_OFFSET = 456;
const COMP_DEF_OFFSET = 4010966309; // sha256("check_contacts")[0..4] as u32 LE

// All seeds from arcium-client/src/pda.rs
const getMXEAccAddress = (programId: anchor.web3.PublicKey) => {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("MXEAccount"), programId.toBytes()],
    ARCIUM_PROGRAM_ID
  )[0];
};

const getMempoolAccAddress = (clusterOffset: number) => {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(clusterOffset, 0);
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("Mempool"), buf],
    ARCIUM_PROGRAM_ID
  )[0];
};

const getExecutingPoolAccAddress = (clusterOffset: number) => {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(clusterOffset, 0);
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("Execpool"), buf],
    ARCIUM_PROGRAM_ID
  )[0];
};

const getComputationAccAddress = (
  clusterOffset: number,
  computationOffset: anchor.BN
) => {
  const clusterBuf = Buffer.alloc(4);
  clusterBuf.writeUInt32LE(clusterOffset, 0);
  const computationBuf = computationOffset.toArrayLike(Buffer, "le", 8);
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("ComputationAccount"), clusterBuf, computationBuf],
    ARCIUM_PROGRAM_ID
  )[0];
};

const getClusterAccAddress = (clusterOffset: number) => {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(clusterOffset, 0);
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("Cluster"), buf],
    ARCIUM_PROGRAM_ID
  )[0];
};

const getCompDefAccAddress = (
  programId: anchor.web3.PublicKey,
  offset: number
) => {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(offset, 0);
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("ComputationDefinitionAccount"), programId.toBytes(), buf],
    ARCIUM_PROGRAM_ID
  )[0];
};

const getSignPDAAddress = () => {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("ArciumSignerAccount")],
    PROGRAM_ID
  )[0];
};

export type DiscoveryStep =
  | "idle"
  | "generating_keypair"
  | "fetching_registered"
  | "encrypting_contacts"
  | "encrypting_registered"
  | "sending_transaction"
  | "waiting_arcium"
  | "decrypting"
  | "done"
  | "error";

export interface DiscoveryResult {
  matchedWallets: string[];
  totalContacts: number;
  totalMatches: number;
}

export function useContactDiscovery() {
  const { publicKey, wallet, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [step, setStep] = useState<DiscoveryStep>("idle");
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const discover = async (contactWallets: string[]) => {
    if (!publicKey || !wallet) return;
    if (contactWallets.length === 0) return;

    setResult(null);
    setError(null);

    try {
      // STEP 1: Set up Anchor program client with specifically wrapped wallet
      const anchorWallet = {
        publicKey: publicKey,
        signTransaction: async <T extends anchor.web3.Transaction | anchor.web3.VersionedTransaction>(tx: T): Promise<T> => {
          const adapter = wallet.adapter as any;
          if (!adapter.signTransaction) throw new Error("Wallet does not support signing");
          return await adapter.signTransaction(tx);
        },
        signAllTransactions: async <T extends anchor.web3.Transaction | anchor.web3.VersionedTransaction>(txs: T[]): Promise<T[]> => {
          const adapter = wallet.adapter as any;
          if (!adapter.signAllTransactions) throw new Error("Wallet does not support signing all");
          return await adapter.signAllTransactions(txs);
        },
      } as anchor.Wallet;

      const provider = new anchor.AnchorProvider(
        connection,
        anchorWallet,
        { commitment: "confirmed" }
      );
      anchor.setProvider(provider);
      const program = new anchor.Program(idl as anchor.Idl, provider);

      console.log("Program ID:", program.programId.toString());

      // STEP 2: Fetch registered users + MXE public key (server-side API)
      setStep("fetching_registered");
      const registeredRes = await fetch("/api/registered");
      if (!registeredRes.ok) {
        const err = await registeredRes.json();
        throw new Error(err.error || "Failed to fetch registered users");
      }
      const { mxePublicKeyHex, registeredWallets } = await registeredRes.json();
      console.log("Registered users:", registeredWallets.length);

      // STEP 3: Encrypt both sets (server-side API)
      setStep("encrypting_contacts");
      const contactSlice = contactWallets.slice(0, 3); // max 3 per circuit

      const encryptRes = await fetch("/api/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: contactSlice,
          registeredUsers: registeredWallets,
          mxePublicKeyHex,
        }),
      });

      if (!encryptRes.ok) {
        const err = await encryptRes.json();
        throw new Error(err.error || "Encryption failed");
      }

      const {
        c0, c1, c2,
        r0, r1, r2, r3, r4,
        contactCount, regCount,
        userPublicKey,
        privateKey,
        nonceLE,
      } = await encryptRes.json();

      // Convert arrays to proper format for Anchor
      const c0Array = Array.from(c0 as number[]);
      const c1Array = Array.from(c1 as number[]);
      const c2Array = Array.from(c2 as number[]);
      const r0Array = Array.from(r0 as number[]);
      const r1Array = Array.from(r1 as number[]);
      const r2Array = Array.from(r2 as number[]);
      const r3Array = Array.from(r3 as number[]);
      const r4Array = Array.from(r4 as number[]);
      const contactCountArray = Array.from(contactCount as number[]);
      const regCountArray = Array.from(regCount as number[]);
      const userPublicKeyArray = Array.from(userPublicKey as number[]);

      console.log("Encryption done, sending transaction...");
      console.log("c0 length:", c0Array.length);
      console.log("r0 length:", r0Array.length);
      console.log("contactCount length:", contactCountArray.length);
      console.log("userPublicKey length:", userPublicKeyArray.length);
      console.log("nonceLE type:", typeof nonceLE, "value:", nonceLE);

      // STEP 4: Build and send Solana transaction
      setStep("sending_transaction");

      const computationOffset = new anchor.BN(Date.now().toString());

      // Derive all account addresses using correct seeds
      const mxeAccount = getMXEAccAddress(PROGRAM_ID);
      const mempoolAccount = getMempoolAccAddress(CLUSTER_OFFSET);
      const executingPool = getExecutingPoolAccAddress(CLUSTER_OFFSET);
      const clusterAccount = getClusterAccAddress(CLUSTER_OFFSET);
      const computationAccount = getComputationAccAddress(CLUSTER_OFFSET, computationOffset);
      const compDefAccount = getCompDefAccAddress(PROGRAM_ID, COMP_DEF_OFFSET);
      const signPdaAccount = getSignPDAAddress();

      console.log("Accounts:", {
        mxeAccount: mxeAccount.toString(),
        mempoolAccount: mempoolAccount.toString(),
        executingPool: executingPool.toString(),
        clusterAccount: clusterAccount.toString(),
        computationAccount: computationAccount.toString(),
        compDefAccount: compDefAccount.toString(),
        signPdaAccount: signPdaAccount.toString(),
      });

      // Debug: Check available methods
      console.log("Available methods:", Object.keys(program.methods));
      console.log("Trying to call: checkContacts");

      // Build and send the transaction
      const nonceBigInt = BigInt("0x" + Buffer.from(nonceLE).reverse().toString("hex"));
      console.log("Constructed nonce BigInt:", nonceBigInt.toString());

      const tx = await program.methods
        .checkContacts(
          computationOffset,
          c0Array,
          c1Array,
          c2Array,
          r0Array,
          r1Array,
          r2Array,
          r3Array,
          r4Array,
          contactCountArray,
          regCountArray,
          userPublicKeyArray,
          new anchor.BN(nonceBigInt.toString())
        )
        .accountsPartial({
          payer: publicKey,
          signPdaAccount,
          computationAccount,
          clusterAccount,
          mxeAccount,
          mempoolAccount,
          executingPool,
          compDefAccount,
        })
        .transaction();

      console.log("Transaction built successfully. Sending...");

      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = latestBlockhash.blockhash;
      tx.feePayer = publicKey;

      // Simulate to catch underlying program error
      console.log("Simulating transaction locally...");
      const sim = await connection.simulateTransaction(tx);
      console.log("Simulation Result:", sim.value);
      if (sim.value.err) {
        throw new Error("RPC Simulation Failed! Logs: " + JSON.stringify(sim.value.logs, null, 2));
      }

      console.log("Transaction simulated successfully. Sending to wallet...");
      const signature = await sendTransaction(tx, connection);
      console.log("Transaction sent! Signature:", signature);

      console.log("Awaiting confirmation...");
      await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        "confirmed"
      );
      console.log("Transaction confirmed.");

      // STEP 5: Wait for Arcium callback event
      setStep("waiting_arcium");

      const matchEvent = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timeout waiting for Arcium result (2 min)"));
        }, 120000);

        const listenerId = program.addEventListener(
          "contactMatchEvent",
          (event) => {
            clearTimeout(timeout);
            program.removeEventListener(listenerId);
            resolve(event);
          }
        );
      });

      console.log("Match event received:", matchEvent);

      // STEP 6: Decrypt result (server-side API)
      setStep("decrypting");

      const decryptRes = await fetch("/api/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matches: Array.from(matchEvent.matches),
          nonceBytes: nonceLE,
          privateKey,
          mxePublicKeyHex,
        }),
      });
      const { decrypted } = await decryptRes.json();

      console.log("Decrypted matches:", decrypted);

      const matchedWallets: string[] = [];
      for (let i = 0; i < contactSlice.length; i++) {
        if (Number(decrypted[i]) === 1) {
          matchedWallets.push(contactSlice[i]);
        }
      }

      setResult({
        matchedWallets,
        totalContacts: contactSlice.length,
        totalMatches: matchedWallets.length,
      });
      setStep("done");

    } catch (err: any) {
      console.error("Discovery error:", err?.message);
      console.error("Discovery logs:", err?.logs);
      console.error("Full error object:", err);
      setStep("error");
      setError(err?.message || JSON.stringify(err) || "Something went wrong");
    }
  };

  return { discover, step, result, error };
}
