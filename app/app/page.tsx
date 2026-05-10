"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import RegisterPanel from "@/components/RegisterPanel";
import DiscoverPanel from "@/components/DiscoverPanel";

type AppState = "loading" | "not_connected" | "not_registered" | "registered";

export default function Home() {
  const { publicKey } = useWallet();
  const [appState, setAppState] = useState<AppState>("loading");
  const [mounted, setMounted] = useState(false);

  const checkRegistration = useCallback(async () => {
    if (!publicKey) { setAppState("not_connected"); return; }
    try {
      const res = await fetch("/api/registered");
      if (!res.ok) { setAppState("not_registered"); return; }
      const { registeredWallets } = await res.json();
      const addr = publicKey.toString();
      setAppState(registeredWallets.includes(addr) ? "registered" : "not_registered");
    } catch {
      setAppState("not_registered");
    }
  }, [publicKey]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted) checkRegistration(); }, [mounted, publicKey, checkRegistration]);

  if (!mounted) return null;

  return (
    <main style={{ minHeight: "100vh", background: "#070710", color: "#fff", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(124,58,237,0.3); }
        .wallet-btn { background: rgba(124,58,237,0.15) !important; border: 1px solid rgba(124,58,237,0.4) !important; border-radius: 10px !important; font-family: 'DM Sans', sans-serif !important; font-size: 13px !important; font-weight: 500 !important; color: #c4b5fd !important; padding: 8px 16px !important; }
        .wallet-btn:hover { background: rgba(124,58,237,0.25) !important; }
        .grid-bg { background-image: linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px); background-size: 40px 40px; }
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 10, background: "rgba(7,7,16,0.8)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #7c3aed, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2.5" fill="white" />
              <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>InvisiPhone</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: 4, fontFamily: "'JetBrains Mono', monospace" }}>v0.1 · devnet</span>
        </div>
        <WalletMultiButton className="wallet-btn" />
      </nav>

      {/* Hero */}
      <div className="grid-bg" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "64px 24px 48px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 100, padding: "4px 12px", marginBottom: 24 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", display: "inline-block" }} />
          <span style={{ fontSize: 11, color: "#a78bfa", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}>POWERED BY ARCIUM MXE</span>
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(28px, 5vw, 48px)", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 16 }}>
          Private contact<br />
          <span style={{ color: "#7c3aed" }}>discovery</span> on Solana
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", maxWidth: 440, margin: "0 auto", fontSize: 15, lineHeight: 1.7 }}>
          Find which of your contacts are on InvisiPhone — without revealing your address book to anyone. Encrypted computation, zero knowledge.
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: "48px 24px", maxWidth: 520, margin: "0 auto" }}>
        {appState === "loading" && (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
            <div style={{ width: 20, height: 20, border: "2px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            Checking registration status...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        {appState === "not_connected" && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(124,58,237,0.8)" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Connect your wallet</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 24 }}>Your Solana wallet is your identity. No email or phone required.</p>
            <WalletMultiButton className="wallet-btn" />
          </div>
        )}
        {appState === "not_registered" && (
          <RegisterPanel onRegistered={() => setAppState("registered")} />
        )}
        {appState === "registered" && (
          <DiscoverPanel />
        )}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>
          Built on <a href="https://arcium.com" target="_blank" rel="noreferrer" style={{ color: "#7c3aed", textDecoration: "none" }}>Arcium</a> · Private Set Intersection · No plaintext ever leaves your browser
        </p>
      </footer>
    </main>
  );
}