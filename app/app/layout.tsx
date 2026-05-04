// app/layout.tsx
// Wraps everything in wallet providers — must be here so every
// page and component can use useWallet() and useConnection()

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WalletWrapper from "@/components/WalletWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InvisiPhone — Private Contact Discovery",
  description: "Find your contacts without revealing your contact list",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* WalletWrapper sets up ConnectionProvider + WalletProvider + WalletModalProvider */}
        {/* Every component inside can now use useWallet() and useConnection() */}
        <WalletWrapper>{children}</WalletWrapper>
      </body>
    </html>
  );
}