"use client";

// components/WalletWrapper.tsx
// Sets up all three wallet providers that power useWallet() and useConnection()
// Must be a client component because it uses browser APIs

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";

// Import the default wallet button styles
import "@solana/wallet-adapter-react-ui/styles.css";

// Devnet for development — swap to mainnet-beta for production
const ENDPOINT = "https://api.devnet.solana.com";

export default function WalletWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // useMemo so the adapter isn't recreated on every render
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    // Layer 1: ConnectionProvider — gives useConnection() its data
    // endpoint = which Solana network to talk to
    <ConnectionProvider endpoint={ENDPOINT}>

      {/* Layer 2: WalletProvider — gives useWallet() its data */}
      {/* autoConnect = true means it reconnects Phantom automatically on page reload */}
      <WalletProvider wallets={wallets} autoConnect>

        {/* Layer 3: WalletModalProvider — powers the connect popup */}
        <WalletModalProvider>
          {children}
        </WalletModalProvider>

      </WalletProvider>
    </ConnectionProvider>
  );
}