"use client";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export function useSocket(userId?: string, role?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
        path: "/api/socket",
        transports: ["websocket", "polling"],
      });
    }
    socketRef.current = socketInstance;

    if (userId) {
      socketInstance.emit("join", userId);
    }
    if (role) {
      socketInstance.emit("joinRole", role);
    }

    return () => {
      if (userId) socketInstance?.emit("leave", userId);
      if (role) socketInstance?.emit("leaveRole", role);
    };
  }, [userId, role]);

  return socketRef.current;
}
