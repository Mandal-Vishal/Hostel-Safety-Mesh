import { createContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { USE_MOCK, SOCKET_URL } from "../services/config";
import { mockSocket } from "../services/mockSocket";
import { useAuth } from "../hooks/useAuth";

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      socketRef.current = null;
      return;
    }

    if (USE_MOCK) {
      socketRef.current = mockSocket;
      return undefined;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      socketRef.current = null;
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      withCredentials: true,

      auth: {
        token,
      },

      /**
       * Use long-polling only for the local
       * prototype.
       *
       * WebSocket upgrade was repeatedly failing
       * in the current local environment.
       */
      transports: ["polling"],

      upgrade: false,

      reconnection: true,

      reconnectionAttempts: 5,

      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("connection:success", (payload) => {
      console.log("Socket authenticated:", payload);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
}
