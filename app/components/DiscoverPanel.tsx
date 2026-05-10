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
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-0.02em", marginBottom: 8 }}>Running discovery</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
            Comparing {Math.min(wallets.length, 3)} contact{wallets.length !== 1 ? "s" : ""} privately via Arcium MXE
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
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-0.02em", marginBottom: 10 }}>Discover contacts</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.7 }}>
          Paste Solana wallet addresses below. We&apos;ll find which ones are on InvisiPhone — without the platform ever seeing your full list.
        </p>
      </div>

      {/* Input */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>Wallet addresses</span>
          {wallets.length > 0 && (
            <span style={{ fontSize: 12, color: "#7c3aed", fontFamily: "'JetBrains Mono', monospace" }}>{wallets.length} detected</span>
          )}
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={"7xKqMvuKSQunimR5HzzMmrb7VPWh4mBwxmXwa3...\n9mPzF5qMvuKSQunimR5HzzMmrb7VPWh4mBwx...\nAkLpBwxmXwa3Gfz7xFpF5qMvuKSQunimR5Hzz..."}
          rows={6}
          style={{
            width: "100%", borderRadius: 12, background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)", color: "white", fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace", padding: "14px 16px",
            resize: "none", outline: "none", lineHeight: 1.7, transition: "border-color 0.15s",
          }}
          onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.4)"; }}
          onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
        />
        {wallets.length > 3 && (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
            First 3 will be checked (circuit limit)
          </p>
        )}
      </div>

      {/* Privacy notice */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <svg style={{ flexShrink: 0, marginTop: 1 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(124,58,237,0.6)" strokeWidth="1.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
          Contacts are encrypted in this browser. Arcium MXE computes the match without seeing plaintext. Only you decrypt the result.
        </p>
      </div>

      {step === "error" && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#fca5a5" }}>
          {error || "Something went wrong. Try again."}
        </div>
      )}

      <button
        onClick={() => discover(wallets)}
        disabled={wallets.length === 0}
        style={{
          width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
          background: wallets.length === 0 ? "rgba(255,255,255,0.05)" : "#7c3aed",
          color: wallets.length === 0 ? "rgba(255,255,255,0.25)" : "white",
          fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
          cursor: wallets.length === 0 ? "not-allowed" : "pointer", transition: "all 0.15s",
        }}
      >
        Find matches privately
      </button>
    </div>
  );
}