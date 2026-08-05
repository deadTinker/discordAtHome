const express = require("express");

const http = require("http");

const { Server } = require("socket.io");


const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: { 
        origin: [
            "http://localhost:5173",
            "https://cordisk.vercel.app/"
        ],
        methods: ["GET", "POST"]
    }
});


const PORT = process.env.PORT || 3000;

const rooms ={};

const socketToRoom = {};


app.get("/", (req,res) => {
    res.send("Backend is running like a cheetah.")
});



io.on("connection", (socket) => {
    console.log("Looks like a client connected.");

    socket.emit("welcome", "Welcome to the budget discord!");


// Join Room Handler
    socket.on("join-room", (roomId) => {

        socket.join(roomId);

        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }

        const existingUser = rooms[roomId].find(
            (user) => user.socketId === socket.id
        );

        if (!existingUser){

            rooms[roomId].push({
                socketId: socket.id,
                username: "Guest",
                mic: true,
                camera: false,
                screenShare: false,
            });
            
            socketToRoom[socket.id] = roomId;


            // Notifying everyone else
            socket.to(roomId).emit("user-joined", {
            participant: rooms[roomId].find(
                (user) => user.socketId === socket.id
            ),
        });

        }
        
        console.log(rooms);

// Sending the complete room state only to the new client when it joins/connects
        socket.emit("room-state", {
            participants: rooms[roomId],
        });



        console.log("Emitting user-joined for", socket.id);

        
        


        
    });



    socket.on("toggle-mic", () => {

        const roomId = socketToRoom[socket.id];

        if (!roomId) return;

        const participant = rooms[roomId].find(
            (user) => user.socketId === socket.id
        );

        if (!participant) return;

        participant.mic = !participant.mic;
        console.log(participant);

        io.to(roomId).emit("mic-changed", {
            socketId: participant.socketId,
            mic: participant.mic,
        });

    });



    socket.on("offer", ({ roomId, offer }) => {

        console.log("Offer recieved");

        socket.to(roomId).emit("offer", {
            
            offer,

        });
    });



    socket.on("answer", ({ roomId, answer}) => {

        console.log("Answer recieved");

        socket.to(roomId).emit("answer", {

            answer,

        });
    });



    socket.on("ice-candidate", ({ roomId, candidate}) => {
        
        socket.to(roomId).emit("ice-candidate", {
            candidate,
        });

    });




// Disconnect Handler
    
    socket.on("disconnect", () => {

        console.log("Disconnecting:", socket.id);
        console.log("Before:", rooms);

        const roomId = socketToRoom[socket.id];

        if (!roomId) return;

        // Remove socket from the room
            rooms[roomId] = rooms[roomId].filter(
                (user) => user.socketId !== socket.id
            );
            console.log("After:", rooms);

            console.log("Emitting user-left");

            socket.to(roomId).emit("user-left", {
                socketId: socket.id,
            });

            
            


        // Remove lookup entry
            delete socketToRoom[socket.id];

        // Delete room if empty
            if (rooms[roomId].length === 0) {
                delete rooms[roomId];
            }
            
        
        console.log("Current rooms:", rooms);

    });


  });

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} nicely`);
});