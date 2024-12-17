const connectionsMap = {}; // Stores rooms and the connections within those rooms

class ConnectionHandler {
    // Method to handle a new connection and the associated logic
    static handleConnection(socket) {
        // Extract roomName, userName, userId, and isCreator from the query string of the URL
        const { roomName, name: userName, userId} = socket.handshake.query;

        if (!roomName || !userName || !userId) {
            socket.disconnect();
            console.log('Room name, user name, and userId are required in the connection.');
            return;
        }

        // Log the user joining the room
        console.log(`${userName} (ID: ${userId}) is trying to join room "${roomName}"`);

        // Check if the room exists and add the user to it (or create it if needed)
        ConnectionHandler.checkRoomExistence(socket, roomName, userName, userId);

        // Handle incoming messages from the client
        socket.on('message', (message) => {
            ConnectionHandler.handleMessage(socket, roomName, message);
        });

        // Handle client disconnection
        socket.on('disconnect', () => {
            ConnectionHandler.handleDisconnect(socket, roomName, userName, userId);
        });
    }

    // Check if the room exists. If not, create it; then add the client to the room
    static checkRoomExistence(socket, roomName, userName, userId) {
        if (!connectionsMap[roomName]) {
            // If room doesn't exist, create it
            connectionsMap[roomName] = [];
            console.log(`Room "${roomName}" created as it didn't exist.`);
        }

        // Add the client to the room (whether created or already existing)
        ConnectionHandler.addClientToRoom(socket, roomName, userName, userId);
    }

    // Add the client socket to the room and log the user
    static addClientToRoom(socket, roomName, userName, userId) {
        socket.userName = userName;  // Attach the userName to the socket object
        socket.userId = userId;      // Attach the userId to the socket object

        // Store the user as an object with userName and userId
        connectionsMap[roomName].push({ socket, userName, userId });

        socket.join(roomName);  // Join the room with socket.io
        console.log(`${userName} (ID: ${userId}) added to room: ${roomName}`);

        // After joining, send the current list of users (excluding the new user)
        ConnectionHandler.sendUserList(socket, roomName);
    }

    // Broadcast the current list of users to the new user (excluding themselves)
    static sendUserList(socket, roomName) {
        const usersInRoom = connectionsMap[roomName]
            .filter(user => user.socket !== socket)  // Exclude the new user
            .map(user => ({ userName: user.userName, userId: user.userId }));  // Send userName and userId

        // Send a message with the current users list
        socket.emit('message', JSON.stringify({ command: 'room_users', users: usersInRoom }));
    }

    // Handle incoming message and broadcast to all clients in the room (except sender)
    static handleMessage(socket, roomName, message) {
        console.log(`Message from ${socket.userName} (ID: ${socket.userId}) in room "${roomName}": ${message}`);

        // Broadcast message to all clients in the room except the sender
        socket.to(roomName).emit('message', message);
    }

    // Handle client disconnection and clean up empty rooms
    static handleDisconnect(socket, roomName, userName, userId) {
        // Remove the client from the room
        connectionsMap[roomName] = connectionsMap[roomName].filter(client => client.socket !== socket);
        console.log(`${userName} (ID: ${userId}) disconnected from room: ${roomName}`);

        // If the room is empty, delete it from the map
        if (connectionsMap[roomName].length === 0) {
            delete connectionsMap[roomName];
            console.log(`Room "${roomName}" removed as it is now empty.`);
        }
    }
}

module.exports = ConnectionHandler;
