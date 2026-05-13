"use client";

import { useState } from "react";
import { shortAddr } from "@/hooks/useFriends";
import { useWallet } from "@solana/wallet-adapter-react";
import { PhoneIcon, GlobeIcon, MessageIcon, CopyIcon, CheckIcon } from "./icons";

interface SidebarProps {
  activeTab: "explore" | "chat";
  onTabChange: (tab: "explore" | "chat") => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { publicKey } = useWallet();
  const [copied, setCopied] = useState(false);
  const full = publicKey?.toString() ?? "";

  const copyAddress = async () => {
    if (!full) return;
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const items = [
    { id: "explore" as const, label: "Explore", Icon: GlobeIcon },
    { id: "chat" as const, label: "Messages", Icon: MessageIcon },
  ];

  return (
    <aside className="hidden w-72 flex-col border-r border-white/5 bg-[#0a0a14] md:flex">
      <div className="border-b border-white/5 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-orange-600/30 bg-gradient-to-br from-orange-700 to-red-700 text-white shadow-lg shadow-orange-500/20">
            <PhoneIcon size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-white">InvisiPhone</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Private comms</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 p-4">
        {items.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-all duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98] ${
              activeTab === id
                ? "border-orange-500/20 bg-orange-600/10 text-orange-400"
                : "border-transparent text-zinc-500 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon size={22} className="shrink-0" />
            <span className="text-sm font-semibold">{label}</span>
            {activeTab === id && (
              <div className="ml-auto h-1.5 w-1.5 bg-orange-500 shadow-[0_0_8px_rgba(234,88,12,0.6)]" />
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto p-4">
        <div className="border border-white/5 bg-white/5 p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Your identity</p>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-orange-500/20 bg-zinc-800 font-mono text-xs text-orange-400">
              {publicKey?.toString().slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-xs text-zinc-300">{publicKey ? shortAddr(full) : "Not connected"}</p>
              <div className="mt-0.5 flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] font-medium text-zinc-500">On-chain registered</p>
              </div>
            </div>
            {publicKey && (
              <button
                type="button"
                onClick={copyAddress}
                title={copied ? "Copied!" : "Copy address"}
                className="flex shrink-0 flex-col items-center gap-0.5 border border-white/10 p-2 text-zinc-400 transition-colors duration-150 ease-in-out hover:border-orange-500/30 hover:text-orange-400"
              >
                <span
                  className={`transition-opacity duration-100 ease-in-out ${copied ? "text-emerald-400" : ""}`}
                  key={copied ? "check" : "copy"}
                >
                  {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
                </span>
                <span className="max-w-[52px] truncate text-[9px] font-bold uppercase tracking-tight text-zinc-500 transition-opacity duration-100">
                  {copied ? "Copied!" : "Copy"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
