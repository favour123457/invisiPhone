// app/api/encrypt/route.ts
// Runs on Node.js server — @arcium-hq/client works here, no 'fs' error
// Frontend calls this instead of importing @arcium-hq/client directly

import { NextRequest, NextResponse } from "next/server";
import {
  RescueCipher,
  x25519,
  deserializeLE,
} from "@arcium-hq/client";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { contacts, registeredUsers, mxePublicKeyHex } = await req.json();

    // Reconstruct the MXE public key from hex string (sent by frontend)
    const mxePublicKey = new Uint8Array(
      Buffer.from(mxePublicKeyHex, "hex")
    );

    // Generate a fresh x25519 keypair for this computation
    const privateKey = x25519.utils.randomSecretKey();
    const userPublicKey = x25519.getPublicKey(privateKey);

    // Derive shared secret between user and MXE
    const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);

    // Prepare contact batch as BigInts (10 slots, padded with zeros)
    const MAX_CONTACTS = 10;
    const MAX_REGISTERED = 50;

    const contactSlice = contacts.slice(0, MAX_CONTACTS);

    // Convert wallet addresses to 32-byte arrays of BigInts
    const contactBytes: bigint[][] = contactSlice.map((wallet: string) => {
      const bytes = Buffer.from(
        require("bs58").decode(wallet)
      );
      return Array.from(bytes).map((b: number) => BigInt(b));
    });

    // Pad to exactly 10 slots
    while (contactBytes.length < MAX_CONTACTS) {
      contactBytes.push(new Array(32).fill(BigInt(0)));
    }

    const contactPlaintext = [
      ...contactBytes.flat(),
      BigInt(contactSlice.length),
    ];

    // Prepare registered users set
    const registeredBytes: bigint[][] = registeredUsers
      .slice(0, MAX_REGISTERED)
      .map((wallet: string) => {
        const bytes = Buffer.from(require("bs58").decode(wallet));
        return Array.from(bytes).map((b: number) => BigInt(b));
      });

    while (registeredBytes.length < MAX_REGISTERED) {
      registeredBytes.push(new Array(32).fill(BigInt(0)));
    }

    const registeredPlaintext = [
      ...registeredBytes.flat(),
      BigInt(registeredUsers.length),
    ];

    // Encrypt both sets
    const nonce = randomBytes(16);
    const nonceBN = deserializeLE(nonce);

    const contactsCiphertext = cipher.encrypt(contactPlaintext, nonce);
    const registeredCiphertext = cipher.encrypt(registeredPlaintext, nonce);

    // Return everything the frontend needs to send the transaction
    return NextResponse.json({
      contactsCiphertext: Array.from(contactsCiphertext[0]),
      registeredCiphertext: Array.from(registeredCiphertext[0]),
      userPublicKey: Array.from(userPublicKey),
      privateKey: Array.from(privateKey),  // needed later for decryption
      nonce: nonceBN.toString(),
      nonceBytes: Array.from(nonce),        // needed for decryption
    });

  } catch (err: any) {
    console.error("Encrypt API error:", err);
    return NextResponse.json(
      { error: err.message || "Encryption failed" },
      { status: 500 }
    );
  }
}
