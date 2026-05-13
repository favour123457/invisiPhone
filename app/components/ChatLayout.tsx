"use client";

import { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useChat } from "@/hooks/useChat";
import { useChatThreads } from "@/hooks/useChatThreads";
import { useFriends, shortAddr } from "@/hooks/useFriends";
import { isValidSolanaAddress } from "@/lib/parseWalletCSV";
import QuickNicknameModal from "./QuickNicknameModal";
import { MessageIcon, UserIcon, SendIcon, ChevronIcon } from "./icons";

interface ChatLayoutProps {
  matchedWallets: string[];
}

interface ContactRow {
  wallet: string;
  name: string;
  isFriend: boolean;
  isUnknown: boolean;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function uniqueWallets(wallets: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of wallets) {
    if (!seen.has(w)) {
      seen.add(w);
      out.push(w);
    }
  }
  return out;
}

export default function ChatLayout({ matchedWallets }: ChatLayoutProps) {
  const { publicKey } = useWallet();
  const { friends, saveFriend } = useFriends();
  const { inboxPeers } = useChatThreads();
  const [activeContact, setActiveContact] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [manualWallets, setManualWallets] = useState<string[]>([]);
  const [walletDraft, setWalletDraft] = useState("");
  const [addWalletError, setAddWalletError] = useState<string | null>(null);
  const [nicknameTarget, setNicknameTarget] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, sending, sendError, clearSendError, listenError, retryListen } =
    useChat(activeContact);

  const friendWallets = friends.map((f) => f.wallet);
  const allWallets = uniqueWallets([
    ...inboxPeers,
    ...friendWallets,
    ...matchedWallets,
    ...manualWallets,
  ]);

  const contacts: ContactRow[] = allWallets.map((wallet) => {
    const friend = friends.find((f) => f.wallet === wallet);
    const isFriend = !!friend;
    const isUnknown = !isFriend;
    return {
      wallet,
      name: friend?.nickname ?? shortAddr(wallet),
      isFriend,
      isUnknown,
    };
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    clearSendError();
    const text = inputText;
    const ok = await sendMessage(text);
    if (ok) setInputText("");
  };

  const tryAddWallet = () => {
    setAddWalletError(null);
    const w = walletDraft.trim();
    if (!w) return;
    if (!isValidSolanaAddress(w)) {
      setAddWalletError("Enter a valid Solana address.");
      return;
    }
    if (publicKey && w === publicKey.toString()) {
      setAddWalletError("That is your own wallet.");
      return;
    }
    if (allWallets.includes(w)) {
      setWalletDraft("");
      setActiveContact(w);
      return;
    }
    setManualWallets((prev) => uniqueWallets([...prev, w]));
    setWalletDraft("");
    setActiveContact(w);
  };

  const handleSaveQuickNickname = async (nickname: string) => {
    if (!nicknameTarget) return;
    await saveFriend(nicknameTarget, nickname);
    setNicknameTarget(null);
  };

  if (contacts.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center border border-dashed border-white/10 bg-white/[0.02] p-8 text-center md:p-12">
        <MessageIcon size={56} className="mb-6 text-zinc-600" aria-hidden />
        <h3 className="mb-2 text-xl font-bold text-white">No conversations yet</h3>
        <p className="mx-auto max-w-xs text-zinc-500">
          Paste a wallet to start chatting. When someone messages you first, they appear here automatically (once
          thread sync runs in Firebase).
        </p>
        <div className="mt-8 flex w-full max-w-md flex-col gap-2 sm:flex-row">
          <input
            value={walletDraft}
            onChange={(e) => {
              setWalletDraft(e.target.value);
              setAddWalletError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && tryAddWallet()}
            placeholder="Paste wallet address…"
            className="min-h-11 flex-1 border border-white/10 bg-white/5 px-4 font-mono text-sm text-white outline-none transition-colors duration-150 ease-in-out focus:border-orange-500/50"
          />
          <button
            type="button"
            onClick={tryAddWallet}
            className="border border-orange-600 bg-orange-600 px-5 py-3 text-sm font-bold text-white transition-colors duration-150 ease-in-out hover:bg-orange-500"
          >
            Open chat
          </button>
        </div>
        {addWalletError && <p className="mt-3 text-sm text-amber-500">{addWalletError}</p>}
      </div>
    );
  }

  const currentContact = contacts.find((c) => c.wallet === activeContact);

  return (
    <div className="flex h-[calc(100vh-200px)] w-full min-w-0 flex-col overflow-hidden border border-white/10 bg-[#0d0d16] md:h-[min(650px,calc(100vh-120px))] md:flex-row">
      <div
        className={`${activeContact ? "hidden md:flex" : "flex"} flex w-full shrink-0 flex-col border-r border-white/5 bg-zinc-950/20 md:w-52 md:min-w-[13rem] lg:w-56`}
      >
        <header className="border-b border-white/5 px-3 py-3 md:px-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600">Chats</h3>
        </header>
        <div className="border-b border-white/5 p-2 md:p-3">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">Message by wallet</p>
          <div className="flex gap-1">
            <input
              value={walletDraft}
              onChange={(e) => {
                setWalletDraft(e.target.value);
                setAddWalletError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && tryAddWallet()}
              placeholder="Address…"
              className="min-h-9 flex-1 border border-white/10 bg-white/5 px-2 font-mono text-[11px] text-white outline-none transition-colors duration-150 ease-in-out focus:border-orange-500/50"
            />
            <button
              type="button"
              onClick={tryAddWallet}
              className="shrink-0 border border-orange-600 bg-orange-600/90 px-2 py-2 text-[11px] font-bold text-white hover:bg-orange-500"
            >
              Add
            </button>
          </div>
          {addWalletError && <p className="mt-1.5 text-[11px] text-amber-500">{addWalletError}</p>}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {contacts.map((contact) => (
            <button
              key={contact.wallet}
              type="button"
              onClick={() => setActiveContact(contact.wallet)}
              className={`flex w-full items-center gap-2 border-l-2 px-2 py-2.5 text-left transition-colors duration-150 ease-in-out md:gap-3 md:px-3 ${
                activeContact === contact.wallet
                  ? "border-orange-500 bg-orange-600/10"
                  : "border-transparent hover:bg-white/5"
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/5 bg-zinc-900 text-xs font-bold text-orange-400 md:h-10 md:w-10 md:text-sm">
                {contact.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{contact.name}</p>
                <p className="truncate font-mono text-[10px] text-zinc-600">{shortAddr(contact.wallet)}</p>
              </div>
              {activeContact === contact.wallet && (
                <div className="h-1.5 w-1.5 shrink-0 bg-orange-500 shadow-[0_0_6px_rgba(234,88,12,0.6)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={`${!activeContact ? "hidden md:flex" : "flex"} relative min-w-0 flex-1 flex-col`}>
        {activeContact && currentContact ? (
          <>
            <header className="flex items-center justify-between border-b border-white/5 bg-zinc-950/30 px-3 py-3 backdrop-blur-md md:px-4">
              <div className="flex min-w-0 items-center gap-2 md:gap-3">
                <button
                  type="button"
                  onClick={() => setActiveContact(null)}
                  className="p-2 text-zinc-500 transition-colors duration-150 ease-in-out hover:text-white md:hidden"
                  aria-label="Back to list"
                >
                  <ChevronIcon size={20} direction="left" />
                </button>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-orange-500/20 bg-orange-600/20 text-xs font-bold text-orange-400 md:h-10 md:w-10 md:text-sm">
                  {currentContact.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-bold text-white">{currentContact.name}</h4>
                  <p className="truncate font-mono text-[10px] text-zinc-500">{shortAddr(currentContact.wallet)}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {currentContact.isUnknown && (
                  <button
                    type="button"
                    onClick={() => setNicknameTarget(currentContact.wallet)}
                    className="border border-orange-500/30 bg-orange-600/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-400 hover:bg-orange-600/20 md:px-3 md:py-1.5"
                  >
                    Add nickname
                  </button>
                )}
                <div className="hidden items-center gap-1.5 border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 sm:flex">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  E2E
                </div>
              </div>
            </header>

            {listenError && (
              <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                <span>{listenError}</span>
                <button
                  type="button"
                  onClick={retryListen}
                  className="shrink-0 border border-white/20 bg-white/10 px-2 py-1 font-semibold text-white hover:bg-white/20"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 md:p-4">
              <div className="flex justify-center">
                <div className="border border-white/5 bg-white/5 px-3 py-1 text-[10px] font-medium italic text-zinc-600">
                  Encrypted channel with {currentContact.name}
                </div>
              </div>

              {messages.map((msg) => {
                const isOwn = msg.sender === publicKey?.toString();
                return (
                  <div
                    key={msg.id}
                    className={`motion-safe:animate-[msgIn_150ms_ease-in-out_forwards] flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[90%] border px-3 py-2 text-sm leading-relaxed sm:max-w-[75%] md:max-w-[70%] ${
                        isOwn ? "border-orange-600/40 bg-orange-600 text-white" : "border-white/10 bg-white/5 text-zinc-200"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="mt-0.5 px-1 text-[10px] font-medium text-zinc-600">{formatTime(msg.timestamp)}</span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <style>{`
              @keyframes msgIn {
                from { opacity: 0; transform: translateY(6px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @media (prefers-reduced-motion: reduce) {
                .motion-safe\\:animate-\\[msgIn_150ms_ease-in-out_forwards\\] { animation: none !important; }
              }
            `}</style>

            <div className="border-t border-white/5 bg-zinc-950/40 p-3 backdrop-blur-md md:p-4">
              {sendError && (
                <div className="mb-2 flex items-center justify-between gap-2 border border-red-500/20 bg-red-500/10 px-2 py-2 text-xs text-red-300">
                  <span>{sendError}</span>
                  <button type="button" onClick={clearSendError} className="font-semibold underline">
                    Dismiss
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 transition-colors duration-150 ease-in-out focus-within:border-orange-500/50">
                <input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !sending && handleSend()}
                  placeholder={sending ? "Sending…" : "Type a message…"}
                  disabled={sending}
                  className="h-9 min-w-0 flex-1 border-none bg-transparent text-sm text-white placeholder-zinc-700 focus:ring-0 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim() || sending}
                  className="flex h-9 w-9 shrink-0 items-center justify-center border border-orange-600 bg-orange-600 text-white hover:bg-orange-500 disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-600"
                  aria-label="Send"
                >
                  {sending ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <SendIcon size={18} />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center md:p-12">
            <div className="mb-4 flex h-14 w-14 items-center justify-center border border-white/5 bg-zinc-900 text-zinc-600 md:mb-6 md:h-16 md:w-16">
              <UserIcon size={32} />
            </div>
            <h4 className="font-bold tracking-tight text-zinc-500">Select a chat</h4>
            <p className="mt-1 font-mono text-[11px] font-bold uppercase tracking-widest text-zinc-700">
              Awaiting selection…
            </p>
          </div>
        )}
      </div>

      {nicknameTarget && (
        <QuickNicknameModal
          wallet={nicknameTarget}
          onSave={handleSaveQuickNickname}
          onCancel={() => setNicknameTarget(null)}
        />
      )}
    </div>
  );
}
