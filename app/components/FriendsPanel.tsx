"use client";

import { useState, useEffect } from "react";
import { useFriends, shortAddr, Friend } from "@/hooks/useFriends";

function WalletAvatar({ address, size = 44 }: { address: string; size?: number }) {
    const hue = [...address].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
    return (
        <div style={{
            width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
            background: `hsl(${hue}, 35%, 13%)`, border: `1px solid hsl(${hue}, 40%, 22%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'JetBrains Mono', monospace", fontSize: size * 0.3, fontWeight: 500,
            color: `hsl(${hue}, 55%, 68%)`,
        }}>
            {address.slice(0, 2).toUpperCase()}
        </div>
    );
}

function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function FriendsPanel() {
    const { getFriends, removeFriend } = useFriends();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [copied, setCopied] = useState<string | null>(null);
    const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

    useEffect(() => {
        setFriends(getFriends().sort((a, b) => b.discoveredAt - a.discoveredAt));
    }, [getFriends]);

    const handleCopy = (wallet: string) => {
        navigator.clipboard.writeText(wallet);
        setCopied(wallet);
        setTimeout(() => setCopied(null), 1500);
    };

    const handleRemove = (wallet: string) => {
        removeFriend(wallet);
        setFriends(prev => prev.filter(f => f.wallet !== wallet));
        setConfirmRemove(null);
    };

    return (
        <div>
            <style>{`@keyframes fadeSlide { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }`}</style>

            <div style={{ marginBottom: 40, padding: "0 4px" }}>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 36, letterSpacing: "-0.03em", marginBottom: 12 }}>
                    Your friends
                </h2>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 17, lineHeight: 1.6 }}>
                    Contacts you have discovered on InvisiPhone. Stored locally, only visible to you.
                </p>
            </div>

            {friends.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 32px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(124,58,237,0.7)" strokeWidth="1.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <p style={{ fontSize: 18, color: "rgba(255,255,255,0.45)", marginBottom: 8, fontWeight: 500 }}>No friends saved yet</p>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.2)", fontFamily: "'Space Mono', monospace" }}>
                        Run a discovery and save matched contacts
                    </p>
                </div>
            ) : (
                <>
                    {/* Count bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                        <div style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 100, padding: "4px 14px" }}>
                            <span style={{ fontSize: 13, color: "#a78bfa", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{friends.length} friend{friends.length !== 1 ? "s" : ""}</span>
                        </div>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", fontWeight: 500 }}>· stored locally</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {friends.map((friend, i) => (
                            <div key={friend.wallet} style={{
                                background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14,
                                animation: `fadeSlide ${0.2 + i * 0.05}s ease`, position: "relative",
                            }}>
                                <WalletAvatar address={friend.wallet} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 3 }}>{friend.nickname}</p>
                                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                                        {shortAddr(friend.wallet)}
                                    </p>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>
                                        {timeAgo(friend.discoveredAt)}
                                    </span>
                                    <button
                                        onClick={() => handleCopy(friend.wallet)}
                                        title="Copy address"
                                        style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 9px", color: copied === friend.wallet ? "#4ade80" : "rgba(255,255,255,0.35)", fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", transition: "color 0.2s" }}
                                    >
                                        {copied === friend.wallet ? "✓" : "copy"}
                                    </button>
                                    {confirmRemove === friend.wallet ? (
                                        <>
                                            <button onClick={() => handleRemove(friend.wallet)} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "5px 9px", color: "#f87171", fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" }}>remove</button>
                                            <button onClick={() => setConfirmRemove(null)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 9px", color: "rgba(255,255,255,0.3)", fontSize: 11, cursor: "pointer" }}>×</button>
                                        </>
                                    ) : (
                                        <button onClick={() => setConfirmRemove(friend.wallet)} title="Remove" style={{ background: "none", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "5px 8px", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", lineHeight: 1 }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", marginTop: 20, textAlign: "center", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
                        Friends are stored in your browser only.<br />Clearing browser data will remove them.
                    </p>
                </>
            )}
        </div>
    );
}