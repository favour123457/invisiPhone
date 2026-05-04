// app/api/registered/route.ts
// Fetches registered users + MXE public key from Solana
// Runs server-side so @arcium-hq/client and @coral-xyz/anchor work fine

import { NextResponse } from "next/server";
import * as anchor from "@coral-xyz/anchor";
import {
  getMXEPublicKey,
  getMXEAccAddress,
} from "@arcium-hq/client";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "@/idl/invisi_phone.json";

const PROGRAM_ID = new PublicKey(
  "BwxmXwa3Gfz7xFpF5qMvuKSQunimR5HzzMmrb7VPWh4m"
);
const REGISTERED_USERS_SEED = Buffer.from("registered_users");
const ENDPOINT = "https://api.devnet.solana.com";

export async function GET() {
  try {
    const connection = new Connection(ENDPOINT, "confirmed");

    // Create a read-only provider (no wallet needed for reading)
    const provider = new anchor.AnchorProvider(
      connection,
      {} as any,
      { commitment: "confirmed" }
    );
    anchor.setProvider(provider);

    const program = new anchor.Program(
      idl as anchor.Idl,
      provider
    );

    // Fetch MXE public key
    const mxePublicKey = await getMXEPublicKey(provider, PROGRAM_ID);
    if (!mxePublicKey) {
      return NextResponse.json(
        { error: "MXE public key not set yet" },
        { status: 503 }
      );
    }

    // Fetch registered users from on-chain account
    const [registeredUsersPDA] = PublicKey.findProgramAddressSync(
      [REGISTERED_USERS_SEED],
      PROGRAM_ID
    );

    const registeredAccount = await (program.account as any)
      .registeredUsers.fetch(registeredUsersPDA);

    // Convert registered users to base58 wallet strings
    const bs58 = require("bs58");
    const registeredWallets: string[] = (registeredAccount.users as number[][])
      .slice(0, registeredAccount.count)
      .map((bytes: number[]) => bs58.encode(Buffer.from(bytes)));

    return NextResponse.json({
      mxePublicKeyHex: Buffer.from(mxePublicKey).toString("hex"),
      registeredWallets,
      count: registeredAccount.count,
    });

  } catch (err: any) {
    console.error("Registered API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch registered users" },
      { status: 500 }
    );
  }
}
