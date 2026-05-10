"use client";

import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export interface Friend {
    wallet: string;
    nickname: string;
    discoveredAt: number; // timestamp
}

function storageKey(ownerWallet: string) {
    return `invisiphone:friends:${ownerWallet}`;
}

export function useFriends() {
    const { publicKey } = useWallet();

    const getFriends = useCallback((): Friend[] => {
        if (!publicKey || typeof window === "undefined") return [];
        try {
            const raw = localStorage.getItem(storageKey(publicKey.toString()));
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }, [publicKey]);

    const saveFriend = useCallback((wallet: string, nickname: string) => {
        if (!publicKey || typeof window === "undefined") return;
        const key = storageKey(publicKey.toString());
        const existing = (() => {
            try { return JSON.parse(localStorage.getItem(key) || "[]") as Friend[]; }
            catch { return [] as Friend[]; }
        })();
        // Upsert — update nickname if wallet already saved
        const filtered = existing.filter(f => f.wallet !== wallet);
        const updated: Friend[] = [...filtered, { wallet, nickname: nickname.trim() || shortAddr(wallet), discoveredAt: Date.now() }];
        localStorage.setItem(key, JSON.stringify(updated));
    }, [publicKey]);

    const removeFriend = useCallback((wallet: string) => {
        if (!publicKey || typeof window === "undefined") return;
        const key = storageKey(publicKey.toString());
        const existing = (() => {
            try { return JSON.parse(localStorage.getItem(key) || "[]") as Friend[]; }
            catch { return [] as Friend[]; }
        })();
        localStorage.setItem(key, JSON.stringify(existing.filter(f => f.wallet !== wallet)));
    }, [publicKey]);

    const isAlreadySaved = useCallback((wallet: string): boolean => {
        return getFriends().some(f => f.wallet === wallet);
    }, [getFriends]);

    return { getFriends, saveFriend, removeFriend, isAlreadySaved };
}

export function shortAddr(a: string) {
    return `${a.slice(0, 6)}...${a.slice(-6)}`;
}