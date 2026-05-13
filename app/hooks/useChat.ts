"use client";

// Real-time chat via Firebase. Room ID = sha256(sorted wallets).

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ref,
  push,
  onValue,
  query,
  orderByChild,
  limitToLast,
} from "firebase/database";
import { db } from "@/lib/firebase";
import { getChatRoomId } from "@/lib/roomId";
import { touchChatThreads } from "@/lib/chatThreads";

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export function useChat(contactWallet: string | null) {
  const { publicKey } = useWallet();
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [listenError, setListenError] = useState<string | null>(null);
  const [listenRetryNonce, setListenRetryNonce] = useState(0);

  useEffect(() => {
    if (!publicKey || !contactWallet) {
      setRoomId(null);
      setMessages([]);
      setListenError(null);
      return;
    }

    getChatRoomId(publicKey.toString(), contactWallet).then(setRoomId);
  }, [publicKey, contactWallet]);

  useEffect(() => {
    if (!roomId) return;

    const messagesRef = query(
      ref(db, `chats/${roomId}/messages`),
      orderByChild("timestamp"),
      limitToLast(50)
    );

    const unsubscribe = onValue(
      messagesRef,
      (snapshot) => {
        setListenError(null);
        const data = snapshot.val();
        if (!data) {
          setMessages([]);
          return;
        }

        const msgs: Message[] = Object.entries(data).map(([id, val]: any) => ({
          id,
          sender: String(val.sender ?? ""),
          text: String(val.text ?? ""),
          timestamp: Number(val.timestamp ?? 0),
        }));

        msgs.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(msgs);
      },
      (err) => {
        console.error("Firebase listen error:", err);
        setListenError("Could not load messages. Check your connection.");
      }
    );

    return () => {
      unsubscribe();
    };
  }, [roomId, listenRetryNonce]);

  const retryListen = () => {
    setListenError(null);
    setListenRetryNonce((n) => n + 1);
  };

  const sendMessage = async (text: string): Promise<boolean> => {
    if (!publicKey || !roomId || !contactWallet || !text.trim()) return false;

    setSending(true);
    setSendError(null);
    try {
      await push(ref(db, `chats/${roomId}/messages`), {
        sender: publicKey.toString(),
        text: text.trim(),
        timestamp: Date.now(),
      });
      await touchChatThreads(publicKey.toString(), contactWallet, roomId);
      return true;
    } catch (err) {
      console.error("Send failed:", err);
      setSendError("Message could not be sent. Tap retry or try again.");
      return false;
    } finally {
      setSending(false);
    }
  };

  const clearSendError = () => setSendError(null);

  return { messages, sendMessage, sending, sendError, clearSendError, listenError, retryListen, roomId };
}
