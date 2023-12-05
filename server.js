const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser,userLeave,getRoomUsers} = require('./utils/users.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder
app.use(express.static(path.join(__dirname,'public')));

const botName =  'Chatbox bot';

// when client connects
io.on('connection',socket=>{

    socket.on('joinRoom',({username,room})=>{

        const user = userJoin(socket.id,username,room);

        socket.join(user.room);

        //to welcome the current user
        socket.emit('message',formatMessage(botName,'Welcome to chatbox'));

        //broadcast when a user connects
        //socket.broadcast.emit is used to broadcast to everyone except the client
        socket.broadcast.to(user.room).emit('message',formatMessage(botName,`${user.username} has joined the chat`));

        //send users and room info after someone has connected
        io.to(user.room).emit('roomUsers',{
            room : user.room,
            users : getRoomUsers(user.room)
        });

    });

    //listen for chat message
    socket.on('chatMessage', msg=>{

        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message',formatMessage(user.username,msg));
    });

    //run when client disconnects
    socket.on('disconnect',()=>{
        const user = userLeave(socket.id);
        //io.emit is used to broadcast to everyone
        if(user){
            io.to(user.room).emit('message',formatMessage(botName,`${user.username} has left the chat`));

            //send users and room info after someone has disconnected
            io.to(user.room).emit('roomUsers',{
                room : user.room,
                users : getRoomUsers(user.room)
            });
        }

    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, ()=> console.log(`server is running at port ${PORT}`));