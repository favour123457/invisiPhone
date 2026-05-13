"use client";

import { GlobeIcon, MessageIcon } from "./icons";

interface BottomNavProps {
  activeTab: "explore" | "chat";
  onTabChange: (tab: "explore" | "chat") => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const items = [
    { id: "explore" as const, label: "Explore", Icon: GlobeIcon },
    { id: "chat" as const, label: "Chat", Icon: MessageIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-white/5 bg-[#0a0a14]/80 px-6 backdrop-blur-xl md:hidden">
      {items.map(({ id, label, Icon }) => (
        <button key={id} type="button" onClick={() => onTabChange(id)} className="group flex flex-col items-center gap-1">
          <div
            className={`flex h-12 w-12 items-center justify-center border transition-colors duration-200 ease-in-out ${
              activeTab === id
                ? "border-orange-500/40 bg-orange-600 text-white shadow-lg shadow-orange-500/30"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon size={26} />
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-150 ease-in-out ${
              activeTab === id ? "text-orange-400" : "text-zinc-600"
            }`}
          >
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
}
