"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useRegister } from "@/hooks/useRegister";

interface RegisterPanelProps {
  onRegistered: () => void;
}

const s = {
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 24px" } as React.CSSProperties,
  label: { fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 8 },
  mono: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13 },
  btn: { width: "100%", padding: "14px 0", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" } as React.CSSProperties,
  btnPrimary: { background: "#7c3aed", color: "white" } as React.CSSProperties,
  btnDisabled: { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)", cursor: "not-allowed" } as React.CSSProperties,
  btnSecondary: { background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)", marginTop: 10 } as React.CSSProperties,
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
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, color: "#7c3aed", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Step 1 of 1</p>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-0.02em", marginBottom: 10 }}>Join InvisiPhone</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.7 }}>Register your wallet on-chain once. Your contacts can then discover you privately — without either of you revealing your full address book.</p>
      </div>

      {/* How it works */}
      <div style={{ ...s.card, marginBottom: 20 }}>
        <p style={s.label}>How private discovery works</p>
        {[
          ["01", "You register your wallet address on Solana"],
          ["02", "Your contacts run an encrypted comparison"],
          ["03", "Only matches are revealed — non-matches stay hidden"],
        ].map(([n, t]) => (
          <div key={n} style={{ display: "flex", gap: 14, padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ ...s.mono, color: "rgba(124,58,237,0.6)", flexShrink: 0, marginTop: 1 }}>{n}</span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{t}</span>
          </div>
        ))}
      </div>

      {/* Wallet display */}
      {publicKey && (
        <div style={{ ...s.card, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={s.label}>Registering address</p>
            <p style={{ ...s.mono, color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
              {publicKey.toString().slice(0, 12)}...{publicKey.toString().slice(-8)}
            </p>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
              <path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Status */}
      {status === "error" && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#fca5a5" }}>
          Transaction failed. Check your wallet and try again.
        </div>
      )}
      {done && (
        <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#86efac" }}>
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