import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ref, onValue, set, remove, get } from "firebase/database";
import { db } from "@/lib/firebase";

export interface Friend {
    wallet: string;
    nickname: string;
    discoveredAt: number;
}

export function useFriends() {
    const { publicKey } = useWallet();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);

    // Sync from Firebase
    useEffect(() => {
        if (!publicKey) {
            setFriends([]);
            setLoading(false);
            return;
        }

        const friendsRef = ref(db, `users/${publicKey.toString()}/friends`);
        const unsubscribe = onValue(friendsRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                setFriends([]);
            } else {
                const list: Friend[] = Object.entries(data).map(([wallet, val]: any) => ({
                    wallet,
                    nickname: val.nickname,
                    discoveredAt: val.discoveredAt,
                }));
                setFriends(list);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [publicKey]);

    const saveFriend = useCallback(async (wallet: string, nickname: string) => {
        if (!publicKey) return;
        const friendsRef = ref(db, `users/${publicKey.toString()}/friends/${wallet}`);
        await set(friendsRef, {
            nickname: nickname.trim() || shortAddr(wallet),
            discoveredAt: Date.now(),
        });
    }, [publicKey]);

    const removeFriend = useCallback(async (wallet: string) => {
        if (!publicKey) return;
        const friendsRef = ref(db, `users/${publicKey.toString()}/friends/${wallet}`);
        await remove(friendsRef);
    }, [publicKey]);

    const isAlreadySaved = useCallback((wallet: string): boolean => {
        return friends.some(f => f.wallet === wallet);
    }, [friends]);

    return { friends, loading, saveFriend, removeFriend, isAlreadySaved };
}

export function shortAddr(a: string) {
    if (!a) return "";
    return `${a.slice(0, 6)}...${a.slice(-6)}`;
}