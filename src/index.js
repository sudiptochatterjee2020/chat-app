const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUSer, removeUser, getUser, getUsersInRoom } = require('./utils/users');

// for environment variables
require('dotenv').config();

// bind the express app to the http server
const app = express();
const server = http.createServer(app);

// new instance of socketio created with the http server
// now our server will support web sockets
const io = socketio(server)

// port for heroku or localhost
const port = process.env.PORT || 3000;

// Define paths for Express config
const staticPath = path.join(__dirname, "../public");

// To serve static content
app.use(express.static(staticPath));

const welcomeMsg = 'welcome to the chat room,'
const newConnMsg = 'joined room.'
const disConnMsg = 'left room!'
// print a message to the console when a new web socket connection is established
// this piece of code will execute for every new connection
io.on('connection', (socket) => {
    console.log('New web socket connection')

    // emit custom event counterUpdated to the specific connection
    // commented as now we have room feature
    // socket.emit('message', generateMessage(welcomeMsg))

    // broadcast to all connected clients when a new user connects to chat
    // commented as now we have room feature
    // socket.broadcast.emit('message', generateMessage(newConnMsg))

    // listener for chat room messages coming from the client
    socket.on('join', ({ username, room }, callback) => {

        // add the user
        const { error, user } = addUSer({ id: socket.id, username, room })

        // if there is an error in adding the user we send an acknowledgement back to the client
        if (error) return callback(error)

        // user joins the chat room
        socket.join(user.room)

        // Welcome message to the user
        socket.emit('message', generateMessage('Admin', user.username + ' ' + welcomeMsg + ' ' + user.room + '.'))

        // Broadcast all users of the room of the new user joining
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', user.username + ' ' + newConnMsg))

        // Reload chat room sidebar with the latest list of users
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        // callback without error if all above executes successfully
        callback()
    })

    // broadcast to all connected clients when an user disconnects from chat
    socket.on('disconnect', () => {

        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', user.username + ' ' + disConnMsg))

            // Reload chat room sidebar with the latest list of users
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    // listen to sendMessage event emitted from client
    // Use bad-words filter to block profanity
    // Use event acknowledgement to throw error back to the client if message contains profanity
    socket.on('sendMessage', (clientMessage, callback) => {
        // initialize a bad words filter
        const filter = new Filter()
        // if message contains profanity return error to client
        if (filter.isProfane(clientMessage)) {
            return callback('Profanity is not allowed!')
        }
        // get the user to find the room he is in
        const user = getUser(socket.id)

        // And send the message to all the clients connected to the chat application
        io.to(user.room).emit('message', generateMessage(user.username, clientMessage))
        callback()
    })

    // listen to sendLocation event emitted from client and emit 
    // location to all connected users, if it is shared
    // Event acknowledgement callback is used to return error message to client 
    // if either latitude or longitude is blank
    socket.on('sendLocation', (coords, callback) => {
        lat = coords.latitude
        lon = coords.longitude
        if (lat === '' || lon === '') return callback('Unidentified location')
        // get the user to find the room he is in
        const user = getUser(socket.id)
        // And send a google map string for the exact location of the client
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
});

// start the server on port 3000
server.listen(port, () => {
    console.log(`Server is up on ${port}`)
});