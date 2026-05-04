"use client";

// components/DiscoverPanel.tsx
// The main "Find your contacts" screen
// Calls useContactDiscovery() to run the full PSI flow

import { useState } from "react";
import { useContactDiscovery } from "@/hooks/useContactDiscovery";
import StatusLog from "./StatusLog";
import MatchResults from "./MatchResults";

// Demo contacts — 20 wallet addresses, 5 of which you register beforehand
// Judges click "Load Demo" and see exactly those 5 come back as matches
const DEMO_CONTACTS = [
  "7xKqMvuKSQunimR5HzzMmrb7VPWh4mBwxmXwa3Gfz7x",
  "9mPzF5qMvuKSQunimR5HzzMmrb7VPWh4mBwxmXwa3G",
  "3nRtBwxmXwa3Gfz7xFpF5qMvuKSQunimR5HzzMmrb7V",
  "AkLpBwxmXwa3Gfz7xFpF5qMvuKSQunimR5HzzMmrb7V",
  "DmQsBwxmXwa3Gfz7xFpF5qMvuKSQunimR5HzzMmrb7V",
  "FnWtBwxmXwa3Gfz7xFpF5qMvuKSQunimR5HzzMmrb7V",
  "GpXuBwxmXwa3Gfz7xFpF5qMvuKSQunimR5HzzMmrb7V",
  "HqYvBwxmXwa3Gfz7xFpF5qMvuKSQunimR5HzzMmrb7V",
  "JrZwBwxmXwa3Gfz7xFpF5qMvuKSQunimR5HzzMmrb7V",
  "KsAxBwxmXwa3Gfz7xFpF5qMvuKSQunimR5HzzMmrb7V",
];

// Parse a textarea value into an array of wallet addresses
// Handles newlines, commas, and spaces as separators
function parseWallets(input: string): string[] {
  return input
    .split(/[\n,\s]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 30); // basic length check for wallet addresses
}

export default function DiscoverPanel() {
  const [input, setInput] = useState("");
  const { discover, step, result, error } = useContactDiscovery();

  const wallets = parseWallets(input);
  const isRunning = [
    "generating_keypair",
    "fetching_registered",
    "encrypting_contacts",
    "encrypting_registered",
    "sending_transaction",
    "waiting_arcium",
    "decrypting",
  ].includes(step);

  const handleDiscover = () => {
    if (wallets.length === 0) return;
    discover(wallets);
  };

  const handleLoadDemo = () => {
    setInput(DEMO_CONTACTS.join("\n"));
  };

  const handleReset = () => {
    setInput("");
    window.location.reload(); // reset hook state
  };

  return (
    <div className="max-w-md mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Discover Contacts
        </h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Paste wallet addresses below. We'll find which ones are on InvisiPhone
          — without the platform seeing your full list.
        </p>
      </div>

      {step === "idle" || step === "error" ? (
        <>
          {/* Contact input */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-zinc-400 text-xs uppercase tracking-widest">
                Wallet addresses (one per line)
              </label>
              <button
                onClick={handleLoadDemo}
                className="text-violet-400 hover:text-violet-300 text-xs underline underline-offset-2"
              >
                Load demo contacts
              </button>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                "7xKqMvuKSQunimR5...\n9mPzF5qMvuKSQuni...\nAkLpBwxmXwa3Gfz7..."
              }
              rows={6}
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm font-mono p-3 resize-none focus:outline-none focus:border-violet-600 placeholder:text-zinc-700"
            />

            {/* Contact count */}
            {wallets.length > 0 && (
              <p className="text-zinc-600 text-xs mt-1">
                {wallets.length} address{wallets.length !== 1 ? "es" : ""} detected
                {wallets.length > 10 && " (first 10 will be checked)"}
              </p>
            )}
          </div>

          {/* Privacy notice */}
          <div className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2.5 mb-4 flex gap-2">
            <span className="text-violet-400 shrink-0">🔒</span>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Your contacts are encrypted in this browser before anything is sent.
              The platform never sees who you searched for.
            </p>
          </div>

          {/* Find matches button */}
          <button
            onClick={handleDiscover}
            disabled={wallets.length === 0}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium transition-colors"
          >
            Find Matches Privately
          </button>

          {step === "error" && (
            <p className="text-red-400 text-sm text-center mt-3">{error}</p>
          )}
        </>
      ) : (
        <>
          {/* Running or done state */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 mb-2">
            <p className="text-zinc-500 text-xs mb-1">Checking</p>
            <p className="text-white text-sm font-medium">
              {Math.min(wallets.length, 10)} contact
              {wallets.length !== 1 ? "s" : ""} — privately
            </p>
          </div>

          {/* Live privacy log */}
          <StatusLog step={step} />

          {/* Results */}
          {result && step === "done" && (
            <>
              <MatchResults result={result} />
              <button
                onClick={handleReset}
                className="w-full mt-4 py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-sm transition-colors"
              >
                Search again
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}