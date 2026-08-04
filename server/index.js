const express = require("express");

const http = require("http");

const { Server } = require("socket.io");


const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});


const PORT = 3000;


app.get("/", (req,res) => {
    res.send("Backend is running like a cheetah.")
});

io.on("connection", (socket) => {
    console.log("Looks like a client connected.");

    socket.emit("welcome", "Welcome to the budget discord!");

  });

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} nicely`);
});