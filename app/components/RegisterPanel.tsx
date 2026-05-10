"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useRegister } from "@/hooks/useRegister";

interface RegisterPanelProps {
  onRegistered: () => void;
}

const s = {
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "28px 32px" } as React.CSSProperties,
  label: { fontSize: 13, color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 12, fontWeight: 700 },
  mono: { fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 500 },
  btn: { width: "100%", padding: "18px 0", borderRadius: 14, border: "none", cursor: "pointer", fontSize: 16, fontWeight: 600, fontFamily: "'Inter', sans-serif", transition: "all 0.2s" } as React.CSSProperties,
  btnPrimary: { background: "#7c3aed", color: "white", boxShadow: "0 4px 12px rgba(124,58,237,0.2)" } as React.CSSProperties,
  btnDisabled: { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)", cursor: "not-allowed" } as React.CSSProperties,
  btnSecondary: { background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)", marginTop: 12 } as React.CSSProperties,
};

export default function RegisterPanel({ onRegistered }: RegisterPanelProps) {
  const { publicKey } = useWallet();
  const { register, status } = useRegister();

  const busy = status === "sending" || status === "confirming";
  const done = status === "done" || status === "already_registered";

  const handleRegister = async () => {
    if (busy || done) return;
    const finalStatus = await register();
    if (finalStatus === "done" || finalStatus === "already_registered") onRegistered();
  };

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 13, color: "#7c3aed", fontFamily: "'Space Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, fontWeight: 700 }}>Step 1 of 1</p>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 36, letterSpacing: "-0.03em", marginBottom: 12 }}>Join InvisiPhone</h2>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 17, lineHeight: 1.6 }}>Register your wallet on-chain once. Your contacts can then discover you privately — without revealing your full address book.</p>
      </div>

      {/* How it works */}
      <div style={{ ...s.card, marginBottom: 24 }}>
        <p style={s.label}>How private discovery works</p>
        {[
          ["01", "You register your wallet address on Solana"],
          ["02", "Your contacts run an encrypted comparison"],
          ["03", "Only matches are revealed — non-matches stay hidden"],
        ].map(([n, t]) => (
          <div key={n} style={{ display: "flex", gap: 16, padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ ...s.mono, color: "rgba(124,58,237,0.7)", flexShrink: 0 }}>{n}</span>
            <span style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, fontWeight: 500 }}>{t}</span>
          </div>
        ))}
      </div>

      {/* Wallet display */}
      {publicKey && (
        <div style={{ ...s.card, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={s.label}>Registering address</p>
            <p style={{ ...s.mono, color: "rgba(255,255,255,0.8)", fontSize: 16 }}>
              {publicKey.toString().slice(0, 14)}...{publicKey.toString().slice(-10)}
            </p>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
              <path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Status */}
      {status === "error" && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 20, fontSize: 15, color: "#fca5a5", fontWeight: 500 }}>
          Transaction failed. Check your wallet and try again.
        </div>
      )}
      {done && (
        <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 20, fontSize: 15, color: "#86efac", fontWeight: 500 }}>
          {status === "already_registered" ? "You're already registered." : "Registered successfully."}
        </div>
      )}

      <button
        onClick={done ? onRegistered : handleRegister}
        disabled={busy}
        style={{ ...s.btn, ...(busy ? s.btnDisabled : s.btnPrimary) }}
      >
        {busy ? (status === "sending" ? "Sending transaction..." : "Confirming...") : done ? "Continue to Discover →" : "Register on InvisiPhone"}
      </button>
    </div>
  );
}