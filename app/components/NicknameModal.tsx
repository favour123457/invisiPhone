"use client";

import { useState, useEffect } from "react";
import { useFriends, shortAddr } from "@/hooks/useFriends";

interface NicknameModalProps {
    wallets: string[];       // matched wallets to name
    onDone: () => void;      // called when all named (or skipped)
}

function WalletAvatar({ address, size = 52 }: { address: string; size?: number }) {
    const hue = [...address].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
    return (
        <div style={{
            width: size, height: size, borderRadius: size * 0.3, flexShrink: 0,
            background: `hsl(${hue}, 35%, 14%)`, border: `1px solid hsl(${hue}, 40%, 24%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'JetBrains Mono', monospace", fontSize: size * 0.28, fontWeight: 500,
            color: `hsl(${hue}, 55%, 68%)`,
        }}>
            {address.slice(0, 2).toUpperCase()}
        </div>
    );
}

export default function NicknameModal({ wallets, onDone }: NicknameModalProps) {
    const { saveFriend, isAlreadySaved } = useFriends();
    const [index, setIndex] = useState(0);
    const [name, setName] = useState("");
    const [saved, setSaved] = useState(false);

    // Skip wallets already saved
    const pending = wallets.filter(w => !isAlreadySaved(w));

    useEffect(() => {
        if (pending.length === 0) onDone();
    }, [pending.length, onDone]);

    if (pending.length === 0) return null;

    const current = pending[index];
    if (!current) { onDone(); return null; }

    const handleSave = () => {
        saveFriend(current, name);
        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            setName("");
            if (index + 1 >= pending.length) onDone();
            else setIndex(i => i + 1);
        }, 700);
    };

    const handleSkip = () => {
        setName("");
        if (index + 1 >= pending.length) onDone();
        else setIndex(i => i + 1);
    };

    return (
        <>
            <style>{`
        @keyframes modalIn { from { opacity:0; transform: scale(0.96) translateY(8px); } to { opacity:1; transform: scale(1) translateY(0); } }
        @keyframes checkPop { 0% { transform:scale(0); } 60% { transform:scale(1.2); } 100% { transform:scale(1); } }
      `}</style>

            {/* Backdrop */}
            <div style={{
                position: "fixed", inset: 0, background: "rgba(7,7,16,0.85)", backdropFilter: "blur(8px)",
                zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
            }}>
                {/* Modal */}
                <div style={{
                    width: "100%", maxWidth: 400, background: "#0f0f1a", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 20, padding: 28, animation: "modalIn 0.25s ease",
                }}>
                    {/* Progress dots */}
                    {pending.length > 1 && (
                        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 24 }}>
                            {pending.map((_, i) => (
                                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i <= index ? "#ea580c" : "rgba(255,255,255,0.1)", transition: "background 0.3s" }} />
                            ))}
                        </div>
                    )}

                    {/* Avatar + address */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
                        {saved ? (
                            <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", animation: "checkPop 0.4s ease" }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            </div>
                        ) : (
                            <WalletAvatar address={current} />
                        )}
                        <p style={{ marginTop: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                            {shortAddr(current)}
                        </p>
                    </div>

                    {!saved && (
                        <>
                            <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 24, textAlign: "center", marginBottom: 8, letterSpacing: "-0.02em" }}>
                                Save this contact?
                            </p>
                            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", textAlign: "center", marginBottom: 28, lineHeight: 1.6 }}>
                                Give them a nickname so you&apos;ll recognise them later.
                            </p>

                            <input
                                autoFocus
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && name.trim()) handleSave(); if (e.key === "Escape") handleSkip(); }}
                                placeholder="e.g. Alice, Bob, CryptoFriend..."
                                maxLength={32}
                                style={{
                                    width: "100%", padding: "14px 18px", borderRadius: 14, marginBottom: 14,
                                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                                    color: "white", fontSize: 16, fontFamily: "'Inter', sans-serif", outline: "none",
                                }}
                                onFocus={e => { e.target.style.borderColor = "rgba(234,88,12,0.5)"; }}
                                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                            />

                            <button
                                onClick={handleSave}
                                disabled={!name.trim()}
                                style={{
                                    width: "100%", padding: "16px 0", borderRadius: 14, border: "none",
                                    background: name.trim() ? "#ea580c" : "rgba(255,255,255,0.06)",
                                    color: name.trim() ? "white" : "rgba(255,255,255,0.25)",
                                    fontSize: 16, fontWeight: 700, fontFamily: "'Inter', sans-serif",
                                    cursor: name.trim() ? "pointer" : "not-allowed", marginBottom: 12, transition: "all 0.2s",
                                    boxShadow: name.trim() ? "0 4px 12px rgba(234,88,12,0.25)" : "none",
                                }}
                            >
                                Save friend
                            </button>

                            <button
                                onClick={handleSkip}
                                style={{
                                    width: "100%", padding: "14px 0", borderRadius: 14,
                                    background: "transparent", border: "1px solid rgba(255,255,255,0.07)",
                                    color: "rgba(255,255,255,0.35)", fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", cursor: "pointer",
                                }}
                            >
                                {index + 1 >= pending.length ? "Skip, I'm done" : "Skip this one →"}
                            </button>
                        </>
                    )}

                    {saved && (
                        <p style={{ textAlign: "center", color: "#4ade80", fontSize: 14, fontWeight: 500 }}>
                            Saved as &quot;{name}&quot; ✓
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}