"use client";

// app/page.tsx
// Main page — shows Register tab or Discover tab
// Switches to Discover automatically after registration

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import RegisterPanel from "@/components/RegisterPanel";
import DiscoverPanel from "@/components/DiscoverPanel";

type Tab = "register" | "discover";

export default function Home() {
  const { publicKey } = useWallet();
  const [tab, setTab] = useState<Tab>("register");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <main className="min-h-screen bg-zinc-900 text-white">

      {/* Top nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-violet-400 text-lg">📵</span>
          <span className="font-bold text-white tracking-tight">InvisiPhone</span>
          <span className="text-zinc-600 text-xs ml-1">
            Private Contact Discovery
          </span>
        </div>

        {/* Wallet connect button */}
        <WalletMultiButton className="!bg-violet-600 hover:!bg-violet-500 !rounded-xl !text-sm !font-medium !py-2" />
      </nav>

      {/* Hero */}
      <div className="text-center py-12 px-6 border-b border-zinc-800">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-950 border border-violet-800 px-3 py-1 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-violet-300 text-xs">Powered by Arcium MXE</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">
          Find friends without exposing your contacts
        </h1>
        <p className="text-zinc-400 max-w-md mx-auto text-sm leading-relaxed">
          Traditional apps upload your full address book. InvisiPhone uses
          private set intersection — only matches are revealed, never your list.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-zinc-800">
        {(["register", "discover"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${tab === t
              ? "text-white border-b-2 border-violet-500"
              : "text-zinc-500 hover:text-zinc-300"
              }`}
          >
            {t === "register" ? "① Join" : "② Discover"}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="px-6 py-8">
        {!publicKey ? (
          // Not connected — prompt to connect
          <div className="max-w-md mx-auto text-center py-12">
            <p className="text-4xl mb-4">🔒</p>
            <p className="text-white font-semibold text-lg mb-2">
              Connect your wallet to start
            </p>
            <p className="text-zinc-500 text-sm mb-6">
              InvisiPhone uses your Solana wallet as your identity.
              No email. No phone number.
            </p>
            <WalletMultiButton className="!bg-violet-600 hover:!bg-violet-500 !rounded-xl !font-medium" />
          </div>
        ) : tab === "register" ? (
          <RegisterPanel onRegistered={() => setTab("discover")} />
        ) : (
          <DiscoverPanel />
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-4 text-center">
        <p className="text-zinc-600 text-xs">
          Built on{" "}
          <a
            href="https://arcium.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-500 hover:text-violet-400"
          >
            Arcium
          </a>{" "}
          · Private Set Intersection · Zero knowledge contact matching
        </p>
      </footer>
    </main>
  );
}