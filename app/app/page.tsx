"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import RegisterPanel from "@/components/RegisterPanel";
import MainLayout from "@/components/MainLayout";
import { useRegister } from "@/hooks/useRegister";

export default function Home() {
  const { publicKey, connected } = useWallet();
  const { checkRegistration, status } = useRegister();
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [matchedWallets, setMatchedWallets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial registration check
  useEffect(() => {
    if (connected && publicKey) {
      setLoading(true);
      checkRegistration().then(reg => {
        setIsRegistered(reg);
        setLoading(false);
      });
    } else {
      setIsRegistered(false);
      setLoading(false);
    }
  }, [connected, publicKey]);

  // Update registration state when status changes to 'done' (from RegisterPanel)
  useEffect(() => {
    if (status === "done" || status === "already_registered") {
      setIsRegistered(true);
    }
  }, [status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070c] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-zinc-500 font-medium animate-pulse text-sm">Initializing Identity...</p>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <main className="min-h-screen bg-[#07070c] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Premium Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full" />

        <div className="z-10 text-center max-w-xl">
          <div className="inline-flex items-center gap-2 border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(234,88,12,0.8)]" />
            <span className="text-orange-300 text-[10px] font-bold uppercase tracking-widest">Secured by Arcium MXE</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-[1.1]">
            Privacy is <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 animate-gradient">Invisible</span>
          </h1>

          <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
            Discover contacts privately and chat securely. No phone numbers, no metadata leaks. Just your Solana wallet.
          </p>

          <div className="flex flex-col items-center gap-4 group">
            <WalletMultiButton className="!bg-orange-600 hover:!bg-orange-500 !rounded-none !h-14 !px-8 !text-lg !font-bold !transition-all !duration-300 hover:!scale-105 active:!scale-95 !shadow-xl !shadow-orange-600/20" />
            <p className="text-zinc-600 text-xs font-medium">Connect your wallet to enter the shadows</p>
          </div>
        </div>
      </main>
    );
  }

  if (isRegistered === false) {
    return (
      <div className="min-h-screen bg-[#07070c] p-6 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="max-w-xl w-full z-10">
          <RegisterPanel onRegistered={() => setIsRegistered(true)} />
        </div>
      </div>
    );
  }

  return (
    <MainLayout
      matchedWallets={matchedWallets}
      onMatchesFound={setMatchedWallets}
    />
  );
}