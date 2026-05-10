"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import idl from "@/idl/invisi_phone.json";

const ARCIUM_PROGRAM_ID = new anchor.web3.PublicKey("Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ");
const PROGRAM_ID = new anchor.web3.PublicKey("6SywLpwku6C4co4yFZ2YgZPEjhqaCTrdGdczt4njG2ny");
const CLUSTER_OFFSET = 456;
const COMP_DEF_OFFSET = 562783596;

const getMXEAccAddress = (programId: anchor.web3.PublicKey) =>
  anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("MXEAccount"), programId.toBytes()], ARCIUM_PROGRAM_ID)[0];

const getMempoolAccAddress = (offset: number) => {
  const buf = Buffer.alloc(4); buf.writeUInt32LE(offset, 0);
  return anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("Mempool"), buf], ARCIUM_PROGRAM_ID)[0];
};

const getExecutingPoolAccAddress = (offset: number) => {
  const buf = Buffer.alloc(4); buf.writeUInt32LE(offset, 0);
  return anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("Execpool"), buf], ARCIUM_PROGRAM_ID)[0];
};

const getComputationAccAddress = (clusterOffset: number, computationOffset: anchor.BN) => {
  const cb = Buffer.alloc(4); cb.writeUInt32LE(clusterOffset, 0);
  const ob = computationOffset.toArrayLike(Buffer, "le", 8);
  return anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("ComputationAccount"), cb, ob], ARCIUM_PROGRAM_ID)[0];
};

const getClusterAccAddress = (offset: number) => {
  const buf = Buffer.alloc(4); buf.writeUInt32LE(offset, 0);
  return anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("Cluster"), buf], ARCIUM_PROGRAM_ID)[0];
};

const getCompDefAccAddress = (programId: anchor.web3.PublicKey, offset: number) => {
  const buf = Buffer.alloc(4); buf.writeUInt32LE(offset, 0);
  return anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("ComputationDefinitionAccount"), programId.toBytes(), buf], ARCIUM_PROGRAM_ID)[0];
};

const getSignPDAAddress = () =>
  anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("ArciumSignerAccount")], PROGRAM_ID)[0];

export type DiscoveryStep =
  | "idle" | "generating_keypair" | "fetching_registered"
  | "encrypting_contacts" | "encrypting_registered"
  | "sending_transaction" | "waiting_arcium" | "decrypting"
  | "done" | "error";

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
    if (!publicKey || !wallet || contactWallets.length === 0) return;
    setResult(null); setError(null);

    try {
      const anchorWallet = {
        publicKey,
        signTransaction: async <T extends anchor.web3.Transaction | anchor.web3.VersionedTransaction>(tx: T): Promise<T> => {
          const adapter = wallet.adapter as any;
          if (!adapter.signTransaction) throw new Error("Wallet does not support signing");
          return await adapter.signTransaction(tx);
        },
        signAllTransactions: async <T extends anchor.web3.Transaction | anchor.web3.VersionedTransaction>(txs: T[]): Promise<T[]> => {
          const adapter = wallet.adapter as any;
          if (!adapter.signAllTransactions) throw new Error("Wallet does not support signing");
          return await adapter.signAllTransactions(txs);
        },
      } as anchor.Wallet;

      const provider = new anchor.AnchorProvider(connection, anchorWallet, { commitment: "confirmed" });
      anchor.setProvider(provider);
      const program = new anchor.Program(idl as anchor.Idl, provider);

      setStep("fetching_registered");
      const registeredRes = await fetch("/api/registered");
      if (!registeredRes.ok) throw new Error((await registeredRes.json()).error || "Failed to fetch registered users");
      const { mxePublicKeyHex, registeredWallets } = await registeredRes.json();

      setStep("encrypting_contacts");
      const contactSlice = contactWallets.slice(0, 3);

      const encryptRes = await fetch("/api/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: contactSlice, registeredUsers: registeredWallets, mxePublicKeyHex }),
      });
      if (!encryptRes.ok) throw new Error((await encryptRes.json()).error || "Encryption failed");

      const { c0, c1, c2, r0, r1, r2, r3, r4, contactCount, regCount, userPublicKey, privateKey, nonceLE } = await encryptRes.json();

      setStep("sending_transaction");
      const computationOffset = new anchor.BN(Date.now().toString());

      const mxeAccount = getMXEAccAddress(PROGRAM_ID);
      const mempoolAccount = getMempoolAccAddress(CLUSTER_OFFSET);
      const executingPool = getExecutingPoolAccAddress(CLUSTER_OFFSET);
      const clusterAccount = getClusterAccAddress(CLUSTER_OFFSET);
      const computationAccount = getComputationAccAddress(CLUSTER_OFFSET, computationOffset);
      const compDefAccount = getCompDefAccAddress(PROGRAM_ID, COMP_DEF_OFFSET);
      const signPdaAccount = getSignPDAAddress();

      const nonceBigInt = BigInt("0x" + Buffer.from(nonceLE).reverse().toString("hex"));

      const tx = await program.methods
        .checkContactsV2(
          computationOffset,
          Array.from(c0 as number[]), Array.from(c1 as number[]), Array.from(c2 as number[]),
          Array.from(r0 as number[]), Array.from(r1 as number[]), Array.from(r2 as number[]),
          Array.from(r3 as number[]), Array.from(r4 as number[]),
          Array.from(contactCount as number[]), Array.from(regCount as number[]),
          Array.from(userPublicKey as number[]),
          new anchor.BN(nonceBigInt.toString())
        )
        .accountsPartial({ payer: publicKey, signPdaAccount, computationAccount, clusterAccount, mxeAccount, mempoolAccount, executingPool, compDefAccount })
        .transaction();

      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = latestBlockhash.blockhash;
      tx.feePayer = publicKey;

      const sim = await connection.simulateTransaction(tx);
      if (sim.value.err) throw new Error("Simulation failed: " + JSON.stringify(sim.value.logs));

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature, blockhash: latestBlockhash.blockhash, lastValidBlockHeight: latestBlockhash.lastValidBlockHeight }, "confirmed");

      setStep("waiting_arcium");
      const matchEvent = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Timeout waiting for Arcium result (2 min)")), 120000);
        const listenerId = program.addEventListener("contactMatchEvent", (event) => {
          clearTimeout(timeout);
          program.removeEventListener(listenerId);
          resolve(event);
        });
      });

      setStep("decrypting");
      const decryptRes = await fetch("/api/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matches: Array.from(matchEvent.matches), nonceBytes: matchEvent.nonce, privateKey, mxePublicKeyHex }),
      });
      const { decrypted } = await decryptRes.json();

      const matchedWallets: string[] = [];
      for (let i = 0; i < contactSlice.length; i++) {
        if (Number(decrypted[i]) === 1) matchedWallets.push(contactSlice[i]);
      }

      setResult({ matchedWallets, totalContacts: contactSlice.length, totalMatches: matchedWallets.length });
      setStep("done");

    } catch (err: any) {
      setStep("error");
      setError(err?.message || "Something went wrong");
    }
  };

  return { discover, step, result, error };
}