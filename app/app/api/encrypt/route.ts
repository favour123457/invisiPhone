// app/api/encrypt/route.ts
import { NextRequest, NextResponse } from "next/server";
import { RescueCipher, x25519 } from "@arcium-hq/client";
import { randomBytes } from "crypto";
import bs58 from "bs58";

export async function POST(req: NextRequest) {
  try {
    const { contacts, registeredUsers, mxePublicKeyHex } = await req.json();

    const mxePublicKey = new Uint8Array(Buffer.from(mxePublicKeyHex, "hex"));
    const privateKey = x25519.utils.randomSecretKey();
    const userPublicKey = x25519.getPublicKey(privateKey);
    const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);

    const nonceBytes = randomBytes(16);

    const walletToBigInt = (wallet: string): bigint => {
      const bytes = Buffer.from(bs58.decode(wallet));
      if (bytes.length < 16) throw new Error(`Wallet too short: ${wallet}`);
      return BigInt("0x" + bytes.slice(0, 16).toString("hex"));
    };

    const contactSlice = contacts.slice(0, 3);
    const regSlice = registeredUsers.slice(0, 5);

    // Debug

    // Build all 10 values in order — encrypt as ONE batch so RescueCipher
    // advances its internal counter correctly: position 0=c0, 1=c1, ..., 9=reg_count
    const contactBigInts: bigint[] = contactSlice.map(walletToBigInt);
    const regBigInts: bigint[] = regSlice.map(walletToBigInt);
    const allValues: bigint[] = [
      contactBigInts[0] ?? BigInt(0),
      contactBigInts[1] ?? BigInt(0),
      contactBigInts[2] ?? BigInt(0),
      regBigInts[0] ?? BigInt(0),
      regBigInts[1] ?? BigInt(0),
      regBigInts[2] ?? BigInt(0),
      regBigInts[3] ?? BigInt(0),
      regBigInts[4] ?? BigInt(0),
      BigInt(contactSlice.length),  // contact_count
      BigInt(regSlice.length),      // reg_count
    ];

    // Single encrypt call — returns one ciphertext per input element
    // RescueCipher uses nonce as counter base, incrementing per element internally
    const allEnc = cipher.encrypt(allValues, nonceBytes);

    return NextResponse.json({
      c0: Array.from(allEnc[0]),
      c1: Array.from(allEnc[1]),
      c2: Array.from(allEnc[2]),
      r0: Array.from(allEnc[3]),
      r1: Array.from(allEnc[4]),
      r2: Array.from(allEnc[5]),
      r3: Array.from(allEnc[6]),
      r4: Array.from(allEnc[7]),
      contactCount: Array.from(allEnc[8]),
      regCount: Array.from(allEnc[9]),
      userPublicKey: Array.from(userPublicKey),
      privateKey: Array.from(privateKey),
      nonceLE: Array.from(nonceBytes),
    });
  } catch (err) {
    console.error("Encrypt API error:", err);
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || "Encryption failed" },
      { status: 500 }
    );
  }
}