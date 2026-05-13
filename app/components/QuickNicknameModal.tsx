"use client";

import { useState } from "react";
import { shortAddr } from "@/hooks/useFriends";

export interface QuickNicknameModalProps {
  wallet: string;
  onSave: (nickname: string) => void;
  onCancel: () => void;
}

export default function QuickNicknameModal({ wallet, onSave, onCancel }: QuickNicknameModalProps) {
  const [nickname, setNickname] = useState("");

  const handleSave = () => {
    const n = nickname.trim();
    if (!n) return;
    onSave(n);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm motion-safe:animate-[backdropIn_200ms_ease-in-out_forwards]"
        style={{ backdropFilter: "blur(8px)" }}
        onClick={onCancel}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="quick-nick-title"
        className="fixed left-1/2 top-1/2 z-[121] w-[calc(100%-2rem)] max-w-[400px] -translate-x-1/2 -translate-y-1/2 border border-white/10 bg-[#0f0f1a] p-6 shadow-2xl motion-safe:animate-[modalPop_250ms_ease-in-out_forwards]"
      >
        <style>{`
          @keyframes backdropIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes modalPop { from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
          @media (prefers-reduced-motion: reduce) {
            .motion-safe\\:animate-\\[backdropIn_200ms_ease-in-out_forwards\\], .motion-safe\\:animate-\\[modalPop_250ms_ease-in-out_forwards\\] { animation: none !important; }
          }
        `}</style>
        <h2 id="quick-nick-title" className="text-lg font-bold text-white text-center mb-1">
          Add nickname
        </h2>
        <p className="text-center font-mono text-xs text-zinc-500 mb-6">{shortAddr(wallet)}</p>
        <input
          autoFocus
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") onCancel();
          }}
          placeholder="Display name"
          maxLength={32}
          className="mb-4 w-full border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-colors duration-150 placeholder:text-zinc-600 focus:border-orange-500/50"
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-white/10 py-3 text-sm font-semibold text-zinc-400 transition-colors duration-150 hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!nickname.trim()}
            onClick={handleSave}
            className="flex-1 border border-orange-600 bg-orange-600 py-3 text-sm font-bold text-white transition-colors duration-150 hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
