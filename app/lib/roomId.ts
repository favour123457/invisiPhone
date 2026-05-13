/** Deterministic room id for two wallets (order-independent). */
export async function getChatRoomId(walletA: string, walletB: string): Promise<string> {
  const sorted = [walletA, walletB].sort().join(":");
  const encoded = new TextEncoder().encode(sorted);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
