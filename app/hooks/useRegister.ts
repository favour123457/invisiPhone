"use client";

// hooks/useRegister.ts
// Handles the register_user transaction
// Web2 equivalent: POST /api/register { wallet: "..." }

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import idl from "@/idl/invisi_phone.json";

const PROGRAM_ID = new anchor.web3.PublicKey(
  "BwxmXwa3Gfz7xFpF5qMvuKSQunimR5HzzMmrb7VPWh4m"
);

// Seed matches what we used in the Solana program
// seeds = [REGISTERED_USERS_SEED] = b"registered_users"
const REGISTERED_USERS_SEED = Buffer.from("registered_users");

export type RegisterStatus =
  | "idle"
  | "sending"
  | "confirming"
  | "done"
  | "error"
  | "already_registered";

export function useRegister() {
  const { publicKey, wallet } = useWallet();
  const { connection } = useConnection();
  const [status, setStatus] = useState<RegisterStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const register = async () => {
    if (!publicKey || !wallet) return;
    setError(null);
    setStatus("sending");

    try {
      // Set up Anchor program client
      // This is your "API client" — uses the IDL to know what functions exist
      const provider = new anchor.AnchorProvider(
        connection,
        wallet.adapter as any,
        { commitment: "confirmed" }
      );
      anchor.setProvider(provider);
      const program = new anchor.Program(
        idl as anchor.Idl,
        provider
      );

      // Derive the registered_users PDA address
      // PDA = Program Derived Address — a deterministic account address
      // Same seeds as in the Solana program: [b"registered_users"]
      const [registeredUsersPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [REGISTERED_USERS_SEED],
        PROGRAM_ID
      );

      // The user's wallet address as 32 bytes
      // publicKey.toBytes() converts PublicKey → Uint8Array (32 bytes)
      const walletBytes = Array.from(publicKey.toBytes());

      setStatus("sending");

      // Call register_user in the Solana program
      // Anchor matches this to the registerUser instruction in the IDL
      const tx = await program.methods
        .registerUser(walletBytes)
        .accounts({
          payer: publicKey,
          registeredUsers: registeredUsersPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc({ commitment: "confirmed" });

      console.log("Registration tx:", tx);
      setStatus("done");
    } catch (err: any) {
      console.error("Registration error:", err);

      // Check if it's the AlreadyRegistered error from our Solana program
      if (err?.message?.includes("AlreadyRegistered")) {
        setStatus("already_registered");
      } else {
        setStatus("error");
        setError(err?.message || "Unknown error");
      }
    }
  };

  return { register, status, error };
}