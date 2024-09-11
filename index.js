import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
      origin: "*", // Replace with your React app's origin
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

const MAX_USERS_PER_ROOM = 2; // Restrict to 2 users per room

io.on('connection', (socket) => {
  console.log('User connected', socket.id);

  // Handle joining a room
  socket.on('joinRoom', (room) => {
    const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;

    if (roomSize < MAX_USERS_PER_ROOM) {
      socket.join(room);
      socket.emit('roomJoined', `You have joined room: ${room}`);
      console.log(`User ${socket.id} joined room ${room}`);
    } else {
      socket.emit('roomFull', `Room ${room} is full. You cannot join.`);
      console.log(`User ${socket.id} tried to join a full room: ${room}`);
    }
  });

  // Handle chat messages
  socket.on('chatMessage', (msg, room) => {
    console.log(`Message from ${socket.id} in room ${room}: ${msg}`);
    io.to(room).emit('chatMessage', { user: socket.id, msg });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
