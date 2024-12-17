const http = require('http');
const socketIo = require('socket.io');
const handleConnection = require('./handlers/connectionHandler.js'); // Ensure correct path

// Create an HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server is running\n');
});

// Initialize Socket.IO
const io = socketIo(server, {
    cors: {
        origin: '*',  // Change '*' to specific client origin if needed
        methods: ['GET', 'POST']
    }
});

// Handle socket connection
io.on('connection', (socket) => {
    console.log('A new client connected');
    handleConnection.handleConnection(socket);  // Call the connection handler
});

// Start the server on port 8080 or any other specified port
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = { createServer: server };
