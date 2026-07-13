/**
 * SocketContext — provides a single socket.io connection across the app
 */
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken } from '../utils/api';

const SocketContext = createContext(null);

const SERVER_URL = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

export function SocketProvider({ children }) {
  const socketRef = useRef(null);

  if (!socketRef.current) {
    socketRef.current = io(SERVER_URL, {
      autoConnect: true,
      auth: (callback) => callback({ token: getAccessToken() }),
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }

  useEffect(() => {
    const socket = socketRef.current;
    return () => {
      // Don't disconnect on unmount — keep persistent for reconnects
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
