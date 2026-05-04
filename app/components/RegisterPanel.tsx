"use client";

// components/RegisterPanel.tsx
// "Join InvisiPhone" screen
// Calls useRegister() to send the register_user transaction

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRegister } from "@/hooks/useRegister";

const STATUS_MESSAGES = {
  idle: null,
  sending: "Sending transaction to Solana...",
  confirming: "Confirming...",
  done: "You're registered! Switch to Discover to find contacts.",
  error: "Something went wrong. Try again.",
  already_registered: "You're already registered on InvisiPhone.",
};

interface RegisterPanelProps {
  onRegistered: () => void; // called when registration succeeds → switch to discover tab
}

export default function RegisterPanel({ onRegistered }: RegisterPanelProps) {
  const { publicKey } = useWallet();
  const { register, status, error } = useRegister();

  // Switch to discover tab when done
  const handleRegister = async () => {
    await register();
    if (status === "done" || status === "already_registered") {
      onRegistered();
    }
  };

  return (
    <div className="max-w-md mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Join InvisiPhone
        </h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Register your wallet address so your contacts can discover you —
          without either of you revealing your full contact list.
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 mb-6">
        <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">
          How it works
        </p>
        <div className="space-y-2.5">
          {[
            ["1", "You register your wallet on-chain"],
            ["2", "Your contacts search for matches privately"],
            ["3", "Only matches are revealed — not their full list"],
          ].map(([num, text]) => (
            <div key={num} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-violet-900 text-violet-300 text-xs flex items-center justify-center shrink-0 mt-0.5">
                {num}
              </span>
              <p className="text-zinc-300 text-sm">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet not connected */}
      {!publicKey ? (
        <div className="text-center">
          <p className="text-zinc-500 text-sm mb-4">
            Connect your wallet to register
          </p>
          <WalletMultiButton className="!bg-violet-600 hover:!bg-violet-500 !rounded-xl !font-medium" />
        </div>
      ) : (
        <div>
          {/* Show connected wallet */}
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-3 mb-4">
            <p className="text-zinc-500 text-xs mb-1">Registering wallet</p>
            <p className="text-white font-mono text-sm">
              {publicKey.toString().slice(0, 8)}...
              {publicKey.toString().slice(-8)}
            </p>
          </div>

          {/* Register button */}
          <button
            onClick={handleRegister}
            disabled={status === "sending" || status === "confirming" || status === "done"}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium transition-colors"
          >
            {status === "sending" || status === "confirming"
              ? "Registering..."
              : status === "done"
              ? "Registered ✓"
              : "Register on InvisiPhone"}
          </button>

          {/* Status message */}
          {STATUS_MESSAGES[status] && (
            <p
              className={`mt-3 text-sm text-center ${
                status === "done" || status === "already_registered"
                  ? "text-green-400"
                  : status === "error"
                  ? "text-red-400"
                  : "text-zinc-400"
              }`}
            >
              {STATUS_MESSAGES[status]}
            </p>
          )}

          {/* Go to discover if already registered */}
          {(status === "done" || status === "already_registered") && (
            <button
              onClick={onRegistered}
              className="w-full mt-3 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 font-medium transition-colors"
            >
              Go to Discover →
            </button>
          )}
        </div>
      )}
    </div>
  );
}