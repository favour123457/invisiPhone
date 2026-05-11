"use client";

import { DiscoveryStep } from "@/hooks/useContactDiscovery";

const STEPS: { key: DiscoveryStep; label: string; detail: string }[] = [
  { key: "fetching_registered", label: "Fetching registered users", detail: "Reading on-chain registry. No private data exposed." },
  { key: "encrypting_contacts", label: "Encrypting your contacts locally", detail: "Private key generated in your browser. Never transmitted." },
  { key: "sending_transaction", label: "Submitting to Solana", detail: "Only encrypted ciphertexts hit the chain. No plaintext." },
  { key: "waiting_arcium", label: "Arcium MXE computing privately", detail: "Arx nodes compare encrypted sets. No single node sees your contacts." },
  { key: "decrypting", label: "Decrypting result with your key", detail: "Only you can read this. Not Solana. Not Arcium." },
  { key: "done", label: "Complete", detail: "The platform learned nothing about your non-matching contacts." },
];

function getStatus(key: DiscoveryStep, current: DiscoveryStep): "done" | "active" | "waiting" {
  const order = STEPS.map(s => s.key);
  const ki = order.indexOf(key), ci = order.indexOf(current);
  if (current === "idle" || current === "error") return "waiting";
  if (ki < ci) return "done";
  if (ki === ci) return "active";
  return "waiting";
}

export default function StatusLog({ step }: { step: DiscoveryStep }) {
  if (step === "idle") return null;
  return (
    <>
      <style>{`
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes fadeIn { from { opacity:0; transform: translateY(4px); } to { opacity:1; transform: translateY(0); } }
      `}</style>
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24,
        padding: "32px 40px",
        marginBottom: 32,
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Shimmer effect */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.02), transparent)",
          backgroundSize: "200% 100%",
          animation: "shimmer 4s infinite linear",
          pointerEvents: "none"
        }} />

        <p style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.25)",
          fontFamily: "'Space Mono', monospace",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 32,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed" }} />
          Privacy log
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {STEPS.map((s, i) => {
            const status = getStatus(s.key, step);
            return (
              <div key={s.key} style={{
                display: "flex",
                gap: 20,
                alignItems: "flex-start",
                animation: `revealUp 0.5s cubic-bezier(0, 0.4, 0.2, 1) forwards`,
                opacity: 0,
                animationDelay: `${i * 0.1}s`
              }}>
                {/* Indicator */}
                <div style={{ flexShrink: 0, width: 24, paddingTop: 4, display: "flex", justifyContent: "center" }}>
                  {status === "done" && (
                    <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" fill="rgba(34,197,94,0.1)" stroke="rgba(34,197,94,0.4)" strokeWidth="0.8" />
                      <path d="M4 7l2 2 4-4" stroke="#4ade80" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {status === "active" && (
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#7c3aed", marginTop: 3, animation: "pulse-dot 1s ease infinite", boxShadow: "0 0 12px rgba(124,58,237,0.6)" }} />
                  )}
                  {status === "waiting" && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", marginTop: 5 }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: 17, fontWeight: 600, lineHeight: 1.4, marginBottom: status !== "waiting" ? 6 : 0,
                    color: status === "done" ? "rgba(255,255,255,0.4)" : status === "active" ? "white" : "rgba(255,255,255,0.15)",
                    transition: "color 0.3s ease"
                  }}>{s.label}</p>
                  {status !== "waiting" && (
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 1.6, fontFamily: "'Space Mono', monospace" }}>{s.detail}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}