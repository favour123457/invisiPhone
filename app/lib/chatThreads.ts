import { ref, set } from "firebase/database";
import { db } from "@/lib/firebase";

/**
 * Notify both wallets that they share a chat room (so recipients see threads
 * before they have discovered the peer). Writes:
 *   users/{A}/threads/{B} and users/{B}/threads/{A}
 *
 * **Firebase Realtime Database rules:** the recipient path must allow the sender
 * to create/update `users/{recipientPubkey}/threads/{senderPubkey}` (e.g. a rule
 * keyed on wallet auth, or permissive rules for demos). If this write fails,
 * messages still save under `chats/{roomId}/messages`, but the peer will not see
 * the conversation in their list until they add your address or rules allow sync.
 */
export async function touchChatThreads(senderPk: string, recipientPk: string, roomId: string): Promise<void> {
  const ts = Date.now();
  const payload = { roomId, updatedAt: ts };
  const results = await Promise.allSettled([
    set(ref(db, `users/${senderPk}/threads/${recipientPk}`), payload),
    set(ref(db, `users/${recipientPk}/threads/${senderPk}`), payload),
  ]);
  const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  if (rejected.length > 0) {
    console.warn(
      "touchChatThreads: some writes failed (often RTDB rules on the recipient path).",
      rejected.map((r) => r.reason)
    );
  }
}
