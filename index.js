import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const PORT = 3000;
const httpServer = createServer(app);
const socketIO = new Server(httpServer, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors());

const MAX_USERS_PER_ROOM = 2; // Restrict to 2 users per room
let users = [];

socketIO.on('connection', (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);

  // Handle joining a room
  socket.on('joinRoom', (room) => {
    const roomSize = socketIO.sockets.adapter.rooms.get(room)?.size || 0;

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
    socketIO.emit('messageRecieved', { user: socket.id, msg,room: room });
  });

  // Handle typing notification
  socket.on('typing', (data) => {
    socket.broadcast.emit('typingResponse', data);
  });

  // Handle new users
  socket.on('newUser', (data) => {
    users.push(data);
    socketIO.emit('newUserResponse', users);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('🔥: A user disconnected');
    users = users.filter((user) => user.socketID !== socket.id);
    socketIO.emit('newUserResponse', users);
    socket.disconnect();
  });
});

// Simple API endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'Hello' });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
