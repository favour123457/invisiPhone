import { NextRequest, NextResponse } from "next/server";
import { RescueCipher, x25519 } from "@arcium-hq/client";

export async function POST(req: NextRequest) {
  try {
    const { matches, nonceBytes, privateKey, mxePublicKeyHex } = await req.json();

    const mxePublicKey = new Uint8Array(Buffer.from(mxePublicKeyHex, "hex"));
    const privKey = new Uint8Array(privateKey);
    const sharedSecret = x25519.getSharedSecret(privKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);

    const decrypted = cipher.decrypt(
      matches.map((matchArr: number[]) => new Uint8Array(matchArr)),
      new Uint8Array(nonceBytes)
    );

    return NextResponse.json({ decrypted: decrypted.map(Number) });

  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || "Decryption failed" },
      { status: 500 }
    );
  }
}