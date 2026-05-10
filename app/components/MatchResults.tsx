"use client";

import { DiscoveryResult } from "@/hooks/useContactDiscovery";

interface MatchResultsProps { result: DiscoveryResult; }

function WalletAvatar({ address }: { address: string }) {
  const initials = address.slice(0, 2).toUpperCase();
  const hue = [...address].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
      background: `hsl(${hue}, 40%, 15%)`, border: `1px solid hsl(${hue}, 40%, 25%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 500,
      color: `hsl(${hue}, 60%, 70%)`,
    }}>{initials}</div>
  );
}

function shortAddr(a: string) { return `${a.slice(0, 6)}...${a.slice(-6)}`; }

export default function MatchResults({ result }: MatchResultsProps) {
  const { matchedWallets, totalContacts, totalMatches } = result;
  return (
    <>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={{ animation: "slideUp 0.4s ease" }}>
        {/* Summary */}
        <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 16, padding: "20px 24px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32, letterSpacing: "-0.03em", lineHeight: 1 }}>{totalMatches}</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                match{totalMatches !== 1 ? "es" : ""} from {totalContacts} checked
              </p>
            </div>
            <div style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 100, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span style={{ fontSize: 11, color: "#a78bfa", fontFamily: "'JetBrains Mono', monospace" }}>PRIVATE</span>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>REVEALED TO YOU</p>
              <p style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: "#4ade80" }}>{totalMatches}</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>HIDDEN FROM PLATFORM</p>
              <p style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: "rgba(255,255,255,0.4)" }}>{totalContacts - totalMatches}</p>
            </div>
          </div>
        </div>

        {/* Matched wallets */}
        {totalMatches > 0 ? (
          <div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Contacts on InvisiPhone</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {matchedWallets.map((wallet, i) => (
                <div key={wallet} style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14,
                  padding: "14px 16px", display: "flex", alignItems: "center", gap: 14,
                  animation: `slideUp ${0.3 + i * 0.1}s ease`,
                }}>
                  <WalletAvatar address={wallet} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.85)", marginBottom: 2 }}>
                      {shortAddr(wallet)}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>on InvisiPhone · Solana</p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(wallet)}
                    style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 10px", color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}
                  >
                    copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "24px", textAlign: "center" }}>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>No matches found</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>
              The platform learned nothing about who you searched for
            </p>
          </div>
        )}
      </div>
    </>
  );
}