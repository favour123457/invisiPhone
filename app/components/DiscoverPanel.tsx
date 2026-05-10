"use client";

import { useState } from "react";
import { useContactDiscovery } from "@/hooks/useContactDiscovery";
import StatusLog from "./StatusLog";
import MatchResults from "./MatchResults";
import NicknameModal from "./NicknameModal";

interface DiscoverPanelProps {
  onFriendsSaved?: () => void;
}

function parseWallets(input: string): string[] {
  return input.split(/[\n,\s]+/).map(w => w.trim()).filter(w => w.length > 30);
}

export default function DiscoverPanel({ onFriendsSaved }: DiscoverPanelProps) {
  const [input, setInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { discover, step, result, error } = useContactDiscovery();
  const wallets = parseWallets(input);

  const isRunning = ["generating_keypair", "fetching_registered", "encrypting_contacts",
    "encrypting_registered", "sending_transaction", "waiting_arcium", "decrypting"].includes(step);

  const handleModalDone = () => {
    setShowModal(false);
    onFriendsSaved?.();
  };

  const handleReset = () => { setInput(""); window.location.reload(); };

  if (isRunning || step === "done") {
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 36, letterSpacing: "-0.03em", marginBottom: 10 }}>Running discovery</h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 17, lineHeight: 1.6 }}>
            Comparing {Math.min(wallets.length, 3)} contact{wallets.length !== 1 ? "s" : ""} privately via Arcium
          </p>
        </div>

        <StatusLog step={step} />

        {result && step === "done" && (
          <>
            <MatchResults result={result} onSaveFriends={() => setShowModal(true)} />
            <button onClick={handleReset} style={{ marginTop: 16, width: "100%", padding: "14px 0", borderRadius: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>
              Search again
            </button>
          </>
        )}

        {/* Nickname modal — fires after results shown */}
        {showModal && result && result.matchedWallets.length > 0 && (
          <NicknameModal wallets={result.matchedWallets} onDone={handleModalDone} />
        )}
      </div>
    );
  }

  return (
    <div style={{ animation: "revealUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
      <div style={{ marginBottom: 44 }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 40, letterSpacing: "-0.03em", marginBottom: 12 }}>Discover contacts</h2>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 18, lineHeight: 1.6 }}>
          Paste Solana wallet addresses below. We&apos;ll find which ones are on InvisiPhone — without the platform ever seeing your full list.
        </p>
      </div>

      {/* Input */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>Wallet addresses</span>
          {wallets.length > 0 && (
            <span style={{ fontSize: 13, color: "#7c3aed", fontFamily: "'Space Mono', monospace", fontWeight: 700, animation: "fadeIn 0.3s ease" }}>{wallets.length} detected</span>
          )}
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={"7xKqMvuKSQunimR5HzzMmrb7VPWh4mBwxmXwa3...\n9mPzF5qMvuKSQunimR5HzzMmrb7VPWh4mBwx..."}
          rows={6}
          style={{
            width: "100%", borderRadius: 20, background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 15,
            fontFamily: "'Space Mono', monospace", padding: "20px 24px",
            resize: "none", outline: "none", lineHeight: 1.7, transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.5)"; e.target.style.background = "rgba(124,58,237,0.02)"; }}
          onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.03)"; }}
        />
        {wallets.length > 3 && (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", marginTop: 10, fontFamily: "'Space Mono', monospace" }}>
            First 3 will be checked (circuit limit)
          </p>
        )}
      </div>

      {/* Privacy notice */}
      <div style={{ background: "rgba(124,58,237,0.03)", border: "1px solid rgba(124,58,237,0.1)", borderRadius: 20, padding: "20px 24px", marginBottom: 32, display: "flex", gap: 16, alignItems: "flex-start" }}>
        <svg style={{ flexShrink: 0, marginTop: 4 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
          Contacts are encrypted in this browser. Arcium MXE computes the match without seeing plaintext. Only you decrypt the result.
        </p>
      </div>

      {step === "error" && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: "16px 20px", marginBottom: 24, fontSize: 16, color: "#fca5a5", fontWeight: 500 }}>
          {error || "Something went wrong. Try again."}
        </div>
      )}

      <button
        onClick={() => discover(wallets)}
        disabled={wallets.length === 0}
        className={wallets.length > 0 ? "animated-btn" : ""}
        style={{
          width: "100%", padding: "20px 0", borderRadius: 16, border: "none",
          background: wallets.length === 0 ? "rgba(255,255,255,0.05)" : "#7c3aed",
          color: wallets.length === 0 ? "rgba(255,255,255,0.25)" : "white",
          fontSize: 17, fontWeight: 700, fontFamily: "'Inter', sans-serif",
          cursor: wallets.length === 0 ? "not-allowed" : "pointer", transition: "all 0.3s",
        }}
      >
        {wallets.length === 0 ? "Paste addresses to start" : "Find matches privately"}
      </button>
    </div>
  );
}