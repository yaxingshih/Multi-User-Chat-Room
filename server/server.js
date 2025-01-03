const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require('cors');
require('dotenv').config();

const chatRoutes = require('./routes/chatRoutes');
const userMiddleware = (req, res, next) => {
  // 固定的 userId
  req.userId = 'Admin'; 
  next();
};

const app = express();
app.use(userMiddleware);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());
app.use('/api', chatRoutes);

// Handle WebSocket connections here
io.on("connection", (socket) => {
  console.log("A new user has connected", socket.id);

  // Listen for incoming messages from clients
  socket.on("message", (message) => {
    // Broadcast the message to all connected clients
    io.emit("message", message);
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    console.log(socket.id, " disconnected");
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});