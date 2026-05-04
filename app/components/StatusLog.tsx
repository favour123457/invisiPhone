"use client";

// components/StatusLog.tsx
// Shows a live step-by-step log during the contact discovery process
// This is the "proof" that privacy is being maintained at each step

import { DiscoveryStep } from "@/hooks/useContactDiscovery";

interface StatusLogProps {
  step: DiscoveryStep;
}

// Each step has a label and a description of what's happening privacy-wise
const STEPS: {
  key: DiscoveryStep;
  label: string;
  detail: string;
}[] = [
  {
    key: "generating_keypair",
    label: "Generating your encryption keypair",
    detail: "Your private key is created in this browser. It never leaves your device.",
  },
  {
    key: "fetching_registered",
    label: "Fetching registered users from Solana",
    detail: "Reading the public on-chain registry — no private data here.",
  },
  {
    key: "encrypting_contacts",
    label: "Encrypting your contact list",
    detail: "Your contacts are encrypted locally. The platform will never see them.",
  },
  {
    key: "encrypting_registered",
    label: "Encrypting the registered set",
    detail: "Both sides of the comparison are encrypted before leaving your browser.",
  },
  {
    key: "sending_transaction",
    label: "Sending encrypted data to Solana",
    detail: "Only encrypted blobs hit the blockchain. No plaintext wallet addresses.",
  },
  {
    key: "waiting_arcium",
    label: "Arcium MXE computing privately...",
    detail: "Arx nodes are comparing encrypted sets. No single node sees your contacts.",
  },
  {
    key: "decrypting",
    label: "Decrypting result with your private key",
    detail: "Only you can read this result. Not Solana. Not Arcium. Not us.",
  },
  {
    key: "done",
    label: "Done — matches revealed privately",
    detail: "The platform learned nothing about your non-matching contacts.",
  },
];

type StepStatus = "waiting" | "active" | "done";

function getStepStatus(stepKey: DiscoveryStep, currentStep: DiscoveryStep): StepStatus {
  const stepOrder = STEPS.map((s) => s.key);
  const stepIdx = stepOrder.indexOf(stepKey);
  const currentIdx = stepOrder.indexOf(currentStep);

  if (currentStep === "idle" || currentStep === "error") return "waiting";
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "active";
  return "waiting";
}

export default function StatusLog({ step }: StatusLogProps) {
  if (step === "idle") return null;

  return (
    <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
        Privacy Log
      </p>

      <div className="space-y-3">
        {STEPS.map((s) => {
          const status = getStepStatus(s.key, step);

          return (
            <div key={s.key} className="flex items-start gap-3">
              {/* Status icon */}
              <div className="mt-0.5 shrink-0">
                {status === "done" && (
                  <span className="text-green-400 text-sm">✓</span>
                )}
                {status === "active" && (
                  <span className="text-violet-400 text-sm animate-pulse">◉</span>
                )}
                {status === "waiting" && (
                  <span className="text-zinc-700 text-sm">○</span>
                )}
              </div>

              {/* Step text */}
              <div>
                <p
                  className={`text-sm font-medium ${
                    status === "done"
                      ? "text-zinc-400"
                      : status === "active"
                      ? "text-white"
                      : "text-zinc-700"
                  }`}
                >
                  {s.label}
                </p>
                {status !== "waiting" && (
                  <p className="text-xs text-zinc-600 mt-0.5">{s.detail}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {step === "error" && (
        <div className="mt-4 rounded-lg bg-red-950 border border-red-800 p-3">
          <p className="text-red-400 text-sm">
            Something went wrong. Check the console for details.
          </p>
        </div>
      )}
    </div>
  );
}