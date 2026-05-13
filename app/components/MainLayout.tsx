"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import DiscoverPanel from "./DiscoverPanel";
import ChatLayout from "./ChatLayout";
import { PhoneIcon } from "./icons";

interface MainLayoutProps {
  matchedWallets: string[];
  onMatchesFound: (wallets: string[]) => void;
}

export default function MainLayout({ matchedWallets, onMatchesFound }: MainLayoutProps) {
  const [activeTab, setActiveTab] = useState<"explore" | "chat">("explore");

  return (
    <div className="flex h-screen overflow-hidden bg-[#07070c] text-white">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden pb-20 md:pb-0">
        <header className="flex items-center justify-between border-b border-white/5 bg-[#0a0a14]/50 p-4 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-2">
            <PhoneIcon size={24} className="text-orange-500" />
            <span className="font-bold tracking-tight text-white">InvisiPhone</span>
          </div>
        </header>

        <div
          className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto ${activeTab === "chat" ? "p-0" : "p-4 md:p-8"}`}
        >
          <div className={`h-full w-full min-w-0 ${activeTab === "chat" ? "" : "mx-auto max-w-7xl"}`}>
            {activeTab === "explore" ? (
              <div key="explore" className="animate-tab-in">
                <DiscoverPanel onMatchesFound={onMatchesFound} />
              </div>
            ) : (
              <div key="chat" className="h-full min-h-0 animate-tab-in">
                <ChatLayout matchedWallets={matchedWallets} />
              </div>
            )}
          </div>
        </div>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </main>
    </div>
  );
}
