const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage,generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express();
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public');


// Setup static directory to server
app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log('New Websocket connection')

    socket.on('join', ( options, callback ) => {
        const { error ,user } = addUser({ id: socket.id, ...options })
        
        if (error) {
            return callback(error)
        }
               
        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined.`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback)=>{
        const {error, user} = getUser(socket.id)
        
        if (error) {
            return callback(error)
        }

        const filter = new Filter()
        
        if (filter.isProfane(message)){
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('disconnect', () =>{
        const user = removeUser(socket.id)

        if (user){
            io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left.`))

            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation', (coords, callback) =>{
        const {error, user} = getUser(socket.id)
                
        if (error) {
            return callback(error)
        }

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
})



server.listen(port, ()=>{
    console.log('Server is up on port ' + port);
});