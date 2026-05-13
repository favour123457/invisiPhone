"use client";

import { useEffect, useMemo, useState } from "react";
import { DiscoveryStep } from "@/hooks/useContactDiscovery";
import { LockIcon, CheckIcon } from "./icons";

const STEPS: { key: DiscoveryStep; label: string; detail: string }[] = [
  { key: "generating_keypair", label: "Generating encryption keypair…", detail: "Preparing keys for local encryption." },
  { key: "fetching_registered", label: "Fetching registered users from Solana network…", detail: "Reading the on-chain registry." },
  { key: "encrypting_contacts", label: "Encrypting your contacts locally…", detail: "Plaintext never leaves your device." },
  { key: "encrypting_registered", label: "Encrypting registered users…", detail: "Bundling ciphertexts for the circuit." },
  { key: "sending_transaction", label: "Sending encrypted data to Arcium MXE…", detail: "Submitting your Solana transaction." },
  { key: "waiting_arcium", label: "Waiting for Arcium to compute matches…", detail: "Private set intersection on Arx nodes." },
  { key: "decrypting", label: "Decrypting results…", detail: "Only your browser can read the outcome." },
  { key: "done", label: "Discovery complete!", detail: "You can review matches below." },
];

const ORDER = STEPS.map((s) => s.key);

function statusFor(key: DiscoveryStep, current: DiscoveryStep): "done" | "active" | "waiting" {
  if (current === "idle" || current === "error") return "waiting";
  const ki = ORDER.indexOf(key);
  const ci = ORDER.indexOf(current);
  if (ki < 0 || ci < 0) return "waiting";
  if (ki < ci) return "done";
  if (ki === ci) return "active";
  return "waiting";
}

function formatClock(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export default function StatusLog({ step }: { step: DiscoveryStep }) {
  const [started] = useState(() => Date.now());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (step === "idle" || step === "error" || step === "done") return;
    const id = setInterval(() => setTick((t) => t + 1), 300);
    return () => clearInterval(id);
  }, [step]);

  const elapsedLabel = useMemo(() => formatClock(Date.now() - started), [started, tick, step]);

  if (step === "idle") return null;

  return (
    <div className="relative overflow-hidden border border-white/[0.08] bg-white/[0.03] p-8 md:p-10">
      <style>{`
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes step-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.35); } 50% { box-shadow: 0 0 0 6px rgba(234, 88, 12, 0); } }
        @media (prefers-reduced-motion: reduce) {
          .status-pulse { animation: none !important; }
        }
      `}</style>

      <p className="mb-8 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
        <LockIcon size={16} className="text-orange-500" />
        Privacy log
        <span className="ml-auto font-mono text-[10px] font-normal normal-case tracking-normal text-zinc-600">
          {step !== "done" && step !== "error" ? `Elapsed ${elapsedLabel}` : ""}
        </span>
      </p>

      <div className="flex flex-col gap-5">
        {STEPS.map((s) => {
          const status = statusFor(s.key, step);
          return (
            <div
              key={s.key}
              className="flex gap-4 transition-colors duration-300 ease-in-out md:gap-5"
            >
              <div className="flex w-7 shrink-0 justify-center pt-1">
                {status === "done" && (
                  <div className="flex h-6 w-6 items-center justify-center border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                    <CheckIcon size={14} className="text-emerald-400" strokeWidth={2.5} />
                  </div>
                )}
                {status === "active" && (
                  <div
                    className="status-pulse mt-0.5 h-3 w-3 rounded-full bg-orange-500"
                    style={{ animation: "pulse-dot 1s ease-in-out infinite, step-pulse 2s ease-in-out infinite" }}
                  />
                )}
                {status === "waiting" && (
                  <div className="mt-1 h-2 w-2 border border-white/15 bg-white/[0.04]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[15px] font-semibold leading-snug transition-colors duration-300 ease-in-out md:text-[17px] ${
                    status === "done"
                      ? "text-zinc-500"
                      : status === "active"
                        ? "text-white"
                        : "text-zinc-600"
                  }`}
                >
                  {s.label}
                </p>
                {status !== "waiting" && <p className="mt-1 font-mono text-xs leading-relaxed text-zinc-500 md:text-[13px]">{s.detail}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {step === "done" && (
        <div className="mt-8 flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400/90">
          <CheckIcon size={18} className="shrink-0 text-emerald-400" />
          Matches are ready — scroll down to review.
        </div>
      )}
    </div>
  );
}
