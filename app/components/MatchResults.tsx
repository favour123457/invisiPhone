"use client";

// components/MatchResults.tsx
// Shows which contacts matched after Arcium decrypts the result

import { DiscoveryResult } from "@/hooks/useContactDiscovery";

interface MatchResultsProps {
  result: DiscoveryResult;
}

// Shorten a wallet address for display: "7xKq...3mPz"
function shortWallet(wallet: string): string {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export default function MatchResults({ result }: MatchResultsProps) {
  const { matchedWallets, totalContacts, totalMatches } = result;

  return (
    <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">

      {/* Summary header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white font-semibold text-lg">
            {totalMatches} match{totalMatches !== 1 ? "es" : ""} found
          </p>
          <p className="text-zinc-500 text-sm">
            out of {totalContacts} contacts checked — privately
          </p>
        </div>

        {/* Privacy badge */}
        <div className="rounded-full bg-violet-950 border border-violet-800 px-3 py-1">
          <p className="text-violet-400 text-xs font-medium">🔒 Zero-knowledge</p>
        </div>
      </div>

      {/* What was revealed vs hidden */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-lg bg-zinc-900 p-3">
          <p className="text-green-400 text-xs uppercase tracking-widest mb-1">
            Revealed to you
          </p>
          <p className="text-white font-bold text-2xl">{totalMatches}</p>
          <p className="text-zinc-500 text-xs">matched contacts</p>
        </div>
        <div className="rounded-lg bg-zinc-900 p-3">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">
            Hidden from platform
          </p>
          <p className="text-white font-bold text-2xl">
            {totalContacts - totalMatches}
          </p>
          <p className="text-zinc-500 text-xs">non-matching contacts</p>
        </div>
      </div>

      {/* Matched wallets list */}
      {totalMatches > 0 ? (
        <div className="space-y-2">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">
            Your contacts on InvisiPhone
          </p>
          {matchedWallets.map((wallet) => (
            <div
              key={wallet}
              className="flex items-center gap-3 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2.5"
            >
              {/* Avatar placeholder */}
              <div className="w-8 h-8 rounded-full bg-violet-900 flex items-center justify-center shrink-0">
                <span className="text-violet-300 text-xs font-bold">
                  {wallet.slice(0, 2).toUpperCase()}
                </span>
              </div>

              {/* Wallet address */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-mono truncate">
                  {shortWallet(wallet)}
                </p>
                <p className="text-zinc-600 text-xs">on InvisiPhone</p>
              </div>

              {/* Copy button */}
              <button
                onClick={() => navigator.clipboard.writeText(wallet)}
                className="text-zinc-600 hover:text-zinc-400 text-xs shrink-0"
              >
                copy
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-zinc-900 p-4 text-center">
          <p className="text-zinc-500 text-sm">
            None of your contacts are on InvisiPhone yet.
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            The platform learned nothing about who you searched for.
          </p>
        </div>
      )}
    </div>
  );
}