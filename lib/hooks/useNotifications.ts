"use client";
import { useState, useEffect } from "react";
import { subscribeToNotifications, markNotificationRead } from "@/lib/firebase/firestore";
import type { Notification } from "@/lib/types";

export function useNotifications(uid?: string, limitCount: number = 20) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeToNotifications(uid, setNotifications, limitCount);
    return unsub;
  }, [uid, limitCount]);

  const markRead = async (id: string) => {
    await markNotificationRead(id);
  };

  const markAllRead = async () => {
    if (!uid) return;
    const { markAllNotificationsRead } = await import("@/lib/firebase/firestore");
    await markAllNotificationsRead(uid);
  };

  return { notifications, unreadCount, markRead, markAllRead };
}
