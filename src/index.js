const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage,generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

// Setup Socket.io with Express
const app = express();
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public');

// Setup static directory to server
app.use(express.static(publicDirectoryPath));

// Establish a connection with one client (socket)
io.on('connection', (socket) => {
    console.log('New Websocket connection.')
    
    // When a client joins 
    socket.on('join', ( options, callback ) => {
        // Create User
        const { error ,user } = addUser({ id: socket.id, ...options })  // Attach socket unique ID to user object, using as the user ID.
        if (error) { return callback(error) }                           // Catch error and handle with callback function 
        
        // Join Room
        socket.join(user.room)                                          // Join this client to the designated room
        socket.emit('message', generateMessage('Admin', `Welcome, ${user.username}`))        // Welcome message to this client
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined.`))     // Inform other clients in the same room
        io.to(user.room).emit('roomData', {                             // Send room data to client side, for displaying user list in the room
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()                                                      // Complete the function
    })

    // When client sends message
    socket.on('sendMessage', (message, callback)=>{
        // Retrieve user data
        const {error, user} = getUser(socket.id)                        // Get user by ID (matches socket ID)
        if (error) { return callback(error) }                           // Catch error and handle
        
        // Check for profanity in message
        const filter = new Filter()                                     // Create filter instance
        if (filter.isProfane(message)){                                 // Block message if valid profanity
            return callback('Profanity is not allowed!')
        }

        // Send the message to all the clients in this room
        io.to(user.room).emit('message', generateMessage(user.username, message))
        
        callback()                                                      // Complete the function
    })

    // When a client leaves the chatroom
    socket.on('disconnect', () =>{
        const user = removeUser(socket.id)                              // Remove a user from the room by ID

        if (user){                                                      // If successfully removed the user
            // Send message to all clients remaining in the room
            io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left.`))

            // Send room data too all remaining clients in the room to update user list
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    // When a client shares location
    socket.on('sendLocation', (coords, callback) =>{
        const {error, user} = getUser(socket.id)                        // Retrieve the user by ID
                
        if (error) { return callback(error) }                           // Catch error and handle

        // Send location message to all clients in the current room
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()                                                      // Complete the function
    })
})

server.listen(port, ()=>{
    console.log('Server is up on port ' + port);
});
