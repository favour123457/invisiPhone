"use client";

import { DiscoveryResult } from "@/hooks/useContactDiscovery";
import { useFriends, shortAddr } from "@/hooks/useFriends";

interface MatchResultsProps {
  result: DiscoveryResult;
  onSaveFriends?: () => void;
}

function WalletAvatar({ address, size = 40 }: { address: string; size?: number }) {
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

export default function MatchResults({ result, onSaveFriends }: MatchResultsProps) {
  const { totalMatches, totalContacts, matchedWallets } = result;
  const { isAlreadySaved } = useFriends();
  const unsaved = matchedWallets.filter(w => !isAlreadySaved(w));

  return (
    <>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={{ animation: "slideUp 0.35s ease" }}>

        {/* Summary card */}
        <div style={{
          background: "rgba(234,88,12,0.08)",
          border: "1px solid rgba(234,88,12,0.25)",
          borderRadius: 24,
          padding: "32px 40px",
          marginBottom: 24,
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Subtle shimmer overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)",
            backgroundSize: "200% 100%",
            animation: "shimmer 3s infinite linear",
            pointerEvents: "none"
          }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, position: "relative" }}>
            <div>
              <p className="gradient-text" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 64, letterSpacing: "-0.04em", lineHeight: 1 }}>{totalMatches}</p>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", marginTop: 8, fontWeight: 500 }}>
                match{totalMatches !== 1 ? "es" : ""} from {totalContacts} checked
              </p>
            </div>
            <div style={{ background: "rgba(234,88,12,0.15)", border: "1px solid rgba(234,88,12,0.35)", borderRadius: 100, padding: "8px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 12px rgba(234,88,12,0.2)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <span style={{ fontSize: 13, color: "#fb923c", fontFamily: "'Space Mono', monospace", fontWeight: 700, letterSpacing: "0.05em" }}>PRIVATE DISCOVERY</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, position: "relative" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px 24px", transition: "transform 0.3s ease" }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 8, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>REVEALED TO YOU</p>
              <p style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: "#4ade80", textShadow: "0 0 12px rgba(74,222,128,0.3)" }}>{totalMatches}</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px 24px" }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 8, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>HIDDEN FROM PLATFORM</p>
              <p style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: "rgba(255,255,255,0.35)" }}>{totalContacts - totalMatches}</p>
            </div>
          </div>
        </div>

        {/* Matched wallets */}
        {totalMatches > 0 ? (
          <div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
              Contacts on InvisiPhone
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {matchedWallets.map((wallet, i) => (
                <div key={wallet} style={{
                  background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14,
                  animation: `slideUp ${0.3 + i * 0.08}s ease`,
                }}>
                  <WalletAvatar address={wallet} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 2 }}>
                      {shortAddr(wallet)}
                    </p>
                    <p style={{ fontSize: 11, color: isAlreadySaved(wallet) ? "#4ade80" : "rgba(255,255,255,0.25)" }}>
                      {isAlreadySaved(wallet) ? "already saved" : "on InvisiPhone"}
                    </p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(wallet)}
                    style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 10px", color: "rgba(255,255,255,0.35)", fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}
                  >
                    copy
                  </button>
                </div>
              ))}
            </div>

            {/* Save friends CTA — only if there are unsaved matches */}
            {unsaved.length > 0 && onSaveFriends && (
              <button
                onClick={onSaveFriends}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                  background: "rgba(234,88,12,0.2)", color: "#fdba74",
                  fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Save {unsaved.length} friend{unsaved.length !== 1 ? "s" : ""} with nickname
              </button>
            )}
          </div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "28px", textAlign: "center" }}>
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