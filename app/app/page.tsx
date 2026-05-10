"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import RegisterPanel from "@/components/RegisterPanel";
import DiscoverPanel from "@/components/DiscoverPanel";
import FriendsPanel from "@/components/FriendsPanel";
import { useFriends } from "@/hooks/useFriends";

type AppState = "loading" | "not_connected" | "not_registered" | "app";
type Tab = "discover" | "friends";

export default function Home() {
  const { publicKey } = useWallet();
  const { getFriends } = useFriends();
  const [appState, setAppState] = useState<AppState>("loading");
  const [tab, setTab] = useState<Tab>("discover");
  const [mounted, setMounted] = useState(false);
  const [friendCount, setFriendCount] = useState(0);

  const checkRegistration = useCallback(async () => {
    if (!publicKey) { setAppState("not_connected"); return; }
    try {
      const res = await fetch("/api/registered");
      if (!res.ok) { setAppState("not_registered"); return; }
      const { registeredWallets } = await res.json();
      setAppState(registeredWallets.includes(publicKey.toString()) ? "app" : "not_registered");
    } catch {
      setAppState("not_registered");
    }
  }, [publicKey]);

  const refreshFriendCount = useCallback(() => {
    setFriendCount(getFriends().length);
  }, [getFriends]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted) { checkRegistration(); refreshFriendCount(); } }, [mounted, publicKey, checkRegistration, refreshFriendCount]);

  if (!mounted) return null;

  return (
    <main style={{ minHeight: "100vh", background: "#070710", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700;800&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(124,58,237,0.3); }
        .wallet-btn { background: rgba(124,58,237,0.15) !important; border: 1px solid rgba(124,58,237,0.4) !important; border-radius: 12px !important; font-family: 'Inter', sans-serif !important; font-size: 14px !important; font-weight: 500 !important; color: #c4b5fd !important; padding: 10px 20px !important; transition: all 0.2s !important; }
        .wallet-btn:hover { background: rgba(124,58,237,0.25) !important; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(124,58,237,0.2) !important; }
        .grid-bg { background-image: linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px); background-size: 40px 40px; }
        
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes revealUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gradientFlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        .gradient-text { 
            background: linear-gradient(90deg, #7c3aed, #a78bfa, #6366f1, #7c3aed); 
            background-size: 300% auto; 
            -webkit-background-clip: text; 
            -webkit-text-fill-color: transparent; 
            animation: gradientFlow 6s linear infinite; 
        }
        
        .animated-btn {
            position: relative;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animated-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,58,237,0.3); }
        .animated-btn:active { transform: translateY(0); }
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10, background: "rgba(7,7,16,0.8)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2.5" fill="white" />
              <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
          </div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em" }}>InvisiPhone</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", marginLeft: 4, fontFamily: "'Space Mono', monospace" }}>v0.1</span>
        </div>
        <WalletMultiButton className="wallet-btn" />
      </nav>

      {/* Hero — only shown when not in app state */}
      {appState !== "app" && (
        <div className="grid-bg" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "100px 24px 80px", textAlign: "center", animation: "revealUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 100, padding: "8px 16px", marginBottom: 32, animation: "fadeIn 1s ease" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", display: "inline-block", boxShadow: "0 0 12px #7c3aed" }} />
            <span style={{ fontSize: 13, color: "#a78bfa", fontFamily: "'Space Mono', monospace", letterSpacing: "0.1em", fontWeight: 700 }}>POWERED BY ARCIUM MXE</span>
          </div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "clamp(40px, 7vw, 72px)", lineHeight: 0.95, letterSpacing: "-0.04em", marginBottom: 24 }}>
            Private contact<br /><span className="gradient-text">discovery</span> on Solana
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", maxWidth: 560, margin: "0 auto", fontSize: 20, lineHeight: 1.6, fontWeight: 400, animation: "fadeIn 1.2s ease" }}>
            Find which of your contacts are on InvisiPhone — without revealing your address book to anyone. Encrypted computation, zero knowledge.
          </p>
        </div>
      )}

      {/* App tabs — only shown when registered */}
      {appState === "app" && (
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", display: "flex", gap: 8 }}>
          {([["discover", "Discover"], ["friends", `Friends${friendCount > 0 ? ` · ${friendCount}` : ""}`]] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "20px 24px", background: "none", border: "none", cursor: "pointer",
              fontSize: 16, fontWeight: 600, fontFamily: "'Inter', sans-serif",
              color: tab === t ? "white" : "rgba(255,255,255,0.3)",
              borderBottom: tab === t ? "3px solid #7c3aed" : "3px solid transparent",
              transition: "all 0.2s", marginBottom: -1,
            }}>{label}</button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "64px 24px", maxWidth: 600, margin: "0 auto", animation: "fadeIn 0.4s ease" }}>
        {appState === "loading" && (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 16, fontWeight: 500 }}>
            <div style={{ width: 24, height: 24, border: "2px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
            Checking status...
          </div>
        )}

        {appState === "not_connected" && (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(124,58,237,0.9)" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="3" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 28, marginBottom: 12, letterSpacing: "-0.02em" }}>Connect your wallet</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 17, marginBottom: 32, lineHeight: 1.6 }}>Your Solana wallet is your identity.<br />No email or phone required.</p>
            <WalletMultiButton className="wallet-btn" />
          </div>
        )}

        {appState === "not_registered" && (
          <RegisterPanel onRegistered={() => { setAppState("app"); refreshFriendCount(); }} />
        )}

        {appState === "app" && tab === "discover" && (
          <DiscoverPanel onFriendsSaved={refreshFriendCount} />
        )}

        {appState === "app" && tab === "friends" && (
          <FriendsPanel />
        )}
      </div>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.15)", fontFamily: "'Space Mono', monospace", letterSpacing: "0.02em" }}>
          Built on <a href="https://arcium.com" target="_blank" rel="noreferrer" style={{ color: "#7c3aed", textDecoration: "none", fontWeight: 700 }}>Arcium</a> · Private Set Intersection · No plaintext leaves your browser
        </p>
      </footer>
    </main>
  );
}