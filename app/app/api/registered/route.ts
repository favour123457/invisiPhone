

import { NextResponse } from "next/server";
import * as anchor from "@coral-xyz/anchor";
import {
  getMXEPublicKey,
} from "@arcium-hq/client";
import { Connection, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import idl from "@/idl/invisi_phone.json";

const PROGRAM_ID = new PublicKey(
  "6SywLpwku6C4co4yFZ2YgZPEjhqaCTrdGdczt4njG2ny"
);
const REGISTERED_USERS_SEED = Buffer.from("registered_users");
const ENDPOINT = "https://api.devnet.solana.com";

export async function GET() {
  try {
    const connection = new Connection(ENDPOINT, "confirmed");

    // Create a read-only provider (no wallet needed for reading)
    const provider = new anchor.AnchorProvider(
      connection,
      {} as anchor.Wallet,
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

    const registeredAccount = await (program.account as Record<string, { fetch: (pda: PublicKey) => Promise<{ users: number[][]; count: number }> }>)
      .registeredUsers.fetch(registeredUsersPDA);

    // Convert registered users to base58 wallet strings
    const registeredWallets: string[] = (registeredAccount.users as number[][])
      .slice(0, registeredAccount.count)
      .map((bytes: number[]) => bs58.encode(new Uint8Array(bytes)));

    return NextResponse.json({
      mxePublicKeyHex: Buffer.from(mxePublicKey).toString("hex"),
      registeredWallets,
      count: registeredAccount.count,
    });

  } catch (err) {
    console.error("Registered API error:", err);
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || "Failed to fetch registered users" },
      { status: 500 }
    );
  }
}
