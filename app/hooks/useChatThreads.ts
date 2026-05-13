"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

/** Peers with whom this wallet has an indexed chat thread (incoming or outgoing). */
export function useChatThreads() {
  const { publicKey } = useWallet();
  const [inboxPeers, setInboxPeers] = useState<string[]>([]);

  useEffect(() => {
    if (!publicKey) {
      setInboxPeers([]);
      return;
    }

    const threadsRef = ref(db, `users/${publicKey.toString()}/threads`);
    const unsub = onValue(threadsRef, (snap) => {
      const v = snap.val() as Record<string, { updatedAt?: number }> | null;
      if (!v) {
        setInboxPeers([]);
        return;
      }
      const rows = Object.entries(v).map(([peerWallet, data]) => ({
        peerWallet,
        updatedAt: Number(data?.updatedAt ?? 0),
      }));
      rows.sort((a, b) => b.updatedAt - a.updatedAt);
      setInboxPeers(rows.map((r) => r.peerWallet));
    });

    return () => unsub();
  }, [publicKey]);

  return { inboxPeers };
}
