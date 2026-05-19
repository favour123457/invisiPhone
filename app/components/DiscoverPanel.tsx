"use client";

import { useState, useRef, useEffect } from "react";
import { useContactDiscovery } from "@/hooks/useContactDiscovery";
import { useFriends, shortAddr } from "@/hooks/useFriends";
import { isValidSolanaAddress, parseWalletCSV } from "@/lib/parseWalletCSV";
import StatusLog from "./StatusLog";
import MatchResults from "./MatchResults";
import NicknameModal from "./NicknameModal";
import { UploadIcon, UsersIcon } from "./icons";

interface DiscoverPanelProps {
  onMatchesFound?: (wallets: string[]) => void;
}

const ARCIUM_CONTACT_LIMIT = 3;
const MAX_CSV_BYTES = 1024 * 1024;

function parseWallets(input: string): string[] {
  return input
    .split(/[\n,\s]+/)
    .map((w) => w.trim())
    .filter((w) => isValidSolanaAddress(w));
}

function uniqueStrings(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of list) {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

export default function DiscoverPanel({ onMatchesFound }: DiscoverPanelProps) {
  const [input, setInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [csvAddresses, setCsvAddresses] = useState<string[]>([]);
  const [csvInfo, setCsvInfo] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { discover, step, result, error } = useContactDiscovery();
  const { friends, loading: friendsLoading, removeFriend } = useFriends();

  const manualWallets = parseWallets(input);
  const merged = uniqueStrings([...manualWallets, ...csvAddresses]);
  const walletsForRun = merged.slice(0, ARCIUM_CONTACT_LIMIT);
  const overLimit = merged.length > ARCIUM_CONTACT_LIMIT;

  useEffect(() => {
    if (result && step === "done" && onMatchesFound) {
      onMatchesFound(result.matchedWallets);
    }
  }, [result, step, onMatchesFound]);

  const isRunning = [
    "generating_keypair",
    "fetching_registered",
    "encrypting_contacts",
    "encrypting_registered",
    "sending_transaction",
    "waiting_arcium",
    "decrypting",
  ].includes(step);

  const handleReset = () => {
    setInput("");
    setCsvAddresses([]);
    setCsvInfo(null);
    setCsvError(null);
    window.location.reload();
  };

  const onCsvPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setCsvError(null);
    setCsvInfo(null);
    if (!file) return;
    if (file.size > MAX_CSV_BYTES) {
      setCsvError("File is too large (max 1MB).");
      return;
    }
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".csv")) {
      setCsvError("Please upload a valid CSV file (.csv).");
      return;
    }
    try {
      const addrs = await parseWalletCSV(file);
      if (addrs.length === 0) {
        setCsvAddresses([]);
        setCsvError("No valid wallet addresses found in file.");
        return;
      }
      setCsvAddresses(addrs);
      setCsvInfo(`${addrs.length} valid address${addrs.length === 1 ? "" : "es"} from CSV`);
    } catch (err) {
      if (err instanceof Error && err.message === "FILE_TOO_LARGE") {
        setCsvError("File is too large (max 1MB).");
      } else {
        setCsvError("Could not read that file.");
      }
    }
  };

  if (isRunning || step === "done") {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-white">Discovery in progress</h2>
        <p className="mb-8 text-zinc-500">
          Arcium is privately comparing your {walletsForRun.length} contact{walletsForRun.length !== 1 ? "s" : ""}.
        </p>

        <div className="border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
          <StatusLog step={step} />
        </div>

        {result && step === "done" && (
          <div className="mt-8 space-y-4 animate-zoom-fade">
            <MatchResults result={result} onSaveFriends={() => setShowModal(true)} />
            <button
              type="button"
              onClick={handleReset}
              className="w-full border border-white/5 py-4 font-medium text-zinc-500 transition-colors duration-150 ease-in-out hover:text-white"
            >
              Start new search
            </button>
          </div>
        )}

        {showModal && result && result.matchedWallets.length > 0 && (
          <NicknameModal wallets={result.matchedWallets} onDone={() => setShowModal(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      <div className="border border-orange-500/30 bg-orange-600/10 px-4 py-3 text-center text-sm font-semibold text-orange-200">
        Maximum {ARCIUM_CONTACT_LIMIT} contacts per discovery (Arcium circuit limit).
      </div>

      <section>
        <header className="mb-8">
          <h2 className="mb-3 text-4xl font-extrabold tracking-tight text-white">Find your circle.</h2>
          <p className="max-w-xl text-lg text-zinc-500">
            Paste Solana addresses or upload a CSV. Private, encrypted, zero metadata leak.
          </p>
        </header>

        <div className="group relative">
          <div className="relative border border-white/10 bg-[#0d0d16] p-6 transition-colors duration-200 group-focus-within:border-orange-500/30 lg:p-8">
            <div className="mb-4 flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Connectable wallets</span>
              <div className="flex flex-wrap items-center gap-2">
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onCsvPick} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-zinc-300 transition-colors duration-150 ease-in-out hover:border-orange-500/30 hover:text-white"
                >
                  <UploadIcon size={18} />
                  Upload CSV
                </button>
                {merged.length > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 animate-pulse">
                    {merged.length} detected
                  </span>
                )}
              </div>
            </div>

            {csvInfo && <p className="mb-2 px-2 text-xs text-emerald-400/90">{csvInfo}</p>}
            {csvError && <p className="mb-2 px-2 text-xs text-amber-500">{csvError}</p>}
            {overLimit && (
              <p className="mb-2 px-2 text-xs font-medium text-amber-400">
                Only the first {ARCIUM_CONTACT_LIMIT} unique addresses will be sent to discovery.
              </p>
            )}

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                "7xKqMvuKSQunimR5HzzMmrb7VPWh4mBwxmXwa3...\n9mPzF5qMvuKSQunimR5HzzMmrb7VPWh4mBwx..."
              }
              rows={4}
              className="w-full resize-none border-none bg-transparent font-mono text-sm leading-relaxed text-white placeholder-zinc-800 focus:ring-0"
            />

            <div className="mt-6 flex flex-col items-center gap-4 px-2 sm:flex-row">
              <div className="flex-1 text-xs italic text-zinc-600">Valid base58 Solana addresses only. CSV merges with the field above.</div>
              <button
                type="button"
                onClick={() => discover(merged)}
                disabled={merged.length === 0}
                className="w-full border border-orange-600 bg-orange-600 px-8 py-4 font-bold text-white shadow-lg shadow-orange-600/10 transition-colors duration-200 ease-in-out hover:bg-orange-500 disabled:border-white/10 disabled:bg-white/5 disabled:text-zinc-700"
              >
                Run private discovery
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="animate-fade-up-slow">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-white">Your friends</h3>
            <p className="mt-1 text-sm text-zinc-500">Found via private discovery</p>
          </div>
          <div className="border border-white/5 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase text-zinc-400">
            {friends.length} contact{friends.length !== 1 ? "s" : ""}
          </div>
        </header>

        {friendsLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500/20 border-t-orange-500" />
          </div>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
            <UsersIcon size={48} className="mb-4 text-zinc-600" />
            <h4 className="mb-2 font-bold text-white">No friends yet</h4>
            <p className="max-w-xs text-sm text-zinc-600">
              Run a discovery above to find which of your contacts are already on InvisiPhone.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map((friend) => (
              <div
                key={friend.wallet}
                className="group border border-white/5 bg-white/[0.03] p-5 transition-colors duration-200 ease-in-out hover:border-orange-500/30"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center border border-orange-500/15 bg-orange-600/10 text-lg text-orange-200 shadow-inner">
                    {friend.nickname.slice(0, 1).toUpperCase()}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFriend(friend.wallet)}
                    className="p-2 text-xs font-bold text-zinc-600 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
                  >
                    REMOVE
                  </button>
                </div>
                <h5 className="mb-1 font-bold text-white">{friend.nickname}</h5>
                <p className="font-mono text-[10px] text-zinc-500">{shortAddr(friend.wallet)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && (
        <div className="border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-400">{error}</div>
      )}
    </div>
  );
}
