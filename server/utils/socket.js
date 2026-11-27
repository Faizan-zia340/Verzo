// Shared Socket.IO instance.
//
// server.js creates the HTTP server and calls initSocket(server, corsOptions)
// once at startup; controllers import the live `io` binding and use it only
// inside request handlers (after initSocket has run).
//
// This module exists so controllers can emit socket events WITHOUT importing
// server.js — importing server.js from a controller creates a cycle
// (server.js -> routes -> controller -> server.js) that crashes module load
// with a TDZ ReferenceError if the import order ever changes.
import { Server } from 'socket.io';

// Live binding: assigned by initSocket at startup, read by controllers
// when they emit. Null until initSocket runs.
export let io = null;

export function initSocket(server, corsOptions) {
  io = new Server(server, corsOptions);
  io.on('connection', (socket) => {
    socket.on('join', (userId) => socket.join(userId));
    socket.on('disconnect', () => {});
  });
  return io;
}
