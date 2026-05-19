"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useRegister } from "@/hooks/useRegister";
import { shortAddr } from "@/hooks/useFriends";
import { EyeOffIcon, ShieldCheckIcon } from "./icons";

interface RegisterPanelProps {
  onRegistered: () => void;
}

export default function RegisterPanel({ onRegistered }: RegisterPanelProps) {
  const { publicKey } = useWallet();
  const { register, status } = useRegister();

  const busy = status === "sending" || status === "confirming";
  const done = status === "done" || status === "already_registered";

  const handleRegister = async () => {
    if (busy || done) return;
    const finalStatus = await register();
    if (finalStatus === "done" || finalStatus === "already_registered") onRegistered();
  };

  const benefits = [
    {
      Icon: ShieldCheckIcon,
      title: "On-chain Identity",
      desc: "Your wallet becomes your secure, immutable address.",
    },
    {
      Icon: EyeOffIcon,
      title: "Zero Disclosure",
      desc: "Contacts find you via encrypted proofs. No leaks.",
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="mb-10 text-center sm:text-left">
        <p className="text-[11px] font-bold text-orange-500 uppercase tracking-[0.3em] mb-3">Entrance Protocol</p>
        <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
          Join the <span className="text-orange-400">Invisible</span> Network
        </h2>
        <p className="text-zinc-500 text-lg leading-relaxed max-w-lg">
          Register your identity on-chain to enable private discovery. One transaction to secure your communications forever.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8">
        {benefits.map(({ Icon, title, desc }, i) => (
          <div key={i} className="flex gap-4 border border-white/5 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.05]">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center border border-orange-500/20 bg-orange-600/10 text-orange-400">
              <Icon size={21} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">{title}</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {publicKey && (
        <div className="mb-8 flex items-center justify-between border border-white/5 bg-white/[0.02] p-6 group">
          <div>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Authenticated Wallet</p>
            <p className="text-sm font-mono text-zinc-300 group-hover:text-orange-400 transition-colors">
              {shortAddr(publicKey.toString())}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center border border-orange-500/20 bg-orange-600/10 text-orange-400 shadow-inner">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="mb-6 border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-400 animate-shake">
          Transmission failed. Ensure you have enough SOL and try again.
        </div>
      )}

      <button
        onClick={done ? onRegistered : handleRegister}
        disabled={busy}
        className={`w-full border py-5 font-bold text-lg transition-colors duration-300 relative overflow-hidden group shadow-xl ${busy
            ? 'bg-white/5 text-zinc-700 cursor-not-allowed'
            : 'bg-orange-600 text-white hover:bg-orange-500 active:scale-[0.98] shadow-orange-600/20'
          }`}
      >
        <span className="relative z-10">
          {busy ? (status === "sending" ? "Initiating Protocol..." : "Verifying Block...") : done ? "Enter Network →" : "Register On-Chain"}
        </span>
        {!busy && <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />}
      </button>
    </div>
  );
}
