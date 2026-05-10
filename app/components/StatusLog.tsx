"use client";

import { DiscoveryStep } from "@/hooks/useContactDiscovery";

const STEPS: { key: DiscoveryStep; label: string; detail: string }[] = [
  { key: "fetching_registered", label: "Fetching registered users", detail: "Reading on-chain registry — no private data exposed" },
  { key: "encrypting_contacts", label: "Encrypting your contacts locally", detail: "Private key generated in your browser. Never transmitted." },
  { key: "sending_transaction", label: "Submitting to Solana", detail: "Only encrypted ciphertexts hit the chain — no plaintext" },
  { key: "waiting_arcium", label: "Arcium MXE computing privately", detail: "Arx nodes compare encrypted sets. No single node sees your contacts." },
  { key: "decrypting", label: "Decrypting result with your key", detail: "Only you can read this. Not Solana. Not Arcium." },
  { key: "done", label: "Complete", detail: "The platform learned nothing about your non-matching contacts" },
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
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Privacy log</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {STEPS.map(s => {
            const status = getStatus(s.key, step);
            return (
              <div key={s.key} style={{ display: "flex", gap: 14, alignItems: "flex-start", animation: status === "active" ? "fadeIn 0.3s ease" : undefined }}>
                {/* Indicator */}
                <div style={{ flexShrink: 0, width: 18, paddingTop: 2, display: "flex", justifyContent: "center" }}>
                  {status === "done" && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.4)" strokeWidth="0.8" />
                      <path d="M4 7l2 2 4-4" stroke="#4ade80" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {status === "active" && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", marginTop: 3, animation: "pulse-dot 1.2s ease infinite" }} />
                  )}
                  {status === "waiting" && (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", marginTop: 4 }} />
                  )}
                </div>
                <div>
                  <p style={{
                    fontSize: 14, fontWeight: 500, lineHeight: 1.4, marginBottom: status !== "waiting" ? 3 : 0,
                    color: status === "done" ? "rgba(255,255,255,0.4)" : status === "active" ? "white" : "rgba(255,255,255,0.18)"
                  }}>{s.label}</p>
                  {status !== "waiting" && (
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", lineHeight: 1.5, fontFamily: "'JetBrains Mono', monospace" }}>{s.detail}</p>
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