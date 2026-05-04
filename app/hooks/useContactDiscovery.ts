"use client";

// hooks/useContactDiscovery.ts
// All @arcium-hq/client logic moved to API routes (server-side)
// This hook only handles: UI state + Solana transaction + event listening

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import idl from "@/idl/invisi_phone.json";

// Import only the helper functions we need - these should be safe for client-side
// If these cause issues, we'll need to move them to an API route too
const getArciumEnv = () => ({
  arciumClusterOffset: new anchor.BN(0),
});

const getCompDefAccAddress = (programId: anchor.web3.PublicKey, offset: number) => {
  const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("comp_def"), Buffer.from([offset])],
    programId
  );
  return pda;
};

const getCompDefAccOffset = (name: string) => {
  // Simple hash of the computation name to get an offset
  return Buffer.from(name);
};

const getMXEAccAddress = (programId: anchor.web3.PublicKey) => {
  const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mxe")],
    programId
  );
  return pda;
};

const getMempoolAccAddress = (clusterOffset: anchor.BN) => {
  const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mempool"), clusterOffset.toArrayLike(Buffer, "le", 8)],
    new anchor.web3.PublicKey("ARC1UM7gWY3QkTDvvFPq3Uj3TYNQfMQgJLqVMCLtXZz")
  );
  return pda;
};

const getExecutingPoolAccAddress = (clusterOffset: anchor.BN) => {
  const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("executing_pool"), clusterOffset.toArrayLike(Buffer, "le", 8)],
    new anchor.web3.PublicKey("ARC1UM7gWY3QkTDvvFPq3Uj3TYNQfMQgJLqVMCLtXZz")
  );
  return pda;
};

const getComputationAccAddress = (clusterOffset: anchor.BN, computationOffset: anchor.BN) => {
  const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("computation"),
      clusterOffset.toArrayLike(Buffer, "le", 8),
      computationOffset.toArrayLike(Buffer, "le", 8)
    ],
    new anchor.web3.PublicKey("ARC1UM7gWY3QkTDvvFPq3Uj3TYNQfMQgJLqVMCLtXZz")
  );
  return pda;
};

const getClusterAccAddress = (clusterOffset: anchor.BN) => {
  const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("cluster"), clusterOffset.toArrayLike(Buffer, "le", 8)],
    new anchor.web3.PublicKey("ARC1UM7gWY3QkTDvvFPq3Uj3TYNQfMQgJLqVMCLtXZz")
  );
  return pda;
};

const PROGRAM_ID = new anchor.web3.PublicKey(
  "BwxmXwa3Gfz7xFpF5qMvuKSQunimR5HzzMmrb7VPWh4m"
);

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
  const { publicKey, wallet } = useWallet();
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
      // --------------------------------------------------------
      // STEP 1: Set up Anchor program client
      // --------------------------------------------------------
      const provider = new anchor.AnchorProvider(
        connection,
        wallet.adapter as any,
        { commitment: "confirmed" }
      );
      anchor.setProvider(provider);
      const program = new anchor.Program(idl as anchor.Idl, provider);

      // --------------------------------------------------------
      // STEP 2: Fetch MXE public key + registered users
      // Calls our API route — runs server-side, no fs error
      // --------------------------------------------------------
      setStep("fetching_registered");

      const registeredRes = await fetch("/api/registered");
      if (!registeredRes.ok) {
        const err = await registeredRes.json();
        throw new Error(err.error || "Failed to fetch registered users");
      }
      const { mxePublicKeyHex, registeredWallets } = await registeredRes.json();

      // --------------------------------------------------------
      // STEP 3: Encrypt both sets via API route
      // Calls our API route — runs server-side, no fs error
      // --------------------------------------------------------
      setStep("encrypting_contacts");

      const contactSlice = contactWallets.slice(0, 10);

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
        contactsCiphertext,
        registeredCiphertext,
        userPublicKey,
        privateKey,
        nonce,
        nonceBytes,
      } = await encryptRes.json();

      // --------------------------------------------------------
      // STEP 4: Send the Solana transaction
      // --------------------------------------------------------
      setStep("sending_transaction");

      const arciumEnv = getArciumEnv();
      const computationOffset = new anchor.BN(Date.now().toString());

      const tx = await program.methods
        .checkContacts(
          computationOffset,
          contactsCiphertext,
          registeredCiphertext,
          userPublicKey,
          new anchor.BN(nonce)
        )
        .accountsPartial({
          payer: publicKey,
          computationAccount: getComputationAccAddress(
            arciumEnv.arciumClusterOffset,
            computationOffset
          ),
          clusterAccount: getClusterAccAddress(arciumEnv.arciumClusterOffset),
          mxeAccount: getMXEAccAddress(PROGRAM_ID),
          mempoolAccount: getMempoolAccAddress(arciumEnv.arciumClusterOffset),
          executingPool: getExecutingPoolAccAddress(arciumEnv.arciumClusterOffset),
          compDefAccount: getCompDefAccAddress(
            PROGRAM_ID,
            Buffer.from(getCompDefAccOffset("check_contacts")).readUInt32LE()
          ),
        })
        .rpc({ skipPreflight: true, commitment: "confirmed" });

      console.log("Check contacts tx:", tx);

      // --------------------------------------------------------
      // STEP 5: Listen for ContactMatchEvent
      // --------------------------------------------------------
      setStep("waiting_arcium");

      const matchEvent = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timeout waiting for Arcium result"));
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

      // --------------------------------------------------------
      // STEP 6: Decrypt result using noble/curves (browser safe)
      // privateKey was returned by the encrypt API route
      // --------------------------------------------------------
      setStep("decrypting");

      const decryptRes = await fetch("/api/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matches: Array.from(matchEvent.matches),
          nonceBytes,
          privateKey,
          mxePublicKeyHex,
        }),
      });
      const { decrypted } = await decryptRes.json();

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
      console.error("Discovery error:", err);
      setStep("error");
      setError(err?.message || "Something went wrong");
    }
  };

  return { discover, step, result, error };
}