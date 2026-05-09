// app/api/encrypt/route.ts
// Runs on Node.js server — @arcium-hq/client works here, no 'fs' error
// Frontend calls this instead of importing @arcium-hq/client directly

import { NextRequest, NextResponse } from "next/server";
import {
  RescueCipher,
  x25519,
} from "@arcium-hq/client";
import { randomBytes } from "crypto";
import bs58 from "bs58";

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

    // Generate nonce
    const nonce = randomBytes(16);

    // The circuit expects:
    //   c0, c1, c2: Enc<Shared, [u8; 32]>  — 3 contact wallet addresses
    //   r0..r4:     Enc<Shared, [u8; 32]>  — 5 registered user addresses
    //   contact_count: Enc<Shared, u8>     — number of valid contacts
    //   reg_count:     Enc<Shared, u8>     — number of valid registered users
    //
    // Each [u8; 32] is encrypted as 32 separate BigInt values → 32 ciphertexts of 32 bytes each

    // Helper: convert a base58 wallet address' first 16 bytes into a single BigInt (u128 map)
    const walletToBigInt = (wallet: string): bigint[] => {
      const bytes = Buffer.from(bs58.decode(wallet));
      const u128Hex = bytes.slice(0, 16).toString("hex");
      return [BigInt("0x" + u128Hex)];
    };

    // Pad a missing wallet as a single zero BigInt
    const zeroPad1 = (): bigint[] => [BigInt(0)];

    // Build 3 contact slots
    const contactSlice = contacts.slice(0, 3);
    const c0 = contactSlice.length > 0 ? walletToBigInt(contactSlice[0]) : zeroPad1();
    const c1 = contactSlice.length > 1 ? walletToBigInt(contactSlice[1]) : zeroPad1();
    const c2 = contactSlice.length > 2 ? walletToBigInt(contactSlice[2]) : zeroPad1();

    // Build 5 registered user slots
    const regSlice = registeredUsers.slice(0, 5);
    const r0 = regSlice.length > 0 ? walletToBigInt(regSlice[0]) : zeroPad1();
    const r1 = regSlice.length > 1 ? walletToBigInt(regSlice[1]) : zeroPad1();
    const r2 = regSlice.length > 2 ? walletToBigInt(regSlice[2]) : zeroPad1();
    const r3 = regSlice.length > 3 ? walletToBigInt(regSlice[3]) : zeroPad1();
    const r4 = regSlice.length > 4 ? walletToBigInt(regSlice[4]) : zeroPad1();

    // Encrypt each [u8; 32] individually
    const c0Enc = cipher.encrypt(c0, nonce);
    const c1Enc = cipher.encrypt(c1, nonce);
    const c2Enc = cipher.encrypt(c2, nonce);
    const r0Enc = cipher.encrypt(r0, nonce);
    const r1Enc = cipher.encrypt(r1, nonce);
    const r2Enc = cipher.encrypt(r2, nonce);
    const r3Enc = cipher.encrypt(r3, nonce);
    const r4Enc = cipher.encrypt(r4, nonce);

    // Encrypt the counts (single u8 each)
    const contactCountEnc = cipher.encrypt([BigInt(contactSlice.length)], nonce);
    const regCountEnc = cipher.encrypt([BigInt(regSlice.length)], nonce);

    // Each cipher.encrypt() returns an array of Uint8Array ciphertexts (one per input element)
    // For [u8; 32], we get 32 ciphertexts of 32 bytes each
    // For u8, we get 1 ciphertext of 32 bytes
    // The on-chain instruction expects each as a flat [u8; 32] — but that's 32 bytes per encrypted primitive
    // Actually, looking at the Solana program: each arg is [u8; 32], meaning each is ONE encrypted u8 ciphertext
    // So we need to pass just the first ciphertext from each encryption

    return NextResponse.json({
      c0: Array.from(c0Enc[0]),
      c1: Array.from(c1Enc[0]),
      c2: Array.from(c2Enc[0]),
      r0: Array.from(r0Enc[0]),
      r1: Array.from(r1Enc[0]),
      r2: Array.from(r2Enc[0]),
      r3: Array.from(r3Enc[0]),
      r4: Array.from(r4Enc[0]),
      contactCount: Array.from(contactCountEnc[0]),
      regCount: Array.from(regCountEnc[0]),
      userPublicKey: Array.from(userPublicKey),
      privateKey: Array.from(privateKey),
      nonceLE: Array.from(Buffer.from(nonce)),
    });

  } catch (err: any) {
    console.error("Encrypt API error:", err);
    return NextResponse.json(
      { error: err.message || "Encryption failed" },
      { status: 500 }
    );
  }
}
