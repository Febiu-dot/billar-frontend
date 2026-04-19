import { io } from 'socket.io-client';

// En producción conecta al backend de Railway, en desarrollo al proxy local
const serverURL = import.meta.env.VITE_API_URL ?? '/';

export const socket = io(serverURL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
});
