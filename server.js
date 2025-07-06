require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const authRoutes = require('./auth.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://127.0.0.1:5500", "http://localhost:3000", "http://127.0.0.1:5501"],
    methods: ["GET", "POST"]
  }
});

// Make io globally accessible
global.io = io;
// app.use(cors({ origin: 'http://127.0.0.1:5500',methods: 'GET,POST,PUT,DELETE',
//     allowedHeaders: 'Content-Type,Authorization' })); // Replace with your frontend URL
// // Middleware
// app.use(bodyParser.json());
app.use(express.json());  // ✅ This enables JSON parsing
const allowedOrigins = ['http://127.0.0.1:5500', 'http://localhost:3000','http://127.0.0.1:5501'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
// Routes
app.use('/auth', authRoutes);

// Database connection
mongoose.connect('mongodb://localhost:27017/yourDatabase', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.log('Failed to connect to MongoDB', err);
});

// Serve static files
app.use(express.static(__dirname));

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`Client ${socket.id} joined room ${roomId}`);
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start the server
const port = process.env.PORT||5000 ;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
